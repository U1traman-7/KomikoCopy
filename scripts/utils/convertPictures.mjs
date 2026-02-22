import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * 将指定目录下的所有PNG图片转换为WebP格式
 * @param {string} inputDir - 输入目录路径
 * @param {Object} options - 转换选项
 * @param {number} options.quality - WebP质量 (1-100, 默认80)
 * @param {boolean} options.deleteOriginal - 是否删除原始PNG文件 (默认false)
 * @param {boolean} options.recursive - 是否递归搜索子目录 (默认true)
 */
async function convertPngToWebp(inputDir, options = {}) {
    const {
        quality = 80,
        deleteOriginal = false,
        recursive = true
    } = options;

    // 检查输入目录是否存在
    if (!fs.existsSync(inputDir)) {
        throw new Error(`目录不存在: ${inputDir}`);
    }

    // 构建搜索模式
    const pattern = recursive
        ? path.join(inputDir, '**', '*.png').replace(/\\/g, '/')
        : path.join(inputDir, '*.png').replace(/\\/g, '/');

    console.log(`正在搜索PNG文件: ${pattern}`);

    // 查找所有PNG文件
    const pngFiles = await glob(pattern, {
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**']
    });

    if (pngFiles.length === 0) {
        console.log('未找到PNG文件');
        return;
    }

    console.log(`找到 ${pngFiles.length} 个PNG文件`);

    let successCount = 0;
    let errorCount = 0;

    // 处理每个PNG文件
    for (let i = 0; i < pngFiles.length; i++) {
        const pngFile = pngFiles[i];
        const webpFile = pngFile.replace(/\.png$/i, '.webp');

        try {
            console.log(`[${i + 1}/${pngFiles.length}] 转换: ${path.basename(pngFile)}`);

            // 检查WebP文件是否已存在
            if (fs.existsSync(webpFile)) {
                console.log(`  WebP文件已存在，跳过: ${path.basename(webpFile)}`);
                continue;
            }

            // 转换图片
            await sharp(pngFile)
                .webp({ quality })
                .toFile(webpFile);

            console.log(`  ✓ 转换成功: ${path.basename(webpFile)}`);
            successCount++;

            // 如果设置了删除原始文件
            if (deleteOriginal) {
                fs.unlinkSync(pngFile);
                console.log(`  ✓ 已删除原始文件: ${path.basename(pngFile)}`);
            }

        } catch (error) {
            console.error(`  ✗ 转换失败: ${path.basename(pngFile)} - ${error.message}`);
            errorCount++;
        }
    }

    // 输出统计信息
    console.log('\n=== 转换完成 ===');
    console.log(`成功转换: ${successCount} 个文件`);
    console.log(`转换失败: ${errorCount} 个文件`);
    console.log(`总计处理: ${pngFiles.length} 个文件`);
}

/**
 * 主函数 - 处理命令行参数
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
用法: node convertPictures.mjs <目录路径> [选项]

参数:
  <目录路径>    要转换的PNG图片所在目录

选项:
  --quality <数字>      WebP质量 (1-100, 默认80)
  --delete-original     转换后删除原始PNG文件
  --no-recursive        不递归搜索子目录

示例:
  node convertPictures.mjs ./images
  node convertPictures.mjs ./images --quality 90
  node convertPictures.mjs ./images --delete-original
  node convertPictures.mjs ./images --quality 85 --delete-original
        `);
        process.exit(1);
    }

    const inputDir = args[0];
    const options = {};

    // 解析命令行选项
    for (let i = 1; i < args.length; i++) {
        switch (args[i]) {
            case '--quality':
                options.quality = parseInt(args[++i]);
                if (isNaN(options.quality) || options.quality < 1 || options.quality > 100) {
                    console.error('质量参数必须是1-100之间的数字');
                    process.exit(1);
                }
                break;
            case '--delete-original':
                options.deleteOriginal = true;
                break;
            case '--no-recursive':
                options.recursive = false;
                break;
            default:
                console.error(`未知选项: ${args[i]}`);
                process.exit(1);
        }
    }

    try {
        await convertPngToWebp(inputDir, options);
    } catch (error) {
        console.error('转换过程中发生错误:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本，则执行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { convertPngToWebp };
