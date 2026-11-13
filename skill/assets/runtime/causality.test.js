const assert=require('node:assert/strict'),C=require('./engine');
const char={name:'Tester',stats:Object.fromEntries(C.STATS.map(s=>[s,12])),powers:[]};
function game(success=true,effects=[],next='end'){return new C.Engine({id:'causal',title:'Causal',start:'start',defaultCharacter:char,scenes:{start:{title:'Start room',text:'Initial context.',enemy:{name:'Guard',hp:5,damage:100,attack:30},actions:[{id:'go',label:'Cross doorway',check:{stat:'DEX',dc:success?1:40},success:{text:'You cross.',effects,next},failure:{text:'The guard blocks you.',effects,next}}]},end:{title:'Exit',text:'You are outside.',ending:'victory'}}},null,123);}
let e=game();e.act('go');assert.equal(e.state.status,'victory');assert(!e.state.log.some(x=>x.type==='enemy'));
e=game(true,[{type:'damage',amount:5}],null);e.act('go');assert.equal(e.state.enemies.start,0);assert(!e.state.log.some(x=>x.type==='enemy'));
e=game(false);e.act('go');assert.equal(e.state.status,'defeat');assert.equal(e.state.scene,'start');assert(!e.state.log.some(x=>x.type==='scene_context'&&x.scene==='end'));
e=game(true,[{type:'next',scene:'end'}],null);e.act('go');assert.equal(e.state.scene,'end');assert(!e.state.log.some(x=>x.type==='enemy'));
const log=e.exportReadableLog();assert(log.includes('Initial context.'));assert(log.includes('You are outside.'));assert(log.includes('Cross doorway'));assert.equal((log.match(/^TURN 1$/gm)||[]).length,1);assert(log.includes('Roll: d20'));assert.equal(e.exportLog().split('\n').length,e.state.log.length);
console.log('PASS causality, defeated/escaped enemies, death blocks travel, next effects, contextual grouped export');

const boosted={...char,powers:[{id:'focus',name:'Focus',cost:2,cooldown:0,effects:[{type:'check_bonus',amount:3,duration:3,stat:'INT'}]}]};
const world={id:'refresh',title:'Refresh',start:'room',defaultCharacter:boosted,scenes:{room:{text:'A quiet workshop.',actions:[{id:'think',label:'Think',check:{stat:'INT',dc:12},success:{text:'Solved.'},failure:{text:'Still unclear.'}},{id:'lift',label:'Lift',check:{stat:'STR',dc:12},success:{},failure:{}}]}}};
const refresh=new C.Engine(world);refresh.usePower('focus');assert.equal(refresh.preview('think','focus').check.powerBonus,3);assert.equal(refresh.preview('lift','focus').check.powerBonus,0);refresh.act('think','focus');assert.equal(refresh.preview('think').check.powerBonus,3);console.log('PASS same-power reactivation refreshes without duplicate bonus and respects ability restriction');
