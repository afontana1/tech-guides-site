import test from 'node:test';
import assert from 'node:assert/strict';
import rehypeMermaid from '../src/lib/mermaid.mjs';
import { getLibrary } from '../src/lib/library.mjs';

const block = (source, language = 'mermaid') => ({ type: 'element', tagName: 'pre', properties: {}, children: [{ type: 'element', tagName: 'code', properties: { className: [`language-${language}`] }, children: [{ type: 'text', value: source }] }] });
const find = (node, tag) => node.tagName === tag ? node : node.children?.map(child => find(child, tag)).find(Boolean);

test('Mermaid blocks become diagram containers with exact, readable source', () => {
  const source = 'flowchart TD\n    Feature[Feature: Cancel an Order]\n    Orders[Order Service]\n    Feature --> Orders\n';
  const tree = { type: 'root', children: [block(source), block('print("hello")', 'python')] };
  rehypeMermaid()(tree);
  const figure = tree.children[0];
  assert.equal(figure.tagName, 'figure');
  assert.deepEqual(figure.properties.className, ['mermaid-diagram']);
  assert.equal(find(figure, 'code').children[0].value, source);
  assert.equal(find(figure, 'summary').children[0].value, 'Diagram source');
  assert.equal(tree.children[1].tagName, 'pre');
  assert.deepEqual(tree.children[1].children[0].properties.className, ['language-python']);
});

test('all existing Mermaid fences preserve their source through conversion', () => {
  let count = 0;
  for (const guide of getLibrary()) {
    for (const match of guide.raw.matchAll(/^\s*```mermaid\s*\r?\n([\s\S]*?)^\s*```\s*$/gm)) {
      const tree = { type: 'root', children: [block(match[1])] };
      rehypeMermaid()(tree);
      assert.equal(find(tree, 'code').children[0].value, match[1], guide.file);
      count++;
    }
  }
  assert.ok(count > 0, 'The collection should include Mermaid diagram examples');
});
