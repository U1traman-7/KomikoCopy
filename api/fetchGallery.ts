import { createClient } from '@supabase/supabase-js';
import { PostgrestQueryBuilder, PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { parse } from 'cookie';
import { decode } from "next-auth/jwt"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define the types for the post and user data

interface Generation {
    post_id: number;
    image_id: number;
    image_created_at: Date;
    prompt: string;
    model: string;
    url_path: string
}

type MediaType = 'image' | 'video' | 'all';

export async function GET(request: Request) {

    //! FETCH AUTHID
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];
    let auth_user_id = '' as string;
    if (!sessionToken) {
        return new Response(JSON.stringify({ error: 'Log in to continue' }), { status: 401 });
    } else {
        try {
            const token = await decode({ token: sessionToken, secret: process.env.NEXTAUTH_SECRET! })
            if (!token) {
                return new Response(JSON.stringify({ error: 'Log in to continue' }), { status: 401 });
            }
            else {
                auth_user_id = token.id as string;
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            return new Response(JSON.stringify({ error: 'Log in to continue' }), { status: 401 });
        }
    }

    //! PAGINATION
    const itemsPerPage = 10;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = itemsPerPage;
    const offset = (page - 1) * limit;
    const mediaType = (url.searchParams.get('mediaType') || 'image') as MediaType;

    console.log(`fetching ${mediaType} gallery for user:`, auth_user_id);

    // 根据媒体类型获取不同数据
    if (mediaType === 'video') {
        const { data: imagesData, error: imagesError } = await supabase
            .from('VideoGeneration')
            .select()
            .eq('user_id', auth_user_id)
            .not('video_url', 'is', null)
            .neq('video_url', '')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (imagesError) {
            return new Response(JSON.stringify({ error: imagesError.message }), { status: 500 });
        }

        return new Response(JSON.stringify(imagesData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } else {
        const { data: imagesData, error: imagesError } = await supabase
            .from('ImageGeneration')
            .select()
            .eq('user_id', auth_user_id)
            .not('url_path', 'is', null)
            .neq('url_path', '')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (imagesError) {
            return new Response(JSON.stringify({ error: imagesError.message }), { status: 500 });
        }

        return new Response(JSON.stringify(imagesData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}