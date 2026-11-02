/* Headless logic regression tests. Rendering, audio and browser events are
 * explicitly stubbed; these tests do not certify WebGL or interactive UI. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const input = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'src/game.js');
let source = fs.readFileSync(input, 'utf8');
if (input.endsWith('.html')) {
  const inline = [...source.matchAll(/<script\b[^>]*type=["']module["'][^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => /class \w+CRPG/.test(s));
  if (inline) source = inline;
  else { const src = source.match(/<script[^>]*type=["']module["'][^>]*src=["']([^"']+)/); assert(src, 'Game module exists'); source = fs.readFileSync(path.resolve(path.dirname(input), src[1]), 'utf8'); }
}
source = source.replace(/^import\s[\s\S]*?;\s*$/gm, '');
const className = source.match(/class (\w+CRPG)\s*\{/)[1];
const builder = source.match(/function (build\w+WorldScene)\(/)[1];
const heroBuilder = source.match(/function (createHero\w+)\(heroId\)/)[1];
class Vector { constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;} set(x,y,z){Object.assign(this,{x,y,z});return this;} copy(v){Object.assign(this,v);return this;} setScalar(v){return this.set(v,v,v);} }
class Obj { constructor(){this.position=new Vector();this.rotation=new Vector();this.scale=new Vector(1,1,1);this.repeat=new Vector();this.children=[];this.userData={};} add(x){this.children.push(x);} clear(){this.children=[];} translate(){return this;} }
const ctx = new Proxy({}, {get:(_,key)=> key==='measureText'?()=>({width:10}):()=>{}});
const elements = new Map();
const element = id => {if(!elements.has(id)) elements.set(id,{innerHTML:'',textContent:'',style:{},value:'',listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},getContext:()=>ctx,showModal(){this.open=true;},close(){this.open=false;},querySelectorAll:()=>[]});return elements.get(id);};
let rng=11235;const math=Object.create(Math);math.random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
const sandbox={console,Math:math,THREE:new Proxy({Vector3:Vector},{get:(o,k)=>o[k]||Obj}),window:{addEventListener(){}},document:{createElement:()=>element('canvas'),getElementById:element,querySelectorAll:()=>[]},setTimeout:()=>0,requestAnimationFrame:()=>0};
vm.createContext(sandbox);
vm.runInContext(source+`\n${builder}=()=>new THREE.Group(); ${heroBuilder}=()=>new THREE.Group(); createMonsterMesh=()=>new THREE.Group();createTreasureMesh=()=>new THREE.Group();
Object.getOwnPropertyNames(SoundManager.prototype).forEach(k=>{if(k!=='constructor')sound[k]=()=>{}});
globalThis.api={Game:${className},PARTY_MODES,DIFFICULTY_LEVELS,HERO_DEFINITIONS,WIN_CONDITION_OPTIONS,createWinCondition,generateRandomDungeonLayout,generateStarterWorldLayout,world:()=>activeWorld,getTileInfo};`,sandbox,{timeout:10000});
const a=sandbox.api;
function game() { const g=Object.create(a.Game.prototype); Object.assign(g,{scene:new Obj(),worldGroup:null,treasuresGroup:new Obj(),heroesGroup:new Obj(),monstersGroup:new Obj(),vfxGroup:new Obj(),rangeTilesGroup:new Obj(),pathTilesGroup:new Obj(),difficultyKey:'medium',partyModeKey:'both',mapMode:'random',winConditionOption:'5_collect_all_treasure',addLog(){},updateHUD(){},syncSetupControlsUI(){},rebuildRangeOverlay(){},showEndGameModal(v){this.result=v;}});g.resetGame({regenerateMap:true});return g; }
const randomBefore=math.random;
const starterA=JSON.stringify(a.generateStarterWorldLayout());
assert.equal(a.world().mode,'starter');assert.equal(math.random,randomBefore);
assert.equal(JSON.stringify(a.generateStarterWorldLayout()),starterA);assert.equal(math.random,randomBefore);
let checks=0;
for(let n=0;n<100;n++) {
 const w=a.generateRandomDungeonLayout(); assert.equal(w.grid.length,32);w.grid.forEach(row=>assert.equal(row.length,32));
 for(const e of [...w.heroSpawns,...w.monsters,...w.extraHardMonsters,...w.treasures]) {assert(Number.isInteger(e.x)&&Number.isInteger(e.z));assert(e.x>=0&&e.x<32&&e.z>=0&&e.z<32);}
 assert(w.monsters.some(m=>m.kind==='frog'));assert(w.monsters.some(m=>m.kind==='mole'));
 for(const category of ['ruby','gold','flower']) assert(w.treasures.some(t=>t.category===category));
 const monsters=w.monsters.map(m=>({...m,alive:true})),treasures=w.treasures.map(t=>({...t,collected:false}));
 for(const option of a.WIN_CONDITION_OPTIONS) {const goal=a.createWinCondition(option.id,monsters,treasures);const before=goal.evaluate(monsters,treasures);assert.equal(before.complete,false);assert.equal(before.pct,0);const after=goal.evaluate(monsters.map(m=>({...m,alive:false})),treasures.map(t=>({...t,collected:true})));assert.equal(after.complete,true);assert.equal(after.pct,100);checks++;}
}
const g=game();
for(let repeat=0;repeat<3;repeat++)for(const party of Object.keys(a.PARTY_MODES))for(const difficulty of Object.keys(a.DIFFICULTY_LEVELS)) {
 g.partyModeKey=party;g.difficultyKey=difficulty;g.resetGame({regenerateMap:true});
 assert.equal(g.heroes.length,a.PARTY_MODES[party].heroes.length);assert.equal(g.round,1);assert.equal(g.turnPhase,'HEROES');assert.equal(g.busy,false);assert.equal(g.score,0);
 for(const h of g.heroes){const original=a.HERO_DEFINITIONS.find(d=>d.id===h.id);assert.equal(h.maxHp,original.maxHp+g.difficulty.heroBonusHp+g.partyMode.soloBonusHp);assert.equal(h.maxAp,original.maxAp+g.difficulty.heroBonusAp+g.partyMode.soloBonusAp);assert.equal(h.hp,h.maxHp);assert.equal(h.ap,h.maxAp);assert(h.alive);}
 assert.equal(g.monsters.length,a.world().monsters.length+(g.difficulty.extraMonsters?a.world().extraHardMonsters.length:0));
 const first=g.activeHero;const reach=g.computeReachableTiles(first);assert(reach.visited.size>1);
 for(const [key,distance] of reach.visited){const[x,z]=key.split(',').map(Number);assert(x>=0&&x<32&&z>=0&&z<32);assert(distance<=first.moveRange+0.1);if(x!==first.x||z!==first.z){assert(!g.isTileOccupied(x,z,first.id));const p=g.reconstructPath(reach.parent,first.x,first.z,x,z);assert(p.length>0);assert.equal(p.at(-1).x,x);assert.equal(p.at(-1).z,z);}}
 if(g.heroes.length===2){g.selectHero(1,false);assert.equal(g.selectedHeroIndex,1);g.selectHero(0,false);assert.equal(g.selectedHeroIndex,0);}
 g.selectHero(99,false);assert.equal(g.selectedHeroIndex,0);g.selectedAbilityId='invalid';g.selectHero(0,false);assert.equal(g.selectedAbilityId,'move');
 assert.equal(g.checkVictoryOrDefeat(),false);g.treasures.forEach(t=>t.collected=true);assert.equal(g.checkVictoryOrDefeat(),true);assert.equal(g.result,true);assert.equal(g.turnPhase,'GAMEOVER');assert.equal(g.checkVictoryOrDefeat(),true);
 g.resetGame();assert.equal(g.turnPhase,'HEROES');assert(g.treasures.every(t=>!t.collected));assert(g.monsters.every(m=>m.alive&&m.hp===m.maxHp));g.heroes.forEach(h=>h.alive=false);assert.equal(g.checkVictoryOrDefeat(),true);assert.equal(g.result,false);g.resetGame();assert(g.heroes.every(h=>h.alive));checks++;
}
// Invoke actual configuration button/select handlers against a minimal DOM mock.
g.canvas=element('game-canvas');g._bindEvents();
const fire=(id,type,value)=>{const el=element(id);assert(el.listeners[type],id+' handler exists');el.listeners[type]({target:{value},currentTarget:el});};
for(const party of Object.keys(a.PARTY_MODES)){fire('select-party','change',party);assert.equal(g.partyModeKey,party);assert.equal(g.heroes.length,a.PARTY_MODES[party].heroes.length);}
for(const diff of Object.keys(a.DIFFICULTY_LEVELS)){fire('select-difficulty','change',diff);assert.equal(g.difficultyKey,diff);assert.equal(g.round,1);}
for(const goal of a.WIN_CONDITION_OPTIONS){fire('select-win-condition','change',goal.id);assert(g.activeWinCondition);assert.equal(g.turnPhase,'HEROES');}
fire('btn-random-dungeon','click');assert.equal(g.mapMode,'random');
fire('btn-starter-world','click');assert.equal(g.mapMode,'starter');assert.equal(JSON.stringify(a.world()),starterA);
fire('btn-restart-random','click');assert.equal(g.mapMode,'random');assert.equal(g.round,1);
fire('btn-restart','click');assert.equal(g.round,1);assert.equal(g.turnPhase,'HEROES');
g.partyModeKey='both';g.winConditionOption='5_collect_all_treasure';g.resetGame();
g.heroes[0].ap=0;g.checkAutoEndTurn();assert.equal(g.selectedHeroIndex,1);
g.monsters.forEach(m=>m.alive=false);g.heroes.forEach(h=>{h.ap=0;h.shieldBonus=2;});
g.endHeroesTurn();assert.equal(g.round,2);assert.equal(g.busy,false);assert.equal(g.turnPhase,'HEROES');assert(g.heroes.every(h=>h.ap===h.maxAp&&h.shieldBonus===0));
console.log(`PASS: 100 seeded generated maps, 1100 goal evaluations, ${checks-1100} party/difficulty/reset/victory/defeat/path cases. Starter repeatability and configuration handlers also pass. Rendering/audio/DOM event delivery are stubbed, not browser-certified.`);
