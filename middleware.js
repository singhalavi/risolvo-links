export const config = {
  matcher: '/:path*',
};

const VIDEOS = {
  '/sigfig/ep1': {
    // 1. Meta In-App Browser (FBAN / FBAV / Instagram) -> Significant Figures
    metaAppId: '6u5QBmIT9wY',
    // 1b. Meta In-App Browser Fallback Timer -> Estimation
    metaFallbackId: 'hYG_I-CgfLQ',
    // 2. Standard iOS Safari / Chrome -> Significant Figures: The Trailing Zero Problem
    iosSafariId: '8qr8mw7VwcM',
    // 3. Desktop / Other -> Error Intervals
    desktopId: 'gQrNCJL3bvc',
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

  // 0. Social link-preview crawlers get Open Graph HTML
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
  <meta property="og:image" content="https://i.ytimg.com/vi/${video.metaAppId}/maxresdefault.jpg">
</head>
<body></body>
</html>`;
    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'vary': 'User-Agent',
      },
    });
  }

  // Android devices -> Raw 302 header to Android Intent URI
  if (/android/i.test(ua)) {
    const fallback = encodeURIComponent(`https://www.youtube.com/watch?v=${video.metaAppId}`);
    const intentUrl = `intent://www.youtube.com/watch?v=${video.metaAppId}#Intent;package=com.google.android.youtube;scheme=https;S.browser_fallback_url=${fallback};end`;
    return new Response(null, {
      status: 302,
      headers: {
        'Location': intentUrl,
        'Vary': 'User-Agent',
        'Cache-Control': 'no-store',
      },
    });
  }

  // iOS devices
  if (/iPhone|iPad|iPod/i.test(ua)) {
    const isMetaInApp = /FBAN|FBAV|Instagram/i.test(ua);

    // CASE 1: Meta In-App Browser (FBAN / FBAV / Instagram)
    if (isMetaInApp) {
      const appScheme = `vnd.youtube://www.youtube.com/watch?v=${video.metaAppId}`;
      const inAppHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Opening YouTube…</title>
  <script>
    window.location.href = "${appScheme}";
    setTimeout(function() {
      if (!document.hidden) {
        window.location.replace("https://m.youtube.com/watch?v=${video.metaFallbackId}");
      }
    }, 1500);
  </script>
</head>
<body style="font-family:-apple-system,sans-serif;text-align:center;padding:48px 20px;">
  <p>Opening YouTube…</p>
  <p><a href="${appScheme}">Tap here to open in YouTube</a></p>
</body>
</html>`;
      return new Response(inAppHtml, {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
          'vary': 'User-Agent',
        },
      });
    }

    // CASE 2: Standard iOS Safari / Chrome -> Direct 302 to Apple Universal Link
    return Response.redirect(`https://youtu.be/${video.iosSafariId}`, 302);
  }

  // CASE 3: Desktop / Non-iOS / Non-Android -> Standard YouTube watch page
  return Response.redirect(`https://www.youtube.com/watch?v=${video.desktopId}`, 302);
}
