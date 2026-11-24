import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex';
import rehypeShiki from '@shikijs/rehype';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { prepareMarkdown, resolveGuideLink } from './library.mjs';

const text = node => node.type === 'text' ? node.value : (node.children || []).map(text).join('');
const schema = { ...defaultSchema, attributes: { ...defaultSchema.attributes,
  code: [...(defaultSchema.attributes.code || []).filter(rule => !(Array.isArray(rule) && rule[0] === 'className')), ['className', /^language-/, 'math-inline', 'math-display']],
} };

export async function renderGuide(guide) {
  const headings = [];
  function annotations() {
    return tree => visit(tree, 'element', node => {
      if (/^h[1-4]$/.test(node.tagName) && node.properties.id) headings.push({ id: String(node.properties.id), text: text(node), depth: Number(node.tagName[1]) });
      if (node.tagName === 'a') node.properties.href = resolveGuideLink(String(node.properties.href || ''), guide.file);
      if (node.tagName === 'pre') node.properties['data-pagefind-weight'] = '0.2';
      if (node.tagName === 'img') { node.properties.loading = 'lazy'; node.properties.decoding = 'async'; }
    });
  }
  const result = await unified().use(remarkParse).use(remarkGfm).use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true }).use(rehypeRaw).use(rehypeSanitize, schema)
    .use(rehypeSlug).use(rehypeKatex, { throwOnError: false, strict: false })
    .use(rehypeShiki, { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false, fallbackLanguage: 'text' })
    .use(annotations).use(rehypeStringify).process(prepareMarkdown(guide.raw, guide.title));
  return { html: String(result), headings };
}
