/**
 * Playground Tool Configuration
 * Describes the tool's functionality and features for AI content generation
 */

export const toolConfig = {
  name: "Playground",
  description: "Playground is a versatile AI art generation tool that serves as an experimental space for creating diverse artistic styles and creative content. It combines multiple AI models and techniques to offer unlimited creative possibilities, from realistic photography to abstract art, fantasy illustrations, and everything in between. Perfect for artistic experimentation and creative exploration.",
  
  primaryFunction: "Versatile AI art generation and creative experimentation",
  
  keyFeatures: [
    "Multi-style AI art generation with unlimited creative possibilities",
    "Support for realistic, fantasy, abstract, and experimental art styles",
    "Advanced prompt engineering and creative text-to-image generation",
    "Style mixing and artistic technique combination",
    "High-quality output across various artistic mediums and genres",
    "Experimental features and cutting-edge AI art techniques",
    "Flexible aspect ratios and resolution options",
    "Creative freedom with minimal restrictions on content and style"
  ],
  
  targetAudience: [
    "Digital artists and creative professionals",
    "Concept artists and illustrators",
    "Graphic designers and visual artists",
    "Creative enthusiasts and art hobbyists",
    "Content creators exploring new visual styles",
    "Researchers and developers testing AI art capabilities",
    "Artists seeking inspiration and creative exploration"
  ],
  
  useCases: [
    "Experimental art creation and style exploration",
    "Concept art generation for creative projects",
    "Abstract and surreal artwork creation",
    "Photorealistic image generation and manipulation",
    "Fantasy and sci-fi illustration creation",
    "Artistic style studies and technique exploration",
    "Creative content for social media and portfolios",
    "Prototype and mockup creation for design projects"
  ],
  
  technicalSpecs: {
    artStyles: ["Photorealistic", "Fantasy", "Abstract", "Surreal", "Digital Art", "Traditional Art Styles"],
    outputOptions: ["Various resolutions", "Multiple aspect ratios", "Different artistic mediums"],
    creativeFreedom: ["Minimal content restrictions", "Experimental features", "Style mixing capabilities"],
    qualityLevel: "Professional-grade artwork suitable for commercial and artistic use",
    flexibility: ["Custom prompts", "Style combinations", "Advanced parameters"]
  },
  
  uniqueSellingPoints: [
    "Ultimate creative freedom - experiment with any artistic style or concept",
    "Multi-model approach - combines best features of various AI art models",
    "Experimental playground - access to cutting-edge AI art techniques",
    "Style versatility - from photorealistic to completely abstract",
    "Professional quality - suitable for commercial and artistic projects",
    "Innovation focus - constantly updated with latest AI art capabilities",
    "Creative exploration - perfect for discovering new artistic possibilities"
  ]
}

/**
 * Examples Generation Strategy for Playground
 * Defines how examples should be generated for variant pages
 */
export const examplesStrategy = {
  type: 'api-batch',
  count: 4,

  // Input images to use for generating examples
  inputImages: [
    '/images/examples/photo-to-anime/input2.jpg',
    '/images/examples/photo-to-anime/black_guy_photo.webp',
    '/images/examples/photo-to-anime/cat_photo.webp',
    '/images/examples/photo-to-anime/dog_photo.webp'
  ],

  // API endpoint for generation
  apiEndpoint: '/api/playground',

  // Default parameters for API calls
  apiParams: {
    model: 'Animagine',
    aspectRatio: '2:3'
  },

  // Function to generate examples using the API
  generateExamples: async function(variantKeyword, style, apiConfig) {
    const examples = []

    for (let i = 0; i < this.inputImages.length; i++) {
      const inputImage = this.inputImages[i]

      // Call API to generate image with the specified style
      // This will be implemented in the main generator
      examples.push({
        image: '', // Will be filled by API response
        prompt: `Style: ${style}`,
        input: inputImage
      })
    }

    return examples
  }
}

export default toolConfig
