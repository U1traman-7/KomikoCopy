import { createSupabase, failed, success, unauthorized } from "./_utils/index.js";
import { authMiddleware } from "./_utils/middlewares/index.js";
import withHandler from "./_utils/withHandler.js"


const handler = async (request:Request) => {
  const supabase = createSupabase();
  const userId = request.headers.get('x-user-id');
  if(!userId) {
    return unauthorized('Unauthorized');
  }
  const { data: user, error: userError } = await supabase
    .from('User')
    .select('invite_code')
    .eq('id', userId)
    .single();
  if(userError) {
    console.error(userError);
    return failed('Failed to fetch user');
  }
  if(!user.invite_code) {
    console.error('User has no invite code');
    return failed('User has no invite code');
  }

  const { data: invitation, error: invitationError } = await supabase
  .from('User')
  .select('user_name, email')
  .eq('ref_code', user.invite_code)
  if(invitationError) {
    console.error(invitationError);
    return failed('Failed to fetch invitation');
  }
  if(!invitation) {
    console.error('invitation not found');
    return failed('Invitation not found');
  }

  return success(invitation);
}

export const GET = withHandler(handler, [
  authMiddleware
])
