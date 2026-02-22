// export const dynamic = 'force-dynamic'; // static by default, unless reading the request

import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { waitUntil } from '@vercel/functions';
import {
  deleteMediaFromStorage,
  failedWithCode,
  grok,
} from './_utils/index.js';
import { BROAD_TYPES, CONTENT_TYPES, ERROR_CODES } from './_constants.js';
import { pushMessage } from './message.js';
import { checkBadgesByType } from './badges/check.js';
import { trackServerEvent } from './_utils/posthog.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPEN_ROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://komiko.app', // Optional. Site URL for rankings on openrouter.ai.
    'X-Title': 'KomikoAI', // Optional. Site title for rankings on openrouter.ai.
  },
  // apiKey: process.env.OPENAI_API_KEY,
});

const openaiModerate = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function generate16CharUUID() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let uuid = '';
  for (let i = 0; i < 16; i++) {
    uuid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return uuid;
}

export async function checkContent({
  title,
  description,
  prompts,
  images,
  personality,
  interests,
  introduction,
}: {
  title: string;
  description: string;
  prompts: string[];
  images: string[];
  personality: string;
  interests: string;
  introduction;
}) {
  // Check if API key is available
  if (!process.env.OPEN_ROUTER_API_KEY) {
    console.error('OPEN_ROUTER_API_KEY is not configured');
    throw new Error('Content moderation service is not configured');
  }

  const text = `Title: ${title || ''}
    ${introduction ? `Introduction: ${introduction || ''}` : ''}
    ${personality ? `Personality: ${personality || ''}` : ''}
    ${interests ? `Interests: ${interests || ''}` : ''}
    ${description ? `Description: ${description} ${prompts.length > 0 ? `Prompts: ${prompts.join(', ')}` : ''}` : ''}`;
  console.log('text', text);
  const response = await openai.chat.completions.create({
    model: 'x-ai/grok-4.1-fast',
    // model: 'chatgpt-4o-latest',
    messages: [
      {
        role: 'system',
        content: `You are a content moderation assistant. Classify content as "Illegal", "NSFW" or "Normal".
Illegal: If the image or text contains illegal material (including child sexual abuse material or child pornography).
NSFW: If the image or text contains NSFW (Not Safe For Work) content such as adult/sexual material, nudity, graphic violence, gore, or other inappropriate material.
Normal: If the image or text does not fall into either of the above categories.
Respond with only one word: "Illegal", "NSFW", or "Normal". Do not include any explanation or additional text.`,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text },
          ...images.map(image => ({
            type: 'image_url' as const,
            image_url: { url: image },
          })),
        ],
      },
    ],
  });

  const result =
    response.choices[0].message.content?.trim().toLowerCase() || 'Illegal';
  return result as 'Illegal' | 'NSFW' | 'Normal';
}

export const moderateContent = async (text: string, images: string[]) => {
  // OpenAI moderation accepts only one image per request; fan out concurrently.
  const targets = images.length > 0 ? images : [undefined];

  const results = await Promise.all(
    targets.map(image =>
      openaiModerate.moderations.create({
        model: 'omni-moderation-latest',
        input: [
          { type: 'text', text },
          ...(image
            ? [
                {
                  type: 'image_url' as const,
                  image_url: { url: image },
                },
              ]
            : []),
        ],
      }),
    ),
  );

  return results.map(res => res.results[0]);
};

const scoreContent = async (images: string[]) => {
  const response = await openai.chat.completions.create({
    model: 'x-ai/grok-4.1-fast',
    // model: 'chatgpt-4o-latest',
    messages: [
      {
        role: 'system',
        content: `Decide how aesthetic the image is and how much credit to award the author.
Real human porn pornography (realistic human photo instead of artistic style), or CSAM: 0
Looks really bad, or photography: 10
Low quality (including NSFW): 10-20
Mid quality: 21-40
Very aesthetic: 50
Just output the number. Do not include any explanation or additional text in your output.`,
      },
      {
        role: 'user',
        content: [
          ...images.map(image => ({
            type: 'image_url' as const,
            image_url: { url: image },
          })),
        ],
      },
    ],
  });

  return Number(response.choices[0].message.content?.trim().toLowerCase()) || 0;
};

export async function checkContentAndScore({
  title,
  description,
  prompts,
  images,
  tags,
}: {
  title: string;
  description: string;
  prompts: string[];
  images: string[];
  tags: string[];
}) {
  const tagsText = tags.length > 0 ? `Tags: ${tags.join(', ')} \n ` : '';
  const text = `Title: ${title || ''} \n ${description ? `Description: ${description} \n ` : ''} ${prompts.length > 0 ? `Prompts: ${prompts.join(', ')}` : ''} \n ${tagsText}`;

  // const moderateResult = await moderateContent(text, images);
  // const scoreResult = await scoreContent(images);
  console.log(text, images, 'text, images');
  const [moderateResult, moderateImageResult, scoreResult] = await Promise.all([
    moderateContent(text, images),
    moderateContent('', images),
    scoreContent(images).catch(),
  ]);

  return {
    moderate: moderateResult,
    moderateImage: moderateImageResult,
    credit: scoreResult || 0,
  };
}

const isScoreNSFW = (
  moderate: OpenAI.Moderations.Moderation,
  threshold: number,
) => {
  let isNSFW = false;
  for (const key in moderate.category_scores) {
    if (moderate.category_scores[key] > threshold) {
      isNSFW = true;
      break;
    }
  }
  return isNSFW;
};

const getContentResult = (
  contentResult: {
    moderate: OpenAI.Moderations.Moderation[];
    moderateImage: OpenAI.Moderations.Moderation[];
    credit: number;
  },
  userId?: string,
): 'nsfw' | 'normal' | 'illegal' => {
  const moderate = contentResult?.moderate;
  const moderateImage = contentResult?.moderateImage;
  console.log(
    'moderate',
    userId,
    moderate,
    moderateImage,
    contentResult.credit,
  );
  if (contentResult.credit <= 0) {
    return 'illegal';
  }

  const hasUnsafe = (moderate || []).some(result => {
    const sexual = result?.category_scores?.['sexual'] ?? 0;
    const violence = result?.category_scores?.['violence'] ?? 0;
    return sexual >= 0.07 || violence >= 0.4;
  });
  const hasUnsafeImage = (moderateImage || []).some(result => {
    const sexual = result?.category_scores?.['sexual'] ?? 0;
    const violence = result?.category_scores?.['violence'] ?? 0;
    return sexual >= 0.07 || violence >= 0.4;
  });

  return hasUnsafe || hasUnsafeImage ? 'nsfw' : 'normal';
};

interface Tag {
  id: number;
  name: string;
}

const hasPrivateTag = (tags: Tag[]) =>
  !!tags.find(tag => tag.name.toLowerCase().trim() === 'nsfw');

const getGenerations = async (
  generations: { id: number; url: string }[],
  media_type?: string,
) => {
  const ids = generations.map(generation => generation.id).filter(id => id > 0);
  const tableName =
    media_type === 'video' ? 'VideoGeneration' : 'ImageGeneration';
  const { data, error } = await supabase
    .from(tableName)
    .select('prompt,meta_data')
    .in('id', ids);
  if (error) {
    console.error('Error fetching image generations:', error);
    return [];
  }
  return data;
};

export const detectNSFWTag = async (tags: Tag[]) => {
  let result: Record<string, boolean> = {};
  const characterTags = tags.filter(tag => /^@([^@]+?)/.test(tag.name));
  if (characterTags.length > 0) {
    for (const tag of characterTags) {
      const isNSFW = await isNSFWCharacterTag(tag.name);
      result[tag.name] = isNSFW;
    }
  }

  const normalTags = tags.filter(tag => !/^@([^@]+?)/.test(tag.name));

  // 如果没有普通 tags，直接返回 character tags 的结果
  if (normalTags.length === 0) {
    return result;
  }

  try {
    const response = await grok({
      messages: [
        {
          role: 'system',
          content:
            'You are a content moderation assistant. Classify content as "NSFW" or "Normal".',
        },
        {
          role: 'user',
          content: `I create some tags to classify the content. Please detect what the tag names is related to NSFW. The tag names are: ${normalTags.map(tag => tag.name).join(', ')}.
        Response with a json object like this: {"{{tag_name1}}": true, "{{tag_name2}}": true, ...}`,
        },
      ],
    });
    const jsonStr = response.choices[0].message.content;
    try {
      const normalTagsResult = JSON.parse(jsonStr || '{}');
      result = { ...result, ...normalTagsResult };
    } catch (parseError) {
      // JSON 解析失败，只返回已处理的 character tags 结果
      console.error('Failed to parse NSFW tag detection result:', parseError);
    }
  } catch (apiError) {
    // API 调用失败，只返回已处理的 character tags 结果
    console.error('Failed to call grok API for NSFW tag detection:', apiError);
  }

  return result;
};

const getCharacterInfo = async (tagName: string) => {
  const uniqid = tagName.replace('@', '');
  const { data, error } = await supabase
    .from('CustomCharacters')
    .select('id,character_uniqid,authUserId,is_nsfw')
    .eq('character_uniqid', uniqid)
    .single();
  if (error || !data) {
    console.error('Error fetching character info:', error);
    return null;
  }
  return data;
};

const isNSFWCharacterTag = async (
  tagName: string,
  cacheInfo?: Record<string, any>,
) => {
  const characterInfo = await getCharacterInfo(tagName);
  if (cacheInfo) {
    cacheInfo[tagName] = characterInfo;
  }
  return characterInfo?.is_nsfw || false;
};

const sendMessageToCharacterOwner = async ({
  tagName,
  cacheInfo,
  contentId,
  fromUserId,
}: {
  tagName: string;
  cacheInfo: Record<string, any>;
  contentId: number;
  fromUserId: string;
}) => {
  let characterInfo = cacheInfo[tagName];
  if (!characterInfo) {
    characterInfo = await getCharacterInfo(tagName);
    if (cacheInfo) {
      cacheInfo[tagName] = characterInfo;
    }
    if (!characterInfo) {
      return;
    }
  }
  pushMessage(
    {
      content_type: CONTENT_TYPES.OC_USED,
      content_id: contentId,
      user_id: characterInfo.authUserId,
      host_content_id: characterInfo.id,
      broad_type: BROAD_TYPES.MESSAGE,
    },
    fromUserId,
  );
};
export async function POST(request: Request) {
  try {
    const {
      title,
      description,
      images,
      generations,
      tags,
      hide_main_feed,
      media_type,
      new_tags = [],
      is_pinned = false,
      should_translate = false,
      hide_prompt = false,
      oc_id,
    } = await request.json();

    const generationMapTableName =
      media_type === 'video'
        ? 'app_posts_video_generations'
        : 'app_posts_image_generations';
    // 不是内部生图的不给积分
    let shouldAddCredit = !!generations?.length;
    // Filter out Featured tags to prevent manual addition
    let filteredNewTags = new_tags.filter(
      tag =>
        tag.name !== 'Featured' &&
        tag.id !== 57349 &&
        tag.name !== 'All Posts' &&
        tag.id !== 57360 &&
        tag.name !== 'Templates' &&
        tag.id !== 87327 &&
        tag.name !== 'Animation' &&
        tag.id !== 21544,
    );

    // Parse cookies from the request headers
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];
    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Log in to post' }), {
        status: 401,
      });
    }
    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });
    if (!token) {
      return new Response(JSON.stringify({ error: 'Invalid login status' }), {
        status: 401,
      });
    }
    const userId = token.id as string;
    const postId = generate16CharUUID();

    // Check if user is blocked
    const { data: blockedData, error: blockedError } = await supabase
      .from('blocked_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (blockedError) {
      console.error('Error checking blocked user:', blockedError);
    }

    if (blockedData?.user_id) {
      // return new Response(JSON.stringify({ error: 'User is blocked' }), {
      //   status: 403,
      // });
      return failedWithCode(ERROR_CODES.USER_OPERATION_FORBIDDEN, 'Forbidden');
    }

    // const imageUrls = [];
    // const prompts = await getImageGenerations(generations);
    const generationData = await getGenerations(generations, media_type);
    const prompts = generationData.map(gen => gen.prompt);
    const metaDatas = generationData
      .map(gen => gen.meta_data)
      .map(metaData => {
        if (metaData && typeof metaData === 'string') {
          try {
            return JSON.parse(metaData);
          } catch {
            return null;
          }
        }
        return metaData;
      })
      .filter(metaData => metaData?.style_id);

    if (metaDatas.length > 0) {
      filteredNewTags.push({
        id: 87327,
        name: 'Templates',
      });
    }

    let credit = 0;
    if (media_type === 'image') {
      try {
        const contentResult = await checkContentAndScore({
          title,
          description,
          prompts,
          images,
          tags: filteredNewTags.map(tag => tag.name),
        });
        credit = contentResult?.credit || 0;

        const contentResultType = getContentResult(contentResult, userId);
        if (
          contentResultType === 'illegal' ||
          (contentResultType === 'nsfw' && !generations?.length)
        ) {
          waitUntil(
            deleteMediaFromStorage(
              images.filter(
                image => image.match(/^https?:/) && image.includes('supabase'),
              ),
            ),
          );
          return new Response(
            JSON.stringify({
              code: 400,
              error:
                'Illegal content (including minors) is strictly forbidden and will result in a permanent ban',
            }),
            {
              status: 400,
            },
          );
        }

        if (contentResultType === 'nsfw') {
          const nsfwTag = filteredNewTags.find(tag => tag.name === 'NSFW');
          if (!nsfwTag) {
            filteredNewTags.push({
              id: 2,
              name: 'NSFW',
            });
          }
        }
      } catch (checkError) {
        console.error('Content check failed (image):', checkError);
        return new Response(
          JSON.stringify({
            error: 'Failed to post.Please check your image file type.',
            details: 'Unknown error',
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
      }
    }

    // 如果是视频类型，检测首帧和末帧图片（由前端预先上传）
    if (media_type === 'video' && images && images.length > 0) {
      try {
        // 从 images 数组中提取所有帧图（首帧、末帧等），仅保留视频本身
        const frameImageIndexes: number[] = [];
        images.forEach((image, index) => {
          if (image.match(/\.(jpe?g|png|gif|webp)$/i)) {
            frameImageIndexes.push(index);
          }
        });

        // 如果没有任何帧图，跳过检测
        if (frameImageIndexes.length === 0) {
          // eslint-disable-next-line no-console
          console.warn('No frame images found for video NSFW detection');
        } else {
          // 只使用第一张和最后一张帧图做 NSFW 检测（避免未来扩展时过多图片）
          const selectedIndexes =
            frameImageIndexes.length > 1
              ? [
                  frameImageIndexes[0],
                  frameImageIndexes[frameImageIndexes.length - 1],
                ]
              : [frameImageIndexes[0]];

          const uniqueSelectedIndexes = Array.from(new Set(selectedIndexes));
          const frameImages: string[] = [];

          // 为了不影响后面的索引，倒序删除
          uniqueSelectedIndexes
            .sort((a, b) => b - a)
            .forEach(idx => {
              const [removed] = images.splice(idx, 1);
              if (removed) {
                frameImages.push(removed);
              }
            });

          if (frameImages.length === 0) {
            // eslint-disable-next-line no-console
            console.warn('Frame images selected but none extracted');
          } else {
            const contentResult = await checkContentAndScore({
              title,
              description,
              prompts,
              // 同时检测首帧和末帧
              images: frameImages,
              tags: filteredNewTags.map(tag => tag.name),
            });

            console.log('frameImages', frameImages);

            credit = contentResult?.credit || 0;
            const contentResultType = getContentResult(contentResult, userId);
            if (
              contentResultType === 'illegal' ||
              (contentResultType === 'nsfw' && !generations?.length)
            ) {
              waitUntil(
                deleteMediaFromStorage(
                  images.filter(
                    (image: string) =>
                      image.match(/^https?:/) && image.includes('supabase'),
                  ),
                ),
              );
              return new Response(
                JSON.stringify({
                  code: 400,
                  error:
                    'Illegal content (including minors) is strictly forbidden and will result in a permanent ban',
                }),
                {
                  status: 400,
                },
              );
            }

            // 如果任一帧是 NSFW，添加 NSFW 标签
            if (contentResultType === 'nsfw') {
              const nsfwTag = filteredNewTags.find(tag => tag.name === 'NSFW');
              if (!nsfwTag) {
                filteredNewTags.push({
                  id: 2,
                  name: 'NSFW',
                });
              }
            }

            // 检测完成后，删除用于检测的帧图片（首帧、末帧）
            try {
              // 从完整URL中提取相对路径
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
              const pathsToDelete: string[] = [];

              for (const frameImage of frameImages) {
                if (supabaseUrl && frameImage.startsWith(supabaseUrl)) {
                  const relativePath = frameImage.replace(
                    `${supabaseUrl}/storage/v1/object/public/husbando-land/`,
                    '',
                  );
                  pathsToDelete.push(relativePath);
                }
              }

              if (pathsToDelete.length > 0) {
                const { error: deleteError } = await supabase.storage
                  .from('husbando-land')
                  .remove(pathsToDelete);

                if (deleteError) {
                  console.error('Error deleting frame images:', deleteError);
                } else {
                  // eslint-disable-next-line no-console
                  console.log(
                    'Successfully deleted frame images:',
                    pathsToDelete,
                  );
                }
              }
            } catch (deleteError) {
              console.error('Error during frame images deletion:', deleteError);
              // 不阻止发布流程，只记录错误
            }
          }
        }
      } catch (checkError) {
        console.error('Content check failed (video):', checkError);
        return new Response(
          JSON.stringify({
            error: 'Failed to post.Please check your image file type.',
            details: 'Unknown error',
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
      }
    }
    // If the post is a video, add Animation tag
    if (media_type === 'video') {
      const animationTag = filteredNewTags.find(
        tag => tag.name === 'Animation',
      );
      if (!animationTag) {
        filteredNewTags.push({
          id: 21544, // Will be resolved when creating the tag
          name: 'Animation',
        });
      }
    } else {
      // Remove Animation tag if the post is not a video
      filteredNewTags = filteredNewTags.filter(
        tag => tag.name !== 'Animation' || tag.id !== 21544,
      );
    }
    const characterTags = filteredNewTags.filter(tag =>
      /^@([^@]+?)/.test(tag.name),
    );
    const cacheInfo: Record<string, any> = {};
    for (const tag of characterTags) {
      const isNSFW = await isNSFWCharacterTag(tag.name, cacheInfo);
      if (isNSFW) {
        const nsfwTag = filteredNewTags.find(
          tag => tag.name === 'NSFW' || tag.id === 2,
        );
        if (!nsfwTag) {
          filteredNewTags.push({
            id: 2,
            name: 'NSFW',
          });
          break;
        }
      }
    }
    const isPrivate = hasPrivateTag(filteredNewTags);
    const { data: postData, error: postError } = await supabase
      .from('AppPosts')
      .insert([
        {
          title,
          content: description,
          media: images,
          generations: [],
          authUserId: userId,
          uniqid: postId,
          tags,
          hide_main_feed,
          media_type,
          is_private: isPrivate,
        },
      ])
      .select('id')
      .single();
    if (postError || !postData) {
      throw postError || new Error('Failed to post');
    }

    // If should_translate is requested, trigger admin-protected translate endpoint in background
    if (should_translate === true) {
      try {
        const origin = new URL(request.url).origin;
        // Use waitUntil so we don't block the response
        waitUntil(
          fetch(`${origin}/api/post/translate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // forward cookies so authMiddleware can validate admin
              cookie: request.headers.get('cookie') || '',
            },
            body: JSON.stringify({ post_id: postData.id }),
          }).then(async res => {
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
              console.error('Auto-translate failed', res.status, body);
            }
          }),
        );
      } catch (e) {
        console.error('Error scheduling auto-translate', e);
      }
    }

    // generation 已经发过帖子的不给积分
    if (shouldAddCredit) {
      const { count, error } = await supabase
        .from(generationMapTableName)
        .select('*', { count: 'exact', head: true })
        .in(
          'generation_id',
          generations.map(generation => generation.id),
        );
      if (error) {
        console.error('Error fetching generation map:', error);
        shouldAddCredit = false;
      } else {
        shouldAddCredit = (count ?? 0) <= 0;
      }
    }

    const { error: generationMapError } = await supabase
      .from(generationMapTableName)
      .insert(
        generations.map(generation => ({
          post_id: postData.id,
          generation_id: generation.id,
          hide_prompt,
        })),
      );
    if (generationMapError) {
      console.error('Error mapping generations to post:', generationMapError);
    }

    // Map OC to post if oc_id is provided
    if (oc_id) {
      const { error: ocGenerationMapError } = await supabase
        .from('custom_characters_image_generations')
        .insert([
          {
            post_id: postData.id,
            character_uniqid: oc_id,
            hide_prompt,
          },
        ]);

      if (ocGenerationMapError) {
        console.error('Error mapping OC to post:', ocGenerationMapError);
      }
    }

    // Handle pin functionality if requested and user is official account
    const OFFICIAL_ACCOUNT_ID = process.env.OFFICIAL_ACCOUNT_ID || '';
    if (is_pinned && userId === OFFICIAL_ACCOUNT_ID) {
      try {
        const { error: pinError } = await supabase.from('PinAppPost').insert([
          {
            post_id: postData.id,
            pinned_by: userId,
            is_active: true,
          },
        ]);

        if (pinError) {
          console.error('Error pinning post during creation:', pinError);
          // Don't fail the entire post creation if pinning fails
        }
      } catch (pinError) {
        console.error('Error handling pin during post creation:', pinError);
        // Don't fail the entire post creation if pinning fails
      }
    }

    let message = should_translate
      ? 'Story posted! Translation started.'
      : 'Story posted!';

    let realAddedCredit = 0;
    if (shouldAddCredit) {
      // Award credits for first post of the day
      const { data: dateData, error: dateError } = await supabase
        .from('User')
        .select('date_post, credit')
        .eq('id', userId)
        .single();
      // console.log(dateData);
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      if (dateError) {
        console.error('Error fetching User datePost:', dateError);
      }
      if (dateData && !dateError && dateData?.date_post !== todayString) {
        realAddedCredit = credit;
        const { error } = await supabase
          .from('User')
          .update({ date_post: new Date(), credit: dateData.credit + credit })
          .eq('id', userId);
        message =
          'Story posted! You have been awarded 50 credits for your first post of the day!🎉';
        if (error) {
          console.error('Error updating User datePost:', error);
        } else {
          waitUntil(
            trackServerEvent('dispatch_credit', userId, {
              credit,
              reason: 'first_post_of_the_day',
            }),
          );
        }
      }
    }
    if (filteredNewTags && filteredNewTags.length > 0) {
      const postDbId = postData.id;

      const processNewTags = async () => {
        const nsfwTagResult = await detectNSFWTag(
          filteredNewTags.filter(tag => tag.id < 0),
        );
        const existingTagIds = filteredNewTags
          .filter(tag => tag.id >= 0)
          .map(tag => tag.id);
        let hasExistingNSFWTag = false;
        if (existingTagIds.length > 0) {
          const { data: existingTags, error: existingTagsError } =
            await supabase
              .from('tags')
              .select('id, is_nsfw')
              .in('id', existingTagIds);
          if (existingTagsError) {
            console.error('Error fetching existing tags:', existingTagsError);
            // Fail closed: if we cannot verify, suppress notifications.
            hasExistingNSFWTag = true;
          } else {
            hasExistingNSFWTag =
              existingTags?.some(tag => !!tag.is_nsfw) || false;
          }
        }
        const hasNSFWTag =
          Object.values(nsfwTagResult).some(value => !!value) ||
          hasExistingNSFWTag ||
          filteredNewTags.some(tag => tag.id === 2);
        // console.log(nsfwTagResult, 'nsfwTagResult');
        for (const tag of filteredNewTags) {
          let tagId = tag.id;
          // Trim tag name to prevent duplicate tags with trailing/leading spaces
          const trimmedTagName = tag.name.trim();

          if (tagId < 0) {
            // This is a new tag, need to check if it exists (case-insensitive) first
            try {
              // First, check for existing tag with case-insensitive match
              const { data: existingTag } = await supabase
                .from('tags')
                .select('id, name')
                .ilike('name', trimmedTagName)
                .limit(1)
                .single();

              if (existingTag) {
                // Tag already exists (case-insensitive match), use its ID
                tagId = existingTag.id;
              } else {
                // No existing tag found, create new one
                const { data: newTagData, error: newTagError } = await supabase
                  .from('tags')
                  .insert([
                    {
                      name: trimmedTagName,
                      popularity: 0,
                      is_nsfw: !!nsfwTagResult[tag.name] || false,
                    },
                  ])
                  .select('id')
                  .single();

                if (newTagError) {
                  // Check if it's a unique constraint violation (race condition)
                  if (newTagError.code === '23505') {
                    // Tag was created by another request, get its ID
                    const { data: raceTag } = await supabase
                      .from('tags')
                      .select('id')
                      .ilike('name', trimmedTagName)
                      .limit(1)
                      .single();
                    tagId = raceTag?.id;
                  } else {
                    console.error('Error creating tag:', newTagError);
                    continue;
                  }
                } else {
                  tagId = newTagData.id;
                }
              }
            } catch (error) {
              console.error('Error processing new tag:', error);
              continue;
            }
          }

          if (tagId >= 0) {
            // Insert into post_tags
            const { data: postTagData, error: postTagError } = await supabase
              .from('post_tags')
              .insert([{ tag_id: tagId, post_id: postDbId }])
              .select('id')
              .single();

            if (postTagError) {
              console.error('Error linking tag to post:', postTagError);
              continue;
            }
            if (tag.name.startsWith('@') && !hasNSFWTag) {
              sendMessageToCharacterOwner({
                tagName: tag.name,
                cacheInfo,
                contentId: postTagData.id,
                fromUserId: userId as string,
              });
            }
          }
        }
      };

      // Process tags asynchronously using waitUntil if available
      await processNewTags();
    }

    // TODO: 暂时注释掉非VIP徽章检查
    // // 触发徽章检查（发帖相关）
    // try {
    //   waitUntil(checkBadgesByType(userId, 'post'));
    // } catch (error) {
    //   console.error('Error checking badges after post:', error);
    // }

    return new Response(
      JSON.stringify({ message, postId, credit: realAddedCredit }),
      { status: 200 },
    );
  } catch (error) {
    console.error('Error posting:', error);
    // Log detailed error info for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return new Response(
      JSON.stringify({
        error: 'Failed to post',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
