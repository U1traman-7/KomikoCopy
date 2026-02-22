import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  let country =
    request.headers.get('CF-IPCountry') || request.geo?.country || '';
  // const referer = request.headers.get('referer') || '';
  if (!country) {
    country = request.headers.get('x-vercel-ip-country') || '';
  }
  console.log('country', country);

  const hostname = request.nextUrl.hostname;
  const pathname = request.nextUrl.pathname;
  const isJapaneseCountry = country === 'JP' || country === 'KR';
  // 从 komikoai.com 访问，且不是日韩用户，跳转到 komiko.app
  if (hostname === 'komikoai.com' && !isJapaneseCountry) {
    const newPathname = pathname === '/home' ? '/' : pathname;
    return NextResponse.redirect(`https://komiko.app${newPathname}`, 301);
  }

  // 从 komiko.app 访问，且是日韩用户，跳转到 komikoai.com
  if (hostname === 'komiko.app' && isJapaneseCountry) {
    const newPathname = pathname === '/home' ? '/' : pathname;
    return NextResponse.redirect(`https://komikoai.com${newPathname}`, 301);
  }

  if (pathname === '/home') {
    return NextResponse.redirect(`${request.nextUrl.origin}`, 301);
  }

  return NextResponse.next();
}

export const config = {
  // matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)', // 拦截所有页面，排除API和静态资源
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|images/.*).*)',
  ],
};
