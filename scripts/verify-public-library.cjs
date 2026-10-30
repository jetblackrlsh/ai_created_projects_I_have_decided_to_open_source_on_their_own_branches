'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),vm=require('vm'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..'),box={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'app/library.js'),'utf8'),box);const lib=box.window.AUDIO_LIBRARY;
assert.equal(lib.assets.filter(a=>a.kind==='music').length,10);assert.equal(lib.assets.filter(a=>a.kind==='sfx').length,7);
for(const a of lib.assets){const raw=fs.readFileSync(path.join(root,'library',a.file));assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),a.sha256);assert.equal(raw.toString('base64'),a.data.split(',')[1]);const r=spawnSync('ffmpeg',['-v','error','-i',path.join(root,'library',a.file),'-f','null','-'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);}
console.log('PASS ten original thematic music files + seven SFX: selectable manifest entries, exact SHA256/embedded-byte equality and full FFmpeg decode.');
