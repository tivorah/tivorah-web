// Read-only HTTP audit. Run against an already running app; never submits forms.
import assert from 'node:assert/strict';
const base = new URL(process.argv[2] || 'http://localhost:7456');
const get = async path => {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(20000) });
  return { response, html: await response.text() };
};
const sitemap = await get('/sitemap.xml');
assert.equal(sitemap.response.status, 200);
const urls = [...sitemap.html.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]));
assert.ok(urls.length > 0, 'Expected public sitemap entries (use production indexing configuration)');
const destinations = new Set();
for (const url of urls) {
  const { response, html } = await get(url.pathname);
  assert.equal(response.status, 200, url.pathname);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${url.pathname}: one H1`);
  for (const pattern of [/<title>[^<]+<\/title>/, /name="description" content="[^"]+"/, /rel="canonical" href="https?:\/\/[^\"]+"/, /property="og:image" content="https?:\/\/[^\"]+"/, /name="twitter:card" content="summary_large_image"/]) {
    assert.match(html, pattern, `${url.pathname}: metadata ${pattern}`);
  }
  for (const image of html.matchAll(/<img\b[^>]*>/g)) assert.match(image[0], /\balt="[^"]*"/, `${url.pathname}: missing alt`);
  for (const link of html.matchAll(/<a\b[^>]*href="([^\"]+)"/g)) {
    if (link[1].startsWith('/')) destinations.add(link[1].split('#')[0] || '/');
  }
  console.log(`PASS ${url.pathname}`);
}
for (const path of destinations) {
  const { response } = await get(path);
  assert.ok(response.status < 400, `Broken internal link: ${path} (${response.status})`);
}
const missing = await get('/__review_missing_page__');
assert.equal(missing.response.status, 404);
assert.match(missing.html, /We couldn’t find that page/);
assert.equal((await get('/social-preview.png')).response.status, 200);
console.log(`Passed ${urls.length} public pages and ${destinations.size} internal link destinations; branded 404 and social image available.`);
