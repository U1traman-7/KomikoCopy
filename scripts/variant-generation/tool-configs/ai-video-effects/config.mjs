/**
 * AI Video Effects Tool Configuration
 * Describes the tool's functionality and features for AI content generation
 */

export const toolConfig = {
  name: "AI Video Effects",
  description: "AI Video Effects is a powerful tool that transforms ordinary photos and videos into stunning anime-style effect animations. Featuring popular effects like Bankai, Super Saiyan, Rasengan, Kamehameha, and more, our AI adds dramatic visual effects including energy auras, power-up transformations, and cinematic lighting to create authentic anime moments.",

  primaryFunction: "Photo/video to anime effect transformation",

  keyFeatures: [
    "Transform photos and videos into anime-style effect animations",
    "Popular anime effects: Bankai, Super Saiyan, Rasengan, Kamehameha, Ghibli, etc.",
    "Dramatic visual effects with energy auras and power-up sequences",
    "Preserve original motion while adding cinematic anime effects",
    "Support for MP4, MOV, WEBM formats up to 15 seconds",
    "High-quality output perfect for social media sharing",
    "Easy-to-use interface with instant preview",
    "Multiple effect variations and customization options"
  ],

  targetAudience: [
    "Anime and manga fans",
    "Content creators and social media influencers",
    "Cosplayers and anime community members",
    "Video editors creating anime-style content",
    "TikTok and Instagram Reels creators",
    "Gaming content creators"
  ],

  useCases: [
    "Create Bankai transformation videos for Bleach fans",
    "Generate Super Saiyan power-up effects for Dragon Ball content",
    "Add Rasengan or Kamehameha effects to action poses",
    "Transform nature videos into Ghibli-style animations",
    "Create anime-style dance transformation videos",
    "Generate viral anime effect content for social media",
    "Add dramatic power-up sequences to cosplay videos"
  ],

  technicalSpecs: {
    inputFormats: ["MP4", "MOV", "WEBM", "AVI", "JPG", "PNG"],
    maxDuration: "15 seconds",
    maxFileSize: "50MB",
    outputQuality: "High-definition with smooth effect transitions",
    processingTime: "30-60 seconds depending on effect complexity"
  },

  uniqueSellingPoints: [
    "Authentic anime effect recreation - iconic effects from popular anime series",
    "Smooth motion preservation - effects blend naturally with original footage",
    "Multiple effect styles - from subtle Ghibli filters to dramatic power-ups",
    "Fast processing - generate viral content in under a minute",
    "Social media optimized - perfect for TikTok, Instagram, and YouTube Shorts",
    "No editing skills required - one-click effect application"
  ],

  // Video effect examples pool
  examples: [
    {
      id: 1,
      layout: 'single',
      type: 'video',
      output: '/images/examples/ai-video-effects/bankai-example-1.webm',
      label: 'Bankai Transformation',
      description: 'Epic Bankai power-up sequence with energy aura effects',
      styles: ['bankai', 'bleach', 'transformation', 'power-up']
    },
    {
      id: 2,
      layout: 'single',
      type: 'video',
      output: '/images/examples/ai-video-effects/super-saiyan-example.webm',
      label: 'Super Saiyan Effect',
      description: 'Dragon Ball style Super Saiyan transformation with golden aura',
      styles: ['super-saiyan', 'dragon-ball', 'dbz', 'saiyan', 'golden-aura']
    },
    {
      id: 3,
      layout: 'single',
      type: 'video',
      output: '/images/examples/ai-video-effects/rasengan-example.webm',
      label: 'Rasengan Effect',
      description: 'Naruto-style Rasengan energy ball effect',
      styles: ['rasengan', 'naruto', 'chakra', 'energy-ball']
    },
    {
      id: 4,
      layout: 'single',
      type: 'video',
      output: '/images/examples/ai-video-effects/kamehameha-example.webm',
      label: 'Kamehameha Effect',
      description: 'Dragon Ball Kamehameha energy beam attack',
      styles: ['kamehameha', 'dragon-ball', 'energy-beam', 'ki-blast']
    },
    {
      id: 5,
      layout: 'single',
      type: 'video',
      output: '/images/examples/ai-video-effects/ghibli-effect-1.webm',
      label: 'Ghibli Style',
      description: 'Studio Ghibli-inspired hand-painted animation style',
      styles: ['ghibli', 'studio-ghibli', 'miyazaki', 'hand-painted']
    },
    {
      id: 6,
      layout: 'single',
      type: 'video',
      output: '/images/examples/ai-video-effects/cyberpunk-example.webm',
      label: 'Cyberpunk Effect',
      description: 'Cyberpunk-style neon effects and glitch aesthetics',
      styles: ['cyberpunk', 'neon', 'glitch', 'futuristic']
    },
    {
      id: 7,
      layout: 'single',
      type: 'video',
      output: '/images/examples/ai-video-effects/anime-dance-example.webm',
      label: 'Anime Dance Filter',
      description: 'Anime-style dance transformation with stylized effects',
      styles: ['anime-dance', 'dance', 'animation', 'cartoon']
    },
    {
      id: 8,
      layout: 'single',
      type: 'video',
      output: '/images/examples/ai-video-effects/cartoon-example.webm',
      label: 'Cartoon Effect',
      description: 'Cartoon-style video transformation with vibrant colors',
      styles: ['cartoon', 'animated', 'toon', 'colorful']
    }
  ]
}

/**
 * Examples Generation Strategy for AI Video Effects
 * Defines how examples should be generated for variant pages
 */
export const examplesStrategy = {
  type: 'video-effects',
  count: 4,

  // Use the examples array from toolConfig as the video pool
  videoPool: toolConfig.examples,

  // Function to select examples based on variant keyword
  selectExamples: function(variantKeyword, count = 4) {
    const keyword = variantKeyword.toLowerCase()

    // Try to match examples by style keywords
    const matchedExamples = this.videoPool.filter(example => {
      if (!example.styles) return false
      return example.styles.some(style =>
        keyword.includes(style) || style.includes(keyword.split(' ')[0]) || style.includes(keyword.split('-')[0])
      )
    })

    // If we have matches, use them first
    if (matchedExamples.length > 0) {
      const selected = matchedExamples.slice(0, count)
      // Fill remaining with random examples if needed
      if (selected.length < count) {
        const remaining = this.videoPool
          .filter(example => !selected.includes(example))
          .sort(() => Math.random() - 0.5)
          .slice(0, count - selected.length)
        return [...selected, ...remaining]
      }
      return selected
    }

    // Otherwise, return random examples
    return this.videoPool
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
  },

  // Function to transform examples to the format expected by variant pages
  transformExamples: function(examples) {
    return examples.map((example, index) => ({
      id: index + 1,
      layout: example.layout || 'single',
      type: example.type || 'video',
      output: example.output,
      label: example.label,
      description: example.description
    }))
  }
}

export default toolConfig
