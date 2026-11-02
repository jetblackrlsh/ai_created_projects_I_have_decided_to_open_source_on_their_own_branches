const fs=require('fs'),path=require('path'),assert=require('assert');
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..');
const map={};
function load(dir){
 const dom=new JSDOM(fs.readFileSync(path.join(dir,'index.html'),'utf8'),{url:'https://local.test/',runScripts:'outside-only'}),w=dom.window;
 w.scrollTo=()=>{};w.requestAnimationFrame=()=>0;w.setTimeout=()=>0;w.clearTimeout=()=>{};w.alert=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{},set:()=>true});
 let seed=123;w.Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);w.Date.now=()=>1;
 w.eval(fs.readFileSync(path.join(dir,'data.js'),'utf8'));
 let js=fs.readFileSync(path.join(dir,'app.js'),'utf8');
 const names=['QUICK_CHAPTER_CODES','state','DATA','createHeroCombatant','initBattle','startPlayerRound','playHandCard','castConvergenceUltimate','endPlayerTurn','executeVillainTurn','checkBattleOutcome','generateLevelCode','applyLevelCode','writeSave','loadSave','openPostLevelUpgradeScreen','renderUpgradeSanctuary','runCoopPartnerAI'];
 js=js.replace(/\/\/ --- Boot ---/,`window.__qa={${names.map(n=>n==='castConvergenceUltimate'&&!js.includes('function '+n+'(')?n+':castAccordUltimate':n).join(',')}};\n// --- Boot ---`);w.eval(js);
 return {dom,w,q:w.__qa};
}
function canonical(x){
 if(Array.isArray(x))return x.map(canonical);
 if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).sort().filter(k=>!['msg','name','upgradedName','desc','title','element','color','portrait','passiveName','passiveDesc','ultimateName','ultimateDesc','bg','location','season','floatingPop','logs','art','label'].includes(k)).map(k=>[canonical(k),canonical(x[k])]));
 if(typeof x==='string'){if(x==='convergence')return 'accord';if(x==='startConvergence')return 'startAccord';for(const [a,b]of Object.entries(map))if(x===a||x.startsWith(a+'_'))return b+x.slice(a.length);}
 return x;
}
function fingerprint(q){return canonical({fairies:q.DATA.fairies.map(f=>({id:f.id,maxHp:f.maxHp,deck:f.deck})),villains:q.DATA.villains.map(v=>({id:v.id,level:v.level,baseHp:v.baseHp,moves:v.moves}))});}
function run(dir){const {dom,w,q}=load(dir),s=q.state,D=q.DATA,out={fingerprint:fingerprint(q),cases:{},domains:D.fairies.map(f=>({id:f.id,element:f.element}))};
 function setup(i=0,j=0,diff='medium',coop=false){s.gameMode='versus';s.teamMode=coop?'coop':'solo';s.difficulty=diff;s.selectedFairies=[D.fairies[i].id,D.fairies[(i+1)%7].id];s.selectedVillainId=D.villains[j].id;s.versusUpgradePreset='base';s.coopAiEnabled=false;s.save={unlockedLevel:1,clearedLevels:[],upgradedCards:{}};q.initBattle();return s.battle;}
 function snap(key){out.cases[key]=canonical(s.battle);}
 for(let i=0;i<7;i++)for(let u=0;u<2;u++)for(let c=0;c<8;c++){
 const b=setup(i,0,'medium',true),h=b.heroes[0],def=D.fairies[i].deck[c];h.hp-=35;h.mana=20;h.statuses.weaken=2;h.statuses.inspire=3;b.heroes[1].hp-=30;b.selectedAllyTargetIndex=1;b.villain.shield=6;
 h.hand=[{...def,upgraded:!!u,activeStats:{...(u?def.upgraded:def.base)}}];q.playHandCard(0,0);snap(`card-${i}-${u}-${c}`);
 }
 for(let i=0;i<7;i++){
 let b=setup(i,0,'medium',true);b.heroes.forEach(h=>{h.hp-=35;h.shield=7});b[Object.hasOwn(b,'accord')?'accord':'convergence']=100;q.castConvergenceUltimate();snap(`ultimate-${i}`);
 b=setup(i);b.heroes[0].hp-=20;b.heroes[0].shield=15;b.heroes[0].statuses.regen=3;q.endPlayerTurn();snap(`endpassive-${i}`);
 b=setup(i);b.heroes[0].shield=15;q.startPlayerRound();snap(`roundpassive-${i}`);
 b=setup(i);const h=b.heroes[0],def=D.fairies[i].deck[0];h.mana=20;h.hand=Array.from({length:2},()=>({...def,activeStats:{...def.base}}));q.playHandCard(0,0);q.playHandCard(0,0);snap(`castpassive-${i}`);
 }
 for(let j=0;j<7;j++)for(const diff of ['easy','medium','hard','extreme'])for(const coop of [false,true]){
 const b=setup(0,j,diff,coop);b.heroes.forEach(h=>{h.hp=1000;h.maxHp=1000;h.shield=9;h.statuses.reflect=5});b.villain.hp=1000;b.villain.maxHp=1000;b.villain.statuses={burn:3,weaken:2,entangle:1};for(let m=0;m<4;m++){q.executeVillainTurn();snap(`boss-${j}-${diff}-${coop}-${m}`);}
 }
 for(let i=0;i<7;i++)for(const diff of ['easy','medium','hard','extreme'])for(const coop of [false,true]){
 setup(i,0,diff,coop);s.save.unlockedLevel=i+1;s.save.clearedLevels=Array.from({length:i},(_,j)=>j+1);D.fairies.forEach((f,fi)=>f.deck.forEach((c,ci)=>{if((fi+ci)%2===0)s.save.upgradedCards[c.id]=true}));
 const expected=JSON.parse(JSON.stringify(s.save.upgradedCards)),code=q.generateLevelCode();s.save.upgradedCards={};const result=q.applyLevelCode(code);assert.deepStrictEqual(JSON.parse(JSON.stringify(s.save.upgradedCards)),expected,'level-code masks');assert.equal(s.save.unlockedLevel,i+1);assert.equal(s.difficulty,diff);assert.equal(s.teamMode,coop?'coop':'solo');q.writeSave(s.save);assert.deepStrictEqual(JSON.parse(JSON.stringify(q.loadSave())),JSON.parse(JSON.stringify(s.save)),'save roundtrip');out.cases[`code-${i}-${diff}-${coop}`]=canonical({save:s.save,selected:s.selectedFairies,difficulty:s.difficulty,team:s.teamMode,result});
 }
 for(let j=0;j<7;j++)for(const mode of ['story','versus']){setup(0,j);s.gameMode=mode;s.battle.villain.hp=0;assert(q.checkBattleOutcome());out.cases[`win-${j}-${mode}`]=canonical({save:s.save,ended:s.battle.ended,queue:s.upgradeQueueFairyIds});}
 for(const entry of q.QUICK_CHAPTER_CODES){setup(0,0,'medium',true);const result=q.applyLevelCode(entry.code);assert(result.ok);out.cases[`quick-${entry.level}`]=canonical({save:s.save,selected:s.selectedFairies,boss:s.selectedVillainId});}
 for(const invalid of ['', 'garbage','<script>alert(1)</script>'])assert.equal(q.applyLevelCode(invalid).ok,false);
 for(let i=0;i<7;i++){
 setup(i);s.gameMode='story';s.upgradeQueueFairyIds=[D.fairies[i].id];q.openPostLevelUpgradeScreen();const cid=D.fairies[i].deck[2].id;w.document.querySelector(`[data-upgrade-card-id="${cid}"]`).click();assert.equal(s.save.upgradedCards[cid],true);assert.equal(q.loadSave().upgradedCards[cid],true);out.cases[`upgrade-click-${i}`]=canonical(s.save);
 }
 const midPreset='attuned';
 for(const preset of ['base','max',midPreset,'story']){setup();s.versusUpgradePreset=preset;const h=q.createHeroCombatant(D.fairies[0].id,0);out.cases[`preset-${preset===midPreset?'mid':preset}`]=h.drawPile.filter(c=>c.upgraded).length;}
 setup();s.battle.heroes[0].hp=0;assert(q.checkBattleOutcome());out.cases.loss=s.battle.ended;
 setup(0,0,'medium',true);s.coopAiEnabled=true;q.endPlayerTurn();snap('coop-ai');
 dom.window.close();return JSON.parse(JSON.stringify(out));
}
const crypto=require('crypto');
const result=run(root),expected=JSON.parse(fs.readFileSync(path.join(__dirname,'mechanics-golden.json')));
function hash(x){return crypto.createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');}
assert.equal(hash(result.fingerprint),expected.fingerprint,'card/boss numeric definitions');
assert.deepStrictEqual(result.domains,expected.domains,'elemental domains');
assert.deepStrictEqual(Object.keys(result.cases),Object.keys(expected.cases),'case coverage');
for(const [name,value]of Object.entries(result.cases))assert.equal(hash(value),expected.cases[name],name);
console.log(`PASS: ${Object.keys(result.cases).length} deterministic DOM/logic cases and complete mechanical definitions.`);
