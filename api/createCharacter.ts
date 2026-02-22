// export const dynamic = 'force-dynamic'; // static by default, unless reading the request

import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';
import withHandler from './_utils/withHandler.js';
import { authMiddleware } from './_utils/middlewares/auth.js';
import { ERROR_CODES } from './_constants.js';
import { customAlphabet } from 'nanoid';
import { transliterate } from 'transliteration';
import slugify from 'slugify';
import { randomUUID } from 'node:crypto';
import OpenAI from 'openai';
import { checkContent } from './postStory.js';
import { waitUntil } from '@vercel/functions';
import { trackServerEvent } from './_utils/posthog.js';
import { failedWithCode, grok, isUserSubscribed } from './_utils/index.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

function makeSlug(text) {
  const latinText = transliterate(text); // 把任意语言转成拉丁字母
  return slugify(latinText, {
    lower: true, // 全部小写
    strict: true, // 只保留字母数字和 `-`
    locale: 'en', // 避免语言特殊处理
    trim: true,
  });
}

// 生成短UUID
const generateShortUuid = customAlphabet(
  '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  4,
);

// 获取MIME类型
function getMimeType(extension: string): string {
  const mimeTypes: { [key: string]: string } = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  return mimeTypes[extension] || 'image/jpeg';
}

// 处理base64图片数据
async function processBase64Image(
  base64Data: string,
): Promise<{ imageData: Buffer; extension: string }> {
  let imageData: Buffer;

  if (base64Data.startsWith('http')) {
    const response = await fetch(base64Data);
    if (!response.ok) {
      throw new Error(
        `无法获取图片: ${response.status} ${response.statusText}`,
      );
    }
    const arrayBuffer = await response.arrayBuffer();
    imageData = Buffer.from(arrayBuffer);

    // 验证图片数据不为空
    if (imageData.length === 0) {
      throw new Error('获取到的图片数据为空');
    }
  } else {
    // 修复base64填充问题
    let cleanBase64 = base64Data;
    const paddingNeeded = cleanBase64.length % 4;
    if (paddingNeeded) {
      cleanBase64 += '='.repeat(4 - paddingNeeded);
    }

    if (cleanBase64.startsWith('data:image/')) {
      cleanBase64 = cleanBase64.split(';')[1].split(',')[1];
    }

    // 验证base64数据不为空
    if (!cleanBase64 || cleanBase64.trim().length === 0) {
      throw new Error('base64数据为空');
    }

    try {
      // 尝试URL安全的base64解码
      imageData = Buffer.from(cleanBase64, 'base64');
    } catch (error) {
      throw new Error(`无法解码图像: ${error}`);
    }
  }

  // 验证解码后的数据不为空
  if (imageData.length === 0) {
    throw new Error('解码后的图片数据为空');
  }

  // 简单检测文件类型（这里简化处理，实际项目中可能需要更复杂的检测）
  const extension = 'jpg'; // 默认使用jpg
  return { imageData, extension };
}

// 生成唯一的character_uniqid
async function generateUniqueCharacterId(safeName: string): Promise<string> {
  const maxAttempts = 10;

  for (let i = 0; i < maxAttempts; i++) {
    const suffix = generateShortUuid();
    const proposal = `${safeName}-${suffix}`;

    // 检查数据库中是否已存在
    const { data: existing } = await supabase
      .from('CustomCharacters')
      .select('character_uniqid')
      .eq('character_uniqid', proposal);

    if (!existing || existing.length === 0) {
      return proposal;
    }
  }

  // 如果10次尝试都失败，使用随机数
  const randomSuffix = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${safeName}-${randomSuffix}`;
}

const isImageEmptyBytes = async (url: string) => {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return buffer.byteLength === 0;
};

export async function generateImageDescription(
  imageUrl: string,
  prompt: string,
): Promise<string> {
  try {
    const response = await grok({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              // text: 'Give me danbooru tags to describe the appearance of the character in detail. Do not include tags about the pose nor expression nor background nor style, only describe appearance in detail. Include 1girl or 1boy is the character is female or male. Do not use underscore in the danbooru tags, use space instead of underscore in danbooru tags. Directly output the danbooru tags separated by commas, do not output anything else',
              text: `This is the user prompt the user used to generate the character image: ${prompt}
Now refer to the user prompt (but don't directly copy since the generated character image might not fully follow the prompt), and output very detailed danbooru tags to describe the actual appearance of the generated character. Include 1girl or 1boy if the character is female or male, do not include if the character isn't female nor male. Do not include tags about the pose nor expression nor background nor art style, only describe the character's appearance in detail. Do not use underscore in the danbooru tags, use space instead of underscore in danbooru tags. Directly output the detailed danbooru tags separated by commas, do not output anything else`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('生成图片描述错误:', error);
    // throw error;
    return '';
  }
}

// 创建角色的主要逻辑
async function createCharacterLogic(requestData: any, userId: string) {
  const {
    name,
    description,
    age,
    profession,
    personality,
    interests,
    intro,
    gender,
    reference_images,
    prompt = '',
    is_public,
  } = requestData;

  // 验证角色名称
  if (!name || name.length < 1) {
    throw new Error('Character name is invalid.');
  }

  // 清理角色名称，只保留字母数字和单引号
  // const safeName = name.replace(/[^a-zA-Z0-9']/g, '');
  const safeName = makeSlug(name);

  // 生成唯一ID
  const uniqid = await generateUniqueCharacterId(safeName);
  // const fileUniqid = customAlphabet(
  //   '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  //   32,
  // )();
  const fileUniqid = `${userId}/${new Date().toISOString().split('T')[0]}/${randomUUID()}`;

  // 处理参考图片
  let signedUrl = '';
  if (reference_images && reference_images.length > 0) {
    const refImage = reference_images[0]; // 只处理第一张图片
    const { imageData, extension } = await processBase64Image(refImage);

    // 上传到Supabase Storage
    const folderPath = `custom_characters/${fileUniqid}/`;
    const bucketImagePath = `${folderPath}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('husbando-land')
      .upload(bucketImagePath, imageData, {
        contentType: getMimeType(extension),
      });

    if (uploadError) {
      throw new Error(`上传图片失败: ${uploadError.message}`);
    }

    // // 二次确认：检查文件是否存在
    // const { data: fileInfo, error: statError } = await supabase.storage
    //   .from('husbando-land')
    //   .list(`${folderPath}reference_images`);

    // if (statError || !fileInfo.find(f => f.name === `000.${extension}`)) {
    //   throw new Error('上传后未找到文件，可能写入失败');
    // }

    // 生成签名URL
    // const expirationPeriod = 60 * 60 * 24 * 365 * 100; // 100年
    // const { data: signedUrlData } = await supabase.storage
    //   .from('husbando-land')
    //   .createSignedUrl(bucketImagePath, expirationPeriod);
    const { data: publicUrlData } = await supabase.storage
      .from('husbando-land')
      .getPublicUrl(bucketImagePath);

    // signedUrl = signedUrlData?.signedUrl || '';
    signedUrl = publicUrlData.publicUrl;
  }

  if (!signedUrl) {
    throw new Error('Failed to generate signed URL');
  }

  const isEmpty = await isImageEmptyBytes(signedUrl);
  if (isEmpty) {
    throw new Error('Image is empty');
  }

  // 插入角色数据到数据库
  const createdAt = new Date().toISOString();
  const promptToSave: string =
    (prompt && String(prompt).trim()) ||
    (description ? String(description) : '');

  const tags = await generateImageDescription(signedUrl, promptToSave);
  // console.log('ai danbooru tags:', tags);
  const contentResult = await checkContent({
    title: '',
    description,
    prompts: [promptToSave],
    images: [signedUrl],
    personality,
    interests,
    introduction: intro,
  });

  // console.log('contentResult', contentResult);
  let isNsfw = false;
  if (
    contentResult?.toLowerCase() === 'illegal' ||
    contentResult?.toLowerCase() === 'nsfw'
  ) {
    isNsfw = true;
  }

  const characterData = {
    character_uniqid: uniqid,
    file_uniqid: fileUniqid,
    authUserId: userId,
    character_name: name,
    character_description: tags || description,
    character_pfp: signedUrl,
    age,
    profession,
    personality,
    interests,
    intro,
    gender,
    loras: requestData.loras || [],
    images: [],
    created_at: createdAt,
    prompt: promptToSave,
    is_public: !!is_public,
    is_nsfw: isNsfw,
  };

  const { error: insertError } = await supabase
    .from('CustomCharacters')
    .insert(characterData)
    .select();

  if (insertError) {
    throw new Error(`插入角色数据失败: ${insertError.message}`);
  }

  return {
    character_uniqid: uniqid,
    character_pfp: signedUrl,
    file_uniqid: fileUniqid,
    name,
    description,
  };
}

export async function handler(request: Request) {
  try {
    const requestData = await request.json();

    // 解析cookies获取用户ID
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Log in to create character' }),
        { status: 401 },
      );
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
    const isPublic = requestData?.is_public !== false;
    requestData.is_public = isPublic;
    if (!isPublic) {
      const isSubscribed = await isUserSubscribed(userId);
      let isCppUser = false;
      if (!isSubscribed) {
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('is_cpp')
          .eq('id', userId)
          .single();
        if (userError) {
          console.error('Error fetching user cpp status:', userError);
        }
        isCppUser = userData?.is_cpp || false;
      }
      if (!isSubscribed && !isCppUser) {
        return failedWithCode(
          ERROR_CODES.VIP_STYLE_REQUIRES_SUBSCRIPTION,
          'VIP style requires a subscription',
        );
      }
    }

    // 调用创建角色的逻辑
    const result = await createCharacterLogic(requestData, userId);
    waitUntil(
      trackServerEvent('character_created', userId as string, {
        character_name: result.name,
        character_pfp: result.character_pfp,
        character_uniqid: result.character_uniqid,
      }).catch(),
    );

    return new Response(JSON.stringify(result.character_uniqid), {
      status: 200,
    });
  } catch (error) {
    console.error('Error creating character:', error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : 'Failed to create character',
      }),
      { status: 500 },
    );
  }
}

export const POST = withHandler(handler, [
  authMiddleware,
  // benefitsHandler(TASK_TYPES.CHARACTER),
]);
