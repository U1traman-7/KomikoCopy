export interface AudioProcessingResult {
  dataUrl: string
  originalFormat: string
  finalFormat: string
  isConverted: boolean
}

/**
 * Processes audio data URL to ensure consistent format for API consumption.
 * Note: This function standardizes the data URL format but does not perform
 * actual audio format conversion. It primarily ensures compatibility by
 * normalizing MIME types to commonly accepted formats.
 * 
 * @param audioDataUrl - Base64 data URL of the audio file
 * @returns Processing result with standardized data URL and metadata
 */
export function processAudioDataUrl(audioDataUrl: string): AudioProcessingResult {
  if (!audioDataUrl) {
    throw new Error('Audio data URL is required')
  }

  console.log('Processing audio data URL, format:', audioDataUrl.substring(0, 50) + '...')

  const originalFormat = extractMimeType(audioDataUrl)
  let processedDataUrl = audioDataUrl
  let isConverted = false

  // Handle missing or malformed data URL format
  if (!audioDataUrl.startsWith('data:audio/') && !audioDataUrl.startsWith('data:video/')) {
    console.warn('Audio data format incorrect, attempting to fix...')
    
    if (audioDataUrl.includes('base64,')) {
      // Extract base64 part if data URL is malformed
      const base64Data = audioDataUrl.split('base64,')[1]
      processedDataUrl = `data:audio/wav;base64,${base64Data}`
      isConverted = true
    } else {
      // Assume raw base64 data and wrap it
      processedDataUrl = `data:audio/wav;base64,${audioDataUrl}`
      isConverted = true
    }
  } 
  // Handle WebM format - normalize to WAV MIME type for better API compatibility
  else if (audioDataUrl.startsWith('data:audio/webm') || audioDataUrl.startsWith('data:video/webm')) {
    console.warn('WebM format detected, normalizing MIME type to WAV for API compatibility...')
    const base64Data = audioDataUrl.split('base64,')[1]
    processedDataUrl = `data:audio/wav;base64,${base64Data}`
    isConverted = true
  }
  // Handle other non-WAV formats - normalize MIME type for consistency
  else if (!audioDataUrl.startsWith('data:audio/wav')) {
    console.warn('Non-WAV format detected, normalizing MIME type for better compatibility...')
    const base64Part = audioDataUrl.split('base64,')[1] || audioDataUrl
    processedDataUrl = `data:audio/wav;base64,${base64Part}`
    isConverted = true
  }

  const finalFormat = extractMimeType(processedDataUrl)
  
  if (isConverted) {
    console.log(`Audio MIME type normalized: ${originalFormat} → ${finalFormat}`)
  }


  return {
    dataUrl: processedDataUrl,
    originalFormat,
    finalFormat,
    isConverted
  }
}

/**
 * Validates if the file type is supported for audio processing
 * @param fileType - MIME type of the file
 * @returns true if supported, false otherwise
 */
export function isSupportedAudioFormat(fileType: string): boolean {
  return fileType.startsWith('audio/') || fileType.startsWith('video/webm')
}

/**
 * Extracts MIME type from a data URL
 * @param dataUrl - Data URL string
 * @returns MIME type or 'unknown' if not found
 */
function extractMimeType(dataUrl: string): string {
  try {
    if (!dataUrl.startsWith('data:')) {
      return 'unknown'
    }
    
    const mimeType = dataUrl.split(';')[0].split(':')[1]
    return mimeType || 'unknown'
  } catch (error) {
    console.warn('Failed to extract MIME type from data URL:', error)
    return 'unknown'
  }
} 
