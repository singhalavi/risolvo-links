// middleware.js — watch.risolvo.co.uk
// Maps short links -> YouTube video IDs, and serves a
// deep-link interstitial for Meta/Instagram in-app browsers.
import { NextResponse } from 'next/server';

// Add every lesson here: path -> YouTube video ID
const VIDEOS = {
  '/sigfig/ep1': '6u5QBmIT9wY',   // Significant Figures Made Easy
  '/sigfig/ep2': 'hYG_I-CgfLQ',   // Estimation Made Easy
  '/sigfig/ep3': '8qr8mw7VwcM',   // Trailing Zero Problem
  '/sigfig/ep4': 'gQrNCJL3bvc',   // Error Intervals Explained
  '/sigfig/ep5': 'pU5hd98szEI',   // Bounds in Calculations
  '/surds/ep6': 'FGoVDExhaIA',    // Simplifying Surds
  '/surds/ep7': '_OSzPiSjn30',    // Adding & Subtracting Surds
  '/surds/ep8': '22T1mKQrbf8',    // Expanding Brackets with Surds
  '/surds/ep9': 'WVWZ3GauFgo',    // Rationalising the Surds
  '/quad/ep10': 'EFzuUALejXY',    // Intro to Quadratic Expressions
  '/quad/ep11': 'CdLxA-gTdOE',    // Factorising When a = 1
  '/quad/ep12': 'W_lf8d02eAs',    // Factorising When a Is Not 1
};

function interstitialHtml(videoId, title) {
  const webUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const appUrl = `youtube://watch?v=${videoId}`;
  // Android intent URL — opens the YouTube app directly
  const intentUrl =
    `intent://www.youtube.com/watch?v=${videoId}` +
    `#Intent;scheme=https;package=com.google.android.youtube;` +
    `S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;

  return `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Opening in YouTube…</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0B2032;
    color: #fff; text-align: center; padding: 48px 24px; margin: 0; }
  h1 { font-size: 22px; margin: 0 0 8px; }
  p { color: #cbd5e1; font-size: 15px; }
  a.btn { display: block; margin: 32px auto 16px; padding: 16px 24px;
    background: #FF6A00; color: #fff; font-size: 18px; font-weight: 700;
    border-radius: 12px; text-decoration: none; max-width: 320px; }
  a.web { color: #93c5fd; font-size: 14px; }
</style></head>
<body>
  <h1>Opening in the YouTube app…</h1>
  <p>If it doesn't open automatically, tap below.</p>
  <a class="btn" href="${appUrl}">Open in YouTube app</a>
  <a class="web" href="${webUrl}">Watch on the web instead</a>
  <script>
    // 1. Try the YouTube app scheme (iOS + Android)
    window.location = "${appUrl}";
    // 2. Android: try the intent URL a beat later
    setTimeout(function () { window.location = "${intentUrl}"; }, 400);
    // 3. Fallback: web YouTube after 2.5s if the app didn't open
    setTimeout(function () { window.location = "${webUrl}"; }, 2500);
  </script>
</body></html>`;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const key = pathname.replace(/\/$/, ''); // trailing slash optional
  const videoId = VIDEOS[key];
  if (!videoId) return NextResponse.next();

  const ua = request.headers.get('user-agent') || '';
  const isMeta = /FBAN|FBAV|Instagram/i.test(ua);
  const webUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Normal browsers: YouTube's own app-links already work,
  // so a plain redirect is fine.
  if (!isMeta) return NextResponse.redirect(webUrl);

  // Meta / Instagram in-app browser: serve the interstitial
  // page that attempts the app deep link.
  return new Response(interstitialHtml(videoId, key), {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

export const config = {
  matcher: ['/sigfig/:path*', '/surds/:path*', '/quad/:path*'],
};
