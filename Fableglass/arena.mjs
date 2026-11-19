export function isArena(text) {
  return /\b(?:battle arena|fighting arena|combat arena|gladiator\w*|(?:duel|fight|battle|spar)\b[^.!?]{0,80}\barena|arena\b[^.!?]{0,80}\b(?:champion|opponent|match|duel|fight))\b/iu.test(text);
}

export function emptyArena(premise) {
  const area = /\b((?:[\p{L}’-]+\s+){0,2}(?:battle|fighting|combat)\s+arena)\b/iu.exec(premise)?.[1]?.replace(/^(?:an?|the|enter)\s+/iu, '');
  return {
    venue: area ? 'the ' + area : 'the arena',
    rival: /\bagainst\s+([\p{Lu}][\p{L}’-]+(?:\s+[\p{Lu}][\p{L}’-]+){0,2})/u.exec(premise)?.[1] || 'the reigning champion',
    style: '', phase: 'outside', guard: 3, balance: 2, exposed: false, charge: '', learned: false,
    last: '', outcome: '', attacks: [],
  };
}

const titleCase = value => value.charAt(0).toUpperCase() + value.slice(1);
const knownAddress = /(?:^|[.!?]\s+)([\p{Lu}][\p{L}’'-]+(?: [\p{Lu}][\p{L}’'-]+)?),|,\s+([\p{Lu}][\p{L}’'-]+(?: [\p{Lu}][\p{L}’'-]+)?|[\p{Lu}])(?=[?.!])/u;

export function classifyArena(world, input) {
  const text = String(input).trim().slice(0, 2700);
  const arena = world.arena;
  const address = knownAddress.exec(text);
  const vocative = address?.[1] || address?.[2] || /\b(?:with|here with|to)\s+([\p{Lu}][\p{L}’'-]+)(?=[.!?])/u.exec(text)?.[1];
  const action = text.split(/(?<=[.!?])\s+/u).filter(part => /[\p{L}\p{N}]/u.test(part)).at(-1) || text;
  const verb = (pattern, where = action) => pattern.test(where) && !/\b(?:don’t|don't|never|won't|won’t|will not|do not|did not|can't|can’t)\s+(?:try to\s+)?(?:surrender|attack|bite|blast|enter|fight|charge|strike|shoot)\b/iu.test(where);
  const out = (intent, fields = {}) => ({ text, vocative, intent, ...fields });
  if (/\b(?:recap|what (?:happened|have we learned|did we (?:learn|find))|remind me)\b/iu.test(action) && world.facts.length) return out('recall');
  if (arena.phase === 'finished') {
    const destination = /\b(?:go|walk|head|return)\s+(?:back\s+)?(?:to|into|toward)\s+([^.!?;]+)/iu.exec(action)?.[1]?.slice(0, 100);
    const leaving = /\b(?:leave (?:the )?(?:arena|ring)|(?:get|step|walk|go|head)\s+out(?: of (?:the )?(?:arena|ring))?)\b/iu.test(action);
    return out('arena-ended', { destination: destination || (leaving ? 'the exit corridor' : '') });
  }
  if (verb(/\b(?:i|we)\s+(?:(?:choose|decide)\s+to\s+)?(?:surrender|yield|forfeit|concede|tap out|give up)\b|^(?:i\s+)?(?:surrender|i yield|tap out)[.!]?$/iu)) return out('arena-yield');
  if (/\b(?:who (?:is|are|was) (?:our|my|the) (?:rival|opponent|champion)|who (?:am i|are we) fighting|who(?:’s|'s) (?:our|my|the) (?:opponent|rival|champion))\b/iu.test(action)) return out('arena-identify');
  if (arena.phase === 'outside' && verb(/\b(?:walk|step|run|go|head|come|charge|move)\s+(?:right\s+)?(?:out(?:\s+of|\s+from)?|into|onto|through|towards?)\b|\benter\s+(?:the\s+)?(?:arena|ring)\b/iu)) return out('arena-enter');
  if (/\b(?:each time what returns|what (?:returns|failure)|what are you talking about|what(?:'s|’s| is) (?:happening|the situation)|status)\b/iu.test(action)) return out('arena-clarify');
  if (arena.phase === 'outside') return out('arena-ready');
  if (verb(/\b(?:improvised\s+(?:axe|weapon)|(?:pick|lift|swing|throw)\s+(?:you|the dog)\b|\bas\s+(?:an?\s+)?(?:axe|club|hammer|battering ram))\b/iu)) return out('arena-combine');
  if (verb(/\b(?:empower|overload|overcharge|charge)\s+(?:the\s+|our\s+|my\s+)?(?:champion|opponent|rival|adversary|him|her|them)\b|\b(?:channel|feed|transfer|send)\b[^.?!]{0,70}\b(?:energy|power)\b[^.?!]{0,40}\b(?:into|to)\s+(?:(?:the|our|my)\s+)?(?:champion|opponent|rival|him|her|them)\b/iu)) return out('arena-reverse');
  if (verb(/\b(?:empower|charge|channel|give|feed|transfer|send)\b/iu) &&
      (/\b(?:you|your|the dog|companion|ally|bite)\b/iu.test(action) ||
        world.npc !== 'Your companion' && action.toLowerCase().includes(world.npc.toLowerCase())) &&
      !/\bcharge\s+(?:at|toward|head on)\b/iu.test(action)) {
    return out('arena-boost', { careful: /\b(?:gently|carefully|small|slowly|gradually|controlled|just enough|safely)\b/iu.test(action) });
  }
  if (verb(/\b(?:bite|nip|sink your teeth|go for (?:his|her|their) (?:leg|ankle))\b/iu)) return out('arena-bite');
  const tactic = [
    [/\b(?:invisible|illusion|decoy|duplicate|fake image)\b/iu, 'Your deception draws their attention to the wrong spot.'],
    [/\b(?:freeze|ice|slick|slip)\b[^.?!]{0,50}\b(?:floor|ground|arena|feet)\b/iu, 'The change underfoot makes them widen their stance and lower their guard.'],
    [/\b(?:barrier|wall|cover|shield)\b/iu, 'You put something between you and the champion. They have to change direction to reach you.'],
    [/\b(?:teleport|vault|leap|jump)\b[^.?!]{0,50}\b(?:behind|over|away|side)\b/iu, 'You change position faster than they can turn to face you.'],
  ].find(([pattern]) => !/\?\s*$/u.test(action) && verb(pattern));
  if (tactic) return out('arena-tactic', { tactic: tactic[1] });
  if (verb(/\b(?:blast|attack|strike|punch|kick|hit|lunge|fire|shoot|charge at|swing|throw|zap|rush|slam)\b/iu)) {
    const approach = /\b(?:feint|flank|behind|low|from the side|unguarded|guard drops|opening|while (?:he|she|they)\b|distract)\b/iu.test(action);
    return out('arena-attack', { approach, method: /\b(?:blast|beam|fire|zap|bolt)\b/iu.test(action) ?
      'You fire a burst of energy.' : 'You move in for a strike.' });
  }
  if (/\b(?:observe|study|watch|examine|inspect|dodge|evade|block|wait|defend|hang back|back away|shield|feint|circle)\b/iu.test(action)) return out('arena-read');
  return out('arena-talk');
}

export function arenaFlags(world, act) {
  const a = world.arena;
  const repeats = a.attacks.at(-1) === act.intent;
  const canHit = a.exposed || act.approach || a.charge === 'steady' && act.intent === 'arena-bite';
  const finisher = a.guard <= 1 && (
    (act.intent === 'arena-attack' && canHit) || (act.intent === 'arena-bite' && a.charge === 'steady' && !repeats) ||
    (act.intent === 'arena-combine' && !repeats)
  );
  return ['arena', ...Object.entries({
    'arena-rival-known': a.style, 'arena-inside': a.phase === 'fight', 'arena-exposed': canHit,
    'arena-repeat': repeats, 'arena-careful': act.careful, 'arena-feedback': a.learned, 'arena-finisher': finisher,
  }).filter(([, active]) => active).map(([flag]) => flag)];
}

export function applyArena(world, event, act, note) {
  const a = world.arena;
  const npc = world.npc;
  const ally = npc === 'Your companion' && world.companion ? titleCase(world.companion) : npc;
  const champion = titleCase(a.rival);
  const apply = (line, hint = '') => {
    a.last = line;
    world.lastOutcome = line;
    note(line);
    return { line, hint };
  };
  const strike = /^(?:arena-(?:counter|hit|bite|repeat-bite|axe|reverse|win))$/u.test(event);
  if (strike) a.attacks = [...a.attacks.slice(-7), act.intent];
  if (event === 'arena-opening') return {
    line: titleCase(world.companion || 'your companion') + ' pauses with you before you enter ' + a.venue + '.',
    hint: '“Once we go in, we’ll see who we’re up against.”',
  };
  if (event === 'arena-light' || event === 'arena-heavy') {
    a.style = event === 'arena-light' ? 'mobile' : 'guard';
    note(champion + (a.style === 'mobile' ? ' moves quickly and changes direction after a block' : ' fights behind a broad guard and has to turn to cover the flank'));
  }
  if (['arena-light', 'arena-heavy', 'arena-rival'].includes(event)) return {
    line: '“We’re facing ' + a.rival + ',” ' + ally + ' says.',
    hint: a.style === 'mobile' ? '“They like to make the first move. Watch where they go after a block.”' :
      '“They cover the front well. Get them to turn and you might have an opening.”',
  };
  if (event === 'arena-enter') {
    a.phase = 'fight';
    world.place = a.venue;
    world.problem = 'the match against ' + a.rival;
    return apply('You step into ' + a.venue + '. ' + champion + ' leaves the far side and takes a guarded stance opposite you.',
      '“I can draw their attention if you need an opening,” ' + ally + ' says.');
  }
  if (event === 'arena-clarify') return {
    line: a.phase === 'outside' ? '“We’re still outside ' + a.venue + '. The fight hasn’t started,” ' + ally + ' says.' :
      '“We’re facing ' + a.rival + ' in ' + a.venue + ',” ' + ally + ' says.',
    hint: a.last,
  };
  if (event === 'arena-ready') return {
    line: ally + ' stays with you at the entrance to ' + a.venue + '.',
    hint: '“We can talk here. When you’re ready, lead the way in.”',
  };
  if (event === 'arena-counter') {
    a.balance = Math.max(0, a.balance - 1);
    a.exposed = false;
    if (a.style === 'mobile') return apply(act.method + ' ' + champion + ' slips aside and closes the gap before you can follow up.',
      'They keep taking the same first step after a dodge. A feint could draw them out.');
    return apply(act.method + ' ' + champion + ' catches it on their guard and makes you give ground.',
      'They turn their whole body to cover the front. Their flank is briefly unguarded when they do.');
  }
  if (event === 'arena-hit') {
    a.guard--;
    a.exposed = false;
    return apply(act.method + ' This time it gets past the guard. ' + champion + ' stumbles and has to reset.',
      a.guard <= 1 ? 'Their guard is barely holding.' : '');
  }
  if (event === 'arena-bite') {
    a.guard--;
    a.exposed = true;
    const boosted = a.charge === 'steady';
    if (boosted) a.charge = '';
    return apply(ally + ' darts past the guard and catches the champion’s boot. ' +
      (boosted ? 'The extra burst of energy makes them lose their footing.' : 'They have to turn away from you to shake free.'),
    'Their front is open while they deal with ' + ally + '.');
  }
  if (event === 'arena-repeat-bite') {
    return apply(champion + ' sees ' + ally + ' coming this time and steps out of reach.',
      '“I got them to turn before. We’ll need a different distraction this time,” ' + ally + ' says.');
  }
  if (event === 'arena-boost') {
    a.charge = 'steady';
    return apply('You feed ' + ally + ' a controlled amount of energy. ' + ally + ' steadies and holds the charge.',
      '“I can spend that on one quick burst.”');
  }
  if (event === 'arena-feedback') {
    a.learned = true;
    a.charge = 'overloaded';
    return apply('You channel your energy into ' + ally + '. The intake fills before you can stop the flow, and the excess kicks back.',
      '“I’m all right. A little power I can use. Too much at once and it pushes me off balance.”');
  }
  if (event === 'arena-axe') {
    const recovering = a.charge === 'overloaded';
    a.charge = '';
    a.guard = Math.max(0, a.guard - 1);
    a.exposed = false;
    return apply('You lift ' + ally + ', and together you turn the lift into a swinging feint. ' + champion + ' goes high to block it and loses their footing.',
      recovering ? ally + ' lands on their feet as the last of the excess charge fades.' : ally + ' is back on their feet before the champion recovers.');
  }
  if (event === 'arena-reverse') {
    a.exposed = true;
    return apply('You try the same overload that threw ' + ally + ' off balance. The excess energy jars the champion’s guard arm out of position.',
      'The champion backs off with their guard open. You have room to act or to call for a stop.');
  }
  if (event === 'arena-reverse-unknown') {
    a.exposed = true;
    return apply('You send energy into the champion’s guard. They lower it for a moment to find out what you’ve done.',
      '“That bought us an opening. I wouldn’t count on it working twice,” ' + ally + ' says.');
  }
  if (event === 'arena-read') {
    a.exposed = true;
    return apply('You watch the champion through their next move. Their balance shifts just before the guard comes up.',
      'You can act in that brief opening if you time it.');
  }
  if (event === 'arena-tactic') {
    a.exposed = true;
    return apply(act.tactic, 'You have the initiative for a moment.');
  }
  if (event === 'arena-yield' || event === 'arena-win') {
    a.phase = 'finished';
    a.outcome = event === 'arena-yield' ? 'You yielded; the match is over.' : 'The champion yielded; you won the match.';
    world.problem = 'the finished match';
    if (event === 'arena-yield') return apply('You call out your surrender. ' + champion + ' lowers their guard and backs away.',
      '“It’s over. I’m still here,” ' + ally + ' says, coming back to your side.');
    const opening = act.intent === 'arena-combine' ? 'You and ' + ally + ' use the same opening together.' :
      act.intent === 'arena-bite' ? ally + ' bursts around the guard and trips the champion.' : act.method;
    return apply(opening + ' ' + champion + ' fails to recover in time and calls the match.',
      '“We did it,” ' + ally + ' says.');
  }
  if (event === 'arena-ended') {
    if (act.destination && act.destination !== world.place) {
      world.place = act.destination;
      return apply('With the match over, you and ' + ally + ' head to ' + world.place + '.',
        '“We can talk now,” ' + ally + ' says.');
    }
    return { line: a.outcome, hint: ally + ' waits to see what you want to do next.' };
  }
  return {
    line: a.exposed ? 'The champion is still recovering, leaving you room to move.' :
      'The champion holds their ground while ' + ally + ' watches from your side.',
    hint: a.charge === 'overloaded' ? '“I need a moment to bleed off the excess charge.”' : '“Tell me what you need me to do.”',
  };
}
