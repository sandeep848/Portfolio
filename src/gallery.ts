import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

type GalleryOptions = { reduced: () => boolean; scrollTo: (y: number, immediate?: boolean) => void; onMove?: () => void };
export function createGallery(options: GalleryOptions) {
  const section = document.querySelector<HTMLElement>('#projects')!;
  const viewport = document.querySelector<HTMLElement>('.rail-viewport')!;
  const track = document.querySelector<HTMLElement>('.project-track')!;
  const all = [...track.querySelectorAll<HTMLElement>('.project-card')];
  const filters = [...document.querySelectorAll<HTMLButtonElement>('[data-filter]')];
  const previous = document.querySelector<HTMLButtonElement>('#project-prev')!;
  const next = document.querySelector<HTMLButtonElement>('#project-next')!;
  const range = document.querySelector<HTMLInputElement>('#rail-range')!;
  const count = document.querySelector('#project-count')!;
  const currentLabel = document.querySelector('#rail-current')!;
  const totalLabel = document.querySelector('#rail-total')!;
  const instruction = document.querySelector('.rail-instruction')!;
  const desktop = matchMedia('(min-width: 1000px) and (min-height: 820px) and (pointer: fine)');
  let visible = all.slice(), current = 0, pinned = false, distance = 0, travel = 0, railTop = 0;
  let positions: number[] = [], widths: number[] = [];
  let tween: gsap.core.Tween | undefined;
  let raf = 0, disposed = false;
  const cleanups: (() => void)[] = [];
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  function listen(target: EventTarget, name: string, fn: EventListener, opts?: AddEventListenerOptions) {
    target.addEventListener(name, fn, opts); cleanups.push(() => target.removeEventListener(name, fn, opts));
  }
  function render() {
    raf = 0;
    const x = viewport.scrollLeft;
    let nearest = 0, smallest = Infinity;
    positions.forEach((position, i) => { const difference = Math.abs(position-x); if (difference<smallest) { smallest=difference; nearest=i; } });
    current = nearest;
    options.onMove?.();
    currentLabel.textContent = String(current+1).padStart(2,'0');
    range.value = String(current+1);
    range.setAttribute('aria-valuetext', (current+1)+' of '+visible.length+': '+visible[current].querySelector('h3')!.textContent);
    range.style.setProperty('--rail-fill', (current/Math.max(1,visible.length-1)*100)+'%');
    previous.disabled = current===0; next.disabled = current===visible.length-1;
    visible.forEach((card, i) => {
      const center = positions[i]-x+widths[i]*.5;
      const offset = clamp((center-viewport.clientWidth*.35)/(viewport.clientWidth*.7),-1,1);
      card.style.setProperty('--card-turn', options.reduced() ? '0deg' : (-offset*3.5).toFixed(2)+'deg');
      card.style.setProperty('--card-y', options.reduced() ? '0px' : (Math.abs(offset)*5).toFixed(2)+'px');
      card.style.setProperty('--art-x', options.reduced() ? '0px' : (offset*-20).toFixed(2)+'px');
    });
  }
  function queueRender() { if(!raf) raf=requestAnimationFrame(render); }
  function refresh(reset = false) {
    if(disposed)return;
    const oldPinned=pinned, oldIndex=reset?0:current;
    const wasInside=section.getBoundingClientRect().top<=10 && section.getBoundingClientRect().bottom>innerHeight;
    tween?.scrollTrigger?.kill(); tween?.kill(); tween=undefined;
    pinned=desktop.matches&&!options.reduced();
    section.classList.toggle('rail-pinned',pinned);
    section.style.height='';
    viewport.scrollLeft=0;
    const pad=parseFloat(getComputedStyle(track).paddingLeft);
    const cardWidth=visible[0].offsetWidth;
    track.style.setProperty('--rail-tail',Math.max(pad,viewport.clientWidth-cardWidth-pad)+'px');
    positions=visible.map(card=>card.offsetLeft-visible[0].offsetLeft);
    widths=visible.map(card=>card.offsetWidth);
    distance=viewport.scrollWidth-viewport.clientWidth;
    travel=distance*.86;
    if(pinned){
      section.style.height=(innerHeight+travel+45)+'px';
      tween=gsap.to(viewport,{scrollLeft:distance,ease:'none',scrollTrigger:{
        trigger:section,start:'top top',end:()=>'+='+travel,scrub:.65,invalidateOnRefresh:true,
        onUpdate:queueRender,onRefresh(self){railTop=self.start;queueRender();}
      }});
      railTop=tween.scrollTrigger!.start;
    }
    totalLabel.textContent=String(visible.length).padStart(2,'0');range.max=String(visible.length);
    count.textContent=visible.length+' projects';
    instruction.innerHTML=pinned?'Scroll to explore <span aria-hidden="true">→</span>':'Swipe or use the arrows <span aria-hidden="true">→</span>';
    if(oldPinned&&wasInside){
      if(pinned) options.scrollTo(railTop+positions[Math.min(oldIndex,visible.length-1)]/Math.max(1,distance)*travel,true);
      else options.scrollTo(section.getBoundingClientRect().top+scrollY-75,true);
    } else if(!pinned) viewport.scrollLeft=positions[Math.min(oldIndex,visible.length-1)]||0;
    ScrollTrigger.refresh();render();
  }
  function choose(index: number, immediate = false) {
    index=clamp(index,0,visible.length-1);
    const target=clamp(positions[index],0,distance);
    if(pinned)options.scrollTo(railTop+target/Math.max(1,distance)*travel,immediate||options.reduced());
    else viewport.scrollTo({left:target,behavior:immediate||options.reduced()?'instant':'smooth'});
  }
  listen(viewport,'scroll',queueRender,{passive:true});
  listen(previous,'click',()=>choose(current-1));listen(next,'click',()=>choose(current+1));
  listen(range,'input',()=>choose(Number(range.value)-1,true));
  listen(viewport,'keydown',(event)=>{
    const key=event as KeyboardEvent;
    if(key.target!==viewport)return;
    if(key.key==='ArrowRight'||key.key==='ArrowLeft'){key.preventDefault();choose(current+(key.key==='ArrowRight'?1:-1));}
    if(key.key==='Home'||key.key==='End'){key.preventDefault();choose(key.key==='Home'?0:visible.length-1);}
  });
  listen(viewport,'focusin',(event)=>{
    const target=event.target as HTMLElement;
    if(!target.matches(':focus-visible'))return;
    const card=target.closest<HTMLElement>('.project-card');if(!card)return;
    const i=visible.indexOf(card);if(i<0)return;
    if(pinned || positions[i]<viewport.scrollLeft || positions[i]+widths[i]>viewport.scrollLeft+viewport.clientWidth) choose(i,true);
  });
  listen(viewport,'wheel',(event)=>{
    const wheel=event as WheelEvent;
    if(pinned&&Math.abs(wheel.deltaX)>Math.abs(wheel.deltaY)){wheel.preventDefault();options.scrollTo(clamp(scrollY+wheel.deltaX*.86,railTop,railTop+travel),true);}
  },{passive:false});
  filters.forEach(button=>listen(button,'click',()=>{
    const group=button.dataset.filter;
    all.forEach(card=>{card.hidden=group!=='all'&&card.dataset.group!==group;});
    visible=all.filter(card=>!card.hidden);
    filters.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    refresh(true);
  }));
  return {
    refresh,
    get progress(){return distance?viewport.scrollLeft/distance:0;},
    dispose(){disposed=true;tween?.scrollTrigger?.kill();tween?.kill();if(raf)cancelAnimationFrame(raf);cleanups.forEach(fn=>fn());section.classList.remove('rail-pinned');section.style.height='';}
  };
}
