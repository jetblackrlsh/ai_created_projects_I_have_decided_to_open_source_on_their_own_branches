'use strict';
// DOM contract test, NOT a browser layout or rendering test.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),CRPG=require('./engine');
const html=fs.readFileSync(__dirname+'/ui.html','utf8'),source=fs.readFileSync(__dirname+'/app.js','utf8'),adventure=require('./adventure.json');
class Node {
 constructor(tag='div'){this.tagName=tag;this.children=[];this.style={};this.dataset={};this.value='';this.textContent='';this.disabled=false;this.files=[];this.classList={add(){},remove(){},toggle(){}};}
 append(...xs){for(let x of xs){if(typeof x==='string')continue;x.parentElement=this;this.children.push(x);if(this.tagName==='select'&&this.children.length===1)this.value=x.value;}}
 prepend(...xs){for(const x of xs)x.parentElement=this;this.children.unshift(...xs)}
 replaceChildren(...xs){this.children=[];this.append(...xs)}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this)}
 get options(){return this.children}get selectedOptions(){return this.children.filter(x=>x.selected)}
 querySelectorAll(selector){let xs=this.children.flatMap(x=>[x,...x.querySelectorAll(selector)]);return selector==='[data-field]'?xs.filter(x=>x.dataset.field):xs}
 showModal(){this.open=true}close(){this.open=false}click(){return this.onclick?.()}
}
let ids=new Map([...html.matchAll(/id="([^"]+)"/g)].map(x=>[x[1],new Node(x[1]==='assistPower'||x[1]==='powerStat'?'select':'div')]));
for(const m of source.matchAll(/\$\('([^']+)'\)/g))assert(ids.has(m[1]),'Missing static DOM ID '+m[1]);
let document={getElementById(id){return ids.get(id)||null},createElement(tag){let n=new Node(tag);Object.defineProperty(n,'id',{set(v){ids.set(v,n)}});return n},body:new Node('body')};
ids.get('seedInput').value='20261112';ids.get('customName').value='Test hero';ids.get('customDescription').value='';ids.get('powerName').value='Insight';ids.get('powerCost').value='2';ids.get('powerCooldown').value='0';ids.get('powerDescription').value='';
let timers=new Map(),timerId=0;
let storage=new Map(),ctx={CRPG,CRPG_PARTY:require('./party'),CRPG_BUILDER:require('./character-builder'),CRPG_GENERATORS:require('./generators'),CRPG_SANDBOX:require('./sandbox'),ADVENTURE:adventure,document,window:{},console,Option:function(text,value){let n=new Node('option');n.textContent=text;n.value=value;return n},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},confirm:()=>true,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},Blob:global.Blob,setTimeout:f=>{timers.set(++timerId,f);return timerId},clearTimeout:id=>timers.delete(id)};
vm.createContext(ctx);vm.runInContext(source,ctx,{filename:'app.js'});
const ui=ctx.window.CRPG_GAME;
assert.equal(document.title,adventure.title+' · CRPG Forge');assert.equal(ids.get('scoreInputs').children.length,6);
ids.get('defaultBtn').click();assert.equal(ui.getState().character.name,adventure.defaultCharacter.name);assert(ids.get('actions').children.length>0);assert(storage.size===1);
const action=ui.listActions().find(x=>x.preview.allowed);assert(action);vm.runInContext(`openChoice(${JSON.stringify(action.id)})`,ctx);assert(ids.get('choiceDialog').open);assert(ids.get('choicePreview').children.length>0);ids.get('confirmChoice').click();assert(!ids.get('choiceDialog').open);assert(ui.getState().turn>=1);assert(ids.get('journal').children.length>0);
// Exercise scheduled CPU turns and cancellation without claiming browser rendering.
ui.startAuto();assert.equal(ids.get('autoBtn').textContent,'Pause auto');assert(ids.get('autoStepBtn').disabled);let timer=[...timers.keys()][0],run=timers.get(timer);timers.delete(timer);let turnBefore=ui.getState().turn;run();assert.equal(ui.getState().turn,turnBefore+1);ui.stopAuto();assert.equal(timers.size,0);const paused=ui.exportSave();assert.equal(ui.exportSave(),paused);ids.get('autoStepBtn').click();assert.equal(ui.getState().turn,turnBefore+2);
const saved=ui.exportSave();ui.importSave(saved);assert.equal(ui.exportSave(),saved);
(async()=>{
 ids.get('loadBtn').click();await ids.get('fileInput').onchange({target:{files:[{size:saved.length,text:async()=>saved}],value:''}});assert.equal(ui.exportSave(),saved);
 const before=ui.exportSave();await ids.get('fileInput').onchange({target:{files:[{size:1,text:async()=>'{broken'}],value:''}});assert.equal(ui.exportSave(),before);assert(ids.get('gameError').textContent);
 ids.get('newBtn').click();ids.get('customBtn').click();assert.equal(ui.getState().character.name,'Test hero');assert.equal(ui.getState().character.powers.length,0);
 ids.get('newBtn').click();ids.get('addPowerBtn').click();assert(ids.get('powerDialog').open);assert.equal(ids.get('effectRows').children.length,1);ids.get('confirmPower').click();assert(!ids.get('powerDialog').open);ids.get('customBtn').click();assert.equal(ui.getState().character.powers.length,1);
 ids.get('newBtn').click();ids.get('generationSeed').value='123';ids.get('generationGenre').value='fantasy';ids.get('characterMode').value='curated';ids.get('randomCharacterBtn').click();assert(ids.get('customPowers').children.length>0);ids.get('randomAdventureBtn').click();ids.get('customBtn').click();assert(ui.getState().adventureId.startsWith('generated_'));ui.autoStep();const generatedSave=ui.exportSave();assert(JSON.parse(generatedSave).adventure);ui.importSave(generatedSave);assert.equal(ui.exportSave(),generatedSave);
 ids.get('newBtn').click();ids.get('sandboxVariant').value='frontier';ids.get('randomSandboxBtn').click();ids.get('defaultBtn').click();assert.equal(ui.getState().map.length,1);ui.act('travel_north');assert.equal(ui.getState().map.length,2);const sandboxSave=ui.exportSave();ui.importSave(sandboxSave);assert.equal(ui.exportSave(),sandboxSave);assert(ids.get('hexMap').textContent.includes('(0, -1)'));
 ids.get('newBtn').click();ids.get('characterMode').value='builder';ids.get('randomCharacterBtn').click();assert(ids.get('builderChoiceSeed').value.startsWith('cfb1:'));const choiceSeed=ids.get('builderChoiceSeed').value;ids.get('replayBuilderSeedBtn').click();ids.get('customBtn').click();assert.deepEqual(ui.getState().character.stats,require('./character-builder').replaySeed(choiceSeed).character.stats);
 ids.get('newBtn').click();ids.get('partyController').value='Player One';ids.get('addDefaultPartyBtn').click();ids.get('partyController').value='Player Two';ids.get('addDefaultPartyBtn').click();ids.get('startPartyBtn').click();assert.equal(ui.getState().party.members.length,2);ids.get('passPartyBtn').click();assert.equal(ui.getState().party.activeIndex,1);const partySave=ui.exportSave();ui.importSave(partySave);assert.equal(ui.exportSave(),partySave);
 console.log('UI DOM-contract tests passed: initialization, default/custom start, power builder, action preview/commit, state rendering, valid/invalid save imports, static template IDs. Not a browser/layout test.');
})().catch(e=>{console.error(e);process.exitCode=1});
