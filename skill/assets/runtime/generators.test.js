'use strict';
const assert=require('assert'),C=require('./engine'),G=require('./generators');
const outcomes={},worlds=new Set(),characters=new Set(),effects=new Set(),genres=new Set(),missions=new Set();
for(let seed=1;seed<=500;seed++){
 const options={genre:G.genres[seed%G.genres.length],stages:3+seed%6,mission:G.missions[seed%G.missions.length]},a=G.generateAdventure(seed,options),c=G.generateCharacter(seed,options);
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
assert.equal(genres.size,8);assert.equal(missions.size,6);assert.throws(()=>G.generateAdventure(1,{mission:'unknown'}));assert.equal(worlds.size,500);assert.equal(characters.size,500);assert(effects.size>=10);assert(outcomes.victory&&outcomes.mixed&&outcomes.defeat);
console.log('GENERATORS PASS: 500 reproducible distinct worlds and characters; graph reachability, legal zero-energy/nonpowered routes, supported power budgets, 1,500 complete auto runs, generated save portability/continuation, invalid input rejection. Outcomes:',outcomes,'Effect families:',effects.size);
