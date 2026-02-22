import { createSupabase, failed, success, unauthorized } from "./_utils/index.js";
import { getAuthUserId } from "./tools/image-generation.js";

export const POST = async (req: Request) => {
  const userId = await getAuthUserId(req).catch();

  if (!userId) {
    return unauthorized('User not authenticated');
  }
  const supabase = createSupabase();
  const params = await req.json().catch();
  if (!params) {
    return failed('Invalid request payload');
  }

  const { title, description, story, criteria = '', rule = '', cover } = params
  if (!title || !description || !story || !cover) {
    return failed('fields are missing');
  }

  const { error } = await supabase
    .from('Worlds')
    .insert([
      { title, description, story, criteria, rule, authorId: userId, numPlayers: 0, cover },
    ])
    .select();

  if(error) {
    return failed('Error creating world');
  }
  return success('World created');

};
