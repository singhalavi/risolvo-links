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

function interstitial(appUrl, webUrl, title) {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}
  a.btn{background:#f00;color:#fff;padding:16px 28px;border-radius:12px;font-size:18px;text-decoration:none;font-weight:600}
  a.alt{margin-top:20px;color:#555}
</style></head>
<body>
  <h3>${title}</h3>
  <a class="btn" id="open" href="${appUrl}">Open in YouTube</a>
  <a class="alt" href="${webUrl}">Watch in browser instead</a>
  <script>
    setTimeout(function(){ window.location.href = ${JSON.stringify(appUrl)}; }, 100);
  </script>
</body></html>`;
}

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

  const androidIntent =
    `intent://www.youtube.com/watch?v=${video.id}#Intent;package=com.google.android.youtube;scheme=https;` +
    `S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;
  const iosScheme = `youtube://www.youtube.com/watch?v=${video.id}`;

  // 2. In-app browsers (Facebook/Instagram): interstitial page with a tappable button
  if (isInApp && (isAndroid || isIOS)) {
    return new Response(
      interstitial(isAndroid ? androidIntent : iosScheme, webUrl, video.title),
      { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', ...noStore } }
    );
  }

  // 3. Regular mobile browsers: Android Chrome handles intent redirects; iOS Safari uses Universal Links
  if (isAndroid) return Response.redirect(androidIntent, 302);
  if (isIOS) return Response.redirect(`https://youtu.be/${video.id}`, 302);

  // 4. Desktop
  return Response.redirect(webUrl, 302);
}
