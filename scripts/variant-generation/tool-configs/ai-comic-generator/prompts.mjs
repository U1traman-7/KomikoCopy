/**
 * AI Comic Generator 提示词配置
 */

export const COMIC_PROMPTS = {
  // 基础漫画模板
  baseTemplates: [
    "{character_name}, {setting}, comic book style, {art_style}, {mood}, {composition}, best quality, masterpiece",
    "comic panel, {scene_description}, {art_style}, dramatic lighting, {color_scheme}, professional comic art",
    "{genre} comic, {characters}, {action}, {background}, {visual_style}, detailed artwork",
    "manga style, {character_description}, {emotion}, {setting}, {artistic_elements}, high quality illustration"
  ],

  // 漫画风格
  comicStyles: [
    "manga style", "comic book style", "graphic novel style", "superhero comic art",
    "indie comic style", "webcomic style", "American comic style", "European comic style",
    "digital comic art", "traditional comic art", "noir comic style", "action comic style"
  ],

  // 视觉元素
  visualElements: {
    lighting: [
      "dramatic lighting", "soft lighting", "harsh shadows", "bright lighting",
      "moody lighting", "natural lighting", "artificial lighting", "backlighting"
    ],
    composition: [
      "dynamic composition", "balanced composition", "close-up shot", "wide shot",
      "bird's eye view", "worm's eye view", "medium shot", "extreme close-up"
    ],
    colorSchemes: [
      "vibrant colors", "muted colors", "monochromatic", "high contrast",
      "warm colors", "cool colors", "pastel colors", "bold colors"
    ],
    moods: [
      "heroic", "dramatic", "mysterious", "action-packed", "peaceful",
      "intense", "romantic", "comedic", "dark", "uplifting"
    ]
  },

  // 角色和场景
  characters: {
    superheroes: [
      "caped hero", "masked vigilante", "super soldier", "cosmic guardian",
      "tech hero", "magic user", "speedster", "strength hero"
    ],
    villains: [
      "dark lord", "mad scientist", "criminal mastermind", "alien invader",
      "corrupt politician", "evil sorcerer", "robot overlord", "shadow assassin"
    ],
    civilians: [
      "reporter", "scientist", "police officer", "student", "teacher",
      "doctor", "engineer", "artist", "businessman", "child"
    ]
  },

  // 设定和背景
  settings: [
    "Gotham City", "metropolis", "space station", "alien planet", "underground lair",
    "high school", "laboratory", "rooftop", "alleyway", "courthouse", "hospital",
    "forest", "desert", "ocean", "mountain", "futuristic city", "medieval castle"
  ],

  // 动作场景
  actions: [
    "flying through the sky", "fighting crime", "saving civilians", "investigating mystery",
    "battling villain", "using superpowers", "chasing criminal", "protecting city",
    "discovering secret", "training abilities", "team up", "confronting enemy"
  ],

  // 漫画特定元素
  comicElements: {
    panels: [
      "single panel", "multi-panel sequence", "splash page", "double-page spread",
      "grid layout", "irregular panels", "borderless panels", "overlapping panels"
    ],
    effects: [
      "speed lines", "impact effects", "energy blasts", "explosion effects",
      "motion blur", "sound effects", "thought bubbles", "speech balloons"
    ],
    perspectives: [
      "hero shot", "villain reveal", "action sequence", "emotional moment",
      "establishing shot", "reaction shot", "transformation scene", "battle scene"
    ]
  },

  // 特定主题的提示词
  themePrompts: {
    superhero: [
      "superhero in action, {power} abilities, saving the city, dynamic pose, comic book art",
      "hero vs villain, epic battle, {setting}, dramatic lighting, action comic style",
      "origin story, {character} discovering powers, emotional scene, detailed artwork"
    ],
    manga: [
      "manga character, {emotion}, detailed expression, screen tones, black and white art",
      "manga action scene, {technique}, speed lines, dynamic composition",
      "slice of life manga, {daily_activity}, peaceful scene, detailed backgrounds"
    ],
    fantasy: [
      "fantasy adventure, {magical_creature}, enchanted forest, detailed fantasy art",
      "medieval setting, {hero} with {weapon}, quest scene, epic fantasy style",
      "magic battle, {spell_effects}, mystical atmosphere, fantasy comic art"
    ]
  },

  // 质量标签
  qualityTags: [
    "best quality", "masterpiece", "ultra-detailed", "professional comic art",
    "detailed artwork", "high quality illustration", "vibrant colors",
    "dynamic composition", "detailed backgrounds", "expressive characters"
  ],

  // 生成特定类型的提示词
  generateComicPrompt: function(type, elements) {
    const template = this.baseTemplates[Math.floor(Math.random() * this.baseTemplates.length)]
    const style = this.comicStyles[Math.floor(Math.random() * this.comicStyles.length)]
    const mood = this.visualElements.moods[Math.floor(Math.random() * this.visualElements.moods.length)]

    return template
      .replace('{art_style}', style)
      .replace('{mood}', mood)
      .replace('{composition}', this.visualElements.composition[0])
      .replace('{color_scheme}', this.visualElements.colorSchemes[0])
  },

  /**
   * 生成AI prompt用于动态生成图片prompts
   */
  generateAIPrompt: function(theme, count, variantKey) {
    return `You are an expert comic book art prompt generator specializing in Danbooru tag-based prompts for creating comic book style artwork.

THEME: "${theme}"
TOOL TYPE: AI Comic Generator

**COMIC ART PROMPT STRUCTURE:**
1. **Subject & Scene:** The main focus (characters, action, setting)
2. **Comic Style:** Specify the comic art style (American comics, manga, webcomic, etc.)
3. **Visual Elements:** Panel composition, perspective, mood, color scheme
4. **Quality Tags:** Professional comic art quality indicators

**COMIC STYLE VARIATIONS:**
- **American Comics:** Bold lines, vibrant colors, superhero aesthetics
- **Manga Style:** Screen tones, detailed expressions, dynamic action
- **European Comics:** Detailed backgrounds, realistic proportions
- **Webcomic Style:** Clean digital art, expressive characters
- **Indie Comics:** Unique artistic styles, experimental layouts

**INSTRUCTIONS:**
1. Analyze the theme "${theme}" and generate ${count} unique comic book prompts
2. Each prompt must be a single line of comma-separated tags
3. Focus on storytelling and visual narrative elements
4. Include appropriate comic art style indicators
5. Every prompt must include quality tags like \`professional comic art, detailed artwork, best quality\`

**FORMATTING REQUIREMENTS:**
- Output ONLY the comma-separated tag prompts
- Each prompt on a new line, no numbering
- Use precise Danbooru tags with spaces for multi-word tags

Now, generate ${count} comic book art prompts for the theme "${theme}".`
  }
}

export default COMIC_PROMPTS
