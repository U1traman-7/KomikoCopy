import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import { decode } from "next-auth/jwt";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(request: Request) {

    try {
        // Parse cookies from the request headers
        const cookies = parse(request.headers.get('cookie') || '');
        const sessionToken = cookies['next-auth.session-token'];
        if (!sessionToken) {
            return new Response(JSON.stringify({ error: 'Log in to generate images' }), { status: 401 });
        }
        const token = await decode({ token: sessionToken, secret: process.env.NEXTAUTH_SECRET! })
        if (!token) {
            return new Response(JSON.stringify({ error: 'Invalid login status' }), { status: 401 });
        }
        const authUserId = token.id
        const { data, error } = await supabase
            .from('User')
            .select("*")
            .eq('id', authUserId);

        if (error) {
            throw error;
        }
        if (data.length === 0) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }

        return new Response(JSON.stringify(data[0]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        if (error instanceof Error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ error: error }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}