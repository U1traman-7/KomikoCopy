const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const glob = require('glob');

// 支持的图片格式
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
// 支持的视频格式
const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov'];

// 需要排除的目录
const EXCLUDED_DIRS = ['.next', '.vercel','.contentlayer', 'node_modules', 'dist', 'build'];

// 递归获取所有文件
function getAllFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        // 检查是否为需要排除的目录
        const dirName = path.basename(file);
        if (stat && stat.isDirectory()) {
            if (!EXCLUDED_DIRS.includes(dirName)) {
                results = results.concat(getAllFiles(file));
            }
        } else {
            results.push(file);
        }
    });
    return results;
}

// 转换图片到webp
async function convertImageToWebp(filePath) {
    const outputPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    try {
        await sharp(filePath)
            .webp({ quality: 80 })
            .toFile(outputPath);
        console.log(`Converted ${filePath} to ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error(`Error converting ${filePath}:`, error);
        return null;
    }
}

// 转换视频到webm
function convertVideoToWebm(filePath) {
    return new Promise((resolve, reject) => {
        const outputPath = filePath.replace(/\.(mp4|avi|mov)$/i, '.webm');
        ffmpeg(filePath)
            .outputOptions([
                '-c:v libvpx-vp9',
                '-crf 30',
                '-b:v 0',
                '-c:a libopus'
            ])
            .toFormat('webm')
            .on('end', () => {
                console.log(`Converted ${filePath} to ${outputPath}`);
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error(`Error converting ${filePath}:`, err);
                reject(err);
            })
            .save(outputPath);
    });
}

// 替换文件中的引用
async function replaceReferences(searchPath) {
    const globOptions = {
        ignore: EXCLUDED_DIRS.map(dir => `**/${dir}/**`),
    };
    const files = glob.sync(searchPath + '/**/*.{js,jsx,ts,tsx,vue,html,css,scss}', globOptions);

    for (const file of files) {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;

        // 替换图片引用，排除外部链接
        IMAGE_EXTENSIONS.forEach(ext => {
            const regex = new RegExp(`(?<!https?:\/\/[^\\s]*?)\\.(jpg|jpeg|png)(?![^\\s]*?['"]*?https?:)`, 'gi');
            if (content.match(regex)) {
                content = content.replace(regex, '.webp');
                modified = true;
            }
        });

        // 替换视频引用，排除外部链接
        // VIDEO_EXTENSIONS.forEach(ext => {
        //     const regex = new RegExp(`(?<!https?:\/\/[^\\s]*?)\\.(mp4|avi|mov)(?![^\\s]*?['"]*?https?:)`, 'gi');
        //     if (content.match(regex)) {
        //         content = content.replace(regex, '.webm');
        //         modified = true;
        //     }
        // });

        if (modified) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Updated references in ${file}`);
        }
    }
}

// 主函数 - 转换媒体文件
async function convertMedia(mediaType, targetDir = null) {
    // 如果指定了目标目录，使用它；否则使用 public 目录
    const baseDir = targetDir
        ? path.join(process.cwd(), targetDir)
        : path.join(process.cwd(), 'public');

    if (!fs.existsSync(baseDir)) {
        console.error(`Directory not found: ${baseDir}`);
        process.exit(1);
    }

    const files = getAllFiles(baseDir);

    // 根据mediaType处理不同类型的文件
    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (mediaType === 'image' && IMAGE_EXTENSIONS.includes(ext)) {
            await convertImageToWebp(file);
        } else if (mediaType === 'video' && VIDEO_EXTENSIONS.includes(ext)) {
            await convertVideoToWebm(file);
        }
    }

    console.log(`${mediaType} conversion completed in ${baseDir}!`);
}

// 主函数 - 替换引用
async function updateReferences() {
    await replaceReferences(process.cwd());
    console.log('Reference replacement completed!');
}

// 运行脚本
const command = process.argv[2];
const mediaType = process.argv[3];
const targetDir = process.argv[4]; // 新增参数：目标目录

if (!command) {
    console.error('Please specify a command: convert or replace');
    process.exit(1);
}

if (command === 'convert' && !mediaType) {
    console.error('Please specify a media type: image or video');
    process.exit(1);
}

switch (command) {
    case 'convert':
        if (!['image', 'video'].includes(mediaType)) {
            console.error('Invalid media type. Use: image or video');
            process.exit(1);
        }
        convertMedia(mediaType, targetDir).catch(console.error);
        break;
    case 'replace':
        updateReferences().catch(console.error);
        break;
    case 'all':
        Promise.all([
            convertMedia('image', targetDir),
            convertMedia('video', targetDir),
            updateReferences()
        ])
            .then(() => console.log('All operations completed!'))
            .catch(console.error);
        break;
    default:
        console.error('Invalid command. Use: convert, replace, or all');
        process.exit(1);
}

