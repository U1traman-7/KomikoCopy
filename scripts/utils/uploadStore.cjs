const fs = require('fs');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log(supabaseUrl, supabaseKey);
const supabase = createClient(supabaseUrl, supabaseKey);

const TEMP_DIR = path.join(__dirname, '../temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// 定义要扫描的文件扩展名
const SCAN_EXTENSIONS = ['.tsx', '.ts', '.js', '.jsx', '.mdx', '.md'];

// 匹配 Supabase URL 的正则表达式
const SUPABASE_URL_REGEX = /https:\/\/[^\/]+\.supabase\.co\/storage\/v1\/object\/public\/husbando-land\/[^"'\s)}>]+/g;

// 定义要排除的目录
const EXCLUDED_DIRS = ['node_modules', '.git', '.next', '.vercel'];

// 扫描目录中的所有文件
function getAllFiles(dir) {
    const files = [];

    function scan(currentDir) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            // 使用数组检查要排除的目录
            if (entry.isDirectory()) {
                if (!EXCLUDED_DIRS.includes(entry.name)) {
                    scan(fullPath);
                }
                continue;
            }

            // 只处理指定扩展名的文件
            if (SCAN_EXTENSIONS.includes(path.extname(fullPath))) {
                files.push(fullPath);
            }
        }
    }

    scan(dir);
    return files;
}

// 从文件内容中提取所有 Supabase URLs
function extractUrls(content) {
    return content.match(SUPABASE_URL_REGEX) || [];
}

// 更新文件中的 URL
async function updateFileUrls(filePath, urlMap) {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    for (const [oldUrl, newUrl] of Object.entries(urlMap)) {
        if (content.includes(oldUrl)) {
            content = content.replace(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
            hasChanges = true;
        }
    }

    if (hasChanges) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated URLs in: ${filePath}`);
    }
}

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function convertToWebp(inputPath, outputPath) {
  await sharp(inputPath)
    .webp({ quality: 80 })
    .toFile(outputPath);
}

async function convertVideo(inputPath, outputPath) {
  // 使用 ffmpeg 转换视频为更优化的格式，添加音频编码
  await execAsync(`ffmpeg -i "${inputPath}" -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus "${outputPath}"`);
}

async function processFile(url) {
  try {
    // 解析 URL 中的路径
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const customPath = pathParts.slice(4, -1).join('/'); // 获取 app_media 之后的自定义路径

    // 下载文件到临时目录
    const tempInputPath = path.join(TEMP_DIR, fileName);
    await downloadFile(url, tempInputPath);

    // 确定文件类型和输出文件名
    const isVideo = /\.(mp4|mov|avi)$/i.test(fileName);
    const outputFileName = isVideo
      ? fileName.replace(/\.[^.]+$/, '.webm')
      : fileName.replace(/\.[^.]+$/, '.webp');
    const tempOutputPath = path.join(TEMP_DIR, outputFileName);

    // 转换文件
    if (isVideo) {
      await convertVideo(tempInputPath, tempOutputPath);
    } else {
      await convertToWebp(tempInputPath, tempOutputPath);
    }

    // 上传到 Supabase
    const uploadPath = `${customPath}/${outputFileName}`;
    const fileBuffer = fs.readFileSync(tempOutputPath);

    const { data, error } = await supabase.storage
      .from('husbando-land')
      .upload(uploadPath, fileBuffer, {
        contentType: isVideo ? 'video/webm' : 'image/webp',
        upsert: true
      });

    if (error) throw error;

    // 清理临时文件
    fs.unlinkSync(tempInputPath);
    fs.unlinkSync(tempOutputPath);

    return {
      originalUrl: url,
      convertedUrl: data.path,
      success: true
    };

  } catch (error) {
    console.error('Error processing file:', error);
    return {
      originalUrl: url,
      error: error.message,
      success: false
    };
  }
}

// 主函数
async function main() {
    try {
        // 获取项目根目录
        const rootDir = path.join(__dirname, '..');

        // 获取所有需要扫描的文件
        const files = getAllFiles(rootDir);
        console.log(`Found ${files.length} files to scan`);

        // 存储所有需要处理的 URL
        const urlsToProcess = new Set();

        // 从所有文件中收集 URLs
        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            const urls = extractUrls(content);
            urls.forEach(url => urlsToProcess.add(url));
        }

        console.log(`Found ${urlsToProcess.size} unique URLs to process`);

        // 处理所有 URL 并存储新旧 URL 映射
        const urlMap = {};
        for (const url of urlsToProcess) {
            console.log(`Processing: ${url}`);
            const result = await processFile(url);

            if (result.success) {
                const newUrl = `${supabaseUrl}/storage/v1/object/public/husbando-land/${result.convertedUrl}`;
                urlMap[url] = newUrl;
                console.log(`Converted: ${url} -> ${newUrl}`);
            } else {
                console.error(`Failed to process: ${url}`);
                console.error(result.error);
            }
        }

        // 更新所有文件中的 URLs
        for (const file of files) {
            await updateFileUrls(file, urlMap);
        }

        console.log('All files processed successfully!');

    } catch (error) {
        console.error('Error in main process:', error);
        process.exit(1);
    }
}

main().catch(console.error);
