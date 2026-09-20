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
root.style.setProperty('--old-image', `url("${asset('assets/old-school.webp')}")`);
root.style.setProperty('--new-image', `url("${asset('assets/new-school.webp')}")`);
const reducedPreference = matchMedia('(prefers-reduced-motion: reduce)');
const touchPreference = matchMedia('(pointer: coarse)');
const narrowMenu = matchMedia('(max-width: 600px)');
const motionButton = $<HTMLButtonElement>('#motion-toggle');
let manualReduced = false;
try { manualReduced = localStorage.getItem('portfolio-reduced-motion') === 'true'; } catch { /* Storage is optional. */ }
let reduced = reducedPreference.matches || manualReduced;
let lenis: Lenis | undefined;
let scene: TransitionScene | undefined;
let disposed = false;
let imagesReady = false;
let sceneLoading = false;
let sceneUnavailable = new URLSearchParams(location.search).has('fallback');
let backgroundProgress = 0;
const clamp = (v: number, min=0, max=1) => Math.min(max, Math.max(min,v));
const ease = (v: number) => {const x=clamp(v);return x*x*(3-2*x);};
const canvas = $<HTMLCanvasElement>('#transition-canvas');
const plates = [$<HTMLImageElement>('#plate-old'), $<HTMLImageElement>('#plate-new')];

function updateBackground(value: number, velocity=0) {
  backgroundProgress = clamp(value);
  root.style.setProperty('--era', ease((backgroundProgress-.25)/.35).toFixed(4));
  scene?.update(backgroundProgress, reduced ? 0 : velocity);
}
// The original forest-to-desert transition now follows the page itself; no empty
// pinned chapter and no opaque wrapper interrupts the background after it ends.
const backgroundTrigger = ScrollTrigger.create({
  trigger: '#about', start: 'top 80%', endTrigger: '#projects', end: 'top 45%',
  onUpdate(self) { updateBackground(self.progress, self.getVelocity()); },
  onRefresh(self) { updateBackground(self.progress); }
});
const nav = $('.nav');
const scrollBar = $('.scroll-progress i');
const chapters = [...document.querySelectorAll<HTMLElement>('.chapter')];
const sectionLinks = [...document.querySelectorAll<HTMLAnchorElement>('#navigation a,.chapter-nav a')];
let scrollFrame = 0;
let currentSection = '';
function updatePage() {
  scrollFrame = 0;
  const y = scrollY;
  nav.classList.toggle('scrolled', y > 35);
  scrollBar.style.transform = `scaleX(${clamp(y / Math.max(1, root.scrollHeight-innerHeight))})`;
  root.style.setProperty('--drift', reduced ? '0px' : `${(Math.sin(y/900)*9).toFixed(2)}px`);
  let active = chapters[0].id;
  for(const chapter of chapters) if(chapter.getBoundingClientRect().top <= innerHeight*.4) active=chapter.id;
  if(active!==currentSection){
    currentSection=active;
    sectionLinks.forEach(link=>{if(link.hash===`#${active}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  }
}
function onScroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(updatePage);}
window.addEventListener('scroll',onScroll,{passive:true});
window.addEventListener('resize',onScroll,{passive:true});

function lenisTick(time: number){lenis?.raf(time*1000);}
function configureMotion(){
  reduced=reducedPreference.matches||manualReduced;
  root.classList.toggle('reduced-motion',reduced);
  motionButton.setAttribute('aria-pressed',String(reduced));
  motionButton.disabled=reducedPreference.matches;
  motionButton.textContent=reducedPreference.matches?'Reduced motion · system':reduced?'Reduced motion on':'Reduce motion';
  lenis?.destroy();lenis=undefined;gsap.ticker.remove(lenisTick);
  if(!reduced&&!touchPreference.matches){
    lenis=new Lenis({duration:.75,smoothWheel:true,syncTouch:false,autoRaf:false});
    lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(lenisTick);
  }
  scene?.setReduced(reduced);
  if(!reduced)void ensureScene();
  updatePage();updateBackground(backgroundProgress);
}
motionButton.addEventListener('click',()=>{
  if(reducedPreference.matches)return;
  manualReduced=!manualReduced;
  try{localStorage.setItem('portfolio-reduced-motion',String(manualReduced));}catch{/* Optional. */}
  configureMotion();
});
reducedPreference.addEventListener('change',configureMotion);
touchPreference.addEventListener('change',configureMotion);

const aliases: Record<string,string>={
  '#gate':'#about','#pathways':'#projects','#lessons':'#projects','#eternity':'#contact',
  '#hero':'#top','#work':'#projects','#archive':'#projects','#shift':'#projects'
};
function goTo(hash: string,immediate=false){
  const destination=aliases[hash]||hash||'#top';
  const target=document.getElementById(destination.slice(1));
  if(!target)return;
  const offset=target.id==='top'||target.id==='main'?0:(narrowMenu.matches?85:100);
  if(lenis&&!immediate&&!reduced)lenis.scrollTo(target,{offset:-offset,duration:.85});
  else window.scrollTo({top:target.getBoundingClientRect().top+scrollY-offset,behavior:'instant'});
  target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
}
const menu=$<HTMLButtonElement>('.menu-button');
const navigation=$('#navigation');
function closeMenu(restoreFocus=false){
  document.body.classList.remove('menu-open');menu.setAttribute('aria-expanded','false');
  menu.setAttribute('aria-label','Open navigation');menu.querySelector('span')!.textContent='+';
  if(restoreFocus)menu.focus();
}
menu.addEventListener('click',()=>{
  const open=!document.body.classList.contains('menu-open');
  document.body.classList.toggle('menu-open',open);menu.setAttribute('aria-expanded',String(open));
  menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');menu.querySelector('span')!.textContent=open?'−':'+';
});
function menuResize(){if(!narrowMenu.matches)closeMenu();}
narrowMenu.addEventListener('change',menuResize);
const onKey=(event: KeyboardEvent)=>{
  if(!document.body.classList.contains('menu-open'))return;
  if(event.key==='Escape'){closeMenu(true);return;}
  if(event.key==='Tab'){
    const controls:HTMLElement[]=[menu,...navigation.querySelectorAll<HTMLAnchorElement>('a')];
    const index=controls.indexOf(document.activeElement as HTMLElement);
    event.preventDefault();controls[(Math.max(0,index)+(event.shiftKey?-1:1)+controls.length)%controls.length].focus();
  }
};
document.addEventListener('keydown',onKey);
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
  const hash=link.getAttribute('href')!;
  if(!document.getElementById((aliases[hash]||hash).slice(1)))return;
  event.preventDefault();closeMenu();history.pushState(null,'',aliases[hash]||hash);goTo(hash);
}));
function hashChange(){const hash=aliases[location.hash]||location.hash;if(hash!==location.hash)history.replaceState(null,'',hash);goTo(hash,true);}
window.addEventListener('hashchange',hashChange);
window.addEventListener('popstate',hashChange);

const cards=[...document.querySelectorAll<HTMLElement>('.project-card')];
const filterButtons=[...document.querySelectorAll<HTMLButtonElement>('[data-filter]')];
filterButtons.forEach(button=>button.addEventListener('click',()=>{
  const filter=button.dataset.filter!;
  cards.forEach(card=>{card.hidden=filter!=='all'&&card.dataset.group!==filter;});
  filterButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  $('#project-count').textContent=`${cards.filter(card=>!card.hidden).length} projects`;
  ScrollTrigger.refresh();updatePage();
}));

// Only the entry is animated. Read content never disappears again on backscroll.
const revealObserver=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}
},{threshold:.06,rootMargin:'0px 0px -24px 0px'});
document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(element=>{
  if(element.getBoundingClientRect().top<innerHeight-30)element.classList.add('is-visible');
  else revealObserver.observe(element);
});
cards.forEach((card,i)=>card.style.setProperty('--reveal-delay',`${(i%3)*65}ms`));
root.classList.add('reveal-ready');

let pointerFrame=0,pointerX=0,pointerY=0;
const pointerMove=(event:PointerEvent)=>{
  if(reduced||touchPreference.matches||!scene)return;
  pointerX=event.clientX/innerWidth-.5;pointerY=event.clientY/innerHeight-.5;
  if(!pointerFrame)pointerFrame=requestAnimationFrame(()=>{scene?.pointer(pointerX,pointerY);pointerFrame=0;});
};
window.addEventListener('pointermove',pointerMove,{passive:true});

async function ensureScene(){
  if(!imagesReady||scene||sceneLoading||sceneUnavailable||reduced||disposed)return;
  sceneLoading=true;
  const probe=document.createElement('canvas');
  const gl=probe.getContext('webgl2',{failIfMajorPerformanceCaveat:true});
  if(!gl){sceneUnavailable=true;sceneLoading=false;root.dataset.renderer='css';return;}
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  try{
    const {createTransition}=await import('./scene');
    if(disposed)return;
    scene=await createTransition(canvas,plates[0],plates[1]);
    if(disposed){scene.dispose();return;}
    scene.setReduced(reduced);scene.setVisible(!document.hidden);updateBackground(backgroundProgress);
  }catch{sceneUnavailable=true;root.dataset.renderer='css';root.classList.remove('webgl-ready');}
  finally{sceneLoading=false;}
}
async function loadImages(){
  await Promise.all(plates.map(async image=>{try{await image.decode();}catch{/* The page remains readable without images. */}}));
  if(disposed)return;
  imagesReady=plates.every(image=>image.naturalWidth>0);
  root.dataset.renderer='css';void ensureScene();
}
configureMotion();void loadImages();
void document.fonts.ready.then(()=>{if(disposed)return;ScrollTrigger.refresh();if(location.hash)hashChange();updatePage();});
updateBackground(backgroundTrigger.progress);updatePage();

const visibility=()=>{scene?.setVisible(!document.hidden);};
document.addEventListener('visibilitychange',visibility);
window.addEventListener('pagehide',event=>{
  if(event.persisted){scene?.setVisible(false);lenis?.stop();return;}
  disposed=true;lenis?.destroy();gsap.ticker.remove(lenisTick);backgroundTrigger.kill();scene?.dispose();revealObserver.disconnect();
  window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll);window.removeEventListener('pointermove',pointerMove);
  window.removeEventListener('hashchange',hashChange);window.removeEventListener('popstate',hashChange);
  document.removeEventListener('keydown',onKey);document.removeEventListener('visibilitychange',visibility);
  reducedPreference.removeEventListener('change',configureMotion);touchPreference.removeEventListener('change',configureMotion);narrowMenu.removeEventListener('change',menuResize);
  if(pointerFrame)cancelAnimationFrame(pointerFrame);if(scrollFrame)cancelAnimationFrame(scrollFrame);
});
window.addEventListener('pageshow',event=>{if(event.persisted){scene?.setVisible(!document.hidden);lenis?.start();ScrollTrigger.refresh();updatePage();}});
