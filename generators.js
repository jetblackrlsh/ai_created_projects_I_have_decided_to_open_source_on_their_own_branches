/* Seeded bounded procedural content. Pure data, no AI calls or rules extensions. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine'),require('./character-builder'));else root.CRPG_GENERATORS=factory(root.CRPG,root.CRPG_BUILDER);})(typeof globalThis!=='undefined'?globalThis:this,function(C,B){
'use strict';
const VERSION=2,copy=x=>JSON.parse(JSON.stringify(x));
function rng(seed){if(!Number.isInteger(seed)||seed<1||seed>4294967295)throw Error('Seed must be an integer from 1 to 4294967295');let x=seed;return n=>{x^=x<<13;x^=x>>>17;x^=x<<5;x>>>=0;return Math.floor(x/4294967296*n)}}
const themes={
fantasy:{places:['a ruined citadel','an enchanted forest','a flooded monastery','a mountain pass'],objects:['a sealed relic','a living seed','an old treaty'],foes:['a ruthless noble’s soldiers','a secretive cult','a mercenary company'],power:['Rune','Spirit','Thorn','Moon']},
science_fiction:{places:['a damaged orbital station','an abandoned colony','an icebound research outpost','a stranded freighter'],objects:['a navigation core','a colony beacon','a memory archive'],foes:['a rogue security unit','a scavenger fleet','a corporate occupation force'],power:['Quantum','Plasma','Nanite','Gravity']},
superhero:{places:['a crowded harbor','an elevated transit hub','a hidden laboratory','a failing power station'],objects:['an antidote','a containment key','a stolen prototype'],foes:['a masked criminal crew','a corrupt private militia','a power-stealing syndicate'],power:['Solar','Echo','Prism','Pulse']},
weird_west:{places:['a deserted frontier town','an abandoned copper mine','a stormbound railway junction','a haunted cattle trail'],objects:['a rain engine','a spirit ledger','a railway seal'],foes:['a ruthless landowner’s posse','a band of revenant riders','a corrupt sheriff’s deputies'],power:['Dust','Ghost','Thunder','Copper']},
cyberpunk:{places:['an undercity market','a corporate server vault','a crowded megablock','a quarantined transit station'],objects:['a stolen access key','a witness archive','a neural stabilizer'],foes:['a corporate retrieval team','an augmented street gang','a surveillance contractor'],power:['Signal','Chrome','Neural','Static']},
horror:{places:['an isolated hospital','a decaying coastal village','a shuttered boarding school','a mansion beneath the marsh'],objects:['a forbidden record','a warding charm','a missing patient’s notebook'],foes:['a devoted circle of occultists','a possessed search party','a silent congregation'],power:['Spectral','Blood','Dream','Veil']},
post_apocalyptic:{places:['a poisoned reservoir','a fortified scrap settlement','a buried transport tunnel','an abandoned seed bank'],objects:['a water purifier','a seed cache','a working radio'],foes:['a raider band','a ration-hoarding militia','a salvage cartel'],power:['Rust','Spore','Storm','Scrap']},
noir:{places:['a rain-soaked dock district','a locked municipal archive','a deserted hotel','an underground freight depot'],objects:['a hidden ledger','a witness statement','a missing case file'],foes:['a corrupt official’s enforcers','a smuggling ring','a blackmail network'],power:['Shadow','Instinct','Whisper','Smoke']}};
const missions=[
{id:'recovery',name:'Recovery',goal:'Recover',premise:'Someone has seized the only thing that can secure the community’s future.',final:'Get it back before it is moved beyond reach.',label:'Recover the objective intact',success:'The objective is recovered intact and returned to the people who need it.',mixed:'You save the people in immediate danger, but the objective is lost.',stat:'DEX'},
{id:'investigation',name:'Investigation',goal:'Uncover the truth behind',premise:'Disappearing witnesses and conflicting accounts hide an organized crime.',final:'Secure the proof before the witnesses and records disappear.',label:'Assemble and preserve the decisive evidence',success:'The evidence survives, the truth becomes public, and the people responsible can no longer hide.',mixed:'You protect the remaining witnesses, but the decisive proof is lost. The case remains open.',stat:'INT'},
{id:'escort',name:'Escort',goal:'Secure safe passage for the people carrying',premise:'A vulnerable group cannot reach safety without an escort and the resources you seek.',final:'Open the final route and bring everyone through.',label:'Guide the group through the last obstacle',success:'The group and its essential cargo reach safety together.',mixed:'The people reach shelter, but supplies and the planned route are lost. Their next journey will be harder.',stat:'WIS'},
{id:'sabotage',name:'Sabotage',goal:'Disable the threat connected to',premise:'A hostile operation will soon become unstoppable unless its support system is disabled.',final:'Break the operation without trapping the people nearby.',label:'Disable the hostile operation at its source',success:'The operation is shut down, its captives are freed, and its operators cannot restart it.',mixed:'You free the people nearby, but the operation survives. Its operators know someone is resisting them.',stat:'INT'},
{id:'reconciliation',name:'Reconciliation',goal:'Resolve the dispute over',premise:'Two communities are on the edge of conflict while a third party profits from their fear.',final:'Bring the sides to an agreement before confrontation begins.',label:'Broker a lasting agreement',success:'The communities accept an agreement and reject those who profited from their conflict.',mixed:'You arrange a temporary truce and get the vulnerable to safety, but the underlying dispute remains.',stat:'CHA'},
{id:'containment',name:'Containment',goal:'Contain the danger surrounding',premise:'An unstable phenomenon is spreading, and someone is exploiting it instead of helping.',final:'Stabilize the source before the danger reaches the surrounding community.',label:'Stabilize and contain the source',success:'The source is contained and the surrounding community can return safely.',mixed:'The immediate area is evacuated, but the source remains dangerous and must be sealed away.',stat:'CON'}];

missions.push(
{id:'evacuation',name:'Evacuation',goal:'Coordinate an evacuation using',premise:'A whole district must leave before an approaching disaster cuts every exit.',final:'Move the remaining groups through the last safe corridor before it closes.',label:'Coordinate the final mass departure',success:'The district is evacuated before the routes close. Families reunite at the refuge.',mixed:'The groups nearest your route reach refuge, but isolated districts remain cut off and need another rescue effort.',stat:'WIS'},
{id:'rescue',name:'Rescue',goal:'Locate the missing people connected to',premise:'Missing people are trapped beyond help, and only a narrow opportunity remains to reach them.',final:'Reach the trapped people and bring them back alive.',label:'Complete the extraction',success:'The trapped people return alive, and the cause of their disappearance is exposed.',mixed:'You extract the people you can reach, but others remain missing. Their location is recorded for another attempt.',stat:'STR'},
{id:'defense',name:'Defense',goal:'Protect the settlement relying on',premise:'A settlement cannot retreat. Its defenses and essential supplies must hold until help arrives.',final:'Hold the final defensive line long enough for relief to arrive.',label:'Hold the line',success:'The defensive line holds until relief arrives. The settlement and its essential services survive.',mixed:'The inhabitants reach a fallback position, but their defenses and supplies are lost.',stat:'CON'},
{id:'exploration',name:'Exploration',goal:'Chart the unknown region around',premise:'An unknown region could offer a new home or a deadly trap. A returning expedition must bring trustworthy knowledge.',final:'Verify the discovery and establish a safe return route.',label:'Verify and chart the discovery',success:'You return with a verified discovery and a mapped route that others can use safely.',mixed:'You return alive with incomplete observations, but cannot yet recommend a safe route for others.',stat:'INT'});
// Three authored objective variations per mission. Text AND stat/capability checks,
// pressure profile, resource consequences and preparation rewards change.
const variants={
recovery:[
 ['fragile','A fragile object is breaking inside its damaged container.','Repair the container before moving it','INT','repair','fatigue'],
 ['auction','The stolen object will be sold before the next departure.','Win the broker’s cooperation before the sale','CHA','persuasion','race'],
 ['buried','The objective is buried beneath unstable debris.','Brace the excavation and recover it carefully','STR','telekinesis','wounds']],
investigation:[
 ['witness','A frightened witness will speak only from a safe hiding place.','Earn the witness’s trust and record the account','CHA','empathy','doubt'],
 ['ledger','Contradictory records conceal the flow of stolen supplies.','Reconstruct the missing entries','INT','analysis','fatigue'],
 ['trail','The only surviving evidence is exposed to the weather.','Preserve and follow the physical traces','WIS','tracking','race']],
escort:[
 ['injured','Members of the group cannot walk without support.','Construct stretchers and arrange a safe crossing','STR','creation','wounds'],
 ['hidden','The travelers must remain unrecognized to avoid pursuit.','Disguise the group and arrange quiet passage','DEX','disguise','doubt'],
 ['cargo','The group’s essential cargo is failing along the route.','Repair the load and redistribute its weight','INT','repair','fatigue']],
sabotage:[
 ['occupied','Workers are still inside the hostile facility.','Separate the occupied areas from the target system','WIS','danger_sense','race'],
 ['network','Several relays protect the hostile operation from a single failure.','Trace and isolate the controlling relay','INT','hacking','fatigue'],
 ['covert','An alarm would allow the operators to move the target.','Reach the control point without being identified','DEX','invisibility','doubt']],
reconciliation:[
 ['exchange','Both sides demand the return of their detained companions.','Verify identities and arrange a safe exchange','CHA','mind_reading','doubt'],
 ['water','An essential resource is being divided unfairly.','Measure the shortage and propose a workable allocation','INT','analysis','fatigue'],
 ['ceasefire','Fighters are already taking positions around civilians.','Carry a ceasefire proposal across the active lines','CON','shielding','race']],
containment:[
 ['outbreak','A spreading illness has overwhelmed the local responders.','Identify a clean route and separate exposed supplies','WIS','healing','fatigue'],
 ['breach','A damaged boundary is allowing the hazard to spread.','Stabilize the boundary and close the breach','INT','element_control','wounds'],
 ['fire','A fast-moving fire is approaching occupied buildings.','Cut a firebreak before the wind changes','STR','creation','race']],
evacuation:[
 ['flood','Rising water has separated the district into isolated groups.','Build a crossing and mark the high-ground route','STR','swimming','wounds'],
 ['siege','An encircling force is closing the last civilian exit.','Negotiate a protected corridor for the departing groups','CHA','persuasion','race'],
 ['toxic','An invisible airborne hazard is drifting across the exits.','Locate and mark the uncontaminated corridors','WIS','danger_sense','fatigue']],
rescue:[
 ['hostages','Captors are moving prisoners between guarded rooms.','Identify the transfer route and reach the prisoners','DEX','invisibility','doubt'],
 ['collapse','Trapped people can be heard beneath a damaged structure.','Support the load and open an extraction tunnel','STR','burrowing','wounds'],
 ['stranded','Survivors are isolated beyond a broken route.','Establish a lifeline across the gap','DEX','flight','race']],
defense:[
 ['bridge','A narrow crossing is the settlement’s only defensive advantage.','Reinforce the crossing without blocking friendly relief','STR','creation','wounds'],
 ['supplies','The defense cannot hold with its current supply failures.','Repair the distribution system and ration the reserve','INT','repair','fatigue'],
 ['shelter','Residents are panicking and abandoning a defensible shelter.','Organize the residents into a coordinated defense','CHA','empathy','doubt']],
exploration:[
 ['map','Existing maps contradict the terrain at every junction.','Survey the landmarks and establish a dependable route','WIS','remote_sight','fatigue'],
 ['ruins','The discovery lies inside a structure that is coming apart.','Recover a record before the structure collapses','DEX','teleportation','race'],
 ['contact','The region is inhabited by people whose intentions are unknown.','Establish communication without violating their boundaries','CHA','translation','doubt']]
};
const profiles={
 race:{deadline:6,dc:14,failure:[{type:'damage',target:'self',amount:2}],reward:[{type:'shield',amount:3}],failureText:'The opening closes before you can finish. You escape a dangerous rush without completing the preparation.'},
 fatigue:{deadline:9,dc:12,failure:[{type:'resource',amount:-4}],reward:[{type:'restore_energy',amount:3}],failureText:'The attempt consumes your reserve energy without resolving the problem.'},
 wounds:{deadline:10,dc:13,failure:[{type:'damage',target:'self',amount:5}],reward:[{type:'heal',amount:4}],failureText:'The unstable environment injures you before the preparation is complete.'},
 doubt:{deadline:8,dc:13,failure:[{type:'condition',condition:'distracted'}],reward:[{type:'cleanse'}],failureText:'Conflicting signals leave you distracted. A later rest or cleansing power can help, but this opportunity has passed.'}
};
const recipes=[
 ['Surge',r=>[{type:'stat_boost',stat:C.STATS[r(6)],amount:1+r(4),duration:1+r(3)}]],
 ['Weaken',r=>[{type:'stat_debuff',stat:C.STATS[r(6)],amount:1+r(4),duration:1+r(3)}]],
 ['Release',r=>[{type:'remove_condition',condition:C.CONDITIONS[r(C.CONDITIONS.length)]}]],
 ['Armor',r=>[{type:'resistance',amount:1+r(3),duration:1+r(3)}]],
 ['Adapt',r=>[{type:'grant_tag',tags:[C.CAPABILITIES[r(C.CAPABILITIES.length)]],duration:1+r(3)}]],
 ['Focus',r=>[{type:'check_bonus',stat:C.STATS[r(6)],amount:2,duration:2}]],
 ['Recovery',r=>[{type:'heal',amount:3+r(4)}]],
 ['Ward',r=>[{type:'shield',amount:4+r(4)}]],
 ['Strike',r=>[{type:'damage',amount:3+r(4)}]],
 ['Passage',r=>[{type:'grant_tag',tags:[['flight','teleportation','climbing','swimming'][r(4)]],duration:2}]],
 ['Insight',r=>[{type:'grant_tag',tags:[['analysis','mind_reading','tracking','danger_sense'][r(4)]],duration:2}]],
 ['Veil',r=>[{type:'grant_tag',tags:[['invisibility','disguise','illusion'][r(3)]],duration:2}]],
 ['Form',r=>[{type:'transform',stat:C.STATS[r(6)],amount:2,tags:[['strength','shapeshift','super_speed'][r(3)]],duration:2}]],
 ['Companion',r=>[{type:'summon',amount:2,stat:C.STATS[r(6)],duration:2}]],
 ['Dampener',r=>[{type:'check_penalty',amount:2,duration:2}]],
 ['Control',r=>[{type:'inflict_condition',condition:['restrained','exposed','distracted'][r(3)],duration:2}]],
 ['Siphon',r=>[{type:'drain',amount:3+r(3)}]],
 ['Resolve',r=>[{type:'cleanse'}]],
 ['Craft',r=>[{type:'grant_tag',tags:[['creation','repair','hacking','telekinesis'][r(4)]],duration:2}]]];
function themeFor(r,name){if(name!==undefined&&!themes[name])throw Error('Unknown genre');return name||Object.keys(themes)[r(Object.keys(themes).length)]}
function curatedCharacter(seed,options={}){const r=rng(seed),genre=themeFor(r,options.genre),theme=themes[genre];const scores=[8,10,12,13,14,15];for(let i=5;i>0;i--){const j=r(i+1);[scores[i],scores[j]]=[scores[j],scores[i]]}for(let i=0;i<6;i++){let choices=scores.map((n,i)=>n<18?i:-1).filter(i=>i>=0);scores[choices[r(choices.length)]]++}const stats=Object.fromEntries(C.STATS.map((s,i)=>[s,scores[i]]));const pool=recipes.slice(),powers=[];for(let i=0,n=3+r(3);i<n;i++){const [label,make]=pool.splice(r(pool.length),1)[0],effects=make(r);if(r(3)===0)effects.push({type:'resistance',amount:1,duration:1});let p={id:'generated_power_'+i,name:theme.power[r(theme.power.length)]+' '+label,cost:3,cooldown:r(3),stat:C.STATS[r(6)],effects};let weight=0;for(const e of effects){const amount=e.amount||1;weight+=['damage','heal','shield','drain'].includes(e.type)?Math.ceil(amount/3):amount;weight+=Math.max(0,(e.duration||1)-1);if(['grant_tag','transform'].includes(e.type))weight+=Math.max(0,(e.tags||[]).length-1)}p.cost=Math.max(1,Math.ceil(weight/3))+r(2);
 p.description='A bounded '+genre.replaceAll('_',' ')+' technique. Its listed effects, costs and durations define what it does.';if(C.validatePower(p).length)throw Error('Generator produced invalid power');powers.push(p)}const c={name:'The '+['patient','restless','watchful','scarred','quiet','fearless','resourceful','wandering'][r(8)]+' '+['scout','investigator','guardian','outcast','courier','healer'][r(6)],description:'A '+genre.replaceAll('_',' ')+' wanderer, generated from seed '+seed+'.',stats,powers,generation:{version:VERSION,seed,genre}};if(C.validateCharacter(c).length)throw Error('Generator produced invalid character');return c}
// Broad sampling spans the supported bounded numeric schema, not arbitrary text.
function generateCharacter(seed,options={}){
 if(!Number.isInteger(seed)||seed<1||seed>4294967295)throw Error('Seed must be an integer 1–4294967295');
 if(options.characterMode===undefined||options.characterMode==='builder'){if(options.genre!==undefined&&!themes[options.genre])throw Error('Unknown genre');const result=B.autopilot(seed,{tags:options.tags});result.character.generation={version:VERSION,seed,characterMode:'builder'};return result.character;}
 if(options.characterMode==='curated')return curatedCharacter(seed,options);
 if(options.characterMode!==undefined&&options.characterMode!=='broad')throw Error('Unknown character generation mode');
 const r=rng(seed),genre=themeFor(r,options.genre),stats={},powers=[];let remaining=78;
 for(let i=0;i<C.STATS.length;i++){const maximum=Math.min(18,remaining-6*(5-i));const score=6+r(maximum-5);stats[C.STATS[i]]=score;remaining-=score;}
 const types=C.EFFECT_TYPES.filter(t=>t!=='restore_energy');
 for(let i=0,n=r(9);i<n;i++){
  let p;
  for(let attempt=0;attempt<200;attempt++){
   const effects=[];
   for(let j=0,n=1+r(5);j<n;j++){
    const type=types[r(types.length)],cap=['check_bonus','check_penalty','stat_boost','stat_debuff','resistance','summon','transform'].includes(type)?4:12;
    const e={type,amount:1+r(cap),duration:1+r(10)};
    if(['stat_boost','stat_debuff','transform'].includes(type)||r(2)===0)e.stat=C.STATS[r(6)];
    if(['inflict_condition','remove_condition'].includes(type))e.condition=(type==='inflict_condition'?C.CONDITIONS.filter(c=>c!=='silenced'):C.CONDITIONS)[r(type==='inflict_condition'?4:5)];
    if(['grant_tag','transform'].includes(type)){
     let pool=C.CAPABILITIES.slice();e.tags=[];for(let k=0,n=1+r(4);k<n;k++)e.tags.push(pool.splice(r(pool.length),1)[0]);
    }else if(['check_bonus','check_penalty','summon','resistance','damage'].includes(type)&&r(2)===0){let tags=['attack','social','investigation','movement','stealth','preparation','exploration','physical',...C.CAPABILITIES];e.tags=[];for(let k=0,n=1+r(4);k<n;k++)e.tags.push(tags.splice(r(tags.length),1)[0]);}
    effects.push(e);
   }
   p={id:'generated_power_'+i,name:'Technique '+(i+1),description:'A rules-generated technique. Use its listed effects, costs, duration and limits; its name grants no additional abilities.',cost:1+r(12),cooldown:r(11),effects};if(r(2)===0)p.stat=C.STATS[r(6)];
   if(!C.validatePower(p).length)break;p=null;
  }
  // Bounded rejection sampling avoids hangs without changing valid manual rules.
  if(!p)p={id:'generated_power_'+i,name:'Focus '+(i+1),cost:1,cooldown:0,effects:[{type:'check_bonus',amount:1,duration:1}]};powers.push(p);
 }
 const c={name:'The '+['curious','cautious','bold','patient','restless','quiet','watchful','wandering'][r(8)]+' '+['traveler','investigator','guardian','outcast','courier','survivor'][r(6)],description:'A '+genre.replaceAll('_',' ')+' character sampled broadly from the supported rules. Review the build before play; strength and synergy are not guaranteed.',stats,powers,generation:{version:VERSION,seed,genre,characterMode:'broad'}};
 if(C.validateCharacter(c).length)throw Error('Broad generator produced invalid character');return c;
}
const obstacles=[{name:'The broken crossing',text:'A broken passage divides the route. People trapped beyond it need a way out.',stat:'DEX',tag:'movement',caps:['flight','teleportation','climbing'],method:'Climb across and secure a rope'}, {name:'The sealed archive',text:'A sealed archive holds the route forward, but its damaged lock is failing.',stat:'INT',tag:'investigation',caps:['hacking','analysis','repair','creation'],method:'Reconstruct the lock sequence'}, {name:'The suspicious sentries',text:'Sentries have orders to admit nobody. Their fear is making the crowd restless.',stat:'CHA',tag:'social',caps:['disguise','mind_reading','persuasion','illusion'],method:'Negotiate passage and safe conduct'}, {name:'The unstable chamber',text:'A chamber is collapsing around supplies the settlement needs.',stat:'STR',tag:'rescue',caps:['strength','telekinesis','creation','shapeshift'],method:'Brace the supports and carry supplies out'}, {name:'The hidden trail',text:'False tracks lead toward a dangerous ambush. There is still a narrow safe route.',stat:'WIS',tag:'investigation',caps:['tracking','danger_sense','analysis'],method:'Read the tracks and mark a safe trail'}, {name:'The toxic corridor',text:'A leaking corridor threatens to cut off the last exit.',stat:'CON',tag:'survival',caps:['teleportation','intangibility','repair'],method:'Seal the leaks by hand'}];
function generateAdventure(seed,options={}){const r=rng(seed),genre=themeFor(r,options.genre),t=themes[genre],stages=options.stages===undefined?4+r(3):options.stages;if(!Number.isInteger(stages)||stages<3||stages>8)throw Error('Stages must be 3–8');const mission=options.mission===undefined?missions[r(missions.length)]:missions.find(m=>m.id===options.mission);if(!mission)throw Error('Unknown mission type');const choices=variants[mission.id],variant=options.variant===undefined?choices[r(choices.length)]:choices.find(v=>v[0]===options.variant);if(!variant)throw Error('Unknown variant for mission');const profile=profiles[variant[5]];const place=t.places[r(t.places.length)],object=t.objects[r(t.objects.length)],foe=t.foes[r(t.foes.length)];const a={id:'generated_v2_'+seed+'_'+genre+'_'+stages+'_'+mission.id+'_'+variant[0],version:2,title:mission.name+' at '+place,description:`${mission.premise} ${variant[1]} Your objective: ${mission.goal.toLowerCase()} ${object} at ${place}. Opposing you is ${foe}.`,generation:{version:VERSION,seed,genre,stages,mission:mission.id,variant:variant[0]},start:'fork0',turnLimit:stages*profile.deadline+8,deadlineText:'The mission window has closed. The opposition gains control before you can finish.',defaultCharacter:generateCharacter((seed^0x85ebca6b)>>>0||1,{genre,characterMode:options.characterMode}),scenes:{}};
for(let i=0;i<stages;i++){const next=i===stages-1?'final':'fork'+(i+1),ob=obstacles[r(obstacles.length)],dc=10+r(5);a.scenes['fork'+i]={title:'Route '+(i+1)+' · '+place,text:`As you pursue your objective involving ${object}, choose how to pass the outer line held by ${foe}. The direct route risks a confrontation; the side route has its own hazards.`,rest:i===Math.floor(stages/2),actions:[{id:'side',label:'Take the side route',success:{next:'side'+i,text:'You reach '+ob.name.toLowerCase()+'.'}},{id:'direct',label:'Confront the patrol',success:{next:'guard'+i,text:'A patrol blocks your path.'}}]};a.scenes['side'+i]={title:ob.name,text:ob.text,actions:[{id:'solve',label:ob.method,check:{stat:ob.stat,dc,tags:[ob.tag],capabilityBonus:Object.fromEntries(ob.caps.map(x=>[x,3]))},success:{next,text:'Your work saves people and earns their trust.',effects:[{type:'flag',key:'rescued_'+i,value:true}]},failure:{next,text:'You get through, but the delay and debris take their toll.',effects:[{type:'damage',target:'self',amount:3}]}},{id:'detour',label:'Take the long, exposed detour',success:{next,text:'You avoid the obstacle but suffer the harsh route.',effects:[{type:'damage',target:'self',amount:4}]}}]};a.scenes['guard'+i]={title:'Patrol of '+foe,text:`A patrol carries orders that could expose the plans of ${foe}. Fighting is not your only way through.`,enemy:{name:['Scout','Enforcer','Warden'][r(3)],hp:6+r(5),damage:2+r(2),attack:1+r(3),defense:11+r(3)},actions:[{id:'strike',label:'Fight through the patrol',check:{stat:'STR',dc:11+r(3),tags:['attack']},success:{next,text:'You break through with a captured set of orders.',effects:[{type:'flag',key:'evidence',value:true}]},failure:{next,text:'The patrol drives you off; you escape injured.',effects:[{type:'damage',target:'self',amount:4}]}},{id:'reason',label:'Persuade the patrol to stand down',check:{stat:'CHA',dc:dc,tags:['social'],capabilityBonus:{mind_reading:3,empathy:3,persuasion:3}},success:{next,text:'A wavering guard hands over the orders.',effects:[{type:'flag',key:'evidence',value:true}]},failure:{next,text:'The guards refuse. You flee through a dangerous gap.',effects:[{type:'damage',target:'self',amount:3}]}},{id:'sneak',label:'Slip past the patrol',check:{stat:'DEX',dc,tags:['stealth'],capabilityBonus:{invisibility:3,illusion:3,disguise:3}},success:{next,text:'You slip through unseen.'},failure:{next,text:'You escape pursuit, bruised but alive.',effects:[{type:'damage',target:'self',amount:3}]}}]};}
a.scenes.side0={title:'Preparation: '+variant[0],text:variant[1]+' Resolve this now to unlock a safer way to complete the main objective.',actions:[
{id:'prepare',label:variant[2],check:{stat:variant[3],dc:profile.dc,tags:['preparation'],capabilityBonus:{[variant[4]]:3}},success:{next:'fork1',text:'You complete the preparation and secure a concrete advantage for the final objective.',effects:[{type:'flag',key:'objective_ready',value:true},...copy(profile.reward)]},failure:{next:'fork1',text:profile.failureText,effects:copy(profile.failure)}},
{id:'skip',label:'Leave the preparation unresolved and continue',success:{next:'fork1',text:'You continue without the preparation advantage. The main objective is still possible, but harder.'}}
]};
a.scenes.final={title:'The last decision',text:`You reach the center of the crisis involving ${object}. ${mission.final} The opposition is closing in.`,actions:[{id:'prepared',label:'Use your preparation: '+mission.label.toLowerCase(),requires:{flag:'objective_ready'},check:{stat:variant[3],dc:9,tags:['preparation'],capabilityBonus:{[variant[4]]:2}},success:{next:'victory',text:mission.success},failure:{next:'mixed',text:mission.mixed}},{id:'recover',label:mission.label,check:{stat:mission.stat,dc:13+r(3),tags:['investigation'],capabilityBonus:{analysis:3,telekinesis:3,repair:3}},success:{next:'victory',text:mission.success},failure:{next:'mixed',text:mission.mixed}},{id:'expose',label:'Use the captured orders to force a surrender',requires:{flag:'evidence'},check:{stat:'CHA',dc:10,tags:['social']},success:{next:'victory',text:'The captured orders give you leverage. '+mission.success},failure:{next:'mixed',text:mission.mixed}},{id:'evacuate',label:'Give up the main objective and protect the people nearby',success:{next:'mixed',text:mission.mixed}}]};a.scenes.victory={title:'A future reclaimed',text:mission.success+' Your recorded choices show who you helped along the way.',ending:'victory'};a.scenes.mixed={title:'Lives before victory',text:mission.mixed,ending:'mixed'};const errs=C.validateAdventure(a);if(errs.length)throw Error(errs.join('; '));return a}
return {VERSION,genres:Object.keys(themes),missions:missions.map(m=>m.id),variants:Object.fromEntries(Object.entries(variants).map(([m,vs])=>[m,vs.map(v=>v[0])])),generateCharacter,generateAdventure};});
