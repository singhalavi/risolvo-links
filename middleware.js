export const config = {
  matcher: '/:path*',
};

const VIDEOS = {
  '/sigfig/ep1': {
    id: '6u5QBmIT9wY',
    title: 'Significant Figures — GCSE Maths Walkthrough | Risolvo',
    description: 'Watch the step-by-step GCSE Maths walkthrough on Significant Figures on YouTube.',
  },
};

const noStore = { 'cache-control': 'no-store', vary: 'user-agent' };

export default function middleware(request) {
  const url = new URL(request.url);
  const cleanPath = url.pathname.replace(/\/+$/, '') || '/';
  const ua = request.headers.get('user-agent') || '';

  const video = VIDEOS[cleanPath];
  if (!video) {
    return Response.redirect('https://www.youtube.com/@Risolvo', 302);
  }

  const webUrl = `https://www.youtube.com/watch?v=${video.id}`;

  // 1. Link-preview crawlers get OG tags
  if (/facebookexternalhit|Facebot|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot/i.test(ua)) {
    const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<title>${video.title}</title>
<meta property="og:type" content="video.other">
<meta property="og:title" content="${video.title}">
<meta property="og:description" content="${video.description}">
<meta property="og:url" content="https://watch.risolvo.co.uk${cleanPath}">
<meta property="og:image" content="https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg">
</head><body></body></html>`;
    return new Response(html, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8', ...noStore },
    });
  }

  const isAndroid = /android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isInApp = /FBAN|FBAV|FB_IAB|FB4A|Instagram/i.test(ua);

  // 2. In-app browsers: plain https lets Meta hand off to the YouTube app
  if (isInApp &&
