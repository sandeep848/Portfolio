import { readFileSync, existsSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync('dist/index.html','utf8');
const projects=JSON.parse(readFileSync('src/projects.json','utf8'));
assert.equal(projects.length,14);
assert.equal((html.match(/id="project-gallery"/g)||[]).length,1);
for(const id of ['project-prev','project-next'])assert(html.includes('id="'+id+'"'));
assert(!html.includes('class="project-grid"'));
assert(!/id="(?:rail-range|rail-current|rail-total|project-autoplay)"/.test(html),'Obsolete gallery controls must stay removed');
assert(projects.every(p=>!p.image.startsWith('car-')&&p.imageSource));
assert(html.includes('href="#projects">Projects</a>'),'Keep the Projects link without a count');
assert(!/tachometer|dial-value/.test(html),'The scroll gauge must stay removed');
assert(new Set(projects.map(p=>p.image)).size===14);
assert.equal(new Set(projects.map(p=>p.slug)).size,14);
assert.equal((html.match(/class="project-card"/g)||[]).length,14);
for(const p of projects){
  assert(html.includes(`href="https://github.com/sandeep848/${p.slug}"`));
  assert(p.description.length>30&&p.alt.length>20&&p.stack.length>=2);
  assert(existsSync(`dist/assets/projects/${p.image}`));
  assert(statSync(`dist/assets/projects/${p.image}`).size<(p.image==='geolocation-map.png'?1500000:150000));
}
for(const [group,count] of [['vision',3],['genai',7],['data',4]])assert.equal(projects.filter(p=>p.group===group).length,count);
for(const id of ['top','about','projects','experience','contact'])assert(html.includes(`id="${id}"`));
assert(!/id="(?:archive|work|shift)"/.test(html),'Old duplicate project sections remain');
assert(html.includes('mailto:das364278@gmail.com'));
assert(!html.includes('<!-- PROJECT_CARDS -->'));
for(const ref of html.matchAll(/(?:src|href)="(\/Portfolio\/[^"#?]+)/g)) {
  const path='dist/'+ref[1].slice('/Portfolio/'.length);
  assert(existsSync(path),`Missing built asset: ${path}`);
}
for(const name of ['old-school','new-school'])assert(statSync(`dist/assets/${name}.webp`).size<400000);
assert(!/secret-pathways|filmstrip|modern-content|Fundamentals,|done properly\./i.test(html));
console.log('Verified one gallery, 14 unique projects, accessible project images, filters, contact and all built assets.');
