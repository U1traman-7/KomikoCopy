/**
 * 同步脚本：将 style_templates 表的 i18n 数据同步到 tags 表
 *
 * 使用方式：
 * 1. 预览模式（不执行，只查看会做什么）：
 *    npx tsx scripts/syncTemplateTagsI18n.ts --dry-run
 *
 * 2. 执行模式（实际更新数据库）：
 *    npx tsx scripts/syncTemplateTagsI18n.ts
 *
 * 3. 重命名非英语 tag 为英文：
 *    npx tsx scripts/syncTemplateTagsI18n.ts --rename
 *
 * 4. 组合使用：
 *    npx tsx scripts/syncTemplateTagsI18n.ts --dry-run --rename
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 加载 .env 文件（优先 .env.local，回退到 .env）
const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  config({ path: envPath });
} else {
  console.warn('Warning: No .env or .env.local file found');
}

// 从环境变量获取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 支持的 locale 列表
const SUPPORTED_LOCALES = [
  'en',
  'ja',
  'zh-CN',
  'zh-TW',
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

/**
 * 加载所有 locale 的 i18n JSON 文件
 */
function loadI18nFiles(): Record<string, Record<string, unknown>> {
  const i18nData: Record<string, Record<string, unknown>> = {};

  for (const locale of SUPPORTED_LOCALES) {
    const filePath = path.join(
      process.cwd(),
      'src/i18n/locales',
      locale,
      'style-templates.json',
    );
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      i18nData[locale] = JSON.parse(content);
    }
  }

  return i18nData;
}

/**
 * 从 i18n JSON 文件获取某个 nameKey 在所有 locale 中的翻译
 * 支持两种格式：
 * 1. 带路径：'titles.playdoh' -> data.titles.playdoh
 * 2. 不带路径：'playdoh' -> 尝试 titles/effects/dances.playdoh
 */
function getTranslationFromJson(
  nameKey: string,
  i18nData: Record<string, Record<string, unknown>>,
): Record<string, string> | null {
  const result: Record<string, string> = {};

  for (const [locale, data] of Object.entries(i18nData)) {
    // 如果 nameKey 包含路径（如 "titles.playdoh"）
    if (nameKey.includes('.')) {
      const parts = nameKey.split('.');
      const section = parts[0]; // "titles"
      const key = parts.slice(1).join('.'); // "playdoh"

      const sectionData = data[section] as Record<string, string> | undefined;
      const value = sectionData?.[key];
      if (value && typeof value === 'string') {
        result[locale] = value;
      }
    } else {
      // 如果 nameKey 不包含路径（如 "playdoh"），尝试多个可能的 section
      const sections = ['titles', 'effects', 'dances'];

      for (const section of sections) {
        const sectionData = data[section] as Record<string, string> | undefined;
        const value = sectionData?.[nameKey];
        if (value && typeof value === 'string') {
          result[locale] = value;
          break;
        }
      }
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * 判断一个名称是否为英文（仅包含 ASCII 字符、数字、空格和常见标点）
 */
function isEnglishName(name: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /^[\x00-\x7F]+$/.test(name);
}

/**
 * 获取名称对应的 locale 标签（用于日志输出）
 */
function getLocaleLabel(
  name: string,
  mergedI18n: Record<string, string>,
): string | null {
  for (const [locale, localeName] of Object.entries(mergedI18n)) {
    if (localeName === name) return locale;
  }
  return null;
}

// style_templates 表返回的行类型
interface TemplateRow {
  id: string;
  name_key: string | null;
  i18n: {
    name?: Record<string, string>;
    description?: Record<string, string>;
  } | null;
}

// tags 表返回的行类型
interface TagRow {
  id: number;
  name: string;
  i18n: Record<string, unknown> | null;
}

// 重复 tag 的记录
interface DuplicateRecord {
  templateNameKey: string;
  englishName: string;
  keptTagId: number;
  keptTagName: string;
  duplicateTagIds: number[];
  duplicateTagNames: string[];
}

async function syncTemplateTagsI18n(
  dryRun = false,
  renameMode = false,
): Promise<void> {
  console.log('Starting template tags i18n sync...\n');
  const modeFlags = [
    dryRun ? 'DRY RUN' : 'WRITE',
    renameMode ? 'RENAME' : null,
  ]
    .filter(Boolean)
    .join(' + ');
  console.log(`Mode: ${modeFlags}\n`);

  // 1. 加载 i18n JSON 文件
  console.log('Loading i18n JSON files...');
  const i18nData = loadI18nFiles();
  console.log(`  Loaded ${Object.keys(i18nData).length} locales\n`);

  // 2. 从数据库读取所有模板
  console.log('Fetching templates from database...');
  const { data: templates, error: fetchError } = await supabase
    .from('style_templates')
    .select('id, name_key, i18n');

  if (fetchError) {
    console.error('Error fetching templates:', fetchError);
    return;
  }

  const typedTemplates = templates as TemplateRow[] | null;

  console.log(`  Found ${typedTemplates?.length || 0} templates\n`);

  let updatedCount = 0;
  let createdCount = 0;
  let renamedCount = 0;
  let skippedCount = 0;
  const duplicateRecords: DuplicateRecord[] = [];

  // 3. 处理每个模板
  for (const template of typedTemplates || []) {
    // 获取英文名称
    let englishName = template.i18n?.name?.en || null;

    // 如果数据库没有 i18n.name.en，从 JSON 文件获取
    if (!englishName && template.name_key) {
      const jsonI18n = getTranslationFromJson(template.name_key, i18nData);
      englishName = jsonI18n?.en || null;
    }

    // 合并 i18n 数据（数据库优先，JSON 作为回退）
    const mergedI18n: Record<string, string> = {};

    // 先从 JSON 获取
    if (template.name_key) {
      const jsonI18n = getTranslationFromJson(template.name_key, i18nData);
      if (jsonI18n) {
        Object.assign(mergedI18n, jsonI18n);
      }
    }

    // 再从数据库覆盖（优先级更高）
    if (template.i18n?.name) {
      Object.assign(mergedI18n, template.i18n.name);
    }

    if (!englishName) {
      console.log(
        `  [SKIP] Template ${template.id} (name_key: ${template.name_key}): no English name found`,
      );
      skippedCount++;
      continue;
    }

    // 收集所有可能的名称（英文 + 所有其他语言）
    const allNames = new Set<string>();
    allNames.add(englishName);
    for (const [, name] of Object.entries(mergedI18n)) {
      if (name && name !== englishName) {
        allNames.add(name);
      }
    }

    // 日志：显示当前处理的模板信息
    console.log(`\n  Processing template: ${template.name_key || template.id}`);
    console.log(`    English name: ${englishName}`);

    // 显示其他语言的名称
    const otherNames = Object.entries(mergedI18n)
      .filter(([locale, name]) => locale !== 'en' && name && name !== englishName)
      .map(([locale, name]) => `${name} (${locale})`)
      .join(', ');
    if (otherNames) {
      console.log(`    Other names: ${otherNames}`);
    }

    console.log(`    Searching tags table...`);

    // 4. 在 tags 表中查找所有可能的名称
    const namesArray = Array.from(allNames);
    const { data: existingTags, error: searchError } = await supabase
      .from('tags')
      .select('id, name, i18n')
      .in('name', namesArray);

    if (searchError) {
      console.error(`    Error searching tags: ${searchError.message}`);
      skippedCount++;
      continue;
    }

    const typedTags = (existingTags as TagRow[] | null) || [];

    if (typedTags.length === 0) {
      // 情况 C: 没有找到任何 tag，创建新的
      console.log(`    No existing tags found`);
      console.log(`    [CREATE] New tag: "${englishName}"`);
      console.log(`      i18n: ${JSON.stringify(mergedI18n)}`);

      if (!dryRun) {
        const { error: createError } = await supabase.from('tags').insert([
          {
            name: englishName,
            i18n: { name: mergedI18n },
            popularity: 0,
            is_nsfw: false,
          },
        ]);

        if (createError) {
          console.error(`      Error: ${createError.message}`);
        } else {
          console.log(`      Created successfully`);
        }
      }
      createdCount++;
    } else if (typedTags.length === 1) {
      // 情况 B: 找到 1 个 tag
      const tag = typedTags[0];
      const tagIsEnglish = isEnglishName(tag.name);
      const localeLabel = getLocaleLabel(tag.name, mergedI18n);

      console.log(`    Found 1 tag: "${tag.name}" (ID: ${tag.id})`);

      if (!tagIsEnglish) {
        console.log(
          `    Tag name is not English${localeLabel ? ` (${localeLabel})` : ''}`,
        );
      }

      const needsRename = tag.name !== englishName;

      if (needsRename && renameMode) {
        // 重命名 tag 为英文名并更新 i18n
        console.log(`    [RENAME] "${tag.name}" -> "${englishName}"`);
        console.log(`    [UPDATE] i18n: ${JSON.stringify(mergedI18n)}`);

        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('tags')
            .update({
              name: englishName,
              i18n: { name: mergedI18n },
            })
            .eq('id', tag.id);

          if (updateError) {
            console.error(`      Error: ${updateError.message}`);
          } else {
            console.log(`      Renamed and updated successfully`);
          }
        }
        renamedCount++;
        updatedCount++;
      } else {
        // 只更新 i18n（保持 tag.name 不变）
        if (needsRename && !renameMode) {
          console.log(
            `    Tag name differs from English name (use --rename to rename)`,
          );
        }
        console.log(`    [UPDATE] Tag: "${tag.name}" (ID: ${tag.id})`);
        console.log(`      i18n: ${JSON.stringify(mergedI18n)}`);

        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('tags')
            .update({ i18n: { name: mergedI18n } })
            .eq('id', tag.id);

          if (updateError) {
            console.error(`      Error: ${updateError.message}`);
          } else {
            console.log(`      Updated successfully`);
          }
        }
        updatedCount++;
      }
    } else {
      // 情况 A: 找到多个 tag（重复）
      console.log(
        `    Found ${typedTags.length} tags (duplicates!):`,
      );
      for (const tag of typedTags) {
        const localeLabel = getLocaleLabel(tag.name, mergedI18n);
        console.log(
          `      - "${tag.name}" (ID: ${tag.id})${localeLabel ? ` [${localeLabel}]` : ''}`,
        );
      }

      // 优先选择英文名称的，其次选择 ID 最小的
      const preferredTag =
        typedTags.find((t) => t.name === englishName) ||
        typedTags.sort((a, b) => a.id - b.id)[0];

      const duplicates = typedTags.filter((t) => t.id !== preferredTag.id);

      console.log(`    Selected tag: "${preferredTag.name}" (ID: ${preferredTag.id})`);
      console.log(
        `    Duplicate tags to handle manually: ${duplicates.map((d) => `"${d.name}" (ID: ${d.id})`).join(', ')}`,
      );

      // 记录重复信息
      duplicateRecords.push({
        templateNameKey: template.name_key || template.id,
        englishName,
        keptTagId: preferredTag.id,
        keptTagName: preferredTag.name,
        duplicateTagIds: duplicates.map((d) => d.id),
        duplicateTagNames: duplicates.map((d) => d.name),
      });

      const needsRename = preferredTag.name !== englishName;

      if (needsRename && renameMode) {
        console.log(`    [RENAME] "${preferredTag.name}" -> "${englishName}"`);
        console.log(`    [UPDATE] i18n: ${JSON.stringify(mergedI18n)}`);

        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('tags')
            .update({
              name: englishName,
              i18n: { name: mergedI18n },
            })
            .eq('id', preferredTag.id);

          if (updateError) {
            console.error(`      Error: ${updateError.message}`);
          } else {
            console.log(`      Renamed and updated successfully`);
          }
        }
        renamedCount++;
        updatedCount++;
      } else {
        if (needsRename && !renameMode) {
          console.log(
            `    Tag name differs from English name (use --rename to rename)`,
          );
        }
        console.log(`    [UPDATE] Tag: "${preferredTag.name}" (ID: ${preferredTag.id})`);
        console.log(`      i18n: ${JSON.stringify(mergedI18n)}`);

        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('tags')
            .update({ i18n: { name: mergedI18n } })
            .eq('id', preferredTag.id);

          if (updateError) {
            console.error(`      Error: ${updateError.message}`);
          } else {
            console.log(`      Updated successfully`);
          }
        }
        updatedCount++;
      }
    }
  }

  // 5. 输出总结
  console.log('\n--- Summary ---');
  console.log(`  Updated: ${updatedCount} tags`);
  console.log(`  Created: ${createdCount} tags`);
  console.log(`  Renamed: ${renamedCount} tags (non-English -> English)`);

  if (duplicateRecords.length > 0) {
    console.log(`  Duplicates found: ${duplicateRecords.length} templates`);
    for (const dup of duplicateRecords) {
      const dupInfo = dup.duplicateTagIds
        .map((id, i) => `"${dup.duplicateTagNames[i]}" (ID: ${id})`)
        .join(', ');
      console.log(
        `    - "${dup.englishName}": kept "${dup.keptTagName}" (ID: ${dup.keptTagId}), please manually handle: ${dupInfo}`,
      );
    }
  }

  console.log(`  Skipped: ${skippedCount} templates`);
  console.log(`  Total processed: ${typedTemplates?.length || 0} templates\n`);

  if (dryRun) {
    console.log('This was a DRY RUN. No changes were made.');
    console.log('Run without --dry-run to apply changes.\n');
  } else {
    console.log('Sync completed!\n');
  }
}

// 解析命令行参数
const isDryRun = process.argv.includes('--dry-run');
const isRenameMode = process.argv.includes('--rename');

syncTemplateTagsI18n(isDryRun, isRenameMode)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
