import { createClient } from '@supabase/supabase-js';

export interface StyleInfo {
  prompt: string;
  changeType?: string;
  model?: string;
  needVip?: boolean;
  needMiddleware?: boolean;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type PromptVariables = {
  language?: string;
  characterName?: string;
  occupation?: string;
  info?: string;
  // Support for arbitrary custom fields
  [key: string]: any;
};

// Cache for database prompts
let cachedPrompts: { [key: string]: StyleInfo } | null = null;

// Helper function to clean template ID suffix (-v or -i)
const cleanTemplateId = (id: string): string => {
  return id.replace(/-(v|i)$/, '');
};

// Helper function to substitute variables in prompt
const substitutePromptVariables = (
  prompt: string,
  variables?: PromptVariables,
): string => {
  if (!variables) return prompt;

  // Extract known variables for backward compatibility
  const { language, characterName, occupation, info, ...dynamicVariables } =
    variables;
  let result = prompt;

  // Handle backward compatibility variables
  if (language) {
    result = result.replace(/\$\{language\}/g, language);
    result = result.replace(/\{language\}/g, language);
    result = result.replace(/\$\$language\$\$/g, language);
  }
  if (characterName) {
    result = result.replace(/\$\{characterName\}/g, characterName);
    result = result.replace(/\{characterName\}/g, characterName);
    result = result.replace(/\$\$characterName\$\$/g, characterName);
  }
  if (occupation) {
    result = result.replace(/\$\{occupation\}/g, occupation);
    result = result.replace(/\{occupation\}/g, occupation);
    result = result.replace(/\$\$occupation\$\$/g, occupation);
  }
  if (info) {
    result = result.replace(/\$\{info\}/g, info);
    result = result.replace(/\{info\}/g, info);
    result = result.replace(/\$\$info\$\$/g, info);
  }

  // Handle dynamic variables
  Object.keys(dynamicVariables).forEach(key => {
    const value = dynamicVariables[key];
    if (value != null && value !== '') {
      let replacementValue = String(value);

      // Support multiple placeholder formats: ${key}, {{key}}, {key}, $$key$$
      // Also handle keys with spaces by escaping special regex characters
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const placeholderPatterns = [
        new RegExp(`\\$\\{${escapedKey}\\}`, 'g'),
        new RegExp(`\\$\\$${escapedKey}\\$\\$`, 'g'),
        new RegExp(`{{${escapedKey}}}`, 'g'),
        new RegExp(`{${escapedKey}}`, 'g'),
      ];

      placeholderPatterns.forEach(pattern => {
        result = result.replace(pattern, replacementValue);
      });
    }
  });

  return result;
};

// Function to get prompts from database (server-side only)
const getPromptsFromDB = async () => {
  if (cachedPrompts) {
    return cachedPrompts;
  }

  try {
    // Fetch directly from Supabase
    const { data, error } = await supabase
      .from('style_templates')
      .select('id, prompt, need_middleware');

    if (error) {
      throw error;
    }

    const prompts: { [key: string]: StyleInfo } = {};
    for (const row of data || []) {
      const cleanId = cleanTemplateId(row.id);
      prompts[cleanId] = {
        ...row.prompt,
        needMiddleware: row.need_middleware,
      };
    }

    cachedPrompts = prompts;
    return cachedPrompts;
  } catch (error) {
    console.error('Failed to fetch prompts from database:', error);
    return null;
  }
};

// Style template mappings with categories
export const getStyleInfo = async (
  style: string,
  variables?: PromptVariables,
) => {
  // Try to get from database first - TEMPORARILY DISABLED FOR TESTING
  const dbPrompts = await getPromptsFromDB();
  if (dbPrompts && dbPrompts[style]) {
    // dbPrompts[style] is a JSONB object containing prompt, changeType, model, needVip, etc.
    const styleData = dbPrompts[style];
    const prompt = substitutePromptVariables(styleData.prompt, variables);

    return {
      prompt,
      changeType: styleData.changeType,
      model: styleData.model,
      needVip: styleData.needVip,
      needMiddleware: styleData.needMiddleware,
    };
  }

  return getStyleInfoStatic(style, variables);
};

// Keep original function as fallback
const getStyleInfoStatic = (style: string, variables?: PromptVariables) => {
  const styleData: {
    [key: string]: StyleInfo;
  } = {
    'miku-cosplay': {
      prompt:
        "Completely replace the character's full body with the anime character Hatsune Miku, keep the pose and portion of Hatsune Miku the same as the original image.",
    },
    'naruto-cosplay': {
      prompt:
        "Completely replace the character's full body with the anime character Naruto Uzumaki, keep the pose and portion of Naruto Uzumaki the same as the original character",
    },
    'sailor-moon-cosplay': {
      prompt:
        "Completely replace the character's full body with the anime character Sailor Moon, keep the pose and portion of Sailor Moon the same as the original image.",
    },
    'goku-cosplay': {
      prompt:
        'Make the actor dress in character costume as if they are cosplaying the iconic anime character Goku.',
      changeType: 'cosplay',
    },
    princess: {
      prompt:
        'Dress the character(s) like prince/princess and change to a  royal setting. Keep the pose the same as the original scene',
    },
    kimono: {
      prompt:
        "Change the character(s)' clothing into a traditional Japanese kimono or summer yukata, place the character(s) in a traditional Japanese setting",
      changeType: 'clothing',
    },
    superhero: {
      prompt:
        'Cosplay the character(s) in superhero outfit and change the environment to a superhero setting',
      changeType: 'outfit and style',
    },
    'captain-american': {
      prompt:
        'Cosplay the character(s) as Captain American, keep the character(s) pose and portion of the image unchanged',
      changeType: 'cosplay',
    },
    maleficent: {
      prompt:
        'Cosplay the character(s) as Maleficent and dress as Maleficent, keep the character(s) pose and portion of the image unchanged',
    },
    'magical-girl': {
      prompt:
        'Dress the character(s) in anime magical girl/boy costume, convert the character(s) to anime style and change the setting to isekai world. Make sure the pose and the portion of the character(s) is the same as the original image',
    },
    tinkerbell: {
      prompt:
        'Dress the character(s) as Tinker Bell, wear the same outfit as Tinker Bell',
      changeType: 'cosplay',
    },
    vampire: {
      prompt:
        'Change outfit and add pale makeup to cosplay as vampire. Keep the pose the same as the original scene',
    },
    werewolf: {
      prompt:
        'Change outfit to cosplay as aggressive werewolf. Keep the pose the same as the original scene',
    },
    robot: {
      prompt:
        'Convert the character(s) to a cybernetic mecha girl/boy in white robotic armor while preserving the face of the original character(s)',
      changeType: 'cosplay',
    },
    angel: {
      prompt:
        'Cosplay the character(s) as angel wearing white robe with large white wings and halo, surrounded by fluffy clouds in the sky. The character(s) should have the same pose as the original image',
      changeType: 'cosplay',
    },
    zombie: {
      prompt:
        'Cosplay the character(s) as a zombie in an apocalyptic setting, with good lighting and clear visibility and detailed surroundings',
      changeType: 'cosplay',
    },

    // hogwarts: {
    //   prompt: "Change the character's outfit into a Hogwarts school uniform",
    //   changeType: 'outfit',
    // },
    cowboy: {
      prompt:
        'Dress the same character(s) as cowboy and change the setting to a ranch',
      changeType: 'outfit',
    },
    'sailor-uniform': {
      prompt:
        'Dress the character(s) in anime sailor uniform, turn the scene into anime style. Keep the pose and the portion of the character(s) the same as the original image',
    },
    pirate: {
      prompt:
        'Cosplay the character(s) as pirate wearing eye patch with pirate ship in the background',
      changeType: 'cosplay',
    },
    medieval: {
      prompt:
        'Dress the character(s) in medieval outfit and change the environment to medieval setting',
      changeType: 'cosplay',
    },
    knight: {
      prompt: `Cosplay the character(s) as a detailed medieval knight wearing steel armor. The character(s) face is shown. Render the environment as a grand medieval setting. The character pose should be the same as the original image.`,
      changeType: 'cosplay',
    },
    goblin: {
      prompt: 'Cosplay the character(s) as a Goblin',
      changeType: 'cosplay',
    },
    mugshot: {
      prompt: 'Convert it to a mugshot.',
    },
    bikini: {
      prompt: 'Make the character dress in sexy bikini.',
    },

    // Style
    anime: {
      prompt: 'Japanese anime style',
      model: 'flux-kontext-pro',
    },
    'ghibli-anime': {
      prompt:
        'Convert to Studio Ghibli anime screencap style with big eyes and flat colors',
      model: 'flux-kontext-pro',
    },
    'korean-manhwa': {
      prompt: 'Convert to Korean manhwa drawing art style',
      model: 'flux-kontext-pro',
    },
    cartoon: {
      prompt: 'Convert to American cartoon art style',
    },
    manga: {
      prompt: 'Convert to black and white Japanese manga drawing style',
    },
    clay: {
      prompt: 'claymation style',
      changeType: 'style',
      model: 'flux-kontext-pro',
    },
    vaporwave: {
      prompt: 'vaporwave style',
      changeType: 'style',
      needVip: true,
    },
    'digital-illustration': {
      prompt:
        'Convert to modern digital illustration art style with vivid, high-contrast colors, flat coloring, cel shading, sunset palette, minimal linework, and large color areas',
    },
    comic: {
      prompt: 'American comic style',
      model: 'flux-kontext-pro',
    },
    pixar: {
      prompt:
        'Render the scene in a vibrant, cartoonish Pixar-style 3D animation, with rich computer-generated detail and highly exaggerated facial expressions for maximum character appeal.',
      changeType: 'style',
    },
    'x-ray': {
      prompt:
        'Put the scene under X-ray effect. Humans become transparent skeleton against the dark background',
      changeType: 'style',
    },
    'pencil-sketch': {
      prompt:
        'Make the image a monochromatic pencil sketch with cross-hatching for shading',
      changeType: 'style',
    },
    'neon-sign': {
      prompt:
        'Transform the entire scene into glowing neon sign art — all characters and objects outlined in vibrant neon lines against a deep black background, with bold, luminous colors creating a striking, high-contrast effect',
      changeType: 'style',
    },
    'retro-game': {
      prompt:
        'Transform into a bright color pixel art-style game interface, inspired by retro games like arcade or SNES-style graphics. Convert the original image into large pixels. Include dynamic retro game UI elements. Render in pixel art style',
    },
    'mobile-game': {
      prompt:
        'Transform this scene into a mobile game interface with a clean and cartoon art style. Use stylized graphics with smooth shading. Add well-designed large UI elements and large game buttons suitable for this game',
      changeType: 'style',
    },
    'ps-game': {
      prompt: 'Turn the scene into a PlayStation game with game UI and buttons',
      changeType: 'style',
    },
    'western-animation': {
      prompt: 'Turn the image into American 2d animation style',
      changeType: 'style',
    },
    watercolor: {
      prompt: 'Convert to classic watercolor art style',
    },
    'van-gogh': {
      prompt: 'Turn the scene into a Van Gogh illustration.',
      changeType: 'style',
    },
    'oil-painting': {
      prompt: 'Turn the scene into an oil painting',
      changeType: 'style',
    },

    // Change Environment
    apocalypse: {
      prompt:
        'Change the background to a post-apocalyptic wasteland with crumbling buildings, swirling dust clouds. Dress the character(s) in tattered, worn-out clothes',
      changeType: 'background',
    },
    // 'magical-world': {
    //   prompt: 'change the background to a whimsical magical world',
    //   changeType: 'background',
    // },
    // dreamland: {
    //   prompt: 'Change the environment to a surreal dreamscape',
    //   changeType: 'environment',
    // },
    cyberpunk: {
      prompt:
        'Render the scene in a cyberpunk style with a teal-blue and purple palette, neon lights. The scene is bright and everything is clearly visible.',
      changeType: 'background',
    },
    'kpop-idol': {
      prompt:
        'Transform into a glamorous K-pop idol performing live on stage. The character(s) should wear an well-designed  idol concert costume. Surround them with dynamic concert lighting: colorful spotlights, backlighting, and stage glow. Add subtle makeup, glowing skin, and styled hair suited for a K-pop performance. Maintain the same pose and body position',
      changeType: 'environment',
    },
    cloud: {
      prompt:
        'Make main human/object appear to be on soft, fluffy clouds in the sky. Keep the pose and image composition exactly the same as the input image',
      changeType: 'background',
    },
    underwater: {
      prompt:
        'Reimagine the entire scene as if it takes place underwater. The character(s) should be wearing snorkel. Light rays filtering through the surface above. Include swimming fish, drifting sea grass, and soft bubbles rising through the water. Make sure the scene is bright enough to be clearly visible',
      changeType: 'background',
    },
    mars: {
      prompt:
        'Change the environment to the surface of Mars — place all humans and objects on the red, rocky Martian terrain with dusty ground, scattered boulders, and distant hills. Add a reddish-orange sky with subtle atmospheric haze. Replace any buildings or structures from the background of the original image with scifi human settlements on Mars. The character(s) should be wearing space helmet',
      changeType: 'background',
    },
    'outer-space': {
      prompt:
        'Change the environment to outer space, with extremely massive giant planet, spacecraft, and spaceship visible in background. The character(s) should wear space suit. Remove any ground or floor elements. Instead of a pitch-black background, add enough sci-fi lighting so the scene is bright enough to be visible',
    },
    snow: {
      prompt:
        'Turn it into a snowing scene where snow is visible everywhere and large snow covering the ground.',
      changeType: 'background',
    },

    // Change Material
    'toy-bricks': {
      prompt: 'Turn the characters and scenes into Lego toy bricks',
      changeType: 'material',
      model: 'flux-kontext-pro',
    },
    'toy-bricks-v2': {
      prompt:
        'Analyze the uploaded photo and reimagine the primary object as an isometric brick-built diorama. Reconstruct it from studded plastic bricks, plates, tiles, and slopes; do not paste the original photo—render a new 3D brick scene. Keep the building’s overall proportions and signature details, but stylize them with clean brick geometry (visible studs on horizontal surfaces, tiled areas for smooth highlights, limited SNOT only where it clarifies form). Exclude people, vehicles, signage, and text; keep only the building and essential site elements. Use a 3/4 isometric camera with gentle tilt-shift depth of field; light with soft studio illumination, clean shadows, and subtle ambient occlusion in brick seams. Material should read as glossy ABS plastic with mild specular highlights and tiny edge bevels—no real-world textures. Place the structure on a small floating baseplate slice that matches the site (brick grass/stone/pavement patterns) with a simple sky gradient background. Use a faithful but slightly saturated palette for a polished, toy-like look. Do not use any logos or proprietary prints. Output one clean image—no UI, no captions, no watermarks',
    },
    skeleton: {
      prompt:
        'Turn the characters into skeleton with pose same as the original image',
      changeType: 'material',
      model: 'flux-kontext-pro',
    },
    fire: {
      prompt:
        'Add strong fire burning effect to characters, keep the environment unchanged.',
      changeType: 'material',
    },
    // ice: {
    //   prompt: "Add extremely strong frozen ice to the character's body",
    //   changeType: 'material',
    // },
    muscle: {
      prompt:
        'Turn the character(s) into a anatomical muscle model with clothes removed and all red muscle and tendon and sinew all exposed. Use anime art style. Keep the character(s) identity, facial features, clothes and pose the same as the original image',
      changeType: 'material',
      model: 'flux-kontext-pro',
    },
    metal: {
      prompt:
        'Reimagine the entire scene with all characters and objects made of bright metal',
      changeType: 'material',
      model: 'flux-kontext-pro',
    },
    // crystal: {
    //   prompt:
    //     'Reimagine the entire scene with all characters and animals made of semi-transparent bright and shiny crystal with pose same as the original image',
    //   changeType: 'material',
    // },
    playdoh: {
      prompt: 'Change the character(s) to be made of colorful Play Doh',
      changeType: 'material',
      model: 'flux-kontext-pro',
    },
    yarn: {
      prompt:
        'Transform all characters(s) and objects into soft, colorful yarn creations',
      changeType: 'material',
      model: 'flux-kontext-pro',
    },
    marble: {
      prompt:
        'Turn character(s) into bright, polished marble statues while keeping their original poses',
      changeType: 'material',
      model: 'flux-kontext-pro',
    },

    // game render
    gta: {
      prompt:
        'Render the scene in the style of the video game Grand Theft Auto IV with gritty color palette',
      changeType: 'style',
    },
    'call-of-duty': {
      prompt:
        'Render the scene in the style of the video game Call of Duty: Modern Warfare, convert the character(s) to fully-masked soldier. The scene is well-lit and bright enough and everything is clearly visible',
      changeType: 'style',
    },
    minecraft: {
      prompt:
        'Convert the image into Minecraft game style with the character(s) made of large blocks and character head also being a block',
    },
    'the-legend-of-zelda': {
      prompt:
        'Render the scene in the style of the video game The Legend of Zelda',
    },

    // movie
    'harry-potter': {
      prompt:
        'Cosplay the character(s) in Hogwarts school uniform and change the environment to Hogwarts',
      changeType: 'cosplay',
    },
    barbie: {
      prompt:
        'Turn the character(s) to beautiful Barbie doll dressing in pink and change the environment to the Barbie world',
    },
    'star-wars': {
      prompt:
        'Cosplay the character(s) as a Star Wars character(s) while preserving their facial identity. Transform the environment into Star Wars setting',
      changeType: 'cosplay',
    },
    avatar: {
      prompt:
        'Cosplay the character(s) as a Na’vi from Avatar while preserving their facial identity — blue skin, bioluminescent patterns, and traditional Na’vi attire. Transform the environment into the planet Pandora in daylight',
      changeType: 'cosplay',
    },
    dune: {
      prompt:
        'Render the scene in the style of the movie Dune, with its vast desert landscapes, dramatic lighting, and muted, sandy color palette. Dress the character(s) as a Dune character(s), featuring flowing desert robes, layered fabric, and a stillsuit-inspired design, complete with subtle futuristic details',
      changeType: 'style',
    },
    'the-lord-of-the-rings': {
      prompt:
        'Cosplay the character(s) in detailed Middle-earth attire as if they belong in The Lord of the Rings universe. Transform the environment into an iconic LOTR setting with misty mountains, lush forests, ancient ruins, or the Shire’s rolling green hills, all with cinematic, high-fantasy lighting',
      changeType: 'cosplay',
    },
    frozen: {
      prompt:
        'Transform the character(s) into a Disney princess or prince inspired by Frozen. Dress them in elegant icy-themed attire — shimmering blues, silvers, and snowflake patterns — with flowing capes or dresses that sparkle in the light. Change the environment to a magical snow-covered kingdom with towering ice castles, frosted trees, and softly falling snow. Bathe the scene in cool, ethereal lighting with hints of glistening frost on every surface',
      changeType: 'cosplay',
    },

    // anime world
    'cat-girl': {
      prompt:
        'Turn the character(s) into anime cat girl/boy with cat ears and cat tail',
      changeType: 'cosplay',
    },
    maiden: {
      prompt:
        'Change the character(s) to anime maid wearing a traditional anime maid outfit, while keeping the background environment unchanged',
    },
    'bunny-girl': {
      prompt:
        'Transform the character(s) into an anime-style bunny girl/boy wearing a anime bunny girl black sleeveless bodysuit with a sweetheart neckline. Add white cuffs, a collar with a bowtie, tall glossy bunny ears, and a fluffy tail, and black stockings. Maintain character’s original pose and facial identity',
    },
    'fox-girl': {
      prompt:
        'Add large fox ears and fox tail and convert the character(s) to anime style',
    },
    'wolf-girl': {
      prompt:
        'Add handsome and ferocious wolf ears and wolf tail and convert the character(s) to anime style',
    },
    elf: {
      prompt: 'Turn the character(s) into anime elf girl/boy with elf ears',
      changeType: 'cosplay',
    },
    idol: {
      prompt:
        'Turn the character(s) into anime idol and change the environment to stage. Keep the character pose the same as the original image',
    },
    'mecha-pilot': {
      prompt:
        'Convert the character(s) to anime cybernetic mecha girl/boy in robotic armor, convert the character(s) to anime style',
    },
    samurai: {
      prompt:
        'Transform the character(s) into an anime-style samurai wearing layered kimono, armored chest plate, and waist sash with katana. Change the environment to a daylight samurai setting',
      changeType: 'cosplay',
    },
    ninja: {
      prompt:
        'Transform the character(s) into an anime-style Ninja wearing stealthy black outfit, kunai, hidden face mask. Change the environment to a daylight setting that enhances the ninja theme',
      changeType: 'cosplay',
    },

    christmas: {
      prompt:
        'Dress the character(s) in Christmas colors and convert the environment to a Christmas setting',
      changeType: 'environment',
    },
    'wizarding-world': {
      prompt:
        'Dress the character(s) in wizard outfit and transform the scene into a magical wizarding world',
      changeType: 'environment',
    },
    heaven: {
      prompt:
        'Transform the environment into a radiant heavenly realm — clouds of pure white and gold stretching endlessly, bathed in warm, ethereal light. Golden rays stream from above, illuminating angelic architecture with shimmering details. The air glows softly with sparkles, and everything feels serene and divine',
      changeType: 'environment',
    },
    hell: {
      prompt:
        'Transform the environment into a fiery hellscape — rivers of lava, molten rock, and burning flames consuming everything in sight. The ground should be scorched and cracked, with glowing embers drifting through the smoky, ash-filled air',
      changeType: 'environment',
    },

    // Replace Character
    miku: {
      prompt: 'Replace the character with Hatsune Miku',
    },
    'sailor-moon': {
      prompt:
        'Completely replace the character with the anime character Sailor Moon',
    },
    naruto: {
      prompt:
        'Completely replace the character with the anime character Naruto Uzumaki',
    },
    'monkey-d-luffy': {
      prompt:
        "Completely replace the character's full body with the anime character Monkey D. Luffy from One Piece, keep the pose and portion of Monkey D. Luffy the same as the original character",
    },
    goku: {
      prompt:
        "Completely replace the character's full body with the anime character Goku from Dragon Ball, keep the pose and portion of Goku the same as the original character.",
    },
    'gojo-satoru': {
      prompt:
        "Completely replace the character's full body with the anime character Gojo Satoru from Jujutsu Kaisen, keep the pose and portion of Gojo Satoru the same as the original character",
    },
    'ios-emoji': {
      prompt:
        'Remove background and convert the image to 3D Apple iOS memoji sticker-style. Keep the pose and the portion of the human in the image the same as the original image',
    },
    'the-simpsons': {
      prompt:
        'Change the character(s) to The Simpsons style character(s), while keeping the background environment unchanged, the same as the original real world scene',
    },
    'rick-and-morty': {
      prompt:
        'Change the character(s) to Rick and Morty style character(s), while keeping the background environment unchanged, the same as the original real world scene',
    },
    'south-park': {
      prompt:
        'Change the character(s) to the dramatic South Park style character(s), while keeping the background environment unchanged',
    },
    'anime-character': {
      prompt:
        'Only change the character(s) to anime style character(s), while keeping the background environment unchanged, the same as the original real world scene',
    },
    cyborg: {
      prompt:
        'Cosplay the character(s) as cyborg with robotic body and black robot arms',
    },

    // Animal Transformations
    beagle: {
      prompt:
        'Replace the human head and neck with a Beagle dog head that naturally blends with the body, as if it grew there',
    },
    poodle: {
      prompt:
        'Replace the human head and neck with a cute brown teddie Poodle dog head that naturally blends with the body, as if it grew there',
    },
    'orange-cat': {
      prompt:
        'Replace the human head with a memeable orange cat head that looks a bit like the original human face that naturally blends with the body, as if it grew there',
    },
    'sphynx-cat': {
      prompt:
        'Change the human head into Sphynx Cat head that looks a bit like the original human',
      changeType: 'character',
    },
    // Art & Merch
    'line-art': {
      prompt: 'turn this image into line art style',
    },
    sticker: {
      prompt:
        'from this image, generate a sticker image with a small white edges',
    },
    'chibi-stickers': {
      prompt:
        'create cute chibi stickers of this character that can be used in messages, generate one image that includes 3x3 grid of chibi stickers of different emotions of the same character',
    },
    'character-sheet': {
      prompt:
        'Generate a comprehensive character sheet of the character, featuring front & side & back 3 perspectives (turnaround sheet), different facial expression variations, and design details, drawn on a clean white background. Do not include any text',
    },
    'turnaround-sheet': {
      prompt:
        'Generate a turnaround sheet (front, side, back views) of the character',
      needVip: true,
    },
    'character-expression-sheet': {
      prompt:
        'Generate a 3x3 expression sheet of the character showing different facial expressions.',
      needVip: true,
    },
    'pose-sheet': {
      prompt:
        'Generate a 3x3 pose sheet of the character showing different common poses.',
      needVip: true,
    },
    'costume-design': {
      prompt:
        'Generate a costume design for the character showing the character in 5+ different outfits.',
      needVip: true,
    },
    'sprite-sheet': {
      // TODO 查看attched image能不能这样用
      prompt: `[CHARACTER=<attached image>] [STYLE=pixel‑art]
      
      Create a cohesive sprite sheet.
      ─ROW 1 – Base Model ─
      • Natural idle pose in 4-8 rotations.
      • Match the chosen STYLE exactly.

      ─ROW 2 – Base Model ─
      • Natural running animation frames from the same side view.
      • Match the chosen STYLE exactly.

      ─ROW 3 – Base Model ─
      • Natural attack animation frames from the same side view.
      • Match the chosen STYLE exactly.

      ─ ROW 4 – Adaptive Equipment Grid─
      • Add distinct gear/prop items  that logically suit the CHARACTER.
      • Render each item in its own cell at the clearest modelling angle(s), using the same STYLE.
      • Ensure every piece fits the ROW 1 model without clipping.

      ─ Global Constraint ─
      • Keep sheet visually and stylistically consistent (palette, light direction, line weight).
      • Use white background.`,
    },
    'colorful-notes': {
      prompt:
        'Add a bunch of colorful hand-drawn style cute arrows and notes on this image to annotate why this scene/design/character are awesome.',
    },
    plushie: {
      prompt:
        'Make a fluffy plushie merch that look like the character/object, and has the same pose and camera perspective as the original image, the plushie is placed on a clean background',
    },
    badge: {
      prompt:
        'Generate a realistic photo of a delicate anime merchandise badge button featuring the character shown in the uploaded image. The badge has a beautiful glossy finish, and is beautifully placed on a clean, gradient color surface under soft, natural lighting. The badge takes up the majority of the image space',
    },
    standee: {
      prompt:
        'A realistic product photo of a acrylic standee featuring the character shown in the uploaded image. The character is shown in full body. The standee has clear acrylic edges cut precisely along the character’s silhouette, not a rectangular shape. The character is flat-printed on the back of the acrylic, giving it a smooth, glossy front surface. The standee has a well-designed base and is beautifully displayed on a light-colored desk with natural lighting. Designed as high-quality anime merchandise for fans and collectors',
    },
    'body-pillow': {
      prompt:
        'Make a anime body pillow (Dakimakura) with the character/object printed as a anime merch',
    },
    'action-figure': {
      prompt:
        'Analyze the uploaded image and reimagine the main subject as a palm-sized miniature while preserving its recognizable design, pose, and colors. Do not paste the original—render a new 3D mini with toy-appropriate proportions (slightly chunkier forms), crisp painted details, and subtle parting seams like injection-molded PVC/ABS; avoid skin-like gloss or fabric textures unless they’re toy surface prints. Place it on a clean studio setup (white or soft pastel cyclorama) with catalog lighting, macro cues (gentle shallow depth of field, micro-speculars), and a soft contact shadow. Keep edges sharp and clean; avoid sticker-like overlays, heavy denoise, real-world photo textures, or gritty wear. Do not add captions or watermarks. Output one polished image that clearly reads as a high-quality product shot',
    },
    'figure-in-box': {
      prompt:
        'Generate a well-designed figure toy box of the character. The figure inside the figure box should be a newly rendered 3D miniature with crisp painted details, and subtle parting seams like injection-molded PVC/ABS; avoid skin-like gloss or fabric textures unless they’re toy surface prints. The figure should be showcased in a well-designed figure box without any text. The figure box should be placed in front of a clean background. Output one polished image that clearly reads as a high-quality product shot',
    },
    'figure-box-2': {
      prompt:
        'Generate a figure toy image of the person in this photo. The figure should be a full figure and displayed in its original blister pack. He/she should also have relevant accessories in the blister pack.',
      needVip: true,
    },
    'studio-render-figure': {
      prompt:
        'To create a 1/7 scale commercialized figure of thecharacter in the illustration, in a realistic style and environment. Place the figure on a computer desk, using a circular transparent acrylic base without any text. On the computer screen, display the ZBrush modeling process of the figure. Next to the computer screen, place a BANDAI-style toy packaging box printed with the original artwork.',
    },
    'snow-globe': {
      prompt:
        'Analyze the uploaded image and rebuild the key subject as a toy-scale 3D miniature inside a clear glass snow globe—do not paste or project the source photo, do not use billboards/decals/2D overlays. Isolate the subject, discard the original background, and re-light from scratch. Place the miniature on a small internal base terrain that matches the scene (clean, simplified forms), with clear contact shadows and subtle ambient occlusion where it touches the base. Use physically plausible glass optics: IOR ≈ 1.5, Fresnel reflections, clean refraction through the sphere, and a few believable internal caustic highlights; keep the glass pristine with faint micro-scratches only. Add a light dusting of settled snow on the base and a few suspended snow particles inside the globe (no heavy blizzards). Shift the camera slightly from the input view (~10–20° yaw, slight pitch) to show parallax and avoid any flat compositing. Set the globe on a simple neutral tabletop with a soft contact shadow; background minimal and uncluttered. Protect faces/text if present; avoid gradients/noise from the original photo. Output one charming, single image—no brands/logos/watermarks',
    },
    gachapon: {
      prompt:
        'Analyze the uploaded image and reimagine the main subject as a palm-sized Japanese gachapon capsule toy while preserving its recognizable design, pose, and colors. Do not paste the original—render a new 3D mini as injection-molded PVC/ABS with crisp paint apps, tiny tampo-style details, and subtle parting seams; avoid fabric or skin-like textures unless they are printed graphics. Place the toy inside a clear two-piece plastic capsule (one half open beside it, the other half behind/under it) with believable refraction, reflections, and micro-scratches; include a small folded paper insert with abstract patterns only (no brands/logos, no real IP). Set the scene on a clean countertop or in front of a softly blurred capsule-machine backdrop filled with colorful capsules for context; light it like a catalog macro shot (soft, even illumination, gentle shallow depth of field, clean contact shadow). Keep edges sharp and toy-like, colors slightly saturated, and scale cues convincing; avoid sticker-like overlays, heavy denoise, gritty wear, or photo-texture remnants. Do not add any text, UI, or watermarks. Output one polished image that clearly reads as a high-quality gachapon product photo',
    },
    'gacha-card': {
      prompt:
        'Analyze the uploaded image and render a premium gacha jackpot reveal screen (original, non-infringing UI) while preserving the subject, pose, colors, and native style. Make the scene cinematic and dimensional rather than flat: build a layered background with a radiant burst, curving aurora/arc glows, and subtle volumetric light shafts aligned to the existing lighting; add depth-aware particles and a few large, out-of-focus bokeh discs in the foreground; apply gentle light-wrap around the subject’s edges plus a soft contact shadow or mild tabletop reflection so the subject sits naturally in the scene. Use a thin beveled metallic card frame with subtle embossed foil sheen as an accent (avoid thick opaque borders); tint it gold/rainbow to imply high rarity. Place a small “NEW” badge at the top and an “SSR ★★★★★” tag at the bottom in a clean sans-serif—bright and readable but unobtrusive; do not use third-party logos or copy any specific game UI. Light it like a catalog hero shot: sharp subject, tasteful shallow depth of field on background/effects; protect faces and any existing text/logos from blur. Grade color tastefully (rich highlights without clipping, slightly lifted shadows without haze). Avoid heavy smoothing, double edges, cartoonish fringing, sticker-like flat compositing, or awkward limb crops. Output a single finished image with no extra captions or watermarks beyond the specified UI elements',
      needVip: true,
    },
    'funko-pop': {
      prompt:
        'Transform the person in the photo into the style of a Funko Pop figure packaging box, presented in an isometric perspective. Inside the box, showcase the figure based on the person in the photo, accompanied by their essential items (such as cosmetics, bags, or others). Next to the box, also display the actual figure itself outside of the packaging, rendered in a realistic and lifelike style',
    },
    lego: {
      prompt:
        'Transform the person in the photo into the style of a LEGO minifigure packaging box, presented in an isometric perspective. Inside the box, showcase the LEGO minifigure based on the person in the photo, accompanied by their essential items (such as cosmetics, bags, or others) as LEGO accessories. Next to the box, also display the actual LEGO minifigure itself outside of the packaging, rendered in a realistic and lifelike style',
      needVip: true,
    },

    'barbie-box': {
      prompt:
        'Generate a realistic Barbie doll figure image of the person in this photo. The figure should be fully detailed, posed inside original blister packaging, and styled with accessories that reflect her personality or interests.',
    },
    dollhouse: {
      prompt:
        'Convert it to a 3d isometric dollhouse view of the object in realistic style and with white background.',
      needVip: true,
    },
    'mini-figure': {
      prompt:
        "Generate a realistic, miniature of the object held delicately between a person's thumb and index finger.  clean and white background, studio lighting, soft shadows. The hand is well-groomed, natural skin tone, and positioned to highlight the object's shape and details. The object appears extremely small but hyper-detailed and brand-accurate, centered in the frame with a shallow depth of field.",
      needVip: true,
    },
    'id-photo': {
      prompt: 'Convert this to a semi-realistic ID photo.',
    },
    'album-cover': {
      prompt: 'Convert to fancy album cover.',
    },
    magazine: {
      prompt: 'Turn the photo into VOGUE fashion magazine cover.',
    },
    polaroid: {
      prompt:
        'Turn the photo into a polaroid, and the photo in the polaroid should in cartoon art style.',
    },
    silhouette: {
      prompt: 'Turn the image to Silhouette.',
    },
    cosplay: {
      prompt:
        'generate a real human cosplay of the art in similar pose and in a similar scene.',
    },
    'pixel-art': {
      prompt: 'turn this image into minecraft style',
    },
    'low-poly': {
      prompt: 'turn this image into low poly style',
      needVip: true,
    },
    'ink-wash-painting': {
      prompt: 'turn this image into 水墨（ink wash） style',
      needVip: true,
    },
    caricature: {
      prompt: 'Turn this into a caricature drawing.',
    },
    'pop-art': {
      prompt: 'Change the image to pop art style.',
    },
    'dark-fantasy': {
      prompt:
        'Transform the image into a visually striking style with moody, shadowy palettes, intricate gothic designs, and eerie, otherworldly aesthetics.',
    },
    signalis: {
      prompt:
        'Transform into a moody, eerie, and narrative-driven visual, blending retro pixel aesthetics with cyberpunk vibes. Perfect for generating anime-style illustrations featuring dystopian tech, mechanical dolls, and mysterious horror elements.',
    },
    'great-mosu': {
      prompt:
        'Transform the visual style to vibrant colors, smooth lines, and exaggerated, detailed character designs with a focus on expressive faces and bold outfits.',
    },
    origami: {
      prompt: 'turn this image into Origami paper art style',
      model: 'flux-kontext-pro',
    },

    // body
    'blonde-hair': {
      prompt: 'Change the character to blonde hair',
    },
    'blue-eye': {
      prompt: 'Change the eye color to blue eyes.',
    },
    chubby: {
      prompt: 'Make the character fatter and more chubby.',
      // model: 'flux-kontext-pro',
    },
    skinny: {
      prompt: 'Make the characters much skinnier.',
      // model: 'flux-kontext-pro',
    },
    elderly: {
      prompt: 'Make the character look like elderly.',
    },
    baby: {
      prompt: 'Convert the character to their baby form.',
    },
    pregnant: {
      prompt: 'Make the character pregnant with big belly.',
    },
    bald: {
      prompt: 'Make the character bald without hair',
    },
    beard: {
      prompt: 'Add a beard to the character',
    },
    bangs: {
      prompt: "Add bangs to the character's hair",
    },
    smile: {
      prompt: 'Change the character to have a big smile',
    },
    cry: {
      prompt: 'Make the character crying with tears',
    },

    chibi: {
      prompt:
        'Convert the character to flat hand-drawn chibi style with thick lines and white background',
    },

    'avatar-portrait': {
      prompt:
        'Generate a 1:1 anime-style profile picture cropped only to the character’s head. Place only the head area inside a perfect circular frame. Fill the inside of the circle with a smooth, beautiful gradient background (clean and vibrant). Keep everything outside the circle pure white. Render in sharp focus with professional quality, suitable as an avatar',
    },

    'my-little-pony': {
      prompt: 'Turn this image into My Little Pony style',
    },
    'sketch-to-finish': {
      prompt:
        'Generate a four-panel illustration of the painting process: Top left: line art, Top right: flat coloring with large color blocks, Bottom left: shading added, Bottom right: refined and finalized. Do not include any text',
    },
    '3d-model': {
      prompt:
        'Convert this into a 3D model rendered in Unity game engine. Render it with depth, geometry, and materials as if it were a playable MMD model. Include proper texturing, shading, and lighting so it looks like a fully integrated object within a game engine environment.',
    },
    'bjd-doll': {
      prompt:
        'Convert this into a BJD doll beautifully with elegant clean background',
    },
    'yarn-doll': {
      prompt:
        'A close-up, professionally composed photograph showing a handmade crocheted yarn doll being gently held in both hands. The doll has a rounded shape and an adorable chibi-style appearance, with vivid color contrasts and rich details. The hands holding the doll appear natural and tender, with clearly visible finger posture, and the skin texture and light-shadow transitions look soft and realistic, conveying a warm, tangible touch. The background is slightly blurred, depicting an indoor setting with a warm wooden tabletop and natural light streaming in through a window, creating a cozy and intimate atmosphere. The overall image conveys a sense of exquisite craftsmanship and a cherished, heartwarming emotion',
    },
    'gundam-model': {
      prompt:
        'Transform the person in the photo into the style of a Gundam model kit packaging box, presented in an isometric perspective. Inside the box, showcase a Gundam-style mecha version of the person from the photo, accompanied by their essential items (such as cosmetics, bags, or others) redesigned as futuristic mecha accessories. The packaging should resemble authentic Gunpla boxes, with technical illustrations, instruction-manual style details, and sci-fi typography. Next to the box, also display the actual Gundam-style mecha figure itself outside of the packaging, rendered in a realistic and lifelike style, similar to official Bandai promotional renders',
      needVip: true,
    },
    'bag-charm': {
      prompt:
        'Turn this into a cute bag charm / a flat acrylic keychain / a flat rubber keychain, and hang it on a bag that fit the bag charm',
    },
    'soda-can': {
      prompt: 'Print the image on a can, making it look creative and stylish',
    },
    'expression-smile': {
      prompt:
        'Change the character to be laughing, with eyes crinkled at the corners (a "D" shape), mouth open, cheeks raised.',
    },
    'expression-playful': {
      prompt:
        'Change the character to be playful, with one eye winking or both eyes sparkling, eyebrows slightly arched, the mouth forming a mischievous smirk or a gentle, teasing smile, and a general air of lightheartedness.',
    },
    'expression-sassy': {
      prompt:
        'Change the character to naughty tongue-out expression. The mouth in a playful curve like a smirk. A small tongue peeks out a little from the far left side of mouth, giving the expression a mischievous, cheeky, or teasing vibe.',
    },
    'expression-naughty': {
      prompt:
        'Change the character to have a playful teasing expression, eyes narrowed and pupils dilated. They stick out a thin tongue, acting naughty.',
    },
    'expression-smug': {
      prompt:
        'Change the character to smug expression, with one eyebrow slightly raised or both slightly arched, eyes looking to the side or half-closed with a knowing expression, and the mouth curved into a subtle, self-satisfied smile, possibly with a slight head tilt.',
    },
    'expression-kitty-mouth': {
      prompt: 'Change the character to a kitty mouth expression.',
    },
    'expression-hungry': {
      prompt:
        'Replace with the cute anime drooling expression with happy closed eyes, slightly open mouth, and small drool at one side of the mouth, showing hunger or love.',
    },
    'expression-star-eyes': {
      prompt:
        'Change the character to have sparkling eyes, there is a shining yellow star in each eye.',
    },
    'expression-heart-eyes': {
      prompt:
        'Change the character to have glowing pink heart shape in each eye, giving a look of affection and adoration.',
    },
    'expression-sparkling-eyes': {
      prompt:
        'Change the character to have sparkling eyes, showing excitement and awe.',
    },
    'expression-unconscious': {
      prompt:
        'Change the character to have cross-sign eyes as if dead/unconscious.',
    },
    'expression-beyond-words': {
      prompt:
        'Convert to have tiny dot eyes and straight line mouth as if shocked beyond words.',
    },
    'expression-dizzy': {
      prompt:
        'Change the character to dizzy and confused expression and with dizzy spiral eyes.',
    },
    'expression-frustration': {
      prompt:
        'Remove the original eyes and use the symbol > for left eye and < for right eye so it becomes the anime frustration/troubled expression.',
    },
    'expression-derp-face': {
      prompt:
        'Convert the character to doodle style having a derp face. They should have tiny dot eyeballs in round eye rim, two eyeballs unfocused and pointing in opposite directions, mouth open awkwardly, sometimes lopsided.',
    },
    'expression-googly-eyes': {
      prompt: 'Convert to have googly eyes.',
    },
    'expression-shark-teeth': {
      prompt: 'Change the character to shark teeth expression.',
    },
    'expression-triangle-mouth': {
      prompt: 'Change the character to have triangle mouth.',
    },
    'expression-no-mouth': {
      prompt: 'Remove the mouth.',
    },
    'expression-tiny-mouth': {
      prompt: 'Replace the mouth with a very tiny o-shaped mouth.',
    },
    'expression-villain-grin': {
      prompt: 'Convert the character to have sharp teeth villain grin.',
    },
    'expression-sympathy': {
      prompt:
        'Change the character to be in a sympathetic expression, with eyebrows slightly furrowed in concern, eyes soft and empathetic, the corners of the mouth turned down slightly in a gentle, understanding frown, and an overall expression of shared sadness or concern.',
    },
    'expression-speechless': {
      prompt:
        'Change the character to be in speechless expression, with eyebrows slightly raised in an almost tired or deadpan manner, eyes half-lidded and both eyes looking to one side, and the mouth forming a small straight line showing an unamused frown.',
    },
    'expression-shy': {
      prompt: 'Change the character to shy expression blushing.',
    },
    'expression-upset': {
      prompt:
        'Change the character to upset expression, with eyebrows slightly furrowed inward, eyes downcast or slightly watery, the corners of the mouth pulled down, and a slight pout or trembling lower lip.',
    },
    'expression-cry': {
      prompt: 'Make the character crying in tears.',
    },
    'expression-mad': {
      prompt:
        'Change the character to mad expression, with eyebrows sharply furrowed and pulled down, eyes narrowed or glaring, nostrils flared slightly, and the mouth forming a tight, straight line or a snarl with teeth possibly bared.',
    },
    'expression-fear': {
      prompt:
        'Transform the character into a state of extreme fear: eyebrows raised high and tightly drawn together, eyes wide open showing whites, pupils dilated and largely shrunken, creating a panicked gaze. The mouth should be small, slightly open, curved in a trembling shape as if gasping or stammering, capturing a moment of intense terror.',
    },
    'expression-scared': {
      prompt:
        'Replace with wide circular blank eyes without eyeballs and an open mouth, conveying shock and fear.',
    },
    'expression-shocked': {
      prompt:
        'Change the character to be in shock, with eyebrows raised high, eyes wide open showing whites, pupils dilated and largely shrunken, the mouth open in a small "O" shape.',
    },
    'expression-stunned': {
      prompt:
        'Change the character to have a stunned expression, eyes wide open showing whites, pupils dilated and shrunken. The mouth closed as a straight line.',
    },
    'expression-awkward': {
      prompt: 'Change the character to awkward expression with sweat drop.',
    },
    'expression-disgust': {
      prompt:
        'Change the character to disgust expression, with eyebrows furrowed and pulled down, eyes narrowed or squinched, the nose slightly wrinkled, and the mouth forming a look of disgust.',
    },
    'expression-angry': {
      prompt:
        'Change the character to be very angry and have anime anger mark on the right forehead.',
    },
    'expression-very-angry-pouting': {
      prompt:
        'Change the character to have a pouting and stubborn expression with mouth closed and look like >-',
    },

    // Nano Banana Pro Styles
    // Character Info Sheet
    'character-info-sheet': {
      prompt: `aspect ratio: 9:16

[Character Name] = $$characterName$$
[Occupation] = $$occupation$$
[Language] = $$language$$

1. Visual Style & Layout Rules (Strict):
  
Style: High-quality 2D anime "slice-of-life" infographic / fashion magazine spread.
Language: Everything in [Language], precisely no other languages.

Lighting/Tone: Relating to the [Character Name] and [Occupation].

Background of the entire picture:  Relating to the [Character Name] and [Occupation]. The EXACTLY entire right half of the picture will have a white background frame. Adjust the part of the white background frame on the right that is close to the left to a feathered effect, so that there is a transition and a blurred feel between the background color on the left and the white on the right.Adjust the overall transparency of the white background on the right to 40%.

Text Formatting: NO text boxes or speech bubbles. All text must be black, DO NOT BOLD, and floating directly on the background illustration.

2. Top Left Header (NO white background frame): Black text in the top-left corner, do not pass the middle line, stays to the left half of the picture) in [Language]:
  
[Language] Line 1(NO white background frame): "Name: [Character Name]"
[Language] Line 2(NO white background frame): "Occupation: [Occupation]"
[Language] Line 3(NO white background frame): (AI to invent a humorous/long affiliation name).
NO White background frame.

3. Main Character (Left Center): A full-body anime illustration of [Character Name] on the left side.
  
Attire: Relating to the [Character Name] and [Occupation].
Pose: Relating to the [Character Name] and [Occupation].

4. Item Callouts (Right Side - Exactly 10 Items in two columns starting from the very top of the right side of the entire picture): generate 10 distinct items(only put item picture and some humorous description for each item). AI must invent these based on the [Occupation] and the left side character image. The item picture must be also align to the character image on the left. NO guide line.
  
5. Expression Panels: Three small square inset panels arranged horizontally at the bottom right corner. ALSO THIS PART IS IN THE RIGHT HAND SIDE white background frame.
  
Panel 1: Character smiling/winking. Label in [Language]: "Open for Business."
Panel 2: Character looking anxious/shocked. Label in [Language]: "Anxiety."
Panel 3: Character crying/eating. Label in [Language]: "Mental Breakdown."`,
      model: 'gemini-3-pro-image-preview',
      needVip: true,
    },

    'character-variation': {
      prompt:
        'Please create a variation of the attached image. Different compositions, different aspect ratios, different poses and different facial expressions. You can choose anything but keep the model and the clothing consistent. Please create one. ',
      model: 'gemini-3-pro-image-preview',
    },

    // Magazine Article
    'magazine-article': {
      prompt: `[Language] = $$language$$;
[Character info] = $$info$$;
Put this whole text, verbatim, into a photo of a glossy magazine article on a desk, with photos, beautiful typography design, pull quotes and brave formatting. The text is couple hundreds of words, news or story relating to the attached and [Character info] in [Language].`,
      model: 'gemini-3-pro-image-preview',
    },

    // Waifu / Husbando Rating
    'waifu-husbando-rating': {
      prompt: `[Waifu/Husbando] = "Waifu" if attached is female;
[Waifu/Husbando] = "Husbando" if attached is male;
Add a bunch of colorful hand-drawn style cute arrows and notes on this image to annotate why this scene/design/character is awesome. Add a cute [Waifu/Husbando] Rating in a cute box at the bottom of the image (line 1 text is "[Waifu/Husbando] Rating", Line 2 is the score), score to 10 with 1 decimal point (10% get 9.0 or above 9.0 scores, 90% below 9.0).`,
    },
    // Genshin Impact Dialogue
    'genshin-impact-dialogue': {
      prompt: `aspect ratio: 16:9; [Name] = $$characterName$$;
[Language] = $$language$$;
Please generate an image. Everything in the image is just like I'm playing in the Genshin Impact game. The attached name is [Name], which is me. Imitate the style of Genshin Impact's main story 3D screenshot CG, with text in [Language] in the Genshin Impact game interface. I want to see Paimon and Aether and me in one image talking to me. The picture including dialogue between Paimon, Aether, and me. `,
      model: 'gemini-3-pro-image-preview',
    },
    // Genshin Impact Ultimate Skill
    'genshin-impact-ultimate-skill': {
      prompt: `aspect ratio: 16:9; [Name] = $$characterName$$;
[Language] = $$language$$;
Please generate an image. Everything in the image is just like I'm playing in the Genshin Impact game. The attached name is [Name], which is me. Imitate the style of Genshin Impact's main story 3D screenshot CG, uses close-up screenshots that I'm doing ultimate skills in Genshin Impact under the modeling style. `,
      model: 'gemini-3-pro-image-preview',
    },
    'christmas-avatar': {
      prompt:
        'Please make everything in Christmas style. Generate a 1:1 anime-style profile picture cropped only to the character’s head. Place only the head area inside a perfect circular frame. Fill the inside of the circle with a smooth, beautiful gradient background (clean and vibrant). Keep everything outside the circle pure white. Render in sharp focus with professional quality, suitable as an avatar.',
    },
    'cozy-christmas-figure': {
      prompt:
        'Please make everything in Christmas style. Use the nano-banana model to create a 1/7 scale commercialized figure of thecharacter in the illustration, in a realistic style and environment. Place the figure on a computer desk, using a circular transparent acrylic base without any text. On the computer screen, display the ZBrush modeling process of the figure. Next to the computer screen, place a BANDAI-style toy packaging box printed with the original artwork',
    },
    'christmas-edition-info-sheet': {
      prompt: `Please make everything in Christmas style. 
aspect ratio: 9:16
 
[Character Name] = $$characterName$$ 
[Occupation] = $$occupation$$ 
[Language] = $$language$$
[Test Input] = $$testinput$$
 
1. Visual Style & Layout Rules (Strict):
 
Style: High-quality 2D anime "slice-of-life" infographic / fashion magazine spread.
Language: Everything in [Language], precisely no other languages.
 
Lighting/Tone: Relating to the [Character Name] and [Occupation].
 
Background of the entire picture:  Relating to the [Character Name] and [Occupation]. The EXACTLY entire right half of the picture will have a white background frame. Adjust the part of the white background frame on the right that is close to the left to a feathered effect, so that there is a transition and a blurred feel between the background color on the left and the white on the right.Adjust the overall transparency of the white background on the right to 40%.
 
Text Formatting: NO text boxes or speech bubbles. All text must be black, DO NOT BOLD, and floating directly on the background illustration.
 
2. Top Left Header (NO white background frame): Black text in the top-left corner, do not pass the middle line, stays to the left half of the picture) in [Language]:
 
[Language] Line 1(NO white background frame): "Name: [Character Name]"
[Language] Line 2(NO white background frame): "Occupation: [Occupation]"
[Language] Line 3(NO white background frame): (AI to invent a humorous/long affiliation name).
NO White background frame.
 
3. Main Character (Left Center): A full-body anime illustration of [Character Name] on the left side with [Test Input] colored face.
 
Attire: Relating to the [Character Name] and [Occupation].
Pose: Relating to the [Character Name] and [Occupation].
 
4. Item Callouts (Right Side - Exactly 10 Items in two columns starting from the very top of the right side of the entire picture): generate 10 distinct items(only put item picture and some humorous description for each item). AI must invent these based on the [Occupation] and the left side character image. The item picture must be also align to the character image on the left. NO guide line.
 
5. Expression Panels: Three small square inset panels arranged horizontally at the bottom right corner. ALSO THIS PART IS IN THE RIGHT HAND SIDE white background frame.
 
Panel 1: Character smiling/winking. Label in [Language]: "Open for Business."
Panel 2: Character looking anxious/shocked. Label in [Language]: "Anxiety."
Panel 3: Character crying/eating. Label in [Language]: "Mental Breakdown."`,
      model: 'gemini-3-pro-image-preview',
    },
    'christmas-magazine': {
      prompt: `Please make everything in Christmas style. 
[Language] = $$language$$;
[Character info] = $$info$$;
Put this whole text, verbatim, into a photo of a glossy magazine article on a desk, with photos, beautiful typography design, pull quotes and brave formatting. The text is a couple of hundreds of words, news or story relating to the attached and [Character info] in [Language].`,
      model: 'gemini-3-pro-image-preview',
    },
    'felt-figure': {
      prompt: `Transform the user input character image into a realistic felt plush craft sample. Soft wool texture, visible stitching, handmade feel, Christmas color accents, tiny Santa hat or scarf, studio product photo, neutral background with subtle festive props, shallow depth of field, high realism.`,
    },
    'xmas-contrast': {
      prompt: `Split composition. Left side: the character from the input image, tired and unmotivated at work.Right side: the same character, happy on Christmas holding gifts, festive lighting, Christmas decorations, clear emotional contrast.`,
      model: 'gemini-3-pro-image-preview',
    },
    'acrylic-stand': {
      prompt: `Turn the user image into a transparent acrylic board display.Place it on a desk, realistic acrylic thickness, reflections, soft indoor lighting, lifestyle product photo style.`,
    },
    'campus-cover': {
      prompt: `Generate a realistic Campus notebook product photo using the character from the user image as the cover illustration.Clean desk scene, natural lighting, light Christmas decorations on the desk (pine branch, lights), notebook clearly visible, festive cover details, printed texture, realistic shadows.`,
    },
    'gift-box': {
      prompt: `Create a Christmas gift box product photo featuring the character from the input image printed on the box.Festive packaging, ribbon, warm Christmas lighting, realistic materials, clean background..`,
    },
  };

  const result = styleData[style] || {
    prompt: `${style.toLowerCase()}`,
  };

  const prompt = substitutePromptVariables(result.prompt, variables);
  return { ...result, prompt };
};
