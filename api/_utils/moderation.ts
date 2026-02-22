// /api/_utils/moderation.ts

import OpenAI from 'openai';
import type { Moderation } from 'openai/resources/moderations';

export interface ModerationResult {
  approved: boolean;
  reason?: string;
  categories?: Moderation.Categories;
  scores?: Moderation.CategoryScores;
}

/**
 * 审核图片内容
 * @param imageUrl 图片URL
 * @returns 审核结果
 */
export async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: [
        {
          type: 'image_url',
          image_url: { url: imageUrl }
        }
      ]
    });

    const result = response.results[0];
    const sexual = result.category_scores.sexual || 0;
    const violence = result.category_scores.violence || 0;

    // 审核阈值（与 postStory.ts 保持一致）
    if (sexual >= 0.07) {
      return {
        approved: false,
        reason: 'sexual_content',
        categories: result.categories,
        scores: result.category_scores
      };
    }

    if (violence >= 0.8) {
      return {
        approved: false,
        reason: 'violent_content',
        categories: result.categories,
        scores: result.category_scores
      };
    }

    return {
      approved: true,
      categories: result.categories,
      scores: result.category_scores
    };
  } catch (error) {
    console.error('Image moderation error:', error);
    // 审核失败时默认拒绝（安全优先）
    return {
      approved: false,
      reason: 'moderation_error: ' + (error as Error).message
    };
  }
}

/**
 * 审核文本内容
 * @param text 文本内容
 * @returns 审核结果
 */
// 违禁关键词列表（可以扩展）
const BLOCKED_KEYWORDS = [
  'fuck', 'shit', 'bitch', 'ass', 'dick', 'cock', 'pussy', 'cunt',
  'porn', 'sex', 'nude', 'naked', 'nsfw',
  'kill', 'murder', 'death', 'rape', 'suicide',
  // 添加更多违禁词...
];

/**
 * 检查文本是否包含违禁关键词
 */
function containsBlockedKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BLOCKED_KEYWORDS.some(keyword => {
    // 使用正则表达式确保匹配完整单词
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(lowerText);
  });
}

export async function moderateText(text: string): Promise<ModerationResult> {
  try {
    console.log('[Moderation] Checking text:', text.substring(0, 50) + '...');

    // 第一层：关键词过滤
    if (containsBlockedKeywords(text)) {
      console.log('[Moderation] Blocked by keyword filter');
      return {
        approved: false,
        reason: 'blocked_keyword'
      };
    }

    // 第二层：OpenAI Moderation API
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: [text]
    });

    const result = response.results[0];

    console.log('[Moderation] OpenAI result - flagged:', result.flagged);
    console.log('[Moderation] Categories:', result.categories);

    // 检查是否被标记
    if (result.flagged) {
      // 找出第一个为true的类别
      const violatedCategory = Object.keys(result.categories).find(
        key => result.categories[key]
      );

      return {
        approved: false,
        reason: violatedCategory || 'inappropriate_content',
        categories: result.categories,
        scores: result.category_scores
      };
    }

    console.log('[Moderation] Text approved');
    return {
      approved: true,
      categories: result.categories,
      scores: result.category_scores
    };
  } catch (error) {
    console.error('Text moderation error:', error);
    // 审核失败时默认拒绝（安全优先）
    return {
      approved: false,
      reason: 'moderation_error: ' + (error as Error).message
    };
  }
}

/**
 * 批量审核文本（用于同时审核用户名和简介）
 * @param texts 文本数组
 * @returns 审核结果数组
 */
export async function moderateTexts(texts: string[]): Promise<ModerationResult[]> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: texts
    });

    return response.results.map(result => {
      if (result.flagged) {
        const violatedCategory = Object.keys(result.categories).find(
          key => result.categories[key]
        );
        return {
          approved: false,
          reason: violatedCategory || 'inappropriate_content',
          categories: result.categories,
          scores: result.category_scores
        };
      }
      return {
        approved: true,
        categories: result.categories,
        scores: result.category_scores
      };
    });
  } catch (error) {
    console.error('Batch text moderation error:', error);
    return texts.map(() => ({
      approved: false,
      reason: 'moderation_error: ' + (error as Error).message
    }));
  }
}
