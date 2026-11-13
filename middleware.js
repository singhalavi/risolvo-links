export const config = {
  matcher: '/:path*',
};

const VIDEOS = {
  '/sigfig/ep1': {
    id: '6u5QBmIT9wY',
    title: 'Significant Figures — GCSE Maths Walkthrough | Risolvo',
    description: 'Watch the step-by-step GCSE Maths walkthrough on Significant Figures on YouTube.',
  },
  '/estimation/ep2': {
    id: 'hYG_I-CgfLQ',
    title: 'Estimation Made Easy — GCSE Maths Walkthrough | Risolvo',
    description: 'Watch the step-by-step GCSE Maths walkthrough on Estimation on YouTube.',
  },
  '/sigfig/trailing-zeros': {
    id: '8qr8mw7VwcM',
    title: 'Significant Figures: The Trailing Zero Problem | Risolvo',
    description: 'Master the trailing zero problem in GCSE Maths Significant Figures.',
  },
  '/error-intervals': {
    id: 'gQrNCJL3bvc',
    title: 'Error Intervals — GCSE Maths Walkthrough | Risolvo',
    description: 'Watch the step-by-step GCSE Maths walkthrough on Error Intervals on YouTube.',
  },
  '/bounds': {
    id: 'pU5hd98szEI',
    title: 'Bounds in Calculations — GCSE Maths Walkthrough | Risolvo',
    description: 'Learn how to solve upper and lower bounds in GCSE Maths calculations.',
  },
  '/surds/simplifying': {
    id: 'FGoVDExhaIA',
    title: 'Simplifying Surds — GCSE Maths Walkthrough | Risolvo',
    description: 'Step-by-step GCSE Maths walkthrough on simplifying surds.',
  },
  '/surds/adding-subtracting': {
    id: '_OSzPiSjn30',
    title: 'Adding and Subtracting Surds — GCSE Maths Walkthrough | Risolvo',
    description: 'Learn how to add and subtract surds for GCSE Maths.',
  },
  '/surds/expanding-brackets': {
    id: '22T1mKQrbf8',
    title: 'Expanding Brackets with Surds — GCSE Maths Walkthrough | Risolvo',
    description: 'Step-by-step GCSE Maths walkthrough on expanding brackets with surds.',
  },
  '/surds/rationalising': {
    id: 'WVWZ3GauFgo',
    title: 'Rationalising the Denominator — GCSE Maths Walkthrough | Risolvo',
    description: 'Master rationalising the denominator for GCSE Maths.',
  },
  '/quadratics/intro': {
    id: 'EFzuUALejXY',
    title: 'Introduction to Quadratic Expressions | Risolvo',
    description: 'Step-by-step GCSE Maths introduction to quadratic expressions.',
  },
  '/quadratics/factorising-a1': {
    id: 'CdLxA-gTdOE',
    title: 'Factorising Quadratics When a = 1 | Risolvo',
    description: 'Learn how to factorise quadratic expressions when a = 1.',
  },
  '/quadratics/factorising-a-not-1': {
    id: 'W_lf8d02eAs',
    title: 'Factorising Quadratics When a Is Not 1 | Risolvo',
    description: 'Step-by-step method for factorising quadratics when a is not 1.',
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
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'vary': 'User-Agent',
      },
    });
  }

  // 2. Android devices -> Direct server-side 302 to Android Intent URI
  if (/android/i.test(ua)) {
    const fallback = encodeURIComponent(`https://www.youtube.com/watch?v=${video.id}`);
    const intentUrl = `intent://www.youtube.com/watch?v=${video.id}#Intent;package=com.google.android.youtube;scheme=https;S.browser_fallback_url=${fallback};end`;
    return new Response(null, {
      status: 302,
      headers: {
        'Location': intentUrl,
        'Vary': 'User-Agent',
        'Cache-Control': 'no-store',
      },
    });
  }

  // 3. iOS devices
  if (/iPhone|iPad|iPod/i.test(ua)) {
    const isInstagram = /Instagram/i.test(ua);
    const isFacebookInApp = /FBAN|FBAV/i.test(ua);

    // 3a. Instagram iOS -> Verified automatic vnd.youtube:// handoff
    if (isInstagram) {
      const appScheme = `vnd.youtube://www.youtube.com/watch?v=${video.id}`; const webUrl = `https://m.youtube.com/watch?v=${video.id}`;
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

    // 3b. Facebook iOS -> Thumbnail tap-card (satisfies WKWebView user-gesture rule without timer hijack)
    if (isFacebookInApp) {
      const appScheme = `vnd.youtube://www.youtube.com/watch?v=${video.id}`;
      const webUrl = `https://m.youtube.com/watch?v=${video.id}`; const thumbUrl = `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`;
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
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0
