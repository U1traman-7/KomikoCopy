export async function GET(request:Request) {
  const url = request.url;
  const searchParams = new URL(url).searchParams;
  const convertUrl = decodeURIComponent(searchParams.get('url') ?? '');
  const videoUrl = `${convertUrl}&key=${process.env.GOOGLE_API_KEY}`;
  return fetch(videoUrl);
}
