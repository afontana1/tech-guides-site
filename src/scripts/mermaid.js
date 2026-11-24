const figures = [...document.querySelectorAll('.mermaid-diagram')];

if (figures.length) {
  let engine;
  let queue = Promise.resolve();
  let sequence = 0;
  const sources = new Map(figures.map(figure => [figure, figure.querySelector('.mermaid-source code').textContent]));
  const visibleFigures = new Set();
  const pending = new Set();
  const theme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default';

  function reportFailure(figure) {
    const message = document.createElement('p');
    message.className = 'mermaid-status';
    message.textContent = 'This diagram could not be rendered. Its source is available below.';
    figure.querySelector('.mermaid-output').replaceChildren(message);
    figure.querySelector('details').open = true;
    figure.dataset.diagramState = 'error';
  }

  async function render(figure) {
    if (figure.dataset.diagramTheme === theme() && figure.dataset.diagramState === 'ready') return;
    figure.dataset.diagramState = 'rendering';
    try {
      // The renderer is bundled locally and loaded only on pages with diagrams.
      engine ||= (await import('mermaid')).default;
      const currentTheme = theme();
      engine.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        suppressErrorRendering: true,
        theme: currentTheme,
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        flowchart: { htmlLabels: false },
      });
      const { svg, bindFunctions } = await engine.render(`guide-diagram-${++sequence}`, sources.get(figure));
      const output = figure.querySelector('.mermaid-output');
      output.innerHTML = svg;
      bindFunctions?.(output);
      figure.dataset.diagramState = 'ready';
      figure.dataset.diagramTheme = currentTheme;
    } catch {
      reportFailure(figure);
    }
  }

  function schedule(figure) {
    if (pending.has(figure)) return;
    pending.add(figure);
    // Mermaid shares configuration and rendering state; serialize its calls.
    queue = queue.then(async () => {
      try { await render(figure); }
      finally {
        pending.delete(figure);
        if (figure.dataset.diagramState === 'ready' && figure.dataset.diagramTheme !== theme()) schedule(figure);
      }
    });
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) { visibleFigures.add(entry.target); schedule(entry.target); }
        else visibleFigures.delete(entry.target);
      }
    }, { rootMargin: '250px 0px' });
    for (const figure of figures) observer.observe(figure);
  } else for (const figure of figures) { visibleFigures.add(figure); schedule(figure); }

  // Update visible diagrams immediately; off-screen diagrams update on re-entry.
  new MutationObserver(() => {
    for (const figure of visibleFigures) schedule(figure);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
