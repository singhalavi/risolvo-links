if (isMetaInApp) {
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
    }, 2500);
  </script>
</head>
<body style="font-family:-apple-system,sans-serif;text-align:center;padding:48px 20px;">
  <p>Opening YouTube…</p>
  <p><a id="app-button" href="${appScheme}" style="display:inline-block;padding:12px 24px;background:#ff0000;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Open In YouTube App</a></p>
  <p style="margin-top:16px;"><a href="${webUrl}" style="color:#555;font-size:14px;">Continue in browser</a></p>
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
