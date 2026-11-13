import { next } from '@vercel/edge';

export const config = {
  // Run on all paths under watch.risolvo.co.uk
  matcher: '/:path*',
};

// Add future videos here: clean slug -> YouTube 11-char video ID
const VIDEOS = {
  '/sigfig/ep1': {
    id: '6u5QBmIT9wY',
    title: 'Significant Figures — GCSE Maths Walkthrough | Risolvo',
    description: 'Watch the step-by-step GCSE Maths walkthrough on Significant Figures on YouTube.',
  },
  // Example for future episodes:
  // '/sigfig/ep2': { id: 'NEXT_VIDEO_ID', title: '...', description: '...' },
};

export default function middleware(request) {
  const url = new URL(request.url);
  // Normalize trailing slashes so both /sigfig/ep1 and /sigfig/ep1/ match
  const cleanPath = url.pathname.replace(/\/+$/, '') || '/';
  const ua = request.headers.get('user-agent') || '';

  const video = VIDEOS[cleanPath];

  // Fallback to your main YouTube channel if someone visits watch.risolvo.co.uk/ or an unknown slug
  if (!video) {
    return Response.redirect('https://www.youtube.com/@Risolvo', 302);
  }

  // 1. Social link-preview bots (Facebook, WhatsApp, X, LinkedIn) get Open Graph HTML
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

  // 2. Android devices -> Server-side 302 to Android Intent URI
  if (/android/i.test(ua)) {
    const fallback = encodeURIComponent(`https://www.youtube.com/watch?v=${video.id}`);
    const intentUrl = `intent://www.youtube.com/watch?v=${video.id}#Intent;package=com.google.android.youtube;scheme=https;S.browser_fallback_url=${fallback};end`;
    return Response.redirect(intentUrl, 302);
  }

  // 3. iOS devices -> Server-side 302 to Apple Universal Link (youtu.be)
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return Response.redirect(`https://youtu.be/${video.id}`, 302);
  }

  // 4. Desktop browsers -> Standard YouTube watch page
  return Response.redirect(`https://www.youtube.com/watch?v=${video.id}`, 302);
}
