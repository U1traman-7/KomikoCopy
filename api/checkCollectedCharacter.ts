import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const character_uniqid = url.searchParams.get('character_uniqid');

        if (!character_uniqid) {
            return new Response(JSON.stringify({ 
                code: 0, 
                message: 'Character ID is required' 
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Parse cookies from the request headers
        const cookies = parse(request.headers.get('cookie') || '');
        const sessionToken = cookies['next-auth.session-token'];
        
        if (!sessionToken) {
            return new Response(JSON.stringify({ 
                code: 0, 
                message: 'Authentication required' 
            }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const token = await decode({ token: sessionToken, secret: process.env.NEXTAUTH_SECRET! });
        if (!token) {
            return new Response(JSON.stringify({ 
                code: 0, 
                message: 'Invalid login status' 
            }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const userId = token.id;

        // Check if character is collected by current user
        const { data: collectionData, error } = await supabase
            .from('CollectedCharacters')
            .select('id')
            .eq('user_id', userId)
            .eq('character_uniqid', character_uniqid)
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Error checking collection status:', error);
            return new Response(JSON.stringify({ 
                code: 0, 
                message: 'Failed to check collection status' 
            }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const isCollected = !!collectionData;

        return new Response(JSON.stringify({
            code: 1,
            data: {
                is_collected: isCollected
            }
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in checkCollectedCharacter:', error);
        return new Response(JSON.stringify({ 
            code: 0, 
            message: 'Internal server error' 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 