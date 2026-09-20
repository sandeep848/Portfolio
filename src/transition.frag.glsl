precision highp float;
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform vec2 uRes;
uniform vec2 uPointer;
uniform float uProgress;
uniform float uVelocity;
uniform float uTime;
uniform float uMobile;
varying vec2 vUv;

// Small three-octave value-noise field. No extra passes, render targets or textures.
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
}
float fbm(vec2 p) {
  float value = 0.0, weight = .5;
  for(int i=0;i<3;i++) { value += weight*noise(p); p=p*2.07+vec2(17.3,8.1); weight*=.5; }
  return value;
}
// Cover-fit around the common photographic focal point (55%, 62% from top).
// On phones a centered panoramic region retains the whole vehicle; the canvas
// itself remains fullscreen, fading into the page's asphalt outside that region.
vec2 plateUV(vec2 uv, out float frameMask) {
  float imageAspect = 2560.0 / 1441.0;
  float frameHeight = mix(uRes.y, uRes.x * .64, uMobile);
  float bottom = mix(0.0, uRes.y*.28 - frameHeight*.453125, uMobile);
  vec2 local = vec2(uv.x, (uv.y*uRes.y-bottom)/frameHeight);
  frameMask = mix(1.0, smoothstep(0.0,.14,local.y)*(1.0-smoothstep(.86,1.0,local.y)),uMobile);
  float frameAspect=uRes.x/frameHeight;
  vec2 scale=vec2(min(frameAspect/imageAspect,1.0),min(imageAspect/frameAspect,1.0));
  return (local-vec2(.55,.38))*scale+vec2(.55,.38);
}
vec3 sampleRGB(sampler2D image, vec2 uv, float aberration) {
  vec2 border=vec2(.001);
  return vec3(texture2D(image,clamp(uv+vec2(aberration,0),border,1.0-border)).r,
              texture2D(image,clamp(uv,border,1.0-border)).g,
              texture2D(image,clamp(uv-vec2(aberration,0),border,1.0-border)).b);
}
void main() {
  float shift=clamp((uProgress-.25)/.35,0.0,1.0);
  float blend=shift*shift*(3.0-2.0*shift);
  float peak=sin(blend*3.14159265);
  float speed=clamp(abs(uVelocity)/2200.0,0.0,1.0);
  float mask;
  vec2 uv=plateUV(vUv,mask);
  float holdZoom=mix(1.0,1.06,smoothstep(0.0,.25,uProgress));
  vec2 oldUV=(uv-vec2(.55,.38))/holdZoom+vec2(.55,.38);
  vec2 newUV=uv;
  // A restrained camera drift keeps the retained scene alive in every chapter.
  vec2 drift=vec2(sin(uTime*.12),cos(uTime*.09))*.0018*(1.0-uMobile*.6);
  oldUV+=drift;newUV+=drift;
  // Whole photographic plates move under the directional wipe. Nothing is
  // reconstructed, and both focal points return to exactly the same framing.
  oldUV.x-=pow(blend,1.6)*.38;
  newUV.x-=pow(1.0-blend,1.6)*.24;
  vec2 parallax=uPointer*vec2(24.0)/uRes*(1.0-uMobile);
  newUV+=parallax*smoothstep(.60,.95,uProgress);
  float haze=sin(uv.y*47.0+uTime*1.1)*sin(uv.y*111.0-uTime*.8)*.0025*peak*(.3+speed)*(1.0-uMobile);
  oldUV.x+=haze; newUV.x+=haze;
  float aberration=.0025*peak*(.3+speed)*(1.0-uMobile*.8);
  vec3 oldColor=sampleRGB(uTexA,oldUV,aberration);
  vec3 newColor=sampleRGB(uTexB,newUV,aberration);
  float luminance=dot(oldColor,vec3(.2126,.7152,.0722));
  oldColor=mix(vec3(luminance),oldColor,.58)*vec3(.93,1.0,.96);
  // An organic left-to-right leading edge, stretched noise and red caliper light.
  float displacement=(fbm(vec2(vUv.x*4.0,vUv.y*16.0))-.45)*.1*peak;
  float streakNoise=noise(vec2(vUv.x*1.8+uTime*.04,vUv.y*180.0));
  float edge=(blend*1.3-.15) - vUv.x + displacement + (streakNoise-.5)*.07*peak;
  float wipe=smoothstep(-.018,.018,edge);
  if(shift<=0.0)wipe=0.0;
  if(shift>=1.0)wipe=1.0;
  vec3 color=mix(oldColor,newColor,wipe);
  float glow=exp(-abs(edge)*65.0)*peak;
  float streaks=pow(streakNoise,12.0)*exp(-abs(edge)*8.0)*peak*(.05+speed*.12);
  color+=vec3(.882,.114,.114)*(glow*.16+streaks);
  float sun=exp(-length((vUv-vec2(.12,.65))*vec2(1.2,2.0))*5.0);
  color+=vec3(1.0,.42,.17)*sun*.035*blend;
  float grain=(hash(gl_FragCoord.xy+floor(uTime*12.0))-.5)*.025*(1.0-blend);
  color+=grain;
  float vignette=1.0-smoothstep(.3,.85,length((vUv-.5)*vec2(.9,1.0)))*.23*(1.0-blend);
  color*=vignette;
  color=mix(vec3(.047,.051,.047),color,mask);
  gl_FragColor=vec4(color,mix(1.0,mask,uMobile));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
