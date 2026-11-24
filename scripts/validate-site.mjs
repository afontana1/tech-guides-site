import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { getLibrary, getConcepts, getTopics, url, BASE } from '../src/lib/library.mjs';

const dist = path.resolve('dist');
assert.ok(fs.existsSync(path.join(dist, 'index.html')), 'Run npm run build before validating.');
const expected = ['index.html', 'search/index.html', 'concepts/index.html', 'paths/index.html', 'catalog.json', '404.html', 'pagefind/pagefind.js',
  ...getLibrary().map(guide => `guides/${guide.slug}/index.html`),
  ...getConcepts().map(concept => `concepts/${concept.id}/index.html`),
  ...getTopics().map(topic => `topics/${topic.id}/index.html`),
];
for (const file of expected) assert.ok(fs.existsSync(path.join(dist, file)), `Missing output: ${file}`);
const catalog = JSON.parse(fs.readFileSync(path.join(dist,'catalog.json'),'utf8'));
assert.equal(catalog.guides.length, getLibrary().length);
const broken = new Set();
for (const file of expected.filter(file => file.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(dist,file),'utf8');
  if (file.startsWith('guides/')) {
    assert.ok(html.includes('data-pagefind-body'), `${file} missing searchable body`);
    assert.ok(html.includes('data-pagefind-meta='), `${file} missing search metadata`);
    assert.ok(html.includes('class="prose"'), `${file} missing guide content`);
  }
  for (const [, attribute, raw] of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
    const href = raw.replace(/&amp;/g,'&');
    // Check site-owned navigation and generated assets, not external article resources.
    if (!href.startsWith(`${BASE}/`)) {
      if (/^\/(?:_astro|pagefind|guides|concepts|topics|paths|search)(?:\/|$)/.test(href)) broken.add(`${file}: missing repository base in ${href}`);
      continue;
    }
    let target = decodeURIComponent(href.slice(BASE.length + 1).split(/[?#]/)[0]);
    if (!target || target.endsWith('/')) target += 'index.html';
    const resolved = path.resolve(dist, target);
    if (!resolved.startsWith(dist + path.sep) || !fs.existsSync(resolved)) broken.add(`${file}: ${attribute}=${href}`);
  }
}
assert.equal(broken.size, 0, `Broken site links:\n${[...broken].slice(0,30).join('\n')}`);
console.log(`Validated ${catalog.guides.length} guide pages, ${getConcepts().length} concept pages, ${getTopics().length} topic pages, search assets, and internal site links.`);
