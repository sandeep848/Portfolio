const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (a: number, b: number, p: number) => { const t = clamp((p - a) / (b - a)); return t * t * t * (t * (t * 6 - 15) + 10); };
export type CameraPlate = { scale: number; x: number; y: number; opacity: number };

// Photographic match dissolves on one reversible, scroll-controlled camera path.
// The long middle shot gives the analog dashboard time to read before the exit.
export function cinematicFrame(progress: number, reduced: boolean): CameraPlate[] {
  const p = clamp(progress);
  if (reduced) return [
    { scale: 1, x: 0, y: 0, opacity: 1 },
    ...Array.from({ length: 3 }, () => ({ scale: 1, x: 0, y: 0, opacity: 0 })),
    { scale: 1, x: 0, y: 0, opacity: ease(.4, .75, p) },
  ];
  const approach = ease(0, .32, p), enter = ease(.13, .49, p);
  const dashboard = ease(.34, .77, p), exit = ease(.62, 1, p);
  return [
    { scale: 1 + 1.5 * approach, x: .15 * approach, y: -.025 * approach, opacity: 1 },
    { scale: 1.04 + .34 * enter, x: .02 - .09 * enter, y: -.015 * enter, opacity: ease(.13, .29, p) },
    { scale: 1.15 + .06 * dashboard, x: .06 - .12 * dashboard, y: .005 - .015 * dashboard, opacity: ease(.33, .47, p) },
    { scale: 1.42 - .38 * exit, x: -.085 + .07 * exit, y: -.025 + .02 * exit, opacity: ease(.66, .8, p) },
    { scale: 2.1 - 1.1 * ease(.8, 1, p), x: -.21 * (1 - ease(.8, 1, p)), y: -.015 * (1 - exit), opacity: ease(.84, 1, p) },
  ];
}

export function paintCinematicFrame(root: HTMLElement, progress: number, reduced: boolean) {
  const frames = cinematicFrame(progress, reduced);
  frames.forEach((frame, i) => {
    root.style.setProperty(`--shot-${i}-transform`, `translate3d(${(frame.x * 100).toFixed(4)}%,${(frame.y * 100).toFixed(4)}%,0) scale(${frame.scale.toFixed(5)})`);
    root.style.setProperty(`--shot-${i}-opacity`, frame.opacity.toFixed(5));
  });
  root.style.setProperty('--era', ease(.65, .95, progress).toFixed(5));
}
