import { defineConfig } from 'vite';
import projects from './src/projects.json';

const escape = (value: string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
export default defineConfig({
  base: '/Portfolio/',
  plugins: [{
    name: 'static-project-cards',
    transformIndexHtml(html) {
      return html.replace('<!-- PROJECT_CARDS -->', projects.map((p, i) => {
        const repo = `https://github.com/sandeep848/${p.slug}`;
        const source = 'imageSource' in p && p.imageSource ? p.imageSource : 'Concept illustration';
        return `<article class="project-card" data-group="${p.group}" aria-labelledby="project-${p.slug}">
          <figure class="project-visual"><img src="/Portfolio/assets/projects/${p.image}" alt="${escape(p.alt)}" width="960" height="640" loading="lazy" decoding="async"><span class="project-number mono">${String(i+1).padStart(2,'0')}</span><figcaption>${source}</figcaption></figure>
          <div class="project-content"><p class="eyebrow">${escape(p.category)}</p><h3 id="project-${p.slug}">${escape(p.title)}</h3><p class="project-description">${escape(p.description)}</p><ul class="stack" aria-label="Technology stack">${p.stack.map(s=>`<li>${escape(s)}</li>`).join('')}</ul><p class="project-detail">${escape(p.detail)}</p><div class="project-links"><a href="${repo}" target="_blank" rel="noopener noreferrer" aria-label="${escape(p.title)} on GitHub">GitHub <span aria-hidden="true">↗</span></a><a href="${repo}/blob/${p.branch}/README.md" target="_blank" rel="noopener noreferrer" aria-label="Read about ${escape(p.title)}">Read the project <span aria-hidden="true">↗</span></a></div></div>
        </article>`;
      }).join('\n'));
    }
  }],
  build: { target: 'es2022', assetsInlineLimit: 0, sourcemap: true }
});
