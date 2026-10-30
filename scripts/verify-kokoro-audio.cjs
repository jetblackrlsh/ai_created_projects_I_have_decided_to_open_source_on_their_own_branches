'use strict';
const fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert/strict'),{spawnSync}=require('child_process'),S=require('../app/core.js'),A=require('./audio-export.cjs');
function wav(rate){const b=Buffer.alloc(44+rate*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(rate*2,40);for(let i=0;i<rate;i++)b.writeInt16LE(Math.round(4000*Math.sin(i*440*2*Math.PI/rate)),44+i*2);return b;}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'kokoro-mixed-rate-'));
try{const p=S.blank();p.scenes[0].duration=8;p.audio=[24000,44100].map((rate,i)=>({name:'Synthetic '+rate+' Hz fixture',kind:'narration',data:'data:audio/wav;base64,'+wav(rate).toString('base64'),start:i===0?1:4.5,offset:0,duration:1,sourceDuration:1,gain:.8}));S.validate(p);
 const file=path.join(tmp,'mix.wav');A.renderStem(p,file,'narration');const r=spawnSync('ffmpeg',['-v','error','-i',file,'-f','f32le','-ar','48000','-ac','1','-'],{maxBuffer:20e6});assert.equal(r.status,0,r.stderr?.toString());const n=r.stdout.length/4;assert.equal(n,8*48000);
 function rms(start,end){let total=0,count=0;for(let i=Math.round(start*48000);i<Math.round(end*48000);i++){const v=r.stdout.readFloatLE(i*4);total+=v*v;count++;}return Math.sqrt(total/count);}
 assert.ok(rms(0,.95)<1e-6);assert.ok(rms(1.05,1.95)>.02);assert.ok(rms(2.1,4.4)<1e-6);assert.ok(rms(4.55,5.45)>.02);assert.ok(rms(5.6,7.9)<1e-6);
 console.log('PASS 24k/44.1k audio normalize to48k; exact8s; audible synthetic cue windows stay at1–2s and4.5–5.5s, silence stays outside.');
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
