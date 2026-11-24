import fs from 'node:fs';
import path from 'node:path';
import { topics } from '../data/topics.mjs';
import { conceptDefinitions, metadataOverrides } from '../data/concepts.mjs';

export const REPOSITORY = 'https://github.com/afontana1/tech-guides-site';
export const BASE = '/tech-guides-site';
export const url = (value = '') => `${BASE}/${value.replace(/^\/+/, '')}`;
export const slugify = (value) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const sourceUrl = (file) => `${REPOSITORY}/blob/main/${file.split('/').map(encodeURIComponent).join('/')}`;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : /\.md$/i.test(entry.name) ? [file] : [];
  });
}

export function prepareMarkdown(source, title = '') {
  let inFence = false;
  let fenceCharacter = '';
  let fenceLength = 0;
  let removedTitle = false;
  return source.replace(/^\uFEFF/, '').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').split(/\r?\n/).map(line => {
    const fence = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      if (!inFence) { inFence = true; fenceCharacter = fence[1][0]; fenceLength = fence[1].length; }
      else if (fence[1][0] === fenceCharacter && fence[1].length >= fenceLength) inFence = false;
      return line;
    }
    if (inFence) return line;
    const heading = line.match(/^#{1,2}\s+(.+?)\s*#*$/);
    if (!removedTitle && heading && slugify(heading[1]) === slugify(title)) { removedTitle = true; return ''; }
    return line.replace(/^Slide\s+\d+:\s*(.+)$/i, '## $1');
  }).join('\n');
}

export function extractSummary(source) {
  const prose = source.replace(/^\uFEFF/, '').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
    .replace(/^\s*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s*\1[^\n]*$/gm, '')
    .split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 65 && !/^(?:#|Slide\s+\d|\||```|<|\$|[-*]\s|\d+[.)]\s)/i.test(line));
  const text = (prose[0] || 'Explore the core ideas, explanations, and practical examples in this guide.')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`]/g, '').replace(/\s+/g, ' ');
  return text.length > 205 ? text.slice(0, 202).replace(/\s+\S*$/, '') + '…' : text;
}

export function findConcepts(text) {
  return conceptDefinitions.filter(concept => concept.pattern.test(text));
}

let cached;
export function getLibrary() {
  if (cached) return cached;
  const root = process.cwd();
  const ids = new Set();
  cached = topics.flatMap(topic => {
    const directory = path.join(root, topic.id);
    if (!fs.existsSync(directory)) throw new Error(`Missing content directory: ${topic.id}`);
    return walk(directory).map(absoluteFile => {
      const file = path.relative(root, absoluteFile).split(path.sep).join('/');
      const raw = fs.readFileSync(absoluteFile, 'utf8').replace(/^\uFEFF/, '');
      const filename = path.basename(file, '.md');
      const heading = raw.match(/^#{1,2}\s+(.+)$/m)?.[1];
      const defaultTitle = filename === 'README' ? (heading || topic.name) : filename.replace(/^\d+[-_]\s*/, '').replace(/_/g, ' ');
      const override = metadataOverrides[file] || {};
      const title = override.title || defaultTitle;
      const category = file.split('/').slice(1, -1).join(' / ') || 'Overview';
      const slug = file.replace(/\.md$/i, '').split('/').map(slugify).join('/');
      if (ids.has(slug)) throw new Error(`Duplicate guide URL: ${slug}`);
      ids.add(slug);
      const summary = override.summary || extractSummary(raw);
      const concepts = override.concepts || findConcepts(`${title} ${category}`).slice(0, 8).map(concept => concept.id);
      const format = topic.id === 'from-scratch' ? 'Implementation' : /compar|\bvs\b|versus/i.test(title) ? 'Comparison' : /cheat sheet|cheatsheet|reference|handwritten/i.test(title) ? 'Reference' : 'Guide';
      const words = raw.replace(/```[\s\S]*?```/g, '').split(/\s+/).length;
      return { file, slug, title, summary, topic: topic.id, topicName: topic.name, category, concepts, format,
        minutes: Math.max(2, Math.ceil(words / 200)), note: override.note || '', raw,
        href: url(`guides/${slug}/`), source: sourceUrl(file) };
    });
  }).sort((a, b) => a.title.localeCompare(b.title));
  return cached;
}

export function getTopics() {
  const guides = getLibrary();
  return topics.map(topic => ({ ...topic, count: guides.filter(guide => guide.topic === topic.id).length }));
}

export function getConcepts() {
  const guides = getLibrary();
  return conceptDefinitions.map(concept => ({ ...concept, guides: guides.filter(guide => guide.concepts.includes(concept.id)) }))
    .filter(concept => concept.guides.length > 0);
}

export function conceptLabels(guide) {
  return guide.concepts.map(id => conceptDefinitions.find(concept => concept.id === id)).filter(Boolean);
}

export function relatedGuides(guide, limit = 4) {
  return getLibrary().filter(other => other.slug !== guide.slug).map(other => ({
    guide: other,
    score: other.concepts.filter(id => guide.concepts.includes(id)).length * 4 +
      (other.category === guide.category && other.topic === guide.topic ? 2 : 0) +
      (other.topic !== guide.topic && other.concepts.some(id => guide.concepts.includes(id)) ? 1 : 0),
  })).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.guide.minutes - b.guide.minutes).slice(0, limit).map(item => item.guide);
}

export function publicGuide(guide) {
  const { raw, file, note, source, ...metadata } = guide;
  return metadata;
}

export function resolveGuideLink(href, fromFile, guides = getLibrary()) {
  if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)) return href;
  const [pathname, fragment] = href.split('#');
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return href; }
  if (!/\.md$/i.test(decoded)) return href;
  const target = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), decoded));
  const guide = guides.find(item => item.file === target);
  return guide ? guide.href + (fragment ? `#${fragment}` : '') : `${REPOSITORY}/blob/main/${target.split('/').map(encodeURIComponent).join('/')}${fragment ? `#${fragment}` : ''}`;
}
