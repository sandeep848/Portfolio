precision highp float;
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform sampler2D uTexC;
uniform sampler2D uTexD;
uniform sampler2D uTexE;
uniform vec2 uRes;
uniform vec4 uFrames[5];
varying vec2 vUv;

// Match the CSS camera precisely: uniform scale and translation, no rubber-sheet warping.
vec2 cameraUV(vec4 frame) {
  vec2 uv=(vUv-.5-vec2(frame.y,-frame.z))/frame.x+.5;
  float screenAspect=uRes.x/uRes.y;
  float imageAspect=16.0/9.0;
  vec2 cover=vec2(min(screenAspect/imageAspect,1.0),min(imageAspect/screenAspect,1.0));
  return clamp((uv-.5)*cover+.5,vec2(.001),vec2(.999));
}
void main() {
  vec3 color=texture2D(uTexA,cameraUV(uFrames[0])).rgb;
  color=mix(color,texture2D(uTexB,cameraUV(uFrames[1])).rgb,uFrames[1].w);
  color=mix(color,texture2D(uTexC,cameraUV(uFrames[2])).rgb,uFrames[2].w);
  color=mix(color,texture2D(uTexD,cameraUV(uFrames[3])).rgb,uFrames[3].w);
  color=mix(color,texture2D(uTexE,cameraUV(uFrames[4])).rgb,uFrames[4].w);
  gl_FragColor=vec4(color,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
