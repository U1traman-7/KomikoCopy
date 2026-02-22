import { createSupabase, failed, success, unauthorized } from "./_utils/index.js";
import { getAuthUserId } from "./tools/image-generation.js";

export const POST = async (req: Request) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    return unauthorized('User not authenticated');
  }

  const supabase = createSupabase();
  const form = await req.formData().catch();
  if (!form) {
    return failed('Invalid request payload');
  }
  const videoPath = form.get('path') as string;
  const file = form.get('file') as File;

  if (!videoPath || !file) {
    return failed('Missing required fields');
  }

  const result = await supabase.storage.from("husbando-land").upload(videoPath, file, {
    cacheControl: '3600', // 缓存控制
    contentType: 'video/mp4' // 明确指定内容类型
  });
  if (result?.error) {
    return failed('Failed to upload video');
  }

  let url = supabase
    .storage
    .from("husbando-land")
    .getPublicUrl(videoPath)
    .data
    .publicUrl;
  return success(url);
};
