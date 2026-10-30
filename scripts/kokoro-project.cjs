#!/usr/bin/env node
/* Offline project importer. No download/install/network operation. */
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');
const S=require('../app/core.js'),V=require('../app/voice-tools.js');
function importClips(project,manifest,base){
  S.validate(project); const p=S.clone(project);
  if(!Array.isArray(manifest.clips)||!manifest.clips.length)throw Error('Manifest needs nonempty clips array');
  for(const clip of manifest.clips){
    const wav=path.resolve(base,clip.wav),bytes=fs.readFileSync(wav);
    if(bytes.length>40e6)throw Error('WAV limit 40 MB');
    const sidecar=clip.metadata?path.resolve(base,clip.metadata):wav+'.json';
    const metadata=fs.existsSync(sidecar)?JSON.parse(fs.readFileSync(sidecar,'utf8')):null;
    const text=clip.text??metadata?.text,c=V.config({provider:'kokoro',voice:clip.voice??metadata?.voice??'af_heart',speed:clip.speed??metadata?.speed??1,lang:clip.lang??metadata?.lang??'en-us'});
    const g=V.importWav(bytes,text,c,metadata),start=Number(clip.start),id=clip.speakerId||'narrator';
    if(!Number.isFinite(start)||start<0||start+g.info.duration>S.duration(p)+1e-6)throw Error('Clip exceeds project duration');
    const row=S.locate(p,start);if(start+g.info.duration>row.start+row.scene.duration+1e-6)throw Error('Clip crosses scene boundary; adjust timing explicitly');
    V.lockCast(p,id,c);
    p.audio=p.audio||[];
    p.audio.push({name:id+': '+text.slice(0,50),kind:'narration',speakerId:id,speechRole:id==='narrator'?'narration':'dialogue',voiceConfig:c,text,data:'data:audio/wav;base64,'+bytes.toString('base64'),start,offset:0,duration:g.info.duration,sourceDuration:g.info.duration,gain:.85,provenance:g.provenance});
  }
  S.validate(p);return p;
}
function main(args){
  const [mode,projectFile,manifestFile,out]=args;
  if(!['import','synthesize'].includes(mode)||!out)throw Error('Usage: node scripts/kokoro-project.cjs import|synthesize project.json manifest.json NEW-output.jet2d.json');
  if(fs.existsSync(out))throw Error('Output exists; choose a new filename');
  let manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));const project=JSON.parse(fs.readFileSync(projectFile,'utf8')),base=path.dirname(path.resolve(manifestFile));let tmp;
  try{
    if(mode==='synthesize'){
      if(!Array.isArray(manifest.clips)||!manifest.clips.length)throw Error('Manifest needs clips');
      tmp=fs.mkdtempSync(path.join(os.tmpdir(),'jet-kokoro-'));
      manifest={...manifest,clips:manifest.clips.map((clip,i)=>{
        const request=path.join(tmp,i+'.json'),wav=path.join(tmp,i+'.wav');
        fs.writeFileSync(request,JSON.stringify({format:'jet-kokoro-request',version:1,provider:'kokoro',voice:'af_heart',speed:1,lang:'en-us',...clip}));
        const r=spawnSync(process.env.PYTHON||'python3',[path.resolve(__dirname,'../tools/kokoro-tts.py'),'synthesize','--request',request,'--output',wav],{encoding:'utf8'});
        if(r.status!==0)throw Error(r.stderr||r.stdout||'Kokoro command failed; see docs/kokoro.md');
        return {...clip,wav,metadata:wav+'.json'};
      })};
    }
    const p=importClips(project,manifest,base);fs.writeFileSync(out,JSON.stringify(p,null,2),{flag:'wx'});console.log('Saved '+out+'; actual WAV bytes embedded. Existing audio preserved.');
  }finally{if(tmp)fs.rmSync(tmp,{recursive:true,force:true});}
}
module.exports={importClips};
if(require.main===module)try{main(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}
