'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),os=require('os');
const S=require('../app/core.js'),V=require('../app/voice-tools.js'),{importClips}=require('./kokoro-project.cjs');
function fixture(){const b=Buffer.alloc(48044);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(24000,24);b.writeUInt32LE(48000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(48000,40);for(let i=44;i<b.length;i+=2)b.writeInt16LE(Math.round(Math.sin((i-44)/2*440*2*Math.PI/24000)*3000),i);return b;}
(async()=>{
 const b=fixture(),c={provider:'kokoro',voice:'af_heart',speed:1,lang:'en-us'},meta={provider:'kokoro',...c,text:'Fixture line.',durationSeconds:1};
 assert.equal(S.blank().voicePreferences.provider,'kokoro');
 const legacy=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../demo/Signal-Garden.jet2d.json'),'utf8'));
 const before=JSON.stringify(legacy);S.validate(legacy);assert.equal(JSON.stringify(legacy),before);
 assert.equal(V.importWav(b,meta.text,c,meta).info.duration,1);
 assert.throws(()=>V.importWav(b,'Changed',c,meta),/does not match/);
 assert.throws(()=>V.importWav(Buffer.alloc(4),meta.text,c),/Invalid/);
 assert.throws(()=>V.config({...c,speed:0}),/speed/);
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'jet-kokoro-test-'));
 try{fs.writeFileSync(path.join(tmp,'a.wav'),b);fs.writeFileSync(path.join(tmp,'a.wav.json'),JSON.stringify(meta));
  const p=importClips(S.blank(),{clips:[{wav:'a.wav',text:meta.text,start:0,speakerId:'hero'}]},tmp);
  assert.equal(p.audio.length,1);assert.ok(p.audio[0].data.startsWith('data:audio/wav;base64,'));assert.equal(p.voiceCast.hero.provider,'kokoro');
  assert.throws(()=>importClips(p,{clips:[{wav:'a.wav',text:meta.text,start:5.5}]},tmp),/exceeds/);
  const roundtrip=JSON.parse(JSON.stringify(p));S.validate(roundtrip);assert.equal(roundtrip.audio[0].data,p.audio[0].data);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
 console.log('PASS: defaults, legacy nonmutation, WAV import, mismatch/invalid rejection, cast, timing, portable roundtrip. Synthetic test tone only; not Kokoro synthesis.');
})().catch(e=>{console.error(e);process.exit(1)});
module.exports={fixture};
