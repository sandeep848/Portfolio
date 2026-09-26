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

float edge(vec2 a, vec2 b, vec2 p) {
  vec2 d=b-a;
  return (d.x*(p.y-a.y)-d.y*(p.x-a.x))/length(d);
}
float oldDoor(vec2 p) {
  float d=edge(vec2(.354,.298),vec2(.460,.270),p);
  d=min(d,edge(vec2(.460,.270),vec2(.469,.454),p));
  d=min(d,edge(vec2(.469,.454),vec2(.454,.568),p));
  d=min(d,edge(vec2(.454,.568),vec2(.395,.554),p));
  d=min(d,edge(vec2(.395,.554),vec2(.357,.455),p));
  d=min(d,edge(vec2(.357,.455),vec2(.354,.298),p));
  return smoothstep(-.0008,.0008,d);
}
float newDoor(vec2 p) {
  float d=edge(vec2(.677,.270),vec2(.770,.294),p);
  d=min(d,edge(vec2(.770,.294),vec2(.770,.430),p));
  d=min(d,edge(vec2(.770,.430),vec2(.734,.534),p));
  d=min(d,edge(vec2(.734,.534),vec2(.681,.535),p));
  d=min(d,edge(vec2(.681,.535),vec2(.677,.270),p));
  return smoothstep(-.0008,.0008,d);
}
// Inverse perspective projection of a photo-textured door around its vertical hinge.
vec2 hingeUV(vec2 uv, vec2 pivot, float angle) {
  vec2 d=uv-pivot;
  float x=d.x/max(.12,cos(angle)-d.x*sin(angle)/.65);
  return pivot+vec2(x,d.y*(1.0+x*sin(angle)/.65));
}
vec3 photo(sampler2D image, vec2 uv) { return texture2D(image,clamp(uv,vec2(.001),vec2(.999))).rgb; }
vec2 plateUV(vec2 uv) {
  float imageAspect=2560.0/1441.0;
  float screenAspect=uRes.x/uRes.y;
  vec2 cover=vec2(min(screenAspect/imageAspect,1.0),min(imageAspect/screenAspect,1.0));
  return (uv-vec2(.55,.38))*cover+vec2(.55,.38);
}
void main() {
  float p=clamp(uProgress,0.0,1.0);
  float entry=smoothstep(.08,.50,p), exit=smoothstep(.50,.96,p);
  float blend=smoothstep(.44,.64,p);
  float cabin=smoothstep(.22,.43,p)*(1.0-smoothstep(.63,.90,p));
  vec2 uv=plateUV(vUv);
  // The camera approaches the old driver's door, then pulls out from the new side.
  vec2 oldUV=(uv-.5)/(1.0+entry*2.8)+mix(vec2(.5),vec2(.413,.48),entry);
  vec2 newUV=(uv-.5)/(1.0+(1.0-exit)*2.8)+mix(vec2(.726,.46),vec2(.5),exit);
  vec2 drift=vec2(sin(uTime*.12),cos(uTime*.09))*.0012*(1.0-cabin);
  oldUV+=drift;newUV+=drift;
  newUV+=uPointer*vec2(12.0)/uRes*smoothstep(.92,1.0,p);
  float oldAngle=1.12*smoothstep(.16,.46,p);
  float newAngle=-1.12*(1.0-smoothstep(.57,.96,p));
  vec2 oldPanel=hingeUV(oldUV,vec2(.464,.43),oldAngle);
  vec2 newPanel=hingeUV(newUV,vec2(.679,.43),newAngle);
  vec3 a=photo(uTexA,oldUV), b=photo(uTexB,newUV);
  // A dark cabin is revealed behind each moving door; the original cars stay intact.
  a=mix(a,vec3(.018,.024,.022),oldDoor(oldUV)*smoothstep(.02,.28,oldAngle));
  b=mix(b,vec3(.023,.019,.014),newDoor(newUV)*smoothstep(.02,.28,abs(newAngle)));
  a=mix(a,photo(uTexA,oldPanel)*(1.0-.2*sin(oldAngle)),oldDoor(oldPanel));
  b=mix(b,photo(uTexB,newPanel)*(1.0-.2*sin(abs(newAngle))),newDoor(newPanel));
  float luminance=dot(a,vec3(.2126,.7152,.0722));
  a=mix(vec3(luminance),a,.58)*vec3(.93,1.0,.96);
  vec3 color=mix(a,b,blend);
  // A quiet exposure dip and warm edge light hide the handoff inside the cabin.
  color*=1.0-cabin*.38;
  float light=pow(max(0.0,1.0-abs(vUv.x-(1.0-blend))),14.0)*cabin;
  color+=vec3(.68,.34,.15)*light*.075;
  float vignette=1.0-smoothstep(.28,.82,length((vUv-.5)*vec2(.9,1.0)))*(.18+cabin*.16);
  color*=vignette;
  gl_FragColor=vec4(color,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
