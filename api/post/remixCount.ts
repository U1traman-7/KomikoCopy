import { createSupabase, failed, success } from '../_utils/index.js';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const postId = Number(url.searchParams.get('post_id'));
    if (!postId || Number.isNaN(postId)) {
      return failed('Invalid post_id');
    }

    const supabase = createSupabase();

    const { data: existing, error: existingError } = await supabase
      .from('post_remix_count')
      .select('remix_count')
      .eq('post_id', postId)
      .maybeSingle();

    if (existingError) {
      console.error('Error fetching remix count:', existingError);
      return failed('Failed to fetch remix count');
    }

    return success({
      post_id: postId,
      remix_count: existing?.remix_count ?? 0,
    });
  } catch (error) {
    console.error('Error fetching remix count:', error);
    return failed('Failed to fetch remix count');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const postId = Number(body?.post_id);
    if (!postId || Number.isNaN(postId)) {
      return failed('Invalid post_id');
    }

    const supabase = createSupabase();

    const { data: existing, error: existingError } = await supabase
      .from('post_remix_count')
      .select('remix_count')
      .eq('post_id', postId)
      .maybeSingle();

    if (existingError) {
      console.error('Error fetching remix count:', existingError);
      return failed('Failed to fetch remix count');
    }

    if (!existing) {
      const { data: insertData, error: insertError } = await supabase
        .from('post_remix_count')
        .insert({ post_id: postId, remix_count: 1 })
        .select('remix_count')
        .single();

      if (insertError) {
        console.error('Error creating remix count:', insertError);
        return failed('Failed to update remix count');
      }

      return success({
        post_id: postId,
        remix_count: insertData?.remix_count ?? 1,
      });
    }

    const nextCount = (existing.remix_count ?? 0) + 1;
    const { data: updateData, error: updateError } = await supabase
      .from('post_remix_count')
      .update({ remix_count: nextCount })
      .eq('post_id', postId)
      .select('remix_count')
      .single();

    if (updateError) {
      console.error('Error updating remix count:', updateError);
      return failed('Failed to update remix count');
    }

    return success({
      post_id: postId,
      remix_count: updateData?.remix_count ?? nextCount,
    });
  } catch (error) {
    console.error('Error updating remix count:', error);
    return failed('Failed to update remix count');
  }
}
