/* Finite seeded hex sandbox; content is materialized on first arrival, not by an online GM. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine'),require('./generators'));else root.CRPG_SANDBOX=factory(root.CRPG,root.CRPG_GENERATORS);})(typeof globalThis!=='undefined'?globalThis:this,function(C,G){
'use strict';
const directions=[['north',0,-1],['northeast',1,-1],['southeast',1,0],['south',0,1],['southwest',-1,1],['northwest',-1,0]],variants={
frontier:{places:['a wooded valley','a river ford','an abandoned watchpost','a hillside settlement'],activity:'Help the settlers restore their supply route',stat:'CHA',caps:['persuasion','creation'],item:'a local guide’s notes',pressure:'fatigue'},
ruin_scavenging:{places:['a collapsed storage hall','a buried workshop','an overgrown observatory','a flooded archive'],activity:'Recover and repair useful salvage',stat:'INT',caps:['repair','hacking'],item:'a working salvage component',pressure:'wounds'},
island_hopping:{places:['a tidal inlet','a rocky island','a fishing refuge','a stranded vessel'],activity:'Secure fresh supplies and chart a landing',stat:'DEX',caps:['swimming','flight'],item:'a chart of safe anchorages',pressure:'fatigue'},
haunted_wilds:{places:['an abandoned shrine','a mist-covered clearing','a silent village','a ruined burial mound'],activity:'Understand and calm the local disturbance',stat:'WIS',caps:['spirit_speech','analysis'],item:'a record of the local haunting',pressure:'doubt'}};
const key=(q,r)=>'hex_'+q+'_'+r;
function random(seed){let x=seed>>>0||1;return n=>{x^=x<<13;x^=x>>>17;x^=x<<5;x>>>=0;return Math.floor(x/4294967296*n)}}
function generateSandbox(seed,options={}){
 if(!Number.isInteger(seed)||seed<1||seed>4294967295)throw Error('Seed must be an integer 1–4294967295');
 const variant=options.sandboxVariant||'frontier',radius=options.radius===undefined?3:options.radius;if(!variants[variant])throw Error('Unknown sandbox variation');if(!Number.isInteger(radius)||radius<2||radius>6)throw Error('Sandbox radius must be 2–6');
 const a={id:'sandbox_v1_'+seed+'_'+variant+'_'+radius,version:1,title:'An open '+variant.replaceAll('_',' ')+' expedition',description:'Explore at your own pace, help people, investigate discoveries or gather supplies. There is no mandatory quest or deadline. Return to camp to end your expedition when you choose. The map is bounded; unexplored locations are generated as you reach them.',start:key(0,0),generation:{kind:'sandbox',version:1,seed,variant,radius},defaultCharacter:G.generateCharacter(seed,{genre:options.genre||'fantasy',characterMode:options.characterMode}),scenes:{}};
 for(let q=-radius;q<=radius;q++)for(let r=-radius;r<=radius;r++)if(Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))<=radius)a.scenes[key(q,r)]={text:'Unexplored territory.',actions:[],hex:{q,r},unexplored:true};
 a.scenes.returned={text:'You end the expedition on your own terms. Your chronicle records the places, people and discoveries that made this journey yours.',title:'Home with a story',ending:'escape'};
 const errors=C.validateAdventure(a);if(errors.length)throw Error(errors.join('; '));return a;
}
function materialize(a,id){const tile=a.scenes[id];if(!tile?.unexplored)return;const {q,r}=tile.hex,v=variants[a.generation.variant];if(!v)throw Error('Unsupported sandbox variation');const roll=random((a.generation.seed^Math.imul(q+8192,73856093)^Math.imul(r+8192,19349663))>>>0),camp=q===0&&r===0;
 const title=camp?'Your expedition camp':v.places[roll(v.places.length)],dc=10+roll(5),hostile=!camp&&roll(5)===0;
 const s={title,text:`${title[0].toUpperCase()+title.slice(1)}. Hex (${q}, ${r}). ${camp?'Choose a direction and decide what kind of expedition you want to have.':'You can engage with this discovery or move on. No objective requires you to stay.'}`,hex:{q,r},rest:camp||roll(4)===0,actions:[]};
 for(const [direction,dq,dr] of directions)if(a.scenes[key(q+dq,r+dr)])s.actions.push({id:'travel_'+direction,label:'Travel '+direction+' → ('+(q+dq)+', '+(r+dr)+')',success:{next:key(q+dq,r+dr),text:'You travel '+direction+'.',effects:[{type:'flag',key:'has_roamed',value:true}]}});
 if(camp)s.actions.push({id:'finish',label:'End the expedition and export your chronicle',requires:{flag:'has_roamed'},success:{next:'returned',text:'You return to camp and choose to end this expedition.'}});
 else{
 const marker='resolved:'+id,clue='surveyed:'+id;
 const failure=v.pressure==='wounds'?[{type:'damage',target:'self',amount:3}]:v.pressure==='fatigue'?[{type:'resource',amount:-3}]:[{type:'condition',condition:'distracted'}];
 s.actions.push({id:'activity',label:v.activity,requires:{flag:marker,value:false},check:{stat:v.stat,dc,tags:['exploration'],capabilityBonus:Object.fromEntries(v.caps.map(c=>[c,3]))},success:{text:'You resolve the local problem and gain '+v.item+'.',effects:[{type:'flag',key:marker,value:true},{type:'item',item:v.item+' ('+q+','+r+')'},{type:'heal',amount:2}]},failure:{text:'The opportunity passes. '+(v.pressure==='wounds'?'The dangerous work injures you.':v.pressure==='fatigue'?'The effort drains your energy.':'The unresolved disturbance leaves you distracted.'),effects:[{type:'flag',key:marker,value:true},...failure]}});
 s.actions.push({id:'survey',label:'Survey the site and record what you find',requires:{flag:clue,value:false},check:{stat:'WIS',dc:10+roll(4),tags:['investigation'],capabilityBonus:{analysis:3,tracking:3,remote_sight:3}},success:{text:'Your notes preserve a useful route and local observations.',effects:[{type:'flag',key:clue,value:true},{type:'item',item:'field notes ('+q+','+r+')'}]},failure:{text:'You record what you can, but the terrain remains uncertain.',effects:[{type:'flag',key:clue,value:true},{type:'resource',amount:-1}]}});
 if(hostile){s.enemy={name:'a hostile patrol',hp:7+roll(5),damage:2,attack:2,defense:12};s.text+=' A hostile patrol watches the approaches. It may retaliate after an action, even when you leave.';s.actions.push({id:'fight',label:'Drive off the hostile patrol',requires:{enemyAlive:true},check:{stat:'STR',dc:12,tags:['attack']},success:{text:'Your strike drives the patrol back.',effects:[{type:'damage',amount:4}]},failure:{text:'The patrol holds its ground.'}});}
 }
 a.scenes[id]=s;
}
class SandboxEngine extends C.Engine{
 _enter(id){materialize(this.adventure,id);super._enter(id);if(this.adventure.scenes[id]?.hex&&!this.state.flags['discovered:'+id]){this.state.flags['discovered:'+id]=true;this._log('discovery',{text:'Discovered '+this.adventure.scenes[id].title+' at ('+this.adventure.scenes[id].hex.q+', '+this.adventure.scenes[id].hex.r+').'});}}
 getState(){const s=super.getState();s.map=Object.entries(this.adventure.scenes).filter(([id,t])=>t.hex&&this.state.flags['discovered:'+id]).map(([id,t])=>({id,...t.hex,title:t.title,current:id===this.state.scene}));return s;}
}
function createEngine(a,c,seed){return a.generation?.kind==='sandbox'?new SandboxEngine(a,c,seed):new C.Engine(a,c,seed)}
return {variants:Object.keys(variants),directions,generateSandbox,SandboxEngine,createEngine};});
