import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import { decode } from "next-auth/jwt";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function DELETE(request: Request) {
    try {
        // 获取用户认证信息
        const cookies = parse(request.headers.get('cookie') || '');
        const sessionToken = cookies['next-auth.session-token'];
        let auth_user_id = '' as string;
        
        if (!sessionToken) {
            return new Response(JSON.stringify({ error: 'Log in to continue' }), { status: 401 });
        }

        const token = await decode({ token: sessionToken, secret: process.env.NEXTAUTH_SECRET! });
        if (!token) {
            return new Response(JSON.stringify({ error: 'Log in to continue' }), { status: 401 });
        }
        
        auth_user_id = token.id as string;

        // 获取视频ID
        const url = new URL(request.url);
        const videoId = url.searchParams.get('id');
        
        if (!videoId) {
            return new Response(JSON.stringify({ error: 'Video ID is required' }), { status: 400 });
        }

        // 首先验证视频是否属于当前用户
        const { data: videoData, error: fetchError } = await supabase
            .from('VideoGeneration')
            .select('user_id')
            .eq('id', videoId)
            .single();

        if (fetchError) {
            return new Response(JSON.stringify({ error: 'Video not found' }), { status: 404 });
        }

        if (videoData.user_id !== auth_user_id) {
            return new Response(JSON.stringify({ error: 'Unauthorized to delete this video' }), { status: 403 });
        }

        // 删除视频记录
        const { error: deleteError } = await supabase
            .from('VideoGeneration')
            .delete()
            .eq('id', videoId)
            .eq('user_id', auth_user_id); // 双重安全检查

        if (deleteError) {
            console.error('Error deleting video:', deleteError);
            return new Response(JSON.stringify({ error: 'Failed to delete video' }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true, message: 'Video deleted successfully' }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in deleteVideo API:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
} 