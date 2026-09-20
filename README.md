# Sandeep Das — Old School → New School

A single-page portfolio moving from classical engineering to modern AI. Two original, AI-generated automotive photographs carry a reversible scroll transition, while all project and contact content remains ordinary, accessible HTML.

## Run locally

Requires Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run preview
```

Vite uses `/Portfolio/` as its base. The production output is `dist/`.

## Structure

- `index.html`: supplied portfolio copy, sections, contact and featured links.
- `src/projects.json`: the 14 supplied project records, rendered at build time.
- `src/main.ts`: navigation, filters, ScrollTrigger, Lenis and accessibility.
- `src/scene.ts`: lazily loaded Three.js layer, resource and performance management.
- `src/transition.frag.glsl`: cover framing, directional displaced wipe, streaks, red edge, mild chromatic aberration and grading.
- `src/style.css`: responsive visual system and CSS image fallback.
- `public/assets`: two optimized WebP plates and the favicon.

Instrument Serif, DM Mono and Onest are bundled locally through Fontsource. There are no third-party font or image requests. Fonts retain their upstream open-source licenses.

## Motion and accessibility

The transition is a native sticky section. ScrollTrigger measures progress; it does not trap scrolling. Lenis only smooths fine-pointer wheel scrolling. Touch and reduced-motion scrolling remain native. The layout retains the whole car in a panoramic region on phones.

Reduced-motion and unavailable WebGL use a CSS crossfade. A footer control allows visitors to reduce motion. The 3D renderer pauses when the scene is covered, offscreen or the tab is hidden, caps pixel ratio at 1.75 (1.15 on phones), reduces resolution on consistently slow devices, and releases resources on navigation. No audio is loaded.

Legacy hashes `#gate`, `#pathways`, `#lessons`, and `#eternity` map to the new sections. `#work` links directly to Featured Systems. All 14 project links and all content remain in the built HTML without JavaScript.

## Image provenance

The two backgrounds were generated with the built-in image-generation tool for this project. They are illustrative automotive scenes, not project screenshots or evidence of ownership. Both are 2560 pixels wide and below 400 KB.

Old-school prompt: photorealistic black late-1960s Charger-style coupe, nose right, three-quarter front view, red brake calipers, cool overcast pine forest and quiet upper-left space.

New-school prompt: photorealistic modern black Challenger-style coupe, nose left, three-quarter front view, red brake calipers, empty desert highway, mountains and orange-magenta sunset.

## Verification

`npm run build` performs TypeScript checks, a production build, and verifies the static catalog, anchors, image sizes, and generated asset paths. Browser review covers desktop, tablet and phone layouts, filters, keyboard navigation, anchor compatibility and the CSS fallback. A constant 60 fps cannot be guaranteed across devices; validate GPU performance on target hardware.
