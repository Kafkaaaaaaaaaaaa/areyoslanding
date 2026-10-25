/* Cloudflare Web Analytics (cookieless). Paste the site token from
   Cloudflare dashboard > Web Analytics > your site > Manage site > JS snippet
   (the value inside data-cf-beacon='{"token": "..."}') between the quotes below. */
(function () {
  var TOKEN = '';
  if (!TOKEN) return;
  var s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', JSON.stringify({ token: TOKEN }));
  document.head.appendChild(s);
})();
