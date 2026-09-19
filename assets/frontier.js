/* Progressive enhancement: all content and repository links work without JS. */
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = document.querySelector('#motion-toggle');
  let userPaused = false;
  const motion = { paused: reduced.matches };
  window.frontierMotion = motion;

  function applyMotion() {
    motion.paused = userPaused || reduced.matches;
    root.classList.toggle('motion-paused', motion.paused);
    motionButton.hidden = false;
    motionButton.setAttribute('aria-pressed', String(motion.paused));
    motionButton.disabled = reduced.matches;
    motionButton.textContent = reduced.matches ? 'Reduced motion ✓' : motion.paused ? 'Resume motion ▷' : 'Pause motion Ⅱ';
    document.dispatchEvent(new CustomEvent('frontier:motion', {detail: {paused: motion.paused}}));
  }
  motionButton.addEventListener('click', () => { userPaused = !userPaused; applyMotion(); });
  reduced.addEventListener('change', applyMotion);
  applyMotion();

  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('#navigation');
  const navLinks = [...nav.querySelectorAll('a')];
  function menu(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  }
  menuButton.addEventListener('click', () => menu(menuButton.getAttribute('aria-expanded') !== 'true'));
  navLinks.forEach(link => link.addEventListener('click', () => menu(false)));
  document.addEventListener('keydown', event => {
    if (menuButton.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') { menu(false); menuButton.focus(); }
    if (event.key === 'Tab') {
      const controls = [menuButton, ...navLinks];
      const index = controls.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1).focus(); }
      else if (!event.shiftKey && index === controls.length - 1) { event.preventDefault(); menuButton.focus(); }
    }
  });
  matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) menu(false); });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('pending');
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }), {threshold:.08,rootMargin:'0px 0px -12px 0px'});
    document.querySelectorAll('.reveal').forEach(el => {
      if (el.getBoundingClientRect().top > innerHeight && !motion.paused) el.classList.add('pending');
      revealObserver.observe(el);
    });
    const artObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      entry.target.style.setProperty('--play', entry.isIntersecting && !document.hidden ? 'running' : 'paused');
    }));
    document.querySelectorAll('.feature-art').forEach(el => artObserver.observe(el));
  }
  document.addEventListener('visibilitychange', () => {
    document.querySelectorAll('.feature-art').forEach(el => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--play', !document.hidden && rect.bottom > 0 && rect.top < innerHeight ? 'running' : 'paused');
    });
  });

  const grid = document.querySelector('#project-grid');
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const search = document.querySelector('#project-search');
  const result = document.querySelector('#project-results');
  let filter = 'all';
  function filterProjects() {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    for (const card of grid.children) {
      const match = (filter === 'all' || card.dataset.category === filter) && card.textContent.toLowerCase().includes(query);
      card.hidden = !match;
      if (match) visible++;
    }
    document.querySelector('#empty-state').hidden = visible !== 0;
    result.textContent = `${visible} ${visible === 1 ? 'project' : 'projects'}`;
    document.querySelector('#project-count').textContent = grid.children.length;
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    filterProjects();
  }));
  search.addEventListener('input', filterProjects);
  filterProjects();

  // The public GitHub endpoint cannot reveal private repositories. No token is used.
  // A complete paginated response is required before reconciling the snapshot.
  async function syncProjects() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const repos = [];
      for (let page = 1; page <= 10; page++) {
        const response = await fetch(`https://api.github.com/users/sandeep848/repos?type=owner&per_page=100&page=${page}`, {signal:controller.signal,headers:{Accept:'application/vnd.github+json'}});
        if (!response.ok) throw new Error(`GitHub ${response.status}`);
        const batch = await response.json();
        if (!Array.isArray(batch)) throw new Error('Invalid repository response');
        repos.push(...batch);
        if (batch.length < 100) break;
        if (page === 10) throw new Error('Incomplete repository list');
      }
      const projects = repos.filter(repo => repo.owner?.login === 'sandeep848' && repo.private === false && !['portfolio','sandeep848'].includes(repo.name.toLowerCase()));
      if (!projects.length) throw new Error('Empty repository response');
      const byName = new Map(projects.map(repo => [repo.name.toLowerCase(),repo]));
      for (const card of [...grid.children]) {
        const repo = byName.get(card.dataset.repo.toLowerCase());
        if (!repo) { card.remove(); continue; }
        card.href = `https://github.com/sandeep848/${encodeURIComponent(repo.name)}`;
        byName.delete(repo.name.toLowerCase());
      }
      for (const repo of byName.values()) {
        const card = document.createElement('a');
        card.className = 'project-item'; card.dataset.repo = repo.name; card.dataset.category = 'other';
        card.href = `https://github.com/sandeep848/${encodeURIComponent(repo.name)}`;
        card.target = '_blank'; card.rel = 'noopener noreferrer';
        card.setAttribute('aria-label', `${repo.name} on GitHub`);
        const top = document.createElement('div'); top.className = 'project-item-top'; top.textContent = 'PUBLIC REPOSITORY ↗';
        const title = document.createElement('h3'); title.textContent = repo.name.replace(/[-_]/g,' ');
        const description = document.createElement('p'); description.textContent = repo.description || 'Explore the source, documentation, and latest updates on GitHub.';
        const bottom = document.createElement('div'); bottom.className = 'project-item-bottom'; bottom.textContent = repo.language || 'Source & documentation';
        card.append(top,title,description,bottom); grid.append(card);
      }
      filterProjects();
      document.querySelector('#sync-status').textContent = 'Synced with public GitHub repositories';
    } catch {
      document.querySelector('#sync-status').textContent = 'Curated snapshot · live sync unavailable';
    } finally { clearTimeout(timeout); }
  }
  // Start only near the project archive, keeping the hero's critical path small.
  if ('IntersectionObserver' in window) {
    const syncObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { syncObserver.disconnect(); syncProjects(); }
    }, {rootMargin:'700px'});
    syncObserver.observe(grid);
  } else { syncProjects(); }

  // Three.js is a local, pinned dependency; the original scene is independently authored.
  function loadScript(src) {
    return new Promise((resolve,reject) => {
      const script = document.createElement('script'); script.src = src;
      script.onload = resolve; script.onerror = reject; document.head.append(script);
    });
  }
  const beginScene = () => loadScript('assets/vendor/three.min.js').then(() => loadScript('assets/frontier-scene.js?v=1')).catch(() => {
    document.querySelector('#scene').dataset.status = 'illustration';
  });
  // Respect data-saving preferences: the illustration is already fully rendered.
  if (!navigator.connection?.saveData) {
    if ('requestIdleCallback' in window) requestIdleCallback(beginScene,{timeout:1600});
    else setTimeout(beginScene,350);
  }
})();
