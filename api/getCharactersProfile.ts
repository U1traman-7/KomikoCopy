import { createClient } from "@supabase/supabase-js";
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';

export const GET = async (request: Request) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const url = new URL(request.url);
  const uniqids = url.searchParams.get('uniqids');
  const fields = url.searchParams.get('fields');

  // Get current user ID from session (optional - for permission checks)
  let currentUserId: string | null = null;
  try {
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];
    if (sessionToken) {
      const token = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      currentUserId = (token?.id as string) || null;
    }
  } catch (error) {
    // If session parsing fails, continue as anonymous user
    currentUserId = null;
  }

  const selectFields =
    fields === 'minimal'
      ? 'character_uniqid, character_name, character_pfp'
      : '*, User (user_name, image, user_uniqid)';

  const { data: characterData, error } = await supabase
    .from('CustomCharacters')
    .select(selectFields)
    .in('character_uniqid', uniqids?.split(',') || []);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  // Remove sensitive fields (prompt, character_description) for non-owners
  const sanitizedData = (characterData || []).map((char: any) => {
    const isOwner = currentUserId && char.authUserId === currentUserId;

    // If not the owner, remove sensitive prompt fields
    if (!isOwner) {
      const { prompt, character_description, ...rest } = char;
      return rest;
    }

    return char;
  });

  return new Response(JSON.stringify(sanitizedData), { status: 200 });
}
