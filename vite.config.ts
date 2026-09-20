import { defineConfig } from 'vite';
import projects from './src/projects.json';

const escape = (value: string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
export default defineConfig({
  base: '/Portfolio/',
  plugins: [{
    name: 'static-project-archive',
    transformIndexHtml(html) {
      return html.replace('<!-- PROJECT_ROWS -->', projects.map(p => `<a class="project-row" href="https://github.com/sandeep848/${p.slug}" target="_blank" rel="noopener noreferrer" data-era="${p.era.toLowerCase()}" aria-label="${escape(p.title)} on GitHub"><span class="project-no mono">${p.no}</span><div class="project-body"><h3>${escape(p.title)}</h3><p>${escape(p.description)}</p><span class="project-stack mono">${escape(p.stack)}</span></div><span class="project-meta"><span>${escape(p.category)}</span><span class="era-tag mono">${p.era}</span></span><span class="project-arrow" aria-hidden="true">↗</span></a>`).join('\n'));
    }
  }],
  build: { target: 'es2022', assetsInlineLimit: 0, sourcemap: true }
});
