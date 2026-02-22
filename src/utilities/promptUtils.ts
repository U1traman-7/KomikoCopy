// 清理文本中的质量修饰词
export const cleanQualityModifiers = (text: string) => {
  if (!text) return text;
  
  const qualityModifiers = [
    'best quality',
    '4k',
    'masterpiece',
    'highres',
    'detailed',
    'amazing quality',
    'high quality',
    'rating: general'
  ];
  
  // 将修饰词转换为正则表达式模式，处理逗号分隔的情况
  const pattern = qualityModifiers
    .map(modifier => modifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  
  const regex = new RegExp(`\\b(${pattern})\\b,?\\s*`, 'gi');
  
  return text
    .replace(regex, '')
    .replace(/,\s*,/g, ',') // 清理多余的逗号
    .replace(/^,\s*|,\s*$/g, '') // 清理开头和结尾的逗号
    .replace(/[ \t]+/g, ' ') // 只清理空格和制表符，保留换行
    .trim();
}; 