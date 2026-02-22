/**
 * OC Maker 提示词配置
 */

export const OC_PROMPTS = {
  // 基础角色模板
  baseTemplates: [
    "1girl, {hair_color} hair, {eye_color} eyes, {expression}, {universe} style {outfit}, {special_ability}, {pose}, single character, upper body, looking at viewer, anime style, simple background, white background",
    "1boy, {hair_color} hair, {eye_color} eyes, {expression}, {universe} style {clothing}, {weapon_or_tool}, {stance}, single character, upper body, looking at viewer, anime style, simple background, white background",
    "character design, {description}, {universe} aesthetic, {personality_trait}, portrait style, detailed character art, clean background"
  ],

  // 角色外观元素
  appearance: {
    hairColors: [
      "lavender", "silver", "dark blue", "orange", "pink", "black", "blonde", 
      "white", "red", "green", "purple", "teal", "brown", "gray", "auburn"
    ],
    eyeColors: [
      "blue", "green", "gray", "teal", "violet", "brown", "amber", "red", 
      "purple", "gold", "emerald", "sapphire", "crimson", "azure"
    ],
    expressions: [
      "gentle smile", "calm expression", "serious expression", "playful smile", 
      "confident grin", "shy expression", "determined look", "cheerful expression",
      "mysterious smile", "fierce expression", "kind eyes", "adventurous grin"
    ],
    poses: [
      "peaceful pose", "poised stance", "defensive stance", "energetic pose", 
      "confident pose", "dynamic pose", "relaxed stance", "heroic pose",
      "thoughtful pose", "battle-ready stance", "graceful pose", "casual stance"
    ]
  },

  // 宇宙/世界观特定元素
  universes: {
    "genshin-impact": {
      outfits: ["mage outfit", "adventurer clothing", "healer robe", "explorer outfit", "knight armor"],
      abilities: ["elemental magic", "pyro vision", "hydro vision", "anemo vision", "geo vision"],
      accessories: ["elemental orb", "vision", "catalyst", "bow and quiver", "claymore"]
    },
    "naruto": {
      outfits: ["shinobi attire", "ninja clothing", "chunin vest", "ANBU uniform", "casual ninja wear"],
      abilities: ["ninjutsu", "taijutsu", "genjutsu", "kekkei genkai", "chakra control"],
      accessories: ["headband", "scroll", "kunai", "shuriken", "katana"]
    },
    "my-hero-academia": {
      outfits: ["hero costume", "school uniform", "casual hero wear", "support gear", "training outfit"],
      abilities: ["quirk: fire", "quirk: ice", "quirk: telekinesis", "quirk: super strength", "quirk: healing"],
      accessories: ["hero mask", "support items", "utility belt", "communication device"]
    },
    "pokemon": {
      outfits: ["trainer outfit", "gym leader attire", "coordinator dress", "researcher coat", "casual wear"],
      abilities: ["pokemon bond", "aura reading", "pokemon communication", "battle strategy"],
      accessories: ["pokeball", "pokedex", "badge case", "pokemon companion", "trainer bag"]
    }
  },

  // 个性特征
  personalityTraits: [
    "brave and determined", "kind and gentle", "mysterious and wise", "energetic and cheerful",
    "calm and collected", "fierce and protective", "curious and adventurous", "loyal and trustworthy",
    "creative and artistic", "strategic and intelligent", "compassionate and healing", "rebellious and free-spirited"
  ],

  // 特殊能力描述
  specialAbilities: [
    "elemental magic", "healing powers", "super strength", "telekinesis", "time manipulation",
    "shadow control", "light magic", "nature communion", "psychic abilities", "energy projection",
    "shapeshifting", "invisibility", "flight", "enhanced senses", "barrier creation"
  ],

  // 武器和工具
  weaponsTools: [
    "magical staff", "enchanted sword", "bow and arrows", "twin daggers", "shield and spear",
    "grimoire", "crystal orb", "healing herbs", "mechanical gadgets", "musical instrument",
    "throwing knives", "war hammer", "magic wand", "ancient tome", "elemental stones"
  ],

  // 质量和风格标签
  qualityTags: [
    "single character", "upper body", "looking at viewer", "anime style", 
    "simple background", "white background", "detailed character art", 
    "professional artwork", "clean design", "portrait style", "high quality",
    "masterpiece", "best quality", "ultra-detailed"
  ],

  // 主题特定提示词生成器
  generateThemePrompt: function(theme, characterData) {
    const universe = this.universes[theme] || this.universes["genshin-impact"]
    const template = this.baseTemplates[Math.floor(Math.random() * this.baseTemplates.length)]

    return template
      .replace('{hair_color}', characterData.hairColor || this.appearance.hairColors[0])
      .replace('{eye_color}', characterData.eyeColor || this.appearance.eyeColors[0])
      .replace('{expression}', characterData.expression || this.appearance.expressions[0])
      .replace('{universe}', theme.replace('-', ' '))
      .replace('{outfit}', universe.outfits[0])
      .replace('{special_ability}', universe.abilities[0])
      .replace('{pose}', this.appearance.poses[0])
  },

  /**
   * 生成AI prompt用于动态生成图片prompts
   */
  generateAIPrompt: function(theme, count, variantKey) {
    return `You are an expert anime character design prompt generator specializing in Danbooru tag-based prompts for creating original characters (OCs).

THEME: "${theme}"
TOOL TYPE: OC Maker (Original Character Creator)

**CRITICAL PROMPT STRUCTURE:**
1. **Subject Count:** Start with \`1girl\`, \`1boy\`, or appropriate character type
2. **Character Traits:** Hair color, eye color, age, personality traits
3. **Standard Supplements:** Always end with "single character, upper body, looking at viewer, anime style, simple background, white background, best quality, masterpiece"

**SPECIAL CASES:**
- **FOR POKEMON OCs: Start with \`1pokemon\` instead of 1girl/1boy**
- **FOR MY LITTLE PONY OCs: Start with \`pony\` and species type (unicorn, pegasus, earth pony) instead of 1girl/1boy**

**THEME ANALYSIS:**
Analyze "${theme}" to determine:
- If it's a franchise (create OCs that fit that universe)
- If it's a character type/archetype (embody those characteristics)
- If it's a setting/genre (create characters appropriate for that world)

**FORMATTING REQUIREMENTS:**
- Output ONLY the comma-separated tag prompts
- Each prompt on a new line, no numbering
- Use precise Danbooru tags
- Every prompt must end with "single character, upper body, looking at viewer, anime style, simple background, white background, best quality, masterpiece"

Now, generate ${count} original character prompts for the theme "${theme}".`
  }
}

export default OC_PROMPTS
