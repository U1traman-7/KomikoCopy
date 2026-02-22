import { createClient } from "@supabase/supabase-js";
import { parse } from "cookie";

export const GET = async (request: Request) => {

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    let { data: Worlds, error } = await supabase
      .from('Worlds')
      .select(`*, User (
          user_name
        )`)
      .order("numPlayers", { ascending: false, nullsFirst: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify(Worlds), { status: 200 });
  } catch (error) {
    console.error('Error fetching worlds:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch worlds' }), { status: 500 });
  }
};

