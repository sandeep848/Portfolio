# Sandeep Das — portfolio

[Live site](https://sandeep848.github.io/Portfolio/)

A car-themed personal portfolio about my AI and robotics coursework, experiments and applications. The original forest-to-desert photographic transition stays behind every section.

## Design

- Five photographic backgrounds share equal portions of the full page scroll, with matching framing, gentle camera movement and identical dissolves. The original cars are preserved.
- A compact continuous topic strip and one horizontal gallery of 14 public projects. Project cards move at 36 pixels per second; vertical wheel scrolling remains available over the gallery.
- Previous/next arrows occupy separate side gutters. Category filters and keyboard navigation remain available.
- Education and experience have separate sections, each containing three entries. The contact label opens an email composer without displaying the address.
- Space Grotesk and Manrope are served locally. Project data is rendered into HTML at build time, so cards and links exist without JavaScript.

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

`index.html` contains personal content. `src/gallery.ts` manages the horizontal gallery; `src/main.ts` owns navigation, motion preferences and scroll choreography. `src/cinematic.ts` defines the shared camera and timing for the CSS and WebGL renderers in `src/scene.ts` and `src/transition.frag.glsl`.

The build uses GitHub Pages' `/Portfolio/` base path. Old section anchors redirect to the current sections.

## Motion and accessibility

- OS reduced-motion settings are respected, with an optional local preference switch in the footer.
- The gallery uses native horizontal scrolling with an optional automatic loop. Touch does not use wheel smoothing; reduced motion stops the loop and camera transforms.
- Project links stay accessible by keyboard; focusing an off-screen card brings it into view.
- A fixed CSS photographic fallback keeps the car imagery visible when WebGL is unavailable. Camera motion works in both rendering paths.
- WebGL rendering pauses in hidden tabs, caps resolution and releases resources on page teardown.
- Background imagery is decorative. Project covers have descriptive alt text and a label identifying repository figures, model outputs or workflow illustrations.

`public/review.html` is an unlinked, noindex responsive review harness. Use it to inspect desktop, tablet and small phone dimensions. Hardware WebGL should also be reviewed on an actual supported device.

## Artwork

The original backgrounds and three generated doorway/dashboard views live in `public/assets/` and `public/assets/cinema/`. Project images live in `public/assets/projects/`; image sources are recorded in `src/projects.json`.
