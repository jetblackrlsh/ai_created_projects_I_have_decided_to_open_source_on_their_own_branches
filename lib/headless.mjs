/** Aether Snap headless adapter. No dependencies, network, DOM, or browser. */
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const CORE=fs.readFileSync(new URL('./engine-core.js',import.meta.url),'utf8');
const HASH=crypto.createHash('sha256').update(CORE).digest('hex');
const clone=x=>JSON.parse(JSON.stringify(x));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function runtime(seed) {
  let ticks=0, r=0x12345678;
  for (const c of seed) r=(Math.imul(r^c.charCodeAt(0),16777619))>>>0;
  const math=Object.create(Math); math.random=()=>{r^=r<<13;r^=r>>>17;r^=r<<5;return (r>>>0)/4294967296;};
  class Clock extends Date {
    constructor(...args){super(...(args.length?args:[Date.UTC(2000,0,1)+ticks++]));}
    static now(){return Date.UTC(2000,0,1)+ticks++;}
    toLocaleTimeString(){return this.toISOString().slice(11,23)+'Z';}
    toLocaleDateString(){return this.toISOString().slice(0,10);}
  }
  const context=vm.createContext({Math:math,Date:Clock,btoa,atob,console:{warn(){}},setTimeout});
  vm.runInContext(CORE+'\nglobalThis.api={GameEngine,SeededRNG,generateCardFromSeed,generateLocationFromSeed,generateDeckFromSeed,decodeDeckInput};',context,{timeout:30000});
  context.api.GameEngine.prototype._delay=async()=>{};
  return context.api;
}
function normalizeOptions(o={}) {
  for(const k of ['matchSeed','playerDeck','cpuDeck']) if(o[k]!==undefined&&(typeof o[k]!=='string'||!o[k].trim()||o[k].length>10000)) throw Error(k+' must be a nonempty string (max 10000 characters)');
  return {matchSeed:o.matchSeed??'AETHER-AGENT-1',playerDeck:o.playerDeck??'AETHER-PLAYER-1',cpuDeck:o.cpuDeck??'AETHER-CPU-1'};
}
export class HeadlessGame {
  constructor(options={}) {
    this.options=normalizeOptions(options); this.history=[]; this.api=runtime(this.options.matchSeed);
    this.engine=new this.api.GameEngine({matchSeed:this.options.matchSeed,playerDeckSpec:this.api.decodeDeckInput(this.options.playerDeck),cpuDeckSpec:this.api.decodeDeckInput(this.options.cpuDeck)});
  }
  legalActions() {
    const e=this.engine; if(e.phase!=='STAGING') return [];
    const a=[];
    for(const c of e.player.hand) if(c.cost<=e.player.energy) for(let lane=0;lane<3;lane++) if(e.locations[lane].playerCards.length+e.stagedPlayerPlays.filter(x=>x.laneIndex===lane).length<4) a.push({type:'play',cardUid:c.uid,lane});
    for(const p of e.stagedPlayerPlays) a.push({type:'unplay',cardUid:p.card.uid});
    if(e.stagedPlayerPlays.length) a.push({type:'undo'});
    a.push({type:'end_turn'});return a;
  }
  observe() {
    const e=this.engine;
    return clone({schema:'aether-snap-observation-v1',matchSeed:e.matchSeed,turn:e.turn,maxTurns:e.maxTurns,phase:e.phase,energy:e.player.energy,player:{deckName:e.player.deckName,deckSeed:e.player.deckSeed,hand:e.player.hand,drawCount:e.player.drawPile.length,discardCount:e.player.discardCount,destroyCount:e.player.destroyCount,discardPile:e.player.discardPile,destroyedPile:e.player.destroyedPile,bonusEnergyNextTurn:e.player.bonusEnergyNextTurn},cpu:{deckName:e.cpu.deckName,deckSeed:e.cpu.deckSeed,handCount:e.cpu.hand.length,drawCount:e.cpu.drawPile.length,discardCount:e.cpu.discardCount,destroyCount:e.cpu.destroyCount},staged:e.stagedPlayerPlays,locations:e.locations.map((l,lane)=>({lane,revealed:l.revealed,revealTurn:l.revealTurn,...(l.revealed?{name:l.name,effectText:l.effectText,effectId:l.effectId,locTrigger:l.locTrigger,effectParam:l.effectParam}:{}),playerCards:l.playerCards,cpuCards:l.cpuCards,playerTotalPower:l.playerTotalPower,cpuTotalPower:l.cpuTotalPower})),legalActions:this.legalActions(),result:e.result});
  }
  async act(action) {
    // Only exact advertised action objects are accepted; rejects extra keys and coercions.
    if(!action||typeof action!=='object'||Array.isArray(action)||!this.legalActions().some(a=>equal(Object.fromEntries(Object.entries(a).sort()),Object.fromEntries(Object.entries(action).sort())))) return {ok:false,error:'Illegal action. Choose an exact object from legalActions.',observation:this.observe()};
    const e=this.engine;
    if(action.type==='play') {const r=e.stageCardPlay(action.cardUid,action.lane);if(!r.ok) throw Error(r.reason);}
    else if(action.type==='unplay') e.unstageCardPlay(action.cardUid);
    else if(action.type==='undo') e.undoAllStagedPlays();
    else await e.commitTurn();
    this.history.push(clone(action)); return {ok:true,observation:this.observe()};
  }
  save() {
    const payload={schema:'aether-snap-save-v1',engineSHA256:HASH,options:this.options,actions:this.history};
    return {...clone(payload),checksum:crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')};
  }
  static async load(save) {
    if(!save||save.schema!=='aether-snap-save-v1'||save.engineSHA256!==HASH||!Array.isArray(save.actions)||save.actions.length>10000) throw Error('Invalid or incompatible save');
    const {checksum,...payload}=save;
    if(crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')!==checksum) throw Error('Save checksum mismatch');
    const g=new HeadlessGame(save.options);
    for(const a of save.actions){const r=await g.act(a);if(!r.ok) throw Error('Invalid saved action: '+r.error);}
    return g;
  }
  fullLog(){return this.engine.exportReadableLog();} // Spoiler/debug output, not agent observation.
}
export function chooseDemoAction(obs) {
  const plays=obs.legalActions.filter(a=>a.type==='play');
  if(!plays.length)return {type:'end_turn'};
  const card=uid=>obs.player.hand.find(c=>c.uid===uid);
  // Public information only: efficient power, then contest weakest lane.
  plays.sort((a,b)=>{const x=card(a.cardUid),y=card(b.cardUid);return (y.currentPower/(y.cost+1))-(x.currentPower/(x.cost+1)) || (obs.locations[a.lane].playerTotalPower-obs.locations[a.lane].cpuTotalPower)-(obs.locations[b.lane].playerTotalPower-obs.locations[b.lane].cpuTotalPower) || a.lane-b.lane;});
  return plays[0];
}
function readJSON(path){const s=fs.readFileSync(path,'utf8');if(s.length>4_000_000)throw Error('Input exceeds 4 MB');return JSON.parse(s);}
function writeSave(path,g){const tmp=path+'.tmp-'+process.pid;try{fs.writeFileSync(tmp,JSON.stringify(g.save(),null,2)+'\n',{flag:'wx'});fs.renameSync(tmp,path);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}}
async function cli(args){
 const [cmd,path,arg]=args;
 if(cmd==='--help'||cmd==='help'||cmd==='-h')return {ok:true,usage:'node headless.mjs new SAVE.json [OPTIONS_JSON] | state SAVE.json | act SAVE.json ACTION_JSON | log SAVE.json | demo [SEED]',instructions:'Read README.md. Select exact objects from observation.legalActions; end_turn resolves original CPU; save persists every accepted action.'};
 if(cmd==='new'){if(!path)throw Error('new requires a NEW save path');if(fs.existsSync(path))throw Error('Save exists; choose a new path');const g=new HeadlessGame(arg?JSON.parse(arg):{});writeSave(path,g);return {ok:true,observation:g.observe()};}
 if(cmd==='state'||cmd==='act'||cmd==='log'){if(!path)throw Error('Save path required');const g=await HeadlessGame.load(readJSON(path));if(cmd==='state')return {ok:true,observation:g.observe()};if(cmd==='log'){return {ok:true,spoilerLog:g.fullLog()};}if(!arg)throw Error('act requires one JSON action argument');const result=await g.act(JSON.parse(arg));if(result.ok)writeSave(path,g);return result;}
 if(cmd==='demo'){const g=new HeadlessGame({matchSeed:path??'DEMO-1'});const transcript=[];while(g.engine.phase!=='GAME_OVER'){const a=chooseDemoAction(g.observe());const r=await g.act(a);if(!r.ok)throw Error(r.error);transcript.push({action:a,turn:r.observation.turn,phase:r.observation.phase,energy:r.observation.energy,lanes:r.observation.locations.map(l=>[l.playerTotalPower,l.cpuTotalPower])});}return {ok:true,options:g.options,transcript,result:g.observe().result,save:g.save(),spoilerLog:g.fullLog()};}
 throw Error('Usage: node headless.mjs new SAVE.json [OPTIONS_JSON] | state SAVE.json | act SAVE.json ACTION_JSON | log SAVE.json | demo [SEED]');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===fs.realpathSync(process.argv[1])) {
 try {const out=await cli(process.argv.slice(2));console.log(JSON.stringify(out,null,2));if(out.ok===false)process.exitCode=2;}catch(err){console.log(JSON.stringify({ok:false,error:err.message}));process.exitCode=1;}
}
