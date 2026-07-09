// This is a rescue script to break out of a stale CDN cache
// The other Cloudflare account is caching the old index.html which points to this file.
// When the browser executes this, we force it to reload with a cache-busting query param
// so it fetches the fresh index.html.

(function() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('nocache')) {
    url.searchParams.set('nocache', Date.now());
    window.location.replace(url.toString());
  }
})();
