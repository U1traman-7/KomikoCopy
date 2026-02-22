/*
 * @Author: kavinbj kwfelix@163.com
 * @Date: 2024-12-09 15:48:01
 * @LastEditors: kavinbj kwfelix@163.com
 * @LastEditTime: 2024-12-10 00:01:06
 * @FilePath: /ComicEditor/api/tools/video-generation.ts
 * @Description:
 *
 * app/
 *   api/
 *     tools/
 *       image-generation.ts
 *       video-generation.ts
 *       video-upscale.ts
 */


import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

import { parse } from 'cookie';
import { decode } from "next-auth/jwt"


export interface VideoGeneration {
    id?: number;
    created_at?: string;
    video_url: string;
    tool: string;
    user_id: string;
    prompt: string;
}
// 获取用户id
export async function getAuthUserId(request: Request): Promise<string | null> {
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];

    if (!sessionToken) {
        return null;
    }

    try {
        const token = await decode({ token: sessionToken, secret: process.env.NEXTAUTH_SECRET! })
        if (!token) {
            return null;
        }
        return token.id as string;
    } catch (error) {
        console.error('Error decoding session token:', error);
        return null;
    }
}

// 创建视频数据
export async function createVideoGeneration(videoData: Omit<VideoGeneration, 'id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('VideoGeneration')
        .insert([
            {
                video_url: videoData.video_url,
                tool: videoData.tool,
                user_id: videoData.user_id,
                prompt: videoData.prompt,
            }
        ])
        .select();

    if (error) {
        console.error('Error inserting video generation:', error);
        return null;
    }

    return data;
}

// 获取用户视频列表
export async function getVideosByTool(tool: string, user_id: string) {
    const { data, error } = await supabase
        .from('VideoGeneration')
        .select('*')
        .eq('tool', tool)
        .eq('user_id', user_id)
        .order('created_at', { ascending: false }) // 按照 created_at 降序排序
        .limit(10); // 限制返回的记录数为 10

    if (error) {
        console.error('Error fetching video generations:', error);
        return null;
    }
    return data;
}

// 删除视频数据
export async function deleteVideoGenerationById(id: number, userId: string, tool: string) {
    const { data, error } = await supabase
        .from('VideoGeneration')
        .delete()
        .eq('id', id)
        .eq('user_id', userId) // 确保 user_id 匹配
        .eq('tool', tool) // 确保 tool 匹配
        .select(); // 添加这行来返回删除的记录

    if (error) {
        console.error('Error deleting video generation:', error);
        return null;
    }
    return data;
}


export async function POST(request: Request) {
   // 获取用户id
   const authUserId = await getAuthUserId(request);
   if (!authUserId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
   }

   try {
    let { method, tool, video_url, id, prompt} = await request.json();
    console.log("method", method, "video_url", video_url, "id", id);
    if (method == "getVideos") { // 依据 user_id 和 tool 获取视频列表
        const results = await getVideosByTool(tool, authUserId);
        const videosData = results?.map(({ user_id, ...rest }) => rest);
        return new Response(JSON.stringify({ data: videosData }), { status: 200 });
    } else if (method == "generateVideo") { // 依据 user_id 和 tool  video_url 创建视频
        const results = await createVideoGeneration({
            video_url: video_url,
            tool: tool,
            user_id: authUserId,
            prompt,
        });
        const generateData = results?.map(({ user_id, ...rest }) => rest);
        return new Response(JSON.stringify({ data: generateData}), { status: 200 });
    } else if (method == "deleteVideo") { // 依据 user_id ， tool，  video_url， id 删除视频
        const results = await deleteVideoGenerationById(id, authUserId, tool);
        const deleteData = results?.map(({ user_id, ...rest }) => rest);
        return new Response(JSON.stringify({ data: deleteData }), { status: 200 });
    }

   } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 500 });
   }

}
