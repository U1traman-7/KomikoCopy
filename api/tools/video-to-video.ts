/* eslint-disable */
import Replicate from "replicate";
import { CreditModel } from "../_models/credit.js";
import { getAuthUserId } from "./video-generation.js";
import { failed } from "../_utils/index.js";
import { calculateVideoToVideoGenerationCost } from "./_zaps.js";
import withHandler from "../_utils/withHandler.js";
import { authMiddleware } from "../_utils/middlewares/auth.js";
import { bindGenerationLogData, bindParamsMiddleware, canGenerateMiddleware, headerHandler, originMiddleware } from "../_utils/middlewares/index.js";
import { GenerationStatus, TASK_TYPES } from "../_constants.js";
import { tryGenerateHandler } from "../_utils/middlewares/tryGenerate.js";
import { translateMiddleware } from "../_utils/middlewares/translate.js";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const replicate = new Replicate({
    auth: process.env.REPLICATE_TEST_COG_COMFYUI_API_TOKEN
});

// Temporary type declaration to fix compilation
type RequestImproved<P = any> = Request & {
    params?: P;
    log?: {
        cost?: number;
        tool?: string;
        model?: string;
        generationResult?: 0 | 2 | 4;
    }
};

// 数据库操作函数
export interface VideoToVideoGeneration {
    id?: number;
    created_at?: string;
    video_url: string;
    tool: string;
    user_id: string;
    prompt: string;
    status?: number; // 0 = DONE, 1 = GENERATING
}

export interface PredictionVideoMapping {
    id?: number;
    prediction_id: string;
    video_url: string;
    user_id: string;
    created_at?: string;
}

export async function createPredictionVideoMapping(mapping: Omit<PredictionVideoMapping, 'id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('PredictionVideoMapping')
        .insert([mapping])
        .select();

    if (error) {
        console.error('Error inserting prediction video mapping:', error);
        return null;
    }

    return data;
}

// 根据 prediction_id 获取视频映射
export async function getPredictionVideoMapping(predictionId: string) {
    const { data, error } = await supabase
        .from('PredictionVideoMapping')
        .select('*')
        .eq('prediction_id', predictionId)
        .single();

    if (error) {
        console.error('Error fetching prediction video mapping:', error);
        return null;
    }

    return data;
}

// 删除 prediction 映射记录
export async function deletePredictionVideoMapping(predictionId: string) {
    const { data, error } = await supabase
        .from('PredictionVideoMapping')
        .delete()
        .eq('prediction_id', predictionId)
        .select();

    if (error) {
        console.error('Error deleting prediction video mapping:', error);
        return null;
    }

    return data;
}

// 创建视频数据
export async function createVideoToVideoGeneration(videoData: Omit<VideoToVideoGeneration, 'id' | 'created_at'>) {
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
        console.error('Error inserting video-to-video generation:', error);
        return null;
    }

    return data;
}

// 获取用户视频列表
export async function getVideoToVideosByUser(user_id: string) {
    const { data, error } = await supabase
        .from('VideoGeneration')
        .select('*')
        .eq('tool', 'video-to-video')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching video-to-video generations:', error);
        return null;
    }
    return data;
}

// 删除视频数据
export async function deleteVideoToVideoById(id: number, userId: string) {
    const { data, error } = await supabase
        .from('VideoGeneration')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .eq('tool', 'video-to-video')
        .select();

    if (error) {
        console.error('Error deleting video-to-video generation:', error);
        return null;
    }
    return data;
}

async function handler(request: RequestImproved) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
        // 1. Authentication
        const userId = await getAuthUserId(request);
        if (!userId) {
            console.log(`[${requestId}] Unauthorized request`);
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        console.log(`[${requestId}] Video-to-video request started for user: ${userId}`);

        // 读取并解析request body一次
        let parsedBody;
        try {
            // 检查是否已经有params（由middleware处理）
            if ((request as any).params) {
                parsedBody = (request as any).params;
            } else {
                const body = await request.text();
                parsedBody = JSON.parse(body);
            }
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
        }

        // 处理数据库操作方法
        if (parsedBody.method) {
            const { method, video_url, id, prompt } = parsedBody;
            console.log(`[${requestId}] VideoToVideo API - method: ${method}, user: ${userId}, video_url: ${video_url}, id: ${id}`);

            if (method === "getVideos") {
                // 获取视频列表并添加status字段
                const results = await getVideoToVideosByUser(userId);
                const videosData = results?.map(({ user_id, ...rest }) => ({
                    ...rest,
                    status: 0, // 所有从数据库获取的视频都标记为完成状态
                    width: 480,
                    height: 640
                }));
                return new Response(JSON.stringify({ data: videosData }), { status: 200 });

            } else if (method === "generateVideo") {
                // 创建视频记录
                const results = await createVideoToVideoGeneration({
                    video_url: video_url,
                    tool: 'video-to-video',
                    user_id: userId,
                    prompt: parsedBody.originalPrompt ?? (prompt || 'Video style transfer'),
                });
                const generateData = results?.map(({ user_id, ...rest }) => ({
                    ...rest,
                    status: 0, // 新创建的视频标记为完成状态
                    width: 480,
                    height: 640
                }));
                return new Response(JSON.stringify({ data: generateData }), { status: 200 });

            } else if (method === "deleteVideo") {
                // 删除视频
                const results = await deleteVideoToVideoById(id, userId);
                const deleteData = results?.map(({ user_id, ...rest }) => rest);
                return new Response(JSON.stringify({ data: deleteData }), { status: 200 });
            }

            return new Response(JSON.stringify({ error: 'Invalid method' }), { status: 400 });
        }

        return new Response(JSON.stringify({ error: 'Invalid method' }), { status: 400 });
    } catch (error: any) {
        console.error(`[${requestId}] Video-to-video error:`, error);
        return new Response(JSON.stringify({ error: error?.message || 'Failed to process video' }), { status: 500 });
    }
}

export const POST = withHandler(handler, [
    originMiddleware,
    authMiddleware,
    bindParamsMiddleware,
    translateMiddleware,
    tryGenerateHandler(TASK_TYPES.VIDEO),
]);
