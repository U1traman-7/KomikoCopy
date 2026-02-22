/**
 * Image Animation Generator Tool Configuration
 * Describes the tool's functionality and features for AI content generation
 */

export const toolConfig = {
  name: "Image Animation Generator",
  description: "Image Animation Generator is an AI-powered tool that transforms static images into dynamic, lifelike animations. Using advanced AI technology, it brings photos, artwork, and illustrations to life with natural movements, breathing effects, and subtle animations that captivate viewers.",

  primaryFunction: "Static image to animated video conversion",

  keyFeatures: [
    "Transform static images into dynamic animations",
    "Natural breathing and subtle movement effects",
    "Support for photos, artwork, and illustrations",
    "Multiple animation styles: realistic, anime, cartoon, artistic",
    "Facial animation with eye movement and expressions",
    "Background and environmental animation effects",
    "High-quality video output up to 1080p resolution",
    "Customizable animation duration and intensity"
  ],

  targetAudience: [
    "Content creators and social media influencers",
    "Digital artists and illustrators",
    "Photographers and portrait artists",
    "Marketing professionals creating engaging content",
    "Anime and character art enthusiasts",
    "Video editors and motion graphics designers"
  ],

  useCases: [
    "Animate portrait photos for social media content",
    "Bring character artwork and illustrations to life",
    "Create animated profile pictures and avatars",
    "Transform anime artwork into dynamic animations",
    "Generate animated content from comic book panels",
    "Create engaging marketing visuals from static images",
    "Animate family photos and memories",
    "Transform landscape photos with environmental effects"
  ],

  technicalSpecs: {
    inputFormats: ["JPG", "PNG", "WEBP"],
    maxFileSize: "10MB",
    outputFormat: "MP4",
    outputQuality: "Up to 1080p HD",
    animationDuration: "5-10 seconds",
    processingTime: "2-5 minutes depending on complexity"
  },

  uniqueSellingPoints: [
    "AI-powered natural movement generation",
    "Preserves original image quality and style",
    "Multiple animation types: breathing, blinking, hair movement",
    "Smart facial feature detection and animation",
    "Customizable animation intensity and style",
    "Fast processing with high-quality results",
    "Support for various art styles and photo types",
    "Easy-to-use interface with instant preview"
  ],

  // 随机展示视频
  examples: [
    {
      "Prompt": "Anime girl skating fast through neon-lit alley at night, making sharp turns, wind in her hair, tracked from behind. Glowing signs reflect on wet pavement as she speeds past narrow alleys.",
      "Video": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/app_media/running.webm",
      "model": "Anime Pro"
    },
    {
      "Prompt": "Anime boy suddenly draws a gun and fires with a flash of light, intense expression, dramatic camera angle. He immediately turns and runs down the street.",
      "Video": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/app_media/man.webm",
      "model": "Anime Pro"
    },
    {
      "Prompt": "Anime-style battle scene. A young warrior with a glowing sword clashes with a giant, demonic monster with glowing eyes and sharp teeth. Fast-paced swordfight, sparks fly, intense close-ups. Ends with the hero slaying the monster in a dramatic final strike. Dark background, cinematic lighting, glowing particles.",
      "Video": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/app_media/monster.webm",
      "model": "Anime Pro"
    },
    {
      "Prompt": "The boy slowly lean in, gently holds the girl’s face and share a soft kiss. Cherry blossom petals float around them, soft lighting and warm atmosphere, close-up shots and slow motion, cinematic anime style.",
      "Video": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/app_media/kiss.webm",
      "model": "Anime Pro"
    },
    // Kling
    {
      "Prompt": "A girl is talking to herself peacefully",
      "Video": "/images/examples/image-animation-generator/output5.webm",
      "model": "Kling"
    },
    // Ray
    {
      "Prompt": "A girl is talking sadly",
      "Video": "/images/examples/image-animation-generator/output4.mp4",
      "model": "Ray"
    },
    {
      "Prompt": "A girl is talking sadly",
      "Video": "/images/examples/image-animation-generator/output6.mp4",
      "model": "Ray"
    },
    // AniSora
    {
      "Prompt": "In the video, five girls dance as the camera zooms in. They sing while raising their left hands overhead, then pulling them down to knee level.",
      "Video": "/images/pages/anisora/example2.webm",
      "model": "AniSora"
    },
    {
      "Prompt": "The figures in the picture are sitting in a forward moving car waving to the rear, their hair swaying from side to side in the wind",
        "Video": "/images/pages/anisora/example1.webm",
      "model": "AniSora"
    },
    {
      "Prompt": "In the frame, a person sprints forward at high speed, their motion appearing slightly blurred from the velocity.",
      "Video": "/images/pages/anisora/example3.webm",
      "model": "AniSora"
    },
    {
      "Prompt": "The man on the left presses his lips tightly together, his face etched with fury and resolve. Every line of his expression radiates both profound frustration and unshakable conviction. Meanwhile, the other man's jaw hangs open—poised as if to erupt into a shout or impassioned declaration.",
      "Video": "/images/pages/anisora/example4.webm",
      "model": "AniSora"
    },
    // Vidu Q1
    {
      "Prompt": "A fairy sits in the blossom as the petals open",
      "Video": "/images/pages/vidu/flower.webm",
      "model": "Vidu Q1"
    },
    {
      "Prompt": "A cat turns into a tiger",
      "Video": "/images/pages/vidu/cat.webm",
      "model": "Vidu Q1"
    },
    {
      "Prompt": "A man slowly draws his sword",
      "Video": "/images/pages/vidu/man_sword.webm",
      "model": "Vidu Q1"
    },
    {
      "Prompt": "The camera quickly zooms in on the man from a distance",
      "Video": "/images/pages/vidu/man.webm",
      "model": "Vidu Q1"
    },
    // FramePack
    {
      "Prompt": "The girl suddenly took out a sign that said “cute” using right hand.",
      "Video": "/images/pages/frame-pack-ai-video-generator/girl.webm",
      "model": "FramePack"
    },
    // Veo 3
      {
      "Prompt": "In rural Ireland, circa 1860s, two women, their long, modest dresses of homespun fabric whipping gently in the strong coastal wind, walk with determined strides across a windswept cliff top. The ground is carpeted with hardy wildflowers in muted hues. They move steadily towards the precipitous edge, where the vast, turbulent grey-green ocean roars and crashes against the sheer rock face far below, sending plumes of white spray into the air.",
      "Video": "/images/pages/veo3/example1.webm",
      "model": "Veo 3"
    },
    {
      "Prompt": "A detective interrogates a nervous-looking rubber duck. \"Where were you on the night of the bubble bath?!\" he quacks. Audio: Detective's stern quack, nervous squeaks from rubber duck.",
      "Video": "/images/pages/veo3/example2.webm",
      "model": "Veo 3"
    },
    {
      "Prompt": "A medium shot frames an old sailor, his knitted blue sailor hat casting a shadow over his eyes, a thick grey beard obscuring his chin. He holds his pipe in one hand, gesturing with it towards the churning, grey sea beyond the ship's railing. \"This ocean, it's a force, a wild, untamed might. And she commands your awe, with every breaking light\"",
      "Video": "/images/pages/veo3/example3.webm",
      "model": "Veo 3"
    },
    {
      "Prompt": "A woman, classical violinist with intense focus plays a complex, rapid passage from a Vivaldi concerto in an ornate, sunlit baroque hall during a rehearsal. Their bow dances across the strings with virtuosic speed and precision. Audio: Bright, virtuosic violin playing, resonant acoustics of the hall, distant footsteps of crew, conductor's occasional soft count-in (muffled), rustling sheet music.",
      "Video": "/images/pages/veo3/example4.webm",
      "model": "Veo 3"
    },
    {
      "Prompt": "A close up in a smooth, slow pan focuses intently on diced onions hitting a scorching hot pan, instantly creating a dramatic sizzle. Audio: distinct sizzle.",
      "Video": "/images/pages/veo3/example5.webm",
      "model": "Veo 3"
    },
    {
      "Prompt": "A delicate feather rests on a fence post. A gust of wind lifts it, sending it dancing over rooftops. It floats and spins, finally caught in a spiderweb on a high balcony.",
      "Video": "/images/pages/veo3/example6.webm",
      "model": "Veo 3"
    },
    {
      "Prompt": "A keyboard whose keys are made of different types of candy. Typing makes sweet, crunchy sounds. Audio: Crunchy, sugary typing sounds, delighted giggles.",
      "Video": "/images/pages/veo3/example7.webm",
      "model": "Veo 3"
    },
    {
      "Prompt": "A medium shot, historical adventure setting: Warm lamplight illuminates a cartographer in a cluttered study, poring over an ancient, sprawling map spread across a large table. Cartographer: \"According to this old sea chart, the lost island isn't myth! We must prepare an expedition immediately!\"",
      "Video": "/images/pages/veo3/example8.webm",
      "model": "Veo 3"
    },
    {
      "Prompt": "The girl is dancing and singing",
      "Video": "/images/examples/image-animation-generator/output2.mp4",
      "model": "Veo 3"
    },
    // Marey
    {
      "Prompt": "Camera Control - Professional cinematic camera movements and angles",
      "Video": "https://framerusercontent.com/assets/qNhzpeN3vAxl04mGH91EPsPbKow.mp4",
      "model": "Marey"
    },
    {
      "Prompt": "Motion Transfer - Advanced motion capture and animation techniques",
      "Video": "https://framerusercontent.com/assets/kccjyMwuMfI0AFrAKIP2JIVYFk.mp4",
      "model": "Marey"
    },
    {
      "Prompt": "Trajectory Control - Precise object movement and path animation",
      "Video": "https://framerusercontent.com/assets/dVjvNN7XHGWupVsi6AppNGUCL4k.mp4",
      "model": "Marey"
    },
    {
      "Prompt": "Keyframing - Advanced keyframe animation and temporal control",
      "Video": "https://framerusercontent.com/assets/n2GMFj97mJ15e8X2Qulx9RRQNbs.mp4",
      "model": "Marey"
    },
    {
      "Prompt": "Reference Control - Character and object reference-based animation",
      "Video": "https://framerusercontent.com/assets/FsvuMqquKIb3qL6gk1FLCzOblo.mp4",
      "model": "Marey"
    },
    {
      "Prompt": "Pose Control - Human pose and gesture animation control",
      "Video": "https://framerusercontent.com/assets/USHQ1X6sdrPzGGECy1sxY4DZzU.mp4",
      "model": "Marey"
    }
  ,
    // Midjourney
    {
      "Prompt": "Anime maid girl in frilly black and white uniform walking toward camera carrying tea tray, warm cafe lighting, soft focus background with customers, golden hour sunlight through windows, gentle approach movement",
      "Video": "/images/pages/midjourney/example3.webm",
      "model": "Midjourney"
    },
    {
      "Prompt": "Pixel art surfer riding massive blue wave with white foam, dynamic surfing action, retro 8-bit style animation, ocean spray and water movement, bright blue sky with clouds, smooth wave motion",
      "Video": "/images/pages/midjourney/example4.webm",
      "model": "Midjourney"
    },
    {
      "Prompt": "Silhouetted tribal warrior in orange robes walking with spotted hyena companion across misty savanna, minimalist art style, soft gradient sky transitioning from dawn to dusk, gentle walking animation, atmospheric African landscape",
      "Video": "/images/pages/midjourney/example5.webm",
      "model": "Midjourney"
    },
    {
      "Prompt": "Ethereal girl with flowing white hair walking gracefully through shallow water, sunlight creating dancing ripples, floating white lilies, gentle water movement with each step, serene forest pond, soft golden lighting",
      "Video": "/images/pages/midjourney/example6.webm",
      "model": "Midjourney"
    }
  ,
    // Moonvalley examples with Marey model
    {
      "Prompt": "Camera Control - Dynamic camera movements and perspective shifts",
      "Video": "https://framerusercontent.com/assets/1JtuLaMQc0uI9ZtAxtMX4BXa0w.mp4",
      "model": "Marey"
    },
    {
      "Prompt": "Motion Transfer - Advanced motion capture and animation techniques",
      "Video": "https://framerusercontent.com/assets/G6g5UNTx9dlKbMGdS8Iag4Xas.mp4",
      "model": "Marey"
    },
    {
      "Prompt": "Trajectory Control - Precise object movement and path animation",
      "Video": "https://framerusercontent.com/assets/GJBpO7xq7zqJureQHIvfUo7cM.mp4",
      "model": "Marey"
    },
    {
      "Prompt": "Pose Transfer - Human pose and gesture animation control",
      "Video": "https://framerusercontent.com/assets/3ZFBeuc9oZzASGBNFY9LwRLRJvQ.mp4",
      "model": "Marey"
    },
    {
      "Prompt": "Natural Physics - Realistic physics simulation and natural motion",
      "Video": "https://framerusercontent.com/assets/kso1kLqdfQGAtuwv1DEbS4mlmc.mp4",
      "model": "Marey"
    },
    {
      "Prompt": "Dynamic Motion - Fluid and dynamic character animation",
      "Video": "https://framerusercontent.com/assets/vgdQZ2zcFZsxMSqZv8s2kwwKJ8.mp4",
      "model": "Marey"
    },
    // MiniMax
    {
      "Prompt": "A man is talking angrily",
      "Video": "/images/examples/image-animation-generator/output3.mp4",
      "model": "Minimax"
    }
  ]
}

/**
 * Examples Generation Strategy for Image Animation Generator
 * Defines how examples should be generated for variant pages
 */
export const examplesStrategy = {
  type: 'video-pool',
  count: 6,

  // Use the examples array from toolConfig as the video pool
  videoPool: toolConfig.examples,

  // Function to select random examples from the pool
  selectExamples: function(count = 6) {
    // Shuffle the video pool
    const shuffled = [...this.videoPool].sort(() => Math.random() - 0.5)

    // Select the specified number of examples
    const selected = shuffled.slice(0, count)

    // Transform to the format expected by variant pages
    return selected.map((example, index) => ({
      id: index + 1,
      title: `Model: ${example.model}`,
      description: `Prompt: ${example.Prompt}`,
      videoUrl: example.Video
    }))
  }
}

export default toolConfig