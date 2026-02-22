import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Helper to get userId from request
async function getUserId(request: Request): Promise<string | null> {
  const cookies = parse(request.headers.get('cookie') || '');
  const sessionToken =
    cookies['next-auth.session-token'] ||
    cookies['__Secure-next-auth.session-token'];
  if (!sessionToken) return null;

  const token = await decode({
    token: sessionToken,
    secret: process.env.NEXTAUTH_SECRET!,
  });
  return token?.id as string | null;
}

// GET - Fetch user's favorite style IDs
export async function GET(request: Request) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
      });
    }

    const { data, error } = await supabase
      .from('user_favorite_styles')
      .select('style_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorite styles:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch favorites' }), {
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({ favorites: data.map(d => ({ style_id: d.style_id })) }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in GET favorite styles:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}

// POST - Add a favorite style
export async function POST(request: Request) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
      });
    }

    const { styleId } = await request.json();

    if (!styleId || typeof styleId !== 'string') {
      return new Response(JSON.stringify({ error: 'styleId is required' }), {
        status: 400,
      });
    }

    const trimmedStyleId = styleId.trim();
    if (trimmedStyleId.length > 50) {
      return new Response(
        JSON.stringify({ error: 'styleId too long (max 50 chars)' }),
        { status: 400 },
      );
    }

    const VALID_STYLE_ID_REGEX = /^[\w\[\]\-\.\s\(\)]+$/;
    if (!VALID_STYLE_ID_REGEX.test(trimmedStyleId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid styleId format' }),
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from('user_favorite_styles')
      .insert({ user_id: userId, style_id: trimmedStyleId });

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation - already favorited
        return new Response(JSON.stringify({ error: 'Style already favorited' }), {
          status: 409,
        });
      }
      console.error('Error adding favorite style:', error);
      return new Response(JSON.stringify({ error: 'Failed to add favorite' }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in POST favorite styles:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}

// DELETE - Remove a favorite style
export async function DELETE(request: Request) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
      });
    }

    const { styleId } = await request.json();

    if (!styleId || typeof styleId !== 'string') {
      return new Response(JSON.stringify({ error: 'styleId is required' }), {
        status: 400,
      });
    }

    const trimmedDeleteStyleId = styleId.trim();
    if (trimmedDeleteStyleId.length > 50) {
      return new Response(
        JSON.stringify({ error: 'styleId too long (max 50 chars)' }),
        { status: 400 },
      );
    }

    const VALID_STYLE_ID_REGEX = /^[\w\[\]\-\.\s\(\)]+$/;
    if (!VALID_STYLE_ID_REGEX.test(trimmedDeleteStyleId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid styleId format' }),
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from('user_favorite_styles')
      .delete()
      .eq('user_id', userId)
      .eq('style_id', trimmedDeleteStyleId);

    if (error) {
      console.error('Error deleting favorite style:', error);
      return new Response(JSON.stringify({ error: 'Failed to remove favorite' }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in DELETE favorite styles:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}
