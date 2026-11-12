'use strict';
const C=require('./engine'),assert=require('node:assert/strict');
const base={name:'QA',stats:{STR:12,DEX:12,CON:12,INT:12,WIS:12,CHA:12},powers:[]};
function game(powers=[], extra={}) {return new C.Engine({id:'qa',title:'QA',start:'a',defaultCharacter:{...base,powers},scenes:{a:{text:'fight',enemy:{name:'dummy',hp:100,attack:30,damage:4},actions:[{id:'wait',label:'wait',success:{text:'wait'}},{id:'talk',label:'talk',check:{stat:'CHA',dc:1,tags:['social']},success:{text:'talk'}}],...extra}}},null,10000)}
let e=game([{id:'focus',name:'focus',cost:1,effects:[{type:'check_bonus',stat:'INT',amount:1,tags:['flight']}]}]);
e.usePower('focus');assert.equal(e.getState().capabilities.includes('flight'),false);console.log('PASS matching tags cannot grant free capabilities');
e=game([{id:'bolt',name:'bolt',cost:1,stat:'STR',effects:[{type:'damage',amount:3}]}]);assert.equal(e.preview('talk','bolt').allowed,false);assert.throws(()=>e.act('talk','bolt'));assert.equal(e.state.enemies.a,100);console.log('PASS social checks cannot bypass enemy combat defense');
e=game([{id:'resist',name:'resist',cost:2,effects:[{type:'resistance',amount:3,duration:1}]}]);let h=e.state.hp;e.usePower('resist');assert.equal(h-e.state.hp,1);h=e.state.hp;e.act('wait');assert.equal(h-e.state.hp,4);console.log('PASS resistance lasts documented activation turn');
e=game([],{actions:[{id:'zero',label:'zero',success:{effects:[{type:'damage',target:'self',amount:0}]} }]});h=e.state.hp;e.act('zero');assert.equal(h-e.state.hp,4);console.log('PASS zero adventure damage preserved');
e=game([{id:'dex',name:'dex',cost:2,effects:[{type:'stat_boost',stat:'DEX',amount:4,duration:2}]}]);e.usePower('dex');assert.equal(e.state.log.filter(x=>x.type==='enemy').at(-1).dc,13);console.log('PASS DEX boost affects defense');
let save=JSON.parse(e.exportSave());save.state.hp=0;save.state.status='playing';assert.throws(()=>e.importSave(JSON.stringify(save)));save=JSON.parse(e.exportSave());save.state.shield=900;assert.throws(()=>e.importSave(JSON.stringify(save)));console.log('PASS impossible HP/status and shield saves rejected');
assert.throws(()=>game([],{actions:[{id:'bad',success:{effects:[{type:'next',scene:'missing'}]}}]}));assert.throws(()=>game([],{actions:[{id:'bad',success:{effects:[{type:'heal',amount:-10}]}}]}));console.log('PASS invalid destination and negative heal rejected');
console.log('Independent QA regression suite passed');
