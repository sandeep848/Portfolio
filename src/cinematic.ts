const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (a: number, b: number, p: number) => { const t = clamp((p - a) / (b - a)); return t * t * t * (t * (t * 6 - 15) + 10); };
export type CameraPlate = { scale: number; x: number; y: number; opacity: number };

// Five equal scroll intervals across the entire page. Each boundary has the
// same short dissolve, centered on 20%, 40%, 60% and 80% of page travel.
export function cinematicFrame(progress: number, reduced: boolean): CameraPlate[] {
  const p = clamp(progress), count = 5, halfBlend = .025;
  return Array.from({ length: count }, (_, i) => {
    const start = i / count, end = (i + 1) / count;
    const travel = ease(start - halfBlend, end + halfBlend, p);
    return {
      scale: reduced ? 1 : 1.06 + .06 * travel,
      x: reduced ? 0 : .015 - .03 * travel,
      y: reduced ? 0 : .005 - .01 * travel,
      opacity: i === 0 ? 1 : ease(start - halfBlend, start + halfBlend, p),
    };
  });
}

export function paintCinematicFrame(root: HTMLElement, progress: number, reduced: boolean) {
  const frames = cinematicFrame(progress, reduced);
  frames.forEach((frame, i) => {
    root.style.setProperty(`--shot-${i}-transform`, `translate3d(${(frame.x * 100).toFixed(4)}%,${(frame.y * 100).toFixed(4)}%,0) scale(${frame.scale.toFixed(5)})`);
    root.style.setProperty(`--shot-${i}-opacity`, frame.opacity.toFixed(5));
  });
  root.style.setProperty('--era', ease(.775, .825, progress).toFixed(5));
}
