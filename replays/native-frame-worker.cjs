// Internal short-lived native raster worker. Job is generated only after source reconstruction.
globalThis.crypto ||= require('node:crypto').webcrypto;
const fs=require('fs'),{createCanvas,loadImage}=require('@napi-rs/canvas'),R=require('./replay-engine.cjs'),C=require('./canvas-renderer.js');
(async()=>{const j=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),renderer=await C.createRenderer(R,s=>loadImage(Buffer.from(s))),canvas=createCanvas(j.width,j.height);await renderer.board(canvas.getContext('2d'),j.frame,j.replay,{width:j.width,height:j.height});fs.writeFileSync(j.output,canvas.toBuffer('image/png'),{flag:'wx'});})().catch(e=>{console.error(e.stack);process.exitCode=1;});
