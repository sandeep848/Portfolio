# Sandeep Das — portfolio

[Live site](https://sandeep848.github.io/Portfolio/)

A car-themed personal portfolio about my AI and robotics coursework, experiments and applications. The original forest-to-desert photographic transition stays behind every section.

## Experience

- Continuous scroll-linked camera movement, oversized editorial typography, word illumination, moving section titles and a progress dial.
- One horizontal gallery of 14 public projects. On sufficiently wide and tall screens with a precise pointer, vertical scrolling moves through the cards. On touch devices, short screens and reduced motion, the same gallery uses native horizontal scrolling.
- Previous/next buttons, a labelled project-position slider, category filters and keyboard navigation. A skip link bypasses the longer gallery.
- Fourteen automotive concept covers share one photographic style. They are explicitly labelled artwork and do not represent screenshots or project results.
- Instrument Serif, Onest and DM Mono are served locally. Project data is rendered into HTML at build time, so cards and links exist without JavaScript.

## Develop

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Node 22 is used by GitHub Actions. The build runs TypeScript and checks project uniqueness, gallery controls, image budgets and local references.

## Content

`src/projects.json` is the reviewed project catalog. Descriptions are based on the repository code and READMEs. Private repositories and the profile/portfolio infrastructure repositories are excluded. This is an editorial snapshot, not a claim of real-time GitHub synchronization. Update this file when project facts change.

`index.html` contains personal content. `src/gallery.ts` manages the horizontal gallery; `src/main.ts` owns navigation, motion preferences and scroll choreography. `src/scene.ts` and `src/transition.frag.glsl` retain the original WebGL transition.

The build uses GitHub Pages' `/Portfolio/` base path. Old section anchors redirect to the current sections.

## Motion and accessibility

- OS reduced-motion settings are respected, with an optional local preference switch in the footer.
- The gallery falls back to native horizontal scrolling when JavaScript, GPU support or available screen space is limited. Touch does not use wheel smoothing.
- Project links stay accessible by keyboard; focusing an off-screen card brings it into view.
- A fixed CSS photographic fallback keeps the car imagery visible when WebGL is unavailable. Camera motion works in both rendering paths.
- WebGL rendering pauses in hidden tabs, caps resolution and releases resources on page teardown.
- Background imagery is decorative. Project covers have descriptive alt text and a concept-art label.

`public/review.html` is an unlinked, noindex responsive review harness. Use it to inspect desktop, tablet and small phone dimensions. Hardware WebGL should also be reviewed on an actual supported device.

## Artwork

Generated automotive artwork lives in `public/assets/projects/car-*.webp`; all 14 covers total about 787 KB. See [art direction and prompts](docs/art-direction.md). The original background images remain unchanged.
