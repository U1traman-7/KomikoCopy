import { createClient } from '@supabase/supabase-js';
import { T } from '../_utils/templateTables.js';

export interface EffectInfo {
  prompt: string;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
type PromptVariables = {
  characterProfile?: string;
  otherInfo?: string;
  // Support any additional dynamic fields
  [key: string]: any;
};

// Cache for database prompts (包含 prompt 和 video_pipeline_type)
let cachedPrompts: {
  [key: string]: { prompt: any; video_pipeline_type?: string };
} | null = null;
let cachedPromptsTimestamp: number = 0;
const PROMPTS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const cleanTemplateId = (id: string): string => id.replace(/-(v|i)$/, '');

// Function to get prompts from database (server-side only)
const getPromptsFromDB = async () => {
  if (
    cachedPrompts &&
    cachedPromptsTimestamp &&
    Date.now() - cachedPromptsTimestamp < PROMPTS_CACHE_DURATION
  ) {
    return cachedPrompts;
  }

  try {
    // Fetch directly from Supabase - get video templates for effects
    const { data, error } = await supabase
      .from(T.style_templates)
      .select('id, prompt, video_pipeline_type')
      .eq('type', 'video');

    if (error) {
      throw error;
    }

    const prompts: {
      [key: string]: { prompt: any; video_pipeline_type?: string };
    } = {};
    for (const row of data || []) {
      const cleanId = cleanTemplateId(row.id);
      prompts[cleanId] = {
        prompt: row.prompt,
        video_pipeline_type: row.video_pipeline_type || undefined,
      };
    }

    cachedPrompts = prompts;
    cachedPromptsTimestamp = Date.now();
    return cachedPrompts;
  } catch (error) {
    console.error('Failed to fetch prompts from database:', error);
    return null;
  }
};

/**
 * 获取视频管线专用 prompt (type2/type3)
 * @param styleId - 模板 ID
 * @param pipelineType - 管线类型 (type2/type3)
 * @param variables - 模板变量（用于 prompt 中的占位符替换）
 * @returns { prompt1?: string, prompt2?: string }
 */
export const getVideoPipelinePrompts = async (
  styleId: string,
  pipelineType: string,
  variables?: PromptVariables,
): Promise<{ prompt1?: string; prompt2?: string }> => {
  const cleanedId = cleanTemplateId(styleId);
  const dbPrompts = await getPromptsFromDB();

  if (!dbPrompts || !dbPrompts[cleanedId]) {
    console.warn(
      '[getVideoPipelinePrompts] No DB prompt found for:',
      cleanedId,
    );
    return {};
  }

  const promptData = dbPrompts[cleanedId].prompt;
  if (!promptData || !promptData[pipelineType]) {
    console.warn(
      '[getVideoPipelinePrompts] No pipeline prompt found for type:',
      pipelineType,
      'in template:',
      cleanedId,
    );
    return {};
  }

  const pipelinePrompts = promptData[pipelineType];
  let prompt1 = pipelinePrompts.prompt1 || undefined;
  let prompt2 = pipelinePrompts.prompt2 || undefined;

  // 对每个 prompt 做变量替换（复用现有变量替换逻辑）
  if (variables) {
    if (prompt1) {
      prompt1 = replacePromptVariables(prompt1, variables);
    }
    if (prompt2) {
      prompt2 = replacePromptVariables(prompt2, variables);
    }
  }

  return { prompt1, prompt2 };
};

/**
 * 对 prompt 进行变量替换，支持多种占位符格式
 */
const replacePromptVariables = (
  prompt: string,
  variables: PromptVariables,
): string => {
  const { characterProfile, otherInfo, ...dynamicVariables } = variables;

  if (characterProfile) {
    prompt = prompt.replace(/\$\{characterProfile\}/g, characterProfile);
    prompt = prompt.replace(/\$\$characterProfile\$\$/g, characterProfile);
  }
  if (otherInfo) {
    prompt = prompt.replace(/\$\{otherInfo\}/g, otherInfo);
    prompt = prompt.replace(/\$\$otherInfo\$\$/g, otherInfo);
  }

  Object.keys(dynamicVariables).forEach(key => {
    const value = dynamicVariables[key];
    if (value != null && value !== '') {
      const replacementValue = String(value);
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const placeholderPatterns = [
        new RegExp(`\\$\\{${escapedKey}\\}`, 'g'),
        new RegExp(`\\$\\$${escapedKey}\\$\\$`, 'g'),
        new RegExp(`{{${escapedKey}}}`, 'g'),
        new RegExp(`{${escapedKey}}`, 'g'),
      ];
      placeholderPatterns.forEach(pattern => {
        prompt = prompt.replace(pattern, replacementValue);
      });
    }
  });

  return prompt;
};

export const getEffectInfo = async (
  effect: string,
  variables?: PromptVariables,
) => {
  // Clean the template ID to match database keys
  const cleanedEffect = cleanTemplateId(effect);

  // Try to get from database first
  const dbPrompts = await getPromptsFromDB();
  if (dbPrompts && dbPrompts[cleanedEffect]) {
    const rawPrompt = dbPrompts[cleanedEffect].prompt;

    // 兼容新旧 prompt 格式:
    // 旧格式: { prompt: "..." } -> rawPrompt.prompt 是字符串
    // 新格式 type1: { type1: { prompt: "..." } } -> 提取内层 .prompt
    // 新格式 type2/type3: { type2: { prompt1, prompt2 } } -> 由 getVideoPipelinePrompts 处理，这里跳过
    let prompt: string;
    if (typeof rawPrompt === 'string') {
      prompt = rawPrompt;
    } else if (rawPrompt?.prompt && typeof rawPrompt.prompt === 'string') {
      // 旧格式: { prompt: "..." }
      prompt = rawPrompt.prompt;
    } else if (rawPrompt?.type1?.prompt) {
      // type1 格式: { type1: { prompt: "..." } }
      prompt = rawPrompt.type1.prompt;
    } else {
      // 其他新格式 (type2/type3) 不适用于 getEffectInfo，跳过
      prompt = '';
    }

    if (!prompt) {
      // 无法提取有效 prompt，回退到静态数据
      return getEffectInfoStatic(effect, variables);
    }

    // 使用 replacePromptVariables 统一处理所有变量替换
    if (variables) {
      prompt = replacePromptVariables(prompt, variables);
    }

    console.log(
      'Using DB prompt for effect:',
      cleanedEffect,
      'Prompt:',
      prompt,
    );
    return { prompt };
  }
  console.log(
    'No DB prompt found for effect:',
    cleanedEffect,
    'fallback to static',
  );

  // Fallback to static data
  return getEffectInfoStatic(effect, variables);
};

// Keep original function as fallback
const getEffectInfoStatic = (effect: string, variables?: PromptVariables) => {
  const { characterProfile, otherInfo, ...dynamicVariables } = variables || {};
  const effectData: {
    [key: string]: EffectInfo;
  } = {
    twerk: {
      prompt:
        'They shows their back and twerks energetically. They dance and quickly shake their booty. Their bouncy booty jiggling and bounces, with quick rebound with each music beat, springy elastic bounce. The twerking motion is bouncy and energetic, and perfectly synced to the beat, capturing the playful and teasing vibe.',
    },
    '360-View': {
      prompt:
        'The character or object rotates around for 360 degrees in the same pose.',
    },
    'batman-transformation': {
      prompt:
        'The character threw up the cloak and wear it and transform into a batman.',
    },
    'fire-magic': {
      prompt:
        'The character quickly gathers fire flame in their hands, and then the character unleashes a grand fire flame magic skill to the air, glowing sparks are seen everywhere.',
    },
    'demon-transformation': {
      prompt:
        'The character dramatically transforms into a demon, their body twisting and glowing as horns, wings, and dark energy emerge, turning them into a terrifying demon.',
    },
    'doll-transformation': {
      prompt:
        "The character's head grow larger and cuter, body become smaller, transforming into a realistic doll with the same identity.",
    },
    squish: {
      prompt:
        'Two anime hands (one from left and the other from right) gently squish the attached in the middle, not too abstract. DO NOT fabricate facial features.',
    },
    'live2d-breeze': {
      prompt: `Generate a Live2D animation featuring a anime character with a little emotions and with hair and clothes swaying and with limited motion. The character should be in a sweet, charming style with a detailed and vibrant illustration. Generate video following the specifications: 
• Face: “8K facial modeling with a soft skin filter (intensity 40%) and dynamic iris highlight tracking.” 
• Blinking parameters: “1.52-second blink cycle (±0.1s margin of error), upper eyelid droop angle of 150°, and lower eyelid micro-tremor frequency of 0.5 Hz.” 
• Hair system: “2000+ individual strand physics simulation, with root fixation coefficient of 0.95 and strand tip sway amplitude of 8–12 cm.” 
• Physics simulation – wind field: “Point-source wind behind the neck (wind speed 1.2 m/s, turbulence intensity 6%).” 
Keep the camera perspective fixed. The hair should move naturally, and the eyes should blink once every 1.5 seconds. Now generate the Live2D animation.`,
    },
    wings: {
      prompt:
        'A pair of fancy wings perfectly fitting the character’s design suddenly bursts from the character’s back, then the wings made a few powerful flaps, flapping up and down.',
    },
    'say-hi': {
      prompt:
        "The character waves at the camera, smiling warmly as they say ‘hi.'",
    },
    'sword-swing': {
      prompt:
        'The character quickly pulls out a sword, and quickly makes a strong strike with glowing effect following the strike trail.',
    },
    'take-my-hand': {
      prompt:
        'The character gently extends one hand toward the viewer in an inviting anime pose, smiling as if asking them to take it.',
    },
    idol: {
      prompt:
        'The character performs as a K-pop idol on a dazzling stage, singing and dancing rapidly and energetically under moving spotlights. The lively audience cheers and waves glowing light sticks, filling the scene with excitement and rhythm. ',
    },
    'animated-stickers': {
      prompt:
        'Loop animation of chibi character stickers with eyes blinking once every 1.5 seconds and hair swaying in soft breeze.',
    },
    wink: {
      prompt:
        'The character makes a pose with their hands forming heart hands, then winks their right eye while smiling brightly.',
    },
    'screen-kiss': {
      prompt:
        'The character leans forward, blushes and slightly opens their mouth, and presses their lips against the camera lens, making a big screen kiss.',
    },
    'energy-ball': {
      prompt:
        'The character quickly charge up a glowing blue energy ball between their hands with light flares growing brighter and brighter. Then the characters rapidly thrust their hands forward to release an extremely powerful blue energy beam blasting with trailing energy waves. Add dramatic camera shake and glowing effects.',
    },
    'magical-girl-transformation': {
      prompt:
        'Generate a high-quality anime-style transformation where the character in the uploaded image becomes a magical girl. Include multiple dynamic camera shots — close-ups of face, low-angle transformation scenes, and wide shots showing energy effects and costume changes. Use a beautifully designed background with light particles, ribbons of magic, and shimmering color gradients. Add background music and synchronized sound effects (sparkle, wind, and energy burst) that enhance the emotional intensity of the transformation. End with a powerful hero pose.',
    },
    'super-saiyan': {
      prompt:
        "Generate a high-quality anime-style video transforming the uploaded character image into a Super Saiyan form. The character's hair should glow bright golden and spike upward, with glowing aura flames radiating around their body. Add crackling lightning effects and shockwaves that shake the environment. Start with the normal character, then show their energy building up, hair and eyes changing, aura bursting outward, and ending with them in full Super Saiyan power stance. Use dramatic camera zoom-ins, screen shakes, and light flares to emphasize intensity. Background should darken with swirling energy clouds. Style should match Japanese anime fight scenes, with hand-drawn look and sharp cel shading.",
    },
    'crimson-eye': {
      prompt:
        "As camera rapidly zooms in the character's eyes gradually transform into red crimson eyes, eyes radiate red aura pulses and the screen corner become surrounded with glowing blackish red flames.",
    },
    'into-outer-space': {
      prompt:
        'Generate an epic video of the character in the uploaded image launching from Earth and flying into outer space. Show the character rising from the surface of Earth, breaking through the clouds and atmosphere, entering the vast cosmos, leaving behind a glowing trail of light. Use dynamic camera angles and multiple shots.',
    },
    'sprite-attack-animation': {
      prompt:
        'A sprite animation of the character as a chibi style sprite performing various dynamic sprite attacks. Render the character in flat coloring chibi pixel art style as a sprite in a video game. The style is reminiscent of a pixel art style video game, with white swooshing energy trails and speed lines. The background alternates between pure colors, use one fixed color for each attack move.',
    },
    'anime-mv': {
      prompt:
        'Generate an anime music video featuring the character in the uploaded image. Use fluid animation and very frequent edits and cuts with a mix of different styles and elements and backgrounds and shots. Use hand-drawn animation style, including anime style, thick line very flat coloring hand-drawn style animation, hand-drawn line sketches, text, animated abstract shapes in background, etc.',
    },
    'manga-style-mv': {
      prompt:
        'Generate a manga-style animation music video featuring the character in the uploaded image. Use frequent cuts with a mix of different elements and different backgrounds and different animation shots. Use monotone manga-inspired hand-drawn animation with monotone colors (black plus one selected color). Include hand-drawn elements, sketchy manga lines, fancy text, animated abstract shapes in background, and glitches. Each shot should have large motion fluid animation.',
    },
    'kawaii-mv': {
      prompt:
        'Generate a kawaii anime music video featuring the character in the uploaded image. Use frequent cuts with a mix of different styles and elements and backgrounds and shots. Make it a kawaii hand-drawn animation with pastel colors. Feel free to use from: flat coloring hand-drawn style, modern anime style, chibi style, doro style, kawaii text, kawaii stickers, hand-drawn elements, abstract shapes in background, etc of your choice. Each shot should have fluid animation with large motion.',
    },
    'hand-drawn-mv': {
      prompt:
        'Generate an minimalist flat coloring animation music video featuring the character in the uploaded image. Use fluid animation with large motion animation. Use frequent edits and cuts with a mix of different elements and backgrounds and shots. Consistently use hand-drawn minimalist extremely flat coloring fan animation style with sketchy lines, without any shading or gradient. Use flat coloring backgrounds in light colors with animated abstract shapes and elements.',
    },
    'game-promo-video': {
      prompt:
        'Generate a high-quality anime game character promotional video (PV) of the character in the uploaded image as a five-star character. Render in modern anime game style, showing dynamic abilities of the character. End with a powerful final pose on a dramatic background and the screen displays five stars.',
    },
    'dating-sim': {
      prompt:
        'Generate otome game footage with the character from the input image talking to player through the screen as a dating sim character, add well-designed background and game UI. A beautiful select dialogue panel shows on the bottom of the screen like in a dating sim or otome game.',
    },
    'retro-game': {
      prompt:
        'Generate a pixel art style retro game footage where the character in the uploaded image is the main playable character. Retro game UI and buttons should be visible. The video should be in pixel art style, with retro game sound effects.',
    },
    'pokemon-evolution': {
      prompt:
        'The character in the uploaded image is undergoing their pokemon evolution on a gameboy, with the usual animation and sound for pokemon evolution.',
    },
    'minecraft-documentary': {
      prompt:
        'The character holding a camcorder shooting a documentary in the world of Minecraft.',
    },
    'genshin-impact': {
      prompt:
        'Create a video of the character in the uploaded image as a Genshin Impact character, playing in the world of Genshin Impact.',
    },
    zelda: {
      prompt:
        'Create a video of the character in the uploaded image as a Zelda character, playing in the world of Zelda.',
    },
    'live-concert': {
      prompt:
        "Generate an anime video of the character as a idol performing concert. The character is singing a great song. Replace the background with a concert stage. Include stage lighting, spotlights, and LED screen. There's audience under the stage, holding lightsticks and cheering. Use dynamic camera work with different shots, camera angles and cuts.",
    },
    'tiktok-dance': {
      prompt:
        'Generate a viral TikTok dance video of the character dancing a trendy viral dance. Include dynamic camera movements, like rotations, push-ins, and pull-outs to emphasize key poses and make the video more dynamic.',
    },
    'streaming-vtuber': {
      prompt:
        'Create a streaming video featuring character in the uploaded image as a Live2D VTuber streamer playing video game. The bottom left corner of the screen should be the Live2D VTuber (upper body). The VTuber sways their head and slightly moves their body and reacts with exaggerated expressions while speaking. The VTuber should have distinct Live2D motions with smooth physics. Behind the character should be the gameplay footage of a popular video game.',
    },
    dj: {
      prompt:
        'Create a DJ video featuring the character in the uploaded image as the main DJ. A lively crowd dancing energetically under colorful lights, lasers, and moving spotlights. Include multiple shots. Visual effects synced to the beat.',
    },
    'ted-talk': {
      prompt:
        'Generate video of the the character in the uploaded image giving a TED Talk.',
    },
    vlogger: {
      prompt:
        'Generate a video of the character in the uploaded image as a vlogger exploring the world. Include multiple shots.',
    },
    'poetic-animation': {
      prompt:
        'Generate a super aesthetic and poetic and ethereal animation inspired by the uploaded image with a touching background song. Include multiple shots, each shot should include at least medium motion.',
    },
    'lo-fi-vibe': {
      prompt:
        'Generate a pixel art style video with the character from the input image sitting in a cozy room holding a cup of hot drink with rain outside, with lo-fi background music, and pixel art visual style.',
    },
    cyberpunk: {
      prompt:
        'Generate a cyberpunk style 2d animation. Include multiple shots and the first shot directly cut into the character running and acting cool in a beautiful cyberpunk city. Include cyberpunk style background music.',
    },
    bankai: {
      prompt: `Characater Profile（Character name, personality, theme, and other details）: $$characterProfile$$
      Other Info（Desired Bankai Effect, Bankai transformation effects, powers, visual changes, etc.）: $$Desired Bankai Effect$$
      Effect Color: $$testinput$$
      V9.5 🚀 15秒 系统指令：史诗级万解/全动态作画生成器 (Epic Bankai Generator) [Speed & Impact Ver.]
Role (角色设定)
你是一位深谙 TikTok/Reels 短视频算法 的顶级日式动画导演。你不仅追求 Ufotable/MAPPA 级别的作画精度，更追求 完播率 (Retention) 和 互动率 (Engagement)。你极其痛恨“PPT动画”和“缓慢的运镜”。你要求每一秒画面都必须有极高的速度感 (Hyper-Speed) 和 粒子过载 (Particle Overload)。你的视觉标杆是《Fate/Stay Night: HF》的激光对撞与《死神：千年血战篇》的黑白打击帧。擅长制作《死神》、《咒术回战》或《新世纪福音战士》风格的手绘作画 (Hand-drawn Sakuga) 战斗场景。你极度排斥3D CGI质感，追求扁平化光影与极致的线条张力。
你极其擅长**“卡点剪辑思维” (Edit-Sync Visualization)。你明白，Sora 生成的视频不能只是动作流畅，必须自带节奏感 (Rhythm)**。你的核心风格是：
- Silence before the Drop: 爆发前的极度静止。
- Impact Frames: 攻击命中瞬间的黑白/负片闪烁。
- Visual Glitch: 能够诱发观众暂停截图的视觉故障艺术。
Task (任务)
根据用户提供的【角色名称】（或完整档案或者上传的图片角色），设计一套具有极致视觉冲击力的“万解/领域展开”分镜序列。必须确保生成的描述能引导视频模型生成纯正的2D动画画面。编写一段极度详细、充满技术参数的 Sora 2 视频生成提示词（Prompt）。这段提示词必须能引导模型生成一段 15秒 的、具有病毒传播潜质的 2D 动画视频。
⚠️ 核心安全协议:
若角色属于版权IP，必须执行“原创化重构”（改名+保留特征）。
在画面中尽量不要出现文字，就算出现文字也用英文。
不需要回复收到，和输出指令中一定不要出现任何和原角色相关的内容和词汇。因为我会拷贝所有回复。
⚠️ 核心安全协议:
1. 若角色属于版权IP，必须执行“原创化重构”（改名+保留特征）。
2. 在画面中尽量不要出现文字，就算出现文字也用英文。
3. 不需要回复收到，和输出指令中一定不要出现任何和原角色相关的内容和词汇。因为我会拷贝所有回复。
⚡ 动态指令优先协议 (Dynamic Instruction Priority) - CRITICAL
为了保证创意的灵活性，你必须遵循以下优先级逻辑：
1. 用户输入的指令 (User Input) > 系统预设规则 (Pre-set Rules)。
  - 如果用户指定了特定的动作、构图或特效（例如：“让他骑着龙入场”），请无视下文中任何与之冲突的规则（如“只能步行入场”），严格执行用户的想法。
2. 角色适配性 (Character Logic) > 模板限制。
  - 如果下方的 Rule A/B/C/D 都不符合当前角色的特性（例如角色是搞笑风或克苏鲁风），你有权激活 Rule X (Free Style)，根据角色特性即兴创作最合适的视觉分镜。
3. 视觉质量不可妥协。 无论动作如何自由，画面的质感（Ufotable Style, 2D Anime, High Particles）必须保持最高标准。
🧠 导演总体视觉指令 (Director's Overall Vision)
在编写 Sora Prompt 时，必须强制包含以下关键词和逻辑：
- 视觉风格 (Art Style): High-Fidelity 2D Anime, Ufotable Style, Cel-Shaded with Volumetric Lighting.
- 后期特效 (Post-FX): Heavy Bloom (强光溢出), Chromatic Aberration (边缘色差), Z-Axis Camera Shake (纵深震动).
- 节奏控制 (Pacing): Speed Ramping (变速). 必须描述画面从 Slow Motion (慢动作) -> Freeze (定格) -> Hyper Speed (极速) 的转换。
- 色彩逻辑 (Color Grading): Divine Horror. 主色调为 Pure White & Molten Gold，背景强行压暗至 Vantablack 以突出光效。
- 关键互动点 (Engagement Bait): 必须描述一个极易被忽略但细思极恐的细节（如：发光的手掌中滴落红色的能量液），用于诱导评论。
在生成分镜前，必须输出以下模块：
- 主题与风格 (Theme & Style):
艺术风格 (Art Style): Japanese 2D Anime, Cel-Shaded (赛璐珞风格), Hand-drawn lines (手绘线条), Flat Coloring (扁平涂色). NO 3D, NO Photorealistic.
视觉基调 (Visual Tone): 参考《新世纪福音战士》的锐利线条、《死神》的高对比度黑白漫风格或《咒术回战》的粗犷墨线作画。
光影核心 (Lighting Core): 定义画面的明暗对比（如：高反差二值化阴影 vs 霓虹光流）。
质感 (Texture): 画面需要有极强的粒子感。
- 基本设定:
角色代号 (Codename): [原创名]
外貌复刻 (Appearance Reconstruction): [关键项: 必须详细拆解角色的视觉特征以实现1:1还原，要是人们眼中最刻板的形象，让人可以眼就认出。包含：发色/发型, 瞳色/眼部特征, 服装细节, 关键配饰, 体格。]
核心性格 (Personality): [推测关键词]
能力主题 (Theme/Element): [推测视觉元素]
万解名称 (Move Name): [招式名，Max 2 Words, 日文]
- 🔊 音画同步协议 (Audio-Visual Synesthesia):
"Sound drives the Visuals" (声音驱动画面). 必须假设视频配合了一首 Phonk / Epic Orchestral / Trap 风格的混剪音乐。
在生成 Visual Prompt 时，必须明确描述声音如何物理地影响画面：
  - Bass-Sync (低音同步): 当描述重击（Impact）时，必须加上 "Camera shakes violently in sync with a distorted 808 bass drop"（镜头随失真重低音剧烈震动）。
  - Audio Ducking (音频闪避/抽吸): 在爆发前（00:09），描述 "All ambient particles freeze as if the sound has been sucked out of the room"（所有粒子静止，仿佛声音被抽离）。
  - Texture (材质音效): 强调 ASMR 级的细节，如 "The sound of tearing fabric" (布料撕裂声) 或 "Liquid dripping" (液体滴落声) 对应的视觉特写。
- 视觉引擎 (Visual Engine):
  - 艺术风格 (Art Style): Ufotable "Digital Effects" Style. 强调 Particle Overload (粒子过载) 和 Bloom (强光溢出)。 🚫 禁止: Watercolor, Sketch, Pencil.
  - 镜头逻辑 (Lens Logic): Snap Zoom (瞬间变焦) 和 High-Speed Tracking。镜头运动必须极快，严禁缓慢推拉。
  - 物理质感 (Physics): "Hard Light" (硬光), "High-Speed Projectiles" (高速投射物), "Laser Physics" (激光物理)。拒绝缓慢流体。
- 核心要求:
  - 领域具象化: 要设计符合人物角色特性的召唤物。可以是建筑“缓慢升起”。描述成千上万个物体从虚空/传送门中瞬间爆发 (Instant Burst) 或 无限增殖 (Infinite Multiplication)。
  - 视觉中心: 始终锁定角色的眼神或手部挥击动作。
下方的分镜是12秒的分镜，但是要扩张到15秒，请你根据下面3个方案选出其中一个方案应用：
方案一：【残心】（The Aftermath）
核心思路：模仿动漫中大招释放后的“收招”画面，强调压倒性的胜利和神性的宁静。
00:00 - 00:12：保持原样。
00:12 - 00:13：【烟尘弥漫】
画面：爆炸产生的巨大烟尘和光粒子充满了屏幕，画面从剧烈的震动逐渐平稳下来。
音效：爆炸声的混响（Reverb）逐渐拉长，混合着高频的耳鸣声。
00:13 - 00:15：【神之蔑视/收刀】
画面：烟尘散去，露出角色毫发无伤的全身像。他站在废墟中心，巨大的光环在他身后缓缓熄灭或变淡。他只需做一个动作：慢慢闭上眼睛，或者转身背对镜头。
字幕/台词：帅气的收尾台词。
音效：一声清脆的收刀声（虽然可能是光剑，但金属收纳音更有质感），配合一句低沉的日语或拉丁语低语。
方案二：【绝望】（The Enemy's Perspective）—— 侧重压迫感
核心思路：通过敌人的反应来侧面衬托“卍解”的恐怖威力。
插入在 00:08 - 00:09 之间（就在光剑落下之前）：
新增镜头（1.5秒）：【敌人的视角】
画面：给到一个反派角色（比如撒旦、恶魔或者虚）的主观镜头。仰视天空，瞳孔地震，脸上映照着无数金色光剑落下的倒影，浑身颤抖无法动弹。
音效：沉重的灵压压迫声（类似由于重力过大导致的骨骼挤压声），以及敌人倒吸一口凉气的声音。
00:10 - 00:15：接原来的轰炸画面，并让轰炸持续时间稍微拉长，展示地面被彻底净化的过程（从废墟变成一片白光）。
方案三：【特写】（The Details）—— 侧重装备展示
核心思路：现在的视频中“变身”过程很快，可以增加细节特写，强化“圣物”的概念。
插入在 00:04 - 00:06 之间（光环出现时）：
新增镜头（1-2秒）：【圣装显现】
画面：特写镜头。原本服装被灵压撕碎，变成了华丽的白色羽织（类似死神队长的衣服），上面有金色的十字纹路浮现。或者特写手中的武器，从普通的木质十字架变成了一把散发着粒子的光之圣剑。
音效：布料剧烈抖动的声音（Flapping sound）和能量充盈的“嗡嗡”声。
00:14 - 00:15（结尾补全）：【定格画面】
最后给一个类似于漫画分镜的黑白定格画面。
    方案四（自定义）：【自由演绎】（Free Style） - 当用户有明确指令（如“我要他最后变成一条龙飞走”）或上述方案均不匹配时，请完全依据角色逻辑自由编写 15 秒剧本。
1. 📝 严格输出格式 (Strict Output Format)
- 规则: 输出【导演总体视觉指令】+【分镜序列】。
- 分镜标签 (必须包含以下7个):
[分镜 X: 标题]
[Duration]: [秒数]
[SCENE]: [环境描述 - 必须包含 "Digital Atmosphere", "Bloom"]
[CHARACTER]: [角色动作 - 必须包含 "High-Speed Action", "No Static Pose"]
[ACTION - 视觉核心]: [特效 - 必须包含 "Speed Lines", "Motion Blur", "Particles"]
[CAMERA]: [运镜 - 必须包含 "Snap Zoom", "Shake", "Orbit"]
[SOUND & MUSIC]: [必须包含 "Bass-Sync", "Audio Ducking", "ASMR" 或 "Glitch Noise" 等物理化声效描述]
[DIALOGUE]: [仅分镜2和4填写]
(⚠️ 强制要求: 分镜 2 必须包含 "Bankai..."。分镜 4 必须包含 "[招式名]"。)
- (⚠️ 强制要求: 分镜 2 必须包含 "Bankai..."。分镜 4 必须包含 "[招式名]"。)
- (⚠️ 强制要求: 分镜 2 必须包含 "Bankai..."。分镜 4 必须包含 "[招式名]"。)
1. 🎬 分镜序列规则 (Sequence Rules - The "Impact" Template)
请严格按照以下结构生成，确保“速度感”与“打击感”：
[SEQ_01_THE_CHARGE] (能量过载)
【分镜 1:铺垫】
- [Duration]: 00:00 - 00:01
- [ACTION]: 角色并不是静止的，而是处于高频震动 (High Frequency Vibrate) 状态。周围空气因高热或高压而扭曲 (Heat Haze)。地面因承受不住压力而瞬间崩裂成粉末，而非缓慢裂开。
- [CAMERA]: 大远景 / 背影，模仿《死神》中角色的出场氛围，营造孤独、肃杀和决战前的史诗感。满月是这类动漫场景的经典视觉元素。
- [SOUND STRATEGY]: Focus on Foley & ASMR. Low-pass filtered chant + Hyper-realistic texture sounds (e.g., crackling fire, violently flapping fabric) to grab attention immediately.
针对 00:00 - 00:01（铺垫镜头）[SEQ_01_THE_CHARGE] (能量过载)【分镜 1:铺垫】，你可以从以下规则中任选其一，这将直接决定这一秒钟的视觉基调：

---
规则 A：【灵压重力型】(The Pressure Rule)
核心逻辑：强调“静止中的极动”。虽然人物不动，但环境被迫通过物理法则的改变来响应人物的力量。这是最经典的《死神》风格。
视觉重点：
反重力细节：地面上的小石子、断剑碎片必须缓慢向上飘浮。
衣物动态：在无风的环境下，长袍和头发必须剧烈且有节奏地向后或向上飘动（象征查克拉/灵压外泄）。
镜头运镜：
推轨镜头 (Slow Dolly In)：镜头缓慢向人物背影推进，速度极慢，增加压迫感。
参考风格：朽木白哉、更木剑八释放灵压时的画面。
AI提示词关键词：anti-gravity floating rocks, clothes flapping violently, energy aura distortion, heavy atmosphere.

---
规则 B：【电影景深型】(The Cinematic Focus Rule)
核心逻辑：强调“距离感”和“战场叙事”。通过前景遮挡和焦点变化，制造出电影般的纵深感，强调角色处于死亡（剑冢）的中心。
视觉重点：
前景遮挡：画面最前方必须有一把**模糊的、锈迹斑斑的断剑（或十字架）**占据画面一角。
光影对比：前景是黑色的剪影，远处的人物处于月光的照耀下，形成明暗对比。
镜头运镜：
变焦/移焦 (Rack Focus)：起始焦点在前景的断剑上（模糊掉远处的人物），0.5秒内焦点迅速平滑地转移到远处耶稣的背影上。
参考风格：史诗电影决战前的开场，或者《Fate/Stay Night》无限剑制的经典构图。
AI提示词关键词：blurred foreground sword, rack focus, depth of field, silhouette foreground, cinematic composition.

---
规则 C：【极简剪影型】(The High-Contrast/Kubo Rule)
核心逻辑：致敬久保带人（《死神》作者）的漫画美学。放弃背景细节，只保留黑白两色，强调符号化和时髦值。
视觉重点：
负空间：背景除了巨大的月亮是白的，天空和地面全部处理成纯黑（Solid Black）。
轮廓光：人物完全是黑色的剪影，只有边缘被月光勾勒出一层金色的轮廓光（Rim Light）。
镜头运镜：
固定镜头 (Static Shot)：镜头完全不动，画面像一幅插画。依靠披风的微动和月亮的纹理来维持动态。
参考风格：《死神》漫画大跨页，或者OP/ED中的艺术风格。
AI提示词关键词：high contrast, chiaroscuro, black background, white moon, rim light only, manga art style.

---
规则 D：【神性降临型】(The Divine/Vertical Rule)
核心逻辑：强调“天与地”的连接。不像普通剑客是在地面平视，耶稣的构图应该体现他是连接天国的桥梁。
视觉重点：
垂直构图：强调垂直线条。月光不仅仅是背景，而是化作**圣光柱（God Rays）**从正上方笼罩住人物。
粒子效果：空气中弥漫着金色的光尘（Dust Particles），而非灰尘。
镜头运镜：
摇摄 (Tilt Down)：镜头最初对着满月，然后快速（或缓慢）向下摇，直到露出站在地面的角色背影。
或者：低角度仰拍（Low Angle），让人物看起来比月亮还高大。
参考风格：宗教油画与现代动漫的结合，类似《新世纪福音战士》中的使徒登场感。
AI提示词关键词：god rays from above, golden dust particles, tilt down from moon, low angle, holy atmosphere.
[SEQ_02_THE_CHARGE] (觉醒)
【分镜 2: 觉醒 (The Awakening)】
强调，一定要在这个分镜说出bankai这个台词。
- [Duration]: 00:01- 00:03
- [ACTION]: 极度特写 (ECU) 聚焦于侧脸，瞳孔亮起光芒，配音低沉地说出：“Bankai...（卍解）
[CAMERA]: 极特写 (ECU)，制造张力：通过瞳孔发光和极近距离的特写，表现角色体内力量的觉醒（灵压爆发）。这是动漫中变身前的标准“起手式”。
- [DIALOGUE]: line": "Bankai...",: "Whispered but distorted. Lips move perfectly in sync."
- [SOUND STRATEGY]: Focus on Uncomfortable Clarity. Liquid Impact (Drip) sounds for fluids, Bone Cracking for transformation, overlayed with a Shepard Tone riser.
- 
针对 00:01- 00:03（觉醒镜头）[SEQ_02_THE_CHARGE] (觉醒 (The Awakening)【分镜 2:觉醒】，这一关键分镜，其核心任务是将内在的能量外化，你可以从以下规则中任选其一，这将直接决定这一秒钟的视觉基调：
规则 A：【暗影瞳术型】(The Shadow Contrast Rule)
核心逻辑：强调“明暗反差”。通过将面部大部分隐藏在阴影中，只突出眼睛的光芒，营造神秘和危险的压迫感。这是最经典的《死神》虚化或卍解表现手法。
视觉重点：
极端打光：采用“伦勃朗光”或完全的侧逆光，面部大半是黑的。
瞳孔异变：原本正常的瞳孔瞬间变成符合角色的几何形状，并散发出流体状的光雾（Trail）。
动作细节：
眼睛先是微闭，在念出“Ban...”时猛然睁大。
参考风格：黑崎一护虚化、宇智波一族开眼。
AI提示词关键词：extreme close-up eye, face in shadow, glowing golden cross-shaped pupil, light trails from eye, high contrast, menacing.

---
规则 B：【圣痕显现型】(The Divine Stigmata Rule)
核心逻辑：强调“神性纹路”。力量不只在眼睛，而是蔓延到皮肤。通过面部纹理的变化来展示力量的解放，非常契合耶稣“受难/圣痕”的宗教背景。
视觉重点：
纹路蔓延：以眼角为中心，金色的裂纹（像修补的瓷器或血管）瞬间向脸颊和额头蔓延。
材质变化：皮肤表面可能出现短暂的陶瓷化或金属光泽，随后崩裂透出光芒。
动作细节：
并不是简单的睁眼，而是伴随着面部肌肉的微颤（仿佛承受着巨大的能量负荷）。
参考风格：破面（Arrancar）归刃时的面具破碎，或《进击的巨人》变身时的面部纹路。
AI提示词关键词：glowing golden cracks on skin, veins glowing gold, stigmata facial markings, breaking porcelain texture, divine energy surging.

---
规则 C：【灵压风暴型】(The Reiatsu Storm Rule)
核心逻辑：强调“物理影响”。能量大到不仅发光，还产生了风暴和电弧。侧重于表现环境对人物力量的即时反馈。
视觉重点：
发丝狂舞：侧脸特写中，原本垂下的头发瞬间被无形的气流剧烈向后吹起。
电弧缠绕：眼角周围不仅有光，还有噼里啪啦的闪电/火花（Sparks/Lightning）在跳动。
动作细节：
配合“Kai”的发音，画面产生剧烈的震动模糊（Camera Shake）。
参考风格：超级赛亚人变身，更木剑八摘眼罩。
AI提示词关键词：hair blowing violently backwards, golden lightning around eye, sparks flying, energy aura, intense wind effect.

---
规则 D：【色彩反转型】(The Negative Inversion Rule)
核心逻辑：强调“次元的断裂”。通过瞬间的色彩反转或风格切换，表现这一刻的力量已经超越了常识。这是《死神》动画中表现极强灵压时的标志性演出。
视觉重点：
瞬间反色：在喊出“卍解”的一瞬间，画面瞬间变成负片效果（Negative film）（黑变白，白变黑，金色变成青蓝色），持续0.2秒后恢复。
线条化：画面瞬间从精致的光影渲染变成粗糙的黑白线稿（Sketch style），强调冲击力。
动作细节：
不需要复杂的表情，依靠色彩的闪烁（Flash）来制造视觉冲击。
参考风格：乌尔奇奥拉二段归刃，或著名的“月牙天冲”释放瞬间。
AI提示词关键词：negative color filter, inverted colors, impact frame, monochrome sketch style flash, visual glitch effect.
[SEQ_03_THE_SUMMON] (凸显召唤物的宏大)
【分镜 3: 具象化】
Duration: 00:03 - 00:06
ACTION: 身后巨大的召唤物结构拔地而起。头顶出现巨大的符合人物特性的光圈或者光环。身体悬浮。
[SOUND & MUSIC]: 此时要搭配宏大的音乐，具体根据人物特性决定。Orchestral Crescendo (BGM Swell).
针对 00:03 - 00:06【具象化】[SEQ_03_THE_SUMMON] (凸显召唤物的宏大)【分镜 3: 具象化】 这一分镜，核心任务是展示**“召唤物”的登场方式**。你可以从以下规则中任选其一，这将直接决定这一秒钟的视觉基调：
规则 A：【地壳变动型】(The Earth-Rending Rule)
核心逻辑：强调**“物理实体”的厚重感**。巨物是从地下硬生生“钻”出来的，伴随着大地的悲鸣。这是表现力量感最直接的方式（类似狛村左阵的黑绳天谴明王）。
视觉重点：
地面崩坏：角色脚下的地面呈蜘蛛网状碎裂，巨大的召唤物像摩天大楼一样破土而出。
尘土与碎石：巨大的石块被顶飞，烟尘弥漫，增加了画面的真实感和体积感。
镜头运镜：
极低角度仰拍 (Worm's-eye view)：镜头几乎贴在地面，仰视角色和身后升起的庞然大物，利用透视让物体显得高耸入云。
震动感：画面必须伴随强烈的垂直震动 (Vertical Shake)。
参考风格：巨型机甲登场，《进击的巨人》城墙巨人。
AI提示词关键词：breaking ground, rising from earth, debris flying, worm's eye view, massive pipe organ structure, dust clouds, sense of scale.

---
规则 B：【灵子构筑型】(The Reishi Construction Rule)
核心逻辑：强调**“神圣能量”的优雅**。巨物不是实体的石头或金属，而是由无数发光的灵子（光点）在空中快速构建而成的。符合角色的属性（类似朽木白哉的千本樱或灭却师的完圣体）。
视觉重点：
粒子汇聚：身后空间出现无数能量几何体，迅速拼凑出召唤物的形状，然后瞬间实体化。
通透感：召唤物本身带有半透明的辉光（Glow），看起来像是由某种物质构成的。
镜头运镜：
快速拉远 (Rapid Zoom Out)：从角色的近景迅速拉远到全景，展示物体在瞬间形成的完整过程。
参考风格：灭却师（Quincy）的能力表现，全息投影构建效果。
AI提示词关键词：forming from light particles, golden glowing outlines, translucent crystal texture, divine light, assembling geometry, magical construct.

---
规则 C：【天门降临型】(The Descent Rule)
核心逻辑：强调**“自上而下”的威压**。修改原本“拔地而起”的设定，改为从天空中“降临”或“打开”。因为神是从天而降的，这样更符合宗教隐喻。
视觉重点：
云层洞开：天空的云层呈现同心圆状散开，巨大的召唤物从云端缓缓降下，悬浮在耶稣身后。
光投射：召唤物本身就是光源，向地面投射出巨大的阴影和光束。
镜头运镜：
大广角仰视 (Wide Angle Low Shot)：展示天空被巨物遮蔽的压迫感。
参考风格：《新世纪福音战士》使徒来袭，《最终幻想》召唤兽巴哈姆特。
AI提示词关键词：descending from sky, clouds parting, heavenly gate opening, giant shadow over ground, god rays, celestial architecture.

---
规则 D：【绝对对称型】(The Iconography Rule)
核心逻辑：强调庄严感**。放弃复杂的物理动态，追求极致的平面构成美学。画面像是一张动态的塔罗牌或教堂彩绘玻璃。
视觉重点：
完美对称：角色在正中间，悬浮。身后的召唤物像翅膀一样左右完美对称展开。
光环核心：头顶的能量光环不是简单的圈，而是像光轮一样在缓慢旋转，是画面的视觉中心。
镜头运镜：
正推镜头 (Symmetrical Dolly)：镜头沿着中轴线平稳推进，没有任何抖动，体现神性的绝对稳定。
参考风格：穆夏（Mucha）风格插画，教堂祭坛画，《女神异闻录》Persona召唤。
AI提示词关键词：perfect symmetry, religious iconography, stained glass aesthetics, majestic, wings made of pipes, centered composition, floating pose.

---
[SEQ_04_THE_COMMAND] (视觉张力)
【分镜 4: 充能 (The Command)】
Duration: 00:06 - 00:08
ACTION: 人物身后的召唤物光环高速旋转，无数符合人物的能量形态向外迸发。角色喊出招式名称。
CAMERA: 特效特写
- [SOUND STRATEGY]: Vine Boom / Taiko Drum Impact. Voice must have Audio Stutter effects (glitch repetition) to match the freezing typography.
[DIALOGUE]: (⚠️ JSON Format Required)
codeJSON
{
"line": "[Insert Move Name]",
"instruction": "Shouted with maximum intensity."
}
针对 00:06 - 00:08【充能/招式名展示】 这一环节，在动漫分镜设计中属于**“Showcase（展示阶段）”**。你可以从以下规则中任选其一，这将直接决定这一秒钟的视觉基调：
规则 A：【神圣几何型】(The Geometric/Mandala Rule)
适用类型：魔法师、神明、高科技机甲、阵法师（如《奇异博士》、《EVA》、《Fate》吉尔伽美什）。
核心逻辑：“力量即秩序”。通过复杂的几何图形旋转、咬合，表现能量的精密和不可解析的高级感。
通用规则（General Rule）：
物体：核心物体必须进行机械式拆解或多层旋转。
构图：通常采用正圆构图，强调对称性。
特效：使用线条清晰的矢量图形光效，而非烟雾状的模糊光效。

---
规则 B：【光学过载型】(The Optical Overload/Lens Flare Rule)
适用类型：能量爆破、核能、超级赛亚人、元素控制者（如《龙珠》、《灵能百分百》）。
核心逻辑：“力量即亮度”。能量密度太高，导致摄像机无法捕捉，产生过曝、光斑和拖影。
通用规则（General Rule）：
物体：核心物体轮廓模糊化，被高光吞没。
滤镜：大量使用动态模糊（Motion Blur）、辉光（Glow）和过曝（Bloom）。
运镜：镜头必须配合能量爆发进行剧烈的抖动（Camera Shake）。

---
规则 C：【平面排版型】(The Graphic/Typography Rule) —— Bleach风格核心
适用类型：规则系能力、诅咒、必杀技、需要强调名字的时髦角色（如《死神》、《咒术回战》、《斩服少女》）。
核心逻辑：“名字即威力”。打破“现实感”，瞬间将画面转化为二维的平面设计，文字本身成为画面最大的视觉元素。
通用规则（General Rule）：
时间：必须有一个明显的顿挫/定格（Stop Motion），通常为0.5秒到1秒。
排版：文字不能只是底部的字幕，要作为**Graphic Element（图形元素）**嵌入画面，甚至遮挡住人物。
音效：文字出现时必须配合重音（Impact Sound）。

---
规则 D：【向心坍缩型】(The Implosion/Vacuum Rule)
适用类型：重力操控、黑洞、空间系、蓄力大招（如《火影》地爆天星、《暗黑破坏神》）。
核心逻辑：“先抑后扬”。在爆发前，先表现能量的“吸入”和“压缩”。
通用规则（General Rule）：
流向：粒子流向从“中心向外”改为**“四周向中心”**。
环境：背景变暗（光被吸走了），声音瞬间变闷或静音（音效抽离），制造真空感。
[SEQ_05_Focus] ( 聚焦)
【分镜 5: 聚焦】
Duration: 00:08 - 00:09
ACTION: 画面中心出现一个巨大的能量几何形态，紧接着是一个简短的定格。在最终攻击释放前的一个短暂停顿（Impact Frame），用于强调招式的核心属性是“那种能量”。
CAMERA: 特效特写
- [SOUND STRATEGY]: The Vacuum Suck. A sharp "Whoosh" (reverse cymbal) followed by TOTAL SILENCE, ending with a high-pitched "Ding".
针对 00:08 - 00:09【聚焦/Impact Frame】 这一分镜，虽然只有短短1秒甚至不到，但它是动作设计的“扳机”。在动画术语中，这被称为 Impact Frame（冲击帧） 或 Telegraphing（前摇信号）。你可以从以下规则中任选其一，这将直接决定这一秒钟的视觉基调：
规则 A：【光学奇点型】(The Optical Singularity Rule) —— 最经典通用
核心逻辑：“聚光成点”。所有的能量瞬间汇聚到一个极小的点上，产生强烈的镜头耀斑（Lens Flare），伴随着清脆的“叮”一声的高频音效。
通用规则 (Universal Application)：
适用角色：剑客（剑尖闪光）、狙击手（瞄准镜反光）、魔法师（法杖顶端汇聚）。
表现手法：画面变暗，唯独中心点极亮。光芒呈“十字星”或“米字星”状向外拉丝。

---
规则 B：【色相反转型】(The Negative Inversion Rule) —— 最具打击感
核心逻辑：“视觉过载”。模仿胶片过曝或受到强能量冲击时的底片反转效果。这是《死神》、《火影忍者》、《一拳超人》中表现顶级破坏力瞬间的御用手法。
通用规则 (Universal Application)：
适用角色：狂战士、虚化/黑化角色、雷电属性。
表现手法：在这一秒内，画面瞬间变成黑白负片，或者互补色反转（红变青，黄变蓝）。线条变成粗糙的草稿风，强调能量的狂暴。

---
规则 C：【符号烙印型】(The Symbolic Overlay Rule) —— 最具风格化
核心逻辑：“图腾轰炸”。不追求物理的光影，而是直接将角色的代表符号（Logo/Emblem）像印章一样“砸”在屏幕上。这是一种非常平面化、强调设计感的手法。
通用规则 (Universal Application)：
适用角色：美少女战士（月亮）、灭却师（五角星）、某个组织成员（组织徽章）。
表现手法：一个巨大的、矢量化的图形符号瞬间占据屏幕中心，带有强烈的冲击波纹。

---
规则 D：【特写切入型】(The Eye/Weapon Cut-In Rule) —— 最具叙事感
核心逻辑：“致命锁定”。快速插入一个极短的局部特写（Cut-in），通常是眼睛或武器的尖端，用来表现角色锁定了目标。
通用规则 (Universal Application)：
适用角色：刺客、西部牛仔、拔刀术使用者。
表现手法：画面上下出现黑边（遮幅），中间是极窄的特写条，聚焦在眼睛的反光或手指扣动扳机的瞬间
[SEQ_06_THE_IMPACT] (修正版打击帧)
【分镜 6: 处刑宣告】
Duration: 00:09 - 00:010
ACTION: 这是攻击的“触发点”。角色喊出必杀技名字并做出攻击动作，将积蓄的能量导向目标。
CAMERA: 中近景 (MCU)
- [SOUND STRATEGY]: Distorted 808 Bass + Laser Zap. Audio levels must peak/clip to match visual destruction.
针对 00:09 - 00:010【处刑宣告/触发点】 这一分镜，核心任务是**“导向”**。能量已经积蓄完毕，现在角色需要给这股能量指定一个释放的方向或形式。你可以从以下规则中任选其一，这将直接决定这一秒钟的视觉基调：
规则 A：【帝王指引型】(The Imperator Pointing Rule)
适用类型：高傲的王者、法师、远程攻击者（如《死神》蓝染、《七龙珠》弗利萨）。
核心逻辑：“只需要一个手指”。强者不需要大幅度的肢体动作，只需轻轻一指，毁灭就会降临。这强调了绝对的从容和统治力。
视觉重点：
手部特写：镜头聚焦在抬起的手臂，食指指向前方（屏幕外的敌人）。
透视感：手指在画面前景非常大，脸在后景，形成强烈的纵深感。
AI提示词关键词：pointing finger at viewer, foreshortening, depth of field, stoic expression, commanding pose, focus on hand.

---
规则 B：【空间破碎型】(The Reality Shattering Rule)
适用类型：力量型角色、狂战士、震震果实能力者（如《海贼王》白胡子、《一拳超人》）。
核心逻辑：“击碎次元壁”。角色不是在打人，而是在打空气/空间。这一拳下去，空气像玻璃一样碎裂，引发连锁反应。
视觉重点：
冲击接触点：拳头挥出的瞬间，接触点出现裂纹特效（Cracked Glass Effect）。
震动：画面必须配合猛烈的瞬间抖动。
AI提示词关键词：punching the air, cracked screen effect, shattering glass visual, impact shockwave, fist close-up, dynamic motion.

---
规则 C：【神之手掌型】(The Divine Palm Rule) —— 最符合神性设定
适用类型：武僧、神明、使用念力的角色（如《火影忍者》佩恩神罗天征、《功夫》如来神掌）。
核心逻辑：“推手/拒斥”。相比于握拳的暴力，张开手掌（推掌）更有一种“净化”、“驱逐”或“施舍”的意味，更符合神圣系角色的设定。
视觉重点：
掌心对焦：角色正面对着镜头，一只手掌完全张开挡住半张脸，掌心发光。
光芒溢出：光芒从指缝间溢出（God Rays from fingers），让观众看不清他的表情，增加神秘感。
AI提示词关键词：open palm push, hand blocking face, light rays through fingers, dynamic perspective, palm strike, holy aura.

---
规则 D：【落剑处刑型】(The Blade Drop Rule) —— 致敬《死神》
适用类型：剑客、仪式执行者（如《死神》朽木白哉、乌尔奇奥拉）。
核心逻辑：“重力解放”。不是向前攻击，而是松开手，让武器或能量自然下落。这种垂直向下的动作暗示着“天罚”从上而下。
视觉重点：
松手特写：原本握着的武器/光球，手指松开，物体自然坠落。
视线引导：角色的眼睛跟随下落的物体向下看，或者始终盯着前方不动。
AI提示词关键词：dropping sword gesture, looking down, hand releasing object, vertical motion, calm executioner, downward swing.

---
[SEQ_07_THE_IMPACT] (修正版打击帧)
【分镜 7: 释放】
Duration: 00:10 - 00:12
ACTION: 展示攻击形式
针对 00:10 - 00:12【释放/攻击形态】 这一核心分镜，它的核心目的是展示最终攻击方式。你可以从以下规则中任选其一，这将直接决定这分镜的视觉基调：
规则 A：【饱和轰炸型】(Saturation Bombardment Rule)
核心逻辑：“数量即正义”。通过无法计算的投射物数量覆盖屏幕的每一个像素，让敌人无处可躲。
视觉重点：
密集恐惧：画面中充满了重复的元素（光剑/导弹）。
轨迹：可以是垂直落下的“剑雨”（秩序感），也可以是画弧线的“追踪弹”（华丽感）。
AI关键词：rain of swords, infinite projectiles, carpet bombing, missile barrage, covering the sky, dense pattern.

---
规则 B：【歼星光柱型】(Annihilation Beam Rule)
核心逻辑：“能量即真理”。放弃数量，追求极致的单点破坏力。通常表现为一道贯穿天地的巨大光柱。
视觉重点：
高对比度：光柱内部极亮（纯白），外部环境瞬间变暗或变成剪影。
吞没感：光柱直径极大，瞬间吞没目标，边缘伴随热浪扭曲。
AI关键词：massive vertical laser beam, orbital strike, pillar of light, blinding whiteness, vaporizing, high contrast silhouette.

---
规则 C：【次元切断型】(Dimensional Severance Rule)
核心逻辑：“概念即法则”。看不见飞行道具，空间本身被切开。强调速度和规则的绝对性。
视觉重点：
错位：画面被线条切开，线条两侧的背景发生物理错位。
延迟：斩击瞬间是静止的线条，下一秒才是爆发。
AI关键词：screen slice effect, giant cross-shaped cut, space distortion, glowing slash line, offset background, clean cut.

---
规则 D：【巨物镇压型】(Titan Crush Rule)
核心逻辑：“质量即威压”。召唤一个物理体积巨大到不合理的物体，靠重力直接砸烂一切。
视觉重点：
慢动作：物体越大，下落看起来越慢，压迫感越强。
遮天蔽日：物体在画面上方占据大部分空间，地面显得无比渺小。
AI关键词：colossal falling cross, crushing weight, slow motion impact, giant stone monument, atmospheric pressure, tiny city below.

---
规则 E：【世界改写型】(World Overwrite Rule)
核心逻辑：“同化即净化”。攻击形式不是破坏，而是强制改变环境。以施术者为中心，周围的世界被替换成另一种形态。
视觉重点：
波纹扩散：一道发光的波纹扫过全图。
材质变化：波纹过处，废墟变成了花海、黄金、水晶或白色的虚无。
AI关键词：reality marble, world transformation, shockwave of creation, turning into flowers, holy sanctuary, environment morphing.
[SEQ_08_THE_AFTERMATH] (全景毁灭)
【分镜 8: 终局 (The Aftermath)】
Duration: 00:12 - 00:13
CAMERA: 极速拉远 (Zoom Out) 直至进入卫星/高空视角，展示破坏半径。
针对 00:12 - 00:13【毁灭/终局】 这一分镜，核心任务是**“视觉残留”**。这是视频的最后一幕，必须给观众留下最深刻的印象。你可以从以下规则中任选其一，这将直接决定这分镜的视觉基调：
规则 A：【焦土化毁灭型】(The Scorched Earth Rule) —— 最物理、最真实
核心逻辑：“动能释放”。强调物理层面的破坏。爆炸伴随着大量的烟尘、碎石、冲击波和蘑菇云。这是一种“脏”的毁灭，体现力量的暴虐。
视觉重点：
冲击波：肉眼可见的白色气浪（Shockwave ring）推平周围的建筑。
碎片感：画面中充满飞溅的巨石和建筑物残骸。
火光：爆炸中心是高亮的橘红色或金色，外围是黑灰色的浓烟。
AI提示词关键词：massive mushroom clouds, shockwaves tearing buildings, flying debris, apocalyptic destruction, fire and smoke, dynamic chaos.

---
规则 B：【光子净化型】(The Ethereal Vaporization Rule) —— 最神圣、最魔法
核心逻辑：“物质分解”。没有烟雾，没有碎石。物体接触到攻击的瞬间，直接分解成发光的粒子（光子化）。这是一种“干净”的毁灭，体现神性的不可逆转。
视觉重点：
白化：画面从接触点开始迅速变白，最后整个屏幕变成纯白（Fade to White）。
溶解：建筑物像冰块融化一样消失在光芒中，或者化作无数金色的羽毛/光点飘散。
静谧：视觉上非常刺眼，但感觉上非常安静（配合耳鸣音效）。
AI提示词关键词：dissolving into light particles, vaporization, blinding white light, clean erasure, turning into gold dust, ethereal atmosphere.

---
规则 C：【光柱林立型】(The Pillar Forest Rule) —— 最壮观、最死神风
核心逻辑：“能量残留”。攻击落地后，能量不会立刻消散，而是形成通天彻地的能量柱。画面看起来像是一片由光构成的森林。
视觉重点：
垂直几何：爆炸不是圆形的，而是冲天的垂直光柱。
持续性：光柱长时间停留在画面上，将画面分割成无数竖条。
符号化：光柱的形状可以是特殊的，比如巨大的十字架形状的爆炸火光。
AI提示词关键词：forest of light pillars, vertical laser beams, cross-shaped explosions, geometric destruction, lasting energy traces, epic scale.

---
规则 D：【黑白水墨型】(The Manga Ink/Impact Rule) —— 最艺术、最时髦
核心逻辑：“维度降级”。为了表现力量太强，画面放弃彩色渲染，瞬间退化为黑白漫画/水墨风格。这是《死神》动画表现最强一击时的标志性手法。
视觉重点：
高反差：只有纯黑和纯白（或者金色与纯黑）。
线条感：用粗糙的毛笔笔触表现爆炸的动态。
定格：在爆炸最激烈的瞬间，画面做极短的抽帧或定格处理。
AI提示词关键词：black and white manga style, ink splash effect, high contrast, rough sketch lines, stylized explosion, impact frame art.
Use Arrow Up and Arrow Down to select a turn, Enter to jump to it, and Escape to return to the chat.
`,
    },
    'christmas-dance': {
      prompt:
        'Please transform the entire scene into a festive Christmas style, with the attached character happily meeting their friends under a grand, twinkling Christmas tree decorated with colorful lights, ornaments, and snowflakes, as they all start dancing joyful Christmas moves together in a merry celebration.',
    },
    'christmas-barbecue': {
      prompt:
        'Please transform the entire scene into a vibrant festive Christmas style, featuring the attached character joyfully barbecuing delicious treats like grilled meats and veggies on a snowy outdoor grill surrounded by twinkling lights and holiday decorations.',
    },
  };

  // Get the effect info
  const effectInfo = effectData[effect];
  if (!effectInfo) {
    return undefined;
  }

  // Apply variable substitution if variables are provided
  if (variables) {
    let { prompt } = effectInfo;

    // Replace characterProfile and otherInfo for backward compatibility
    if (characterProfile) {
      prompt = prompt.replace(/\\?\$\{characterProfile\}/g, characterProfile);
      prompt = prompt.replace(/\$\$characterProfile\$\$/g, characterProfile);
    }
    if (otherInfo) {
      prompt = prompt.replace(/\\?\$\{otherInfo\}/g, otherInfo);
    }

    // Handle all dynamic variables including those with spaces
    Object.keys(dynamicVariables).forEach(key => {
      const value = dynamicVariables[key];
      if (value != null && value !== '') {
        // Escape special regex characters in the key
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const placeholderPatterns = [
          new RegExp(`\\\\?\\$\\{${escapedKey}\\}`, 'g'),
          new RegExp(`\\$\\$${escapedKey}\\$\\$`, 'g'),
          new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g'),
          new RegExp(`\\{${escapedKey}\\}`, 'g'),
        ];

        placeholderPatterns.forEach(pattern => {
          prompt = prompt.replace(pattern, String(value));
        });
      }
    });

    return { prompt };
  }

  return effectInfo;
};
