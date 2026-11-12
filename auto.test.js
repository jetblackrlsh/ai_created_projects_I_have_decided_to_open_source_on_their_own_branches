'use strict';
const assert=require('assert'),{Engine}=require('./engine'),adventure=require('./adventure.json');
const clone=x=>JSON.parse(JSON.stringify(x));
const hero={name:'Synthetic Scout',stats:{STR:12,DEX:12,CON:12,INT:12,WIS:12,CHA:12},powers:[{id:'fly',name:'Flight',cost:2,effects:[{type:'grant_tag',tags:['flight'],duration:2}]},{id:'bolt',name:'Bolt',cost:2,effects:[{type:'damage',amount:3}]}]};
const fixture={id:'auto-fixture',version:1,title:'Auto fixture',start:'gate',defaultCharacter:hero,scenes:{gate:{text:'A gate',rest:true,actions:[{id:'walk',label:'Walk',success:{next:'end'}},{id:'fly',label:'Fly',check:{stat:'DEX',dc:10,requiresTag:'flight'},success:{next:'end'}},{id:'locked',label:'Locked',requires:{item:'key'},success:{next:'end'}},{id:'costly',label:'Costly',cost:12,success:{next:'end'}}]},end:{text:'The end.',ending:'victory'}}};
let e=new Engine(fixture,null,1),before=e.exportSave(),opts=e.listAutoOptions();assert.equal(e.exportSave(),before,'enumeration is read-only');assert(opts.some(x=>x.actionId==='fly'&&x.powerId==='fly'));assert(!opts.some(x=>x.actionId==='fly'&&!x.powerId));assert(!opts.some(x=>x.actionId==='locked'));assert(!opts.some(x=>x.powerId==='bolt'));assert(opts.some(x=>x.kind==='rest'));
e.rest();assert(!e.listAutoOptions().some(x=>x.kind==='rest'));e.state.energy=0;assert(e.listAutoOptions().every(x=>!x.powerId&&x.actionId!=='costly'));
e.state.energy=e.state.maxEnergy;e.state.cooldowns.fly=2;assert(!e.listAutoOptions().some(x=>x.powerId==='fly'));e.state.conditions=['silenced'];assert(e.listAutoOptions().every(x=>!x.powerId));
const loop=clone(fixture);loop.scenes.gate={text:'Wait forever',actions:[{id:'wait',label:'Wait',success:{text:'Waiting.'}}]};loop.defaultCharacter.powers=[];
e=new Engine(loop);let result=e.runAuto(8);assert.equal(result.steps,8);assert.equal(result.stopped,'step-limit');assert.equal(e.getState().status,'playing');assert.equal(e.getState().turn,8);assert.throws(()=>e.runAuto(0));assert.throws(()=>e.runAuto(1001));
const locked=clone(loop);locked.scenes.gate.actions[0].requires={item:'missing'};e=new Engine(locked);before=e.exportSave();assert.equal(e.autoStep().stopped,'no-valid-options');assert.equal(e.exportSave(),before);
const ended=clone(loop);ended.start='end';e=new Engine(ended);before=e.exportSave();assert.equal(e.runAuto().stopped,'ended');assert.equal(e.exportSave(),before);
const reproducible=new Engine(adventure,null,42);for(let i=0;i<3;i++)reproducible.autoStep();const save=reproducible.exportSave();const restored=new Engine(adventure);restored.importSave(save);assert.deepEqual(reproducible.runAuto(),restored.runAuto());assert.equal(reproducible.exportSave(),restored.exportSave());
const old=new Engine(fixture).exportSave();assert(!JSON.parse(old).state.autoRng);new Engine(fixture).importSave(old);let bad=JSON.parse(old);bad.state.autoRng=0;assert.throws(()=>new Engine(fixture).importSave(JSON.stringify(bad)));
const outcomes={},paths=new Set();for(let seed=1;seed<=1000;seed++){
 const character=clone(adventure.defaultCharacter);if(seed%2===0)character.powers=[];
 const game=new Engine(adventure,character,seed);let steps=0;
 while(game.getState().status==='playing'&&steps<200){
  const legal=game.listAutoOptions(),r=game.autoStep();if(r.choice){assert(legal.some(o=>JSON.stringify(o)===JSON.stringify(r.choice)));steps++;}else{assert.equal(r.stopped,'no-valid-options');break;}
 }
 const state=game.getState();assert(state.energy>=0&&state.hp>=0);assert(state.log.every(x=>x.roll==null||(x.roll>=1&&x.roll<=20)));outcomes[state.status]=(outcomes[state.status]||0)+1;paths.add(state.log.filter(x=>x.type==='auto_choice').map(x=>x.choice.actionId||x.choice.kind).join(','));
 const copy=new Engine(adventure);copy.importSave(game.exportSave());assert.equal(copy.exportLog(),game.exportLog());
}
assert(paths.size>50);assert(Object.keys(outcomes).some(x=>x!=='defeat'));assert(outcomes.defeat>0);
console.log('AUTO PASS: legal selection, capability assists, no illegal target/energy/cooldown/silenced actions, spent rests, ended/deadlock/bounded loops, old saves, exact auto RNG continuation, full log round-trip.');console.log('1000 seeded runs:',JSON.stringify(outcomes),'; distinct paths:',paths.size);
