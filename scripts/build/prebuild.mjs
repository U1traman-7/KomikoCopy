import fs from 'fs/promises';
import path from 'path';

// 递归读取目录下的所有文件
const getAllFiles = async (dir, fileList = []) => {
  const files = await fs.readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      fileList = await getAllFiles(filePath, fileList);
    } else if (file.isFile() && file.name.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }

  return fileList;
};

// 将snake case转换为kebab case
const snakeToKebab = (str) => {
  return str.replace(/_/g, '-');
};

// 提取title内容并处理
const extractTitle = (content, fileName, filePath) => {
  const titleMatch = content.match(/<title>(.*?)<\/title>/);
  if (!titleMatch) return null;

  let title = titleMatch[1];
  if (title.match(/t\(["'].+?["']\)/)) {
    let prefix = '';
    if (fileName === 'index.tsx') {
      // 使用目录名作为前缀
      const dirName = path.basename(path.dirname(filePath));
      prefix = snakeToKebab(dirName);
    } else {
      prefix = snakeToKebab(fileName.replace('.tsx', ''));
    }
    title = title.replace('t("', `t("${prefix}:`)
      .replace("t('", `t('${prefix}:`)
      .replace(/[{}]/g, '');
  }

  return title;
};

// 生成相对路径
const generateRoutePath = (filePath) => {
  const relativePath = filePath
    .replace('src/pages', '')
    .replace(/\.tsx$/, '')
    .replace(/\\/g, '/');

  if (relativePath.endsWith('/index')) {
    return relativePath.slice(0, -6); // 移除 '/index'
  }

  return relativePath;
};

const precompileToolsPage = async () => {
  try {
    // 1. 获取所有.tsx文件
    const allFiles = await getAllFiles('./src/pages');

    const toolsConfig = [];

    for (const filePath of allFiles) {
      // 跳过以_开头的文件和[xxx].tsx文件
      const fileName = path.basename(filePath);
      if (fileName.startsWith('_') || /^\[.+?\]\.tsx$/.test(fileName)) {
        continue;
      }

      // 2. 读取文件内容并检查target标记
      const content = await fs.readFile(filePath, 'utf-8');
      if (!content.match(/\/\/\s*\[\s*#target:tools\s*\]/)) {
        continue;
      }

      // 3. 生成相对路径
      const routePath = generateRoutePath(filePath);

      // 4. 提取title
      const title = extractTitle(content, fileName, filePath);
      if (!title) continue;

      // 5. 添加到配置数组
      toolsConfig.push({
        url: routePath,
        title: title
      });
    }

    // 6. 读取tools.tsx文件并替换内容
    const toolsFilePath = './src/pages/tools.tsx';
    let toolsContent = await fs.readFile(toolsFilePath, 'utf-8');

    const configJson = JSON.stringify(toolsConfig, null, 2)
      .replace(/"t\s*\(\s*('|\\")(.+?)('|\\")\s*\)"/g, (match, quoteType, content, quoteType2, rest) => {
        return `t('${content}')`;
      });

    toolsContent = toolsContent.replace(
      /\/\*\s*\[\s*#variables:tools_config\s*\]\s*\*\//,
      configJson.replace(/[\[\]]/g, '')
    );

    // 7. 写回文件
    await fs.writeFile(toolsFilePath, toolsContent, 'utf-8');

    console.log('Tools configuration updated successfully!');
  } catch (error) {
    console.error('Error in precompileToolsPage:', error);
  }
};

precompileToolsPage();
