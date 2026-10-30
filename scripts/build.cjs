'use strict';
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
fs.mkdirSync(path.join(root,'vendor/voice'),{recursive:true});
require('esbuild').buildSync({entryPoints:[path.join(root,'app/voice-entry.js')],bundle:true,minify:true,platform:'browser',format:'iife',outfile:path.join(root,'vendor/voice/voice.bundle.js')});
console.log('Built bundled synthesized voices locally. Generated runtime contains GPL meSpeak/eSpeak; do not redistribute it under CC0.');

const playwrightRoot=path.dirname(require.resolve("playwright-core/package.json"));fs.cpSync(playwrightRoot,path.join(root,"vendor/playwright-core"),{recursive:true});console.log("Copied pinned Playwright Core locally; Apache-2.0 notices retained.");
// Original audio bytes are tracked once, not duplicated in generated JavaScript/JSON.
const manifest=JSON.parse(fs.readFileSync(path.join(root,'library/manifest.json'),'utf8'));
const library={...manifest,assets:manifest.assets.map(asset=>({...asset,data:'data:'+asset.mime+';base64,'+fs.readFileSync(path.join(root,'library',asset.file)).toString('base64')}))};
fs.writeFileSync(path.join(root,'app/library.js'),'window.AUDIO_LIBRARY='+JSON.stringify(library)+';\n');
fs.writeFileSync(path.join(root,'library/library.jet-audio-library.json'),JSON.stringify(library));
console.log('Built portable library with '+library.assets.filter(a=>a.kind==='music').length+' original music tracks and '+library.assets.filter(a=>a.kind==='sfx').length+' SFX.');
