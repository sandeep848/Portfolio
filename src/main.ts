import './style.css';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import type { TransitionScene } from './scene';

gsap.registerPlugin(ScrollTrigger);
const root = document.documentElement;
const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
root.style.setProperty('--new-image', `url("${asset('assets/new-school.webp')}")`);
const reducedPreference = matchMedia('(prefers-reduced-motion: reduce)');
const touch = matchMedia('(pointer: coarse)');
const motionButton = $<HTMLButtonElement>('#motion-toggle');
let manualReduced = false;
try { manualReduced = localStorage.getItem('portfolio-reduced-motion') === 'true'; } catch { /* Storage is optional. */ }
let reduced = reducedPreference.matches || manualReduced;
let lenis: Lenis | undefined;
let scene: TransitionScene | undefined;
let disposed = false;
let progress = 0;
let sceneVisible = true;
let lastYear = -1;
const canvas = $<HTMLCanvasElement>('#transition-canvas');
const shift = $('#shift');
const oldHeading = $('.shift-old');
const newHeading = $('.shift-new');
const eraLabel = $('#era-label');
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const ease = (value: number) => { const x = clamp(value); return x * x * (3 - 2 * x); };

// Rolling digit columns are decorative; the adjacent label gives the era in text.
const odometer = $('#odometer');
for (let column = 0; column < 4; column++) {
  const wrapper = document.createElement('span');
  const reel = document.createElement('i');
  for (let digit = 0; digit < 10; digit++) {
    const cell = document.createElement('b'); cell.textContent = String(digit); reel.append(cell);
  }
  wrapper.append(reel); odometer.append(wrapper);
}
const reels = [...odometer.querySelectorAll('i')];

function updateShift(value: number, velocity = 0) {
  progress = clamp(value);
  const blend = ease((progress - .25) / .35);
  root.style.setProperty('--era', blend.toFixed(4));
  root.style.setProperty('--shift-progress', progress.toFixed(4));
  const oldOut = ease((progress - .27) / .14);
  const newIn = ease((progress - .43) / .18);
  oldHeading.style.opacity = String(1 - oldOut);
  oldHeading.style.transform = reduced ? 'none' : `translateY(${-oldOut * 25}px)`;
  newHeading.style.opacity = String(newIn);
  newHeading.style.clipPath = reduced ? 'none' : `inset(${(1 - newIn) * 100}% 0 0 0)`;
  newHeading.style.transform = reduced ? 'none' : `translateY(${(1 - newIn) * 20}px)`;
  oldHeading.setAttribute('aria-hidden', String(blend >= .5));
  newHeading.setAttribute('aria-hidden', String(blend < .5));
  const year = Math.round(1969 + blend * 57);
  if (year !== lastYear) {
    const digits = String(year).split('');
    reels.forEach((reel, i) => { reel.style.transform = `translateY(-${Number(digits[i]) * 1.12}em)`; });
    lastYear = year;
  }
  eraLabel.textContent = blend < .5 ? '1969 · FOUNDATIONS' : '2026 · FRONTIER';
  scene?.update(progress, reduced ? 0 : velocity);
}

const shiftTrigger = ScrollTrigger.create({
  id: 'era-shift', trigger: shift, start: 'top top', end: 'bottom bottom',
  onUpdate(self) { updateShift(self.progress, self.getVelocity()); },
  onRefresh(self) { updateShift(self.progress); }
});

const scrollBar = $('.scroll-progress i');
const nav = $('.nav');
const gauges = $('.gauges');
let scrollRequested = false;
function updatePage() {
  const y = window.scrollY;
  scrollBar.style.transform = `scaleX(${clamp(y / Math.max(1, document.documentElement.scrollHeight - innerHeight))})`;
  nav.classList.toggle('scrolled', y > 35);
  gauges.style.opacity = String(1 - clamp(y / (innerHeight * .55)));
  const end = shift.offsetTop + shift.offsetHeight;
  sceneVisible = y < end + innerHeight * .3;
  scene?.setVisible(sceneVisible);
  scrollRequested = false;
}
function onScroll() {
  if (!scrollRequested) { scrollRequested = true; requestAnimationFrame(updatePage); }
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });

// Fine-pointer wheel smoothing leaves touch, keyboard, scrollbar dragging and
// reduced-motion scrolling native. No input is captured by the pinned chapter.
function lenisTick(time: number) { lenis?.raf(time * 1000); }
function configureMotion() {
  reduced = reducedPreference.matches || manualReduced;
  root.classList.toggle('reduced-motion', reduced);
  motionButton.setAttribute('aria-pressed', String(reduced));
  motionButton.textContent = reduced ? 'Reduced motion on' : 'Reduce motion';
  lenis?.destroy(); lenis = undefined; gsap.ticker.remove(lenisTick);
  if (!reduced && !touch.matches) {
    lenis = new Lenis({ duration: .8, smoothWheel: true, syncTouch: false, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(lenisTick);
  }
  scene?.setReduced(reduced);
  updateShift(progress);
}
motionButton.addEventListener('click', () => {
  if (reducedPreference.matches) return; // Respect the system preference.
  manualReduced = !manualReduced;
  try { localStorage.setItem('portfolio-reduced-motion', String(manualReduced)); } catch { /* Optional. */ }
  configureMotion();
});
reducedPreference.addEventListener('change', configureMotion);
touch.addEventListener('change', configureMotion);
configureMotion();

// The old Kage anchors remain valid in emails and existing external links.
const aliases: Record<string, string> = { '#gate': '#about', '#pathways': '#work', '#lessons': '#archive', '#eternity': '#contact', '#hero': '#top' };
function destination(hash: string) { return aliases[hash] || hash; }
function goTo(hash: string, immediate = false) {
  const target = document.getElementById(destination(hash).slice(1));
  if (!target) return;
  const offset = target.id === 'top' ? 0 : 90;
  if (lenis && !immediate) lenis.scrollTo(target, { offset: -offset, duration: .85 });
  else window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - offset, behavior: 'instant' });
  target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true });
}
const menu = $<HTMLButtonElement>('.menu-button');
const navigation = $('#navigation');
function closeMenu(restoreFocus = false) {
  document.body.classList.remove('menu-open'); menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Open navigation'); menu.querySelector('span')!.textContent = '+';
  if (restoreFocus) menu.focus();
}
menu.addEventListener('click', () => {
  const open = !document.body.classList.contains('menu-open');
  document.body.classList.toggle('menu-open', open); menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); menu.querySelector('span')!.textContent = open ? '−' : '+';
});
document.addEventListener('keydown', event => {
  if (!document.body.classList.contains('menu-open')) return;
  if (event.key === 'Escape') { closeMenu(true); return; }
  if (event.key === 'Tab') {
    const controls: HTMLElement[] = [menu, ...navigation.querySelectorAll<HTMLAnchorElement>('a')];
    const index = controls.indexOf(document.activeElement as HTMLElement);
    event.preventDefault(); controls[(Math.max(0, index) + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
  }
});
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const hash = link.getAttribute('href')!;
    if (!document.getElementById(destination(hash).slice(1))) return;
    event.preventDefault(); closeMenu(); history.pushState(null, '', destination(hash)); goTo(hash);
  });
});
const hashChange = () => goTo(location.hash, true);
window.addEventListener('hashchange', hashChange);
window.addEventListener('popstate', hashChange);

// Static HTML project rows work without JavaScript; filtering is additive.
const rows = [...document.querySelectorAll<HTMLElement>('.project-row')];
const filterButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-filter]')];
filterButtons.forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter!;
  rows.forEach(row => { row.hidden = filter !== 'all' && row.dataset.era !== filter; });
  filterButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  $('#project-count').textContent = `${rows.filter(row => !row.hidden).length} projects`;
  ScrollTrigger.refresh();
}));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove('await-reveal'); revealObserver.unobserve(entry.target); } });
}, { threshold: .08, rootMargin: '0px 0px -25px 0px' });
document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(element => {
  if (!reduced) element.classList.add('await-reveal'); revealObserver.observe(element);
});
const activeObserver = new IntersectionObserver(entries => {
  const current = entries.find(entry => entry.isIntersecting);
  if (!current) return;
  navigation.querySelectorAll('a').forEach(link => {
    if (link.hash === `#${current.target.id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
}, { rootMargin: '-18% 0px -60% 0px' });
document.querySelectorAll('#about,#work,#archive,#contact').forEach(element => activeObserver.observe(element));

const cursor = $('#cursor-ring');
let pointerX = 0, pointerY = 0, pointerFrame = 0;
const onPointer = (event: PointerEvent) => {
  if (touch.matches || reduced) return;
  pointerX = event.clientX; pointerY = event.clientY;
  if (!pointerFrame) pointerFrame = requestAnimationFrame(() => {
    cursor.style.transform = `translate3d(${pointerX}px,${pointerY}px,0)`;
    document.body.classList.add('pointer-active');
    scene?.pointer(pointerX / innerWidth - .5, pointerY / innerHeight - .5);
    pointerFrame = 0;
  });
};
window.addEventListener('pointermove', onPointer, { passive: true });
document.documentElement.addEventListener('pointerleave', () => document.body.classList.remove('pointer-active'));
document.querySelectorAll<HTMLElement>('.feature-card').forEach(card => {
  card.addEventListener('pointermove', event => {
    if (reduced || touch.matches) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`); card.style.setProperty('--my', `${event.clientY - rect.top}px`);
  });
});

async function loadImages() {
  let loaded = 0;
  const plateImages = [$('#plate-old') as HTMLImageElement, $('#plate-new') as HTMLImageElement];
  await Promise.all(plateImages.map(async image => {
    try { await image.decode(); } catch { /* CSS/solid background still presents all content. */ }
    loaded++; $('#load-percent').innerHTML = `${loaded * 50}<span>%</span>`; $('#load-bar').style.width = `${loaded * 50}%`;
  }));
  $('.loader').classList.add('ready');
  if (disposed) return;
  // Avoid creating a doomed renderer: lack of WebGL is a supported mode, not an error.
  const test = document.createElement('canvas');
  const gl = !reduced && !new URLSearchParams(location.search).has('fallback') ? test.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) : null;
  if (!gl) { root.dataset.renderer = 'css'; return; }
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  try {
    const { createTransition } = await import('./scene');
    if (disposed) return;
    scene = await createTransition(canvas, plateImages[0], plateImages[1]);
    if (disposed) { scene.dispose(); return; }
    scene.setReduced(reduced); scene.setVisible(sceneVisible); updateShift(progress);
  } catch { root.dataset.renderer = 'css'; root.classList.remove('webgl-ready'); }
}
void loadImages();
setTimeout(() => $('.loader').classList.add('ready'), 3500);
void document.fonts.ready.then(() => {
  ScrollTrigger.refresh();
  if (location.hash) { if (aliases[location.hash]) history.replaceState(null, '', destination(location.hash)); goTo(location.hash, true); }
  updatePage();
});
updateShift(shiftTrigger.progress); updatePage();

// BFCache keeps the page alive. Dispose only on a real navigation away.
window.addEventListener('pagehide', event => {
  if (event.persisted) { scene?.setVisible(false); lenis?.stop(); return; }
  disposed = true; lenis?.destroy(); gsap.ticker.remove(lenisTick);
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  scene?.dispose(); revealObserver.disconnect(); activeObserver.disconnect();
  window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll);
  window.removeEventListener('pointermove', onPointer); window.removeEventListener('hashchange', hashChange);
  window.removeEventListener('popstate', hashChange);
  reducedPreference.removeEventListener('change', configureMotion); touch.removeEventListener('change', configureMotion);
  if (pointerFrame) cancelAnimationFrame(pointerFrame);
});
window.addEventListener('pageshow', event => { if (event.persisted) { scene?.setVisible(sceneVisible); lenis?.start(); ScrollTrigger.refresh(); } });
