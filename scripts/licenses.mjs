import { existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const packages = ['@fontsource-variable/space-grotesk','@fontsource-variable/manrope'];
mkdirSync('dist/assets/font-licenses',{recursive:true});
for (const name of packages) {
  const base=join('node_modules',name);
  const license=['LICENSE','OFL.txt','LICENSE.txt','OFL.md'].map(p=>join(base,p)).find(p=>existsSync(p));
  if(!license)throw new Error(`Missing distributed font license for ${name}`);
  copyFileSync(license,`dist/assets/font-licenses/${name.split('/').pop()}.txt`);
}
