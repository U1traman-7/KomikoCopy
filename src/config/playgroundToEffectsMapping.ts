/**
 * Playground variant 到 Effects 页面的重定向映射表
 *
 * key: playground variant 的 URL key（对应 src/data/variants/playground/{key}.json）
 * value: effects 页面的 URL slug（对应 /effects/{value}）
 *
 * URL slug 格式：{template-displayName}-{type}
 * 其中 type 为 image / video / expression / dance
 *
 * 注意：
 * 1. 只收录在 effects 模板系统中有对应模板的 playground 页面
 * 2. 没有对应模板的 playground 页面不在此映射中，会继续正常加载
 * 3. 多个 playground 页面可能指向同一个 effects 模板（如 photo-to-anime 和 ai-anime-filter）
 */
export const PLAYGROUND_TO_EFFECTS_MAP: Record<string, string> = {
  // --- Line Art ---
  'photo-to-line-art-converter': 'line-art-image',
  'photo-to-line-art': 'line-art-image',

  // --- Pixel Art / Minecraft ---
  'photo-to-pixel-art': 'pixel-art-image',
  'photo-to-minecraft': 'pixel-art-image',
  'ai-minecraft-generator': 'pixel-art-image',

  // --- Simpsons ---
  'photo-to-simpsons': 'the-simpsons-image',
  'ai-simpsons-generator': 'the-simpsons-image',

  // --- Anime ---
  'photo-to-anime': 'anime-image',
  'ai-anime-filter': 'anime-image',
  'ai-style-transfer': 'anime-image',
  'anime-sticker-maker': 'anime-image',

  // --- Sketch ---
  'photo-to-sketch': 'pencil-sketch-image',

  // --- Lego ---
  'ai-lego-filter': 'lego-image',
  'lego-ai-filter': 'lego-image',

  // --- Watercolor ---
  'watercolor-ai-filter': 'watercolor-image',

  // --- Clay ---
  'ai-clay-filter': 'clay-image',

  // --- Chibi ---
  'ai-emoji-generator': 'chibi-image',
  'emote-maker': 'chibi-image',

  // --- Expression Sheet ---
  'ai-emoticon-generator': 'character-expression-sheet-expression',

  // --- Cosplay ---
  'ai-cosplay-generator': 'cosplay-image',

  // --- Naruto ---
  'naruto-ai-filter': 'naruto-image',

  // --- Cyberpunk ---
  'cyberpunk-filter': 'cyberpunk-image',

  // --- Action Figure ---
  'ai-action-figure-generator': 'action-figure-image',

  // --- Plushie ---
  'ai-plush-generator': 'plushie-image',

  // --- Badge ---
  'ai-badge-generator': 'badge-image',

  // --- Sprite Sheet ---
  'ai-sprite-generator': 'sprite-sheet-image',
  'ai-sprite-sheet-generator': 'sprite-sheet-image',

  // --- Character Sheet ---
  'ai-character-sheet-generator': 'character-sheet-image',

  // --- Sticker ---
  'ai-sticker-generator': 'sticker-image',

  // --- Manga ---
  'ai-manga-filter': 'manga-image',

  // --- Cartoon ---
  'ai-cartoon-generator': 'cartoon-image',

  // --- Comic ---
  'ai-comic-book-filter': 'comic-image',

  // --- Pixar ---
  'pixar-ai-generator': 'pixar-image',

  // --- PS Game ---
  'ps2-ai-filter': 'ps-game-image',

  // --- Pop Art ---
  'ai-pop-art-filter': 'pop-art-image',

  // --- Silhouette ---
  'ai-silhouette-maker': 'silhouette-image',

  // --- Magazine ---
  'magazine-ai-generator': 'magazine-image',
  'ai-magazine-cover-maker': 'magazine-image',

  // --- Caricature ---
  'ai-caricature-maker': 'caricature-image',

  // --- Baby ---
  'baby-filter': 'baby-image',

  // --- Body Transform ---
  'ai-fat-filter': 'chubby-image',
  'ai-skinny-filter': 'skinny-image',

  // --- Aging ---
  'ai-aging-filter': 'elderly-image',

  // --- Hair ---
  'ai-bald-filter': 'bald-image',
  'ai-blonde-hair-filter': 'blonde-hair-image',

  // --- Beard ---
  'ai-beard-filter': 'beard-image',

  // --- Other ---
  'ai-bikini': 'bikini-image',
  'mugshot-generator': 'mugshot-image',
};
