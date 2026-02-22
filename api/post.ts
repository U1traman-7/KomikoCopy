import { ERROR_CODES } from './_constants.js';
import { createSupabase, failedWithCode, getAuthUserId } from './_utils/index.js';

export async function DELETE(request: Request) {
  const userId = await getAuthUserId(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return failedWithCode(ERROR_CODES.POST_ID_NEEDED, 'Invalid post id');
    }

    const supabase = createSupabase();

    const { error } = await supabase
      .from('AppPosts')
      .delete()
      .eq('id', id)
      .eq('authUserId', userId)
      .select();

    if (error) {
      console.error('Error deleting post:', error);
      return failedWithCode(ERROR_CODES.POST_DELETE_ERROR, 'Error deleting post');
    }

    return new Response(JSON.stringify({ message: 'Post deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error deleting post:', error);
    return failedWithCode(ERROR_CODES.POST_DELETE_ERROR, 'Error deleting post');
  }
}

