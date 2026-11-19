const clean = (text, length = 160) => String(text || '').trim().replace(/\s+/gu, ' ').slice(0, length);
const trim = text => clean(text).replace(/[.!?;,”"’]+$/gu, '').trim();
const cap = text => text ? text[0].toUpperCase() + text.slice(1) : '';
const articles = /\b(?:a|an|the|any|some|my|our|your|this|that|these|those)\b/giu;
const wordKeys = text => clean(text, 2700).toLowerCase().replace(articles, ' ').match(/[\p{L}\p{N}]+/gu) || [];
const singular = word => word.replace(/([^s])s$/u, '$1');
const key = text => wordKeys(text).slice(0, 12).map(singular).join(' ');
const includes = (text, subject) => {
  const terms = key(subject).split(' ').filter(Boolean);
  const source = new Set(key(text).split(' '));
  return terms.length > 0 && terms.every(word => source.has(word));
};
const names = {
  person: ['Mara Vale', 'Ren Alder', 'Iona Venn', 'Tavi Reed', 'Jules Mercer', 'Nessa Bell'],
  place: ['Windward Steps', 'Juniper Court', 'East Quay', 'The Long Hall', 'Alder Crossing', 'The Lantern Yard'],
  thing: ['The Meridian Token', 'The Waymark', 'The Ashen Seal', 'The Silver Thread', 'The Dawn Key', 'The Quiet Compass'],
};
const refuge = ['Stonebridge Hall', 'Alder House', 'Juniper Shelter', 'The Lantern Hall', 'Westgate Commons', 'Willow Court'];
const proper = "([\\p{Lu}][\\p{L}’'-]*(?:[ -][\\p{Lu}][\\p{L}’'-]*){0,3})";
const abilities = [
  ['fire powers', /\b(?:fire|flame|pyrokine\w*)\b/iu],
  ['energy powers', /\b(?:energy|energy blasts?)\b/iu],
  ['flight', /\b(?:fly|flight|flying)\b/iu],
  ['super strength', /\b(?:super\s*strength|superhuman strength)\b/iu],
  ['invisibility', /\b(?:invisib\w*|vanish from sight)\b/iu],
  ['telepathy', /\b(?:telepath\w*|read minds?)\b/iu],
  ['teleportation', /\b(?:teleport\w*)\b/iu],
  ['special training', /\b(?:special training|trained|training|martial arts)\b/iu],
];
const abilityTerms = /\b(?:powers?|abilities|ability|superpowers?|training|trained|flight|invisibility|telepathy|teleportation)\b/iu;
const counts = { zero: 0, no: 0, one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20 };
const numeric = /\b(\d+(?:[.,]\d+)?|zero|no|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s+([\p{L}][\p{L}’-]*(?:\s+[\p{L}][\p{L}’-]*){0,2})/giu;
const say = (type, subject, fields = {}) => ({ type, subject, ...fields });
const lookUp = (world, type, id) => world.checkFacts?.findLast(entry => entry.type === type && entry.id === id);
const scene = world => world.place || world.title || 'here';

function remember(world, type, id, subject, value) {
  world.checkFacts = [...(world.checkFacts || []).filter(fact => fact.type !== type || fact.id !== id).slice(-31),
    { type, id, subject, value }];
}

function factsFor(world) {
  return [...world.facts].reverse().concat(world.premise.split(/[.!?]\s+/u));
}

function characterFacts(world) {
  return factsFor(world).filter(fact => /\b(?:i|we|you|my|our|your)\b/iu.test(fact) && !/\?\s*$/u.test(fact));
}

function abilityEvidence(world, subject) {
  const facts = characterFacts(world).filter(fact => !/\b(?:if|maybe|wish|wonder|could be|might)\b/iu.test(fact));
  const matches = abilities.filter(([, pattern]) => pattern.test(subject));
  const relevant = matches.length ? matches.map(([, pattern]) => pattern) :
    /\b(?:powers?|abilities|ability|superpowers?)\b/iu.test(subject) ? abilities.slice(0, -1).map(([, pattern]) => pattern) : [];
  for (const fact of facts) {
    if (/\b(?:i|we|you)\s+(?:have|possess|gain|lost|can|cannot|can't|can’t|lack|was trained|am trained)\b/iu.test(fact) &&
        relevant.some(pattern => pattern.test(fact))) return !/\b(?:no|not|lost|lack|cannot|can't|can’t)\b/iu.test(fact);
    if (/\b(?:no|without|lack|lost)\s+(?:any\s+)?(?:superpowers?|powers?|special abilities)\b/iu.test(fact) &&
        !/\b(?:training|trained)\b/iu.test(subject)) return false;
    if (!matches.length && /\b(?:i|we|you)\s+(?:have|possess)\s+(?:superpowers?|powers?|special abilities)\b/iu.test(fact)) return true;
  }
  const trait = matches[0]?.[0] || 'powers';
  const prior = lookUp(world, 'trait', trait)?.value;
  if (prior !== undefined) return prior;
  if (trait === 'powers' && world.checkFacts?.some(entry => entry.type === 'trait' && entry.value === true &&
      abilities.slice(0, -1).some(([name]) => name === entry.id))) return true;
  if (trait !== 'special training' && lookUp(world, 'trait', 'powers')?.value === false) return false;
  return undefined;
}

function sceneLocation(world, purpose) {
  const description = {
    shelter: /\b(?:safe|secure|shelter|refuge|protected|evacuation point)\b/iu,
    help: /\b(?:aid|treatment|clinic|hospital|healer|medic|medicine)\b/iu,
    supplies: /\b(?:shop|market|supplies|outfitter|vendor)\b/iu,
    exit: /\b(?:exit|evacuation route|way out|escape route)\b/iu,
  }[purpose];
  if (!description) return undefined;
  for (const fact of factsFor(world)) {
    if (/\?\s*$/u.test(fact) || !description.test(fact) || /\b(?:unsafe|not safe|closed|blocked|destroyed|unreachable)\b/iu.test(fact)) continue;
    const named = new RegExp(proper + '\\s+(?:is|has|offers|serves|can|takes)\\b', 'u').exec(fact)?.[1] ||
      new RegExp('\\b(?:at|to|inside|in|called|named)\\s+' + proper, 'u').exec(fact)?.[1];
    if (named && !/^(?:I|We|You|Our|My|The|This|There|It)$/u.test(named)) return named;
    const plain = /(?:^|[.;]\s*)(the [\p{L}’-]+(?: [\p{L}’-]+){0,4})\s+(?:is|serves as|offers)\b/iu.exec(fact)?.[1];
    if (plain) return plain;
  }
  return undefined;
}

function where(world, question, act) {
  if (!/^where\b/iu.test(question) || /^where does (?:the )?(?:match|fight|duel) stand$/iu.test(question)) return null;
  const subject = trim(question.replace(/^where\s+(?:(?:is|are|was|were)\s+|(?:can|could|should|do|did|will|would|might|must)\s+(?:i|we|you)\s+)?/iu, ''));
  if (!subject) return null;
  const current = key(scene(world));
  if (/^where (?:are we|am i)(?: now)?$/iu.test(question) && world.place) {
    const alias = lookUp(world, 'place-alias', current)?.value;
    return say('name', 'current location', { kind: 'place', known: alias || world.place });
  }
  const goal = /\b(?:keep|get|take|bring|move|lead|evacuate|shelter|hide|send|guide|find|put)\b/iu.test(subject);
  const purpose = /\b(?:safe(?:ty)?|shelter|refuge|out of (?:harm|danger)|evacuat\w*|protected)\b/iu.test(subject) ||
    goal && /\b(?:civilians|children|kids|bystanders|survivors|refugees)\b/iu.test(subject) ? 'shelter' :
    /\b(?:aid|treat\w*|clinic|hospital|healer|medic|medicine)\b/iu.test(subject) ? 'help' :
      /\b(?:supplies|shop|market|outfitter)\b/iu.test(subject) ? 'supplies' :
        /\b(?:exit|way out|get out|escape)\b/iu.test(subject) ? 'exit' : '';
  if (!purpose && act.intent.startsWith('pursuit-')) return null;
  const ref = trim(subject.replace(/^(?:find|look for|get|reach|go to|take|bring|leave)\s+/iu, ''));
  const item = world.items.find(prop => key(prop.name) === key(ref) || /^(?:it|this|that)$/iu.test(ref) && key(prop.name) === key(world.focus));
  const id = purpose ? current + ':' + purpose : 'place:' + current + ':' + key(ref);
  if (item?.carried && !purpose) return say('name', subject, { kind: 'place', known: 'With you' });
  if (world.pursuit?.source && !purpose && includes(world.pursuit.item, ref)) {
    return say('name', subject, { kind: 'place', known: world.pursuit.source });
  }
  const remembered = purpose ? lookUp(world, 'destination', id)?.value ||
    world.checkFacts?.findLast(row => row.type === 'destination' && row.subject === purpose && key(row.value) === current)?.value :
    lookUp(world, 'name', id)?.value;
  let recordedObject;
  if (!purpose && ref) {
    for (const fact of factsFor(world)) {
      const match = /^([^.!?,]+?)\s+(?:is|are|was|were|lies|sits)\s+(?:in|inside|on|at|under|behind)\s+([^.!?,]+)/iu.exec(fact);
      if (match && includes(match[1], ref) && !/\?\s*$/u.test(fact)) {
        recordedObject = trim(match[2]);
        break;
      }
    }
  }
  const known = sceneLocation(world, purpose) || recordedObject || remembered;
  return say('name', ref, { id, kind: 'place', locate: true, goal, purpose, known });
}

function recurringRole(text) {
  if (/\b(?:runs|owns|keeper|proprietor|innkeeper|shopkeeper|runs the shop)\b/iu.test(text)) return 'proprietor';
  if (/\b(?:in charge|leader|captain|boss|oversees|leads)\b/iu.test(text)) return 'leader';
  return '';
}

function recordedPerson(world, question) {
  const role = recurringRole(question);
  if (!role) return undefined;
  const roleSource = role === 'proprietor' ? '(?:shopkeeper|innkeeper|proprietor|owner|runs|owns)' : '(?:leader|captain|in charge|leads|oversees)';
  for (const fact of factsFor(world)) {
    if (/\?\s*$/u.test(fact) || !new RegExp(roleSource, 'iu').test(fact)) continue;
    const name = new RegExp(proper + '\\s+(?:runs|owns|leads|oversees|is\\s+(?:the\\s+)?' + roleSource + ')\\b', 'u').exec(fact)?.[1] ||
      new RegExp('\\b' + roleSource + '\\s+(?:is|named|called)\\s+' + proper, 'u').exec(fact)?.[1];
    if (name && !/^(?:I|We|You|Our|My|The|This|There|It)$/u.test(name)) return name;
  }
  return undefined;
}

function what(world, question) {
  if (!/^what\b/iu.test(question)) return null;
  if (/\b(?:powers?|special abilities|training)\s+(?:(?:do|did) (?:i|we) (?:have|get|receive)|(?:have|am|are) (?:i|we) (?:got|trained))\b/iu.test(question)) {
    const established = abilities.filter(([name]) => abilityEvidence(world, name) === true).map(([name]) => name);
    const fact = established.length ? cap(established.join(', ')) + '.' :
      abilityEvidence(world, 'powers') === false ? 'You don’t have powers.' : 'Your abilities haven’t been established.';
    return say('information', question, { fact });
  }
  if (/\b(?:did (?:i|we)(?: (?:just|actually))? (?:grab|take|pick up|snatch|steal|find)|(?:am|are) (?:i|we) (?:carrying|holding))\b/iu.test(question)) {
    const specific = /\b(?:grab|take|pick up|snatch|steal|find)\b/iu.test(question);
    const carried = world.items.filter(prop => prop.carried).map(prop => prop.name);
    const fact = specific && world.lastAcquired ? cap(world.lastAcquired) + '.' : carried.length ? cap(carried.join(', ')) + '.' : 'Nothing you’ve taken is recorded yet.';
    return say('information', question, { fact });
  }
  if (/^what(?:['’]s| is| was)\s+(?:it|that|this)(?:\s+(?:thing|object|device|item))?$/iu.test(question)) {
    const focused = world.items.find(prop => key(prop.name) === key(world.focus));
    if (focused) {
      return say('information', question, { fact: cap(focused.kind || focused.name) + '.' + (focused.function ? ' ' + focused.function : '') });
    }
  }
  if (/^what\s+(?:can|do)\s+(?:i|we)\s+see(?:\s+(?:here|around us))?$/iu.test(question)) {
    const view = [world.place && 'You’re at ' + world.place, world.focus && 'You have ' + world.focus + ' in view'].filter(Boolean);
    return say('information', question, { fact: view.length ? view.join('. ') + '.' : undefined });
  }
  const description = /^what (?:color|colour) (?:is|was|are)\s+(.+)/iu.exec(question);
  if (description) {
    const subject = trim(description[1]);
    const color = /\b(red|blue|green|yellow|orange|purple|gold|silver|black|white|brown|grey|gray|pink|clear)\b/iu;
    const fact = factsFor(world).find(fact => includes(fact, subject) && color.test(fact) && !/\?\s*$/u.test(fact));
    if (fact) return say('information', question, { fact: cap(color.exec(fact)[1]) + '.' });
  }
  return null;
}

function presentCount(world, subject, inventory) {
  const term = key(subject);
  if (inventory) {
    const carried = world.items.filter(item => item.carried);
    if (/^(?:item|thing|object|tool|piece of gear|anything)?$/u.test(term)) return carried.length;
    const known = carried.filter(item => includes(item.name, term)).length;
    if (known) return known;
    if (world.pursuit && includes(world.pursuit.item, term)) return Number(world.pursuit.stage === 'held');
  }
  for (const fact of factsFor(world)) {
    if (/\?\s*$/u.test(fact) || (inventory && !/\b(?:i|we|you)\s+(?:have|carry|are carrying|carrying|had)\b/iu.test(fact))) continue;
    for (const match of fact.matchAll(numeric)) {
      if (!key(match[2]).startsWith(term) || !term) continue;
      if (/\b(?:don['’]t|do not|not|used to|if|might|would|could be)\b/iu.test(fact)) continue;
      const count = counts[match[1].toLowerCase()] ?? Number(match[1].replace(',', '.'));
      if (Number.isFinite(count)) return count;
    }
    if (inventory && /\b(?:i|we|you)\s+(?:(?:am|are)\s+carrying|have|carry|took|secured)\b/iu.test(fact) && includes(fact, subject) &&
        !/\b(?:don['’]t|do not|not|used to|if|might|would)\b/iu.test(fact)) return 1;
  }
  if (inventory) return 0;
  return undefined;
}

function quantity(world, question) {
  const match = /^(?:how\s+(many|much|long|far|old|high|deep))\b\s*(.*)/iu.exec(question);
  if (!match) return null;
  const mode = match[1].toLowerCase();
  const rest = trim(match[2]);
  let subject = trim(rest.split(/\s+(?:do|does|did|have|has|are|is|was|were|can|could|will|would|should)\b/iu, 1)[0]);
  const inventory = /\b(?:do (?:i|we) (?:have|carry|own)|(?:i|we) (?:have|carrying)|(?:in|among) (?:my|our) (?:bag|inventory|gear)|did (?:i|we) (?:pick up|take))\b/iu.test(rest);
  let unit = '';
  if (mode === 'much' && /\b(?:cost|price|pay|worth|charge|buy)\b/iu.test(rest)) {
    subject = trim(rest.replace(/^.*?\b(?:does|is)\s+/iu, '').replace(/\b(?:cost|worth)\s*$/iu, '')) || world.focus || 'the item';
    unit = /\b(?:credits?|dollars?|pounds?|euros?|coins?)\b/iu.exec(world.premise)?.[0]?.toLowerCase() || 'in the local currency';
    if (/^(?:it|this|that)$/iu.test(subject)) subject = world.focus || world.pursuit?.item || 'the item';
  } else if (mode === 'far' || mode === 'high' || mode === 'deep' || (mode === 'much' && /\b(?:rope|string|water|distance)\b/iu.test(subject))) {
    unit = /\bwater\b/iu.test(subject) ? 'liters' : 'meters';
  } else if (mode === 'old') {
    unit = 'years';
  } else if (mode === 'long' || /\btime\b/iu.test(subject)) {
    unit = 'minutes';
  }
  if (inventory && mode === 'much' && /\b(?:money|cash|currency)\b/iu.test(subject)) {
    subject = /\b(?:credits?|dollars?|pounds?|euros?|coins?)\b/iu.exec(world.premise)?.[0]?.toLowerCase() || 'coins';
  }
  if (!subject) subject = inventory ? world.focus || 'items' : trim(rest.replace(/^(?:is|are|do|does|will|did)\s+/, '')) || mode;
  const location = /\b(?:are|is|were|was|left)\s+(inside|outside|upstairs|downstairs|in\s+[^?!]+|on\s+[^?!]+|at\s+[^?!]+)\s*$/iu.exec(rest)?.[1];
  const scope = inventory ? 'inventory' : key(location || scene(world));
  const id = scope + ':' + mode + ':' + key(subject) + ':' + unit;
  const presence = lookUp(world, 'presence', key(scene(world)) + ':' + key(subject))?.value;
  const fromWorld = mode === 'many' || inventory || /\b(?:water|rope|time)\b/iu.test(subject) ? presentCount(world, subject, inventory) : undefined;
  const known = fromWorld ?? (presence === false ? 0 : undefined) ?? lookUp(world, 'number', id)?.value;
  return say('number', subject, { id, known, unit, scale: unit ? [5, 8, 12, 15, 20, 30] : [1, 2, 3, 4, 5, 6] });
}

function boolean(world, question) {
  const match = /^(is|are|am|was|were|do|does|did|can|could|will|would|has|have|had|should)(n['’]t)?\s+(.+)/iu.exec(question);
  if (!match) return null;
  const predicate = trim(match[3]);
  const action = /^(?:can|could|should)$/iu.test(match[1]);
  const presence = /^there\s+(.+)/iu.exec(predicate)?.[1];
  const has = /^(?:i|we|you)\s+(?:still\s+)?(?:have|carry|own|holding|got)\s+(.+)/iu.exec(predicate)?.[1];
  const did = /^did$/iu.test(match[1]) && /^(?:i|we|you)\s+(.+)/iu.exec(predicate)?.[1];
  const subject = trim((presence || has || did || predicate).replace(/\b(?:still|already|nearby|here|yet|left|not)\b/giu, ' '));
  const id = match[1].toLowerCase() + ':' + key(scene(world)) + ':' + key(subject);
  const remembered = lookUp(world, 'boolean', id)?.value;
  let known, detail = '', trait, object;
  if (has) {
    if (abilityTerms.test(subject)) {
      trait = abilities.find(([, pattern]) => pattern.test(subject))?.[0] || 'powers';
      known = abilityEvidence(world, subject);
    } else {
      const count = presentCount(world, subject, true);
      known = count > 0;
      if (known) detail = 'You have it with you.';
    }
  } else if (presence) {
    const placeId = key(scene(world)) + ':' + key(subject);
    const observed = presentCount(world, subject, false);
    const prior = world.checkFacts?.findLast(row => row.type === 'number' && row.id.startsWith(key(scene(world)) + ':many:') &&
      key(row.subject) === key(subject));
    if (observed !== undefined || prior) known = (observed ?? prior.value) > 0;
    else known = lookUp(world, 'presence', placeId)?.value;
  } else if (did) {
    const attempt = world.checkFacts?.findLast(row => row.type === 'action' && includes(row.subject, subject));
    const last = /^(?:succeed|fail|pass|make it|do it|manage it|pull it off)$/iu.test(subject) && world.lastActionOutcome;
    if (attempt || last) {
      const outcome = attempt?.value || last;
      known = outcome === (/^fail$/iu.test(subject) ? 'failure' : 'success');
      detail = outcome === 'partial' ? 'You made some progress. The action isn’t complete.' : '';
    } else if (/\b(?:take|pick up|buy|collect|get)\b/iu.test(subject)) {
      const target = subject.replace(/^(?:take|pick up|buy|collect|get)\s+/iu, '');
      known = presentCount(world, target, true) > 0;
    } else if (world.arena && /\benter\b.*\barena\b/iu.test(subject)) {
      known = world.arena.phase !== 'outside';
    } else if (/\b(?:fix|repair|solve|resolve)\b/iu.test(subject)) {
      const target = subject.replace(/^(?:fix|repair|solve|resolve)\s+/iu, '');
      if (includes(world.problem, target)) known = world.resolved;
    }
  } else if (/^it\s+(?:a|an|the)\s+/iu.test(predicate) && /^is$/iu.test(match[1])) {
    const target = trim(predicate.replace(/^it\s+(?:(?:an?|the)\s+)?/iu, ''));
    const prop = world.items.find(item => key(item.name) === key(world.focus));
    if (prop) {
      object = { prop, target };
      known = prop.kind ? key(prop.kind.replace(/ray\s*gun/giu, 'raygun')) === key(target.replace(/ray\s*gun/giu, 'raygun')) : undefined;
      if (known === undefined && !/\b(?:unknown|unidentified|equipment|gear)\b/iu.test(prop.name)) {
        known = includes(prop.name, target) || includes(target, prop.name);
      }
    }
  } else if (/\b(?:locked|unlocked|open|closed|broken|working|empty|safe|finished|over|resolved)\b/iu.test(subject)) {
    const adjective = /\b(locked|unlocked|open|closed|broken|working|empty|safe|finished|over|resolved)\b/iu.exec(subject)[1];
    const target = trim(subject.replace(adjective, ''));
    const status = factsFor(world).find(fact => includes(fact, target) && new RegExp('\\b' + adjective + '\\b', 'iu').test(fact));
    if (world.arena && /\b(?:match|duel|fight)\b/iu.test(target) && /finished|over|resolved/u.test(adjective)) known = world.arena.phase === 'finished';
    else if (status) known = !new RegExp('\\b(?:not|no|never|isn[’\\x27]t)\\s+' + adjective, 'iu').test(status);
    else if (adjective === 'unlocked' && factsFor(world).some(fact => includes(fact, target) && /\blocked\b/iu.test(fact))) known = false;
    else if (adjective === 'locked' && factsFor(world).some(fact => includes(fact, target) && /\bunlocked\b/iu.test(fact))) known = false;
    else if (adjective === 'open' && factsFor(world).some(fact => includes(fact, target) && /\b(?:locked|closed|jammed)\b/iu.test(fact))) known = false;
    else if (adjective === 'working' && factsFor(world).some(fact => includes(fact, target) && /\bbroken\b/iu.test(fact))) known = false;
  }
  if (known === undefined && action && /^(?:i|we|you)\s+/iu.test(predicate)) {
    const lacking = world.pursuit && !['held', 'used'].includes(world.pursuit.stage) &&
      /\b(?:use|activate|apply|deliver)\b/iu.test(predicate) && includes(predicate, world.pursuit.item);
    const opening = /\b(?:open|enter|cross)\s+([^,?!]+)/iu.exec(predicate)?.[1]?.split(/\s+(?:with|using|without)\b/iu, 1)[0];
    const explicitBarrier = opening && factsFor(world).some(fact => includes(fact, opening) && /\b(?:locked|blocked|jammed|collapsed)\b/iu.test(fact) &&
      !/\b(?:unlocked|not locked|no longer locked)\b/iu.test(fact));
    const permissionToTry = /\b(?:try|attempt)\b/iu.test(predicate);
    known = permissionToTry || !lacking && !explicitBarrier && (!/\b(?:reach|see|touch|cross|enter|open)\b/iu.test(predicate) || !world.problem ||
      !/\b(?:locked|blocked|collapsed|jammed)\b/iu.test(world.problem) || !includes(predicate, world.problem.replace(/^(?:the )?(?:locked|blocked|collapsed|jammed)\s+/iu, '')));
    detail = known ? (/\b(?:try|attempt)\b/iu.test(predicate) ? 'You can make the attempt.' : 'You can try it. The outcome depends on what you do.') :
      lacking ? 'You haven’t secured it yet.' : 'The obstruction is still in the way.';
  }
  const capabilityOpen = trait && /\b(?:superhero|superpowers?|superpowered|powered hero|mage|magician|mutant|witch|wizard)\b/iu.test(world.premise);
  const evidence = known ?? remembered;
  return say('boolean', subject, { id, presence: !!presence, known: evidence, detail, trait, object,
    open: evidence === undefined && (!!presence || !!object || !!capabilityOpen ||
      /\b(?:visible|nearby|on duty|awake|lit|watching|wearing|standing|holding|someone|anyone)\b/iu.test(predicate)) &&
      !/\b(?:secret|plan|intent|real life|should|promise)\b/iu.test(predicate) });
}

function identity(world, question, act) {
  if (['explain', 'status', 'arena-identify', 'arena-clarify'].includes(act.intent) || act.intent.startsWith('pursuit-')) return null;
  if (/^what did (?:i|we) (?:learn|discover|find out)|^what do (?:i|we) know(?: so far)?$/iu.test(question)) return null;
  if (/\b(?:what happens (?:now|next)|what comes next|what['’]s next|what now)\b/iu.test(question)) return null;
  let kind, subject, known;
  if (/^(?:who)\b/iu.test(question)) {
    if (/^who am i$/iu.test(question)) return say('information', question);
    kind = 'person';
    subject = trim(question.replace(/^who\s+(?:(?:is|are|was|were)\s+)?/iu, ''));
    if (/^(?:you|my companion|our companion|the companion|with (?:me|us)|beside (?:me|us))$/iu.test(subject) && world.npc !== 'Your companion') known = world.npc;
    else if (world.arena && /\b(?:opponent|champion|rival)\b/iu.test(subject)) return null;
    else known = recordedPerson(world, subject);
  } else if (/^(?:what|which)\b/iu.test(question)) {
    const naming = /\b(?:name(?:d)?|called|call)\b/iu.test(question);
    subject = trim(question.replace(/^(?:what|which)(?:['’]s|\s+(?:is|are|was|were))?\s*/iu, '')
      .replace(/^(?:the )?name of\s+|\s+(?:called|named)$/giu, ''));
    if (!naming && !/^(?:(?:this|that|it|the)\s*)?(?:object|item|thing|artifact|relic|device|tool|key|coin|book|tavern|inn|shop)\b/iu.test(subject) &&
        !/^(?:this|that|it)$/iu.test(subject)) return null;
    kind = /\b(?:place|town|city|village|inn|shop|room|tavern|building|arena|road|station|district)\b/iu.test(subject) ? 'place' :
      /\b(?:person|merchant|shopkeeper|guide|companion|guard|owner|captain|leader|boss|npc)\b/iu.test(subject) ? 'person' : 'thing';
    if (kind === 'place' && /^(?:this|the|our)\s+(?:place|town|city|village|room|shop|building)$/iu.test(subject) &&
        /\b[\p{Lu}][\p{L}’'-]+\b/u.test(world.place.replace(/^(?:A|An|The)\s+/u, ''))) known = world.place;
    if (kind === 'person' && /\b(?:my|our|your|the)\s+companion\b/iu.test(subject) && world.npc !== 'Your companion') known = world.npc;
    if (kind === 'person' && !known) known = recordedPerson(world, subject);
    if (kind === 'thing') {
      const ref = /^(?:this|that|it|this object|this item|that thing)$/iu.test(subject) ? world.focus : subject;
      const item = world.items.find(entry => key(entry.name) === key(ref) && ref);
      if (item) known = item.name;
    }
  } else {
    return null;
  }
  if (!subject) return null;
  const id = kind + ':' + key(scene(world)) + ':' + (kind === 'person' && recurringRole(subject) || key(subject));
  return say('name', subject, { id, kind, known: known || lookUp(world, 'name', id)?.value });
}

function action(world, input, act) {
  const tail = input.split(/(?<=[.!?])\s+/u).at(-1);
  if (!['talk', 'inspect', 'use', 'solve', 'offer', 'travel'].includes(act.intent)) return null;
  if (act.intent === 'travel' && act.destination && !/^(?:away|closer|forward|back|on|around)$/iu.test(act.destination)) return null;
  if (!/^(?:(?:i|we)\s+|(?:sneak|slip|climb|jump|light|unlock|open|hide|dodge|listen|read|sing|whistle|knock|lift)\b)/iu.test(tail) ||
      /^(?:i|we)\s+(?:am|are|was|were|think|believe|know|feel|hope|want|wish|don['’]t|won['’]t|cannot|can['’]t|did|didn['’]t|have|had|seem)\b/iu.test(tail)) return null;
  const move = trim(tail.replace(/^(?:i|we)\s+(?:(?:try|attempt|manage|decide)\s+to\s+)?/iu, '').split(/\s+(?:but|because|before|so that)\b/iu, 1)[0]);
  if (!move) return null;
  const moveLower = move[0].toLowerCase() + move.slice(1);
  const id = key(scene(world)) + ':' + key(moveLower);
  const previous = lookUp(world, 'action', id);
  const open = /\b(?:open|unlock|unlatch|force)\s+(.+)/iu.exec(moveLower)?.[1];
  const locked = !!open && factsFor(world).some(fact => includes(fact, open) && /\b(?:locked|jammed|sealed)\b/iu.test(fact) &&
    !/\b(?:unlocked|not locked|no longer locked)\b/iu.test(fact)) && !/\b(?:key|lever|code|pick)\b/iu.test(moveLower);
  const routineUse = /^hold (?:my|our) breath\b|^(?:draw|light)\s+(?:a|the|my|our)\s+(?:sword|blade|candle|lamp|lantern)\b/iu.test(moveLower);
  if (!locked && world.family !== 'grounded' && ((act.intent === 'inspect' || act.intent === 'use' && !routineUse) && act.target ||
      act.intent === 'solve' && !world.resolved || act.intent === 'offer')) return null;
  const grabbed = /^(?:snatch|seize|wrest)\s+(?:away\s+)?([^.!?]+?)(?:\s+(?:away\s+)?from\s+|\s+to\s+|$)/iu.exec(moveLower)?.[1];
  const focused = world.items.find(prop => key(prop.name) === key(world.focus));
  const guessed = /\b(?:act as if|assuming|hope(?:fully)?|as though)\b/iu.test(tail) &&
    /\b(?:fire|trigger|activate|turn on|launch)\b/iu.test(tail) && !focused?.kind;
  const risk = guessed || /\b(?:sneak|slip|steal|stall|bluff|convince|persuade|leap|jump|climb|force|rush|gamble|distract|pretend|lift|swim|balance|hide|dodge|race)\b/iu.test(moveLower);
  const prepared = /\b(?:carefully|quietly|use (?:my|the)|with (?:my|the|help|a plan)|distract|while (?:they|he|she))\b/iu.test(moveLower);
  const observation = act.intent === 'inspect' && act.target ? factsFor(world).find(fact => includes(fact, act.target) &&
    !/\?\s*$/u.test(fact) && !/^you (?:look at|inspect|check)\b/iu.test(fact)) : '';
  return say('action', moveLower, { id, blocked: locked, risk, prepared: !guessed && prepared, grabbed, guessed,
    observation, repeated: risk && previous && previous.value !== 'success', already: previous?.value === 'success' });
}

export function interpretCheck(world, input, act) {
  const text = clean(input, 2700);
  const tail = text.split(/(?<=[.!?])\s+/u).at(-1);
  const question = trim(tail.replace(/\s*[,;]?\s+\byes\s+(?:or|\/)\s+no(?=[?!]?$)/iu, '')
    .replace(/^(?:i|we)\s+ask(?:\s+[\p{L}’-]+(?:\s+[\p{L}’-]+)?)?\s*[,:"“]\s*/iu, '')
    .replace(/^(?:(?:i|we)\s+ask(?:\s+[^.,?!]{1,40}?)?|(?:can|could|would) you tell me|tell me)\s+(?=(?:who|what|where|how many|how much)\b)/iu, '')
    .replace(/^[\p{Lu}][\p{L}’-]*(?: [\p{Lu}][\p{L}’-]*)?,\s+/u, '')
    .replace(/,\s+[\p{Lu}][\p{L}’-]*(?: [\p{Lu}][\p{L}’-]*)?[?!]$/u, '?'));
  const directQuestion = question.replace(/^(who|what|where)['’]s\b/iu, '$1 is')
    .replace(/^(where)\s+(i|we|you)\s+(can|could|should|will|would|might)\b/iu, '$1 $3 $2');
  if (/\?[”"']?$/u.test(tail) || /\byes\s+(?:or|\/)\s+no\b/iu.test(tail) ||
      /^(?:how (?:many|much|long|far|old)|who\b|where\b|what\b)/iu.test(directQuestion)) {
    const direct = quantity(world, directQuestion) || boolean(world, directQuestion) ||
      where(world, directQuestion, act) || what(world, directQuestion) || identity(world, directQuestion, act);
    if (direct) return direct;
    if (act.intent === 'talk' || act.intent === 'question' &&
        !/\b(?:what happens (?:now|next)|what comes next|what now|what['’]s next)\b/iu.test(directQuestion)) {
      if (/^(?:who|what|where)\b/iu.test(directQuestion)) return say('information', directQuestion);
      return say('boolean', directQuestion, { known: false, detail: 'That hasn’t been established.' });
    }
    return null;
  }
  if (world.family !== 'arena' || act.intent === 'arena-talk') {
    return action(world, text, act.intent === 'arena-talk' ? { ...act, intent: 'talk' } : act);
  }
  return null;
}

export function checkFlags(check) {
  return ['check:' + check.type, ...Object.entries({
    'check:known': check.known !== undefined, 'check:yes': check.known === true, 'check:no': check.known === false,
    'check:open': check.open, 'check:risk': check.risk && !check.already, 'check:ready': check.prepared,
    'check:blocked': check.blocked, 'check:retry': check.repeated && !check.prepared,
  }).filter(([, active]) => active).map(([flag]) => flag)];
}

function actionLine(check, outcome) {
  const verb = check.subject;
  if (check.already) return 'You already did that. The result still stands.';
  if (outcome === 'success') {
    if (check.observation) return 'You ' + verb + '. ' + check.observation.replace(/[.!?]*$/u, '.');
    if (/\b(?:sneak|slip|hide)\b/iu.test(verb)) return 'You ' + verb + ' without drawing attention.';
    if (/\b(?:convince|persuade|bluff)\b/iu.test(verb)) return 'Your approach works. They agree to hear you out or let you proceed.';
    return 'You ' + verb + '. It works.';
  }
  if (outcome === 'partial') {
    if (check.guessed) return 'You try the controls. You get a reaction, but you can’t tell yet what the device is meant to do.';
    if (/\b(?:sneak|slip|hide)\b/iu.test(verb)) return 'You ' + verb + ', but someone notices movement. You have a brief lead before they react.';
    if (/\b(?:convince|persuade|bluff)\b/iu.test(verb)) return 'They hear you out and hesitate. You have their attention, but they want something they can verify before agreeing.';
    if (/\b(?:climb|leap|jump|lift|swim)\b/iu.test(verb)) return 'You get part of the way through the move and have to stop. You have a foothold for another attempt.';
    return 'You get the move started. You make some headway, and will need an extra step to finish it.';
  }
  if (check.blocked) return 'You try to ' + verb + '. It stays shut; you need a way past the lock or obstruction.';
  if (check.guessed) return 'The device doesn’t respond the way you expected. Your attempt doesn’t reach the target.';
  if (/\b(?:sneak|slip|hide)\b/iu.test(verb)) return 'You try to ' + verb + '. Someone spots you before you get where you meant to go.';
  if (/\b(?:convince|persuade|bluff)\b/iu.test(verb)) return 'You try to ' + verb + '. They don’t agree and hold their position.';
  return 'You try to ' + verb + '. The attempt falls short.';
}

export function applyCheck(world, check, event, note) {
  const variant = Number(event.match(/(\d+)$/u)?.[1] || 0);
  if (check.type === 'action') {
    const outcome = event.slice('check-action-'.length);
    const line = actionLine(check, outcome);
    if (!check.already) {
      remember(world, 'action', check.id, check.subject, outcome);
      world.lastOutcome = line;
      if (outcome !== 'failure') note(line);
      if (outcome === 'success' && check.grabbed) {
        const item = check.grabbed.replace(/^(?:my|a|an|some)\s+/iu, 'the ');
        const previous = world.items.find(prop => key(prop.name) === key(item));
        if (previous) previous.carried = true;
        else world.items = [...world.items.slice(-31), { name: item, carried: true, examined: false, tested: false, control: false, function: '' }];
        world.focus = world.lastAcquired = item;
      }
    }
    return { body: line, check: { type: 'action', outcome } };
  }
  if (check.type === 'boolean') {
    const result = event === 'check-yes' ? true : event === 'check-no' ? false : null;
    if (result !== null && check.known === undefined) {
      if (check.trait) remember(world, 'trait', check.trait, check.subject, result);
      else remember(world, 'boolean', check.id, check.subject, result);
      if (check.object && result) check.object.prop.kind = check.object.target;
    }
    if (check.presence && result !== null) remember(world, 'presence', key(scene(world)) + ':' + key(check.subject), result);
    return { body: result === null ? 'No. That hasn’t been established.' :
      (result ? 'Yes.' : 'No.') + (check.detail ? ' ' + check.detail : ''),
    check: { type: 'boolean', value: result ?? false } };
  }
  if (check.type === 'number') {
    const value = check.known ?? check.scale[variant];
    if (check.known === undefined) remember(world, 'number', check.id, check.subject, value);
    return { body: value + ' ' + (check.unit || check.subject) + '.', check: { type: 'number', value } };
  }
  if (check.type === 'name') {
    const set = check.purpose === 'shelter' ? refuge : names[check.kind];
    const used = new Set((world.checkFacts || []).filter(row => row.type === 'name').map(row => row.value));
    const value = check.known || set.map((_, offset) => set[(variant + offset) % set.length]).find(name => !used.has(name)) ||
      set[variant] + ' of ' + scene(world);
    if (!check.known) {
      if (check.purpose) remember(world, 'destination', check.id, check.purpose, value);
      else remember(world, 'name', check.id, check.subject, value);
      if (check.kind === 'person' && /^(?:you|my companion|our companion|the companion)$/iu.test(check.subject)) world.npc = value;
      if (check.kind === 'place' && !check.locate && /^(?:this|the|our)\s+(?:place|town|city|village|room|shop|building)$/iu.test(check.subject)) {
        remember(world, 'place-alias', key(scene(world)), check.subject, value);
      }
      if (check.kind === 'thing' && /^(?:this|that)\b/iu.test(check.subject) && !world.focus) {
        world.focus = value;
        world.items = [...world.items.slice(-31), { name: value, carried: false, examined: false, control: false, tested: false, function: '' }];
      }
    }
    let body = cap(value) + '.';
    if (check.locate && value !== 'With you') world.lastLocationAnswer = value;
    if (check.purpose === 'shelter' && !check.known) body += ' The building is off the main approach and has room to shelter people.';
    if (check.purpose === 'help' && !check.known) body += ' You can look for help or treatment there.';
    if (check.purpose === 'exit' && !check.known) body += ' Look for a way out there.';
    return { body, check: { type: 'name', kind: check.kind, value } };
  }
  return { body: check.fact || 'Nothing established so far answers that question.', check: { type: 'information', value: check.fact || null } };
}
