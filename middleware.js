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

function redirect302(location) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      Vary: 'User-Agent',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export default function middleware(request) {
  const url = new URL(request.url);
  const cleanPath = url.pathname.replace(/\/+$/, '') || '/';
  const ua = request.headers.get('user-agent') || '';

  const video = VIDEOS[cleanPath];
  if (!video) {
    return redirect302('https://www.youtube.com/@Risolvo');
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
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        Vary: 'User-Agent',
      },
    });
  }

  // 2. Android devices -> Server-side HTTP 302 to Android Intent URI
  if (/android/i.test(ua)) {
    const fallback = encodeURIComponent(`https://www.youtube.com/watch?v=${video.id}`);
    const intentUrl = `intent://www.youtube.com/watch?v=${video.id}#Intent;package=com.google.android.youtube;scheme=https;S.browser_fallback_url=${fallback};end`;
    return redirect302(intentUrl);
  }

  // 3. iOS devices
  if (/iPhone|iPad|iPod/i.test(ua)) {
    const isMetaInApp = /FBAN|FBAV|Instagram/i.test(ua);

    if (isMetaInApp) {
      // Exact URLgenius FBAN/Instagram iOS payload using vnd.youtube://
      const appScheme = `vnd.youtube://www.youtube.com/watch?v=${video.id}&v=${video.id}`;
      const webUrl = `https://www.youtube.com/watch?v=${video.id}`;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Opening YouTube…</title>
  <script>
    window.location = "${appScheme}";
    setTimeout(function() {
      if (!document.hidden) {
        window.location = "${webUrl}";
      }
    }, 500);
  </script>
</head>
<body style="font-family:-apple-system,sans-serif;text-align:center;padding:48px 20px;">
  <p>Opening YouTube…</p>
  <p><a id="app-button" href="${appScheme}">Open In App</a></p>
</body>
</html>`;

      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          Vary: 'User-Agent',
          'Cache-Control': 'no-cache, no-store',
        },
      });
    }

    // Standard iOS Safari / Chrome -> Direct 302 to Apple Universal Link
    return redirect302(`https://youtu.be/${video.id}`);
  }

  // 4. Desktop browsers -> Server-side HTTP 302 to standard YouTube watch page
  return redirect302(`https://www.youtube.com/watch?v=${video.id}`);
}
