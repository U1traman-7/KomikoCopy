/**
 * Page Structure Randomizer
 * 
 * Generates randomized page structures to avoid content farm detection
 * while maintaining SEO best practices.
 */

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Generate a randomized page structure
 * 
 * Rules:
 * 1. 'whatIs' and 'examples' must be in the first 2 positions (for SEO and user engagement)
 * 2. 'moreAITools' and 'cta' always at the end
 * 3. Remaining sections are shuffled: 'howToUse', 'whyUse', 'faq'
 * 
 * @returns {string[]} Array of section names in randomized order
 */
export function generateRandomPageStructure() {
  // Priority sections that must be in first 2 positions
  const prioritySections = ['whatIs', 'examples']
  
  // Middle sections that can be shuffled
  const middleSections = ['howToUse', 'whyUse', 'faq']
  
  // Fixed sections that always appear at the end
  const fixedSections = ['moreAITools', 'cta']
  
  // Shuffle priority sections for first 2 positions
  const shuffledPriority = shuffleArray(prioritySections)
  
  // Shuffle middle sections
  const shuffledMiddle = shuffleArray(middleSections)
  
  // Combine all sections
  return [...shuffledPriority, ...shuffledMiddle, ...fixedSections]
}

/**
 * Generate a randomized page structure with benefits section
 * (Alternative name for 'whyUse')
 * 
 * @returns {string[]} Array of section names in randomized order
 */
export function generateRandomPageStructureWithBenefits() {
  const prioritySections = ['whatIs', 'examples']
  const middleSections = ['howToUse', 'benefits', 'faq']
  const fixedSections = ['moreAITools', 'cta']
  
  const shuffledPriority = shuffleArray(prioritySections)
  const shuffledMiddle = shuffleArray(middleSections)
  
  return [...shuffledPriority, ...shuffledMiddle, ...fixedSections]
}

/**
 * Validate page structure
 * Ensures the structure follows the required rules
 * 
 * @param {string[]} structure - Page structure array to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validatePageStructure(structure) {
  const errors = []
  
  // Check if structure is an array
  if (!Array.isArray(structure)) {
    errors.push('Page structure must be an array')
    return { valid: false, errors }
  }
  
  // Check if structure has minimum required sections
  if (structure.length < 5) {
    errors.push('Page structure must have at least 5 sections')
  }
  
  // Check if 'whatIs' or 'examples' is in first 2 positions
  const firstTwo = structure.slice(0, 2)
  if (!firstTwo.includes('whatIs') && !firstTwo.includes('examples')) {
    errors.push("Either 'whatIs' or 'examples' must be in the first 2 positions")
  }
  
  // Check if 'cta' is the last section
  if (structure[structure.length - 1] !== 'cta') {
    errors.push("'cta' must be the last section")
  }
  
  // Check if 'moreAITools' is second to last
  if (structure[structure.length - 2] !== 'moreAITools') {
    errors.push("'moreAITools' must be second to last")
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get a deterministic page structure based on a seed
 * Useful for testing or when you want consistent results
 * 
 * @param {string} seed - Seed string (e.g., keyword)
 * @returns {string[]} Array of section names in deterministic order
 */
export function getDeterministicPageStructure(seed) {
  // Simple hash function to convert seed to number
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Use hash to determine structure
  const prioritySections = ['whatIs', 'examples']
  const middleSections = ['howToUse', 'whyUse', 'faq']
  const fixedSections = ['moreAITools', 'cta']
  
  // Deterministic shuffle based on hash
  const priorityOrder = Math.abs(hash) % 2 === 0 
    ? prioritySections 
    : [...prioritySections].reverse()
  
  // Rotate middle sections based on hash
  const rotations = Math.abs(hash) % middleSections.length
  const rotatedMiddle = [
    ...middleSections.slice(rotations),
    ...middleSections.slice(0, rotations)
  ]
  
  return [...priorityOrder, ...rotatedMiddle, ...fixedSections]
}

/**
 * Log page structure for debugging
 * 
 * @param {string[]} structure - Page structure to log
 * @param {string} label - Label for the log
 */
export function logPageStructure(structure, label = 'Page Structure') {
  console.log(`\n📋 ${label}:`)
  structure.forEach((section, index) => {
    const position = index + 1
    const emoji = index < 2 ? '⭐' : index >= structure.length - 2 ? '📌' : '  '
    console.log(`  ${emoji} ${position}. ${section}`)
  })
  console.log('')
}

/**
 * Get section display name for logging
 * 
 * @param {string} section - Section name
 * @returns {string} Display name
 */
export function getSectionDisplayName(section) {
  const displayNames = {
    'whatIs': 'What Is',
    'examples': 'Examples',
    'howToUse': 'How to Use',
    'whyUse': 'Why Use',
    'benefits': 'Benefits',
    'faq': 'FAQ',
    'moreAITools': 'More AI Tools',
    'cta': 'Call to Action'
  }
  return displayNames[section] || section
}

export const PageStructureRandomizer = {
  generateRandomPageStructure,
  generateRandomPageStructureWithBenefits,
  validatePageStructure,
  getDeterministicPageStructure,
  logPageStructure,
  getSectionDisplayName,
  shuffleArray
}

export default PageStructureRandomizer

