import {test} from 'node:test';
import assert from 'node:assert/strict';
import {call} from './worker/index.js';
class DB{
 rows=new Map();
 prepare(sql){const db=this;return {bind(...args){return {async run(){if(sql.startsWith('INSERT')){if(!db.rows.has(args[0]))db.rows.set(args[0],{receipt_key:args[0],declaration_hash:args[1],raw_roll:null,created_at:args[2]});}else if(sql.startsWith('UPDATE')){const r=db.rows.get(args[1]);if(r&&r.raw_roll===null)r.raw_roll=args[0];}else throw Error('Unexpected SQL '+sql);return {success:true};},async first(){return db.rows.get(args[0])??null;}};}};}
}
const user='owner-a';
async function setup(){
 const env={DB:new DB()};
 const c=await call('create_campaign',{input:{campaign_id:'demo',title:'Demo',current_scene:{id:'scene1',title:'Gate'}}},env,user);
 delete c.state.rules.check_math;delete c.state.character_setup; // legacy saved-state compatibility
 const d=await call('campaign_command',{state:c.state,command:{type:'declare_check',event_id:'declare1',expected_revision:0,check:{id:'check1',scene_id:'scene1',action:'Open the gate',dc:13,modifiers:[],success:'Opened',failure:'Locked'}}},env,user);
 return {env,state:d.state};
}
test('auth required for mutations; guide can be read',async()=>{await assert.rejects(call('create_campaign',{input:{}},{},null),/identity/);assert.ok((await call('freeform_guide',{}, {}, null)).version);});
test('server receipt retries reuse draw; completed Page cannot reroll',async()=>{const {env,state}=await setup();const a={state,event_id:'roll1',expected_revision:1};const one=await call('roll_and_resolve',a,env,user),two=await call('roll_and_resolve',a,env,user);assert.equal(one.result.roll.raw,two.result.roll.raw);assert.equal(env.DB.rows.size,1);assert.ok(one.result.roll.raw>=1&&one.result.roll.raw<=20);await assert.rejects(call('roll_and_resolve',{...a,state:one.state},env,user),/No pending/);});
test('undeclared check cannot roll under another owner',async()=>{const {env,state}=await setup();await assert.rejects(call('roll_and_resolve',{state,event_id:'roll1',expected_revision:1},env,'owner-b'),/not declared/);});
test('mutated declaration rejected before drawing',async()=>{const {env,state}=await setup();state.pending_check.dc=1;await assert.rejects(call('roll_and_resolve',{state,event_id:'roll1',expected_revision:1},env,user),/declaration changed/);assert.equal([...env.DB.rows.values()][0].raw_roll,null);});
test('command cannot bypass server roll path',async()=>{const {env,state}=await setup();await assert.rejects(call('campaign_command',{state,command:{type:'resolve_check',event_id:'roll1',expected_revision:1,raw_roll:20}},env,user),/roll_and_resolve/);});
test('stale revision and missing database do not roll',async()=>{const {env,state}=await setup();await assert.rejects(call('roll_and_resolve',{state,event_id:'roll1',expected_revision:0},env,user),/Revision/);await assert.rejects(call('roll_and_resolve',{state,event_id:'roll1',expected_revision:1},{},user),/database unavailable/);assert.equal([...env.DB.rows.values()][0].raw_roll,null);});

test('invalid resolve payload rejected before any draw',async()=>{const {env,state}=await setup();await assert.rejects(call('roll_and_resolve',{state,event_id:'bad spaces',expected_revision:1},env,user),/invalid/);assert.equal([...env.DB.rows.values()][0].raw_roll,null);await assert.rejects(call('roll_and_resolve',{state,event_id:'roll1',expected_revision:1,changes:{revision:99}},env,user),/protected/);assert.equal([...env.DB.rows.values()][0].raw_roll,null);});
