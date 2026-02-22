#!/usr/bin/env node
/**
 * 批量翻译角色名称到 i18n 列
 * 专门用于翻译 character_name 字段，优先查找官方翻译
 *
 * 用法: node scripts/db-character-i18n/translate-names-only.cjs [options]
 *
 * 参数:
 *   --id=<uniqid>             翻译指定角色
 *   --is-official             只翻译官方角色
 *   --needs-translation       只翻译 forceTranslate 为 false 的记录（需要重新翻译的）
 *   --limit=<n>               限制翻译数量
 *   --offset=<n>              起始位置偏移
 *   --dry-run                 仅预览，不更新数据库
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
  temperature: 0.1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 100,
  responseMimeType: 'text/plain',
  thinkingConfig: { thinkingBudget: 0 },
};

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

/**
 * 文字系统验证规则
 * 每种语言应该使用的文字系统
 */
const SCRIPT_VALIDATORS = {
  // 中文必须包含汉字
  'zh-CN': {
    name: '简体中文',
    validate: (text) => /[\u4e00-\u9fff]/.test(text),
    forbidden: null,
    description: '必须包含汉字',
  },
  'zh-TW': {
    name: '繁体中文',
    validate: (text) => /[\u4e00-\u9fff]/.test(text),
    forbidden: null,
    description: '必须包含汉字',
  },
  // 日语可以用汉字、平假名、片假名
  ja: {
    name: '日语',
    validate: (text) => /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(text),
    forbidden: null,
    description: '必须包含日文字符（汉字/假名）',
  },
  // 韩语必须包含韩文
  ko: {
    name: '韩语',
    validate: (text) => /[\uac00-\ud7af\u1100-\u11ff]/.test(text),
    forbidden: null,
    description: '必须包含韩文',
  },
  // 俄语必须包含西里尔字母
  ru: {
    name: '俄语',
    validate: (text) => /[\u0400-\u04ff]/.test(text),
    forbidden: /[\u4e00-\u9fff]/,  // 不能包含汉字
    description: '必须包含西里尔字母',
  },
  // 泰语必须包含泰文
  th: {
    name: '泰语',
    validate: (text) => /[\u0e00-\u0e7f]/.test(text),
    forbidden: /[\u4e00-\u9fff]/,  // 不能包含汉字
    description: '必须包含泰文',
  },
  // 印地语必须包含天城文
  hi: {
    name: '印地语',
    validate: (text) => /[\u0900-\u097f]/.test(text),
    forbidden: /[\u4e00-\u9fff]/,  // 不能包含汉字
    description: '必须包含天城文',
  },
  // 越南语使用拉丁字母（可能有变音符号），不能包含汉字
  vi: {
    name: '越南语',
    validate: (text) => /[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/.test(text),
    forbidden: /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/,  // 不能包含汉字或日文假名
    description: '必须使用拉丁字母，不能包含汉字',
  },
  // 印尼语使用拉丁字母
  id: {
    name: '印尼语',
    validate: (text) => /[a-zA-Z]/.test(text),
    forbidden: /[\u4e00-\u9fff]/,  // 不能包含汉字
    description: '必须使用拉丁字母',
  },
  // 西欧语言使用拉丁字母
  de: {
    name: '德语',
    validate: (text) => /[a-zA-ZäöüßÄÖÜ]/.test(text),
    forbidden: /[\u4e00-\u9fff]/,
    description: '必须使用拉丁字母',
  },
  fr: {
    name: '法语',
    validate: (text) => /[a-zA-Zàâäçéèêëïîôùûüÿœæ]/.test(text),
    forbidden: /[\u4e00-\u9fff]/,
    description: '必须使用拉丁字母',
  },
  es: {
    name: '西班牙语',
    validate: (text) => /[a-zA-Záéíóúüñ¿¡]/.test(text),
    forbidden: /[\u4e00-\u9fff]/,
    description: '必须使用拉丁字母',
  },
  pt: {
    name: '葡萄牙语',
    validate: (text) => /[a-zA-Záàâãéêíóôõúç]/.test(text),
    forbidden: /[\u4e00-\u9fff]/,
    description: '必须使用拉丁字母',
  },
};

/**
 * 验证翻译结果的文字系统是否正确
 */
function validateScript(text, lang) {
  const validator = SCRIPT_VALIDATORS[lang];
  if (!validator) return { valid: true };

  // 检查是否包含禁止的字符
  if (validator.forbidden && validator.forbidden.test(text)) {
    return {
      valid: false,
      reason: `包含了不应该出现的字符（${validator.description}）`,
    };
  }

  // 检查是否包含必须的字符（对于非拉丁语言）
  if (!validator.validate(text)) {
    return {
      valid: false,
      reason: validator.description,
    };
  }

  return { valid: true };
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 速率限制配置
const DELAY_BETWEEN_REQUESTS = 100;
const MAX_RETRIES = 3;
const CONCURRENT_TRANSLATIONS = 4;

/**
 * 检测文本语言
 */
async function detectLanguage(text, retryCount = 0) {
  const prompt = `Detect the language of this text and return ONLY the ISO 639-1 code (en, zh, ja, ko, de, fr, es, pt, ru, hi, id, th, vi).

Text: "${text}"`;

  try {
    const result = await model.generateContent(prompt);
    let langCode = result.response.text().trim().toLowerCase();

    // 处理中文变体
    if (langCode === 'zh' || langCode === 'zh-cn' || langCode === 'zh-tw') {
      const hasTraditional = /[繁體臺灣]/.test(text);
      langCode = hasTraditional ? 'zh-TW' : 'zh-CN';
    }

    const validCodes = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'de', 'fr', 'es', 'pt', 'ru', 'hi', 'id', 'th', 'vi'];
    if (!validCodes.includes(langCode)) {
      return 'en';
    }

    return langCode;
  } catch (error) {
    if (error.message.includes('429') || error.message.includes('quota')) {
      if (retryCount < MAX_RETRIES) {
        const waitTime = 60 * 1000;
        console.log(`  ⏳ 速率限制，等待 ${waitTime / 1000} 秒后重试...`);
        await delay(waitTime);
        return detectLanguage(text, retryCount + 1);
      }
    }
    console.error(`  ❌ 语言检测失败:`, error.message);
    return 'en';
  }
}

/**
 * 清理翻译结果
 */
function cleanTranslationOutput(text, originalText = '') {
  if (!text || typeof text !== 'string') {
    return originalText;
  }

  let cleaned = text
    .replace(/^[\s"""'''"`\n]+/, '')
    .replace(/[\s"""'''"`\n]+$/, '')
    .trim();

  // 移除 Markdown 标记
  cleaned = cleaned.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');

  // 只取第一行（名字不应该有多行）
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 0) {
    cleaned = lines[0];
  }

  // 移除列表标记
  cleaned = cleaned.replace(/^[\*\-•\d]+[\.\)]\s*/, '').trim();

  // 移除括号内的说明
  cleaned = cleaned.replace(/\s*[\(（][^)）]*[\)）]\s*/g, '').trim();

  // 移除冒号前缀（如 "Translation: xxx"）
  cleaned = cleaned.replace(/^[^:：]+[:：]\s*/, '').trim();

  if (!cleaned || cleaned.length < 1) {
    return originalText;
  }

  return cleaned;
}

/**
 * 翻译角色名称到指定语言
 * 使用 category 和 intro 作为上下文查找官方翻译
 */
async function translateName(name, targetLang, category, intro, retryCount = 0) {
  // 获取文字系统的要求描述
  const scriptValidator = SCRIPT_VALIDATORS[targetLang];
  const scriptRequirement = scriptValidator
    ? `\nIMPORTANT: The result MUST be written in ${scriptValidator.name} script. ${scriptValidator.description}.`
    : '';

  // 针对特定语言的额外说明
  let langSpecificNote = '';
  if (targetLang === 'vi') {
    langSpecificNote = '\nVietnamese uses Latin alphabet with diacritics (e.g., Hồ Đào), NOT Chinese characters!';
  } else if (targetLang === 'zh-CN' || targetLang === 'zh-TW') {
    langSpecificNote = '\nChinese names MUST use Chinese characters (汉字), NOT romanization/pinyin!';
  } else if (targetLang === 'th') {
    langSpecificNote = '\nThai uses Thai script (e.g., ฮูเถา), NOT Chinese characters!';
  }

  // 构建上下文信息（优先使用英文）
  let contextInfo = '';
  if (category) {
    contextInfo += `Series/Game: ${category}\n`;
  }
  if (intro) {
    const shortIntro = intro.length > 300 ? intro.substring(0, 300) + '...' : intro;
    contextInfo += `Character description: ${shortIntro}\n`;
  }

  const prompt = `Translate this CHARACTER NAME to ${LANGUAGE_NAMES[targetLang]}.

${contextInfo}
CHARACTER NAME TO TRANSLATE: "${name}"
${scriptRequirement}${langSpecificNote}

CRITICAL RULES:
1. Translate "${name}" - this EXACT character, not another character from the same series!
2. Find the OFFICIAL ${LANGUAGE_NAMES[targetLang]} localized name for "${name}" specifically
3. If "${name}" is from ${category || 'anime/game'}, find how "${name}" is officially called in the ${LANGUAGE_NAMES[targetLang]} version
4. For Chinese: use 汉字, NOT pinyin/romanization
5. For Vietnamese/Thai/Indonesian: use native script, NOT Chinese characters
6. Output ONLY the translated name - no quotes, no explanations, no other characters

Example: If translating "Hu Tao" from Genshin Impact to Chinese, output "胡桃" (NOT another character like 甘雨)

${LANGUAGE_NAMES[targetLang]} name for "${name}":`;

  try {
    const result = await model.generateContent(prompt);
    let translatedText = cleanTranslationOutput(result.response.text(), name);

    // 验证文字系统
    const validation = validateScript(translatedText, targetLang);
    if (!validation.valid) {
      console.warn(`    ⚠️  ${targetLang} 文字系统错误: ${validation.reason}`);

      if (retryCount < 2) {
        console.log(`    🔄 重试翻译 ${targetLang}...`);
        await delay(300);

        // 用更强制的提示重试（带上下文）
        const retryPrompt = `Translate the name "${name}" to ${LANGUAGE_NAMES[targetLang]}.
This is a character from "${category || 'anime/game'}".
${intro ? `About this character: ${intro.substring(0, 150)}` : ''}

IMPORTANT: Translate "${name}" specifically - do NOT output a different character's name!

CRITICAL: Output MUST be in ${LANGUAGE_NAMES[targetLang]} script!
${targetLang === 'zh-CN' || targetLang === 'zh-TW' ? '- Chinese: Use 汉字, NOT pinyin/romanization' : ''}
${targetLang === 'vi' ? '- Vietnamese: Use Latin alphabet with diacritics, NOT Chinese characters' : ''}
${targetLang === 'th' ? '- Thai: Use Thai script, NOT Chinese characters' : ''}
${targetLang === 'ko' ? '- Korean: Use Hangul, NOT Chinese characters' : ''}

"${name}" in ${LANGUAGE_NAMES[targetLang]}:`;

        const retryResult = await model.generateContent(retryPrompt);
        translatedText = cleanTranslationOutput(retryResult.response.text(), name);

        // 再次验证
        const retryValidation = validateScript(translatedText, targetLang);
        if (!retryValidation.valid) {
          console.warn(`    ❌ ${targetLang} 重试后仍然错误，保留原名`);
          return name;
        }
      } else {
        return name;
      }
    }

    // 验证结果不包含原提示词内容
    const lowerResult = translatedText.toLowerCase();
    const invalidPhrases = [
      'translated name', 'translation', 'official', 'character', 'from', 'about',
      'critical', 'instructions', 'target language', 'alternatively', 'option',
      'note:', 'transliterat', 'here is', 'the name', 'answer:'
    ];

    for (const phrase of invalidPhrases) {
      if (lowerResult.includes(phrase)) {
        console.warn(`    ⚠️  结果包含无效内容 "${phrase}"，使用原名`);
        return name;
      }
    }

    return translatedText;
  } catch (error) {
    if (error.message.includes('429') || error.message.includes('quota')) {
      if (retryCount < MAX_RETRIES) {
        const waitTime = 60 * 1000;
        console.log(`  ⏳ 速率限制，等待 ${waitTime / 1000} 秒后重试...`);
        await delay(waitTime);
        return translateName(name, targetLang, category, intro, retryCount + 1);
      }
    }
    console.error(`  ❌ 翻译失败 (${targetLang}):`, error.message);
    return name;
  }
}

/**
 * 翻译角色名称到所有语言
 */
async function translateCharacterName(character) {
  const { character_name, category, intro, i18n } = character;

  // 优先使用英文版的 intro 作为上下文（更有助于 AI 理解角色）
  // 依次尝试: i18n.intro.en > i18n.intro (任意英文) > 原始 intro
  let englishIntro = '';
  if (i18n?.intro) {
    if (typeof i18n.intro === 'string') {
      englishIntro = i18n.intro;
    } else if (i18n.intro.en) {
      englishIntro = i18n.intro.en;
    } else {
      // 尝试找任何看起来像英文的 intro
      for (const [lang, text] of Object.entries(i18n.intro)) {
        if (typeof text === 'string' && /^[a-zA-Z\s.,!?'"()-]+/.test(text.substring(0, 50))) {
          englishIntro = text;
          break;
        }
      }
    }
  }
  // 如果没有英文 intro，检查原始 intro 是否是英文
  if (!englishIntro && intro) {
    const isEnglish = /^[a-zA-Z\s.,!?'"()-]+/.test(intro.substring(0, 50));
    if (isEnglish) {
      englishIntro = intro;
    }
  }

  // 同样优先获取英文版的 category
  let englishCategory = category;
  if (i18n?.category) {
    if (typeof i18n.category === 'string') {
      englishCategory = i18n.category;
    } else if (i18n.category.en) {
      englishCategory = i18n.category.en;
    }
  }

  console.log(`\n翻译角色名: ${character_name}`);
  if (englishCategory) console.log(`  来源: ${englishCategory}`);
  if (englishIntro) console.log(`  英文简介: ${englishIntro.substring(0, 80)}...`);

  // 检测原文语言
  console.log(`  检测语言...`);
  const sourceLang = await detectLanguage(character_name);
  console.log(`  原文语言: ${sourceLang} (${LANGUAGE_NAMES[sourceLang] || sourceLang})`);
  await delay(50);

  // 初始化翻译对象
  const translations = { [sourceLang]: character_name };

  // 翻译到所有目标语言
  const languagesToTranslate = TARGET_LANGUAGES.filter(lang => lang !== sourceLang);

  console.log(`  翻译中 (${languagesToTranslate.length} 种语言)...`);

  // 并行翻译（分批处理）- 使用英文上下文
  for (let i = 0; i < languagesToTranslate.length; i += CONCURRENT_TRANSLATIONS) {
    const batch = languagesToTranslate.slice(i, i + CONCURRENT_TRANSLATIONS);
    const promises = batch.map(lang =>
      translateName(character_name, lang, englishCategory, englishIntro).then(result => ({ lang, result }))
    );

    const results = await Promise.all(promises);
    results.forEach(({ lang, result }) => {
      translations[lang] = result;
      // 显示验证状态
      const validation = validateScript(result, lang);
      const status = validation.valid ? '✓' : '⚠️';
      console.log(`    ${status} ${lang}: ${result}`);
    });

    if (i + CONCURRENT_TRANSLATIONS < languagesToTranslate.length) {
      await delay(DELAY_BETWEEN_REQUESTS);
    }
  }

  return translations;
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('角色名称翻译脚本');
  console.log('（优先查找官方翻译 + 文字系统验证）');
  console.log('========================================\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 解析命令行参数
  const args = process.argv.slice(2);
  let characterUniqid = null;
  let isOfficialOnly = false;
  let needsTranslation = false;
  let limit = null;
  let offset = 0;
  let dryRun = false;
  const tableName = 'CustomCharacters';

  for (const arg of args) {
    if (arg.startsWith('--id=')) {
      characterUniqid = arg.substring(5);
    } else if (arg === '--is-official') {
      isOfficialOnly = true;
    } else if (arg === '--needs-translation') {
      needsTranslation = true;
    } else if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.substring(8));
    } else if (arg.startsWith('--offset=')) {
      offset = parseInt(arg.substring(9));
    } else if (arg === '--dry-run') {
      dryRun = true;
    }
  }

  console.log(`配置:`);
  console.log(`  - 表名: ${tableName}`);
  if (characterUniqid) {
    console.log(`  - 指定角色: ${characterUniqid}`);
  }
  if (isOfficialOnly) {
    console.log(`  - 仅官方角色: 是`);
  }
  if (needsTranslation) {
    console.log(`  - 仅需重新翻译: 是 (forceTranslate = false)`);
  }
  if (limit) {
    console.log(`  - 数量限制: ${limit}`);
    console.log(`  - 起始位置: ${offset}`);
  }
  if (dryRun) {
    console.log(`  - 预览模式: 是（不更新数据库）`);
  }
  console.log('');

  // 构建查询
  let query = supabase
    .from(tableName)
    .select('id, character_uniqid, character_name, category, intro, i18n');

  if (characterUniqid) {
    query = query.eq('character_uniqid', characterUniqid);
  } else {
    if (isOfficialOnly) {
      query = query.eq('is_official', true);
    }
    // 数据库级别筛选 forceTranslate = false（需要重新翻译的记录）
    if (needsTranslation) {
      query = query.eq('i18n->forceTranslate', false);
    }
    query = query.order('num_gen', { ascending: false });
    if (limit) {
      query = query.range(offset, offset + limit - 1);
    }
  }

  // 获取数据
  console.log('正在读取数据...');
  const { data: characters, error } = await query;

  if (error) {
    console.error('❌ 读取数据失败:', error);
    process.exit(1);
  }

  if (!characters || characters.length === 0) {
    console.log('⚠️  没有找到数据');
    process.exit(0);
  }

  console.log(`✓ 找到 ${characters.length} 条数据\n`);

  // 翻译每个角色
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < characters.length; i++) {
    const character = characters[i];
    console.log(`[${i + 1}/${characters.length}] ${character.character_name} (${character.character_uniqid})`);

    try {
      // 翻译名称
      const nameTranslations = await translateCharacterName(character);

      // 合并到现有的 i18n 对象
      const existingI18n = character.i18n || {};
      const updatedI18n = {
        ...existingI18n,
        character_name: nameTranslations,
        forceTranslate: true,  // 标记为已翻译完成
        nameUpdatedAt: new Date().toISOString(),
      };

      if (dryRun) {
        console.log('  📋 [预览] 将更新为:');
        console.log(`     character_name: ${JSON.stringify(nameTranslations, null, 2).split('\n').join('\n     ')}`);
        console.log('  ⏭️  跳过更新（预览模式）');
        successCount++;
      } else {
        // 更新数据库
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ i18n: updatedI18n })
          .eq('id', character.id);

        if (updateError) {
          console.error('  ❌ 更新失败:', updateError.message);
          failCount++;
        } else {
          console.log('  ✓ 更新成功 (forceTranslate: true)');
          successCount++;
        }
      }
    } catch (error) {
      console.error('  ❌ 翻译失败:', error.message);
      failCount++;
    }

    // 角色之间延迟
    if (i < characters.length - 1) {
      await delay(300);
    }
  }

  console.log('\n========================================');
  console.log('翻译完成！');
  console.log(`成功: ${successCount} 条`);
  console.log(`失败: ${failCount} 条`);
  if (dryRun) {
    console.log('（预览模式，未实际更新数据库）');
  }
  console.log('========================================');
}

// 运行
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { translateName, translateCharacterName, validateScript };
