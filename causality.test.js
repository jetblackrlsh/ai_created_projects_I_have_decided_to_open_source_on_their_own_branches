const assert=require('node:assert/strict'),C=require('./engine');
const char={name:'Tester',stats:Object.fromEntries(C.STATS.map(s=>[s,12])),powers:[]};
function game(success=true,effects=[],next='end'){return new C.Engine({id:'causal',title:'Causal',start:'start',defaultCharacter:char,scenes:{start:{title:'Start room',text:'Initial context.',enemy:{name:'Guard',hp:5,damage:100,attack:30},actions:[{id:'go',label:'Cross doorway',check:{stat:'DEX',dc:success?1:40},success:{text:'You cross.',effects,next},failure:{text:'The guard blocks you.',effects,next}}]},end:{title:'Exit',text:'You are outside.',ending:'victory'}}},null,123);}
let e=game();e.act('go');assert.equal(e.state.status,'victory');assert(!e.state.log.some(x=>x.type==='enemy'));
e=game(true,[{type:'damage',amount:5}],null);e.act('go');assert.equal(e.state.enemies.start,0);assert(!e.state.log.some(x=>x.type==='enemy'));
e=game(false);e.act('go');assert.equal(e.state.status,'defeat');assert.equal(e.state.scene,'start');assert(!e.state.log.some(x=>x.type==='scene_context'&&x.scene==='end'));
e=game(true,[{type:'next',scene:'end'}],null);e.act('go');assert.equal(e.state.scene,'end');assert(!e.state.log.some(x=>x.type==='enemy'));
const log=e.exportReadableLog();assert(log.includes('Initial context.'));assert(log.includes('You are outside.'));assert(log.includes('Cross doorway'));assert.equal((log.match(/^TURN 1$/gm)||[]).length,1);assert(log.includes('Roll: d20'));assert.equal(e.exportLog().split('\n').length,e.state.log.length);
console.log('PASS causality, defeated/escaped enemies, death blocks travel, next effects, contextual grouped export');
