'use strict';
const assert=require('assert'),C=require('./engine'),B=require('./character-builder'),G=require('./generators');
const normalize=c=>({stats:c.stats,powers:c.powers.map(p=>({cost:p.cost,cooldown:p.cooldown||0,stat:p.stat||null,effects:p.effects.map(e=>({type:e.type,amount:e.amount??1,duration:e.duration??1,stat:e.stat||null,tags:e.tags||[],condition:['inflict_condition','remove_condition'].includes(e.type)?e.condition:null}))}))});
let counts=new Set(),effects=new Set(),maxChoices=0;
for(let seed=1;seed<=1200;seed++){
 const result=B.autopilot(seed);assert.deepEqual(result,B.autopilot(seed));assert.deepEqual(C.validateCharacter(result.character),[]);assert.deepEqual(result.character,B.replay(result.choices));counts.add(result.character.powers.length);result.character.powers.forEach(p=>p.effects.forEach(e=>effects.add(e.type)));maxChoices=Math.max(maxChoices,result.choices.length);
 const witness=B.traceCharacter(result.character);assert.deepEqual(normalize(result.character),normalize(B.replay(witness.choices,witness.options)));
 // Manual-style samples from the other generator are reachable without modifying
 // any stat/power parameter, including zeros, high budgets and effect combinations.
 const manual=G.generateCharacter(seed,{characterMode:'broad'});const traced=B.traceCharacter(manual);assert.deepEqual(normalize(manual),normalize(traced.character));
}
for(const c of [{name:'Minimal',stats:{STR:6,DEX:6,CON:6,INT:6,WIS:6,CHA:6},powers:[]},{name:'Boundary',stats:{STR:18,DEX:18,CON:18,INT:12,WIS:6,CHA:6},powers:[{id:'custom',name:'Custom',cost:12,cooldown:10,effects:[{type:'check_bonus',amount:4,duration:10,tags:['a custom mechanical tag','']},{type:'transform',stat:'DEX',amount:4,duration:10,tags:['flight','flight','swimming','teleportation']}]}]}]){assert.deepEqual(C.validateCharacter(c),[]);const t=B.traceCharacter(c);assert.deepEqual(normalize(c),normalize(B.replay(t.choices,t.options)));}
const b=new B.Builder();assert.throws(()=>b.choose(19));assert.equal(b.trace.length,0);assert.throws(()=>B.replay([{phase:'cost',value:2}]));assert.throws(()=>B.traceCharacter({name:'invalid'}));assert.deepEqual(B.autopilot('a reproducible text seed'),B.autopilot('a reproducible text seed'));assert.equal(counts.size,9);assert.equal(effects.size,15);
console.log('BUILDER PASS: 1200 deterministic legal-choice traces and replays; 1200 broad manual-style witness paths; all power counts/effect families, custom mechanical tags, budget boundaries, invalid choices. Maximum observed choices:',maxChoices);
