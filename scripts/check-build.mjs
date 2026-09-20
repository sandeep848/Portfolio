import { readFileSync, existsSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync('dist/index.html','utf8');
const projects=JSON.parse(readFileSync('src/projects.json','utf8'));
assert.equal(projects.length,14);
assert.equal(new Set(projects.map(p=>p.slug)).size,14);
for(const p of projects)assert(html.includes(`href="https://github.com/sandeep848/${p.slug}"`));
for(const id of ['top','about','shift','work','archive','contact'])assert(html.includes(`id="${id}"`));
assert(html.includes('mailto:das364278@gmail.com'));
assert(!html.includes('<!-- PROJECT_ROWS -->'));
for(const ref of html.matchAll(/(?:src|href)="(\/Portfolio\/[^"#?]+)/g)) {
  const path='dist/'+ref[1].slice('/Portfolio/'.length);
  assert(existsSync(path),`Missing built asset: ${path}`);
}
for(const name of ['old-school','new-school'])assert(statSync(`dist/assets/${name}.webp`).size<400000);
assert(!/secret-pathways|kage|filmstrip|frontier-scene/i.test(html));
console.log('Verified 14 projects, required anchors, contact, image budgets and /Portfolio/ build assets.');
