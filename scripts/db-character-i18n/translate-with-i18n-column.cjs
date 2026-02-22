#!/usr/bin/env node
/**
 * 批量翻译角色数据到 i18n 列（ChatGPT + Web Search 版本）
 *
 * 流程：
 * 1. 先通过 Web Search 搜索角色信息，获取官方名称和上下文
 * 2. 使用 ChatGPT 批量翻译各字段到所有目标语言（一次 API 调用翻译全部语言）
 *
 * 用法: node scripts/db-character-i18n/translate-with-i18n-column.cjs [options]
 *
 * 参数:
 *   --id=<uniqid>       翻译指定角色
 *   --is-official       只翻译官方角色
 *   --skip-translated   跳过已有 forceTranslate 的记录
 *   --limit=<n>         限制翻译数量
 *   [limit] [offset]    位置参数方式指定限制和偏移
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
const OpenAI = require('openai');

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// OpenAI 配置
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const CHAT_MODEL = 'gpt-4o-mini';
const SEARCH_MODEL = 'gpt-4o-mini';

// 支持的目标语言（英文为原文，不需要翻译）
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
  en: 'English',
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
 * 官方 Category 译名映射
 */
const CATEGORY_OFFICIAL_TRANSLATIONS = {
  'Genshin Impact': {
    'zh-CN': '原神',
    'zh-TW': '原神',
    ja: '原神',
    ko: '원신',
  },
  'Honkai: Star Rail': {
    'zh-CN': '崩坏：星穹铁道',
    'zh-TW': '崩壞：星穹鐵道',
    ja: '崩壊：スターレイル',
    ko: '붕괴: 스타레일',
  },
  'Honkai Impact 3rd': {
    'zh-CN': '崩坏3',
    'zh-TW': '崩壞3rd',
    ja: '崩壊3rd',
    ko: '붕괴3rd',
  },
  'Zenless Zone Zero': {
    'zh-CN': '绝区零',
    'zh-TW': '絕區零',
    ja: 'ゼンレスゾーンゼロ',
    ko: '젠레스 존 제로',
  },
  Arknights: {
    'zh-CN': '明日方舟',
    'zh-TW': '明日方舟',
    ja: 'アークナイツ',
    ko: '명일방주',
  },
  'Blue Archive': {
    'zh-CN': '蔚蓝档案',
    'zh-TW': '蔚藍檔案',
    ja: 'ブルーアーカイブ',
    ko: '블루 아카이브',
  },
  'Fate/Grand Order': {
    'zh-CN': '命运-冠位指定',
    'zh-TW': '命運-冠位指定',
    ja: 'Fate/Grand Order',
    ko: '페이트 그랜드 오더',
  },
  Naruto: {
    'zh-CN': '火影忍者',
    'zh-TW': '火影忍者',
    ja: 'ナルト',
    ko: '나루토',
  },
  'One Piece': {
    'zh-CN': '海贼王',
    'zh-TW': '航海王',
    ja: 'ワンピース',
    ko: '원피스',
  },
  'Attack on Titan': {
    'zh-CN': '进击的巨人',
    'zh-TW': '進擊的巨人',
    ja: '進撃の巨人',
    ko: '진격의 거인',
  },
  'Demon Slayer': {
    'zh-CN': '鬼灭之刃',
    'zh-TW': '鬼滅之刃',
    ja: '鬼滅の刃',
    ko: '귀멸의 칼날',
  },
  'My Hero Academia': {
    'zh-CN': '我的英雄学院',
    'zh-TW': '我的英雄學院',
    ja: '僕のヒーローアカデミア',
    ko: '나의 히어로 아카데미아',
  },
  'Jujutsu Kaisen': {
    'zh-CN': '咒术回战',
    'zh-TW': '咒術迴戰',
    ja: '呪術廻戦',
    ko: '주술회전',
  },
  'Spy x Family': {
    'zh-CN': '间谍过家家',
    'zh-TW': '間諜家家酒',
    ja: 'SPY×FAMILY',
    ko: '스파이 패밀리',
  },
  'Hatsune Miku': {
    'zh-CN': '初音未来',
    'zh-TW': '初音未來',
    ja: '初音ミク',
    ko: '하츠네 미쿠',
  },
  'League of Legends': {
    'zh-CN': '英雄联盟',
    'zh-TW': '英雄聯盟',
    ja: 'リーグ・オブ・レジェンド',
    ko: '리그 오브 레전드',
  },
  Pokémon: {
    'zh-CN': '宝可梦',
    'zh-TW': '寶可夢',
    ja: 'ポケモン',
    ko: '포켓몬',
  },
  Pokemon: {
    'zh-CN': '宝可梦',
    'zh-TW': '寶可夢',
    ja: 'ポケモン',
    ko: '포켓몬',
  },
  'Chainsaw Man': {
    'zh-CN': '电锯人',
    'zh-TW': '鏈鋸人',
    ja: 'チェンソーマン',
    ko: '체인소 맨',
  },
  'Bocchi the Rock!': {
    'zh-CN': '孤独摇滚！',
    'zh-TW': '孤獨搖滾！',
    ja: 'ぼっち・ざ・ろっく！',
    ko: '봇치 더 록!',
  },
  Frieren: {
    'zh-CN': '葬送的芙莉莲',
    'zh-TW': '葬送的芙莉蓮',
    ja: '葬送のフリーレン',
    ko: '장송의 프리렌',
  },
};

/**
 * 获取 category 的官方翻译
 */
function getCategoryTranslation(category, targetLang) {
  if (!category) return category;

  const translations = CATEGORY_OFFICIAL_TRANSLATIONS[category];
  if (translations && translations[targetLang]) {
    return translations[targetLang];
  }

  const categoryLower = category.toLowerCase();
  for (const [key, trans] of Object.entries(CATEGORY_OFFICIAL_TRANSLATIONS)) {
    if (key.toLowerCase() === categoryLower) {
      if (trans[targetLang]) {
        return trans[targetLang];
      }
      break;
    }
  }

  return category;
}

/**
 * 翻译 category 字段（使用硬编码官方译名）
 */
function translateCategoryHardcoded(category) {
  if (!category || typeof category !== 'string') return null;

  const translations = { en: category };
  for (const lang of TARGET_LANGUAGES) {
    translations[lang] = getCategoryTranslation(category, lang);
  }
  return translations;
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 速率限制配置
const DELAY_BETWEEN_REQUESTS = 200;
const MAX_RETRIES = 3;

/**
 * 使用 ChatGPT Responses API + Web Search 搜索角色信息
 * 获取角色的官方多语言名称和简要上下文
 */
async function searchCharacterContext(
  characterName,
  category,
  retryCount = 0
) {
  const searchPrompt = `First search about character "${characterName}" from "${category}" (you can search "${characterName} ${category}"), then provide the character's official localized names and a brief description.

Output a JSON in the following format:
{
  "official_names": {
    "ja": "Japanese official name, or empty string if unknown",
    "zh-CN": "Simplified Chinese official name, or empty string if unknown",
    "zh-TW": "Traditional Chinese official name, or empty string if unknown",
    "ko": "Korean official name, or empty string if unknown"
  },
  "context": "Brief character description in English, under 50 words"
}

If you don't have sufficient information from the search results, try output with your internal knowledge. If you completely don't have internal knowledge about the character, then write "".
Only output the JSON dict, without code block.`;

  try {
    // 优先使用 Responses API + web_search_preview
    const response = await openai.responses.create({
      model: SEARCH_MODEL,
      tools: [{ type: 'web_search_preview' }],
      input: searchPrompt,
    });
    const text = (response.output_text || '')
      .replace(/```json?\n?/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(text);
  } catch (error) {
    // 速率限制重试
    if (
      retryCount < MAX_RETRIES &&
      (error.message.includes('429') || error.message.includes('rate'))
    ) {
      const waitTime = 60 * 1000;
      console.log(
        `  ⏳ 速率限制，等待 ${waitTime / 1000}s 后重试 (${retryCount + 1}/${MAX_RETRIES})...`
      );
      await delay(waitTime);
      return searchCharacterContext(characterName, category, retryCount + 1);
    }

    // Responses API 不可用时，回退到 Chat Completions（无 web search）
    console.warn(`  ⚠️ Web Search 不可用 (${error.message})，使用模型内部知识`);
    try {
      const resp = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [{ role: 'user', content: searchPrompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });
      return JSON.parse(resp.choices[0].message.content);
    } catch (e) {
      console.warn(`  ⚠️ 角色搜索失败: ${e.message}`);
      return null;
    }
  }
}

/**
 * 批量翻译单个字段到所有目标语言（一次 API 调用）
 */
async function translateFieldBatch(
  text,
  fieldName,
  characterName,
  category,
  charContext,
  retryCount = 0
) {
  if (!text || typeof text !== 'string' || !text.trim()) return null;

  const contextInfo = charContext
    ? `\nCharacter context: ${charContext.context || 'N/A'}\nKnown official names: ${JSON.stringify(charContext.official_names || {})}`
    : '';

  const prompt = `You are a professional translator for anime/game/manga character profiles. Translate the following English text to ALL target languages listed below.

This is the "${fieldName}" of character "${characterName}" from "${category}".${contextInfo}

English text to translate: "${text}"

Target languages: ${TARGET_LANGUAGES.map(l => `${l} (${LANGUAGE_NAMES[l]})`).join(', ')}

IMPORTANT RULES:
- Use official localized character/franchise names when known (e.g. game/anime characters often have official translations)
- Keep translations natural, concise, and culturally appropriate
- Do NOT add explanations, notes, options, or alternatives
- Each value must be a clean translated string only
- Output ONLY a valid JSON object

Output format:
{${TARGET_LANGUAGES.map(l => `\n  "${l}": "translation in ${LANGUAGE_NAMES[l]}"`).join(',')}
}`;

  try {
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    if (
      retryCount < MAX_RETRIES &&
      (error.message.includes('429') || error.message.includes('rate'))
    ) {
      const waitTime = 60 * 1000;
      console.log(
        `  ⏳ 速率限制，等待 ${waitTime / 1000}s 后重试 (${retryCount + 1}/${MAX_RETRIES})...`
      );
      await delay(waitTime);
      return translateFieldBatch(
        text,
        fieldName,
        characterName,
        category,
        charContext,
        retryCount + 1
      );
    }
    throw error;
  }
}

/**
 * 翻译单个角色
 */
async function translateCharacter(character) {
  console.log(
    `\n翻译角色: ${character.character_name} (${character.character_uniqid})`
  );

  // Step 1: Web Search 搜索角色信息
  console.log(`  🔍 搜索角色信息...`);
  const charContext = await searchCharacterContext(
    character.character_name,
    character.category || 'Unknown'
  );
  if (charContext) {
    console.log(`  ✓ 获取到角色上下文`);
    if (charContext.official_names) {
      const names = Object.entries(charContext.official_names)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`);
      if (names.length > 0) {
        console.log(`    官方名称: ${names.join(', ')}`);
      }
    }
    if (charContext.context) {
      console.log(
        `    上下文: ${charContext.context.substring(0, 80)}${charContext.context.length > 80 ? '...' : ''}`
      );
    }
  } else {
    console.log(`  ⚠️ 未获取到角色上下文，将仅使用文本翻译`);
  }
  await delay(DELAY_BETWEEN_REQUESTS);

  // Step 2: 翻译各字段
  const i18n = {
    forceTranslate: true,
    updatedAt: new Date().toISOString(),
  };

  const fields = [
    'character_name',
    'intro',
    'personality',
    'interests',
    'gender',
    'profession',
  ];

  for (const field of fields) {
    const originalValue = character[field];
    if (
      !originalValue ||
      typeof originalValue !== 'string' ||
      !originalValue.trim()
    ) {
      console.log(`  - ${field}: 跳过（空值）`);
      continue;
    }

    console.log(`  - ${field}: 翻译中...`);
    try {
      const translations = await translateFieldBatch(
        originalValue,
        field,
        character.character_name,
        character.category,
        charContext
      );

      if (translations) {
        // 英文是原文，直接放入
        translations.en = originalValue;

        // 对 character_name，优先使用 web search 找到的官方名称
        if (field === 'character_name' && charContext?.official_names) {
          for (const [lang, name] of Object.entries(
            charContext.official_names
          )) {
            if (name && name.trim()) {
              translations[lang] = name;
            }
          }
        }

        i18n[field] = translations;
        const langCount = Object.keys(translations).length;
        console.log(`    ✓ 完成 (${langCount} 种语言)`);
      }
    } catch (error) {
      console.error(`    ❌ 翻译失败: ${error.message}`);
    }

    await delay(DELAY_BETWEEN_REQUESTS);
  }

  // Step 3: Category 翻译
  const categoryValue = character.category;
  if (
    categoryValue &&
    typeof categoryValue === 'string' &&
    categoryValue.trim()
  ) {
    console.log(`  - category: 处理中...`);

    // 检查是否有硬编码的官方译名
    const hasHardcoded =
      CATEGORY_OFFICIAL_TRANSLATIONS[categoryValue] ||
      Object.keys(CATEGORY_OFFICIAL_TRANSLATIONS).some(
        k => k.toLowerCase() === categoryValue.toLowerCase()
      );

    if (hasHardcoded) {
      const categoryTranslations = translateCategoryHardcoded(categoryValue);
      if (categoryTranslations) {
        i18n.category = categoryTranslations;
        console.log(`    ✓ 使用硬编码官方译名`);
      }
    } else {
      // 没有硬编码，走模型翻译
      try {
        const catTranslations = await translateFieldBatch(
          categoryValue,
          'category (this is a franchise/series/game name, use official localized names)',
          character.character_name,
          categoryValue,
          charContext
        );
        if (catTranslations) {
          catTranslations.en = categoryValue;
          i18n.category = catTranslations;
          console.log(`    ✓ 模型翻译完成`);
        }
      } catch (error) {
        // 翻译失败，保留原文
        const fallback = { en: categoryValue };
        TARGET_LANGUAGES.forEach(l => {
          fallback[l] = categoryValue;
        });
        i18n.category = fallback;
        console.log(`    ⚠️ 翻译失败，保留原文: ${categoryValue}`);
      }
    }
  } else {
    console.log(`  - category: 跳过（空值）`);
  }

  return i18n;
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('批量翻译到 i18n 列 (ChatGPT + Web Search)');
  console.log('========================================\n');

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ 未找到 OPENAI_API_KEY 环境变量');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 解析命令行参数
  const args = process.argv.slice(2);
  let characterUniqid = null;
  let isOfficialOnly = false;
  let skipTranslated = false;
  let limit = null;
  let offset = 0;
  let tableName = 'CustomCharacters';

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--id=')) {
      characterUniqid = args[i].substring(5);
    } else if (args[i] === '--is-official') {
      isOfficialOnly = true;
    } else if (args[i] === '--skip-translated') {
      skipTranslated = true;
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
  console.log(`  - 模型: ${CHAT_MODEL} (翻译) / ${SEARCH_MODEL} (搜索)`);
  console.log(`  - 原文语言: English（英文不翻译）`);
  if (skipTranslated) {
    console.log(
      `  - 跳过已翻译: 是（仅翻译 i18n.forceTranslate 不存在的记录）`
    );
  }

  let query = supabase.from(tableName).select('*');

  if (characterUniqid) {
    console.log(`  - 翻译角色: ${characterUniqid}\n`);
    query = query.eq('character_uniqid', characterUniqid);
  } else if (isOfficialOnly) {
    console.log(`  - 翻译条件: is_official = true`);
    if (limit) {
      console.log(`  - 翻译数量限制: ${limit} 条`);
      console.log(`  - 起始位置: 第 ${offset} 条\n`);
      query = query
        .eq('is_official', true)
        .range(offset, offset + limit - 1)
        .order('num_gen', { ascending: false });
    } else {
      console.log(`  - 翻译数量: 全部（无限制）\n`);
      query = query
        .eq('is_official', true)
        .order('num_gen', { ascending: false });
    }
  } else {
    if (limit) {
      console.log(`  - 翻译数量限制: ${limit} 条`);
      console.log(`  - 起始位置: 第 ${offset} 条\n`);
      query = query
        .range(offset, offset + limit - 1)
        .order('num_gen', { ascending: false });
    } else {
      console.log(`  - 翻译数量: 全部（无限制）\n`);
      query = query.order('num_gen', { ascending: false });
    }
  }

  // 如果启用了 --skip-translated，在数据库层面过滤掉已翻译的记录
  if (skipTranslated) {
    query = query.or('i18n.is.null,i18n->forceTranslate.is.null');
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
    if (characterUniqid) {
      console.log(
        `提示: 请检查 character_uniqid "${characterUniqid}" 是否正确`
      );
    }
    process.exit(0);
  }

  console.log(`✓ 找到 ${characters.length} 条数据\n`);

  // 翻译每个角色
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (let i = 0; i < characters.length; i++) {
    const character = characters[i];
    console.log(`[${i + 1}/${characters.length}]`);

    // 如果启用了 --skip-translated，跳过已有 forceTranslate 的记录
    if (skipTranslated && character.i18n?.forceTranslate) {
      console.log(
        `  ⏭️  跳过 ${character.character_name} (${character.character_uniqid}) - 已有 forceTranslate`
      );
      skipCount++;
      continue;
    }

    try {
      const i18n = await translateCharacter(character);

      // 更新数据库
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ i18n })
        .eq('id', character.id);

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

    // 角色之间延迟
    if (i < characters.length - 1) {
      await delay(500);
    }
  }

  console.log('\n========================================');
  console.log('翻译完成！(ChatGPT + Web Search)');
  console.log(`成功: ${successCount} 条`);
  console.log(`失败: ${failCount} 条`);
  console.log(`跳过: ${skipCount} 条`);
  console.log('========================================');
}

// 运行
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { searchCharacterContext, translateFieldBatch, translateCharacter };
