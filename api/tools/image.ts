import { failed, success } from "../_utils/index.js";
import { getHistoryImageUrl } from "../_utils/index.js";

export async function POST(request: Request) {
  let params;
  try {
    params = await request.json();
  }catch(e) {
    return failed('failed to parse params')
  }
  const { prompt_id, type } = params;
  const filename = await getHistoryImageUrl(prompt_id, type);

  return success({
    prompt_id,
    filename,
  })
}
