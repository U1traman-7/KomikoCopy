/**
 * Image utilities for handling image processing and size detection
 */

// 获取图片尺寸的简单实现
export async function getImageSizeFromBuffer(buffer) {
  try {
    // 尝试使用sharp获取图片尺寸（如果可用）
    try {
      const sharp = await import('sharp')
      const metadata = await sharp.default(buffer).metadata()
      return { width: metadata.width || 1024, height: metadata.height || 1024 }
    } catch (sharpError) {
      // sharp不可用，使用基本的图片头部分析
      return getImageSizeFromHeader(buffer)
    }
  } catch (error) {
    console.warn('⚠️ 无法获取图片尺寸，使用默认值 1024x1024')
    return { width: 1024, height: 1024 }
  }
}

// 从图片头部获取尺寸的简单实现
export function getImageSizeFromHeader(buffer) {
  // JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    let offset = 2
    while (offset < buffer.length - 4) {
      if (buffer[offset] === 0xFF) {
        const marker = buffer[offset + 1]
        if (marker >= 0xC0 && marker <= 0xC3) {
          const height = (buffer[offset + 5] << 8) | buffer[offset + 6]
          const width = (buffer[offset + 7] << 8) | buffer[offset + 8]
          return { width, height }
        }
        offset += 2 + ((buffer[offset + 2] << 8) | buffer[offset + 3])
      } else {
        offset++
      }
    }
  }
  
  // PNG
  if (buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
    const width = buffer.readUInt32BE(16)
    const height = buffer.readUInt32BE(20)
    return { width, height }
  }
  
  // WebP
  if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') {
    // 简化的WebP尺寸检测
    const width = buffer.readUInt16LE(26) + 1
    const height = buffer.readUInt16LE(28) + 1
    return { width, height }
  }
  
  // 默认尺寸
  return { width: 1024, height: 1024 }
}

// 判断是否为环境/场景类关键词
export function isEnvironmentKeyword(keyword) {
  const envKeywords = [
    'world',
    'map',
    'landscape',
    'village',
    'city',
    'castle',
    'mansion',
    'skybox',
    'island',
    'environment',
    'scenery',
    'background',
  ]
  const keywordLower = keyword.toLowerCase()
  return envKeywords.some(env => keywordLower.includes(env))
}

// 判断是否为PFP/头像类关键词
export function isPfpKeyword(keyword) {
  const pfpKeywords = [
    'pfp',
    'avatar',
    'profile picture',
    'headshot',
    'portrait',
  ]
  const keywordLower = keyword.toLowerCase()
  return pfpKeywords.some(pfp => keywordLower.includes(pfp))
}

// 图片比例配置
export const IMAGE_RATIOS = {
  // 竖屏比例 - 适合人物角色
  'portrait-tall': {
    width: 768,
    height: 1344,
    name: '9:16 portrait',
    suffix: 'tall',
  }, // 9:16
  portrait: {
    width: 768,
    height: 1024,
    name: '3:4 portrait',
    suffix: 'portrait',
  }, // 3:4
  square: { width: 1024, height: 1024, name: '1:1 square', suffix: 'square' }, // 1:1
  // 2:3
  'portrait-2-3': {
    width: 768,
    height: 1152,
    name: '2:3 portrait',
    suffix: '2-3',
  },
}

// 横屏比例配置 - 适合场景环境
export const LANDSCAPE_RATIOS = {
  landscape: {
    width: 1344,
    height: 768,
    name: '16:9 landscape',
    suffix: 'landscape',
  }, // 16:9
  'landscape-wide': {
    width: 1024,
    height: 768,
    name: '4:3 landscape',
    suffix: 'wide',
  }, // 4:3
  square: { width: 1024, height: 1024, name: '1:1 square', suffix: 'square' }, // 1:1
}

export const ImageUtils = {
  getImageSizeFromBuffer,
  getImageSizeFromHeader,
  isEnvironmentKeyword,
  isPfpKeyword,
  IMAGE_RATIOS,
  LANDSCAPE_RATIOS
}
