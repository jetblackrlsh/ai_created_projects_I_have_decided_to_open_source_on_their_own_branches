const clean = value => value?.trim().replace(/\s+/gu, ' ').slice(0, 120) || '';
const terms = value => (value?.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter(word => !['a', 'an', 'the', 'some', 'one'].includes(word));
const definite = text => clean(text).replace(/^(?:an?|some)\s+/iu, 'the ');
const cap = text => text.charAt(0).toUpperCase() + text.slice(1);

export function extractPursuit(premise) {
  const item = clean(/\b(?:need\s+(?:the help of\s+|to (?:find|recover|obtain|bring|get)\s+)?|looking for\s+|must (?:find|recover|obtain|bring|get)\s+)((?:an?|the|some)\s+[^.!?;,\n]+?)(?=\s+(?:if|before|so (?:we|that)|to\s+\w+|and (?:we|i))\b|[.!?;,\n]|$)/iu.exec(premise)?.[1]);
  if (!item) return null;
  const purpose = clean(/\b(?:drive (?:it|them) back|stop (?:it|them|the [^.!?,]+)|save (?:it|them|the [^.!?,]+)|treat (?:it|them|the [^.!?,]+)|get home|open (?:it|the [^.!?,]+))\b/iu.exec(premise)?.[0]);
  const threat = clean(/(?:^|[.!?]\s+)((?:the\s+)?[\p{L}’-]+(?:\s+[\p{L}’-]+){0,4})\s+(?:is|are)\s+(?:attacking|threatening|approaching|closing in on)\s/iu.exec(premise)?.[1])
    .replace(/^The\s+/u, 'the ');
  return { item, purpose, threat, stage: 'wanted', source: '', confirmed: false, asked: false, clue: '' };
}

export function classifyPursuit(world, text) {
  const p = world.pursuit;
  if (!p) return null;
  const spoken = terms(text);
  const wanted = terms(p.item);
  const refers = wanted.length && wanted.every(word => spoken.includes(word));
  const action = text.split(/(?<=[.!?])\s+/u).at(-1) || text;
  if (/\b(?:guidance|advice|ideas|suggestions|a plan|what (?:should|can|do) we do|where (?:should|can) (?:we|i) (?:go|find|look))\b/iu.test(action) &&
      !/\b(?:ignore|refuse|decline)\b/iu.test(action)) return { intent: 'pursuit-advice', text };
  if (p.stage !== 'used' && (refers || /\b(?:it|them|one)\b/iu.test(action))) {
    if (/\b(?:i|we)\s+(?:(?:try|decide)\s+to\s+)?(?:use|activate|bring|apply|deliver|offer)\b/iu.test(action)) {
      return { intent: 'pursuit-use', text };
    }
    if (/\b(?:i|we)\s+(?:(?:try|decide)\s+to\s+)?(?:take|buy|borrow|ask for|trade for|pick up|claim|collect|retrieve)\b/iu.test(action)) {
      return { intent: 'pursuit-obtain', text };
    }
    if (/\b(?:inspect|examine|check|study|compare)\b/iu.test(action) && p.source) return { intent: 'pursuit-inspect', text };
  }
  const trip = /\b(?:go (?:and )?find|head (?:over )?to|go to|walk to|enter|search (?:at|inside)|look inside|visit)\s+([^.!?;]+)/iu.exec(action);
  if (trip && p.stage !== 'used') {
    const destination = clean(trip[1].split(/\s+(?:so that|to (?:get|find|ask)|and (?:ask|look|search))\b/iu, 1)[0]);
    if (destination && (refers || /\b(?:store|shop|stall|market|seller|library|clinic|house|warehouse|archive|museum|temple|cabinet|cupboard|locker|lab|supply|cave|shed|workshop)\b/iu.test(destination))) {
      return { intent: 'pursuit-source', destination, text };
    }
  }
  if (refers && (/^(?:an?|the|some)\b/iu.test(action) || /\b(?:find|seek|looking for|where (?:is|are))\b/iu.test(action))) {
    return { intent: 'pursuit-focus', text };
  }
  return null;
}

export function applyPursuit(world, event, act, note) {
  const p = world.pursuit;
  const item = p.item;
  const target = definite(item);
  const npc = world.npc === 'Your companion' ? cap(world.companion || 'your companion') : world.npc;
  const result = (line, hint = '') => ({ line, hint });
  if (event === 'pursuit-advice') {
    const known = p.asked;
    p.asked = true;
    if (p.stage === 'used') return result(npc + ' reminds you that you already put ' + target + ' to use.', world.lastOutcome);
    if (p.stage === 'held') return result('“You have ' + target + ' now,” ' + npc + ' says.', 'You can decide where and how to use it.');
    if (p.source) return result('“We can follow up at ' + p.source + ',” ' + npc + ' says.', p.clue);
    if (/^(?:where\b|.*[,:]\s+where\b)/iu.test(act.text)) {
      const lead = /\b(?:pass|ticket|fare)\b/iu.test(item) ? 'the ticket office' :
        /\b(?:book|map|record|manuscript|ledger)\b/iu.test(item) ? 'the local archive' :
          /\b(?:medicine|bandage|antidote|salve)\b/iu.test(item) ? 'the nearest clinic' : 'the local market';
      return result(cap(lead) + '. That’s a good place to look for ' + item + '.');
    }
    return result('“' + cap(item) + ' comes first,” ' + npc + ' says.',
      known ? '“Pick a likely place and I can help you check it.”' : '“We should look where someone might keep or sell one. Is there a place you want to try?”');
  }
  if (event === 'pursuit-focus') {
    if (p.stage === 'held' || p.stage === 'used') {
      return result(p.stage === 'held' ? 'You have ' + target + ' with you.' : 'You’ve already put ' + target + ' to use.', world.lastOutcome);
    }
    if (!p.confirmed) {
      p.confirmed = true;
      note('You are looking for ' + item);
      return result(npc + ' takes ' + target + ' as your first priority.', p.clue || 'You can look for a likely source or ask someone who knows the area.');
    }
    return result(p.source ? 'You already have a lead at ' + p.source + '.' : 'You have settled on ' + target + ' as your first objective.',
      p.source ? p.clue : 'Choose a place to search and you can follow the lead from there.');
  }
  if (event === 'pursuit-source') {
    world.place = act.destination;
    if (p.source === act.destination) return result('You return to ' + p.source + '.', p.clue);
    p.source = act.destination;
    if (p.stage !== 'held') p.stage = 'located';
    p.clue = 'There is something here that might be ' + item + '. You’ll need a closer look to be sure it is suitable.';
    note('You found a possible source for ' + item + ' at ' + p.source);
    return result('You head to ' + p.source + ' and check for ' + item + '.', p.clue);
  }
  if (event === 'pursuit-inspect') {
    p.stage = p.stage === 'held' ? 'held' : 'verified';
    p.clue = 'On closer inspection, ' + target + ' is intact. It looks like the kind you came here for.';
    note('You inspected ' + target + ' at ' + p.source);
    return result(p.clue, p.stage === 'held' ? '' : 'You can try to secure it before moving on.');
  }
  if (event === 'pursuit-obtain') {
    if (p.stage === 'held') return result('You already have ' + target + ' with you.');
    if (!p.source) return result('You haven’t found ' + target + ' yet.', 'Start by choosing a place to look.');
    p.stage = 'held';
    if (!world.items.some(prop => prop.name === target)) {
      world.items = [...world.items.slice(-31), { name: target, examined: true, control: false, tested: false, carried: true, function: p.purpose }];
    }
    note('You secured ' + target + ' at ' + p.source);
    return result('You secure ' + target + ' at ' + p.source + ' and take it with you.', p.purpose ? 'Now you can try to ' + p.purpose + '.' : '');
  }
  if (p.stage !== 'held') return result('You need to secure ' + target + ' before you can use it.', p.clue);
  p.stage = 'used';
  const goal = p.purpose ? p.purpose.replace(/\b(?:it|them) back$/iu, (p.threat || 'the threat') + ' back') : 'put your plan into action';
  world.lastOutcome = 'You use ' + target + ' to ' + goal + '. It buys you time to see what changed.';
  note(world.lastOutcome);
  return result(world.lastOutcome, 'The next move is yours.');
}
