import { serverUrl } from "../tools/_constants.js";

export async function GET(request:Request) {
  const url = request.url;
  const searchParams = new URL(url).searchParams;
  const filename = searchParams.get('filename');
  const imageUrl = `${serverUrl}/view?filename=${filename}&type=temp`;
  return fetch(imageUrl);
}
