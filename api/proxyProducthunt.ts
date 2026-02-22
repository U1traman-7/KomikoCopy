export const GET = async (request: Request) => {
  // const url = request.url;
  // // console.log(url, 'url');
  // const searchParams = new URL(url).searchParams;
  // const redirectUrl = searchParams.get('url');
  // if (!redirectUrl) {
  //   return new Response('No url provided', { status: 400 });
  // }
  // const realUrl = decodeURIComponent(redirectUrl);
  // console.log(realUrl, 'realUrl');
  // return fetch(realUrl);
  const result = await fetch(
    'https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=1001073&theme=light&period=daily&t=1756451476980',
  );
  const svg = await result.text();
  // console.log(svg);
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
};
