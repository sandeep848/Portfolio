import { Scene, OrthographicCamera, WebGLRenderer, PlaneGeometry, ShaderMaterial, Mesh, Texture, Vector2, LinearFilter, SRGBColorSpace, NoToneMapping } from 'three';
import fragmentShader from './transition.frag.glsl?raw';

export interface TransitionScene {
  update(progress: number, velocity: number): void;
  pointer(x: number, y: number): void;
  setVisible(value: boolean): void;
  setReduced(value: boolean): void;
  dispose(): void;
}

export async function createTransition(canvas: HTMLCanvasElement, oldImage: HTMLImageElement, newImage: HTMLImageElement): Promise<TransitionScene> {
  const root = document.documentElement;
  const scene = new Scene();
  const camera = new OrthographicCamera(-1,1,1,-1,0,1);
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  const texA = new Texture(oldImage), texB = new Texture(newImage);
  for (const tex of [texA, texB]) { tex.colorSpace = SRGBColorSpace; tex.minFilter = LinearFilter; tex.magFilter = LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true; }
  const uniforms = {
    uTexA: { value: texA }, uTexB: { value: texB }, uRes: { value: new Vector2(innerWidth, innerHeight) },
    uProgress: { value: 0 }, uVelocity: { value: 0 }, uTime: { value: 0 },
    uMobile: { value: innerWidth <= 600 ? 1 : 0 }, uPointer: { value: new Vector2() }
  };
  const material = new ShaderMaterial({ uniforms, vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.0,1.0);}', fragmentShader, depthTest: false, depthWrite: false });
  const geometry = new PlaneGeometry(2,2);
  const mesh = new Mesh(geometry,material); mesh.frustumCulled = false; scene.add(mesh);
  let visible = true, reduced = false, lost = false, disposed = false, raf = 0, lastTime = 0, quality = 1;
  let slowFrames = 0, measuredFrames = 0;
  const pointerTarget = new Vector2();

  function size() {
    const phone = innerWidth <= 600;
    const cores = navigator.hardwareConcurrency || 4;
    const cap = phone || cores <= 4 ? 1.15 : 1.75;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, cap) * quality);
    renderer.setSize(innerWidth, innerHeight, false);
    uniforms.uRes.value.set(innerWidth,innerHeight); uniforms.uMobile.value = phone ? 1 : 0;
    if (visible && !lost && !reduced) draw(performance.now());
  }
  function draw(now: number) {
    const elapsed = lastTime ? now-lastTime : 16.7;
    const dt = Math.min(.05, elapsed/1000); lastTime=now;
    uniforms.uTime.value += dt;
    uniforms.uVelocity.value *= Math.exp(-dt*5);
    uniforms.uPointer.value.lerp(pointerTarget,1-Math.exp(-dt*5));
    renderer.render(scene,camera);
    if (elapsed > 30 && elapsed < 150) slowFrames++;
    if (++measuredFrames === 120) {
      if(slowFrames>45 && quality>.65) { quality=Math.max(.65,quality*.85); renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<=600?1.15:1.75)*quality); renderer.setSize(innerWidth,innerHeight,false); }
      slowFrames=0; measuredFrames=0;
    }
  }
  function frame(now: number) {
    raf=0;
    if(disposed || lost || reduced || !visible || document.hidden)return;
    draw(now); raf=requestAnimationFrame(frame);
  }
  function sync() {
    if(raf){cancelAnimationFrame(raf);raf=0;}
    root.classList.toggle('webgl-ready',!disposed&&!lost&&!reduced);
    root.dataset.renderer = lost || reduced ? 'css' : 'webgl';
    if(!disposed&&!lost&&!reduced&&visible&&!document.hidden){lastTime=0;raf=requestAnimationFrame(frame);}
  }
  function onLost(event: Event) { event.preventDefault();lost=true;sync(); }
  function onRestored() { lost=false;texA.needsUpdate=true;texB.needsUpdate=true;size();sync(); }
  const observer = new ResizeObserver(size); observer.observe(document.documentElement);
  const intersection = new IntersectionObserver(entries => { visible=entries[0].isIntersecting;sync(); }); intersection.observe(canvas);
  const visibility = () => sync();
  document.addEventListener('visibilitychange',visibility);
  canvas.addEventListener('webglcontextlost',onLost); canvas.addEventListener('webglcontextrestored',onRestored);
  // Compilation must finish before replacing the already-visible photo fallback.
  await renderer.compileAsync(scene,camera); size();sync();
  return {
    update(progress,velocity){uniforms.uProgress.value=progress;uniforms.uVelocity.value=velocity;},
    pointer(x,y){pointerTarget.set(x,y);},
    setVisible(value){if(visible!==value){visible=value;sync();}},
    setReduced(value){if(reduced!==value){reduced=value;sync();}},
    dispose(){
      if(disposed)return; disposed=true;
      if(raf)cancelAnimationFrame(raf);
      observer.disconnect();intersection.disconnect();
      document.removeEventListener('visibilitychange',visibility);
      canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestored);
      geometry.dispose();material.dispose();texA.dispose();texB.dispose();renderer.dispose();renderer.forceContextLoss();
      root.classList.remove('webgl-ready');root.dataset.renderer='css';
    }
  };
}
