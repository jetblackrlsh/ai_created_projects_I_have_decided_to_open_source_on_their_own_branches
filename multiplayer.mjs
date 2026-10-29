/** Aether Snap asynchronous plans/referee v1. Uses original engine, not a CPU simulation. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {HeadlessGame} from './lib/headless.mjs';
export const VERSION='aether-snap-async-v1';
const pathSelf=fileURLToPath(import.meta.url);
export const ENGINE_HASH=crypto.createHash('sha256').update(fs.readFileSync(new URL('./lib/engine-core.js',import.meta.url))).digest('hex');
export const RUNTIME_HASH=crypto.createHash('sha256').update(fs.readFileSync(new URL('./lib/headless.mjs',import.meta.url))).digest('hex');
export const ADAPTER_HASH=crypto.createHash('sha256').update(fs.readFileSync(pathSelf)).digest('hex');
const copy=x=>JSON.parse(JSON.stringify(x));
export function canonical(x){if(x===null||typeof x!=='object')return JSON.stringify(x);if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';}
export const digest=x=>crypto.createHash('sha256').update(canonical(x)).digest('hex');
function check(condition,message){if(!condition)throw Error(message);}
export function seal(kind,data){const obj={protocol:VERSION,kind,...copy(data)};return {...obj,sha256:digest(obj)};}
export function verify(obj,kind){check(obj&&obj.protocol===VERSION&&obj.kind===kind,'Wrong protocol or object kind: expected '+kind);const {sha256,...base}=obj;check(typeof sha256==='string'&&digest(base)===sha256,'Checksum mismatch');return obj;}
function boundedString(x,name,max=200){check(typeof x==='string'&&x.length>0&&x.length<=max,name+' must be a bounded nonempty string');}
export function createSpec(options={}){
 const id=options.id??crypto.randomUUID();check(/^[a-zA-Z0-9_-]{1,80}$/.test(id),'id must be 1-80 filename-safe characters');
 const matchSeed=options.matchSeed??'ASYNC-'+id,deckA=options.deckA??'AETHER-PLAYER-1',deckB=options.deckB??'AETHER-CPU-1';
 for(const k of ['labelA','labelB'])if(options[k]!==undefined)boundedString(options[k],k);
 for(const [k,v]of Object.entries({matchSeed,deckA,deckB}))boundedString(v,k,10000);
 return seal('challenge-spec',{id,engineSHA256:ENGINE_HASH,adapterSHA256:ADAPTER_HASH,runtimeSHA256:RUNTIME_HASH,matchSeed,deckA,deckB,format:'shared-board-six-turn-plans',priority:'original-initiative-seeded-tie',fallback:'ordered-first-legal-otherwise-skip',labelA:options.labelA??'Challenger',labelB:options.labelB??'Any accepting agent'});
}
export function validateSpec(spec){verify(spec,'challenge-spec');check(spec.engineSHA256===ENGINE_HASH&&spec.adapterSHA256===ADAPTER_HASH&&spec.runtimeSHA256===RUNTIME_HASH,'Incompatible engine/adapter hash');check(spec.format==='shared-board-six-turn-plans'&&spec.priority==='original-initiative-seeded-tie'&&spec.fallback==='ordered-first-legal-otherwise-skip','Unsupported rules');check(/^[a-zA-Z0-9_-]{1,80}$/.test(spec.id),'Invalid challenge ID');for(const k of ['matchSeed','deckA','deckB'])boundedString(spec[k],k,10000);return spec;}
export function validateStep(step){check(step&&Object.keys(step).sort().join(',')==='choices,otherwise'&&step.otherwise==='skip'&&Array.isArray(step.choices)&&step.choices.length<=12,'Step requires choices (0-12) and otherwise:"skip" only');for(const x of step.choices)check(x&&Object.keys(x).sort().join(',')==='cardSlot,lane'&&Number.isInteger(x.cardSlot)&&x.cardSlot>=0&&x.cardSlot<12&&Number.isInteger(x.lane)&&x.lane>=0&&x.lane<3,'Choice requires integer cardSlot 0..11 and lane 0..2 only');return step;}
function validateTurns(turns,complete=true){check(Array.isArray(turns)&&turns.length===(complete?6:turns.length)&&turns.length<=6,'A complete plan requires six turn arrays');for(const t of turns){check(Array.isArray(t)&&t.length<=24,'Maximum 24 steps per turn');t.forEach(validateStep);}return turns;}
export class Duel {
 constructor(spec){validateSpec(spec);this.spec=spec;this.g=new HeadlessGame({matchSeed:spec.matchSeed,playerDeck:spec.deckA,cpuDeck:spec.deckB});this.bStaged=[];this.audit=[];this.g.engine._planCpuPlays=()=>{const q=this.bStaged;this.bStaged=[];return q;};}
 uid(side,slot){const e=this.g.engine;const deck=side==='A'?e.playerDeckSource:e.cpuDeckSource;return `${side==='A'?'PLAYER':'CPU'}_${slot}_${deck.cards[slot].seed}`;}
 stage(side,choice){const e=this.g.engine;const uid=this.uid(side,choice.cardSlot);if(side==='A')return e.stageCardPlay(uid,choice.lane);check(side==='B','Invalid side');
  // stageCardPlay's original validation works unchanged for B after a temporary view swap.
  [e.player,e.cpu]=[e.cpu,e.player];for(const l of e.locations)[l.playerCards,l.cpuCards]=[l.cpuCards,l.playerCards];const old=e.stagedPlayerPlays;e.stagedPlayerPlays=this.bStaged;
  try{return e.stageCardPlay(uid,choice.lane);}finally{this.bStaged=e.stagedPlayerPlays;e.stagedPlayerPlays=old;for(const l of e.locations)[l.playerCards,l.cpuCards]=[l.cpuCards,l.playerCards];[e.player,e.cpu]=[e.cpu,e.player];}
 }
 step(side,step){validateStep(step);const rejected=[];for(let i=0;i<step.choices.length;i++){const choice=step.choices[i],r=this.stage(side,choice);if(r.ok){const a={turn:this.g.engine.turn,side,step:copy(step),selected:copy(choice),choiceIndex:i,rejected};this.audit.push(a);return a;}rejected.push({choiceIndex:i,choice:copy(choice),reason:r.reason});}const a={turn:this.g.engine.turn,side,step:copy(step),selected:null,otherwise:'skip',rejected};this.audit.push(a);return a;}
 async end(){check(this.g.engine.phase==='STAGING','Match is not staging');await this.g.engine.commitTurn();}
 observe(side){check(side==='A'||side==='B','Side must be A or B');const e=this.g.engine,o=this.g.observe(),own=side==='A'?e.player:e.cpu,other=side==='A'?e.cpu:e.player;
  const slot=c=>{const prefix=(side==='A'?'PLAYER':'CPU')+'_';const m=c.uid?.startsWith(prefix)?c.uid.slice(prefix.length).match(/^(\d+)_/):null;return m?Number(m[1]):null;};
  const legal=[];if(e.phase==='STAGING')for(const c of own.hand){const s=slot(c);if(s===null||c.cost>own.energy)continue;for(let lane=0;lane<3;lane++){const l=e.locations[lane],cards=side==='A'?l.playerCards:l.cpuCards,staged=side==='A'?e.stagedPlayerPlays:this.bStaged;if(cards.length+staged.filter(p=>p.laneIndex===lane).length<4)legal.push({cardSlot:s,lane});}}
  return copy({protocol:VERSION,side,turn:e.turn,phase:e.phase,energy:own.energy,hand:own.hand.map(c=>({...c,cardSlot:slot(c)})),ownDrawCount:own.drawPile.length,opponentHandCount:other.hand.length,opponentDrawCount:other.drawPile.length,staged:side==='A'?e.stagedPlayerPlays:this.bStaged,locations:o.locations.map(l=>({lane:l.lane,revealed:l.revealed,revealTurn:l.revealTurn,...(l.revealed?{name:l.name,effectText:l.effectText,effectId:l.effectId}:{}),ownCards:side==='A'?l.playerCards:l.cpuCards,opponentCards:side==='A'?l.cpuCards:l.playerCards,ownPower:side==='A'?l.playerTotalPower:l.cpuTotalPower,opponentPower:side==='A'?l.cpuTotalPower:l.playerTotalPower})),legalChoices:legal,result:e.result?{winner:e.result.outcome==='VICTORY'?'A':e.result.outcome==='DEFEAT'?'B':'TIE',originalResult:e.result}:null});
 }
}
export function newDraft(spec,side){validateSpec(spec);check(['A','B'].includes(side),'Side must be A or B');return seal('plan-draft',{specSHA256:spec.sha256,side,turns:[],current:[]});}
export async function preview(spec,draft){validateSpec(spec);verify(draft,'plan-draft');check(draft.specSHA256===spec.sha256&&['A','B'].includes(draft.side),'Draft binding/side mismatch');validateTurns(draft.turns,false);check(Array.isArray(draft.current)&&draft.current.length<=24,'Invalid draft current steps');draft.current.forEach(validateStep);check(draft.turns.length<6||draft.current.length===0,'Completed draft has extra steps');const d=new Duel(spec);for(const turn of draft.turns){turn.forEach(s=>d.step(draft.side,s));await d.end();}draft.current.forEach(s=>d.step(draft.side,s));return d;}
export async function draftStep(spec,draft,step){const d=await preview(spec,draft);check(draft.turns.length<6&&draft.current.length<24,'Draft is complete or turn has 24 steps');const decision=d.step(draft.side,step);return {draft:seal('plan-draft',{specSHA256:spec.sha256,side:draft.side,turns:draft.turns,current:[...draft.current,copy(step)]}),decision,observation:d.observe(draft.side)};}
export async function draftEnd(spec,draft){const d=await preview(spec,draft);check(draft.turns.length<6,'Draft already complete');await d.end();return {draft:seal('plan-draft',{specSHA256:spec.sha256,side:draft.side,turns:[...draft.turns,draft.current],current:[]}),observation:d.observe(draft.side)};}
export function finalizePlan(spec,draft){validateSpec(spec);verify(draft,'plan-draft');check(draft.specSHA256===spec.sha256&&['A','B'].includes(draft.side)&&draft.current.length===0,'Invalid draft binding');validateTurns(draft.turns);return seal('plan',{specSHA256:spec.sha256,side:draft.side,turns:draft.turns});}
export function validatePlan(spec,plan,side){verify(plan,'plan');check(plan.specSHA256===spec.sha256&&plan.side===side,'Plan binding/side mismatch');validateTurns(plan.turns);return plan;}
export function makeOffer(spec,planA){validateSpec(spec);validatePlan(spec,planA,'A');return seal('offer',{spec,planA});}
export function validateOffer(offer){verify(offer,'offer');validateSpec(offer.spec);validatePlan(offer.spec,offer.planA,'A');return offer;}
export function makeResponse(offer,planB,responseId=crypto.randomUUID()){validateOffer(offer);validatePlan(offer.spec,planB,'B');check(/^[a-zA-Z0-9_-]{1,80}$/.test(responseId),'Invalid responseId');return seal('response',{challengeId:offer.spec.id,offerSHA256:offer.sha256,responseId,planB});}
export async function referee(offer,response){offer=copy(offer);response=copy(response);validateOffer(offer);verify(response,'response');check(/^[a-zA-Z0-9_-]{1,80}$/.test(response.responseId),'Invalid responseId');check(response.offerSHA256===offer.sha256&&response.challengeId===offer.spec.id,'Response belongs to a different offer');validatePlan(offer.spec,response.planB,'B');const d=new Duel(offer.spec),turns=[];
 for(let t=0;t<6;t++){
  for(const s of offer.planA.turns[t])d.step('A',s);
  for(const s of response.planB.turns[t])d.step('B',s);
  await d.end();turns.push({resolvedTurn:t+1,board:d.observe('A').locations});
 }
 const e=d.g.engine;check(e.phase==='GAME_OVER','Referee did not complete');return seal('result',{engineSHA256:ENGINE_HASH,adapterSHA256:ADAPTER_HASH,runtimeSHA256:RUNTIME_HASH,challengeId:offer.spec.id,offerSHA256:offer.sha256,responseSHA256:response.sha256,responseId:response.responseId,winner:e.result.outcome==='VICTORY'?'A':e.result.outcome==='DEFEAT'?'B':'TIE',powers:{A:e.result.playerTotalPower,B:e.result.cpuTotalPower},lanesWon:{A:e.result.playerLanesWon,B:e.result.cpuLanesWon},reason:e.result.reason,audit:d.audit,turns,originalResult:e.result,fullLog:d.g.fullLog()});
}
function read(path){const stat=fs.statSync(path);check(stat.size<=2000000,'File exceeds 2 MB');return JSON.parse(fs.readFileSync(path,'utf8'));}
function writeNew(path,obj){fs.writeFileSync(path,JSON.stringify(obj,null,2)+'\n',{flag:'wx'});}
function rewriteDraft(path,obj){const tmp=path+'.tmp-'+process.pid;try{writeNew(tmp,obj);fs.renameSync(tmp,path);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}}
async function cli(args){const [cmd,...a]=args;
 if(['help','--help','-h'].includes(cmd)||!cmd)return {ok:true,usage:['spec-new SPEC.json [OPTIONS_JSON]','plan-new SPEC.json A|B DRAFT.json','plan-state SPEC.json DRAFT.json','plan-step SPEC.json DRAFT.json STEP_JSON','plan-end SPEC.json DRAFT.json','plan-final SPEC.json DRAFT.json PLAN.json','offer SPEC.json PLAN-A.json OFFER.json','offer-spec OFFER.json SPEC-COPY.json','response OFFER.json PLAN-B.json RESPONSE.json [RESPONSE_ID]','referee OFFER.json RESPONSE.json RESULT.json','verify-result OFFER.json RESPONSE.json RESULT.json'],instructions:'Read START-HERE-AGENTS.txt and README.md. No CPU plays in solo previews or referee. New artifacts never overwrite; only local drafts are mutable.'};
 if(cmd==='spec-new'){const s=createSpec(a[1]?JSON.parse(a[1]):{});writeNew(a[0],s);return {ok:true,spec:s};}
 if(cmd==='plan-new'){const spec=read(a[0]),draft=newDraft(spec,a[1]);writeNew(a[2],draft);const d=await preview(spec,draft);return {ok:true,observation:d.observe(a[1])};}
 if(['plan-state','plan-step','plan-end','plan-final'].includes(cmd)){const spec=read(a[0]),draft=read(a[1]);if(cmd==='plan-state'){const d=await preview(spec,draft);return {ok:true,observation:d.observe(draft.side)};}if(cmd==='plan-final'){await preview(spec,draft);const plan=finalizePlan(spec,draft);writeNew(a[2],plan);return {ok:true,plan};}const r=cmd==='plan-step'?await draftStep(spec,draft,JSON.parse(a[2])):await draftEnd(spec,draft);rewriteDraft(a[1],r.draft);return {ok:true,...r};}
 if(cmd==='offer'){const offer=makeOffer(read(a[0]),read(a[1]));writeNew(a[2],offer);return {ok:true,offerSHA256:offer.sha256,suggestedFilename:`TEST-OR-LIVE-OFFER-${offer.spec.id}-${offer.sha256.slice(0,12)}.json`};}
 if(cmd==='offer-spec'){const offer=validateOffer(read(a[0]));writeNew(a[1],offer.spec);return {ok:true,spec:offer.spec};}
 if(cmd==='response'){const r=makeResponse(read(a[0]),read(a[1]),a[3]);writeNew(a[2],r);return {ok:true,responseSHA256:r.sha256,suggestedFilename:`RESPONSE-${r.challengeId}-${r.responseId}-${r.sha256.slice(0,12)}.json`};}
 if(cmd==='referee'||cmd==='verify-result'){const result=await referee(read(a[0]),read(a[1]));if(cmd==='verify-result'){const old=verify(read(a[2]),'result');check(old.sha256===result.sha256,'Result does not match deterministic re-refereeing');return {ok:true,verified:true,winner:result.winner,resultSHA256:result.sha256};}writeNew(a[2],result);return {ok:true,winner:result.winner,powers:result.powers,resultSHA256:result.sha256,suggestedFilename:`RESULT-${result.challengeId}-${result.offerSHA256.slice(0,8)}-${result.responseSHA256.slice(0,8)}-${result.sha256.slice(0,12)}.json`};}
 throw Error('Unknown command; use --help');
}
if(process.argv[1]&&fs.realpathSync(process.argv[1])===pathSelf){try{console.log(JSON.stringify(await cli(process.argv.slice(2)),null,2));}catch(e){console.log(JSON.stringify({ok:false,error:e.message}));process.exitCode=1;}}
