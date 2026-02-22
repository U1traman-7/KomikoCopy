import { createClient } from '@supabase/supabase-js';
import { PostgrestQueryBuilder, PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { parse } from 'cookie';
import { decode } from "next-auth/jwt"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);


interface Character {
    id: number;
    authUserId: string;
    character_uniqid: string;
    created_at: string;
    character_name: string;
    character_description: string;
    file_uniqid: string;
    age: string;
    profession: string;
    personality: string;
    interests: string;
    intro: string;
    character_pfp: string;
    rizz: number;
    num_adopt: number;
}

interface User {
    id: number;
    authUserId: string;
    user_name: string;
    user_uniqid: string;
    image: string;
    followed: boolean;
    post_likes: number;
}

export async function GET(request: Request) {

    //! FETCH AUTHID
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];
    let auth_user_id = '' as string;
    if (!sessionToken) {
        // return new Response(JSON.stringify({ error: 'Log in to generate images' }), { status: 401 });
        auth_user_id = '' as string;
    } else {
        try {
            const token = await decode({ token: sessionToken, secret: process.env.NEXTAUTH_SECRET! })
            if (!token) {
                auth_user_id = '' as string;
            }
            else {
                auth_user_id = token.id as string;
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            auth_user_id = '' as string;
        }
    }
    console.log('fetching leaderboard:', auth_user_id);

    //! PAGINATION
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = 10;
    const offset = (page - 1) * limit;
    const sortby = url.searchParams.get('sortby') || 'All Time';
    const board = url.searchParams.get('board') || 'character';
    console.log(sortby);

    //! FILTER DB
    if (board == "character") {
        let feedQuery: PostgrestFilterBuilder<any, any, any[], 'CustomCharacters', unknown> = supabase.from('CustomCharacters').select();

        if (sortby == 'All Time') {
            feedQuery = supabase
                .from('CustomCharacters')
                .select()
                .gt('num_gen', 0)
                .eq('is_public', true)
                .order('num_gen', { ascending: false })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

        } else if (sortby == 'Most Likes') {
            feedQuery = supabase
                .from('CustomCharacters')
                .select()
                .order('num_adopt', { ascending: false })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

        } else {
            feedQuery = supabase
                .from('CustomCharacters')
                .select()
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)
        }

        const { data: postsData, error: postsError } = await feedQuery.returns<Character[]>();

        if (postsError) { return new Response(JSON.stringify({ error: postsError.message }), { status: 500 }); }
        if (postsData.length === 0) { return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }); }
        return new Response(JSON.stringify(postsData), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } else {

        let feedQuery: PostgrestFilterBuilder<any, any, any[], 'User', unknown> = supabase.from('User').select();

        if (sortby == 'All Time') {
            feedQuery = supabase
                .from('User')
                .select()
                .gt('post_likes', 0)
                .order('post_likes', { ascending: false })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

        } else if (sortby == 'Most Likes') {
            feedQuery = supabase
                .from('User')
                .select()
                .gt('post_likes', 0)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

        } else {
            feedQuery = supabase
                .from('User')
                .select()
                .gt('post_likes', 0)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)
        }

        const { data: userData, error: userError } = await feedQuery.returns<User[]>();

        if (userError) { return new Response(JSON.stringify({ error: userError.message }), { status: 500 }); }
        if (userData.length === 0) { return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }); }

        //! FETCH FOLLOW DATA
        const userIds = userData.map(post => post.id);
        const { data: followData, error: followError } = await supabase
            .from('AppFollows')
            .select('follower, following')
            .in('following', userIds)
            .in('follower', [auth_user_id])
            .returns<{ follower: string, following: string }[]>();

        if (followError) { return new Response(JSON.stringify({ error: followError.message }), { status: 500 }); }

        const followMap = followData?.reduce<{ [key: string]: boolean }>((acc, follow) => {
            acc[follow.following] = true;
            return acc;
        }, {}) || {};
        console.log(followMap);
        const responseData = userData.map(post => ({
            ...post,
            followed: followMap[post.id] || false,
        }));

        return new Response(JSON.stringify(responseData), { status: 200, headers: { 'Content-Type': 'application/json' } });

    }
}