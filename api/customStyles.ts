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
  const sessionToken = cookies['next-auth.session-token'];
  if (!sessionToken) return null;

  const token = await decode({
    token: sessionToken,
    secret: process.env.NEXTAUTH_SECRET!,
  });
  return token?.id as string | null;
}

// GET - Fetch user's custom styles
export async function GET(request: Request) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
      });
    }

    const { data, error } = await supabase
      .from('user_custom_styles')
      .select('id, style, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching custom styles:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch styles' }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ styles: data.map(d => d.style) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in GET custom styles:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}

// POST - Add new custom style
export async function POST(request: Request) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
      });
    }

    const { style } = await request.json();

    if (!style || typeof style !== 'string') {
      return new Response(JSON.stringify({ error: 'Style is required' }), {
        status: 400,
      });
    }

    const trimmedStyle = style.trim();
    if (trimmedStyle.length > 100) {
      return new Response(JSON.stringify({ error: 'Style too long (max 100 chars)' }), {
        status: 400,
      });
    }

    const { data, error } = await supabase
      .from('user_custom_styles')
      .insert({ user_id: userId, style: trimmedStyle })
      .select('style')
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return new Response(JSON.stringify({ error: 'Style already exists' }), {
          status: 409,
        });
      }
      console.error('Error adding custom style:', error);
      return new Response(JSON.stringify({ error: 'Failed to add style' }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ style: data.style }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in POST custom styles:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}

// PUT - Update a custom style
export async function PUT(request: Request) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
      });
    }

    const { oldStyle, newStyle } = await request.json();

    if (!oldStyle || typeof oldStyle !== 'string') {
      return new Response(JSON.stringify({ error: 'Old style is required' }), {
        status: 400,
      });
    }

    if (!newStyle || typeof newStyle !== 'string') {
      return new Response(JSON.stringify({ error: 'New style is required' }), {
        status: 400,
      });
    }

    const trimmedNewStyle = newStyle.trim();
    if (trimmedNewStyle.length > 100) {
      return new Response(JSON.stringify({ error: 'Style too long (max 100 chars)' }), {
        status: 400,
      });
    }

    const { data, error } = await supabase
      .from('user_custom_styles')
      .update({ style: trimmedNewStyle, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('style', oldStyle)
      .select('style')
      .single();

    if (error) {
      if (error.code === '23505') {
        return new Response(JSON.stringify({ error: 'Style already exists' }), {
          status: 409,
        });
      }
      console.error('Error updating custom style:', error);
      return new Response(JSON.stringify({ error: 'Failed to update style' }), {
        status: 500,
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Style not found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ style: data.style }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in PUT custom styles:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}

// DELETE - Remove a custom style
export async function DELETE(request: Request) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
      });
    }

    const { style } = await request.json();

    if (!style || typeof style !== 'string') {
      return new Response(JSON.stringify({ error: 'Style is required' }), {
        status: 400,
      });
    }

    const { error } = await supabase
      .from('user_custom_styles')
      .delete()
      .eq('user_id', userId)
      .eq('style', style);

    if (error) {
      console.error('Error deleting custom style:', error);
      return new Response(JSON.stringify({ error: 'Failed to delete style' }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in DELETE custom styles:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}

