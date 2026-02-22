/**
 * Video to Video AI Tool Configuration
 * Describes the tool's functionality and features for AI content generation
 */

export const toolConfig = {
  name: "Video to Video AI",
  description: "Video to Video AI is a powerful tool that transforms ordinary videos into anime, cartoon, manga, and manhwa-style animations using advanced Video Style Transfer technology. The tool uses a two-step process: first applying your chosen style to a reference frame, then transforming the entire video while preserving original motion and timing.",
  
  primaryFunction: "Video style transformation and animation conversion",
  
  keyFeatures: [
    "Transform videos into anime, cartoon, manga, and manhwa styles",
    "Preserve original motion, facial expressions, and timing",
    "Two-step process: reference frame styling + full video transformation", 
    "Support for 100+ artistic styles including Studio Ghibli, Korean manhwa, Japanese manga and more",
    "Advanced Video Style Transfer technology with motion consistency",
    "Support for MP4, MOV, AVI formats up to 15 seconds and 50MB",
    "Real-time progress tracking and transparent pricing",
    "Custom style creation with text prompts or reference images"
  ],
  
  targetAudience: [
    "Content creators and social media influencers",
    "Animators and digital artists", 
    "Video editors and filmmakers",
    "Anime and manga enthusiasts",
    "Marketing professionals creating engaging content"
  ],
  
  useCases: [
    "Convert real-life videos to anime style for social media",
    "Create animated content from live-action footage",
    "Transform portrait videos into cartoon characters",
    "Generate manga-style video content",
    "Create unique artistic video content for marketing",
    "Transform dance or performance videos into animated versions"
  ],
  
  technicalSpecs: {
    inputFormats: ["MP4", "MOV", "AVI"],
    maxDuration: "15 seconds",
    maxFileSize: "50MB",
    outputQuality: "High-definition with consistent style application",
    processingTime: "5-10 minutes total (1-3 min styling + 3-7 min generation)"
  },
  
  uniqueSellingPoints: [
    "Perfect motion preservation - maintains every detail of original movement",
    "Frame-perfect consistency - no flickering or artifacts",
    "Extensive style library - 20+ preset styles plus custom options",
    "Smart cost system - separate charges for styling and generation",
    "Professional quality output - smooth transitions and high definition",
    "Easy workflow - simple two-step process with real-time tracking"
  ]
}

/**
 * Examples Generation Strategy for Video to Video
 * Defines how examples should be generated for variant pages
 */
export const examplesStrategy = {
  type: 'comparison-videos',
  count: 4,

  // Pool of comparison video pairs
  comparisonPairs: [
    {
      id: 1,
      layout: 'comparison',
      type: 'video',
      input: '/images/examples/video-to-video/inputs/dancing.webm',
      output: '/images/examples/video-to-video/outputs/style/anime-man.webm',
      inputLabel: 'Original Video',
      outputLabel: 'Anime Style',
      description: 'Style Transfer | Transfer original video to anime style',
      styles: ['anime', 'anime-style', 'japanese-anime']
    },
    {
      id: 2,
      layout: 'comparison',
      type: 'video',
      input: '/images/examples/video-to-video/trump-input.webm',
      output: '/images/examples/video-to-video/outputs/style/cartoon-girl.webm',
      inputLabel: 'Original Video',
      outputLabel: 'Cartoon Style',
      description: 'Style Transfer | Transfer original video to cartoon style',
      styles: ['cartoon', 'cartoon-style', 'animated']
    },
    {
      id: 3,
      layout: 'comparison',
      type: 'video',
      input: '/images/examples/video-to-video/dj-input.webm',
      output: '/images/examples/video-to-video/outputs/style/sketch-dj.webm',
      inputLabel: 'Original Video',
      outputLabel: 'Sketch Style',
      description: 'Style Transfer | Transfer original video to sketch style',
      styles: ['sketch', 'pencil-sketch', 'drawing']
    },
    {
      id: 4,
      layout: 'comparison',
      type: 'video',
      input: '/images/examples/video-to-video/inputs/dancing.webm',
      output: 'https://d31cygw67xifd4.cloudfront.net/examples/video-to-video/ghibli-dancing.webm',
      inputLabel: 'Original Video',
      outputLabel: 'Ghibli Style',
      description: 'Style Transfer | Transfer original video to ghibli style',
      styles: ['ghibli', 'studio-ghibli', 'ghibli-anime']
    },
    {
      id: 5,
      layout: 'comparison',
      type: 'video',
      input: '/images/examples/video-to-video/trump-input.webm',
      output: '/images/examples/video-to-video/outputs/style/claymation-girl.webm',
      inputLabel: 'Original Video',
      outputLabel: 'Claymation Style',
      description: 'Change Material | Transform original video into clay style',
      styles: ['claymation', 'clay', 'stop-motion']
    },
    {
      id: 6,
      layout: 'single',
      type: 'video',
      output: '/images/examples/video-to-video/dog.webm',
      label: 'Anime Transformation',
      description: 'Real-life dog to anime style transformation showing realistic pet converted to animated character',
      styles: ['anime', 'pet-anime', 'animal-anime']
    }
  ],

  // Function to select examples based on variant keyword
  selectExamples: function(variantKeyword, count = 4) {
    const keyword = variantKeyword.toLowerCase()

    // Try to match examples by style keywords
    const matchedExamples = this.comparisonPairs.filter(pair => {
      if (!pair.styles) return false
      return pair.styles.some(style =>
        keyword.includes(style) || style.includes(keyword.split(' ')[0])
      )
    })

    // If we have matches, use them first
    if (matchedExamples.length > 0) {
      const selected = matchedExamples.slice(0, count)
      // Fill remaining with random examples if needed
      if (selected.length < count) {
        const remaining = this.comparisonPairs
          .filter(pair => !selected.includes(pair))
          .sort(() => Math.random() - 0.5)
          .slice(0, count - selected.length)
        return [...selected, ...remaining]
      }
      return selected
    }

    // Otherwise, return random examples
    return this.comparisonPairs
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
  }
}

export default toolConfig
