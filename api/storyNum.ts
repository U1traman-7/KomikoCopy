import { createSupabase, failed, success } from "./_utils/index.js";

export const GET = async (req: Request) => {
  const supabase = createSupabase();
  const searchParams = new URL(req.url).searchParams;
  const tags = searchParams.get('tags')?.split(',') || [];
  const { count, error } = await supabase
    .from('AppPosts')
    .select('id', { count: 'exact', head: true }) // 使用 head: true 只获取计数
    .overlaps('tags', tags);
  if(error) {
    return failed('fetch story number error');
  }
  return success(count)
};
