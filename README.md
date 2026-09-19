# Sandeep Das — Beyond the Walls

An original AI & Robotics portfolio, inspired by the atmosphere of exploration and monumental architecture in Attack on Titan. The site is not affiliated with the anime and uses no character models, anime footage, soundtrack, or franchise logos.

## Live site

https://sandeep848.github.io/Portfolio/

## Design and interaction

- Original Three.js fortress with instanced stonework, an arched gate, wind-deformed flags, atmospheric particles, and gentle scroll/pointer camera movement.
- A local SVG fortress illustration provides an immediate, accessible fallback if WebGL is unavailable or Data Saver is enabled.
- Responsive navigation, project search and category filters, native anchor scrolling, visible keyboard focus, and complete static project links.
- Animation pauses off-screen and in hidden tabs. The motion control and `prefers-reduced-motion` setting disable autonomous movement.
- Conservative pixel density on coarse-pointer or low-resource devices; resolution decreases after sustained slow frames.
- No autoplay sound, scroll hijacking, API secrets, analytics, or tracking cookies.

## Files

`index.html` is the static entry point. `assets/frontier.css`, `assets/frontier.js`, and `assets/frontier-scene.js` implement the layout, interaction, and original 3D world. `assets/projects.json` records the curated public-project snapshot. The catalog reconciles with the public GitHub API when scrolled near the archive, including newly public repositories; private repositories and the profile/portfolio infrastructure repositories are excluded. If the API is unavailable, the full static snapshot remains usable.

The source template and build/check scripts live in `src/frontier/`. A browser review harness lives at `tests/responsive.html`. From the repository root:

```sh
node src/frontier/build.mjs
node src/frontier/scene-check.mjs
python -m http.server 8000
```

The build writes `src/frontier/dist/index.html`; copy that generated page to the repository root when updating the template. The build verifies script syntax, project uniqueness and privacy, internal anchors, and absence of the previous template dependencies. The scene smoke check uses real Three.js geometry with a renderer stub to test camera framing, finite geometry, motion pause, visibility, context loss/restoration, and disposal; it does not test GPU rendering. Browser QA should include desktop, narrow portrait and landscape, menu keyboard operation, filters/search, motion pause, system reduced motion, WebGL fallback, and repository links.

## Dependencies and attribution

The site reuses the repository's pinned Three.js r149 runtime under `assets/vendor/three.min.js` (MIT; copyright Three.js Authors, preserved in its header), plus its existing local font payloads under `assets/frontier-fonts.css`. No ThreeUI renderer or Kage code is loaded. Earlier design files are retained in Git history and legacy repository paths for recovery, but are not requested by the new site.
