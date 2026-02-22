import { createSupabase, failed, failedWithCode, success, unauthorized } from "./_utils/index.js";
import { getAuthUserId } from "./tools/image-generation.js";
import { moderateImage } from "./_utils/moderation.js";
import { pushMessage } from "./message.js";
import { CONTENT_TYPES, BROAD_TYPES, ERROR_CODES } from "./_constants.js";

export const POST = async (req: Request) => {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return unauthorized('User not authenticated');
  }

  const supabase = createSupabase();
  const form = await req.formData().catch();
  if (!form) {
    return failed('Invalid request payload');
  }
  const imagePath = form.get('imagePath') as string;
  const file = form.get('file') as File;
  // const maxSizeInBytes = 2 * 1024 * 1024; // 2 MB size limit (adjust as needed)
  // if(file.size > maxSizeInBytes) {
  //   return failed('File size exceeds the maximum limit of 2 MB.');
  // }
  const shouldModerate =
    String(form.get('moderate') ?? '').toLowerCase() === '1' ||
    String(form.get('moderate') ?? '').toLowerCase() === 'true';
  const width = Number(form.get('width'));
  const height = Number(form.get('height'));

  if (!imagePath || !file) {
    return failed('Missing required fields');
  }

  const result = await supabase.storage.from("husbando-land").upload(imagePath, file);
  if (result?.error) {
    return failed('Failed to upload image');
  }

  const options = width && height ? {
    transform: {
      width,
      height,
    },
  } : {};
  let imageUrl = supabase
    .storage
    .from("husbando-land")
    .getPublicUrl(imagePath, options)
    .data
    .publicUrl;

  if (shouldModerate) {
    // 审核图片内容（仅对明确开启审核的调用方生效，避免影响其他通用上传场景）
    const moderationResult = await moderateImage(imageUrl);

    if (!moderationResult.approved) {
      // 审核不通过，删除刚上传的图片
      await supabase.storage.from("husbando-land").remove([imagePath]);

      // 发送失败通知
      pushMessage({
        content_type: CONTENT_TYPES.OFFICIAL,
        content_id: 0,
        host_content_id: 0,
        user_id: userId,
        broad_type: BROAD_TYPES.MESSAGE,
        payload: {
          version: 1,
          type: 'profile_moderation',
          action: 'avatar_rejected',
          reason: moderationResult.reason,
        },
      }, process.env.OFFICIAL_ACCOUNT_ID).catch((error) => {
        console.error('Failed to send rejection notification:', error);
      });

      const reason = moderationResult.reason ?? 'inappropriate_content';
      const prefix = 'moderation_error:';
      const details = reason.startsWith(prefix) ? reason.slice(prefix.length).trim() : undefined;
      const normalizedReason = reason.startsWith(prefix) ? 'moderation_error' : reason;

      return failedWithCode(ERROR_CODES.PROFILE_MODERATION_FAILED, 'Profile image rejected', {
        field: 'image',
        reason: normalizedReason,
        ...(details ? { details } : {}),
      });
    }

    // 审核通过，发送成功通知
    pushMessage({
      content_type: CONTENT_TYPES.OFFICIAL,
      content_id: 0,
      host_content_id: 0,
      user_id: userId,
      broad_type: BROAD_TYPES.MESSAGE,
      payload: {
        version: 1,
        type: 'profile_moderation',
        action: 'avatar_approved',
      },
    }, process.env.OFFICIAL_ACCOUNT_ID).catch((error) => {
      console.error('Failed to send approval notification:', error);
    });
  }

  return success(imageUrl);
};
