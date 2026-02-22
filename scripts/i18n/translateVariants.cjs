// node v22.x
const fs = require('fs').promises
const path = require('path')
const config = require('../../next.config.mjs')
const { GoogleGenerativeAI } = require('@google/generative-ai')

const gemini_key = process.env.GEMINI_API_KEY
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
};

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

// 预处理函数：移除不需要翻译的 key
function preprocessData(data) {
  const extractedData = {}

  function extractKeys(obj, path = '') {
    if (typeof obj !== 'object' || obj === null) return obj

    if (Array.isArray(obj)) {
      return obj.map((item, index) => extractKeys(item, `${path}[${index}]`))
    }

    const processed = {}
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key

      if (excludedKeys.includes(key)) {
        // 保存排除的 key 和值
        extractedData[currentPath] = value
        // 不包含在处理的数据中
        continue
      }

      processed[key] = extractKeys(value, currentPath)
    }

    return processed
  }

  const processedData = extractKeys(data)
  return { processedData, extractedData }
}

// 后处理函数：恢复不需要翻译的 key
function postprocessData(translatedData, extractedData) {
  function restoreKeys(obj, path = '') {
    if (typeof obj !== 'object' || obj === null) return obj

    if (Array.isArray(obj)) {
      return obj.map((item, index) => restoreKeys(item, `${path}[${index}]`))
    }

    const result = { ...obj }

    // 恢复当前路径下的排除 key
    for (const [extractedPath, value] of Object.entries(extractedData)) {
      const pathParts = extractedPath.split('.')
      const keyName = pathParts[pathParts.length - 1]
      const parentPath = pathParts.slice(0, -1).join('.')

      if (parentPath === path && excludedKeys.includes(keyName)) {
        result[keyName] = value
      }
    }

    // 递归处理子对象
    for (const [key, value] of Object.entries(result)) {
      const currentPath = path ? `${path}.${key}` : key
      result[key] = restoreKeys(value, currentPath)
    }

    return result
  }

  return restoreKeys(translatedData)
}

// 翻译所有支持的语言（除了英文）
const targetLanguages = [
  'zh-CN', 'zh-TW', 'es', 'fr', 'de', 'ja', 'id', 'pt', 'ru', 'ko', 'vi', 'th', 'hi'
]

// 不需要翻译的 key 列表
const excludedKeys = [
  'defaultStyle',
  'placeholderText',
  'xposts'
]


async function translateVariantContent(
  variantData,
  targetLang,
  toolName,
  variantName,
) {
  // 预处理数据：移除不需要翻译的 key
  const { processedData, extractedData } = preprocessData(variantData)



  const translationPrompt = `将如下json文件翻译为 ${langMap[targetLang]} """ ${JSON.stringify(processedData, null, 2)}"""。像KomikoAI这样的文案不翻译。翻译后的文案最好和英文文案保持相似的长度。要求只返回翻译后的json即可,包裹在\`\`\`json和\`\`\`里。不要添加说明和评论。`

  console.log(
    `Translating ${toolName}/${variantName} content to ${targetLang}...`,
  )

  const translationResponse = await model.generateContent(translationPrompt)
  let translatedContent = extractJsonFromResponse(
    translationResponse.response.text()
  )

  const polishPrompt = `润色如下的json文件中的文案，使其更符合母语为${langMap[targetLang]}的说法"""${JSON.stringify(translatedContent, null, 2)}"""。要求只返回处理后的json即可，包裹在\`\`\`json和\`\`\`里。不要添加说明和评论。`

  console.log(
    `Polishing ${toolName}/${variantName} content for ${targetLang}...`
  )
  const polishResponse = await model.generateContent(polishPrompt)
  const polishedContent = extractJsonFromResponse(
    polishResponse.response.text(),
  )

  const finalContent = postprocessData(polishedContent, extractedData)

  return finalContent
}

function extractJsonFromResponse(response) {
  try {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1])
    }
    const fallbackMatch = response.match(/\{[\s\S]*\}/)
    if (fallbackMatch) {
      return JSON.parse(fallbackMatch[0])
    }
    return JSON.parse(response)
  } catch (error) {
    console.error('Failed to parse JSON from response:', error)
    console.log('Response content:', response)
    throw error
  }
}

// 检查是否使用分离文件结构
async function usesSeparateFiles() {
  const variantsDir = path.join(
    __dirname,
    '..',
    '..',
    'src',
    'data',
    'variants'
  )
  try {
    await fs.access(path.join(variantsDir, 'index.json'))
    return true
  } catch {
    return false
  }
}

// 加载variant数据
async function loadVariantData() {
  const hasSeparateFiles = await usesSeparateFiles()

  if (hasSeparateFiles) {
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
      const toolDir = path.join(variantsDir, tool.key)

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

async function processVariants() {
  try {
    // 加载variant数据
    const variantPages = await loadVariantData()

    for (const toolName of Object.keys(variantPages)) {
      const tool = variantPages[toolName]

      if (!tool.variants) continue

      for (const variantName of Object.keys(tool.variants)) {
        const variant = tool.variants[variantName]

        // 为每种语言生成翻译
        for (const lang of targetLanguages) {
          console.log(
            `Processing ${toolName}/${variantName} for language: ${lang}`
          )

          // 创建目标目录
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

          // 检查是否已存在翻译文件
          const targetFilePath = path.join(targetDir, `${variantName}.json`)

          try {
            await fs.access(targetFilePath)
            console.log(
              `${toolName}/${variantName}.json already exists in ${lang}, skipping...`
            )
            continue
          } catch (error) {
            // 文件不存在，进行翻译
            try {
              const translatedContent = await translateVariantContent(
                variant,
                lang,
                toolName,
                variantName
              )

              // 保存翻译结果
              await fs.writeFile(
                targetFilePath,
                JSON.stringify(translatedContent, null, 2),
                'utf8'
              )

              console.log(`  ✓ Saved to ${targetFilePath}`)

              // 添加延迟避免API限制
              await new Promise((resolve) => setTimeout(resolve, 1000))
            } catch (translateError) {
              console.error(
                `❌ Failed to translate ${toolName}/${variantName} to ${lang}:`,
                translateError.message
              )
              continue
            }
          }
        }
      }
    }

    console.log('Variant translation completed successfully!')
  } catch (error) {
    console.error('Error during variant translation:', error)
  }
}

// 执行翻译
processVariants()
