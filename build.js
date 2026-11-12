#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),CRPG=require('./engine.js');
const input=process.argv[2]||path.join(__dirname,'adventure.json');const output=process.argv[3]||path.join(__dirname,'Adventure.html');
const adventure=JSON.parse(fs.readFileSync(input,'utf8'));const errs=CRPG.validateAdventure(adventure);if(errs.length)throw new Error(errs.join('\n'));
const safe=s=>s.replace(/<\/script/gi,'<\\/script').replace(/<!--/g,'<\\!--');
let template=fs.readFileSync(path.join(__dirname,'ui.html'),'utf8');template=template.replace('/*__ENGINE__*/',()=>safe(fs.readFileSync(path.join(__dirname,'engine.js'),'utf8'))).replace('/*__BUILDER__*/',()=>safe(fs.readFileSync(path.join(__dirname,'character-builder.js'),'utf8'))).replace('/*__GENERATORS__*/',()=>safe(fs.readFileSync(path.join(__dirname,'generators.js'),'utf8'))).replace('/*__SANDBOX__*/',()=>safe(fs.readFileSync(path.join(__dirname,'sandbox.js'),'utf8'))).replace('/*__ADVENTURE__*/',()=>JSON.stringify(adventure).replace(/</g,'\\u003c')).replace('/*__APP__*/',()=>safe(fs.readFileSync(path.join(__dirname,'app.js'),'utf8')));
fs.writeFileSync(output,template);console.log('Built '+output+' ('+Buffer.byteLength(template)+' bytes)');
