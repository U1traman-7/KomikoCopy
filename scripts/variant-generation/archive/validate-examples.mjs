#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 路径配置
const VARIANTS_DIR = path.join(__dirname, '../../src/data/variants');
const IMAGES_DIR = path.join(__dirname, '../../public/images/examples');

// 从图片路径中提取variant slug
function extractVariantFromImagePath(imagePath) {
  // 路径格式: /images/examples/tool-type/variant-slug/image.webp
  const parts = imagePath.split('/');
  if (parts.length >= 5 && parts[1] === 'images' && parts[2] === 'examples') {
    return parts[4]; // variant-slug
  }
  return null;
}

// 从图片路径中提取文件名
function extractFilenameFromPath(imagePath) {
  return path.basename(imagePath);
}

// 获取指定工具的所有variant文件
function getVariantFiles(toolType) {
  const toolDir = path.join(VARIANTS_DIR, toolType);

  if (!fs.existsSync(toolDir)) {
    throw new Error(`工具目录不存在: ${toolDir}`);
  }

  const files = fs
    .readdirSync(toolDir)
    .filter(file => file.endsWith('.json'))
    .map(file => ({
      filename: file,
      variantName: file.replace('.json', ''),
      fullPath: path.join(toolDir, file),
    }));

  return files;
}

// 获取指定variant目录下的所有图片文件
function getVariantImages(toolType, variantSlug) {
  const imagesDir = path.join(IMAGES_DIR, toolType, variantSlug);

  if (!fs.existsSync(imagesDir)) {
    return [];
  }

  return fs
    .readdirSync(imagesDir)
    .filter(file => file.match(/\.(jpg|jpeg|png|webp)$/i))
    .sort();
}

// 验证单个variant的examples数据
function validateVariantExamples(toolType, variantFile) {
  console.log(`\n🔍 检查variant: ${variantFile.variantName}`);

  try {
    // 读取variant JSON文件
    const variantData = JSON.parse(
      fs.readFileSync(variantFile.fullPath, 'utf8'),
    );
    const examples = variantData.content?.examples || [];

    console.log(`📋 JSON中有 ${examples.length} 个examples`);

    // 获取实际的图片文件
    const actualImages = getVariantImages(toolType, variantFile.variantName);
    console.log(`📁 实际有 ${actualImages.length} 个图片文件`);

    if (actualImages.length === 0 && examples.length === 0) {
      console.log(`✅ ${variantFile.variantName}: 无图片无examples，跳过`);
      return { cleaned: false, changes: [] };
    }

    // 分析当前examples中的图片引用
    const referencedImages = new Set();
    const validExamples = [];
    const invalidExamples = [];

    examples.forEach((example, index) => {
      const imagePath = example.image;
      if (!imagePath) {
        console.log(`⚠️  Example ${index}: 缺少image字段`);
        invalidExamples.push({ index, reason: '缺少image字段', example });
        return;
      }

      const filename = extractFilenameFromPath(imagePath);
      const expectedVariant = extractVariantFromImagePath(imagePath);

      // 检查variant是否匹配
      if (expectedVariant !== variantFile.variantName) {
        console.log(
          `⚠️  Example ${index}: variant不匹配 (期望: ${variantFile.variantName}, 实际: ${expectedVariant})`,
        );
        invalidExamples.push({ index, reason: 'variant不匹配', example });
        return;
      }

      // 检查文件是否存在
      if (!actualImages.includes(filename)) {
        console.log(`❌ Example ${index}: 图片文件不存在 - ${filename}`);
        invalidExamples.push({ index, reason: '图片文件不存在', example });
        return;
      }

      referencedImages.add(filename);
      validExamples.push(example);
    });

    // 找出孤立的图片文件（存在文件但没有引用）
    const orphanedImages = actualImages.filter(
      img => !referencedImages.has(img),
    );

    console.log(`✅ 有效examples: ${validExamples.length}`);
    console.log(`❌ 无效examples: ${invalidExamples.length}`);
    console.log(`🗑️  孤立图片: ${orphanedImages.length}`);

    // 显示详细信息
    if (invalidExamples.length > 0) {
      console.log(`\n❌ 无效examples详情:`);
      invalidExamples.forEach(({ index, reason, example }) => {
        console.log(
          `  - Example ${index}: ${reason} (${extractFilenameFromPath(example.image || 'N/A')})`,
        );
      });
    }

    if (orphanedImages.length > 0) {
      console.log(`\n🗑️  孤立图片文件:`);
      orphanedImages.forEach(img => {
        console.log(`  - ${img}`);
      });
    }

    // 如果没有问题，直接返回
    if (invalidExamples.length === 0 && orphanedImages.length === 0) {
      console.log(`✅ ${variantFile.variantName}: 数据完整，无需清理`);
      return { cleaned: false, changes: [] };
    }

    return {
      cleaned: true,
      validExamples,
      invalidExamples,
      orphanedImages,
      changes: [
        ...invalidExamples.map(({ reason, example }) => ({
          type: 'remove_example',
          reason,
          filename: extractFilenameFromPath(example.image || 'N/A'),
        })),
        ...orphanedImages.map(img => ({
          type: 'remove_orphaned_image',
          filename: img,
        })),
      ],
    };
  } catch (error) {
    console.error(`❌ 读取variant文件失败: ${error.message}`);
    return { cleaned: false, changes: [], error: error.message };
  }
}

// 执行清理操作
function performCleanup(
  toolType,
  variantFile,
  validationResult,
  dryRun = true,
) {
  if (!validationResult.cleaned) {
    return;
  }

  const { validExamples, orphanedImages } = validationResult;
  const variantDir = path.join(IMAGES_DIR, toolType, variantFile.variantName);

  console.log(
    `\n🧹 ${dryRun ? '[DRY RUN] ' : ''}清理 ${variantFile.variantName}:`,
  );

  // 删除孤立的图片文件
  if (orphanedImages.length > 0) {
    console.log(`🗑️  ${dryRun ? '[DRY RUN] ' : ''}删除孤立图片:`);
    orphanedImages.forEach(filename => {
      const filePath = path.join(variantDir, filename);
      console.log(`  - ${filename}`);
      if (!dryRun && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  }

  // 更新variant JSON文件
  if (
    validExamples.length !==
    (
      JSON.parse(fs.readFileSync(variantFile.fullPath, 'utf8')).content
        ?.examples || []
    ).length
  ) {
    console.log(
      `📝 ${dryRun ? '[DRY RUN] ' : ''}更新JSON文件 (${validExamples.length} examples)`,
    );

    if (!dryRun) {
      const variantData = JSON.parse(
        fs.readFileSync(variantFile.fullPath, 'utf8'),
      );
      if (variantData.content) {
        variantData.content.examples = validExamples;
        fs.writeFileSync(
          variantFile.fullPath,
          JSON.stringify(variantData, null, 2),
        );
      }
    }
  }
}

// 主函数 - 验证指定工具的所有variants
async function validateToolExamples(toolType, options = {}) {
  const { dryRun = true, autoClean = false } = options;

  console.log(`\n🛠️  验证工具: ${toolType}`);
  console.log(
    `🔍 模式: ${dryRun ? 'DRY RUN (只检查不修改)' : 'LIVE (实际修改)'}`,
  );

  try {
    // 获取所有variant文件
    const variantFiles = getVariantFiles(toolType);
    console.log(`📁 找到 ${variantFiles.length} 个variant文件`);

    if (variantFiles.length === 0) {
      console.log(`⚠️  没有找到任何variant文件`);
      return;
    }

    let totalValidated = 0;
    let totalCleaned = 0;
    let totalChanges = 0;
    const summaryData = [];

    // 验证每个variant
    for (const variantFile of variantFiles) {
      const result = validateVariantExamples(toolType, variantFile);
      totalValidated++;

      if (result.cleaned) {
        totalCleaned++;
        totalChanges += result.changes.length;

        summaryData.push({
          variant: variantFile.variantName,
          validExamples: result.validExamples.length,
          invalidExamples: result.invalidExamples.length,
          orphanedImages: result.orphanedImages.length,
          changes: result.changes,
        });

        // 如果启用自动清理，执行清理操作
        if (autoClean) {
          performCleanup(toolType, variantFile, result, dryRun);
        }
      }
    }

    // 显示汇总报告
    console.log(`\n📊 验证完成汇总:`);
    console.log(`✅ 总共验证: ${totalValidated} 个variants`);
    console.log(`🧹 需要清理: ${totalCleaned} 个variants`);
    console.log(`📝 总计变更: ${totalChanges} 项`);

    if (summaryData.length > 0) {
      console.log(`\n📋 详细清理报告:`);
      summaryData.forEach(
        ({ variant, validExamples, invalidExamples, orphanedImages }) => {
          console.log(`  ${variant}:`);
          console.log(`    ✅ 有效examples: ${validExamples}`);
          if (invalidExamples > 0)
            console.log(`    ❌ 无效examples: ${invalidExamples}`);
          if (orphanedImages > 0)
            console.log(`    🗑️  孤立图片: ${orphanedImages}`);
        },
      );

      if (!autoClean) {
        console.log(`\n💡 提示: 使用 --clean 参数执行实际清理操作`);
      } else if (dryRun) {
        console.log(`\n💡 提示: 使用 --no-dry-run 参数执行实际修改`);
      } else {
        console.log(`\n✅ 清理操作已完成!`);
      }
    } else {
      console.log(`\n🎉 所有variants的examples数据都是完整的，无需清理!`);
    }
  } catch (error) {
    console.error(`❌ 验证失败: ${error.message}`);
    throw error;
  }
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🔍 Variant Examples 验证工具

用法: node validate-examples.mjs <tool-type> [options]

参数:
  <tool-type>    工具类型 (如: ai-anime-generator, oc-maker)

选项:
  --clean        执行清理操作（删除无效数据）
  --no-dry-run   实际执行修改（默认为dry-run模式）
  --help         显示此帮助信息

功能:
  ✅ 检查variant JSON中的examples与实际图片文件的一致性
  🗑️  删除不存在的图片引用
  🗑️  删除孤立的图片文件（无引用）
  📝 更新variant JSON文件
  📊 生成详细验证报告

示例:
  # 检查但不修改（dry-run模式）
  node validate-examples.mjs ai-anime-generator
  
  # 检查并显示清理计划
  node validate-examples.mjs ai-anime-generator --clean
  
  # 实际执行清理操作
  node validate-examples.mjs ai-anime-generator --clean --no-dry-run
  
  # 检查OC Maker工具
  node validate-examples.mjs oc-maker --clean --no-dry-run
`);
    process.exit(0);
  }

  const toolType = args[0];
  let clean = false;
  let dryRun = true;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--clean') {
      clean = true;
    } else if (arg === '--no-dry-run') {
      dryRun = false;
    } else if (arg === '--help') {
      // 显示帮助信息（已在上面处理）
      process.exit(0);
    }
  }

  return { toolType, clean, dryRun };
}

// 主程序
try {
  const { toolType, clean, dryRun } = parseArgs();

  if (!toolType) {
    throw new Error('请提供工具类型参数');
  }

  await validateToolExamples(toolType, {
    dryRun,
    autoClean: clean,
  });
} catch (error) {
  console.error('❌ 错误:', error.message);
  process.exit(1);
}
