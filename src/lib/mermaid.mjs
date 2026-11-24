const text = node => node.type === 'text' ? node.value : (node.children || []).map(text).join('');
const element = (tagName, properties, children = []) => ({ type: 'element', tagName, properties, children });
const plainText = value => ({ type: 'text', value });

// Run after HTML sanitization, before syntax highlighting. Diagram source stays
// escaped text, never executable HTML, and remains available without JavaScript.
export default function rehypeMermaid() {
  return tree => {
    function transform(parent) {
      if (!parent.children) return;
      parent.children = parent.children.map(node => {
        const code = node.tagName === 'pre' && node.children?.find(child => child.tagName === 'code');
        if (code && code.properties?.className?.some(name => name.toLowerCase() === 'language-mermaid')) {
          return element('figure', { className: ['mermaid-diagram'], ariaLabel: 'Diagram' }, [
            element('div', { className: ['mermaid-output'], 'data-pagefind-ignore': true, ariaLive: 'polite' }, [
              element('p', { className: ['mermaid-status'] }, [plainText('Loading diagram…')]),
            ]),
            element('noscript', {}, [element('p', {}, [plainText('Enable JavaScript to view this diagram, or read its source below.')])]),
            element('details', { className: ['mermaid-details'] }, [
              element('summary', {}, [plainText('Diagram source')]),
              element('pre', { className: ['mermaid-source'] }, [element('code', {}, [plainText(text(code))])]),
            ]),
          ]);
        }
        transform(node);
        return node;
      });
    }
    transform(tree);
  };
}
