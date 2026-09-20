# Sandeep Das — AI & Robotics

My portfolio: [sandeep848.github.io/Portfolio](https://sandeep848.github.io/Portfolio/).

A personal introduction, one gallery of 14 public projects, experience and contact information. The original forest-to-desert car scene stays behind every section. All sections are transparent; translucent reading surfaces keep the text legible.

## Local development

Requires Node.js 22.12 or later.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Vite uses `/Portfolio/` as its base. GitHub Actions builds `dist/` and publishes it to Pages. Pull requests run the same checks without deploying.

## Content

- `index.html`: introduction, skills, education, internship and contact.
- `src/projects.json`: reviewed project descriptions, categories, stacks, repository branches and image attribution.
- `vite.config.ts`: renders all project cards into HTML at build time. Cards and links work without JavaScript.
- `public/assets/projects`: 13 original SVG workflow illustrations plus an actual LoRA sample.
- `scripts/project-art.py`: source for the SVG illustrations.

The project catalog was checked against all 14 public project repositories on 20 September 2026. Private repositories, the profile repository and this site's repository are excluded. The catalog is versioned editorial content, not a live API feed. Update it when adding or changing a project. No live-demo URLs were advertised by these repositories at review time; cards link to GitHub and the project's README.

The data dashboard description was corrected against its React source: it processes uploaded datasets and recommends visualizations; it does not monitor model usage.

## Visual design and motion

The fixed scene is visible from the introduction through contact. Scrolling from About to Projects drives the existing directional shader transition. The scene continues with subtle camera drift and pointer parallax after the transition, and all sections use the same cream, charcoal, muted green and warm accent palette.

Section headings reveal with a translating fade and extending rule. Project cards enter in a short stagger. The content stays visible after entering; backscroll does not hide it again. Native touch scrolling is preserved. Wheel smoothing applies only to fine pointers with full motion enabled.

The site respects system reduced-motion preferences and has a footer motion control. If WebGL is unavailable, the same local images crossfade in CSS. The renderer stops while the tab is hidden, caps pixel ratio, lowers resolution when consistently slow, and disposes its resources on navigation. No blocking loader, audio, cursor replacement or scroll trapping is used.

Fonts (Instrument Serif, Onest and DM Mono) are bundled locally with their licenses. The two background WebP images are unchanged. Project artwork is loaded lazily and each asset is below 150 KB.

## Image provenance

The automotive backgrounds are AI-generated illustrative scenes created for the previous portfolio revision. They are not project output.

Each SVG card is explicitly labeled **Concept illustration** and depicts the documented project workflow. Charts and maps in them are schematic, not measured results or screenshots.

`lora.webp` is a resized WebP copy of [`samples/sample_1.png`](https://github.com/sandeep848/stable-diffusion-lora-style-tuning/blob/main/samples/sample_1.png), shown as **Repository model output**. The project credits Sandeep Das, Mahalakshmi and Dinely. No ownership or license of the underlying project is changed.

## Checks

`npm run build` checks TypeScript, builds production assets, copies font licenses, and validates the single project gallery, 14 unique project URLs, filter counts, required content sections and image budgets.

Browser verification covers 1440, 820, 390 and 320 pixel layouts, persistent background visibility, category filters, GitHub links, keyboard navigation, old section anchors and the motion control. GPU behavior needs a hardware-enabled browser; the review browser may use the CSS fallback.

Old `#work`, `#archive`, `#pathways`, `#lessons` and `#shift` links resolve to `#projects`. `#gate` resolves to `#about`, and `#eternity` to `#contact`.
