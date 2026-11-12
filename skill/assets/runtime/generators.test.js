'use strict';
const assert=require('assert'),C=require('./engine'),G=require('./generators');
const outcomes={},worlds=new Set(),characters=new Set(),effects=new Set(),genres=new Set(),missions=new Set();
for(let seed=1;seed<=500;seed++){
 const options={characterMode:'curated',genre:G.genres[seed%G.genres.length],stages:3+seed%6,mission:G.missions[seed%G.missions.length]},a=G.generateAdventure(seed,options),c=G.generateCharacter(seed,options);
 genres.add(a.generation.genre);missions.add(a.generation.mission);assert.deepEqual(a,G.generateAdventure(seed,options));assert.deepEqual(c,G.generateCharacter(seed,options));assert.deepEqual(C.validateCharacter(c),[]);assert.deepEqual(C.validateAdventure(a),[]);
 assert.equal(Object.values(c.stats).reduce((a,b)=>a+b,0),78);c.powers.forEach(p=>{assert.deepEqual(C.validatePower(p),[]);p.effects.forEach(e=>effects.add(e.type))});worlds.add(JSON.stringify(a));characters.add(JSON.stringify(c));
 // All graph nodes reachable; every non-ending action goes forward on both outcomes.
 const reachable=new Set(),visit=id=>{if(reachable.has(id))return;reachable.add(id);const s=a.scenes[id];for(const x of s.actions||[])for(const k of ['success','failure'])if(x[k]?.next)visit(x[k].next)};visit(a.start);assert.equal(reachable.size,Object.keys(a.scenes).length);
 for(const [id,s] of Object.entries(a.scenes)){if(s.ending)continue;const probe=new C.Engine(a,{...c,powers:[]},seed);probe.state.scene=id;probe.state.energy=0;assert(probe.listActions().some(x=>x.preview.allowed),'Nonpowered legal route: '+id);for(const x of s.actions){assert(x.success?.next);if(x.check)assert(x.failure?.next);}}
 // Different valid characters and no-power characters use the same generated adventure.
 for(const hero of [null,c,{...c,powers:[]}]){const e=new C.Engine(a,hero,seed);let steps=0;while(e.getState().status==='playing'&&steps<200){const legal=e.listAutoOptions(),r=e.autoStep();assert(r.choice,'No deadlocks');assert(legal.some(o=>JSON.stringify(o)===JSON.stringify(r.choice)));steps++;}const s=e.getState();assert.notEqual(s.status,'playing');assert(s.hp>=0&&s.energy>=0);outcomes[s.status]=(outcomes[s.status]||0)+1;
 const raw=e.exportSave(),obj=JSON.parse(raw);assert.deepEqual(obj.adventure,a);const restored=new C.Engine(obj.adventure);restored.importSave(raw);assert.equal(restored.exportSave(),raw);
 }
 const original=new C.Engine(a,c,seed);original.autoStep();const raw=original.exportSave();const restored=new C.Engine(JSON.parse(raw).adventure);restored.importSave(raw);assert.deepEqual(original.runAuto(),restored.runAuto());assert.equal(original.exportSave(),restored.exportSave());
}
for(const genre of G.genres)for(const mission of G.missions){const a=G.generateAdventure(987,{genre,mission});assert.deepEqual(C.validateAdventure(a),[]);assert.notEqual(new C.Engine(a).runAuto().status,'playing');}
for(const seed of [0,-1,1.2,NaN,4294967296,'1'])assert.throws(()=>G.generateCharacter(seed));assert.throws(()=>G.generateAdventure(1,{genre:'unknown'}));for(const stages of [0,9,1.5])assert.throws(()=>G.generateAdventure(1,{stages}));
assert.equal(genres.size,8);assert.equal(missions.size,10);assert.throws(()=>G.generateAdventure(1,{mission:'unknown'}));assert.equal(worlds.size,500);assert.equal(characters.size,500);assert.equal(effects.size,15);assert(outcomes.victory&&outcomes.mixed&&outcomes.defeat);
console.log('GENERATORS PASS: 500 reproducible distinct worlds and characters; graph reachability, legal zero-energy/nonpowered routes, supported power budgets, 1,500 complete auto runs, generated save portability/continuation, invalid input rejection. Outcomes:',outcomes,'Effect families:',effects.size);

// Every variant has an executable objective encounter, distinct preparation mechanics,
// a gated finale advantage, nonpowered options, and complete auto runs in all genres.
const variantShapes=new Set();let variantRuns=0;
for(const genre of G.genres)for(const mission of G.missions)for(const variant of G.variants[mission]){
 const a=G.generateAdventure(987,{genre,mission,variant});assert.equal(a.generation.variant,variant);assert.deepEqual(a,G.generateAdventure(987,{genre,mission,variant}));
 const preparation=a.scenes.side0.actions[0],mechanics={check:preparation.check,success:preparation.success.effects,failure:preparation.failure.effects,deadline:a.turnLimit};variantShapes.add(JSON.stringify(mechanics));
 let e=new C.Engine(a);e.state.scene='side0';assert(e.preview('prepare').allowed);assert(e.preview('skip').allowed);e.state.scene='final';assert(!e.preview('prepared').allowed);e.state.flags.objective_ready=true;assert(e.preview('prepared').allowed);
 for(let seed=1;seed<=4;seed++){const g=new C.Engine(a,null,seed);assert.notEqual(g.runAuto().status,'playing');variantRuns++;}
}
assert(variantShapes.size>=20);assert.throws(()=>G.generateAdventure(2,{mission:'rescue',variant:'flood'}));
const powerShapes=new Set(),caps=new Set(),costs=new Set(),durations=new Set(),cooldowns=new Set();
for(let seed=1;seed<=1000;seed++)for(const p of G.generateCharacter(seed,{characterMode:'curated'}).powers){powerShapes.add(JSON.stringify({effects:p.effects,cost:p.cost,cooldown:p.cooldown,stat:p.stat}));costs.add(p.cost);cooldowns.add(p.cooldown);for(const e of p.effects){durations.add(e.duration||1);for(const c of e.tags||[])caps.add(c)}}
assert(powerShapes.size>500);assert(caps.size===C.CAPABILITIES.length);assert(costs.size>1);assert(durations.size>1);
console.log('VARIETY PASS:',variantRuns,'all-genre/type/variant auto runs;',variantShapes.size,'distinct objective mechanical patterns;',powerShapes.size,'distinct power mechanics;',caps.size,'capabilities; costs', [...costs].sort(), 'durations',[...durations].sort(),'cooldowns',[...cooldowns].sort());

const breadth={counts:new Set(),stats:new Set(),totals:new Set(),effects:new Set(),amounts:new Set(),durations:new Set(),costs:new Set(),cooldowns:new Set(),effectCounts:new Set()};
for(let seed=1;seed<=2000;seed++){
 const c=G.generateCharacter(seed,{characterMode:'broad'});assert.deepEqual(c,G.generateCharacter(seed,{characterMode:'broad'}));assert.deepEqual(C.validateCharacter(c),[]);breadth.counts.add(c.powers.length);Object.values(c.stats).forEach(n=>breadth.stats.add(n));breadth.totals.add(Object.values(c.stats).reduce((a,b)=>a+b,0));
 for(const p of c.powers){breadth.costs.add(p.cost);breadth.cooldowns.add(p.cooldown);breadth.effectCounts.add(p.effects.length);for(const e of p.effects){breadth.effects.add(e.type);breadth.amounts.add(e.amount);breadth.durations.add(e.duration)}}
 const a=G.generateAdventure(seed,{mission:'recovery',stages:3});const e=new C.Engine(a,c,seed);assert.notEqual(e.runAuto().status,'playing');
}
assert.equal(breadth.counts.size,9);assert.equal(breadth.stats.size,13);assert.equal(breadth.effects.size,15);assert.equal(breadth.amounts.size,12);assert.equal(breadth.durations.size,10);assert.equal(breadth.costs.size,12);assert.equal(breadth.cooldowns.size,11);assert.equal(breadth.effectCounts.size,5);
console.log('BROAD PASS: 2000 deterministic valid characters and complete auto missions; coverage',Object.fromEntries(Object.entries(breadth).map(([k,v])=>[k,[...v].sort((a,b)=>a-b)])));
