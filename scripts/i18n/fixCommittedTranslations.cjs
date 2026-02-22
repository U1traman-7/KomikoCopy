// node v22.x
const fs = require('fs').promises;
const path = require('path');
const config = require('../../next.config.mjs');
const { OpenAI } = require('openai');

// Azure OpenAI configuration
const endpoint = 'https://dalleinstant.openai.azure.com/';
const apiKey =
  '';
const deploymentName = 'gpt-4o';

// Languages to translate to
const rawTargetLanguages = config.default.i18n.locales;
const excludeLanguages = ['en'];
const targetLanguages = rawTargetLanguages.filter(
  lang => !excludeLanguages.includes(lang),
);

const client = new OpenAI({
  apiKey,
  timeout: 60 * 60 * 1000,
});

const langMap = {
  en: 'English',
  zh: 'Chinese',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  id: 'Indonesian',
  pt: 'Portuguese',
  it: 'Italian',
  nl: 'Dutch',
  pl: 'Polish',
  ru: 'Russian',
  ar: 'Arabic',
  'zh-CN': 'Chinese Simplified',
  'zh-TW': 'Chinese Traditional',
  ko: 'Korean',
  vi: 'Vietnamese',
  th: 'Thai',
  ms: 'Malay',
  hi: 'Hindi',
};

// Function to get all English JSON files
async function getEnglishJsonFiles() {
  const enDir = 'api/_utils/i18n/en';
  try {
    const files = await fs.readdir(enDir);
    return files.filter(file => file.endsWith('.json')).map(file => path.join(enDir, file));
  } catch (error) {
    console.error('Error reading English locale directory:', error);
    return [];
  }
}

// Function to find differences between English and target language files
function findMissingTranslations(enJson, targetJson, path = '') {
  // Handle array types specially
  if (Array.isArray(enJson)) {
    if (!Array.isArray(targetJson) || JSON.stringify(enJson) !== JSON.stringify(targetJson)) {
      return [...enJson]; // Return a copy of the array
    }
    return [];
  }

  const missing = {};

  // Check for missing keys in targetJson
  for (const key in enJson) {
    const currentPath = path ? `${path}.${key}` : key;

    // If key doesn't exist in targetJson, it's missing
    if (!(key in targetJson)) {
      missing[key] = enJson[key];
      continue;
    }

    // If values are different types, consider it missing
    if (typeof enJson[key] !== typeof targetJson[key]) {
      missing[key] = enJson[key];
      continue;
    }

    // If arrays, check if they're different
    if (Array.isArray(enJson[key])) {
      if (JSON.stringify(enJson[key]) !== JSON.stringify(targetJson[key])) {
        missing[key] = [...enJson[key]]; // Copy the array
      }
      continue;
    }

    // If objects, recursively check
    if (typeof enJson[key] === 'object' && enJson[key] !== null) {
      const nestedMissing = findMissingTranslations(
        enJson[key],
        targetJson[key] || {},
        currentPath,
      );
      if (Array.isArray(nestedMissing) || Object.keys(nestedMissing).length > 0) {
        missing[key] = nestedMissing;
      }
    }
  }

  return missing;
}

async function translateJson(jsonContent, targetLang) {
  // First translation
  const translationPrompt = `将如下json文件翻译为 ${
    langMap[targetLang]
  } """ ${JSON.stringify(
    jsonContent,
    null,
    2,
  )}"""。像KomikoAI这样的文案不翻译。要求只返回翻译后的json即可，包裹在\`\`\`json和\`\`\`里。特别注意：1. 保持原始JSON结构，数组应该保持为数组格式，不要将数组转换为对象。2. 确保JSON中的字符串值不包含控制字符，所有换行符应该用\\n转义。3. 生成的JSON必须是有效的，可以被JSON.parse()正确解析。4. 不要在JSON中添加注释或额外的文本。`;

  const translationResponse = await client.chat.completions.create({
    model: deploymentName,
    messages: [{ role: 'user', content: translationPrompt }],
  });

  let translatedJson = extractJsonFromResponse(
    translationResponse.choices[0].message.content,
  );

  // Polish the translation
  const polishPrompt = `打磨如下的json文件中的文案，使其更符合母语为${
    langMap[targetLang]
  }的说法"""${JSON.stringify(
    translatedJson,
    null,
    2,
  )}"""。要求只返回处理后的json即可，包裹在\`\`\`json和\`\`\`里。特别注意：1. 保持原始JSON结构，数组应该保持为数组格式，不要将数组转换为对象。2. 确保JSON中的字符串值不包含控制字符，所有换行符应该用\\n转义。3. 生成的JSON必须是有效的，可以被JSON.parse()正确解析。4. 不要在JSON中添加注释或额外的文本。`;

  const polishResponse = await client.chat.completions.create({
    model: deploymentName,
    messages: [{ role: 'user', content: polishPrompt }],
  });

  return extractJsonFromResponse(polishResponse.choices[0].message.content);
}

function extractJsonFromResponse(response) {
  try {
    // Extract JSON from response wrapped in ```json and ``` markers
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      // Clean up the JSON content properly
      let cleanedJson = cleanJsonString(jsonMatch[1]);
      return JSON.parse(cleanedJson);
    }
    // Fallback to the previous method if no code block is found
    const fallbackMatch = response.match(/\{[\s\S]*\}/);
    if (fallbackMatch) {
      let cleanedJson = cleanJsonString(fallbackMatch[0]);
      return JSON.parse(cleanedJson);
    }
    throw new Error('No JSON found in response');
  } catch (error) {
    console.error('Error parsing JSON from response:', error);
    console.log('Response was:', response);
    return {};
  }
}

function cleanJsonString(jsonStr) {
  // Remove problematic control characters while preserving JSON structure
  let cleaned = jsonStr
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters except \n \r \t
    .trim();

  // Fix embedded newlines within string values by properly escaping them
  // Split on quotes and process string content
  let inString = false;
  let result = '';
  let i = 0;

  while (i < cleaned.length) {
    const char = cleaned[i];

    if (char === '"' && (i === 0 || cleaned[i-1] !== '\\')) {
      inString = !inString;
      result += char;
    } else if (inString) {
      // Inside a string - escape unescaped newlines
      if (char === '\n' && (i === 0 || cleaned[i-1] !== '\\')) {
        result += '\\n';
      } else if (char === '\r' && (i === 0 || cleaned[i-1] !== '\\')) {
        result += '\\r';
      } else if (char === '\t' && (i === 0 || cleaned[i-1] !== '\\')) {
        result += '\\t';
      } else {
        result += char;
      }
    } else {
      // Outside string - keep as is
      result += char;
    }
    i++;
  }

  return result;
}

// Function to merge translations into existing target file
function mergeTranslations(existingJson, newTranslations) {
  const result = { ...existingJson };

  for (const key in newTranslations) {
    if (typeof newTranslations[key] === 'object' && newTranslations[key] !== null && !Array.isArray(newTranslations[key])) {
      // If it's an object, merge recursively
      result[key] = mergeTranslations(result[key] || {}, newTranslations[key]);
    } else {
      // If it's a primitive value or array, replace it
      result[key] = newTranslations[key];
    }
  }

  return result;
}

async function processFile(enFilePath) {
  console.log(`\nProcessing ${enFilePath}...`);

  try {
    // Read English file
    const enContent = await fs.readFile(enFilePath, 'utf8');
    const enJson = JSON.parse(enContent);

    const fileName = path.basename(enFilePath);
    let hasUpdates = false;

    // Process each target language
    for (const lang of targetLanguages) {
      const targetFilePath = enFilePath.replace('/en/', `/${lang}/`);

      try {
        // Try to read existing target file
        let targetJson = {};
        try {
          const targetContent = await fs.readFile(targetFilePath, 'utf8');
          targetJson = JSON.parse(targetContent);
        } catch (error) {
          console.log(`  Creating new file for ${lang}: ${fileName}`);
        }

        // Find missing translations
        const missingTranslations = findMissingTranslations(enJson, targetJson);

        if (Object.keys(missingTranslations).length === 0) {
          console.log(`  ✓ ${lang}: No missing translations`);
          continue;
        }

        console.log(`  🔄 ${lang}: Found ${Object.keys(missingTranslations).length} missing keys, translating...`);

        // Translate missing parts
        const translatedMissing = await translateJson(missingTranslations, lang);

        // Merge translations
        const updatedJson = mergeTranslations(targetJson, translatedMissing);

        // Ensure target directory exists
        await fs.mkdir(path.dirname(targetFilePath), { recursive: true });

        // Write updated file
        await fs.writeFile(targetFilePath, JSON.stringify(updatedJson, null, 2) + '\n');

        console.log(`  ✓ ${lang}: Updated with new translations`);
        hasUpdates = true;

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`  ❌ ${lang}: Error processing - ${error.message}`);
      }
    }

    if (hasUpdates) {
      console.log(`✅ Completed processing ${fileName}`);
    }

  } catch (error) {
    console.error(`❌ Error processing ${enFilePath}:`, error);
  }
}

async function main() {
  console.log('🚀 Starting committed translations fix...');
  console.log(`Target languages: ${targetLanguages.join(', ')}\n`);

  // Get specific file from command line argument or process all files
  const targetFile = process.argv[2];

  if (targetFile) {
    // Process specific file
    const enFilePath = targetFile.startsWith('api/_utils/i18n/en/')
      ? targetFile
      : `api/_utils/i18n/en/${targetFile}`;

    if (await fs.access(enFilePath).then(() => true).catch(() => false)) {
      await processFile(enFilePath);
    } else {
      console.error(`❌ File not found: ${enFilePath}`);
    }
  } else {
    // Process all English JSON files
    const enFiles = await getEnglishJsonFiles();
    console.log(`Found ${enFiles.length} English JSON files to check\n`);

    for (const enFile of enFiles) {
      await processFile(enFile);
    }
  }

  console.log('\n🎉 Translation fix process completed!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});