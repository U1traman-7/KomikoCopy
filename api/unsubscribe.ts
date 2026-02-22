import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return new Response('Missing email', { status: 400 });
  }

  const { data, error } = await supabase
    .from('User')
    .update({ unsubscribe: true })
    .eq('email', email)
    .select();

  if (error) {
    return new Response(`Error updating: ${error.message}`, { status: 500 });
  }

  if (!data || data.length === 0) {
    return new Response('User not found', { status: 404 });
  }

  return new Response(
    `
    <html>
      <body style="font-family: sans-serif; padding: 2rem; text-align: center;">
        <h2>You have been unsubscribed.</h2>
        <p>You will no longer receive emails from KomikoAI.</p>
      </body>
    </html>
  `,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    },
  );
}
