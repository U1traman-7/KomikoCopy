#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取项目根目录
const projectRoot = path.resolve(__dirname, '../..');
const variantsDir = path.join(projectRoot, 'ComicEditor/src/data/variants/video-to-video');

// 定义可用的页面结构组件（排除 examples）
const availableComponents = [
  'whatIs',
  'howToUse', 
  'benefits',
  'moreAITools',
  'faq',
  'cta'
];

// 随机排列函数
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 生成页面结构，确保 FAQ 和 CTA 在最后
function generatePageStructure() {
  // 获取除了 FAQ 和 CTA 之外的其他组件
  const otherComponents = availableComponents.filter(comp => 
    comp !== 'faq' && comp !== 'cta'
  );
  
  // 随机排列其他组件
  const shuffledOthers = shuffleArray(otherComponents);
  
  // 确保 FAQ 和 CTA 在最后
  const pageStructure = [...shuffledOthers, 'faq', 'cta'];
  
  return pageStructure;
}

// 更新单个 JSON 文件
function updateJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(content);
    
    // 检查是否已经有 pageStructure 字段
    if (jsonData.pageStructure) {
      console.log(`⚠️  ${path.basename(filePath)} 已经有 pageStructure 字段，跳过`);
      return;
    }
    
    // 添加 pageStructure 字段
    jsonData.pageStructure = generatePageStructure();
    
    // 写回文件，保持格式
    const updatedContent = JSON.stringify(jsonData, null, 2);
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    
    console.log(`✅ 更新 ${path.basename(filePath)} - pageStructure: [${jsonData.pageStructure.join(', ')}]`);
    
  } catch (error) {
    console.error(`❌ 更新 ${path.basename(filePath)} 失败:`, error.message);
  }
}

// 主函数
function main() {
  console.log('🚀 开始更新 video-to-video JSON 文件的 pageStructure 字段...\n');
  
  // 检查目录是否存在
  if (!fs.existsSync(variantsDir)) {
    console.error(`❌ 目录不存在: ${variantsDir}`);
    process.exit(1);
  }
  
  // 读取所有 JSON 文件
  const files = fs.readdirSync(variantsDir)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(variantsDir, file));
  
  if (files.length === 0) {
    console.log('📁 没有找到 JSON 文件');
    return;
  }
  
  console.log(`📁 找到 ${files.length} 个 JSON 文件\n`);
  
  // 更新每个文件
  files.forEach(updateJsonFile);
  
  console.log(`\n🎉 完成！共处理 ${files.length} 个文件`);
}

// 运行脚本
main();
