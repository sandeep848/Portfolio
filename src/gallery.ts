type GalleryOptions = { reduced: () => boolean; onMove?: () => void };

// A native horizontal rail with a gentle automatic sweep. It never scrolls the page.
export function createGallery(options: GalleryOptions) {
  const section = document.querySelector<HTMLElement>('#projects')!;
  const viewport = section.querySelector<HTMLElement>('.rail-viewport')!;
  const track = section.querySelector<HTMLElement>('.project-track')!;
  const all = [...track.querySelectorAll<HTMLElement>('.project-card')];
  const filters = [...section.querySelectorAll<HTMLButtonElement>('[data-filter]')];
  const previous = section.querySelector<HTMLButtonElement>('#project-prev')!;
  const next = section.querySelector<HTMLButtonElement>('#project-next')!;
  const autoplay = section.querySelector<HTMLButtonElement>('#project-autoplay')!;
  const range = section.querySelector<HTMLInputElement>('#rail-range')!;
  const count = section.querySelector('#project-count')!;
  const currentLabel = section.querySelector('#rail-current')!;
  const totalLabel = section.querySelector('#rail-total')!;
  const instruction = section.querySelector('.rail-instruction')!;
  const cleanups: (() => void)[] = [];
  let visible = all.slice(), positions: number[] = [], widths: number[] = [];
  let current = 0, distance = 0, direction = 1, position = 0;
  let renderFrame = 0, autoFrame = 0, lastTime = 0, resumeAt = 0;
  let disposed = false, inView = false, hovered = false, touching = false;
  let focusWithin = false, userPaused = false;
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  function listen(target: EventTarget, name: string, fn: EventListener, opts?: AddEventListenerOptions) {
    target.addEventListener(name, fn, opts);
    cleanups.push(() => target.removeEventListener(name, fn, opts));
  }
  function render() {
    renderFrame = 0;
    if (disposed || !visible.length) return;
    const x = viewport.scrollLeft;
    current = positions.reduce((nearest, at, i) => Math.abs(at - x) < Math.abs(positions[nearest] - x) ? i : nearest, 0);
    options.onMove?.();
    currentLabel.textContent = String(current + 1).padStart(2, '0');
    range.value = String(current + 1);
    range.setAttribute('aria-valuetext', `${current + 1} of ${visible.length}: ${visible[current].querySelector('h3')!.textContent}`);
    range.style.setProperty('--rail-fill', `${current / Math.max(1, visible.length - 1) * 100}%`);
    previous.disabled = current === 0;
    next.disabled = current === visible.length - 1;
    visible.forEach((card, i) => {
      const center = positions[i] - x + widths[i] * .5;
      const offset = clamp((center - viewport.clientWidth * .35) / (viewport.clientWidth * .7), -1, 1);
      card.style.setProperty('--card-turn', options.reduced() ? '0deg' : `${(-offset * 2).toFixed(2)}deg`);
      card.style.setProperty('--card-y', options.reduced() ? '0px' : `${(Math.abs(offset) * 3).toFixed(2)}px`);
    });
  }
  function queueRender() { if (!renderFrame && !disposed) renderFrame = requestAnimationFrame(render); }
  function canPlay() {
    return !disposed && inView && !document.hidden && !options.reduced() && !userPaused && !hovered && !touching && !focusWithin && distance > 1;
  }
  function stop() {
    cancelAnimationFrame(autoFrame);
    autoFrame = 0;
    lastTime = 0;
  }
  function tick(time: number) {
    autoFrame = 0;
    if (!canPlay()) { lastTime = 0; return; }
    const elapsed = lastTime ? Math.min(time - lastTime, 48) : 0;
    lastTime = time;
    if (time >= resumeAt) {
      // Keep fractional pixels between frames, including on browsers that round scrollLeft.
      position = clamp(position + direction * 34 * elapsed / 1000, 0, distance);
      viewport.scrollLeft = position;
      if (position >= distance || position <= 0) {
        direction = position >= distance ? -1 : 1;
        resumeAt = time + 1600;
      }
    } else position = viewport.scrollLeft;
    autoFrame = requestAnimationFrame(tick);
  }
  function syncPlayback() {
    autoplay.hidden = false;
    autoplay.disabled = options.reduced();
    autoplay.setAttribute('aria-pressed', String(!userPaused && !options.reduced()));
    autoplay.textContent = options.reduced() ? 'Auto scroll off' : userPaused ? 'Play auto scroll' : 'Pause auto scroll';
    autoplay.setAttribute('aria-label', options.reduced() ? 'Automatic scrolling is off for reduced motion' : userPaused ? 'Play automatic project scrolling' : 'Pause automatic project scrolling');
    instruction.textContent = options.reduced() ? 'Swipe or use the arrows' : 'Auto scroll · hover to pause';
    viewport.classList.toggle('auto-gallery', !options.reduced());
    if (canPlay()) {
      if (!autoFrame) { position = viewport.scrollLeft; lastTime = 0; autoFrame = requestAnimationFrame(tick); }
    } else stop();
  }
  function interactionPause() {
    resumeAt = performance.now() + 8000;
    position = viewport.scrollLeft;
  }
  function refresh(reset = false) {
    if (disposed) return;
    stop();
    const oldIndex = reset ? 0 : Math.min(current, visible.length - 1);
    viewport.scrollLeft = 0;
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    // Enough tail space to bring even the final card fully into view.
    track.style.setProperty('--rail-tail', `${Math.max(pad, viewport.clientWidth - visible[0].offsetWidth - pad)}px`);
    positions = visible.map(card => card.offsetLeft - visible[0].offsetLeft);
    widths = visible.map(card => card.offsetWidth);
    distance = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    viewport.scrollLeft = clamp(positions[oldIndex] || 0, 0, distance);
    position = viewport.scrollLeft;
    if (reset) direction = 1;
    range.max = String(visible.length);
    totalLabel.textContent = String(visible.length).padStart(2, '0');
    count.textContent = `${visible.length} projects`;
    resumeAt = performance.now() + 1800;
    render();
    syncPlayback();
  }
  function choose(index: number, immediate = false) {
    interactionPause();
    index = clamp(index, 0, visible.length - 1);
    viewport.scrollTo({ left: clamp(positions[index], 0, distance), behavior: immediate || options.reduced() ? 'instant' : 'smooth' });
  }
  listen(viewport, 'scroll', queueRender, { passive: true });
  listen(previous, 'click', () => choose(current - 1));
  listen(next, 'click', () => choose(current + 1));
  listen(range, 'input', () => choose(Number(range.value) - 1, true));
  listen(autoplay, 'click', () => {
    userPaused = !userPaused;
    if (!userPaused) resumeAt = performance.now();
    syncPlayback();
  });
  listen(viewport, 'pointerenter', event => {
    if ((event as PointerEvent).pointerType !== 'mouse') return;
    hovered = true; syncPlayback();
  });
  listen(viewport, 'pointerleave', event => {
    if ((event as PointerEvent).pointerType !== 'mouse') return;
    hovered = false; resumeAt = Math.max(resumeAt, performance.now() + 1200); syncPlayback();
  });
  listen(viewport, 'pointerdown', () => { touching = true; interactionPause(); syncPlayback(); }, { passive: true });
  const release = () => {
    if (!touching) return;
    touching = false; interactionPause(); syncPlayback();
  };
  listen(window, 'pointerup', release, { passive: true });
  listen(window, 'pointercancel', release, { passive: true });
  listen(viewport, 'wheel', interactionPause, { passive: true });
  listen(viewport, 'keydown', event => {
    interactionPause();
    const key = event as KeyboardEvent;
    if (key.target !== viewport) return;
    if (key.key === 'ArrowRight' || key.key === 'ArrowLeft') { key.preventDefault(); choose(current + (key.key === 'ArrowRight' ? 1 : -1)); }
    if (key.key === 'Home' || key.key === 'End') { key.preventDefault(); choose(key.key === 'Home' ? 0 : visible.length - 1); }
  });
  listen(viewport, 'focusin', event => {
    focusWithin = true; syncPlayback();
    const card = (event.target as HTMLElement).closest<HTMLElement>('.project-card');
    if (!card) return;
    const index = visible.indexOf(card);
    if (index >= 0 && (positions[index] < viewport.scrollLeft || positions[index] + widths[index] > viewport.scrollLeft + viewport.clientWidth)) choose(index, true);
  });
  listen(viewport, 'focusout', event => {
    focusWithin = viewport.contains((event as FocusEvent).relatedTarget as Node | null);
    if (!focusWithin) interactionPause();
    syncPlayback();
  });
  filters.forEach(button => listen(button, 'click', () => {
    all.forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.group !== button.dataset.filter; });
    visible = all.filter(card => !card.hidden);
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    refresh(true);
    interactionPause();
  }));
  listen(document, 'visibilitychange', syncPlayback);
  const visibility = new IntersectionObserver(entries => {
    inView = entries[0].intersectionRatio >= .2;
    if (inView) resumeAt = Math.max(resumeAt, performance.now() + 1200);
    syncPlayback();
  }, { threshold: [0, .2] });
  visibility.observe(viewport);
  return {
    refresh,
    get progress() { return distance ? viewport.scrollLeft / distance : 0; },
    dispose() { disposed = true; stop(); cancelAnimationFrame(renderFrame); visibility.disconnect(); cleanups.forEach(fn => fn()); }
  };
}
