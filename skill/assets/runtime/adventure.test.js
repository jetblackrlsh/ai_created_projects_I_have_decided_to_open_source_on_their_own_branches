'use strict';
const assert=require('node:assert/strict');
const C=require('./engine.js');const A=require('./adventure.json');
assert.deepEqual(C.validateAdventure(A),[]);
const graph=new Set([A.start]);let changed=true;
while(changed){changed=false;for(const id of [...graph])for(const a of A.scenes[id].actions||[])for(const k of ['success','failure']){const n=a[k]?.next;if(n&&!graph.has(n)){graph.add(n);changed=true;}}}
assert.equal(graph.size,Object.keys(A.scenes).length,'Every authored scene must be graph reachable');
for(const [id,s] of Object.entries(A.scenes))if(!s.ending)assert(s.actions.some(a=>!a.requires?.tag),'Nonterminal scenes need a non-power path: '+id);
const reached=new Set(),chosen=new Set(),endings=new Set();let wins=0,losses=0,mixed=0;
for(let seed=1;seed<=2500;seed++){
 let e=new C.Engine(A,null,Math.imul(seed,2654435761)>>>0),r=(seed*1664525+1013904223)>>>0;
 const rnd=()=>{r=(Math.imul(r,1664525)+1013904223)>>>0;return r/4294967296;};
 for(let step=0;step<60&&e.getState().status==='playing';step++){
  const st=e.getState();reached.add(st.scene);
  const options=e.listActions().filter(a=>a.preview.allowed);assert(options.length,'No action available in '+st.scene);
  const a=options[Math.floor(rnd()*options.length)];chosen.add(st.scene+':'+a.id);
  let p=null;
  if(rnd()<.3){const ps=st.character.powers.filter(p=>e.preview(a.id,p.id).allowed && (!p.effects.some(x=>['damage','drain','inflict_condition'].includes(x.type)) || st.enemyHp>0));if(ps.length)p=ps[Math.floor(rnd()*ps.length)].id;}
  e.act(a.id,p);
 }
 const st=e.getState();assert.notEqual(st.status,'playing','Run must terminate');reached.add(st.scene);endings.add(st.scene);
 if(st.status==='victory')wins++;if(st.status==='defeat')losses++;if(st.status==='mixed')mixed++;
 const save=e.exportSave();const copy=new C.Engine(A);copy.importSave(save);assert.equal(copy.exportSave(),save,'Save must round-trip exactly');
}
const missing=Object.keys(A.scenes).filter(x=>!reached.has(x));assert.deepEqual(missing,[],'Seeded exploration should reach every scene');
const missingActions=Object.entries(A.scenes).flatMap(([id,s])=>(s.actions||[]).map(a=>id+':'+a.id)).filter(x=>!chosen.has(x));assert.deepEqual(missingActions,[],'Seeded exploration should exercise every option');
assert(wins>0&&losses>0&&mixed>0,'Demo must include successful, mixed, and failed runs');
// A fully mundane character can finish the entire adventure without a power or powered-only route.
let mundaneWin=0;
const char={...A.defaultCharacter,powers:[]};
for(let seed=1;seed<=100;seed++){
 const e=new C.Engine(A,char,Math.imul(seed,2654435761)>>>0);for(const a of ['freight','panel','delay','archive','search','ascend','crawlspace','redirect','manual']){
  if(e.getState().status!=='playing')break;
  const opts=e.listActions();let action=opts.find(x=>x.id===a)||opts[0];e.act(action.id);
 }
 if(e.getState().status==='victory')mundaneWin++;
}
assert(mundaneWin>0,'At least one no-power seed must win');
console.log(JSON.stringify({validated:true,scenes:graph.size,exercisedActions:chosen.size,runs:2500,victory:wins,mixed,defeat:losses,nonpoweredVictories:mundaneWin},null,2));
