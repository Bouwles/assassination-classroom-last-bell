import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
// Guard static releases against root-only assets and development-only endpoints.
const html=await readFile('dist/index.html','utf8');
assert.doesNotMatch(html,/(?:src|href)=["']\/(?!\/)/,'Root-relative entry breaks project Pages');
const assets=await readdir('dist/assets');
for(const name of assets){const text=await readFile(`dist/assets/${name}`,'utf8');if(name.endsWith('.js')){assert.doesNotMatch(text,/127\.0\.0\.1|localhost|window\.__game/);assert.doesNotMatch(text,/src=["']\/portraits\//);}if(name.endsWith('.css'))assert.doesNotMatch(text,/url\(["']?\/fonts\//);}
for(const path of ['fonts/Barlow-Regular.ttf','fonts/BarlowCondensed-SemiBold.ttf','portraits/koro.png','portraits/nagisa.png','portraits/karma.png','portraits/kaede.png'])assert.ok((await readFile(`dist/${path}`)).length>1000,path);
console.log('Static build has relative entries, local fonts/portraits and no localhost/dev hook runtime.');
