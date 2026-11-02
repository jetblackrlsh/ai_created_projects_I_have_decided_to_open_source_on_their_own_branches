const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),context);
const paths=new Set();function visit(x){if(typeof x==='string'&&x.startsWith('assets/'))paths.add(x);else if(Array.isArray(x))x.forEach(visit);else if(x&&typeof x==='object')Object.values(x).forEach(visit);}visit(context.window.LUMEN_DATA);
for(const file of ['index.html','styles.css','app.js']){const text=fs.readFileSync(path.join(root,file),'utf8');assert(!/https?:\/\//i.test(text),'unexpected remote runtime reference in '+file);for(const match of text.matchAll(/assets\/[\w./-]+\.(?:png|jpg|jpeg|webp|svg)/g))paths.add(match[0]);}
assert(paths.size>0,'no art references');for(const relative of paths){const absolute=path.resolve(root,relative);assert(absolute.startsWith(root+path.sep),'path escapes root');assert(fs.existsSync(absolute),'missing art: '+relative);assert(fs.statSync(absolute).size>100,'empty art: '+relative);}
console.log(`PASS: ${paths.size} unique local art references exist; runtime has no remote dependency URLs.`);
