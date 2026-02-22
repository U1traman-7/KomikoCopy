// NSFW关键词列表 - 仅用于variant页面过滤
export const nsfwKeywords = [
  'nsfw', 'porn', 'adult', 'sexy', 'sex', 'erotic', 'nude', 'r18', '18+', 'xxx', 'sexo', 'desnuda', 'desnudo', 'porno', 'erótico', 'adulto', 'caliente', 'sesso', 'セックス', 'エッチ'
];

// 检查是否包含NSFW关键词
export function containsNsfwKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return nsfwKeywords.some(keyword => lowerText.includes(keyword));
}