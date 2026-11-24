import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getLibrary, getConcepts, getTopics, findConcepts, prepareMarkdown, extractSummary, resolveGuideLink, relatedGuides, publicGuide, sourceUrl, url, BASE } from '../src/lib/library.mjs';
import { conceptDefinitions } from '../src/data/concepts.mjs';
import { topics, paths } from '../src/data/topics.mjs';

test('every original Markdown file has a unique, safe guide route', () => {
  const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : entry.name.endsWith('.md') ? [path.join(directory, entry.name).split(path.sep).join('/')] : []);
  const files = topics.flatMap(topic => walk(topic.id));
  const guides = getLibrary();
  assert.deepEqual(new Set(guides.map(guide => guide.file)), new Set(files));
  assert.equal(new Set(guides.map(guide => guide.slug)).size, files.length);
  for (const guide of guides) {
    assert.match(guide.slug, /^[a-z0-9/-]+$/);
    assert.ok(guide.title && guide.summary && guide.raw);
    assert.ok(guide.href.startsWith(`${BASE}/guides/`));
    assert.ok(guide.minutes >= 2);
  }
});

test('slide conversion leaves fenced code untouched, including longer code fences', () => {
  const source = '# Example\n\nSlide 1: First concept\n\n```python\nSlide 2: This is code\n```\n\n~~~~text\nSlide 3: Also code\n~~~\n~~~~\n\nSlide 4: Next concept';
  const prepared = prepareMarkdown(source, 'Example');
  assert.ok(!prepared.startsWith('# Example'));
  assert.ok(prepared.includes('## First concept'));
  assert.ok(prepared.includes('```python\nSlide 2: This is code\n```'));
  assert.ok(prepared.includes('Slide 3: Also code'));
  assert.ok(prepared.includes('## Next concept'));
});

test('summaries use prose instead of title, slide label, or code', () => {
  const prose = 'This explanation introduces the mathematics and practical examples behind principal component analysis.';
  const summary = extractSummary(`## PCA\nSlide 1: Introduction\n\n\x60\x60\x60python\n# A very long code comment that should never be used to describe an article in the catalog.\n\x60\x60\x60\n\n${prose}`);
  assert.equal(summary, prose);
});

test('cross-topic concepts and aliases connect relevant guides', () => {
  const pca = getConcepts().find(concept => concept.id === 'pca');
  assert.ok(pca.aliases.includes('PCA'));
  assert.ok(new Set(pca.guides.map(guide => guide.topic)).size >= 3);
  assert.ok(findConcepts('QLoRA parameter-efficient fine-tuning').some(concept => concept.id === 'fine-tuning'));
  for (const guide of getLibrary()) for (const id of guide.concepts) assert.ok(conceptDefinitions.some(concept => concept.id === id));
  for (const learningPath of paths) for (const id of learningPath.concepts) assert.ok(getConcepts().some(concept => concept.id === id));
});

test('relative Markdown links become published URLs with their fragments preserved', () => {
  const guides = [{ file: 'python/Functions/Second guide.md', href: url('guides/python/functions/second-guide/') }];
  assert.equal(resolveGuideLink('Second%20guide.md#examples', 'python/Functions/First.md', guides), `${BASE}/guides/python/functions/second-guide/#examples`);
  assert.equal(resolveGuideLink('#example', 'first.md', guides), '#example');
  assert.equal(resolveGuideLink('https://example.com/a.md', 'first.md', guides), 'https://example.com/a.md');
  assert.equal(sourceUrl("statistics/Bayes/Bayes' Theorem.md"), "https://github.com/afontana1/tech-guides-site/blob/main/statistics/Bayes/Bayes'%20Theorem.md");
});

test('related guides share concepts and catalog never ships source bodies', () => {
  const guide = getConcepts().find(concept => concept.id === 'pca').guides[0];
  const related = relatedGuides(guide);
  assert.ok(related.length > 0);
  for (const other of related) {
    assert.notEqual(other.slug, guide.slug);
    assert.ok(other.concepts.some(concept => guide.concepts.includes(concept)));
  }
  assert.ok(!('raw' in publicGuide(guide)));
  assert.equal(getTopics().reduce((sum, topic) => sum + topic.count, 0), getLibrary().length);
});
