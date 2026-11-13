import { next } from '@vercel/edge';

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

export default function middleware(request) {
  const url = new URL(request.url);
  const cleanPath = url.pathname.replace(/\/+$/, '') || '/';
  const ua = request.headers.get('user-agent') || '';

  const video = VIDEOS[cleanPath];
  if (!video) {
    return Response.redirect('https://www.youtube.com/@Risolvo', 302);
  }

  // 1. Social link-preview crawlers get Open Graph HTML
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

  // 3. iOS devices: split Meta In-App Browser (FBAN/FBAV/Instagram) from regular Safari/Chrome
  if (/iPhone|iPad|iPod/i.test(ua)) {
    const isMetaInApp = /FBAN|FBAV|Instagram/i.test(ua);

    if (isMetaInApp) {
      // Meta's iOS WKWebView intercepts 302 https://youtu.be internally;
      // serve a zero-render custom-scheme launch + m.youtube.com fallback for users without the app
      const inAppHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Opening YouTube…</title>
  <script>
    window.location.href = "youtube://www.youtube.com/watch?v=${video.id}";
    setTimeout(function() {
      if (!document.hidden) {
        window.location.replace("https://m.youtube.com/watch?v=${video.id}");
      }
    }, 1500);
  </script>
</head>
<body style="font-family:-apple-system,sans-serif;text-align:center;padding:48px 20px;">
  <p>Opening YouTube…</p>
  <p><a href="youtube://www.youtube.com/watch?v=${video.id}">Tap here to open in YouTube</a></p>
</body>
</html>`;
      return new Response(inAppHtml, {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
        },
      });
    }

    // Standard iOS Safari / Chrome -> Direct 302 to Apple Universal Link
    return Response.redirect(`https://youtu.be/${video.id}`, 302);
  }

  // 4. Desktop browsers -> Standard YouTube watch page
  return Response.redirect(`https://www.youtube.com/watch?v=${video.id}`, 302);
}
