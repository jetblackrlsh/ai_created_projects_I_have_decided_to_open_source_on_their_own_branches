/* CRPG Forge rules core. No network, DOM, or executable adventure content. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CRPG=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION=1,STATS=['STR','DEX','CON','INT','WIS','CHA'];
const EFFECT_TYPES=['check_bonus','check_penalty','stat_boost','stat_debuff','heal','shield','damage','restore_energy','resistance','grant_tag','remove_condition','inflict_condition','summon','transform','drain','cleanse'];
const CAPABILITIES=['flight','teleportation','swimming','burrowing','climbing','super_speed','invisibility','disguise','mind_reading','empathy','persuasion','intimidation','animal_speech','spirit_speech','translation','remote_sight','darkvision','tracking','danger_sense','xray_sight','hearing','scent','analysis','hacking','repair','crafting','creation','telekinesis','magnetism','element_control','plant_control','illusion','healing','shapeshift','size_change','intangibility','shielding','summoning','time_sense','luck','strength','precision','memory','survival'];
const CONDITIONS=['weakened','distracted','restrained','exposed','silenced'];
const safeKey=k=>typeof k==='string'&&/^[a-zA-Z0-9_:\-]{1,100}$/.test(k)&&!['__proto__','constructor','prototype'].includes(k);
const harmful=e=>['damage','drain','inflict_condition','stat_debuff','check_penalty'].includes(e.type);
const clone=x=>JSON.parse(JSON.stringify(x));
const num=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
const mod=n=>Math.floor((n-10)/2);
function assert(ok,msg){if(!ok)throw new Error(msg);}
function validatePower(p){
 const errors=[]; if(!p||typeof p!=='object')return ['Power must be an object'];
 if(!safeKey(p.id)||p.id.length>60)errors.push('Power ID must be 1–60 letters, numbers, underscores or hyphens');
 if(typeof p.name!=='string'||!p.name.trim()||p.name.length>120)errors.push('Power requires a short name');
 if(!Number.isInteger(p.cost)||!num(p.cost,1,12))errors.push('Power cost must be 1–12');
 if(p.cooldown!==undefined&&(!Number.isInteger(p.cooldown)||!num(p.cooldown,0,10)))errors.push('Cooldown must be 0–10 turns');
 if(!Array.isArray(p.effects)||p.effects.length<1||p.effects.length>5)errors.push('Power needs 1–5 effects');
 if(p.stat!==undefined&&!STATS.includes(p.stat))errors.push('Power stat must be one of six abilities');
 let weight=0;
 for(const e of Array.isArray(p.effects)?p.effects:[]){
  if(!e||typeof e!=='object'){errors.push('Effect must be an object');continue;}
  if(!EFFECT_TYPES.includes(e.type)){errors.push('Unsupported power effect: '+e.type);continue;}
  if(e.stat!==undefined&&!STATS.includes(e.stat))errors.push('Unknown ability: '+e.stat);
  if(e.tags!==undefined&&(!Array.isArray(e.tags)||e.tags.length>4||e.tags.some(t=>typeof t!=='string'||t.length>60)))errors.push('Tags must be short text');
  if(!Number.isInteger(e.duration===undefined?1:e.duration)||!num(e.duration===undefined?1:e.duration,1,10))errors.push('Effect duration must be 1–10 turns');
  const a=e.amount===undefined?1:e.amount;
  if(!Number.isInteger(a)||!num(a,1,12))errors.push('Effect amount must be 1–12');
  if(['stat_boost','stat_debuff','transform'].includes(e.type)&&!e.stat)errors.push(e.type+' needs a stat');
  if(['grant_tag','transform'].includes(e.type)&&(!Array.isArray(e.tags)||!e.tags.length))errors.push(e.type+' needs capability tags');
  if(['grant_tag','transform'].includes(e.type)&&(e.tags||[]).some(t=>!CAPABILITIES.includes(t)))errors.push('Unknown capability tag');
  if(e.type==='inflict_condition'&&e.condition==='silenced')errors.push('Silencing enemy powers is unsupported; use an attack penalty or authored control capability');
  if(['inflict_condition','remove_condition'].includes(e.type)&&!['weakened','distracted','restrained','exposed','silenced'].includes(e.condition))errors.push('Unknown condition');
  if(e.target!==undefined&&e.target!==(harmful(e)?'enemy':'self'))errors.push('Effect '+e.type+' targets '+(harmful(e)?'enemy':'self'));
  if(['check_bonus','check_penalty','stat_boost','stat_debuff','resistance','summon','transform'].includes(e.type)&&a>4)errors.push('Bonus/resistance capped at 4');
  if(e.type==='restore_energy')errors.push('Energy restoration is an adventure effect, not a custom power');
  weight+=['damage','heal','shield','drain'].includes(e.type)?Math.ceil(a/3):a;
  weight+=Math.max(0,(e.duration||1)-1);if(['grant_tag','transform'].includes(e.type))weight+=Math.max(0,(e.tags||[]).length-1);
 }
 if(weight>p.cost*3)errors.push('Effect budget '+weight+' exceeds cost budget '+(p.cost*3));
 return errors;
}
function validateCharacter(c){
 let errors=[];if(!c||typeof c!=='object')return ['Character must be an object'];
 if(typeof c.name!=='string'||!c.name.trim()||c.name.length>100)errors.push('Character needs a name (max 100 characters)');
 if(!c.stats)errors.push('Six stats required');else {for(const s of STATS)if(!Number.isInteger(c.stats[s])||!num(c.stats[s],6,18))errors.push(s+' must be 6–18');if(STATS.reduce((a,s)=>a+(c.stats[s]||0),0)>78)errors.push('Ability score total cannot exceed 78');}
 if(c.tags!==undefined&&(!Array.isArray(c.tags)||c.tags.length))errors.push('Innate tags are not free; represent capabilities as costed powers');
 if(!Array.isArray(c.powers)||c.powers.length>8)errors.push('Choose 0–8 powers');
 const ids=new Set();for(const p of Array.isArray(c.powers)?c.powers:[]){if(!p||typeof p!=='object'){errors.push('Power must be an object');continue;}errors.push(...validatePower(p).map(e=>p.name+': '+e));if(ids.has(p.id))errors.push('Duplicate power ID');ids.add(p.id);}
 return errors;
}
const EVENT_TYPES=[...EFFECT_TYPES,'flag','item','resource','condition','next'];
function validateAdventure(a){
 const errors=[];if(!a||typeof a!=='object')return ['Adventure must be an object'];
 if(!safeKey(a.id)||!a.title||!a.scenes||typeof a.scenes!=='object'||Array.isArray(a.scenes)||!a.scenes[a.start])return ['Adventure needs id, title, scenes and valid start'];
 if(a.turnLimit!==undefined&&(!Number.isInteger(a.turnLimit)||!num(a.turnLimit,1,10000)))errors.push('Turn limit must be 1–10000');
 errors.push(...validateCharacter(a.defaultCharacter).map(e=>'Default character: '+e));
 for(const [id,s] of Object.entries(a.scenes)){if(!s||typeof s!=='object'){errors.push('Invalid scene');continue;}
  if(!safeKey(id))errors.push('Invalid scene ID');
  if(s.ending&&!['victory','defeat','escape','mixed'].includes(s.ending))errors.push('Invalid ending');
  if(typeof s.text!=='string')errors.push(id+': missing text');
  if(!s.ending&&!Array.isArray(s.actions))errors.push(id+': actions required');
  const ids=new Set();for(const action of Array.isArray(s.actions)?s.actions:[]){if(!action||typeof action!=='object'){errors.push(id+': invalid action');continue;}
   if(!safeKey(action.id)||ids.has(action.id))errors.push(id+': missing/duplicate action id');ids.add(action.id);
   if(action.cost!==undefined&&(!Number.isInteger(action.cost)||!num(action.cost,0,100)))errors.push(id+': action cost must be 0–100');
   if(action.check){const c=action.check;if(!STATS.includes(c.stat)||!Number.isInteger(c.dc)||!num(c.dc,1,40))errors.push(id+': invalid check');if(c.modifier!==undefined&&(!Number.isInteger(c.modifier)||!num(c.modifier,-20,20)))errors.push(id+': invalid situation modifier');if(c.oppositionStat&&!STATS.includes(c.oppositionStat))errors.push(id+': invalid opposing stat');if(c.oppositionScore!==undefined&&(!Number.isInteger(c.oppositionScore)||!num(c.oppositionScore,2,30)))errors.push(id+': invalid opposing score');if(c.capabilityBonus&&Object.entries(c.capabilityBonus).some(([tag,n])=>!CAPABILITIES.includes(tag)||!Number.isInteger(n)||!num(n,0,8)))errors.push(id+': invalid capability bonus');if(c.tags!==undefined&&(!Array.isArray(c.tags)||c.tags.some(t=>typeof t!=='string')))errors.push(id+': invalid check tags');}
   for(const o of ['success','failure'])if(action[o]){if(action[o].next&&!a.scenes[action[o].next])errors.push(id+': unknown next '+action[o].next);if(action[o].effects!==undefined&&!Array.isArray(action[o].effects))errors.push(id+': effects must be an array');for(const e of Array.isArray(action[o].effects)?action[o].effects:[]){if(!e||typeof e!=='object'){errors.push(id+': invalid effect');continue;}if(!EVENT_TYPES.includes(e.type))errors.push(id+': unknown event '+e.type);if(e.amount!==undefined&&(!Number.isInteger(e.amount)||!num(e.amount,-100,100)))errors.push(id+': invalid effect amount');if(e.amount!==undefined&&e.amount<0&&!['resource'].includes(e.type))errors.push(id+': negative effect amount');if(e.type==='next'&&!a.scenes[e.scene])errors.push(id+': unknown next effect destination');if(e.type==='flag'&&!safeKey(e.key))errors.push(id+': invalid flag key');if(['condition','remove_condition','inflict_condition'].includes(e.type)&&!CONDITIONS.includes(e.condition))errors.push(id+': invalid condition');if(e.type==='item'&&(typeof e.item!=='string'||!e.item||e.item.length>200))errors.push(id+': invalid item');if(e.duration!==undefined&&(!Number.isInteger(e.duration)||!num(e.duration,1,10)))errors.push(id+': invalid effect duration');}}
  }
  if(s.enemy&&(!Number.isInteger(s.enemy.hp)||!num(s.enemy.hp,1,1000)||!Number.isInteger(s.enemy.damage)||!num(s.enemy.damage,0,100)||!num(s.enemy.attack||0,-10,30)||(s.enemy.defense!==undefined&&!num(s.enemy.defense,1,40))||(s.enemy.stat!==undefined&&!STATS.includes(s.enemy.stat))))errors.push(id+': invalid enemy');
 }
 return errors;
}
class Engine {
 constructor(adventure,character=null,seed=123){
  const errs=validateAdventure(adventure);assert(!errs.length,errs.join('; '));
  const c=clone(character||adventure.defaultCharacter),ce=validateCharacter(c);assert(!ce.length,ce.join('; '));
  this.adventure=clone(adventure);this.character=c;
  const maxHp=20+mod(c.stats.CON)*2,maxEnergy=12+Math.max(0,mod(c.stats.WIS));
  this.state={version:VERSION,adventureId:adventure.id,scene:adventure.start,turn:0,hp:maxHp,maxHp,energy:maxEnergy,maxEnergy,shield:0,flags:{},items:[],conditions:[],effects:[],cooldowns:{},enemies:{},log:[],rng:(Number(seed)>>>0)||123,status:'playing'};
  this._enter(adventure.start);this._log('start',{text:adventure.title+' — '+c.name});
 }
 _log(type,data){this.state.log.push({index:this.state.log.length,turn:this.state.turn,type,...clone(data)});}
 _roll(){let x=this.state.rng;x^=x<<13;x^=x>>>17;x^=x<<5;this.state.rng=x>>>0;return Math.floor((this.state.rng/4294967296)*20)+1;}
 _enter(id){assert(this.adventure.scenes[id],'Unknown scene');this.state.scene=id;const s=this.adventure.scenes[id];if(s.enemy&&this.state.enemies[id]===undefined)this.state.enemies[id]=s.enemy.hp;if(s.ending)this.state.status=s.ending;this._log('scene_context',this._context());}
 _context(){const s=this._scene();return {scene:this.state.scene,title:s.title||this.state.scene,text:s.text,options:(s.actions||[]).filter(a=>this._available(a)).map(a=>({id:a.id,label:a.label,preview:this.preview(a.id)}))};}
 _scene(){return this.adventure.scenes[this.state.scene];}
 _available(a){let r=a.requires;if(!r)return true;if(Array.isArray(r))return r.every(x=>this._require(x));return this._require(r);}
 _require(r){if(r.flag!==undefined)return (this.state.flags[r.flag]===undefined?false:this.state.flags[r.flag])===(r.value===undefined?true:r.value);if(r.item)return this.state.items.includes(r.item);if(r.tag)return this._tags().includes(r.tag);if(r.enemyAlive)return (this.state.enemies[this.state.scene]||0)>0;if(r.enemyDefeated)return (this.state.enemies[this.state.scene]||0)<=0;if(r.energy!==undefined)return this.state.energy>=r.energy;return false;}
 _tags(extra=[]){return [...(this.character.tags||[]),...this.state.effects.filter(e=>['grant_tag','transform'].includes(e.type)).flatMap(e=>e.tags||[]),...extra.filter(e=>['grant_tag','transform'].includes(e.type)).flatMap(e=>e.tags||[])];}
 _effectiveScore(stat,effects=this.state.effects){return Math.min(26,this.character.stats[stat]+effects.filter(e=>['stat_boost','transform'].includes(e.type)&&e.stat===stat).reduce((a,e)=>a+(e.amount||1),0));}
 _bonus(check,effects=this.state.effects){let total=0;for(const e of effects){if(['check_bonus','summon'].includes(e.type)&&(!e.stat||e.stat===check.stat)&&(!e.tags?.length||e.tags.some(t=>(check.tags||[]).includes(t))))total+=e.amount||1;}return Math.min(8,total+mod(this._effectiveScore(check.stat,effects))-mod(this.character.stats[check.stat]));}
 getState(){return clone({...this.state,character:this.character,sceneData:this._scene(),capabilities:this._tags(),enemyHp:this.state.enemies[this.state.scene]||0});}
 listActions(){if(this.state.status!=='playing')return [];return (this._scene().actions||[]).filter(a=>this._available(a)).map(a=>({...clone(a),preview:this.preview(a.id)}));}
 preview(actionId,powerId){const a=(this._scene().actions||[]).find(a=>a.id===actionId);assert(a,'Unknown action');let p=powerId?this.character.powers.find(p=>p.id===powerId):null;assert(!powerId||p,'Unknown power');
  const cost=(a.cost||0)+(p?.cost||0);const effects=[...this.state.effects.filter(e=>(!p||e.source!==p.id)&&(!harmful(e)||e.targetScene===this.state.scene)),...(p?.effects||[])];let reasons=[];
  if(this.state.status!=='playing')reasons.push('Game has ended');if(!this._available(a))reasons.push('Requirements not met');if(cost>this.state.energy)reasons.push('Not enough energy');if(p&&(this.state.cooldowns[p.id]||0)>0)reasons.push('Power is cooling down');if(p&&this.state.conditions.includes('silenced'))reasons.push('Powers are suppressed');
  if(p&&p.effects.some(e=>['damage','drain','inflict_condition'].includes(e.type))&&(!this._scene().enemy||!(this.state.enemies[this.state.scene]>0)))reasons.push('No active enemy target');
  if(p&&p.effects.some(e=>['stat_debuff','check_penalty'].includes(e.type))&&!this._scene().enemy&&!a.check?.oppositionStat)reasons.push('No opposing check target');
  if(p&&p.effects.some(e=>['damage','drain'].includes(e.type))&&!(a.check?.tags||[]).includes('attack'))reasons.push('Damage powers require an attack-tagged check');
  if(p&&p.effects.some(harmful)&&!a.check)reasons.push('Offensive powers require a checked action or standalone use');
  if(a.check?.requiresTag&&!this._tags(p?.effects||[]).includes(a.check.requiresTag))reasons.push('Missing capability: '+a.check.requiresTag);
  let situational=(a.check?.modifier||0)+(this.state.conditions.includes('weakened')?-2:0)+(this.state.conditions.includes('distracted')?-2:0);
  let bonus=a.check?this._bonus(a.check,effects):0;
  let dc=a.check?.dc;if((a.check?.tags||[]).includes('attack')&&!a.check.oppositionStat)dc-=Math.ceil(effects.filter(e=>e.type==='stat_debuff'&&e.stat==='DEX').reduce((n,e)=>n+(e.amount||1),0)/2);if((a.check?.tags||[]).includes('attack')&&effects.some(e=>e.type==='inflict_condition'&&e.condition==='exposed'))dc-=2;if(a.check?.oppositionStat){const down=effects.filter(e=>e.type==='stat_debuff'&&e.stat===a.check.oppositionStat).reduce((n,e)=>n+(e.amount||1),0);const score=a.check.oppositionScore||10;dc+=mod(Math.max(2,score-down))-mod(score);dc-=effects.filter(e=>e.type==='check_penalty'&&(!e.stat||e.stat===a.check.oppositionStat)&&(!e.tags?.length||e.tags.some(t=>(a.check.tags||[]).includes(t)))).reduce((n,e)=>n+(e.amount||1),0);dc=Math.max(1,dc);}
  if(a.check?.capabilityBonus)for(const [tag,b] of Object.entries(a.check.capabilityBonus))if(this._tags(p?.effects||[]).includes(tag))bonus+=b;
  return {actionId,powerId:powerId||null,label:a.label,allowed:!reasons.length,reasons,cost,check:a.check?{stat:a.check.stat,score:this.character.stats[a.check.stat],effectiveScore:this._effectiveScore(a.check.stat,effects),statModifier:mod(this.character.stats[a.check.stat]),situationalModifier:situational,powerBonus:Math.min(8,bonus),baseDc:a.check.dc,dc,totalModifier:mod(this.character.stats[a.check.stat])+situational+Math.min(8,bonus)}:null,success:a.success?.text||'',failure:a.failure?.text||'',enemyResponse:!!this._scene().enemy&&(this.state.enemies[this.state.scene]||0)>0};
 }
 _tick(){this._log('turn_context',{...this._context(),turn:this.state.turn+1});this.state.turn++;this.state.effects=this.state.effects.map(e=>({...e,remaining:(e.remaining||1)-1})).filter(e=>e.remaining>0);for(const k of Object.keys(this.state.cooldowns))this.state.cooldowns[k]=Math.max(0,this.state.cooldowns[k]-1);}
 _hurt(amount,tags=['physical']){const r=this.state.effects.filter(e=>e.type==='resistance'&&(!e.tags?.length||e.tags.some(t=>tags.includes(t)))).reduce((a,e)=>a+(e.amount||1),0);let dmg=Math.max(0,amount-Math.min(8,r));const shield=Math.min(dmg,this.state.shield);this.state.shield-=shield;dmg-=shield;this.state.hp=Math.max(0,this.state.hp-dmg);if(this.state.hp===0)this.state.status='defeat';return dmg;}
 _apply(e,power=false){if(harmful(e))e={...e,targetScene:this.state.scene};const s=this.state,a=e.amount??1,target=e.target||(['damage','drain','inflict_condition'].includes(e.type)?'enemy':'self');
 switch(e.type){
 case 'damage':if(target==='enemy')s.enemies[s.scene]=Math.max(0,(s.enemies[s.scene]||0)-a);else this._hurt(a,e.tags||['physical']);break;
 case 'heal':s.hp=Math.min(s.maxHp,s.hp+a);break;
 case 'drain':{const hit=Math.min(a,s.enemies[s.scene]||0);s.enemies[s.scene]=Math.max(0,(s.enemies[s.scene]||0)-hit);s.hp=Math.min(s.maxHp,s.hp+Math.ceil(hit/2));break;}
 case 'shield':s.shield=Math.min(s.maxHp,s.shield+a);break;
 case 'restore_energy':case 'resource':s.energy=Math.max(0,Math.min(s.maxEnergy,s.energy+(e.amount||0)));break;
 case 'flag':s.flags[e.key]=e.value===undefined?true:e.value;break;
 case 'item':if(e.remove)s.items=s.items.filter(i=>i!==e.item);else if(!s.items.includes(e.item))s.items.push(e.item);break;
 case 'next':if(s.status!=='defeat')this._enter(e.scene);break;
 case 'condition':if(!s.conditions.includes(e.condition))s.conditions.push(e.condition);break;
 case 'cleanse':s.conditions=[];break;
 case 'remove_condition':s.conditions=s.conditions.filter(c=>c!==e.condition);break;
 case 'inflict_condition':s.effects.push({...clone(e),remaining:e.duration||1});break;
 default:s.effects=s.effects.filter(old=>!(old.source===e.source&&old.type===e.type&&old.stat===e.stat));s.effects.push({...clone(e),remaining:e.duration||1});
 }
 }
 _power(p,checkResolved=false,success=true){this.state.energy-=p.cost;this.state.cooldowns[p.id]=p.cooldown||0;for(const e of p.effects){if(harmful(e)&&!success)continue;if(checkResolved&&['check_bonus','stat_boost','summon','transform','grant_tag'].includes(e.type)){if((e.duration||1)>1)this._apply({...e,source:p.id,duration:e.duration-1},true);}else this._apply({...e,source:p.id},true);}this._log('power',{power:p.id,name:p.name,cost:p.cost,effects:p.effects,success});}
 _enemyResponse(sceneId){const scene=this.adventure.scenes[sceneId];if(!scene.enemy||this.state.status!=='playing'||(this.state.enemies[sceneId]||0)<=0)return;
  const roll=this._roll(),defense=10+mod(this._effectiveScore('DEX'))+(this.state.conditions.includes('exposed')?-2:0);const targeted=this.state.effects.filter(e=>e.targetScene===sceneId);const debuffs=targeted.filter(e=>e.type==='check_penalty'&&(!e.stat||e.stat===(scene.enemy.stat||'STR'))&&(!e.tags?.length||e.tags.some(t=>['attack',...(scene.enemy.tags||[])].includes(t)))).reduce((a,e)=>a+(e.amount||1),0)+Math.ceil(targeted.filter(e=>e.type==='stat_debuff'&&e.stat===(scene.enemy.stat||'STR')).reduce((a,e)=>a+(e.amount||1),0)/2);
  const penalty=Math.min(8,debuffs)+(targeted.some(e=>e.type==='inflict_condition'&&['weakened','distracted','restrained'].includes(e.condition))?2:0);
  const total=roll+(scene.enemy.attack||0)-penalty,hit=total>=defense;const damage=hit?this._hurt(scene.enemy.damage,scene.enemy.tags||['physical']):0;this._log('enemy',{name:scene.enemy.name,roll,modifier:(scene.enemy.attack||0)-penalty,total,dc:defense,success:hit,damage});
 }
 act(actionId,powerId){const preview=this.preview(actionId,powerId);assert(preview.allowed,preview.reasons.join('; '));const a=this._scene().actions.find(a=>a.id===actionId),sceneId=this.state.scene,p=powerId?this.character.powers.find(p=>p.id===powerId):null;
  let roll=null,total=null,success=true;if(preview.check){roll=this._roll();total=roll+preview.check.totalModifier;success=total>=preview.check.dc;}
  this._tick();this.state.energy-=(a.cost||0);if(p)this._power(p,true,success);
  const outcome=success?a.success:a.failure;this._log('action',{actionId,label:a.label,roll,total,check:preview.check,success,cost:preview.cost,text:outcome?.text||''});
  let destination=outcome?.next;const before={hp:this.state.hp,energy:this.state.energy,shield:this.state.shield,enemyHp:this.state.enemies[sceneId]||0};
  for(const e of outcome?.effects||[]){if(e.type==='next'){if(!outcome?.next)destination=e.scene;}else this._apply(e);}
  this._log('consequences',{effects:outcome?.effects||[],before,after:{hp:this.state.hp,energy:this.state.energy,shield:this.state.shield,enemyHp:this.state.enemies[sceneId]||0}});
  // A successful departure escapes this encounter. Failed departures resolve
  // retaliation in the source scene before any arrival; death prevents travel.
  if(!(success&&destination&&destination!==sceneId))this._enemyResponse(sceneId);
  if(destination&&this.state.status==='playing')this._enter(destination);
  this._deadline();return this.getState();
 }
 previewPower(powerId){const p=this.character.powers.find(p=>p.id===powerId);assert(p,'Unknown power');const offensive=p.effects.some(harmful),reasons=[];
  if(this.state.status!=='playing')reasons.push('Game has ended');if(this.state.energy<p.cost)reasons.push('Not enough energy');if(this.state.cooldowns[p.id]>0)reasons.push('Power is cooling down');if(this.state.conditions.includes('silenced'))reasons.push('Powers are suppressed');if(offensive&&(!this._scene().enemy||!(this.state.enemies[this.state.scene]>0)))reasons.push('No active enemy target');
  const stat=p.stat||'INT',check=offensive?{stat,dc:Math.max(1,(this._scene().enemy?.defense||12)-Math.ceil(this.state.effects.filter(e=>e.targetScene===this.state.scene&&e.type==='stat_debuff'&&e.stat==='DEX').reduce((n,e)=>n+(e.amount||1),0)/2))-(this.state.effects.some(e=>e.targetScene===this.state.scene&&e.type==='inflict_condition'&&e.condition==='exposed')?2:0),tags:['attack',...(p.tags||[])]}:null;
  let modifier=check?mod(this.character.stats[stat])+this._bonus(check)+(this.state.conditions.includes('weakened')?-2:0)+(this.state.conditions.includes('distracted')?-2:0):0;
  return {powerId,allowed:!reasons.length,reasons,cost:p.cost,check:check?{...check,statModifier:mod(this.character.stats[stat]),totalModifier:modifier}:null};
 }
 usePower(powerId){const preview=this.previewPower(powerId);assert(preview.allowed,preview.reasons.join('; '));const p=this.character.powers.find(p=>p.id===powerId),scene=this.state.scene;
  let roll=null,total=null,success=true;if(preview.check){roll=this._roll();total=roll+preview.check.totalModifier;success=total>=preview.check.dc;}
  this._tick();this._power(p,false,success);this._log('power_check',{powerId,roll,total,check:preview.check,success});this._enemyResponse(scene);this._deadline();return this.getState();
 }
 _deadline(){if(this.adventure.turnLimit&&this.state.turn>=this.adventure.turnLimit&&this.state.status==='playing'){this.state.status='defeat';this._log('deadline',{text:this.adventure.deadlineText||'Time ran out.'});}}
 rest(){assert(this.state.status==='playing','Game has ended');assert(this._scene().rest,'Rest is not available here');assert(!this.state.flags['rest:'+this.state.scene],'This rest opportunity is spent');this._tick();this.state.flags['rest:'+this.state.scene]=true;this.state.energy=this.state.maxEnergy;this.state.hp=Math.min(this.state.maxHp,this.state.hp+6);this.state.conditions=[];this._log('rest',{text:'Recovered all energy and 6 health.'});this._deadline();return this.getState();}
 // Auto mode is a random legal player, not a solver or a separate rules engine.
 listAutoOptions(){
  if(this.state.status!=='playing')return [];
  const options=[];
  for(const a of this._scene().actions||[]){
   for(const powerId of [undefined,...this.character.powers.map(p=>p.id)]){
    const preview=this.preview(a.id,powerId);
    if(preview.allowed)options.push({kind:'action',actionId:a.id,powerId:powerId||null,label:a.label+(powerId?' + '+this.character.powers.find(p=>p.id===powerId).name:'' )});
   }
  }
  for(const p of this.character.powers)if(this.previewPower(p.id).allowed)options.push({kind:'power',powerId:p.id,label:'Use '+p.name});
  if(this._scene().rest&&!this.state.flags['rest:'+this.state.scene])options.push({kind:'rest',label:'Rest'});
  return options;
 }
 autoStep(){
  if(this.state.status!=='playing')return {stopped:'ended',status:this.state.status};
  const options=this.listAutoOptions();
  if(!options.length)return {stopped:'no-valid-options',status:this.state.status};
  // Separate saved RNG stream: selecting an option never consumes a dice roll.
  let x=this.state.autoRng===undefined?((this.state.rng^0x9e3779b9)>>>0)||1:this.state.autoRng;
  x^=x<<13;x^=x>>>17;x^=x<<5;this.state.autoRng=x>>>0;
  const choice=options[Math.floor(this.state.autoRng/4294967296*options.length)],scene=this.state.scene;
  this._log('auto_choice',{choice,scene,optionCount:options.length,text:'Auto chooses: '+choice.label+' ['+(this._scene().title||scene)+']'});
  if(choice.kind==='action')this.act(choice.actionId,choice.powerId||undefined);
  else if(choice.kind==='power')this.usePower(choice.powerId);else this.rest();
  if(this.state.scene!==scene)this._log('auto_arrival',{scene:this.state.scene,text:(this._scene().title||this.state.scene)+'\n'+this._scene().text});
  return {choice,stopped:this.state.status==='playing'?null:'ended',status:this.state.status};
 }
 runAuto(maxSteps=200){
  assert(Number.isInteger(maxSteps)&&maxSteps>=1&&maxSteps<=1000,'Auto step limit must be an integer from 1 to 1000');
  let steps=0,result={stopped:null};
  while(steps<maxSteps){result=this.autoStep();if(result.choice)steps++;if(result.stopped)break;}
  return {...result,steps,stopped:result.stopped||'step-limit'};
 }
 exportSave(){return JSON.stringify({format:'crpg-forge-save',version:VERSION,adventureId:this.adventure.id,adventureVersion:this.adventure.version||1,...(this.adventure.generation?{adventure:this.adventure}:{}),character:this.character,state:this.state},null,2);}
 importSave(json){assert(typeof json==='string'&&json.length<5000000,'Save must be text under 5 MB');let s=JSON.parse(json);assert(s.format==='crpg-forge-save'&&s.version===VERSION,'Unsupported save format');assert(s.adventureId===this.adventure.id&&s.adventureVersion===(this.adventure.version||1),'Save belongs to another adventure/version');assert(!validateCharacter(s.character).length,'Invalid saved character');const st=s.state;
  assert(st&&this.adventure.scenes[st.scene]&&st.adventureId===this.adventure.id,'Invalid saved scene');assert(Number.isInteger(st.turn)&&st.turn>=0,'Invalid turn');assert(st.maxHp===20+mod(s.character.stats.CON)*2&&num(st.hp,0,st.maxHp),'Invalid HP');assert(st.maxEnergy===12+Math.max(0,mod(s.character.stats.WIS))&&num(st.energy,0,st.maxEnergy),'Invalid energy');assert(num(st.shield,0,st.maxHp)&&Number.isInteger(st.rng)&&num(st.rng,1,4294967295),'Invalid state');
  if(st.autoRng!==undefined)assert(Number.isInteger(st.autoRng)&&num(st.autoRng,1,4294967295),'Invalid auto RNG');
  for(const k of ['items','conditions','effects','log'])assert(Array.isArray(st[k]),'Invalid '+k);for(const k of ['flags','cooldowns','enemies'])assert(st[k]&&typeof st[k]==='object'&&!Array.isArray(st[k]),'Invalid '+k);assert(['playing','victory','defeat','escape','mixed'].includes(st.status)&&!(st.hp===0&&st.status!=='defeat'),'Invalid ending status');assert(st.conditions.every(c=>CONDITIONS.includes(c))&&st.items.every(i=>typeof i==='string'&&i.length<200),'Invalid conditions/items');for(const [k,v] of Object.entries(st.cooldowns))assert(s.character.powers.some(p=>p.id===k)&&Number.isInteger(v)&&num(v,0,10),'Invalid cooldown');for(const [k,v] of Object.entries(st.enemies))assert(this.adventure.scenes[k]?.enemy&&num(v,0,this.adventure.scenes[k].enemy.hp),'Invalid enemy');assert(Object.keys(st.flags).every(safeKey)&&Object.values(st.flags).every(v=>v===null||typeof v==='boolean'||typeof v==='string'||(typeof v==='number'&&Number.isFinite(v))),'Invalid flags');assert(st.effects.length<=100&&st.effects.every(e=>this._validSavedEffect(e,s.character)),'Invalid effects');this.character=clone(s.character);this.state=clone(st);return this.getState();
 }
 _validSavedEffect(e,character){if(!e||typeof e!=='object')return false;if(harmful(e)&&!this.adventure.scenes[e.targetScene])return false;if(!e||!EFFECT_TYPES.includes(e.type)||!Number.isInteger(e.remaining)||!num(e.remaining,1,10))return false;const candidates=e.source?((character.powers||[]).find(p=>p.id===e.source)?.effects||[]):Object.values(this.adventure.scenes).flatMap(s=>(s.actions||[]).flatMap(a=>['success','failure'].flatMap(k=>a[k]?.effects||[])));return candidates.some(c=>['type','amount','stat','condition','target'].every(k=>c[k]===e[k])&&JSON.stringify(c.tags||[])===JSON.stringify(e.tags||[])&&(e.duration||1)<=(c.duration||1)&&e.remaining<=(c.duration||1));}
 exportLog(){return this.state.log.map(e=>JSON.stringify(e)).join('\n');}
 exportReadableLog(){
  const lines=[this.adventure.title,'Character: '+this.character.name],groups=new Map();
  for(const e of this.state.log){const turn=e.type==='auto_choice'?e.turn+1:e.turn;if(!groups.has(turn))groups.set(turn,[]);groups.get(turn).push(e);}
  let lastContext='';
  for(const [turn,events] of [...groups].sort((a,b)=>a[0]-b[0])){
   lines.push('',turn===0?'INITIAL SCENE':'TURN '+turn);
   for(const e of events){
    const actor=e.actorName?'['+e.actorName+(e.controller?' / '+e.controller:'')+'] ':'';
    if(['scene_context','turn_context'].includes(e.type)){
     const signature=JSON.stringify([e.scene,e.text,e.options]);if(signature===lastContext)continue;lastContext=signature;
     lines.push('',(e.type==='scene_context'?'Location: ':'Situation: ')+e.title,e.text,'Available choices:');
     for(const o of e.options||[]){const p=o.preview,c=p?.check;lines.push('- '+o.label+(c?' ['+c.stat+' '+(c.totalModifier>=0?'+':'')+c.totalModifier+' vs DC '+c.dc+']':' [no check]')+(p?.cost?' Energy '+p.cost:'')+(!p?.allowed?' (unavailable: '+(p?.reasons||[]).join('; ')+')':''));}
    }else if(['action','power_check'].includes(e.type)){
     lines.push(actor+(e.label||'Use power '+e.powerId));
     if(e.check)lines.push('Roll: d20 '+e.roll+' + '+e.check.stat+' modifier '+e.check.statModifier+' + situation '+(e.check.situationalModifier||0)+' + powers '+(e.check.powerBonus??(e.check.totalModifier-e.check.statModifier-(e.check.situationalModifier||0)))+' (total modifier '+e.check.totalModifier+')'+' = '+e.total+' vs DC '+e.check.dc+' → '+(e.success?'SUCCESS':'FAILURE'));
     if(e.text)lines.push(e.text);
    }else if(e.type==='enemy')lines.push(actor+e.name+': d20 '+e.roll+' + '+e.modifier+' = '+e.total+' vs defense '+e.dc+'; '+(e.success?'hit for '+e.damage+' damage':'miss'));
    else if(e.type==='consequences'){if(e.effects.length)lines.push('Mechanical effects: '+JSON.stringify(e.effects));lines.push('After outcome: HP '+e.after.hp+', energy '+e.after.energy+', shield '+e.after.shield+', enemy HP '+e.after.enemyHp);}
    else if(e.type==='power')lines.push(actor+e.name+' costs '+e.cost+' energy. '+JSON.stringify(e.effects||[])+(e.success===false&&(e.effects||[]).some(harmful)?' Offensive effects failed.':''));
    else if(e.type!=='auto_arrival')lines.push(actor+(e.text||JSON.stringify(e)));
   }
  }
  lines.push('','Final status: '+this.state.status+' | HP '+this.state.hp+'/'+this.state.maxHp+' | Energy '+this.state.energy+'/'+this.state.maxEnergy);
  return lines.join('\n');
 }
 exportCharacter(){return JSON.stringify(this.character,null,2);}
}
return {VERSION,STATS,EFFECT_TYPES,CAPABILITIES,CONDITIONS,modifier:mod,validatePower,validateCharacter,validateAdventure,Engine};
});
