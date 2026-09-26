import './style.css';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createGallery } from './gallery';
import type { TransitionScene } from './scene';

gsap.registerPlugin(ScrollTrigger);
const root=document.documentElement;
const $=<T extends HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
const asset=(path:string)=>import.meta.env.BASE_URL+path;
root.style.setProperty('--old-image','url("'+asset('assets/old-school.webp')+'")');
root.style.setProperty('--new-image','url("'+asset('assets/new-school.webp')+'")');
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const touchPreference=matchMedia('(pointer: coarse)');
const narrowMenu=matchMedia('(max-width: 600px)');
const motionButton=$<HTMLButtonElement>('#motion-toggle');
let manualReduced=false;
try{manualReduced=localStorage.getItem('portfolio-reduced-motion')==='true';}catch{/* Optional storage. */}
let reduced=motionPreference.matches||manualReduced;
let lenis:Lenis|undefined, scene:TransitionScene|undefined, motionContext:gsap.Context|undefined;
let disposed=false, imagesReady=false, sceneLoading=false, started=false;
let sceneUnavailable=new URLSearchParams(location.search).has('fallback');
let frame=0, resizeTimer=0, pointerFrame=0, pointerX=0, pointerY=0;
let backgroundProgress=0, currentSection='', lastY=scrollY, lastAt=performance.now();
let cameraX=0,cameraY=0,cameraScale=1.08;
let aboutTop=0,projectsTop=0,heroHeight=1,pageTravel=1;
const canvas=$<HTMLCanvasElement>('#transition-canvas');
const plates=[$<HTMLImageElement>('#plate-old'),$<HTMLImageElement>('#plate-new')];
const sections=[...document.querySelectorAll<HTMLElement>('.chapter')];
const navigationLinks=[...document.querySelectorAll<HTMLAnchorElement>('#navigation a,.journey-meter a')];
const sectionNames=['INTRO','ABOUT','PROJECTS','EXPERIENCE','CONTACT'];
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
const smooth=(v:number)=>{const x=clamp(v);return x*x*(3-2*x);};
function scrollTo(y:number,immediate=false){
  const target=clamp(y,0,Math.max(0,root.scrollHeight-innerHeight));
  if(lenis&&!reduced)lenis.scrollTo(target,{immediate,duration:.85});
  else window.scrollTo({top:target,behavior:immediate||reduced?'instant':'smooth'});
}
const gallery=createGallery({reduced:()=>reduced,onMove:queueUpdate});
function measure(){
  aboutTop=$('#about').offsetTop;projectsTop=$('#projects').offsetTop;
  heroHeight=$('#top').offsetHeight;pageTravel=Math.max(1,root.scrollHeight-innerHeight);
}
function updatePage(){
  frame=0;if(disposed)return;
  const y=scrollY, now=performance.now();
  const velocity=(y-lastY)/Math.max(16,now-lastAt)*1000;lastY=y;lastAt=now;
  $('.nav').classList.toggle('scrolled',y>35);
  $('.scroll-progress i').style.transform='scaleX('+clamp(y/pageTravel)+')';
  const hero=clamp(y/Math.max(1,heroHeight));
  backgroundProgress=clamp((y-aboutTop+innerHeight*.75)/Math.max(1,projectsTop-aboutTop+innerHeight*.3));
  const era=smooth((backgroundProgress-.25)/.35);
  root.style.setProperty('--era',era.toFixed(4));
  // Camera motion is shared by the GPU and CSS paths, so scrolling stays alive on modest hardware.
  const journey=clamp(y/pageTravel);
  const targetX=reduced?0:Math.sin(journey*Math.PI*2)*innerWidth*.035+gallery.progress*innerWidth*-.022;
  const targetY=reduced?0:(Math.sin(y/1550)*13-hero*13);
  const targetScale=reduced?1:1.08+hero*.045+Math.sin(journey*Math.PI)*.04;
  cameraX+=(targetX-cameraX)*.18;cameraY+=(targetY-cameraY)*.18;cameraScale+=(targetScale-cameraScale)*.18;
  root.style.setProperty('--camera-x',cameraX.toFixed(2)+'px');
  root.style.setProperty('--camera-y',cameraY.toFixed(2)+'px');
  root.style.setProperty('--camera-scale',cameraScale.toFixed(5));
  scene?.update(backgroundProgress,reduced?0:velocity);
  let active=0;
  for(let i=0;i<sections.length;i++)if(sections[i].getBoundingClientRect().top<innerHeight*.4)active=i;
  if(currentSection!==sections[active].id){
    currentSection=sections[active].id;
    navigationLinks.forEach(link=>{if(link.hash==='#'+currentSection)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    $('.journey-label').textContent=String(active+1).padStart(2,'0')+' — '+sectionNames[active];
  }
  if(!reduced&&(Math.abs(targetX-cameraX)>.08||Math.abs(targetY-cameraY)>.08||Math.abs(targetScale-cameraScale)>.0001))queueUpdate();
}
function queueUpdate(){if(!frame)frame=requestAnimationFrame(updatePage);}
function lenisTick(time:number){lenis?.raf(time*1000);}

// Split only text nodes, retaining the readable heading and its italic emphasis.
const sentence=$('.scroll-sentence');
function splitWords(element:HTMLElement){
  [...element.childNodes].forEach(node=>{
    if(node.nodeType===Node.TEXT_NODE){
      const fragment=document.createDocumentFragment();
      (node.textContent||'').trim().split(/\s+/).filter(Boolean).forEach(word=>{const span=document.createElement('span');span.className='word';span.textContent=word;fragment.append(span,document.createTextNode(' '));});
      node.replaceWith(fragment);
    }else if(node instanceof HTMLElement)splitWords(node);
  });
}
splitWords(sentence);
function buildMotion(){
  motionContext?.revert();motionContext=undefined;
  if(reduced)return;
  motionContext=gsap.context(()=>{
    const desktop=innerWidth>=1000&&innerHeight>=820;
    gsap.to('.name-line',{xPercent:desktop?-12:-7,yPercent:-12,scale:.92,transformOrigin:'left center',ease:'none',scrollTrigger:{trigger:'#top',start:'top top',end:'bottom top',scrub:.8}});
    gsap.to('.surname-line',{xPercent:desktop?10:5,yPercent:-5,ease:'none',scrollTrigger:{trigger:'#top',start:'top top',end:'bottom top',scrub:.9}});
    gsap.to('.hero-copy',{y:desktop?-65:-28,ease:'none',scrollTrigger:{trigger:'#top',start:'top top',end:'bottom top',scrub:.7}});
    gsap.fromTo('.scroll-sentence .word',{opacity:.48},{opacity:1,stagger:.12,ease:'none',scrollTrigger:{trigger:'#about',start:'top 75%',end:'center 47%',scrub:.6}});
    gsap.fromTo('.editorial-rule',{scaleX:.2},{scaleX:1.7,ease:'none',scrollTrigger:{trigger:'#about',start:'top 75%',end:'bottom 40%',scrub:.6}});
    gsap.fromTo('.interlude-track',{xPercent:8},{xPercent:-42,ease:'none',scrollTrigger:{trigger:'.interlude',start:'top bottom',end:'bottom top',scrub:1}});
    gsap.fromTo('.interlude-line',{scaleX:.2},{scaleX:1.15,ease:'none',scrollTrigger:{trigger:'.interlude',start:'top bottom',end:'bottom top',scrub:.7}});
    gsap.fromTo('.experience-title h2',{y:45},{y:-25,ease:'none',scrollTrigger:{trigger:'#experience',start:'top bottom',end:'bottom top',scrub:.8}});
    gsap.fromTo('.route-line>span',{scaleX:.1},{scaleX:1,ease:'none',scrollTrigger:{trigger:'#experience',start:'top 70%',end:'center 40%',scrub:.6}});
    gsap.fromTo('.contact h2>span',{xPercent:-8},{xPercent:0,ease:'none',scrollTrigger:{trigger:'#contact',start:'top bottom',end:'center center',scrub:.8}});
    gsap.fromTo('.contact h2>em',{xPercent:8},{xPercent:0,ease:'none',scrollTrigger:{trigger:'#contact',start:'top bottom',end:'center center',scrub:.8}});
    gsap.fromTo('.contact-arrow',{rotation:-35,scale:.65},{rotation:0,scale:1,ease:'none',scrollTrigger:{trigger:'#contact',start:'top bottom',end:'center center',scrub:.8}});
  });
}
function configureMotion(){
  reduced=motionPreference.matches||manualReduced;
  root.classList.toggle('reduced-motion',reduced);root.classList.toggle('motion-enabled',!reduced);
  motionButton.setAttribute('aria-pressed',String(reduced));motionButton.disabled=motionPreference.matches;
  motionButton.textContent=motionPreference.matches?'Reduced motion · system':reduced?'Reduced motion on':'Reduce motion';
  lenis?.destroy();lenis=undefined;gsap.ticker.remove(lenisTick);
  if(!reduced&&!touchPreference.matches){lenis=new Lenis({duration:.8,smoothWheel:true,syncTouch:false,autoRaf:false});lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(lenisTick);}
  scene?.setReduced(reduced);
  if(started){buildMotion();gallery.refresh();measure();ScrollTrigger.refresh();queueUpdate();}
  if(!reduced)void ensureScene();
}
const menu=$<HTMLButtonElement>('.menu-button');
const navigation=$('#navigation');
function closeMenu(restore=false){document.body.classList.remove('menu-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');menu.querySelector('span')!.textContent='+';if(restore)menu.focus();}
menu.addEventListener('click',()=>{const open=!document.body.classList.contains('menu-open');document.body.classList.toggle('menu-open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');menu.querySelector('span')!.textContent=open?'−':'+';});
function onKey(event:KeyboardEvent){
  if(!document.body.classList.contains('menu-open'))return;
  if(event.key==='Escape'){closeMenu(true);return;}
  if(event.key==='Tab'){const controls:HTMLElement[]=[menu,...navigation.querySelectorAll<HTMLAnchorElement>('a')];const i=controls.indexOf(document.activeElement as HTMLElement);event.preventDefault();controls[(Math.max(0,i)+(event.shiftKey?-1:1)+controls.length)%controls.length].focus();}
}
document.addEventListener('keydown',onKey);
function menuResize(){if(!narrowMenu.matches)closeMenu();}
narrowMenu.addEventListener('change',menuResize);
const aliases:Record<string,string>={'#gate':'#about','#pathways':'#projects','#lessons':'#projects','#eternity':'#contact','#hero':'#top','#work':'#projects','#archive':'#projects','#shift':'#projects'};
function goTo(hash:string,immediate=false){
  const destination=aliases[hash]||hash||'#top';const target=document.getElementById(destination.slice(1));if(!target)return;
  const offset=target.id==='top'||target.id==='main'?0:(narrowMenu.matches?85:100);
  scrollTo(target.getBoundingClientRect().top+scrollY-offset,immediate);
  target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
}
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{const hash=link.getAttribute('href')!;if(!document.getElementById((aliases[hash]||hash).slice(1)))return;event.preventDefault();closeMenu();history.pushState(null,'',aliases[hash]||hash);goTo(hash);}));
function hashChange(){const hash=aliases[location.hash]||location.hash;if(hash!==location.hash)history.replaceState(null,'',hash);goTo(hash,true);}
window.addEventListener('hashchange',hashChange);window.addEventListener('popstate',hashChange);
motionButton.addEventListener('click',()=>{if(motionPreference.matches)return;manualReduced=!manualReduced;try{localStorage.setItem('portfolio-reduced-motion',String(manualReduced));}catch{/* Optional. */}configureMotion();});
motionPreference.addEventListener('change',configureMotion);touchPreference.addEventListener('change',configureMotion);
const revealObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}},{threshold:.08,rootMargin:'0px 0px -18px 0px'});
document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(element=>{if(element.getBoundingClientRect().top<innerHeight-30)element.classList.add('is-visible');else revealObserver.observe(element);});root.classList.add('reveal-ready');
function onResize(){clearTimeout(resizeTimer);resizeTimer=window.setTimeout(()=>{buildMotion();gallery.refresh();measure();ScrollTrigger.refresh();queueUpdate();},180);}
window.addEventListener('resize',onResize,{passive:true});window.addEventListener('scroll',queueUpdate,{passive:true});
const onRefresh=()=>{measure();queueUpdate();};ScrollTrigger.addEventListener('refresh',onRefresh);
function pointerMove(event:PointerEvent){if(reduced||touchPreference.matches||!scene)return;pointerX=event.clientX/innerWidth-.5;pointerY=event.clientY/innerHeight-.5;if(!pointerFrame)pointerFrame=requestAnimationFrame(()=>{scene?.pointer(pointerX,pointerY);pointerFrame=0;});}
window.addEventListener('pointermove',pointerMove,{passive:true});
async function ensureScene(){
  if(!imagesReady||scene||sceneLoading||sceneUnavailable||reduced||disposed||innerWidth<=600)return;
  sceneLoading=true;
  const probe=document.createElement('canvas');const gl=probe.getContext('webgl2',{failIfMajorPerformanceCaveat:true});
  if(!gl){sceneUnavailable=true;sceneLoading=false;root.dataset.renderer='css';return;}
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  try{const {createTransition}=await import('./scene');if(disposed)return;scene=await createTransition(canvas,plates[0],plates[1]);if(disposed){scene.dispose();return;}scene.setReduced(reduced);scene.setVisible(!document.hidden);scene.update(backgroundProgress,0);}
  catch{sceneUnavailable=true;root.dataset.renderer='css';root.classList.remove('webgl-ready');}
  finally{sceneLoading=false;}
}
async function loadImages(){await Promise.all(plates.map(async image=>{try{await image.decode();}catch{/* The page remains usable. */}}));if(disposed)return;imagesReady=plates.every(image=>image.naturalWidth>0);root.dataset.renderer='css';void ensureScene();}
function visibility(){root.classList.toggle('page-hidden',document.hidden);scene?.setVisible(!document.hidden);}
document.addEventListener('visibilitychange',visibility);
started=true;configureMotion();void loadImages();
void document.fonts.ready.then(()=>{if(disposed)return;gallery.refresh();measure();ScrollTrigger.refresh();if(location.hash)hashChange();queueUpdate();});
window.addEventListener('pagehide',event=>{
  if(event.persisted){scene?.setVisible(false);lenis?.stop();return;}
  disposed=true;clearTimeout(resizeTimer);lenis?.destroy();gsap.ticker.remove(lenisTick);motionContext?.revert();gallery.dispose();scene?.dispose();revealObserver.disconnect();
  window.removeEventListener('scroll',queueUpdate);window.removeEventListener('resize',onResize);window.removeEventListener('pointermove',pointerMove);window.removeEventListener('hashchange',hashChange);window.removeEventListener('popstate',hashChange);
  document.removeEventListener('keydown',onKey);document.removeEventListener('visibilitychange',visibility);motionPreference.removeEventListener('change',configureMotion);touchPreference.removeEventListener('change',configureMotion);narrowMenu.removeEventListener('change',menuResize);ScrollTrigger.removeEventListener('refresh',onRefresh);
  if(frame)cancelAnimationFrame(frame);if(pointerFrame)cancelAnimationFrame(pointerFrame);
});
window.addEventListener('pageshow',event=>{if(event.persisted){scene?.setVisible(!document.hidden);lenis?.start();gallery.refresh();ScrollTrigger.refresh();measure();queueUpdate();}});
