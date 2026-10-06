const main = document.querySelector('#main');
const search = document.querySelector('#search');
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const normalized = value => value.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
const pathname = location.pathname.replace(/\/+$/, '') || '/';
const menu = document.querySelector('#menu-toggle');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  document.querySelector('#sidebar').classList.toggle('is-open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    menu.setAttribute('aria-expanded', 'false');
    document.querySelector('#sidebar').classList.remove('is-open');
  }
});

try {
  const response = await fetch('/library.json');
  if (!response.ok) throw new Error('Library could not be loaded');
  const library = await response.json();
  const artifacts = [...library.artifacts].sort((a, b) => a.title.localeCompare(b.title));
  const current = artifacts.find(a => a.url.replace(/\/+$/, '') === pathname);
  const categoryTitle = id => library.categories.find(c => c.id === id).title;
  document.querySelector('#home-link').setAttribute('aria-current', pathname === '/' ? 'page' : 'false');
  document.querySelector('#categories').innerHTML = library.categories.map(category => {
    const entries = artifacts.filter(a => a.category === category.id);
    return `<details class="collection" ${category.id === 'acquired' || current?.category === category.id ? 'open' : ''}><summary><span class="chevron" aria-hidden="true">›</span><span>${escape(category.title)}</span><span class="count">${entries.length}</span></summary><div class="collection-pages">${entries.length ? entries.map(a => `<a href="${a.url}" ${current?.id === a.id ? 'aria-current="page"' : ''}>${escape(a.title)}</a>`).join('') : '<p class="empty-collection">No artifacts yet</p>'}</div></details>`;
  }).join('');

  const card = (artifact, query = '') => {
    const chapter = query && artifact.chapters.find(c => normalized(c.title + ' ' + c.text).includes(normalized(query)));
    return `<a class="artifact-card" href="${artifact.url}"><div class="card-icon" aria-hidden="true">${artifact.category === 'acquired' ? 'A' : 'B'}</div><div class="card-copy"><p class="eyebrow">${escape(categoryTitle(artifact.category))} <span> / ${escape(artifact.format)}</span></p><h2>${escape(artifact.title)}</h2><p class="card-subtitle">${escape(artifact.subtitle)}</p><p class="card-description">${escape(artifact.description)}</p>${chapter ? `<p class="match">Found in: ${escape(chapter.title)}</p>` : ''}</div><span class="card-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 18 18 6M6 6h12v12"/></svg></span></a>`;
  };
  function showHome(query = '') {
    const terms = normalized(query.trim()).split(/\s+/).filter(Boolean);
    const results = artifacts.filter(a => {
      const text = normalized([a.title, a.subtitle, a.description, categoryTitle(a.category), ...a.tags, ...a.chapters.map(c => c.title + ' ' + c.text)].join(' '));
      return terms.every(term => text.includes(term));
    });
    main.classList.remove('reading-page');
    main.innerHTML = `<div class="home-content"><div class="topline"><span>THE PERSONAL COLLECTION</span><span>${artifacts.length} ${artifacts.length === 1 ? 'artifact' : 'artifacts'}</span></div><header class="intro"><p class="eyebrow">${query ? 'Search the collection' : 'Stay curious. Return often.'}</p><h1>${query ? 'A little exploration.' : 'Stories worth<br>keeping.'}</h1><p>${query ? `Results for “${escape(query)}”` : 'A growing library of companions to the things I read and listen to. A place to follow an idea, revisit a story, and see how it all connects.'}</p></header><div class="list-heading"><h2>${query ? 'Search results' : 'On the shelf'}</h2><span id="result-count" role="status" aria-live="polite">${results.length} ${results.length === 1 ? 'artifact' : 'artifacts'}</span></div><div class="artifact-list">${results.length ? results.map(a => card(a, query)).join('') : '<div class="empty-state"><h2>No stories found.</h2><p>Try a company, a person, or an idea — like Disney, ownership, or animation.</p><button id="clear-search">Clear search</button></div>'}</div><footer class="home-footer"><span>A small library, with room to grow.</span><span>Podcasts · Books · Ideas</span></footer></div>`;
    document.querySelector('#clear-search')?.addEventListener('click', () => {
      search.value = ''; search.focus(); updateSearch();
    });
  }
  function showArtifact(artifact) {
    main.classList.add('reading-page');
    main.innerHTML = `<div class="reader-bar"><div><a href="/" class="breadcrumb">Library</a><span aria-hidden="true"> / </span><span>${escape(categoryTitle(artifact.category))}</span><h1>${escape(artifact.title)}</h1></div><a class="open-artifact" href="${artifact.file}" target="_blank" rel="noopener">Open full page <span aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 18 18 6M6 6h12v12"/></svg></span></a></div><iframe class="artifact-frame" title="${escape(artifact.title)} — illustrated companion" src="${artifact.file}" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"></iframe>`;
  }
  function updateSearch() {
    const value = search.value.trim();
    const url = new URL(location.href);
    if (value) url.searchParams.set('q', value); else url.searchParams.delete('q');
    history.replaceState(null, '', url);
    if (!value && current) showArtifact(current); else showHome(value);
  }
  document.querySelector('#search-form').addEventListener('submit', event => {
    event.preventDefault(); updateSearch();
    main.focus({ preventScroll: true });
    menu.setAttribute('aria-expanded', 'false');
    document.querySelector('#sidebar').classList.remove('is-open');
  });
  search.addEventListener('input', updateSearch);
  search.value = new URLSearchParams(location.search).get('q') || '';
  if (pathname !== '/' && !current) {
    main.innerHTML = '<div class="home-content"><h1>Page not found.</h1><p><a href="/">Return to the library</a></p></div>';
  } else updateSearch();
} catch (error) {
  main.innerHTML = '<div class="home-content"><h1>The shelf is unavailable.</h1><p>Refresh to try again, or <a href="/artifacts/acquired/the-walt-disney-company.html">open the Disney companion directly</a>.</p></div>';
  console.error(error);
}
