export const config = {
  matcher: '/:path*',
};

const VIDEOS = {
  '/sigfig/ep1': {
    // 1. Instagram iOS (auto-launch) -> Significant Figures
    instaId: '6u5QBmIT9wY',
    // 1b. Instagram iOS (fallback timer) -> Estimation
    instaFallbackId: 'hYG_I-CgfLQ',
    // 2. Facebook iOS (thumbnail tap-card) -> Trailing Zero Problem
    fbId: '8qr8mw7VwcM',
    // 3. Standard iOS Safari / Chrome -> Error Intervals
    iosSafariId: 'gQrNCJL3bvc',
    // 4. Desktop / Other -> Bounds in Calculations
    desktopId: 'pU5hd98szEI',
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

  // 0. Social link-preview crawlers
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
  <meta property="og:image" content="https://i.ytimg.com/vi/${video.instaId}/maxresdefault.jpg">
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

  // 1. Android devices -> Direct 302 to Android Intent URI
  if (/android/i.test(ua)) {
    const fallback = encodeURIComponent(`https://www.youtube.com/watch?v=${video.instaId}`);
    const intentUrl = `intent://www.youtube.com/watch?v=${video.instaId}#Intent;package=com.google.android.youtube;scheme=https;S.browser_fallback_url=${fallback};end`;
    return new Response(null, {
      status: 302,
      headers: {
        'Location': intentUrl,
        'Vary': 'User-Agent',
        'Cache-Control': 'no-store',
      },
    });
  }

  // 2. iOS devices
  if (/iPhone|iPad|iPod/i.test(ua)) {
    const isInstagram = /Instagram/i.test(ua);
    const isFacebookInApp = /FBAN|FBAV/i.test(ua);

    // 2a. Instagram iOS -> Automatic vnd.youtube:// handoff
    if (isInstagram) {
      const appScheme = `vnd.youtube://www.youtube.com/watch?v=${video.instaId}`;
      const webUrl = `https://m.youtube.com/watch?v=${video.instaFallbackId}`;
      const instaHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${video.title}</title>
  <script>
    window.location.href = "${appScheme}";
    setTimeout(function() {
      if (!document.hidden) {
        window.location.replace("${webUrl}");
      }
    }, 1500);
  </script>
</head>
<body style="font-family:-apple-system,sans-serif;text-align:center;padding:48px 20px;">
  <p>Opening YouTube…</p>
  <p><a href="${appScheme}">Tap here to open in YouTube</a></p>
</body>
</html>`;
      return new Response(instaHtml, {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
          'vary': 'User-Agent',
        },
      });
    }

    // 2b. Facebook iOS -> Thumbnail tap-card
    if (isFacebookInApp) {
      const appScheme = `vnd.youtube://www.youtube.com/watch?v=${video.fbId}`;
      const webUrl = `https://m.youtube.com/watch?v=${video.fbId}`;
      const thumbUrl = `https://i.ytimg.com/vi/${video.fbId}/maxresdefault.jpg`;
      const fbHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${video.title}</title>
</head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0f0f0f;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;box-sizing:border-box;">
  <div style="max-width:400px;width:100%;text-align:center;">
    <a href="${appScheme}" style="display:block;position:relative;border-radius:14px;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,0.5);text-decoration:none;">
      <img src="${thumbUrl}" alt="${video.title}" style="width:100%;display:block;">
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.28);display:flex;align-items:center;justify-content:center;">
        <div style="width:68px;height:48px;background:#ff0000;border-radius:12px;display:flex;align-items:center;justify-content:center;">
          <div style="width:0;height:0;border-top:10px solid transparent;border-bottom:10px solid transparent;border-left:18px solid #fff;margin-left:4px;"></div>
        </div>
      </div>
    </a>
    <h1 style="font-size:18px;line-height:1.35;margin:20px 0 16px;font-weight:600;">${video.title}</h1>
    <a href="${appScheme}" style="display:block;padding:15px 24px;background:#ff0000;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:16px;">Watch in YouTube App</a>
    <a href="${webUrl}" style="display:inline-block;margin-top:18px;color:#aaa;font-size:14px;text-decoration:underline;">Continue in mobile browser</a>
  </div>
</body>
</html>`;
      return new Response(fbHtml, {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
          'vary': 'User-Agent',
        },
      });
    }

    // 2c. Standard iOS Safari / Chrome -> Direct 302 to Apple Universal Link
    return Response.redirect(`https://youtu.be/${video.iosSafariId}`, 302);
  }

  // 3. Desktop / Other -> Standard YouTube watch page
  return Response.redirect(`https://www.youtube.com/watch?v=${video.desktopId}`, 302);
}
