/*
 * @Author: kavinbj kwfelix@163.com
 * @Date: 2024-12-10 22:35:02
 * @LastEditors: kavinbj kwfelix@163.com
 * @LastEditTime: 2024-12-10 23:15:35
 * @FilePath: /ComicEditor/api/tools/image-generation.ts
 * @Description:
 *
 *
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';

export interface ImageGeneration {
  id?: number;
  created_at?: string;
  prompt?: string;
  model?: string;
  url_path: string;
  tool: string;
  user_id: string;
  meta_data?: string;
}

// 获取用户id
export async function getAuthUserId(request: Request): Promise<string | null> {
  const cookies = parse(request.headers.get('cookie') || '');
  const sessionToken = cookies['next-auth.session-token'];

  if (!sessionToken) {
    return null;
  }

  try {
    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });
    if (!token) {
      return null;
    }
    return token.id as string;
  } catch (error) {
    console.error('Error decoding session token:', error);
    return null;
  }
}

// 创建图片数据
export async function createImageGeneration(
  imageData: Omit<ImageGeneration, 'id' | 'created_at'>,
) {
  const { data, error } = await supabase
    .from('ImageGeneration')
    .insert([
      {
        url_path: imageData.url_path,
        tool: imageData.tool,
        user_id: imageData.user_id,
        prompt: imageData.prompt,
        model: imageData.model,
        meta_data: imageData.meta_data,
      },
    ])
    .select();

  if (error) {
    console.error('Error inserting image generation:', error);
    return null;
  }
  return data;
}

// 获取用户图片列表
export async function getImagesByTool(
  tool: string,
  user_id: string,
  pageNo: number = 1,
  pageSize: number = 10,
) {
  const { data, error } = await supabase
    .from('ImageGeneration')
    .select('*')
    .eq('tool', tool)
    .eq('user_id', user_id)
    .order('created_at', { ascending: false }) // 按照 created_at 降序排序
    .limit(pageSize) // 限制返回的记录数为 10
    .range((pageNo - 1) * pageSize, pageNo * pageSize - 1); // 设置偏移量和限制

  if (error) {
    console.error('Error fetching image generations:', error);
    return null;
  }
  return data;
}

// 删除图片数据
export async function deleteImageGenerationById(
  id: number,
  userId: string,
  tool: string,
) {
  const { data, error } = await supabase
    .from('ImageGeneration')
    .delete()
    .eq('id', id)
    .eq('user_id', userId) // 确保 user_id 匹配
    // .eq('tool', tool) // 确保 tool 匹配
    .select(); // 添加这行来返回删除的记录

  if (error) {
    console.error('Error deleting image generation:', error);
    return null;
  }
  return data;
}

export async function POST(request: Request) {
  // 获取用户id
  const authUserId = await getAuthUserId(request);
  if (!authUserId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  try {
    const {
      method,
      tool,
      url_path,
      id,
      prompt,
      model,
      pageNo,
      pageSize,
      meta_data,
    } = await request.json();
    console.log('method', method, 'url_path', url_path, 'id', id);
    if (method === 'getImages') {
      // 依据 user_id 和 tool 获取视频列表
      const results = await getImagesByTool(tool, authUserId, pageNo, pageSize);
      const imagesData = results?.map(({ user_id, ...rest }) => rest);
      //  console.log("imagesData", imagesData);
      return new Response(JSON.stringify({ data: imagesData }), {
        status: 200,
      });
    }
    if (method === 'generateImage') {
      // 依据 user_id 和 tool  url_path 创建视频
      const results = await createImageGeneration({
        url_path,
        tool,
        user_id: authUserId,
        prompt,
        model,
        meta_data: meta_data ?? null,
      });
      const generateData = results?.map(({ user_id, ...rest }) => rest);
      console.log('generateData', generateData);
      return new Response(JSON.stringify({ data: generateData }), {
        status: 200,
      });
    }
    if (method == 'deleteImage') {
      // 依据 user_id ， tool，  url_path id 删除视频
      const results = await deleteImageGenerationById(id, authUserId, tool);
      const deleteData = results?.map(({ user_id, ...rest }) => rest);
      console.log('deleteData', deleteData);
      return new Response(JSON.stringify({ data: deleteData }), {
        status: 200,
      });
    }
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 500,
    });
  }
}
