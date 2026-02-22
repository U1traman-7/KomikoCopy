// node v22.x
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const config = require('../../next.config.mjs');
const { OpenAI } = require('openai');

// Azure OpenAI configuration
const endpoint = 'https://dalleinstant.openai.azure.com/';
const apiKey =
  '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';
const deploymentName = 'gpt-4o';

// Languages to translate to
const rawTargetLanguages = config.default.i18n.locales;
// const rawTargetLanguages = ['zh-CN', 'zh-TW', 'ja', ];
// 排除的语言
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

// Function to get changed JSON files from git
function getChangedJsonFiles() {
  try {
    // Get all staged files (files in staging area)
    const changedFiles = execSync(
      'git diff --name-only -- "src/i18n/locales/en/*.json"',
      {
        encoding: 'utf8',
      },
    )
      .split('\n')
      .filter(file => file.trim());

    console.log('changedFiles', changedFiles);
    // Filter for JSON files in src/i18n/locales directory
    const jsonFiles = changedFiles.filter(
      file =>
        file.startsWith('src/i18n/locales/') &&
        file.endsWith('.json') &&
        file.includes('/en/'), // Only process English files
    );

    return jsonFiles;
  } catch (error) {
    console.error('Error getting changed files from git:', error);
    return [];
  }
}

// Function to get previous version of a file from git
function getPreviousVersion(filePath) {
  try {
    // Get the version before staging (HEAD version)
    const previousContent = execSync(`git show HEAD:${filePath}`, {
      encoding: 'utf8',
    });
    return JSON.parse(previousContent);
  } catch (error) {
    console.log(
      `Could not get previous version for ${filePath}, treating as new file`,
    );
    return {};
  }
}

// Function to find differences between old and new JSON
function findDifferences(oldJson, newJson, path = '') {
  // Handle array types specially
  if (Array.isArray(newJson)) {
    if (
      !Array.isArray(oldJson) ||
      JSON.stringify(oldJson) !== JSON.stringify(newJson)
    ) {
      return [...newJson]; // Return a copy of the array
    }
    return [];
  }

  const differences = {};

  // Check for new or modified keys in newJson
  for (const key in newJson) {
    const currentPath = path ? `${path}.${key}` : key;

    // If key doesn't exist in oldJson, it's new
    if (!(key in oldJson)) {
      differences[key] = newJson[key];
      continue;
    }

    // If values are different types, consider it changed
    if (typeof newJson[key] !== typeof oldJson[key]) {
      differences[key] = newJson[key];
      continue;
    }

    // If arrays, check if they're different
    if (Array.isArray(newJson[key])) {
      if (JSON.stringify(newJson[key]) !== JSON.stringify(oldJson[key])) {
        differences[key] = [...newJson[key]]; // Copy the array
      }
      continue;
    }

    // If objects, recursively check
    if (typeof newJson[key] === 'object' && newJson[key] !== null) {
      const nestedDiffs = findDifferences(
        oldJson[key],
        newJson[key],
        currentPath,
      );
      if (Array.isArray(nestedDiffs) || Object.keys(nestedDiffs).length > 0) {
        differences[key] = nestedDiffs;
      }
    }
    // If primitive values and different, it's changed
    else if (newJson[key] !== oldJson[key]) {
      differences[key] = newJson[key];
    }
  }

  return differences;
}

async function translateJson(jsonContent, targetLang) {
  // First translation
  const translationPrompt = `将如下json文件翻译为 ${
    langMap[targetLang]
  } """ ${JSON.stringify(
    jsonContent,
    null,
    2,
  )}"""。像KomikoAI这样的文案不翻译。对于货币金额也不要求翻译。要求只返回翻译后的json即可，包裹在\`\`\`json和\`\`\`里。特别注意：1. 保持原始JSON结构，数组应该保持为数组格式，不要将数组转换为对象。2. 确保JSON中的字符串值不包含控制字符，所有换行符应该用\\n转义。3. 生成的JSON必须是有效的，可以被JSON.parse()正确解析。`;

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
  )}"""。要求只返回处理后的json即可，包裹在\`\`\`json和\`\`\`里。特别注意：1. 保持原始JSON结构，数组应该保持为数组格式，不要将数组转换为对象。2. 确保JSON中的字符串值不包含控制字符，所有换行符应该用\\n转义。3. 生成的JSON必须是有效的，可以被JSON.parse()正确解析。`;

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

    // If no JSON-like structure is found, try parsing the whole response
    let cleanedResponse = cleanJsonString(response);
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error('Failed to parse JSON from response:', error);
    console.log('Response content:', response);
    throw error;
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

// Function to merge changes into existing JSON
function mergeChanges(targetJson, changesJson) {
  // If changesJson is an array, return the entire array
  if (Array.isArray(changesJson)) {
    return [...changesJson];
  }

  const result = { ...targetJson };

  for (const key in changesJson) {
    // If it's an array, replace the entire array
    if (Array.isArray(changesJson[key])) {
      result[key] = [...changesJson[key]];
    }
    // If it's an object, recursively merge
    else if (
      typeof changesJson[key] === 'object' &&
      changesJson[key] !== null &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = mergeChanges(result[key], changesJson[key]);
    } else {
      // Otherwise just replace the value
      result[key] = changesJson[key];
    }
  }

  return result;
}

async function processFiles() {
  try {
    // Parse CLI arguments: --force to skip git diff and translate all keys
    //                       --file <name> to target a specific file (e.g. effects.json)
    const args = process.argv.slice(2);
    const forceMode = args.includes('--force');
    const fileArgIndex = args.indexOf('--file');
    const targetFile = fileArgIndex !== -1 ? args[fileArgIndex + 1] : null;

    let changedFiles;

    if (forceMode && targetFile) {
      // --force --file effects.json → force full translation of a specific file
      const filePath = `src/i18n/locales/en/${targetFile}`;
      changedFiles = [filePath];
      console.log(`[Force mode] Will fully re-translate: ${filePath}`);
    } else if (forceMode) {
      // --force without --file → force all en/*.json files
      const enDir = path.join(__dirname, '..', '..', 'src', 'i18n', 'locales', 'en');
      const allFiles = await fs.readdir(enDir);
      changedFiles = allFiles
        .filter(f => f.endsWith('.json'))
        .map(f => `src/i18n/locales/en/${f}`);
      console.log(`[Force mode] Will fully re-translate all ${changedFiles.length} files`);
    } else {
      // Normal mode: detect changes via git diff
      changedFiles = getChangedJsonFiles();
    }

    if (changedFiles.length === 0) {
      console.log('No changed JSON files found in src/i18n/locales/en/');
      return;
    }

    console.log(`Found ${changedFiles.length} JSON files to process:`);
    changedFiles.forEach(file => console.log(`  - ${file}`));

    // Process each changed file
    for (const filePath of changedFiles) {
      console.log(`\nProcessing ${filePath}...`);

      // Read current version
      const newContent = await fs.readFile(filePath, 'utf8');
      const newJson = JSON.parse(newContent);

      // In force mode, treat old version as empty → all keys are "new"
      const oldJson = forceMode ? {} : getPreviousVersion(filePath);

      // Find differences
      const differences = findDifferences(oldJson, newJson);

      // If no differences, skip this file
      if (
        (Array.isArray(differences) && differences.length === 0) ||
        (!Array.isArray(differences) && Object.keys(differences).length === 0)
      ) {
        console.log(`No changes detected in ${filePath}, skipping...`);
        continue;
      }

      console.log(
        `Found changes in ${filePath}:`,
        JSON.stringify(differences, null, 2),
      );

      // Extract filename from path
      const fileName = path.basename(filePath);

      // Process each language
      for (const lang of targetLanguages) {
        console.log(`Updating translations for ${fileName} in ${lang}...`);

        // Translate the differences
        const translatedDifferences = await translateJson(differences, lang);

        // Path to target language file
        const targetDir = path.join(
          __dirname,
          '..',
          '..',
          'src',
          'i18n',
          'locales',
          lang,
        );
        const targetFilePath = path.join(targetDir, fileName);

        // Ensure target directory exists
        await fs.mkdir(targetDir, { recursive: true });

        // Read existing target file or create empty object
        let targetJson = {};
        try {
          const targetContent = await fs.readFile(targetFilePath, 'utf8');
          targetJson = JSON.parse(targetContent);
        } catch (error) {
          console.log(
            `Target file ${fileName} doesn't exist in ${lang}, creating new file`,
          );
        }

        // Merge translated differences into target
        const updatedJson = mergeChanges(targetJson, translatedDifferences);

        // Write updated file
        await fs.writeFile(
          targetFilePath,
          JSON.stringify(updatedJson, null, 2),
          'utf8',
        );
        console.log(`  ✓ Updated ${targetFilePath}`);
      }
    }

    console.log('\nUpdate process completed successfully!');
  } catch (error) {
    console.error('Error during update process:', error);
  }
}

// Execute the update process
processFiles();
