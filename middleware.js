import { next } from '@vercel/edge';

export const config = {
  matcher: '/:path*',
};

// Map clean slugs under watch.risolvo.co.uk to YouTube video details
const VIDEOS = {
  '/sigfig/ep1': {
    id: '6u5QBmIT9wY',
    title: 'Significant Figures — GCSE Maths Walkthrough | Risolvo',
    description: 'Watch the step-by-step GCSE Maths walkthrough on Significant Figures on YouTube.',
  },
};

export default function middleware(request) {
  const url = new URL(request.url);
  const cleanPath = url.pathname.replace(/\/+$/, '') || '/';
  const ua = request.headers.get('user-agent') || '';

  const video = VIDEOS[cleanPath];
  if (!video) {
    return Response.redirect('https://www.youtube.com/@Risolvo', 302);
  }

  // 1. Social link-preview crawlers (Facebook, WhatsApp, X, LinkedIn) get Open Graph HTML
  if (/facebookexternalhit|Facebot|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot/i.test(ua)) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${video.title}</title>
  <meta property="og:type" content="video.other">
  <meta property="og:title" content="${video.title}">
  <meta property="og:description" content="${video.description}">
  <meta property="og:url" content="https://watch.risolvo.co.uk${cleanPath}">
  <meta property="og:image" content="https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg">
</head>
<body></body>
</html>`;
    return new Response(html, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  // 2. Android devices -> Server-side HTTP 302 to Android Intent URI
  if (/android/i.test(ua)) {
    const fallback = encodeURIComponent(`https://www.youtube.com/watch?v=${video.id}`);
    const intentUrl = `intent://www.youtube.com/watch?v=${video.id}#Intent;package=com.google.android.youtube;scheme=https;S.browser_fallback_url=${fallback};end`;
    return Response.redirect(intentUrl, 302);
  }

  // 3. iOS devices -> Pure server-side HTTP 302 (zero HTML, zero JavaScript)
  if (/iPhone|iPad|iPod/i.test(ua)) {
    const isMetaInApp = /FBAN|FBAV|Instagram/i.test(ua);

    if (isMetaInApp) {
      return Response.redirect(`youtube://www.youtube.com/watch?v=${video.id}`, 302);
    }

    return Response.redirect(`https://youtu.be/${video.id}`, 302);
  }

  // 4. Desktop browsers -> Server-side HTTP 302 to standard YouTube watch page
  return Response.redirect(`https://www.youtube.com/watch?v=${video.id}`, 302);
}
