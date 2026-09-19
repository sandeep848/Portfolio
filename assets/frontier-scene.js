/* Original low-poly fortress scene. Three.js r149, instanced masonry, no model downloads. */
(() => {
  'use strict';
  const T = window.THREE;
  const host = document.querySelector('#scene');
  const canvas = document.querySelector('#world');
  if (!T || !host || !canvas) return;
  const motion = window.frontierMotion || {paused:true};
  const coarse = matchMedia('(pointer: coarse)');
  const conservative = coarse.matches || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  const controller = new AbortController();
  const options = {signal:controller.signal};
  let renderer;
  try {
    renderer = new T.WebGLRenderer({canvas,alpha:true,antialias:!conservative,powerPreference:'low-power'});
  } catch {
    host.dataset.status = 'illustration';
    return;
  }
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.setClearColor(0x172319,0);
  const scene = new T.Scene();
  scene.fog = new T.Fog(0x314435,48,145);
  const camera = new T.PerspectiveCamera(39,1,.5,220);
  const fortress = new T.Group(); scene.add(fortress);
  const resources = new Set();
  const flags = [];
  const state = {pointerX:0,pointerY:0,x:0,y:0,scroll:0,progress:0,time:0};
  let raf=0,previous=0,inView=true,disposed=false,lost=false,suspended=false;
  let pixelCap=conservative?1.15:1.6,slowFrames=0,samples=0,totalFrameTime=0;
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  let seed=70361;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const keep=value=>{resources.add(value);return value;};
  const material=(color,extra={})=>keep(new T.MeshStandardMaterial({color,roughness:.92,metalness:0,...extra}));
  const box=keep(new T.BoxGeometry(1,1,1));
  const cylinder=keep(new T.CylinderGeometry(1,1,1,8));
  const cone=keep(new T.ConeGeometry(1,1,4));
  const dummy=new T.Object3D();
  const stone=material(0xa1a88c);
  const darkStone=material(0x5c6d54);
  const wood=material(0x293526);
  const roof=material(0x5b5140);
  const brass=material(0xbd995b,{metalness:.4,roughness:.5});
  const fabric=material(0x506e43,{side:T.DoubleSide});
  const ground=material(0x344c32);
  function mesh(geometry,mat,position,scale=[1,1,1],parent=fortress) {
    const object=new T.Mesh(geometry,mat);object.position.set(...position);object.scale.set(...scale);parent.add(object);return object;
  }
  function instances(items,geometry,mat) {
    const object=new T.InstancedMesh(geometry,mat,items.length);
    const color=new T.Color();
    items.forEach((item,index)=>{
      dummy.position.set(...item.p);dummy.scale.set(...item.s);dummy.rotation.set(0,item.r||0,0);dummy.updateMatrix();
      object.setMatrixAt(index,dummy.matrix);
      color.setHSL(.20+random()*.018,.09+random()*.08,.48+random()*.2);object.setColorAt(index,color);
    });
    object.instanceMatrix.needsUpdate=true;
    if(object.instanceColor)object.instanceColor.needsUpdate=true;
    object.frustumCulled=false;fortress.add(object);resources.add(object);return object;
  }
  function glowTexture() {
    const tile=document.createElement('canvas');tile.width=64;tile.height=64;
    const context=tile.getContext('2d');
    const gradient=context.createRadialGradient(32,32,0,32,32,32);
    gradient.addColorStop(0,'rgba(255,240,193,1)');gradient.addColorStop(.18,'rgba(235,202,132,.55)');gradient.addColorStop(1,'rgba(235,202,132,0)');
    context.fillStyle=gradient;context.fillRect(0,0,64,64);return keep(new T.CanvasTexture(tile));
  }
  const glowMap=glowTexture();
  const sunlight=keep(new T.SpriteMaterial({map:glowMap,color:0xeed79d,transparent:true,opacity:.68,depthWrite:false,fog:false}));
  const sun=new T.Sprite(sunlight);sun.position.set(-10,36,-57);sun.scale.set(65,65,1);scene.add(sun);
  const sunDisk=mesh(keep(new T.SphereGeometry(3.5,24,12)),keep(new T.MeshBasicMaterial({color:0xe3d4a2,fog:false})),[-10,36,-57],[1,1,1],scene);
  scene.add(new T.HemisphereLight(0xdfe9c9,0x23362a,1.65));
  const key=new T.DirectionalLight(0xf1dfb5,2.4);key.position.set(-30,42,-12);scene.add(key);
  const fill=new T.DirectionalLight(0x809c8c,.65);fill.position.set(25,10,30);scene.add(fill);

  // Terrain, concentric fortifications, and the gate are independently modelled.
  mesh(keep(new T.CylinderGeometry(57,63,3,64)),ground,[0,-1.9,-4]);
  mesh(keep(new T.CylinderGeometry(26,31,2,64)),material(0x3e5239),[0,-.6,-5]);
  const blocks=[];
  const crenels=[];
  const wall=(radius,height,count,zCenter,backOnly=false)=>{
    const segment=2*Math.PI*radius/count;
    for(let i=0;i<count;i++){
      const a=i/count*Math.PI*2;
      const gateSector=Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.14;
      if(gateSector&&!backOnly)continue;
      const rows=Math.round(height/1.45);
      for(let j=0;j<rows;j++) {
        const angle=a+(j%2)*Math.PI/count;
        if(!backOnly&&Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<.14)continue;
        blocks.push({p:[Math.sin(angle)*radius,(j+.5)*height/rows,Math.cos(angle)*radius+zCenter],s:[segment*.98,height/rows-.045,1.45],r:angle});
      }
      crenels.push({p:[Math.sin(a)*radius,height+.45,Math.cos(a)*radius+zCenter],s:[segment*.6,.9,1.65],r:a});
    }
  };
  wall(21,13.6,72,-7);
  wall(29,9.7,88,-23,true);
  instances(blocks,box,stone);instances(crenels,box,stone);
  for(let side of [-1,1]){
    const x=side*4.2,z=14;
    mesh(box,stone,[x,8.2,z],[4.5,16.4,5]);
    mesh(box,darkStone,[x,1.1,z],[5.2,2.2,5.7]);
    mesh(box,stone,[x,14.2,z],[4.95,.55,5.5]);
    mesh(box,stone,[x,16.2,z],[5,.65,5.6]);
    for(let j=-1;j<=1;j++){
      mesh(box,stone,[x+j*1.75,17,16.3],[.9,1.35,1.1]);
      mesh(box,stone,[x+j*1.75,17,11.7],[.9,1.35,1.1]);
    }
    mesh(box,wood,[x,11.4,16.55],[.55,2.5,.05]);
    mesh(box,wood,[x,5.1,16.55],[.4,1.8,.05]);
    mesh(box,brass,[x-side*1.6,4,16.7],[.14,2,.14]);
    const lamp=new T.Sprite(keep(new T.SpriteMaterial({map:glowMap,color:0xffce82,transparent:true,depthWrite:false,opacity:.9})));
    lamp.position.set(x-side*1.6,5.1,16.9);lamp.scale.set(1.6,2,1);fortress.add(lamp);
  }
  // Arched gate with voussoirs and a recessed dark entrance.
  for(let i=0;i<13;i++){
    const angle=i/12*Math.PI;
    const segment=mesh(box,stone,[Math.cos(angle)*2.15,6.8+Math.sin(angle)*2.15,15],[.64,.86,2.5]);
    segment.rotation.z=angle-Math.PI/2;
  }
  mesh(box,wood,[0,3.5,14.8],[3.8,7,.22]);
  for(let i=-3;i<=3;i++)mesh(box,darkStone,[i*.5,3.4,15.05],[.05,6.7,.05]);
  mesh(box,stone,[0,11.8,14],[5.8,4.2,4]);
  mesh(box,darkStone,[0,14.2,14],[5.7,.6,4.7]);
  // Approach path and masonry stairs.
  for(let i=0;i<11;i++)mesh(box,material(i%2?0x63725a:0x5c6b53),[0,-.06-i*.04,19+i*2.8],[4.6+i*.7,.17,2.75]);

  // Small city silhouettes provide a convincing sense of scale.
  for(let i=0;i<(conservative?28:48);i++){
    const angle=random()*Math.PI*2,dist=3+random()*13;
    const x=Math.sin(angle)*dist,z=Math.cos(angle)*dist-10;
    const w=1.1+random()*1.4,h=1.5+random()*3;
    mesh(box,darkStone,[x,h/2,z],[w,h,w*.85]);
    const top=mesh(cone,roof,[x,h+.7,z],[w*.87,1.5,w*.77]);top.rotation.y=Math.PI/4;
  }
  const tower=mesh(cylinder,stone,[-4,11.3,-18],[2.2,22.6,2.2]);
  mesh(cone,roof,[-4,24.3,-18],[3.1,3.5,3.1]).rotation.y=Math.PI/4;

  // Scout-green pennants: actual deforming mesh, not a video or CSS substitute.
  const flagGeometry=keep(new T.PlaneGeometry(2.6,4.1,12,16));
  [-4.2,4.2].forEach((x,i)=>{
    mesh(cylinder,brass,[x,20.3,14],[.055,6.3,.055]);
    const geometry=keep(flagGeometry.clone());geometry.translate(1.3,-2.05,0);
    const flag=mesh(geometry,fabric,[x,23,14],[1,1,1]);
    flag.userData.original=geometry.attributes.position.array.slice();flag.userData.phase=i*1.9;
    flags.push(flag);
    const stripe=mesh(box,material(0xbbc9a0),[x+.22,21,14.035],[.07,3.8,.03]);
  });
  // Wind-worn conifers around the foreground, all geometry local.
  const leaves=material(0x243d28);
  for(let i=0;i<(conservative?28:52);i++){
    const angle=random()*Math.PI*2,dist=28+random()*21;
    const x=Math.sin(angle)*dist,z=Math.cos(angle)*dist-7;
    if(Math.abs(x)<7&&z>16)continue;
    const h=2+random()*4;
    mesh(cylinder,wood,[x,h*.28,z],[.1,h*.6,.1]);
    mesh(keep(new T.ConeGeometry(h*.28,h,5)),leaves,[x,h*.57,z]);
  }
  // A small abstract surveyor at the gate. No named anime character or model asset.
  mesh(box,wood,[2.7,.5,20.5],[.4,1,.28]);
  mesh(keep(new T.ConeGeometry(.52,1.4,6)),fabric,[2.7,1.4,20.5]);
  mesh(keep(new T.SphereGeometry(.23,8,6)),darkStone,[2.7,2.22,20.5]);

  const particleCount=conservative?65:150;
  const positions=new Float32Array(particleCount*3);
  for(let i=0;i<particleCount;i++){positions[i*3]=(random()-.5)*65;positions[i*3+1]=random()*27;positions[i*3+2]=random()*58-18;}
  const particlesGeometry=keep(new T.BufferGeometry());particlesGeometry.setAttribute('position',new T.BufferAttribute(positions,3));
  const particlesMaterial=keep(new T.PointsMaterial({map:glowMap,color:0xcbd8a1,size:.14,transparent:true,opacity:.52,depthWrite:false,sizeAttenuation:true}));
  const particles=new T.Points(particlesGeometry,particlesMaterial);scene.add(particles);
  fortress.rotation.y=-.15;

  function resize(){
    if(disposed||lost)return;
    const {width,height}=host.getBoundingClientRect();
    const w=Math.max(1,Math.round(width)),h=Math.max(1,Math.round(height));
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,pixelCap));
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
    host.dataset.quality=conservative?'efficient':'adaptive';
    host.dataset.resolution=`${canvas.width}×${canvas.height}`;
    update(0);draw();
  }
  function update(dt){
    const compact=host.clientWidth<761;
    const ease=1-Math.exp(-3.5*dt);
    state.x+=(state.pointerX-state.x)*ease;state.y+=(state.pointerY-state.y)*ease;
    state.progress+=(state.scroll-state.progress)*ease;
    const travel=motion.paused?0:state.progress;
    camera.position.set((compact?28:32)+(motion.paused?0:state.x*1.4)-travel*4,21+(motion.paused?0:state.y*.65)+travel*2,compact?66:58-travel*6);
    camera.lookAt(compact?-8:-13,compact?15:11,-3);
    if(!motion.paused){
      flags.forEach(flag=>{
        const attr=flag.geometry.attributes.position,original=flag.userData.original;
        for(let i=0;i<attr.count;i++){
          const x=original[i*3],y=original[i*3+1];
          attr.setZ(i,Math.sin(x*2.6+y*.8+state.time*1.7+flag.userData.phase)*.22*(x/2.6));
        }
        attr.needsUpdate=true;flag.geometry.computeVertexNormals();
      });
      particles.position.x=Math.sin(state.time*.07)*3;
      particles.position.y=Math.sin(state.time*.11)*1.2;
      particles.rotation.y=state.time*.008;
    }
  }
  function draw(){
    if(disposed||lost)return;
    try {renderer.render(scene,camera);host.dataset.status='webgl';host.dataset.drawCalls=String(renderer.info.render.calls);}
    catch {host.dataset.status='illustration';lost=true;stop();}
  }
  function frame(now){
    raf=0;if(disposed||lost||document.hidden||!inView||suspended||motion.paused)return;
    const raw=previous?(now-previous)/1000:1/60;previous=now;
    const dt=Math.min(.045,raw);state.time+=dt;
    // Lower render density after sustained slow frames. Never switch based on UA strings.
    if(raw<.1){samples++;totalFrameTime+=raw;}
    if(samples>=100){
      if(totalFrameTime/samples>.027&&pixelCap>.8){slowFrames++;if(slowFrames>=2){pixelCap=Math.max(.8,pixelCap-.2);resize();slowFrames=0;}}
      else slowFrames=0;
      samples=0;totalFrameTime=0;
    }
    update(dt);draw();start();
  }
  function start(){if(!raf&&!disposed&&!lost&&!document.hidden&&inView&&!suspended&&!motion.paused)raf=requestAnimationFrame(frame);}
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0;previous=0;}
  function syncMotion(){stop();update(0);draw();start();}
  const viewportObserver=new ResizeObserver(resize);viewportObserver.observe(host);
  const visibleObserver=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)start();else stop();});visibleObserver.observe(host);
  window.addEventListener('resize',resize,{...options,passive:true});
  window.addEventListener('scroll',()=>{state.scroll=clamp(scrollY/Math.max(1,host.offsetHeight),0,1);},{...options,passive:true});
  host.parentElement.addEventListener('pointermove',event=>{
    if(coarse.matches||motion.paused)return;
    const rect=host.getBoundingClientRect();state.pointerX=clamp((event.clientX-rect.left)/rect.width*2-1,-1,1);state.pointerY=clamp((event.clientY-rect.top)/rect.height*2-1,-1,1);
  },{...options,passive:true});
  host.parentElement.addEventListener('pointerleave',()=>{state.pointerX=0;state.pointerY=0;},options);
  document.addEventListener('frontier:motion',syncMotion,options);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();},options);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;stop();host.dataset.status='illustration';},options);
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;resize();start();},options);
  function dispose(){
    if(disposed)return;stop();disposed=true;controller.abort();viewportObserver.disconnect();visibleObserver.disconnect();
    for(const resource of resources)if(typeof resource.dispose==='function')resource.dispose();
    renderer.dispose();scene.clear();host.dataset.status='illustration';
  }
  window.addEventListener('pagehide',event=>{if(event.persisted){suspended=true;stop();}else dispose();},options);
  window.addEventListener('pageshow',()=>{suspended=false;start();},options);
  resize();start();
})();
