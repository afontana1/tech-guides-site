const browser = document.querySelector('#library-browser');
if (browser) {
  const input = document.querySelector('#query');
  const topic = document.querySelector('#filter-topic');
  const format = document.querySelector('#filter-format');
  const concept = document.querySelector('#filter-concept');
  const results = document.querySelector('#search-results');
  const status = document.querySelector('#search-status');
  const context = document.querySelector('#search-context');
  const more = document.querySelector('#load-more');
  const notice = document.querySelector('#search-notice');
  const parameters = new URLSearchParams(location.search);
  input.value = parameters.get('q') || '';
  for (const [control, name] of [[topic,'topic'], [format,'format'], [concept,'concept']]) control.value = parameters.get(name) || '';
  let catalog, pagefind, matches = [], shown = 0, request = 0, timer;
  const base = browser.dataset.base;
  const make = (tag, className, text) => { const element = document.createElement(tag); if (className) element.className = className; if (text) element.textContent = text; return element; };

  function card(guide, excerpt) {
    const article = make('article', 'search-result');
    const meta = make('div', 'card-meta');
    meta.append(make('span', '', guide.topicName), make('span', '', guide.format));
    const heading = make('h2'); const link = make('a', '', guide.title); link.href = guide.href; heading.append(link);
    const description = make('p');
    if (excerpt) {
      // Only Pagefind's highlight markers are retained; all other HTML is text.
      const parsed = new DOMParser().parseFromString(excerpt, 'text/html');
      const append = (node, parent) => {
        if (node.nodeType === Node.TEXT_NODE) parent.append(document.createTextNode(node.textContent));
        else if (node.nodeName === 'MARK') { const mark = make('mark'); for (const child of node.childNodes) append(child, mark); parent.append(mark); }
        else for (const child of node.childNodes) append(child, parent);
      };
      for (const child of parsed.body.childNodes) append(child, description);
    } else description.textContent = guide.summary;
    const bottom = make('div', 'card-bottom');
    const tags = make('div', 'tags');
    for (const id of guide.concepts.slice(0, 3)) {
      const item = catalog.concepts.find(item => item.id === id);
      if (item) { const tag = make('a', '', item.name); tag.href = `${base}concepts/${id}/`; tags.append(tag); }
    }
    bottom.append(tags, make('span', 'reading-time', `${guide.minutes} min read`));
    article.append(meta, heading, description, bottom);
    return article;
  }

  async function showMore(currentRequest) {
    more.disabled = true;
    const batch = matches.slice(shown, shown + 20);
    const cards = await Promise.all(batch.map(async match => {
      if (!match.data) return card(match);
      const data = await match.data();
      const guide = catalog.guides.find(guide => guide.slug === data.meta.slug);
      return guide ? card(guide, data.excerpt) : null;
    }));
    if (currentRequest !== request) return;
    for (const item of cards) if (item) results.append(item);
    shown += batch.length;
    more.hidden = shown >= matches.length;
    more.disabled = false;
    results.setAttribute('aria-busy', 'false');
  }

  async function search(updateHistory = true) {
    if (!catalog) return;
    const currentRequest = ++request;
    shown = 0;
    results.replaceChildren();
    results.setAttribute('aria-busy', 'true');
    more.hidden = true;
    notice.hidden = true;
    const query = input.value.trim();
    if (updateHistory) {
      const params = new URLSearchParams();
      for (const [key, value] of [['q',query],['topic',topic.value],['format',format.value],['concept',concept.value]]) if (value) params.set(key,value);
      history.replaceState(null, '', location.pathname + (params.size ? `?${params}` : ''));
    }
    const filters = {};
    if (topic.value) filters.topic = topic.value;
    if (format.value) filters.format = format.value;
    if (concept.value) filters.concept = concept.value;
    status.textContent = query ? 'Searching the collection…' : 'Browsing the collection…';
    context.textContent = '';
    try {
      if (query) {
        if (!pagefind) pagefind = await import(/* @vite-ignore */ `${base}pagefind/pagefind.js`);
        const found = await pagefind.search(query, { filters });
        if (currentRequest !== request) return;
        matches = found.results;
      } else matches = catalog.guides.filter(guide => (!topic.value || guide.topic === topic.value) && (!format.value || guide.format === format.value) && (!concept.value || guide.concepts.includes(concept.value)));
    } catch {
      if (currentRequest !== request) return;
      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
      matches = catalog.guides.filter(guide => {
        const aliases = guide.concepts.flatMap(id => { const item = catalog.concepts.find(item => item.id === id); return item ? [item.name, ...item.aliases] : []; });
        const searchable = `${guide.title} ${guide.summary} ${aliases.join(' ')}`.toLowerCase();
        return (!topic.value || guide.topic === topic.value) && (!format.value || guide.format === format.value) && (!concept.value || guide.concepts.includes(concept.value)) && terms.every(term => searchable.includes(term));
      });
      notice.textContent = 'Full-text search is temporarily unavailable. Showing matches from titles, summaries, and concept labels.';
      notice.hidden = false;
    }
    if (currentRequest !== request) return;
    status.textContent = `${matches.length.toLocaleString()} ${matches.length === 1 ? 'guide' : 'guides'}${query ? ` for “${query}”` : ''}`;
    context.textContent = concept.value ? concept.options[concept.selectedIndex].text : query ? 'Ranked by relevance' : 'A–Z by title';
    if (!matches.length) {
      const empty = make('div', 'empty-state');
      empty.append(make('h2','','No guides found'), make('p','','Try a broader term, an abbreviation, or fewer filters. “PCA”, “regularization”, and “Python” are good starting points.'));
      results.append(empty);
      results.setAttribute('aria-busy','false');
    } else {
      try { await showMore(currentRequest); }
      catch { status.textContent = 'Search results could not be loaded. Try searching again.'; results.setAttribute('aria-busy','false'); }
    }
  }
  document.querySelector('#library-search').addEventListener('submit', event => { event.preventDefault(); clearTimeout(timer); search(); });
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => search(), 220); });
  for (const select of [topic, format, concept]) select.addEventListener('change', () => search());
  document.querySelector('#clear-filters').addEventListener('click', () => { input.value=''; topic.value=''; format.value=''; concept.value=''; search(); input.focus(); });
  more.addEventListener('click', () => showMore(request));
  fetch(browser.dataset.catalog).then(response => { if (!response.ok) throw new Error('Catalog unavailable'); return response.json(); }).then(data => { catalog=data; search(false); }).catch(() => {
    status.textContent = 'The library could not be loaded. Please refresh to try again.';
    results.setAttribute('aria-busy', 'false');
  });
}
