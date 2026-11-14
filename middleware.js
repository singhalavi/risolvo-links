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
  '/shorts/ep1': {
    id: '65S0LRp9rpY',
    type: 'short',
    title: 'GCSE Maths Quick Tip #1 | Risolvo',
    description: 'Quick GCSE Maths revision tip from Risolvo on YouTube Shorts.',
  },
  '/shorts/ep2': {
    id: '8HtDonrzq-0',
    type: 'short',
    title: 'GCSE Maths Quick Tip #2 | Risolvo',
    description: 'Quick GCSE Maths revision tip from Risolvo on YouTube Shorts.',
  },
};

export default function middleware(request) {
  const url = new URL(request.url);
  const cleanPath = url.pathname.replace(/\/+$/, '') || '/';
  const ua = request.headers.get('user-agent') || '';

  const video = VIDEOS[cleanPath];
  if (!video) {
    return Response.redirect('https://www.youtube.com/@Risolvo?sub_confirmation=1', 302);
  }

  const isShort = video.type === 'short';
  const youtubePath = isShort ? `shorts/${video.id}` : `watch?v=${video.id}`;
  const universalUrl = isShort
    ? `https://www.youtube.com/shorts/${video.id}`
    : `https://youtu.be/${video.id}`;
  const desktopUrl = `https://www.youtube.com/${youtubePath}`;

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
    const fallback = encodeURIComponent(desktopUrl);
    const intentUrl = `intent://www.youtube.com/${youtubePath}#Intent;package=com.google.android.youtube;scheme=https;S.browser_fallback_url=${fallback};end`;
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
      const appScheme = `vnd.youtube://www.youtube.com/${youtubePath}`;
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
        window.location.replace("${universalUrl}");
      }
    }, 1500);
  </script>
</head>
<body style="font-family:-apple-system,sans-serif;text-align:center;padding:48px 20px;">
  <p>Opening YouTube…</p>
  <p><a href="${universalUrl}">Tap here to open in YouTube</a></p>
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

    // 3b. Facebook iOS -> Universal Link tap-card (triggers native YouTube app on tap)
    if (isFacebookInApp) {
      const thumbUrl = `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`;
      const fbHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${video.title}</title>
</head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0f0f0f;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;box-sizing:border-box;">
  <div style="max-width:400px;width:100%;text-align:center;">
    <a href="${universalUrl}" style="display:block;position:relative;border-radius:14px;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,0.5);text-decoration:none;">
      <img src="${thumbUrl}" alt="${video.title}" style="width:100%;display:block;">
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.28);display:flex;align-items:center;justify-content:center;">
        <div style="width:68px;height:48px;background:#ff0000;border-radius:12px;display:flex;align-items:center;justify-content:center;">
          <div style="width:0;height:0;border-top:10px solid transparent;border-bottom:10px solid transparent;border-left:18px solid #fff;margin-left:4px;"></div>
        </div>
      </div>
    </a>
    <h1 style="font-size:18px;line-height:1.35;margin:20px 0 16px;font-weight:600;">${video.title}</h1>
    <a href="${universalUrl}" style="display:block;padding:15px 24px;background:#ff0000;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:16px;">Watch in YouTube App</a>
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

    // 3c. Standard iOS Safari / Chrome -> Direct 302 to Apple Universal Link
    return Response.redirect(universalUrl, 302);
  }

  // 4. Desktop browsers -> Standard YouTube watch or shorts page
  return Response.redirect(desktopUrl, 302);
}
