/**
 * AI Anime Generator 提示词配置
 */

export const ANIME_PROMPTS = {
  // 基础提示词模板
  baseTemplates: [
    "1girl, {character_description}, {setting}, {art_style}, masterpiece, best quality",
    "1boy, {character_description}, {action}, {environment}, {art_style}, highly detailed",
    "2girls, {character1}, {character2}, {interaction}, {mood}, {art_style}, vibrant colors",
    "{scene_description}, {art_style}, atmospheric lighting, high quality render"
  ],

  // 角色描述元素
  characterElements: {
    hairColors: ["silver hair", "blue hair", "pink hair", "blonde hair", "black hair", "white hair", "red hair", "purple hair"],
    eyeColors: ["blue eyes", "green eyes", "red eyes", "purple eyes", "golden eyes", "amber eyes", "gray eyes"],
    expressions: ["gentle smile", "serious expression", "cheerful expression", "determined look", "peaceful expression"],
    clothing: ["school uniform", "casual clothes", "fantasy outfit", "traditional clothing", "modern attire"]
  },

  // 场景和环境
  settings: [
    "flower field during sunset",
    "cherry blossom garden",
    "modern city street",
    "fantasy forest",
    "peaceful meadow",
    "mountain peak",
    "seaside cliff",
    "ancient temple",
    "cozy room",
    "starry night sky"
  ],

  // 艺术风格
  artStyles: [
    "anime style",
    "watercolor style",
    "manga style",
    "cel-shaded style",
    "traditional ink art",
    "digital art style",
    "fantasy art style",
    "cartoon style",
    "pastel colors",
    "vibrant colors"
  ],

  // 动作和姿势
  actions: [
    "sitting peacefully",
    "standing confidently",
    "walking through",
    "looking at viewer",
    "meditating",
    "reading a book",
    "playing music",
    "training",
    "exploring",
    "relaxing"
  ],

  // 质量标签
  qualityTags: [
    "masterpiece",
    "best quality",
    "highly detailed",
    "ultra-detailed",
    "professional artwork",
    "high resolution",
    "vibrant colors",
    "atmospheric lighting",
    "detailed background",
    "perfect composition"
  ],

  // 特定主题的提示词
  themePrompts: {
    pokemon: [
      "Pokemon trainer, {character}, {pokemon_companion}, adventure scene, anime style",
      "Pokemon battle, {trainer1}, {trainer2}, dynamic action, colorful effects",
      "Pokemon center, peaceful scene, {character}, healing Pokemon, warm atmosphere"
    ],
    genshin: [
      "Genshin Impact character, {element} vision, {region} background, detailed outfit",
      "Teyvat landscape, {character}, elemental magic, fantasy adventure",
      "Genshin style, {character}, combat pose, elemental effects"
    ],
    naruto: [
      "Ninja character, {village} headband, {jutsu} technique, action scene",
      "Hidden village, {character}, training ground, determined expression",
      "Shinobi mission, {team}, forest setting, stealth action"
    ]
  },

  /**
   * 生成AI prompt用于动态生成图片prompts
   */
  generateAIPrompt: function(theme, count, variantKey) {
    return `You are an expert Danbooru prompt generator. Your task is to generate a list of high-quality, comma-separated Danbooru tags based on a given theme.

THEME: "${theme}"
TOOL TYPE: AI Anime Generator

**DANBOORU PROMPT BEST PRACTICES:**
A good prompt is a well-structured, comma-separated list of tags. The structure should generally be:
1. **Subject & Demographics:** The main focus. For characters, ensure a wide variety of ages and genders.
2. **Composition & Character Tags:** Details about the subject and how it's framed.
3. **Style & Theme Tags:** The core artistic style and thematic elements.
4. **Quality Tags:** To enhance image fidelity (e.g., \`masterpiece\`, \`best quality\`, \`ultra-detailed\`).
5. **Lighting & Color Tags:** To set the mood.

**INSTRUCTIONS:**
1. Analyze the theme "${theme}" and generate ${count} unique, high-quality Danbooru prompts
2. Each prompt must be a single line of comma-separated tags
3. Diversify characters with various ages and genders
4. Focus on creating visually appealing anime-style artwork
5. Every prompt must include quality tags like \`masterpiece, best quality\`

**FORMATTING REQUIREMENTS:**
- Output ONLY the prompts
- Each prompt on a new line, no numbering
- Use precise Danbooru tags with spaces for multi-word tags

Now, generate ${count} prompts for the theme "${theme}".`
  }
}

export default ANIME_PROMPTS
