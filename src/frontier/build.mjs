import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const assets=fs.existsSync(path.join(root,'assets'))?path.join(root,'assets'):path.resolve(root,'../../assets');
const projects=JSON.parse(fs.readFileSync(path.join(assets,'projects.json'),'utf8'));
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const cards=projects.map((p,i)=>`<a class="project-item" data-repo="${escape(p.name)}" data-category="${escape(p.category)}" href="https://github.com/sandeep848/${encodeURIComponent(p.name)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(p.title)} on GitHub">
        <div class="project-item-top"><span>${escape(p.label.toUpperCase())}</span><span>${String(i+1).padStart(2,'0')} / ↗</span></div>
        <h3>${escape(p.title)}</h3><p>${escape(p.description)}</p>
        <div class="project-item-bottom"><span>${escape(p.tech)}</span><span>GitHub ↗</span></div>
      </a>`).join('\n      ');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(html.includes('<!-- PROJECTS -->'),'Source template requires project marker');
html=html.replace('<!-- PROJECTS -->',cards);
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.writeFileSync(path.join(root,'dist/index.html'),html);
assert.equal(projects.length,14);
assert.equal(new Set(projects.map(p=>p.name)).size,14);
assert.equal((html.match(/class="project-item"/g)||[]).length,14);
assert(!/kage|filmstrip|threeui|secret-pathways/i.test(html));
for(const file of ['frontier.js','frontier-scene.js'])new vm.Script(fs.readFileSync(path.join(assets,file),'utf8'),{filename:file});
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'Duplicate HTML IDs');
for(const [,id] of html.matchAll(/href="#([^"]+)"/g))assert(ids.includes(id),`Broken anchor: ${id}`);
for(const [,href] of html.matchAll(/href="(https:[^"]+)"/g))assert(new URL(href).protocol==='https:');
assert(!projects.some(p=>/icar-api|Landcover-ML/i.test(p.name)),'Private project in public catalog');
console.log(JSON.stringify({projects:projects.length,htmlBytes:Buffer.byteLength(html),checks:'syntax, links, unique IDs, project privacy, no template dependencies'},null,2));
