// node v22.x
const fs = require('fs').promises
const path = require('path')
const config = require('../../next.config.mjs')
const { OpenAI } = require('openai')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const gemini_key = 'AIzaSyAgcVUZYmAAHi1VaVof9DagJIqEHIYXX1Y'
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
  // responseModalities: ["image", "text"],
  responseModalities: ['text'],
  thinkingConfig: { thinkingBudget: 0 },
}

const model = genAI.getGenerativeModel({
  // model: "gemini-2.0-flash-preview-image-generation",
  model: 'gemini-3-pro-preview',
  generationConfig
})

// Azure OpenAI configuration
// const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const endpoint = 'https://dalleinstant.openai.azure.com/'
const apiKey =
  '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'
// const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const deploymentName = 'gpt-4o'

// Languages to translate to
// const targetLanguages = ['zh', 'es', 'fr', 'de', 'ja']; // Add or remove languages as needed
// const targetLanguages = config.default.i18n.locales;
// const rawTargetLanguages = ['en', 'zh-CN'];
const rawTargetLanguages = config.default.i18n.locales
// 排除的语言
const excludeLanguages = ['en']
const targetLanguages = rawTargetLanguages.filter(
  (lang) => !excludeLanguages.includes(lang)
)

// const client = new OpenAI({
//   apiKey,
//   // baseURL: endpoint,
//   // dangerouslyAllowBrowser: true
//   timeout: 60 * 60 * 1000
// });

// Initialize Azure OpenAI client
// const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));

async function translateJson(jsonContent, targetLang) {
  // First translation
  const translationPrompt = `将如下json文件翻译为 ${langMap[targetLang]
    }  """ ${JSON.stringify(
      jsonContent,
      null,
      2
    )}"""。像KomikoAI这样的文案不翻译。翻译后的文案最好和英文文案保持相似的长度。要求只返回翻译后的json即可,包裹在\`\`\`json和\`\`\`里。不要添加说明和评论。`

  console.log('translating...')
  // const translationResponse = await client.chat.completions.create({
  //   model: deploymentName,
  //   messages: [{ role: "user", content: translationPrompt }],
  // });
  const translationResponse = await model.generateContent(translationPrompt)
  // console.log('translationResponse', translationResponse)
  // console.log(translationResponse.response.candidates[0].content.parts[0].text)

  // let translatedJson = extractJsonFromResponse(translationResponse.choices[0].message.content);
  let translatedJson = extractJsonFromResponse(
    translationResponse.response.text()
  )
  // Polish the translation
  const polishPrompt = `润色如下的json文件中的文案，使其更符合母语为${langMap[targetLang]
    }的说法"""${JSON.stringify(
      translatedJson,
      null,
      2
    )}"""。要求只返回处理后的json即可，包裹在\`\`\`json和\`\`\`里。不要添加说明和评论。`

  console.log('polishing...')
  // const polishResponse = await client.chat.completions.create({
  //   model: deploymentName,
  //   messages: [{ role: "user", content: polishPrompt }],
  // });
  const polishResponse = await model.generateContent(polishPrompt)

  // return extractJsonFromResponse(polishResponse.choices[0].message.content);
  return extractJsonFromResponse(polishResponse.response.text())
}

function extractJsonFromResponse(response) {
  try {
    // Extract JSON from response wrapped in ```json and ``` markers
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1])
    }
    // Fallback to the previous method if no code block is found
    const fallbackMatch = response.match(/\{[\s\S]*\}/)
    if (fallbackMatch) {
      return JSON.parse(fallbackMatch[0])
    }

    // If no JSON-like structure is found, try parsing the whole response
    return JSON.parse(response)
  } catch (error) {
    console.error('Failed to parse JSON from response:', error)
    console.log('Response content:', response)
    throw error
  }
}

async function copyIndex() {
  const enDir = path.join(__dirname, '..', '..', 'src', 'i18n', 'locales', 'en')
  const indexFilePath = path.join(enDir, 'index.ts')
  const targetDir = path.join(__dirname, '..', '..', 'src', 'i18n', 'locales')
  const targetLanguages = config.default.i18n.locales
  for (const lang of targetLanguages) {
    const targetFilePath = path.join(targetDir, lang, 'index.ts')
    await fs.copyFile(indexFilePath, targetFilePath)
  }
}

async function processFiles() {
  try {
    // Read all English JSON files
    const enDir = path.join(
      __dirname,
      '..',
      '..',
      'src',
      'i18n',
      'locales',
      'en'
    )
    const files = await fs.readdir(enDir)
    const jsonFiles = files.filter((file) => file.endsWith('.json'))

    console.log(`Found ${jsonFiles.length} JSON files to translate`)

    // Process each file for each language
    for (const lang of targetLanguages) {
      console.log(`Processing translations for language: ${lang}`)

      // Create target directory if it doesn't exist
      const targetDir = path.join(
        __dirname,
        '..',
        '..',
        'src',
        'i18n',
        'locales',
        lang
      )
      await fs.mkdir(targetDir, { recursive: true })

      for (const file of jsonFiles) {
        const filePath = path.join(enDir, file)
        const targetFilePath = path.join(targetDir, file)

        // Check if file exists before translating
        try {
          await fs.access(targetFilePath)
          console.log(`${file} already exists in ${lang}, skipping...`)
          continue
        } catch (error) {
          // File doesn't exist, proceed with translation
          console.log(`Translating ${file} to ${lang}...`)

          const content = await fs.readFile(filePath, 'utf8')
          const jsonContent = JSON.parse(content)

          // Translate and polish
          const translatedJson = await translateJson(jsonContent, lang)

          // Write to target file
          await fs.writeFile(
            targetFilePath,
            JSON.stringify(translatedJson, null, 2),
            'utf8'
          )

          console.log(`  ✓ Saved to ${targetFilePath}`)
        }
      }
    }

    console.log('Translation completed successfully!')
  } catch (error) {
    console.error('Error during translation process:', error)
  }
  copyIndex()
}

// Execute the translation process
if (require.main === module) {
  processFiles()
}

module.exports = {
  translateJson,
  extractJsonFromResponse,
  langMap,
  genAI,
  model
}
