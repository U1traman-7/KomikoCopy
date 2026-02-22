#!/usr/bin/env node
/**
 * 批量翻译标签description到 i18n 列
 * 用法: node scripts/db-character-i18n/translate-tags-i18n.cjs [limit] [offset]
 * 示例: node scripts/db-character-i18n/translate-tags-i18n.cjs --has-description
 */

// 加载环境变量（优先 .env.local，回退到 .env）
const path = require('path');
const fs = require('fs');
const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  require('dotenv').config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  console.warn('⚠️  未找到 .env 或 .env.local 文件，使用默认配置');
}

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Gemini 配置
const geminiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiKey);

const generationConfig = {
  temperature: 0.3,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 500,
  responseMimeType: 'text/plain',
  thinkingConfig: { thinkingBudget: 0 },
};

// 使用 gemini-3-pro-preview (更高配额)
const model = genAI.getGenerativeModel({
  model: 'gemini-3-pro-preview',
  generationConfig,
});

// 支持的语言
const TARGET_LANGUAGES = [
  'zh-CN',
  'zh-TW',
  'ja',
  'ko',
  'de',
  'fr',
  'es',
  'pt',
  'ru',
  'hi',
  'id',
  'th',
  'vi',
];

const LANGUAGE_NAMES = {
  'zh-CN': 'Chinese Simplified',
  'zh-TW': 'Chinese Traditional',
  ja: 'Japanese',
  ko: 'Korean',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  pt: 'Portuguese',
  ru: 'Russian',
  hi: 'Hindi',
  id: 'Indonesian',
  th: 'Thai',
  vi: 'Vietnamese',
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 速率限制配置
const DELAY_BETWEEN_REQUESTS = 100; // 每次请求间隔 100ms（避免速率限制）
const MAX_RETRIES = 3; // 最大重试次数
const CONCURRENT_TRANSLATIONS = 4; // 同时翻译的语言数量（并行处理）

/**
 * 检测文本语言（带重试）
 */
async function detectLanguage(text, retryCount = 0) {
  const prompt = `Detect the language of the following text and return ONLY the ISO 639-1 language code (e.g., "en", "zh", "ja", "ko", "de", "fr", "es", "pt", "ru", "hi", "id", "th", "vi").

Important rules:
1. Return ONLY the language code, nothing else
2. For Chinese, return "zh" (we'll handle variants separately)
3. If unsure, return "en"

Text: """${text}"""`;

  try {
    const result = await model.generateContent(prompt);
    let langCode = result.response.text().trim().toLowerCase();

    // 处理中文变体
    if (langCode === 'zh' || langCode === 'zh-cn' || langCode === 'zh-tw') {
      const hasTraditional = /[繁體臺灣]/u.test(text);
      langCode = hasTraditional ? 'zh-TW' : 'zh-CN';
    }

    // 验证语言代码
    const validCodes = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'de', 'fr', 'es', 'pt', 'ru', 'hi', 'id', 'th', 'vi'];
    if (!validCodes.includes(langCode)) {
      console.warn(`  ⚠️  未识别的语言代码: ${langCode}，默认使用 en`);
      return 'en';
    }

    return langCode;
  } catch (error) {
    if (error.message.includes('429') || error.message.includes('quota')) {
      if (retryCount < MAX_RETRIES) {
        const waitTime = 60 * 1000;
        console.log(`  ⏳ 触发速率限制，等待 ${waitTime / 1000} 秒后重试 (${retryCount + 1}/${MAX_RETRIES})...`);
        await delay(waitTime);
        return detectLanguage(text, retryCount + 1);
      }
    }
    console.error(`  ❌ 语言检测失败:`, error.message);
    return 'en';
  }
}

/**
 * 清理翻译输出
 */
function cleanTranslationOutput(text) {
  // 移除开头和结尾的引号和代码块标记
  let cleaned = text.replace(/^[\s"""'''"`*\-_]+/, '').replace(/[\s"""'''"`*\-_]+$/, '');
  
  // 移除 Markdown 代码块标记
  cleaned = cleaned.replace(/^```[\w]*\n/, '').replace(/\n```$/, '');
  
  // 处理多余的 * 符号导致的格式问题
  // 但保留列表中的 * （前面有换行符）
  cleaned = cleaned.replace(/\*([^\n*])/g, (match, char) => {
    // 如果前面不是换行符，移除这个 *
    return char;
  });
  
  return cleaned.trim();
}

/**
 * 翻译文本（带重试）
 */
async function translateText(text, targetLang, context, retryCount = 0) {
  const contextPrompts = {
    name: '这是一个标签/主题的名称。简短的词或短语。如果有官方翻译请使用官方翻译，否则根据目标语言习惯进行翻译。',
    description: '这是一个标签/主题的描述。可能包含多行或列表。保持翻译自然生动，保留原始的换行和列表结构。',
  };

  const translationPrompt = `将以下文本翻译为 ${LANGUAGE_NAMES[targetLang]}。
${contextPrompts[context]}

重要规则：
1. 保持原文的语气和风格
2. 网站名'KomiKo'不需要翻译
3. 保留所有换行符和列表符号（如 * 和数字编号）
4. 保留专有名词的原始形式（URL、数字、特殊词汇等）
5. 对于专业术语，使用目标语言中常用的翻译
6. 保持翻译简洁自然
7. 不要添加任何 Markdown 格式、代码块标记或额外符号
8. 只返回翻译后的文本，不要其他任何内容

原文："""${text}"""`;

  try {
    // 第一步：初始翻译
    const translationResult = await model.generateContent(translationPrompt);
    let translatedText = cleanTranslationOutput(translationResult.response.text());

    // 第二步：润色翻译，使其更符合母语者的口语标准
    const polishPrompt = `打磨如下的文本，使其更符合母语为${LANGUAGE_NAMES[targetLang]}的人的自然口语。保留所有换行符和列表结构。
文本内容："""${translatedText}"""

打磨要求：
1. 保持原意不变，保留所有换行和列表符号
2. 使表达更自然、更符合当地文化习惯
3. 避免生硬的逐字翻译感
4. 对于专有名词和 URL 保持原样
5. 确保语言简洁自然
6. 不要添加任何格式符号或额外内容
7. 只返回打磨后的文本，不要其他任何内容`;

    const polishResult = await model.generateContent(polishPrompt);
    let polishedText = cleanTranslationOutput(polishResult.response.text());

    return polishedText;
  } catch (error) {
    if (error.message.includes('429') || error.message.includes('quota')) {
      if (retryCount < MAX_RETRIES) {
        const waitTime = 60 * 1000;
        console.log(`  ⏳ 触发速率限制，等待 ${waitTime / 1000} 秒后重试 (${retryCount + 1}/${MAX_RETRIES})...`);
        await delay(waitTime);
        return translateText(text, targetLang, context, retryCount + 1);
      }
    }
    console.error(`  ❌ 翻译失败 (${targetLang}):`, error.message);
    return text;
  }
}

/**
 * 翻译单个字段到所有语言
 */
async function translateField(text, context, existingTranslations = {}, languages = TARGET_LANGUAGES) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return null;
  }

  // 检测原文语言
  let sourceLang = null;

  if (Object.keys(existingTranslations).length > 0) {
    sourceLang = Object.keys(existingTranslations)[0];
  } else {
    console.log(`    检测语言...`);
    sourceLang = await detectLanguage(text);
    console.log(`    检测结果: ${sourceLang} (${LANGUAGE_NAMES[sourceLang] || sourceLang})`);
    await delay(50);
  }

  // 初始化翻译对象，包含原文
  const translations = { [sourceLang]: text, ...existingTranslations };

  // 找出缺失的语言（排除原文语言）
  const missingLanguages = languages.filter(lang => lang !== sourceLang && !translations[lang]);

  if (missingLanguages.length === 0) {
    console.log(`    ✓ 已有完整翻译`);
    return translations;
  }

  console.log(`    翻译中 (${missingLanguages.length} 种语言，并行处理${CONCURRENT_TRANSLATIONS}个)...`);

  // 并行翻译缺失的语言（分批处理以避免速率限制）
  for (let i = 0; i < missingLanguages.length; i += CONCURRENT_TRANSLATIONS) {
    const batch = missingLanguages.slice(i, i + CONCURRENT_TRANSLATIONS);
    const promises = batch.map(lang => 
      translateText(text, lang, context).then(result => ({ lang, result }))
    );

    const results = await Promise.all(promises);
    results.forEach(({ lang, result }) => {
      translations[lang] = result;
    });

    // 批次之间延迟
    if (i + CONCURRENT_TRANSLATIONS < missingLanguages.length) {
      await delay(DELAY_BETWEEN_REQUESTS);
    }
  }

  return translations;
}

/**
 * 翻译单个标签
 */
async function translateTag(tag) {
  console.log(`\n翻译标签: ${tag.name} (ID: ${tag.id})`);

  // 初始化 i18n 对象
  const i18n = tag.i18n || {};

  // 翻译各个字段
  const fields = ['name', 'description'];

  for (const field of fields) {
    const originalValue = tag[field];

    if (!originalValue || typeof originalValue !== 'string' || originalValue.trim() === '') {
      console.log(`  - ${field}: 跳过（空值）`);
      continue;
    }

    // 检查是否已有翻译
    const existingTranslations = i18n[field] || {};

    console.log(`  - ${field}:`);
    const translated = await translateField(
      originalValue,
      field,
      existingTranslations,
      TARGET_LANGUAGES
    );

    if (translated) {
      i18n[field] = translated;
    }
  }

  return i18n;
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('批量翻译标签描述到 i18n 列');
  console.log('========================================\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 解析命令行参数
  const args = process.argv.slice(2);
  let tagName = null;
  let hasDescriptionOnly = false;
  let limit = 1000; // 默认翻译前 1000 个
  let offset = 0;
  let tableName = 'tags';

  // 检查是否指定了各种参数
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--name=')) {
      tagName = args[i].substring(7);
    } else if (args[i] === '--has-description') {
      hasDescriptionOnly = true;
    } else if (args[i].startsWith('--limit=')) {
      limit = parseInt(args[i].substring(8));
    } else if (i === 0 && !args[i].startsWith('--')) {
      limit = parseInt(args[i]) || null;
    } else if (i === 1 && !args[i].startsWith('--')) {
      offset = parseInt(args[i]) || 0;
    } else if (i === 2 && !args[i].startsWith('--')) {
      tableName = args[i];
    }
  }

  console.log(`配置:`);
  console.log(`  - 表名: ${tableName}`);

  let query = supabase.from(tableName).select('*');

  // 如果指定了 tagName，只翻译该标签
  if (tagName) {
    console.log(`  - 翻译标签: ${tagName}\n`);
    query = query.eq('name', tagName);
  } else if (hasDescriptionOnly) {
    console.log(`  - 翻译条件: 有 description（非空）`);
    if (limit) {
      console.log(`  - 翻译数量限制: ${limit} 条（按 popularity 排序）`);
      console.log(`  - 起始位置: 第 ${offset} 条\n`);
      query = query.not('description', 'is', null).range(offset, offset + limit - 1).order('popularity', { ascending: false });
    } else {
      console.log(`  - 翻译数量: 全部（无限制）\n`);
      query = query.not('description', 'is', null).order('popularity', { ascending: false });
    }
  } else {
    if (limit) {
      console.log(`  - 翻译数量限制: ${limit} 条（按 popularity 排序）`);
      console.log(`  - 起始位置: 第 ${offset} 条\n`);
      query = query.range(offset, offset + limit - 1).order('popularity', { ascending: false });
    } else {
      console.log(`  - 翻译数量: 全部（无限制）\n`);
      query = query.order('popularity', { ascending: false });
    }
  }

  // 获取数据
  console.log('正在读取数据...');
  const { data: tags, error } = await query;

  if (error) {
    console.error('❌ 读取数据失败:', error);
    process.exit(1);
  }

  if (!tags || tags.length === 0) {
    console.log('⚠️  没有找到数据');
    if (tagName) {
      console.log(`提示: 请检查标签名称 "${tagName}" 是否正确`);
    }
    process.exit(0);
  }

  console.log(`✓ 找到 ${tags.length} 条数据\n`);

  // 翻译每个标签
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    console.log(`[${i + 1}/${tags.length}]`);

    // 检查是否所有字段都已有完整翻译（包括 name 和 description）
    const allFields = ['name', 'description'];
    const hasCompleteTranslation = tag.i18n && allFields.every(field => {
      const fieldTranslations = tag.i18n[field];
      return fieldTranslations && Object.keys(fieldTranslations).length >= TARGET_LANGUAGES.length;
    });

    if (hasCompleteTranslation) {
      console.log(`  ⏭️  已有完整翻译，跳过`);
      skippedCount++;
      continue;
    }

    try {
      const i18n = await translateTag(tag);

      // 更新数据库
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ i18n })
        .eq('id', tag.id);

      if (updateError) {
        console.error('  ❌ 更新失败:', updateError.message);
        failCount++;
      } else {
        console.log('  ✓ 更新成功');
        successCount++;
      }
    } catch (error) {
      console.error('  ❌ 翻译失败:', error.message);
      failCount++;
    }

    // 延迟（标签之间）
    if (i < tags.length - 1) {
      await delay(300); // 标签之间延迟 300ms
    }
  }

  console.log('\n========================================');
  console.log('翻译完成！');
  console.log(`成功: ${successCount} 条`);
  console.log(`跳过: ${skippedCount} 条`);
  console.log(`失败: ${failCount} 条`);
  console.log('========================================');
}

// 运行
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { detectLanguage, translateText, translateField, translateTag };
