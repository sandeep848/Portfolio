type GalleryOptions = { reduced: () => boolean };

// Native horizontal gestures, normal vertical page scrolling, and a seamless ring.
export function createGallery(options: GalleryOptions) {
  const section = document.querySelector<HTMLElement>('#projects')!;
  const viewport = section.querySelector<HTMLElement>('.rail-viewport')!;
  const track = section.querySelector<HTMLElement>('.project-track')!;
  const originals = [...track.querySelectorAll<HTMLElement>('.project-card')];
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
  let visible = originals.slice(), offsets: number[] = [];
  let current = 0, cycle = 0, origin = 0, position = 0;
  let frame = 0, lastTime = 0, resumeAt = 0;
  let disposed = false, inView = false, touching = false, focusWithin = false;
  let userPaused = false, looping = false, manualUntil = 0;
  const mod = (value: number, length: number) => ((value % length) + length) % length;
  const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));
  function listen(target: EventTarget, name: string, fn: EventListener, opts?: AddEventListenerOptions) {
    target.addEventListener(name, fn, opts);
    cleanups.push(() => target.removeEventListener(name, fn, opts));
  }
  function render() {
    if (disposed || !visible.length) return;
    const x = looping ? mod(viewport.scrollLeft - origin, cycle) : viewport.scrollLeft;
    const nearest = offsets.reduce((best, at, i) => Math.abs(at - x) < Math.abs(offsets[best] - x) ? i : best, 0);
    current = looping && x > (offsets[offsets.length - 1] + cycle) / 2 ? 0 : nearest;
    currentLabel.textContent = String(current + 1).padStart(2, '0');
    range.value = String(current + 1);
    range.setAttribute('aria-valuetext', `${current + 1} of ${visible.length}: ${visible[current].querySelector('h3')!.textContent}`);
    range.style.setProperty('--rail-fill', `${current / Math.max(1, visible.length - 1) * 100}%`);
    previous.disabled = visible.length < 2 || (!looping && current === 0);
    next.disabled = visible.length < 2 || (!looping && current === visible.length - 1);
  }
  function canPlay() {
    return !disposed && inView && !document.hidden && looping && !userPaused && !touching && !focusWithin;
  }
  function stop() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  function normalize(x: number) { return origin + mod(x - origin, cycle); }
  function tick(time: number) {
    frame = 0;
    if (!canPlay()) { lastTime = 0; return; }
    const elapsed = lastTime ? Math.min(time - lastTime, 48) : 0;
    lastTime = time;
    if (time >= resumeAt) {
      // Fractional accumulator avoids rounding drift; equivalent copies hide the wrap.
      position = normalize(position + 28 * elapsed / 1000);
      viewport.scrollLeft = position;
    } else position = viewport.scrollLeft;
    frame = requestAnimationFrame(tick);
  }
  function syncPlayback() {
    autoplay.hidden = false;
    autoplay.disabled = options.reduced();
    autoplay.setAttribute('aria-pressed', String(!userPaused && !options.reduced()));
    autoplay.textContent = options.reduced() ? 'Auto scroll off' : userPaused ? 'Play auto scroll' : 'Pause auto scroll';
    autoplay.setAttribute('aria-label', options.reduced() ? 'Automatic scrolling is off for reduced motion' : userPaused ? 'Play automatic project scrolling' : 'Pause automatic project scrolling');
    instruction.textContent = options.reduced() ? 'Swipe to browse · scroll to explore' : 'Always moving · scroll freely';
    viewport.classList.toggle('auto-gallery', looping);
    if (canPlay()) {
      if (!frame) { position = viewport.scrollLeft; lastTime = 0; frame = requestAnimationFrame(tick); }
    } else stop();
  }
  function pauseForInteraction(delay = 1000) {
    resumeAt = performance.now() + delay;
    manualUntil = resumeAt;
    position = viewport.scrollLeft;
  }
  function copyCard(card: HTMLElement) {
    const copy = card.cloneNode(true) as HTMLElement;
    copy.dataset.galleryCopy = 'true';
    copy.setAttribute('aria-hidden', 'true');
    copy.removeAttribute('aria-labelledby');
    copy.removeAttribute('id');
    copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    copy.querySelectorAll<HTMLElement>('a,button,input,[tabindex]').forEach(node => node.tabIndex = -1);
    return copy;
  }
  function refresh(reset = false) {
    if (disposed) return;
    stop();
    const selected = reset ? 0 : Math.min(current, visible.length - 1);
    track.querySelectorAll('[data-gallery-copy]').forEach(node => node.remove());
    looping = !options.reduced() && visible.length > 1;
    viewport.classList.toggle('auto-gallery', looping);
    viewport.scrollLeft = 0;
    track.style.removeProperty('--rail-tail');
    const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
    offsets = visible.map(card => card.offsetLeft - visible[0].offsetLeft);
    cycle = offsets[offsets.length - 1] + visible[visible.length - 1].offsetWidth + gap;
    origin = 0;
    if (looping && cycle > 0) {
      const before = document.createDocumentFragment();
      visible.forEach(card => before.append(copyCard(card)));
      track.prepend(before);
      // Extra trailing cycles also cover wide screens when a filter has only 3 cards.
      const after = document.createDocumentFragment();
      const repetitions = Math.ceil(viewport.clientWidth / cycle) + 1;
      for (let n = 0; n < repetitions; n++) visible.forEach(card => after.append(copyCard(card)));
      track.append(after);
      origin = visible[0].offsetLeft - (track.firstElementChild as HTMLElement).offsetLeft;
    } else {
      const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      track.style.setProperty('--rail-tail', `${Math.max(pad, viewport.clientWidth - visible[visible.length - 1].offsetWidth - pad)}px`);
    }
    viewport.scrollLeft = origin + (offsets[selected] || 0);
    position = viewport.scrollLeft;
    range.max = String(visible.length);
    totalLabel.textContent = String(visible.length).padStart(2, '0');
    count.textContent = `${visible.length} projects`;
    resumeAt = performance.now();
    render(); syncPlayback();
  }
  function choose(index: number, immediate = false, direction = 0) {
    pauseForInteraction(1400);
    const target = looping ? mod(index, visible.length) : clamp(index, visible.length - 1);
    let left = origin + offsets[target];
    if (looping) {
      // Pick the closest equivalent card in the requested direction.
      const local = normalize(viewport.scrollLeft);
      viewport.scrollLeft = local;
      if (direction > 0 && left <= local + 2) left += cycle;
      if (direction < 0 && left >= local - 2) left -= cycle;
    }
    viewport.scrollTo({ left, behavior: immediate || options.reduced() ? 'instant' : 'smooth' });
  }
  listen(viewport, 'scroll', () => {
    // Rebase only after a native drag or smooth button movement has settled.
    if (looping && !touching && !focusWithin && performance.now() >= manualUntil) {
      const x = viewport.scrollLeft;
      if (x < origin - .5 || x >= origin + cycle) {
        viewport.scrollLeft = normalize(x);
        position = viewport.scrollLeft;
      }
    }
    render();
  }, { passive: true });
  listen(previous, 'click', () => choose(current - 1, false, -1));
  listen(next, 'click', () => choose(current + 1, false, 1));
  listen(range, 'input', () => choose(Number(range.value) - 1, true));
  listen(autoplay, 'click', () => { userPaused = !userPaused; resumeAt = performance.now(); syncPlayback(); });
  // Hover never interrupts the continuous loop. Deliberate pointer/focus actions do.
  listen(viewport, 'pointerdown', () => { touching = true; pauseForInteraction(); syncPlayback(); }, { passive: true });
  const release = () => { if (touching) { touching = false; pauseForInteraction(800); syncPlayback(); } };
  listen(window, 'pointerup', release, { passive: true });
  listen(window, 'pointercancel', release, { passive: true });
  listen(viewport, 'wheel', event => {
    const wheel = event as WheelEvent;
    if (Math.abs(wheel.deltaX) > Math.abs(wheel.deltaY) || wheel.shiftKey) pauseForInteraction();
    // Never preventDefault: vertical wheel events belong to the page.
  }, { passive: true });
  listen(viewport, 'keydown', event => {
    const key = event as KeyboardEvent;
    if (key.target !== viewport) return;
    if (key.key === 'ArrowRight' || key.key === 'ArrowLeft') { key.preventDefault(); const direction = key.key === 'ArrowRight' ? 1 : -1; choose(current + direction, false, direction); }
    if (key.key === 'Home' || key.key === 'End') { key.preventDefault(); choose(key.key === 'Home' ? 0 : visible.length - 1); }
  });
  listen(viewport, 'focusin', event => {
    focusWithin = true; syncPlayback();
    const card = (event.target as HTMLElement).closest<HTMLElement>('.project-card');
    if (!card || card.dataset.galleryCopy) return;
    const index = visible.indexOf(card);
    if (index < 0) return;
    const left = origin + offsets[index];
    if (left < viewport.scrollLeft || left + card.offsetWidth > viewport.scrollLeft + viewport.clientWidth) choose(index, true);
  });
  listen(viewport, 'focusout', event => {
    focusWithin = viewport.contains((event as FocusEvent).relatedTarget as Node | null);
    if (!focusWithin) pauseForInteraction(500);
    syncPlayback();
  });
  filters.forEach(button => listen(button, 'click', () => {
    originals.forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.group !== button.dataset.filter; });
    visible = originals.filter(card => !card.hidden);
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    refresh(true);
  }));
  listen(document, 'visibilitychange', syncPlayback);
  const visibility = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; syncPlayback(); }, { threshold: 0 });
  visibility.observe(viewport);
  return { refresh, dispose() { disposed = true; stop(); visibility.disconnect(); cleanups.forEach(fn => fn()); track.querySelectorAll('[data-gallery-copy]').forEach(node => node.remove()); } };
}
