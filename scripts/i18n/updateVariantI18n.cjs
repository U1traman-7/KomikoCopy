// node v22.x
const fs = require('fs').promises
const path = require('path')
const config = require('../../next.config.mjs')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const { execSync } = require('child_process')

const gemini_key = 'AIzaSyA9iAYWptOWhllAWQ7IE3DMHWLgLFxFlaE'
const genAI = new GoogleGenerativeAI(gemini_key)

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
  hi: 'Hindi'
}

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
  responseModalities: ['text'],
  thinkingConfig: { thinkingBudget: 0 },
}

const model = genAI.getGenerativeModel({
  model: 'gemini-3-pro-preview',
  generationConfig
})

const rawTargetLanguages = config.default.i18n.locales
const excludeLanguages = ['en']
const targetLanguages = rawTargetLanguages.filter(
  (lang) => !excludeLanguages.includes(lang)
)

// ---------------- CLI options ----------------
function parseCliArgs(args) {
  const result = { tool: null, variant: null, path: null, lang: null, force: false }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--tool' || arg === '-t') {
      result.tool = args[++i]
    } else if (arg === '--variant' || arg === '-v') {
      result.variant = args[++i]
    } else if (arg === '--path' || arg === '-p') {
      result.path = args[++i]
    } else if (arg === '--lang' || arg === '-l') {
      result.lang = args[++i]
    } else if (arg === '--force' || arg === '-f') {
      result.force = true
    }
  }

  // Derive tool/variant from a provided file path if possible
  if (result.path) {
    try {
      const normalized = path.normalize(result.path)
      const parts = normalized.split(path.sep)
      const variantsIdx = parts.lastIndexOf('variants')
      if (variantsIdx !== -1 && parts.length > variantsIdx + 2) {
        const maybeTool = parts[variantsIdx + 1]
        const maybeFile = parts[variantsIdx + 2]
        if (!result.tool) result.tool = maybeTool
        if (!result.variant) result.variant = path.basename(maybeFile, '.json')
      }
    } catch { }
  }

  return result
}

const cli = parseCliArgs(process.argv.slice(2))
const selectedLanguages = cli.lang ? [cli.lang] : targetLanguages

// 使用和updateI18n.cjs相同的差异检测逻辑
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

async function translateDifferences(
  differences,
  targetLang,
  toolName,
  variantName,
) {
  const translationPrompt = `将如下json文件翻译为 ${langMap[targetLang]
    } """ ${JSON.stringify(
      differences,
      null,
      2,
    )}"""。像KomikoAI这样的文案不翻译。examples数组中的prompt字段保持英文不翻译。要求只返回翻译后的json即可，包裹在\`\`\`json和\`\`\`里。特别注意：保持原始JSON结构，数组应该保持为数组格式，不要将数组转换为对象。`;

  console.log(
    `Translating differences for ${toolName}/${variantName} to ${targetLang}...`,
  );

  const translationResponse = await model.generateContent(translationPrompt);
  return extractJsonFromResponse(translationResponse.response.text());
}

function extractJsonFromResponse(response) {
  try {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    const fallbackMatch = response.match(/\{[\s\S]*\}/);
    if (fallbackMatch) {
      return JSON.parse(fallbackMatch[0]);
    }
    return JSON.parse(response);
  } catch (error) {
    console.error('Failed to parse JSON from response:', error);
    console.log('Response content:', response);
    throw error;
  }
}

// 使用和updateI18n.cjs相同的合并逻辑
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

// ---------------- Git-based change detection (aligned with updateI18n.cjs) ----------------
function getChangedVariantFiles(separateFiles) {
  try {
    // If a specific file path is provided, prioritize it
    if (cli.path) {
      return [cli.path]
    }

    const patterns = separateFiles
      ? 'src/data/variants/**/*.json'
      : 'src/data/variant-pages.json'

    // Use git diff to find changed files compared to index/HEAD (similar to updateI18n.cjs)
    const output = execSync(`git diff --name-only -- "${patterns}"`, { encoding: 'utf8' })
    const changedFiles = output
      .split('\n')
      .filter((f) => f.trim())

    // Filter out index.json in separated structure
    const files = separateFiles
      ? changedFiles.filter((f) => f.startsWith('src/data/variants/') && f.endsWith('.json') && !f.endsWith('/index.json'))
      : changedFiles.filter((f) => f === 'src/data/variant-pages.json')

    // Apply CLI tool/variant filters for separated files
    if (separateFiles && files.length) {
      return files.filter((f) => {
        if (!f.includes('src/data/variants/')) return false
        const parts = path.normalize(f).split(path.sep)
        const variantsIdx = parts.lastIndexOf('variants')
        const toolDir = parts[variantsIdx + 1]
        const variantBase = path.basename(parts[variantsIdx + 2] || '', '.json')
        if (cli.tool && cli.tool !== toolDir) return false
        if (cli.variant && cli.variant !== variantBase) return false
        return true
      })
    }

    return files
  } catch (error) {
    console.error('Error getting changed files from git:', error)
    return []
  }
}

function getPreviousVersion(filePath) {
  try {
    const previousContent = execSync(`git show HEAD:${filePath}`, { encoding: 'utf8' })
    return JSON.parse(previousContent)
  } catch (error) {
    console.log(`Could not get previous version for ${filePath}, treating as new file`)
    return {}
  }
}

function deriveToolAndVariantFromPath(filePath) {
  const parts = path.normalize(filePath).split(path.sep)
  const variantsIdx = parts.lastIndexOf('variants')
  const toolName = parts[variantsIdx + 1]
  const variantName = path.basename(parts[variantsIdx + 2] || '', '.json')
  return { toolName, variantName }
}

// 检查是否使用分离文件结构
function usesSeparateFiles() {
  const variantsDir = path.join(
    __dirname,
    '..',
    '..',
    'src',
    'data',
    'variants'
  )
  return require('fs').existsSync(path.join(variantsDir, 'index.json'))
}

// 加载variant数据
async function loadVariantData() {
  if (usesSeparateFiles()) {
    // 使用分离文件结构 - 每个工具一个目录，每个variant一个文件
    const variantsDir = path.join(
      __dirname,
      '..',
      '..',
      'src',
      'data',
      'variants'
    )
    const indexPath = path.join(variantsDir, 'index.json')
    const indexData = JSON.parse(await fs.readFile(indexPath, 'utf8'))

    const allData = {}
    for (const tool of indexData.tools) {
      const toolDir = path.join(variantsDir, tool.directory)

      try {
        const variantFiles = await fs.readdir(toolDir)
        const jsonFiles = variantFiles.filter((file) => file.endsWith('.json'))

        allData[tool.key] = { variants: {} }

        for (const file of jsonFiles) {
          const variantName = path.basename(file, '.json')
          const variantPath = path.join(toolDir, file)
          const variantData = JSON.parse(await fs.readFile(variantPath, 'utf8'))
          allData[tool.key].variants[variantName] = variantData
        }
      } catch (error) {
        console.warn(
          `Warning: Could not load variants for tool ${tool.key}:`,
          error.message
        )
        continue
      }
    }

    return allData
  } else {
    // 使用legacy文件
    const variantPagesPath = path.join(
      __dirname,
      '..',
      '..',
      'src',
      'data',
      'variant-pages.json'
    )
    const variantPagesContent = await fs.readFile(variantPagesPath, 'utf8')
    return JSON.parse(variantPagesContent)
  }
}

async function updateVariantTranslations() {
  try {
    const separateFiles = usesSeparateFiles()
    // Use git to detect changed variant sources
    const changedFiles = getChangedVariantFiles(separateFiles)

    if (!changedFiles.length) {
      console.log(
        separateFiles
          ? 'No changed JSON files found in src/data/variants/'
          : 'No changes detected in src/data/variant-pages.json'
      )
      return
    }

    console.log(`Found ${changedFiles.length} changed JSON file(s) to process:`)
    changedFiles.forEach((f) => console.log(`  - ${f}`))

    // Process each changed file
    for (const filePath of changedFiles) {
      if (separateFiles) {
        const { toolName, variantName } = deriveToolAndVariantFromPath(filePath)
        if (!toolName || !variantName) continue

        console.log(`\nProcessing ${toolName}/${variantName} from ${filePath}...`)

        const newContent = await fs.readFile(filePath, 'utf8')
        const newJson = JSON.parse(newContent)
        const oldJson = getPreviousVersion(filePath)

        let differences = findDifferences(oldJson, newJson)

        const hasNoDiff = (
          (Array.isArray(differences) && differences.length === 0) ||
          (!Array.isArray(differences) && Object.keys(differences).length === 0)
        )

        if (hasNoDiff && !cli.force) {
          console.log(`No changes detected for ${toolName}/${variantName}, skipping...`)
          continue
        }

        if (cli.force) {
          differences = newJson
        }

        console.log(
          `Found changes in ${toolName}/${variantName}:`,
          JSON.stringify(differences, null, 2),
        )

        for (const lang of selectedLanguages) {
          console.log(
            `Updating translations for ${toolName}/${variantName} in ${lang}...`,
          )

          const targetDir = path.join(
            __dirname,
            '..',
            '..',
            'src',
            'i18n',
            'locales',
            lang,
            'variants',
            toolName
          )
          await fs.mkdir(targetDir, { recursive: true })

          const targetFilePath = path.join(targetDir, `${variantName}.json`)

          let existingTranslation = {}
          try {
            const targetContent = await fs.readFile(targetFilePath, 'utf8')
            existingTranslation = JSON.parse(targetContent)
          } catch { }

          const translatedDifferences = await translateDifferences(
            differences,
            lang,
            toolName,
            variantName
          )

          const updatedTranslation = mergeChanges(
            existingTranslation,
            translatedDifferences
          )

          await fs.writeFile(
            targetFilePath,
            JSON.stringify(updatedTranslation, null, 2),
            'utf8'
          )

          console.log(`  ✓ Updated ${targetFilePath}`)
        }
      } else {
        // Legacy single file changed: src/data/variant-pages.json
        console.log(`\nProcessing legacy file ${filePath}...`)
        const newContent = await fs.readFile(filePath, 'utf8')
        const newJson = JSON.parse(newContent)
        const oldJson = getPreviousVersion(filePath)

        // Iterate tools/variants and compute per-variant diffs
        for (const toolName of Object.keys(newJson)) {
          if (cli.tool && cli.tool !== toolName) continue
          const currentTool = newJson[toolName] || {}
          const prevTool = oldJson[toolName] || {}
          if (!currentTool.variants) continue

          for (const variantName of Object.keys(currentTool.variants)) {
            if (cli.variant && cli.variant !== variantName) continue
            const currentVariant = currentTool.variants[variantName] || {}
            const prevVariant = prevTool.variants?.[variantName] || {}
            const baseOld = prevVariant.content || prevVariant || {}
            const baseNew = currentVariant.content || currentVariant || {}
            let differences = findDifferences(baseOld, baseNew)

            const hasNoDiff = (
              (Array.isArray(differences) && differences.length === 0) ||
              (!Array.isArray(differences) && Object.keys(differences).length === 0)
            )

            if (hasNoDiff && !cli.force) {
              console.log(`No changes detected for ${toolName}/${variantName}, skipping...`)
              continue
            }

            if (cli.force) {
              differences = baseNew
            }

            console.log(
              `Found changes in ${toolName}/${variantName}:`,
              JSON.stringify(differences, null, 2),
            )

            for (const lang of selectedLanguages) {
              console.log(
                `Updating translations for ${toolName}/${variantName} in ${lang}...`,
              )

              const targetDir = path.join(
                __dirname,
                '..',
                '..',
                'src',
                'i18n',
                'locales',
                lang,
                'variants',
                toolName
              )
              await fs.mkdir(targetDir, { recursive: true })

              const targetFilePath = path.join(targetDir, `${variantName}.json`)

              let existingTranslation = {}
              try {
                const targetContent = await fs.readFile(targetFilePath, 'utf8')
                existingTranslation = JSON.parse(targetContent)
              } catch { }

              const translatedDifferences = await translateDifferences(
                differences,
                lang,
                toolName,
                variantName
              )

              const updatedTranslation = mergeChanges(
                existingTranslation,
                translatedDifferences
              )

              await fs.writeFile(
                targetFilePath,
                JSON.stringify(updatedTranslation, null, 2),
                'utf8'
              )

              console.log(`  ✓ Updated ${targetFilePath}`)
            }
          }
        }
      }
    }

    console.log('\nVariant translation update completed successfully!')
  } catch (error) {
    console.error('Error during variant translation update:', error)
  }
}

// 执行更新
updateVariantTranslations()

