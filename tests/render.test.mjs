import test from 'node:test';
import assert from 'node:assert/strict';
import { renderGuide } from '../src/lib/render.mjs';

test('guide rendering preserves math and highlighted code while stripping unsafe HTML', async () => {
  const guide = { title: 'Example', file: 'python/example.md', raw: '# Example\n\nSlide 1: A useful idea\n\nSome mathematics: $x^2 + y^2$.\n\n```python\nprint("hello")\n```\n\n<script>alert(1)</script>\n\n[unsafe](javascript:alert(1))\n\n## A useful idea' };
  const { html, headings } = await renderGuide(guide);
  assert.ok(html.includes('class="katex"'));
  assert.ok(html.includes('shiki'));
  assert.ok(html.includes('data-pagefind-weight="0.2"'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('javascript:'));
  assert.deepEqual(headings.map(heading => heading.id), ['a-useful-idea', 'a-useful-idea-1']);
});

test('unknown code languages render without breaking a guide', async () => {
  const { html } = await renderGuide({ title: 'Example', file: 'python/example.md', raw: '```not-a-real-language\nexample code\n```' });
  assert.ok(html.includes('example code'));
});

test('Mermaid is kept as escaped diagram source instead of highlighted code', async () => {
  const { html } = await renderGuide({ title: 'Diagram', file: 'microservices/example.md', raw: '```mermaid\nflowchart TD\nA[Order Service] --> B[(Order Data)]\n```\n\n```python\nprint("normal code")\n```' });
  assert.ok(html.includes('class="mermaid-diagram"'));
  assert.ok(html.includes('class="mermaid-source"'));
  assert.ok(html.includes('Order Service') && html.includes('Order Data'));
  assert.ok(!html.includes('language-mermaid'));
  assert.ok(html.includes('shiki'));
});
