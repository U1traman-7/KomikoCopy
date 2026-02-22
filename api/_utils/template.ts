import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGUAGES } from '../../language.mjs';
import { createSupabase } from './index.js';

const supabase = createSupabase();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const replacePayload = (
  html: string,
  payload: Record<string, string>,
) => {
  const keys = Object.keys(payload);
  for (const key of keys) {
    try {
      const reg = new RegExp(`\\$\\{\\s*${key}\\s*\\}`, 'g');
      html = html.replace(reg, payload[key]);
    } catch (e) {
      console.error(e);
    }
  }
  return html;
};

export const generateEmailContent = (
  type: 'collect' | 'follow' | 'comment' | 'reply' | 'moderator_approved',
  payload: {
    character_name?: string;
    username?: string;
    character_uniqid?: string;
    email: string;
    post_title?: string;
    post_content?: string;
    comment_content?: string;
    post_id?: string;
    user_id?: string;
    tag_name?: string;
    role_name?: string;
    role_label?: string;
  },
) => {
  if (type === 'collect') {
    const html = fs.readFileSync(
      path.join(__dirname, 'html', 'collect.html'),
      'utf8',
    );
    return replacePayload(html, payload);
  }
  if (type === 'comment') {
    const html = fs.readFileSync(
      path.join(__dirname, 'html', 'comment.html'),
      'utf8',
    );
    return replacePayload(html, payload);
  }

  if (type === 'follow') {
    const html = fs.readFileSync(
      path.join(__dirname, 'html', 'follow.html'),
      'utf8',
    );
    return replacePayload(html, payload);
  }

  if (type === 'reply') {
    const html = fs.readFileSync(
      path.join(__dirname, 'html', 'reply.html'),
      'utf8',
    );
    return replacePayload(html, payload);
  }

  if (type === 'moderator_approved') {
    const html = fs.readFileSync(
      path.join(__dirname, 'html', 'moderator_approved.html'),
      'utf8',
    );
    return replacePayload(html, payload);
  }

  return '';
};

// 获取用户语言的方法
export const getUserLanguage = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('user_language')
      .select('language')
      .eq('user_id', userId)
      .single();

    if (error || !data?.language) {
      return 'en'; // 默认使用英文
    }

    // 处理 Accept-Language 格式，提取第一个语言代码
    const acceptLanguage = data.language;
    const languages = acceptLanguage
      .split(',')
      .map(language => language.trim()?.split(';')?.[0])
      .flat();

    for (const language of languages) {
      if (LANGUAGES.includes(language)) {
        return language;
      }
    }

    for (const language of languages) {
      const found = LANGUAGES.find(l => l.startsWith(language));
      if (found) {
        return found;
      }
    }

    return 'en'; // Default to English if no supported language found
  } catch (error) {
    console.error('Error getting user language:', error);
    return 'en';
  }
};

// 读取翻译文件
export const getTranslationFile = (
  language: string,
): Record<string, string> => {
  try {
    const filePath = path.join(__dirname, 'i18n', language, 'comment.json');
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error(`Error reading translation file for ${language}:`, error);
  }

  // 如果读取失败，返回英文翻译
  try {
    const enFilePath = path.join(__dirname, 'i18n', 'en', 'comment.json');
    const fileContent = fs.readFileSync(enFilePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading English translation file:', error);
    return {};
  }
};

// 替换变量
export const replaceVariables = (
  text: string,
  variables: Record<string, string>,
): string =>
  text.replace(
    /\{\{(\w+)\}\}/g,
    (match, variableName) => variables[variableName] || match,
  );

// 获取翻译文本
export const getTranslatedText = (
  language: string,
  key: string,
  variables: Record<string, string> = {},
): string => {
  const translations = getTranslationFile(language);
  const text = translations[key] || key;
  return replaceVariables(text, variables);
};

export const attrVariables = (
  translations: Record<string, string>,
  payload: Record<string, string>,
) => {
  for (const transKey in translations) {
    let transValue = translations[transKey];
    transValue = replaceVariables(transValue, payload);
    translations[transKey] = transValue;
  }
  return translations;
};
