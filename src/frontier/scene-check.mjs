/* Geometry/lifecycle smoke check using real Three.js objects and a renderer stub.
   This checks code paths, not GPU shader compilation or visual rendering. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const root=path.dirname(fileURLToPath(import.meta.url));
const assets=fs.existsSync(path.join(root,'assets'))?path.join(root,'assets'):path.resolve(root,'../../assets');
const runtime=fs.existsSync(path.join(assets,'vendor/three.min.js'))?path.join(assets,'vendor/three.min.js'):path.resolve(root,'../threeui-source/public/landing-pages/secret-pathways-assets/three.min.js');
const THREE=require(runtime);
function check(width,height,paused=false,low=false){
 const handlers=new Map(),frames=new Map(),observers=[]; let sequence=0,lastScene,lastCamera,draws=0,disposed=false;
 const listen=(name,fn)=>handlers.set(name,fn);
 const canvas={width,height,addEventListener:listen};
 const host={dataset:{},clientWidth:width,offsetHeight:height,parentElement:{addEventListener:listen},getBoundingClientRect:()=>({left:0,top:0,width,height})};
 const context2d={createRadialGradient:()=>({addColorStop(){}}),fillRect(){}};
 class Renderer {
  constructor(){this.info={render:{calls:0}};}
  setPixelRatio(value){assert(value>0&&value<=1.6);this.ratio=value;}
  setSize(w,h){canvas.width=Math.floor(w*this.ratio);canvas.height=Math.floor(h*this.ratio);}
  setClearColor(){}
  render(scene,camera){lastScene=scene;lastCamera=camera;scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);draws++;this.info.render.calls=scene.children.length;}
  dispose(){disposed=true;}
 }
 const motion={paused};
 const document={hidden:false,querySelector:s=>s==='#scene'?host:canvas,createElement:()=>({getContext:()=>context2d}),addEventListener:listen};
 const window={THREE:{...THREE,WebGLRenderer:Renderer},frontierMotion:motion,addEventListener:listen};
 class Observer{constructor(fn){this.fn=fn;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}}
 const sandbox={window,document,navigator:{hardwareConcurrency:low?2:8,deviceMemory:low?2:8},matchMedia:()=>({matches:low}),AbortController,ResizeObserver:Observer,IntersectionObserver:Observer,devicePixelRatio:2,scrollY:0,requestAnimationFrame:fn=>{frames.set(++sequence,fn);return sequence;},cancelAnimationFrame:id=>frames.delete(id),console};
 vm.runInNewContext(fs.readFileSync(path.join(assets,'frontier-scene.js'),'utf8'),sandbox);
 assert.equal(host.dataset.status,'webgl');assert(draws>0);
 let instances=0,meshes=0;
 lastScene.traverse(object=>{
  if(object.isMesh)meshes++;
  if(object.isInstancedMesh){instances+=object.count;assert([...object.instanceMatrix.array].every(Number.isFinite));}
  if(object.geometry?.attributes.position)assert([...object.geometry.attributes.position.array].every(Number.isFinite));
  assert(object.position.toArray().every(Number.isFinite));
 });
 assert(instances>1000);assert(meshes<300);
 const bounds=new THREE.Box3().setFromObject(lastScene);
 assert(bounds.min.toArray().every(Number.isFinite));assert(bounds.max.toArray().every(Number.isFinite));
 if(paused)assert.equal(frames.size,0);
 else {assert.equal(frames.size,1);const [id,fn]=frames.entries().next().value;frames.delete(id);fn(16);assert.equal(frames.size,1);}
 motion.paused=true;handlers.get('frontier:motion')();assert.equal(frames.size,0);
 motion.paused=false;handlers.get('frontier:motion')();assert.equal(frames.size,1);
 document.hidden=true;handlers.get('visibilitychange')();assert.equal(frames.size,0);
 document.hidden=false;handlers.get('visibilitychange')();assert.equal(frames.size,1);
 handlers.get('webglcontextlost')({preventDefault(){}});assert.equal(host.dataset.status,'illustration');assert.equal(frames.size,0);
 handlers.get('webglcontextrestored')();assert.equal(host.dataset.status,'webgl');
 const gateProjection=new THREE.Vector3(0,8,14).project(lastCamera);
 assert(Math.abs(gateProjection.x)<1&&Math.abs(gateProjection.y)<1,'Gate outside camera view');
 const dimensions={meshes,instances,draws,resolution:host.dataset.resolution,gatePosition:gateProjection.toArray().map(n=>Number(n.toFixed(2)))};
 handlers.get('pagehide')({persisted:false});assert(disposed);assert.equal(frames.size,0);assert(observers.every(o=>o.disconnected));
 return {width,height,paused,low,...dimensions};
}
console.log(JSON.stringify([check(1440,900),check(390,844,false,true),check(844,730),check(320,820,true,true)],null,2));
