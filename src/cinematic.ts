const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (a: number, b: number, value: number) => { const t = clamp((value - a) / (b - a)); return t * t * (3 - 2 * t); };

// The same scroll timeline drives the GPU scene and the lightweight CSS fallback.
export function cinematicFrame(progress: number, reduced: boolean) {
  const p = clamp(progress);
  const entry = ease(.08, .5, p), exit = ease(.5, .96, p);
  const era = ease(.44, .64, p);
  return {
    era,
    oldZoom: reduced ? 1 : 1 + entry * 2.8,
    newZoom: reduced ? 1 : 1 + (1 - exit) * 2.8,
    cabin: reduced ? 0 : ease(.22, .43, p) * (1 - ease(.63, .9, p)),
    entryOpacity: reduced ? 0 : ease(.13, .25, p) * (1 - ease(.44, .59, p)),
    exitOpacity: reduced ? 0 : ease(.43, .59, p) * (1 - ease(.78, .96, p)),
    entryX: -95 + 102 * ease(.12, .3, p) - 150 * ease(.3, .62, p),
    exitX: 110 - 125 * ease(.4, .63, p) + 165 * ease(.63, .96, p),
    entryAngle: -72 * ease(.19, .56, p),
    exitAngle: 70 * (1 - exit),
  };
}

export function paintCinematicFrame(root: HTMLElement, progress: number, reduced: boolean) {
  const f = cinematicFrame(progress, reduced);
  root.style.setProperty('--era', f.era.toFixed(4));
  root.style.setProperty('--old-zoom', f.oldZoom.toFixed(4));
  root.style.setProperty('--new-zoom', f.newZoom.toFixed(4));
  root.style.setProperty('--cabin', f.cabin.toFixed(4));
  root.style.setProperty('--entry-opacity', f.entryOpacity.toFixed(4));
  root.style.setProperty('--exit-opacity', f.exitOpacity.toFixed(4));
  root.style.setProperty('--entry-x', f.entryX.toFixed(3) + '%');
  root.style.setProperty('--exit-x', f.exitX.toFixed(3) + '%');
  root.style.setProperty('--entry-angle', f.entryAngle.toFixed(3) + 'deg');
  root.style.setProperty('--exit-angle', f.exitAngle.toFixed(3) + 'deg');
}
