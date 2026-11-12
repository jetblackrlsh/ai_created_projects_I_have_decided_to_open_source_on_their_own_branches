/* Legal-choice builder shared by manual/headless callers and builder autopilot. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine'));else root.CRPG_BUILDER=factory(root.CRPG);})(typeof globalThis!=='undefined'?globalThis:this,function(C){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x)),range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i),types=C.EFFECT_TYPES.filter(t=>t!=='restore_energy');
const weight=e=>(['damage','heal','shield','drain'].includes(e.type)?Math.ceil((e.amount||1)/3):(e.amount||1))+Math.max(0,(e.duration||1)-1)+(['grant_tag','transform'].includes(e.type)?Math.max(0,(e.tags||[]).length-1):0);
const defaultTags=['attack','social','investigation','movement','stealth','preparation','exploration','physical',...C.CAPABILITIES];
class Builder{
 constructor(options={}){if(options.tags!==undefined&&(!Array.isArray(options.tags)||options.tags.length>1000))throw Error('Provide up to 1000 custom tags');this.character={name:options.name||'Generated adventurer',description:options.description||'Edit this flavor to suit the mechanical build.',stats:{},powers:[]};this.tags=[...new Set([...defaultTags,...(options.tags||[])])];if(this.tags.some(t=>typeof t!=='string'||t.length>60))throw Error('Custom tags must be strings of at most 60 characters');this.phase='score';this.index=0;this.trace=[];this.done=false;}
 _remaining(){return this.power.cost*3-this.power.effects.reduce((n,e)=>n+weight(e),0)-(this.effectCount-this.power.effects.length-1)}
 choices(){if(this.done)return [];let values=[];const e=this.effect,p=this.power;
 switch(this.phase){
 case 'score':values=range(6,Math.min(18,78-Object.values(this.character.stats).reduce((a,b)=>a+b,0)-6*(5-this.index)));break;
 case 'powerCount':values=range(0,8);break;
 case 'cost':values=range(1,12);break;
 case 'cooldown':values=range(0,10);break;
 case 'powerStat':values=[null,...C.STATS];break;
 case 'effectCount':values=range(1,Math.min(5,p.cost*3));break;
 case 'type':values=types;break;
 case 'amount':{const cap=['check_bonus','check_penalty','stat_boost','stat_debuff','resistance','summon','transform'].includes(e.type)?4:12;values=range(1,cap).filter(n=>weight({...e,amount:n,duration:1})<=this._remaining());break;}
 case 'duration':values=range(1,10).filter(n=>weight({...e,duration:n})<=this._remaining());break;
 case 'effectStat':values=['stat_boost','stat_debuff','transform'].includes(e.type)?C.STATS:[null,...C.STATS];break;
 case 'condition':values=e.type==='inflict_condition'?C.CONDITIONS.filter(c=>c!=='silenced'):C.CONDITIONS;break;
 case 'tagCount':values=range(['grant_tag','transform'].includes(e.type)?1:0,4).filter(n=>weight({...e,tags:Array(n).fill('tag')})<=this._remaining());break;
 case 'tag':values=['grant_tag','transform'].includes(e.type)?C.CAPABILITIES:this.tags;break;
 }
 if(!values.length)throw Error('Builder reached an invalid empty choice set');return values.map(value=>({phase:this.phase,value}));
 }
 choose(value){const legal=this.choices();if(!legal.some(c=>JSON.stringify(c.value)===JSON.stringify(value)))throw Error('Illegal builder choice for '+this.phase);this.trace.push({phase:this.phase,value});const phase=this.phase;
 if(phase==='score'){this.character.stats[C.STATS[this.index++]]=value;if(this.index===6)this.phase='powerCount';}
 else if(phase==='powerCount'){this.powerCount=value;value?this._newPower():this._finish();}
 else if(phase==='cost'){this.power.cost=value;this.phase='cooldown';}
 else if(phase==='cooldown'){this.power.cooldown=value;this.phase='powerStat';}
 else if(phase==='powerStat'){if(value!==null)this.power.stat=value;this.phase='effectCount';}
 else if(phase==='effectCount'){this.effectCount=value;this.phase='type';}
 else if(phase==='type'){this.effect={type:value};this.phase='amount';}
 else if(phase==='amount'){this.effect.amount=value;this.phase='duration';}
 else if(phase==='duration'){this.effect.duration=value;this.phase='effectStat';}
 else if(phase==='effectStat'){if(value!==null)this.effect.stat=value;this.phase=['inflict_condition','remove_condition'].includes(this.effect.type)?'condition':'tagCount';}
 else if(phase==='condition'){this.effect.condition=value;this.phase='tagCount';}
 else if(phase==='tagCount'){this.tagCount=value;this.effect.tags=[];value?this.phase='tag':this._endEffect();}
 else if(phase==='tag'){this.effect.tags.push(value);if(this.effect.tags.length===this.tagCount)this._endEffect();}
 return this.done?copy(this.character):this.choices();
 }
 _newPower(){this.power={id:'generated_power_'+this.character.powers.length,name:'Technique '+(this.character.powers.length+1),effects:[]};this.phase='cost';}
 _endEffect(){if(!this.effect.tags.length)delete this.effect.tags;this.power.effects.push(this.effect);if(this.power.effects.length<this.effectCount){this.phase='type';return}const errors=C.validatePower(this.power);if(errors.length)throw Error(errors.join('; '));this.character.powers.push(this.power);this.character.powers.length<this.powerCount?this._newPower():this._finish();}
 _finish(){const errors=C.validateCharacter(this.character);if(errors.length)throw Error(errors.join('; '));this.done=true;this.phase='done';}
}
function randomSource(seed){if(typeof seed==='number'){if(!Number.isInteger(seed)||seed<1||seed>4294967295)throw Error('Numeric seed must be an integer 1–4294967295');}else if(typeof seed!=='string'||!seed.length||seed.length>10000)throw Error('Text seed must be 1–10000 characters');let x=2166136261;for(const c of String(seed)){x^=c.charCodeAt(0);x=Math.imul(x,16777619)}x=x>>>0||1;return n=>{x^=x<<13;x^=x>>>17;x^=x<<5;x>>>=0;return Math.floor(x/4294967296*n)}}
function autopilot(seed,options={}){const b=new Builder(options),pick=randomSource(seed);for(let i=0;!b.done&&i<1000;i++){const choices=b.choices();b.choose(choices[pick(choices.length)].value)}if(!b.done)throw Error('Builder safety limit');return {character:copy(b.character),choices:copy(b.trace),seed};}
function replay(choices,options={}){if(!Array.isArray(choices)||choices.length>1000)throw Error('Choice tape must contain at most 1000 choices');const b=new Builder(options);for(const c of choices){if(b.done||c.phase!==b.phase)throw Error('Choice tape phase mismatch');b.choose(c.value)}if(!b.done)throw Error('Incomplete choice tape');return copy(b.character);}
// Construct a witness path through the same legal-choice builder for a validated
// manual character. The caller can replay this tape to verify mechanical reachability.
function traceCharacter(character){const errors=C.validateCharacter(character);if(errors.length)throw Error(errors.join('; '));const tags=character.powers.flatMap(p=>p.effects.flatMap(e=>e.tags||[]));const options={name:character.name,description:character.description||'',tags},b=new Builder(options);for(const stat of C.STATS)b.choose(character.stats[stat]);b.choose(character.powers.length);
 for(const p of character.powers){b.choose(p.cost);b.choose(p.cooldown||0);b.choose(p.stat||null);b.choose(p.effects.length);for(const e of p.effects){b.choose(e.type);b.choose(e.amount===undefined?1:e.amount);b.choose(e.duration===undefined?1:e.duration);b.choose(e.stat||null);if(['inflict_condition','remove_condition'].includes(e.type))b.choose(e.condition);b.choose((e.tags||[]).length);for(const tag of e.tags||[])b.choose(tag)}}return {choices:b.trace,options,character:b.character};}
return {Builder,autopilot,replay,traceCharacter};});
