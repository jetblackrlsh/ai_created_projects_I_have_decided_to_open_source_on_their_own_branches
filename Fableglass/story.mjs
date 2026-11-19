import { applyArena, arenaFlags, classifyArena, emptyArena, isArena } from './arena.mjs';
import { applyPursuit, classifyPursuit, extractPursuit } from './pursuit.mjs';
import { applyCheck, checkFlags, interpretCheck } from './checks.mjs';

const clean = (value, max = 160) => typeof value === 'string' ? value.trim().replace(/\s+/gu, ' ').slice(0, max) : '';
const words = text => clean(text, 5000).normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
const filler = new Set(['a', 'an', 'the', 'this', 'that', 'of', 'to', 'my', 'your', 'some', 'it']);
const key = text => words(text).filter(word => !filler.has(word)).slice(0, 10).join(' ');
const sentence = text => /[.!?…]$/u.test(text) ? text : text + '.';
const cap = text => text ? text[0].toUpperCase() + text.slice(1) : '';
const lower = text => text ? text[0].toLowerCase() + text.slice(1) : '';
const noun = text => clean(text, 110).replace(/^[“"']|[”"'.!?,;]+$/gu, '')
  .split(/\s+(?:but|because|so that|before|after|then|while|and (?:ask|look|use|press|go))\b/iu, 1)[0].trim();
const pronoun = /^(?:it|this|that|them|the same (?:thing|one))(?: again| down)?$/iu;
const control = /\b(?:marks?|buttons?|switch(?:es)?|rings?|notches?|levers?|seams?|controls?|dials?|symbols?|grooves?|latches?|clasps?)\b/iu;
const tech = /\b(?:portal|generator|reactor|machine|battery|radio|ship|power|nexus|station|computer|signal|antenna|circuit|engine|robot)\b/iu;
const malfunction = /\b(?:fail(?:s|ed|ing|ure)?|ruptur(?:e|ed|ing)|broken|jammed|damaged|malfunction\w*|power loss|outage|won['’]t (?:start|work))\b/iu;
const peril = /\b(?:flood(?:ed|ing)?|fire|smoke|falling|collaps(?:e|ing)|storm|trapp(?:ed|ing)|freez(?:e|ing)|frozen|avalanche|leak|ruptur(?:e|ing)|sinking|tide|water)\b/iu;
const social = /\b(?:negotiat\w*|guard|council|accus\w*|treaty|trial|arrest\w*|refus\w*|mayor|dealer|debate|blockade|thief|criminals?)\b/iu;
const objectPattern = /\b(?:holding|carrying|find|found|there (?:is|lies)|(?:i|we) (?:have|brought)|with)\s+((?:a|an|the|my)\s+[^.,;!?]+?)(?=[.,;!?]|\s+and\b|$)/iu;
const obstaclePattern = /\b((?:a|an|the)\s+(?:(?:broken|jammed|blocked|locked|flooded|failing|ruptured|malfunctioning|missing|damaged|collapsed|burning|sinking)\s+[^.,;!?]+?(?=\s+(?:and|but|is|has|needs|requires|with|before|while)\b|[.,;!?]|$)|[^.,;!?]{1,48}?(?=\s+(?:is|has(?: begun to)?|won’t|won't|began to|starts? to)\s+(?:broken|locked|blocked|missing|failing|jammed|collapsed|on fire|ruptur|opening|work|start))))/iu;
const placePattern = /\b(?:at|inside|within|on|in)\s+([^.,;!?]+?)(?=[.,;!?]|\s+(?:with|and we|as (?:the|a)|where)\b|$)/iu;
const namePattern = /\b(?:(?:with|beside|accompanied by|companion is|partner is|named|called)\s+)([\p{Lu}][\p{L}'’-]*(?:\s+[\p{Lu}][\p{L}'’-]*){0,2})/u;
const explicitGoal = /\b(?:we (?:need|have|want) to|my goal is to|our goal is to|i (?:need|want) to)\s+([^.!?;]+)/iu;
const companionPattern = /\b(?:with|beside|accompanied by)\s+((?:a|an|the|my)\s+[^.,;!?]+?)(?=\s+(?:and\s+(?:i|we)|as|who|named|called|while)\b|[.,;!?]|$)/iu;

const profiles = {
  tech: {
    issue: 'the instability', device: 'a diagnostic coupler', control: 'a recessed ring around a small mark',
    clue: 'A second contact runs from the ring to the exposed edge.',
    function: 'It can carry a short transfer pulse and hold the load long enough to bridge an interrupted connection.',
    effect: 'A short pulse travels through it. The fault eases for a heartbeat, then returns when the pulse dies.',
    cause: 'The pulse can cross the break. We need to hold that connection long enough for it to catch.',
    warnings: ['The next surge cuts off the safest route back.', 'A surge knocks out the system’s automatic safeguards.',
      'The next surge keeps the safeguards down. Someone will have to hold the unstable side manually.'],
    stakes: 'If this keeps up, we lose our way back.',
    baseline: 'We still need to find what’s stopping it from working.',
    solve: 'This time the connection holds. The interruption stops and power stays up.',
  },
  peril: {
    issue: 'the unsafe passage', device: 'a loose length of line', control: 'a hidden fastening point',
    clue: 'The fastening point is braced on the side that has held so far.',
    function: 'It can take the strain on the weak side long enough for someone to get through.',
    effect: 'For a moment the strain shifts away from the weak point. It returns when you let go.',
    cause: 'Something on the sound side can take the load. We just need a way to keep it there.',
    warnings: ['The safe space shrinks by another step.', 'The easiest crossing gives way.',
      'The remaining route shifts again. Someone will have to steady it while the other person moves.'],
    stakes: 'We’re running out of room to work.',
    baseline: 'There is a safe side and an unstable one. The unstable side is spreading.',
    solve: 'The weak side gives way, but the support takes the load. You have a safe route before it can shift again.',
  },
  social: {
    issue: 'the standoff', device: 'a piece of physical evidence', control: 'a identifying mark',
    clue: 'The mark fixes its origin to someone who had access before the dispute began.',
    function: 'It gives you something the people involved can check for themselves.',
    effect: 'The people involved disagree about the meaning of it, but both sides recognize the mark.',
    cause: 'We need to give them a practical reason to verify it with us.',
    warnings: ['One of the people who could verify it starts to leave.', 'The witness leaves without agreeing to come back.',
      'The people still here insist that somebody neutral verify your account before they act.'],
    stakes: 'If they walk out, we lose a witness.',
    baseline: 'Both sides are holding their positions. One detail they can verify could change that.',
    solve: 'The people involved check the evidence for themselves. The objection that kept you stuck is withdrawn.',
  },
  mystery: {
    issue: 'the missing piece of the story', device: 'a scrap bearing a distinctive mark', control: 'a narrow line hidden under the edge',
    clue: 'Its pattern repeats somewhere it could only have been left on purpose.',
    function: 'It preserves a distinctive trace you can compare with the place or thing it came from.',
    effect: 'The comparison produces the same pattern. You have a match, but the direction is still uncertain.',
    cause: 'There is a connection. If we can establish which came first, it leads somewhere.',
    warnings: ['A new arrival is about to disturb the clearest trace.', 'The clearest part of the trace is disturbed.',
      'Only the edges of the trace remain. You will need a second pair of eyes or a way to work from what you saved.'],
    stakes: 'We can still follow it if we act before it’s gone.',
    baseline: 'One detail suggests that something was moved or withheld. You still have a chance to check it.',
    solve: 'The details line up when you put them together. In the direction they point, something previously hidden comes into view.',
  },
};

function item(name, facts = {}) {
  const label = noun(name).replace(/^(?:my|a|an)\s+/iu, 'the ');
  return { name: label, examined: false, control: false, tested: false, carried: false, function: '', ...facts };
}

function capabilityFor(prop, profile) {
  if (/\b(?:mirror|lens|prism|reflector)\b/iu.test(prop.name)) return 'It can redirect light without having to move the source.';
  if (/\b(?:rope|chain|line|strap|cord)\b/iu.test(prop.name)) return 'It can hold tension if you have something solid to anchor it to.';
  if (/\b(?:wire|cable|jumper)\b/iu.test(prop.name)) return 'It can connect two points that have come apart.';
  if (/\b(?:wedge|boat hook|crowbar|lever)\b/iu.test(prop.name)) return 'It gives you leverage against something you could not move or hold by hand.';
  if (/\b(?:receipt|logbook|ledger|letter|map)\b/iu.test(prop.name)) return 'The record gives you a detail you can check against someone’s account.';
  return profile.function;
}

function familyFor(premise, problem) {
  if (isArena(premise)) return 'arena';
  if (malfunction.test(problem) && tech.test(problem)) return 'tech';
  if (!problem && premise.split(/[.!?;]/u).some(clause => tech.test(clause) && malfunction.test(clause) &&
      !/\brobot\s+dog\b/iu.test(clause))) return 'tech';
  if (peril.test(premise)) return 'peril';
  if (social.test(premise)) return 'social';
  return problem || /\b(?:mystery|disappear(?:ed|ance)?|vanished|investigat\w*|stolen|strange clues?)\b/iu.test(premise) ? 'mystery' : 'grounded';
}

export function openStory(input, draft = {}) {
  const premise = typeof input === 'string' ? input.trim().slice(0, 4000) : '';
  if (!premise) throw new Error('Describe how your story begins.');
  const clauses = premise.split(/[.!?;\n]+/u);
  const explicit = noun(draft.obstacle || clauses.slice(1).reverse().map(clause => obstaclePattern.exec(clause)?.[1]).find(Boolean) ||
    obstaclePattern.exec(premise)?.[1] || '').replace(/^(?:a|an|the)\s+/iu, 'the ');
  const family = familyFor(premise, explicit);
  const arena = family === 'arena' ? emptyArena(premise) : undefined;
  const pursuit = arena ? null : extractPursuit(premise);
  const companion = noun(companionPattern.exec(premise)?.[1] || '').replace(/^(?:a|an|my)\s+/iu, 'the ');
  const npc = clean(draft.npc) || namePattern.exec(premise)?.[1] ||
    premise.match(/\b([\p{Lu}][\p{L}'’-]+(?: [\p{Lu}][\p{L}'’-]+)?)\s+(?=says\b|asks\b|stands beside me\b|and I\b)/u)?.[1] ||
    premise.match(/^[“"']?([\p{Lu}][\p{L}'’-]+(?: [\p{Lu}][\p{L}'’-]+)?),\s/u)?.[1] ||
    premise.match(/,\s+([\p{Lu}][\p{L}'’-]+(?: [\p{Lu}][\p{L}'’-]+)?)[?!]\s*$/u)?.[1] ||
    'Your companion';
  const place = noun(draft.place || placePattern.exec(premise)?.[1] || '');
  const problem = arena ? 'the upcoming match' : explicit || (pursuit ? 'finding ' + pursuit.item : profiles[family]?.issue) || '';
  const tool = noun(draft.object || (arena || family === 'grounded' ? '' : objectPattern.exec(premise)?.[1]) || '');
  const goal = clean(draft.goal || explicitGoal.exec(premise)?.[1] || '');
  return {
    version: 1, revision: 4, title: clean(draft.title, 60) || cap(place || 'Untitled story'), premise, npc, place, companion, arena, pursuit,
    problem, goal, family, focus: tool ? item(tool).name : '', chapter: 1, progress: 0, pressure: 0, idle: 0,
    trust: false, resolved: false, turns: 0, items: tool ? [item(tool)] : [], facts: [],
    lead: '', lastOutcome: '', lastEvent: '', tried: [], recent: [], secret: clean(draft.secret, 280),
  };
}

function findItem(state, text, exact = false) {
  const wanted = key(text);
  if (!wanted) return;
  const known = state.items.find(prop => key(prop.name) === wanted);
  if (known || exact) return known;
  return state.items.slice().reverse().find(prop => {
    const term = key(prop.name);
    return term.length > 3 && (' ' + wanted + ' ').includes(' ' + term + ' ');
  });
}

function focusFor(state, raw) {
  const text = noun(raw);
  if (!text || pronoun.test(text) || /^(?:around|closer|more|for clues|again)$/iu.test(text)) return state.focus;
  const known = findItem(state, text);
  return known?.name || text;
}

function controlOwner(state, raw) {
  const attachment = raw.match(/\b(?:on|of|in|along)\s+(.+)/iu)?.[1];
  if (attachment) return focusFor(state, attachment);
  return control.test(raw) && state.focus ? state.focus : focusFor(state, raw);
}

function classify(state, input) {
  const text = clean(input, 2700);
  const tail = text.split(/(?<=[.!?])\s+/u).at(-1);
  const main = /^(?:i\s+(?:try to |want to )?\w+|who\b|what\b|how\b|where\b)/iu.test(tail) ? tail : text;
  const simple = main.replace(/^[“"'*]+/u, '').replace(/^(?:i\s+(?:(?:quickly|carefully|slowly) |try to )?|let’s |let's )/iu, '');
  const question = /\?\s*[”"']?$/u.test(main);
  const present = (intent, fields = {}) => ({ intent, text, ...fields });
  let match;
  if (/^(?:remember|recap)\b/iu.test(simple) ||
      (question && /(?:what|which) (?:did we (?:learn|find|discover)|was (?:that|the clue)|do we know)|(?:last time|so far)\b/iu.test(simple))) return present('recall');
  if (/\b(?:status|update me|what(?:’s|'s| is) happening|what happened|how bad|where (?:are|were) we)\b/iu.test(simple) && (question || !/^(?:examine|look|use)\b/iu.test(simple))) return present('status');
  if ((match = simple.match(/^(?:what (?:does|can|could)\s+(.+?)\s+(?:do|be used for)|how (?:does|do)\s+(.+?)\s+(?:work|operate)|how (?:do|can) (?:i|we|you) use\s+(.+?))\s*[?!.]*$/iu))) {
    return present('explain', { target: focusFor(state, match[1] || match[2] || match[3]) });
  }
  if ((match = simple.match(/^(?:look(?:ing)?(?:\s+(?:for|at|inside|around))?|search(?:\s+for)?|examine|inspect|read|scan|study|check|investigate|listen to|take a closer look at)\b\s*(.*)/iu))) {
    const seekControl = control.test(match[1]);
    return present('inspect', { target: seekControl ? controlOwner(state, match[1]) : focusFor(state, match[1]), control: seekControl });
  }
  if ((match = simple.match(/^(?:use|plug|connect|bridge|tie|compare|match|press|push|pull|activate|switch|tap|turn|trigger|hold|test|apply|insert|wedge|prop|brace|reflect|aim|angle|short|ground|divert|reroute|route|thread|wrap|jam|block|shield|draw|offer up)\b\s*(.*)/iu))) {
    const operation = match[0].match(/^\S+/u)[0].toLowerCase();
    const raw = noun(match[1]);
    const parts = raw.split(/\s+(?:against|onto|into|around|through|over|across|with|on|to|for|as)\s+/iu);
    const kind = /^(?:press|push|pull|tap|turn|trigger|activate|switch|test)$/u.test(operation);
    const target = kind && control.test(raw) ? controlOwner(state, raw) : focusFor(state, parts[0]);
    return present('use', { target, operation, control: kind && control.test(raw), relation: parts.length > 1, method: noun(simple), destination: noun(parts.slice(1).join(' ')) });
  }
  if ((match = simple.match(/^(?:(?:try|help)(?:\s+(?:you|us|to|me))?\s+)?(?:repair|fix|seal|restore|rescue|stop|open|unlock|disable|solve|free|evacuate|calm|convince|prove|stabilize|close|recover|find)\b.*/iu))) {
    return present('solve', { method: noun(match[0]) });
  }
  if ((match = simple.match(/^(?:take|bring|escort|lead|move|guide)\s+(.+?)\s+(?:(?:to|into)\s+(.+)|(there)[.!]?)$/iu)) &&
      !/\s+up$/iu.test(match[1])) {
    const destination = match[3] ? state.lastLocationAnswer : noun(match[2]);
    if (destination) return present('travel', { destination, escort: noun(match[1]), through: false });
  }
  if ((match = simple.match(/^(?:go|walk|run|step|swim|fly|travel|move|head|return|cross|enter|follow)\b\s*(.*)/iu))) {
    const target = noun(match[1].replace(/^(?:over\s+)?(?:to|through|into|towards?|across|back to)\s+/iu, ''));
    const destination = /^(?:there|over there)$/iu.test(target) ? state.lastLocationAnswer : target;
    return present('travel', { destination, through: /\b(?:through|cross|enter)\b/iu.test(simple) });
  }
  if ((match = simple.match(/^(?:take|grab|pocket|pick up|collect|retrieve)\s+(.+)/iu))) return present('take', { target: focusFor(state, match[1]) });
  if (/^(?:offer|share|promise|give|ask (?:.+?\s+)?(?:to help|for help)|help\b|show\b|invite\b|trade|bargain)\b/iu.test(simple)) return present('offer');
  if (/^(?:wait|pause|stall|stay quiet|watch|do nothing|stand still)\b/iu.test(simple)) return present('wait');
  if ((match = main.match(/^(?:i\s+(?:notice|realize|remember|reveal|introduce a detail\s*:|tell (?:\S+\s+){0,3}that)|we\s+(?:discover|learn)|it turns out|fact\s*[:—])\s*(.+)/iu))) {
    return present('declare', { subject: clean(match[1].replace(/^that\s+/iu, ''), 240) });
  }
  if ((match = simple.match(/\babout\s+([^.!?]+)|^(?:who|why|where|when|how|what)\s+([^.!?]+)/iu)) &&
      (question || /^(?:tell me|remind me|explain)\b/iu.test(simple))) {
    const subject = noun(match[1] || match[2]);
    const topic = pronoun.test(subject) ? state.focus : subject;
    const remembered = memoriesFor(state, topic);
    return present(remembered.length ? 'recall' : 'question', { subject: topic, remembered });
  }
  const vocative = text.match(/^([\p{Lu}][\p{L}'’-]*(?:\s+[\p{Lu}][\p{L}'’-]*){0,2}),/u)?.[1];
  return present('talk', { vocative, subject: question ? noun(simple) : '' });
}

function fact(state, text) {
  const value = sentence(clean(text, 325));
  if (!state.facts.includes(value)) state.facts = [...state.facts.slice(-39), value];
}

function isRelated(text, value) {
  const tokens = key(value).split(' ').filter(token => token.length >= 4);
  const input = new Set(words(text));
  return tokens.some(token => input.has(token));
}

const queryWords = new Set(['about', 'could', 'does', 'happen', 'learn', 'tell', 'there', 'they', 'what', 'where', 'which', 'would']);

function memoriesFor(state, topic) {
  const terms = new Set(key(topic).split(' ').filter(word => word.length >= 4 && !queryWords.has(word)));
  if (!terms.size) return [];
  return state.facts.map((value, index) => ({
    value, index, hits: [...new Set(words(value))].filter(word => terms.has(word)).length,
  })).filter(entry => entry.hits > 0).sort((left, right) => right.hits - left.hits || right.index - left.index)
    .slice(0, 3).sort((left, right) => left.index - right.index).map(entry => entry.value);
}

function safeState(state) {
  if (!state || state.version !== 1 || (!Object.hasOwn(profiles, state.family) && !['arena', 'grounded'].includes(state.family)) ||
      !Number.isSafeInteger(state.chapter) || state.chapter < 1 || !Number.isSafeInteger(state.turns) ||
      !['focus', 'npc', 'problem', 'premise', 'place', 'goal', 'lead', 'lastOutcome'].every(k => typeof state[k] === 'string') ||
      !Array.isArray(state.facts) || !state.facts.every(value => typeof value === 'string') ||
      !Array.isArray(state.tried) || !Array.isArray(state.recent) || !Array.isArray(state.items) || state.items.length > 32 ||
      state.items.some(prop => !prop || typeof prop.name !== 'string' || typeof prop.function !== 'string')) {
    throw new Error('The saved story state could not be read.');
  }
  if (state.family === 'arena' && (!state.arena || !Array.isArray(state.arena.attacks) ||
      !['outside', 'fight', 'finished'].includes(state.arena.phase) ||
      !['rival', 'venue', 'style', 'last', 'outcome'].every(field => typeof state.arena[field] === 'string'))) {
    throw new Error('The saved encounter could not be read.');
  }
  if (state.family !== 'arena' && isArena(state.premise)) {
    throw new Error('This story was opened under the earlier rules. Select Replay story to replay your moves in a separate copy.');
  }
  const world = structuredClone(state);
  if (world.revision !== 4) {
    world.recent = [];
    world.revision = 4;
    if (world.family !== 'arena' && !world.pursuit) {
      world.pursuit = extractPursuit(world.premise);
      if (world.pursuit && !world.problem) world.problem = 'finding ' + world.pursuit.item;
      const address = world.premise.match(/,\s+([\p{Lu}][\p{L}'’-]+(?: [\p{Lu}][\p{L}'’-]+)?)[?!]\s*$/u)?.[1];
      if (address && world.npc === 'Your companion') world.npc = address;
    }
  }
  return world;
}

export function prepareStory(payload, protocol) {
  const begin = !payload.state;
  const world = begin ? openStory(payload.premise, payload.setup) : safeState(payload.state);
  const profile = profiles[world.family] || profiles.mystery;
  const act = begin ? { intent: 'begin', text: '' } :
    world.family === 'arena' ? classifyArena(world, payload.message) :
      classifyPursuit(world, payload.message) || classify(world, payload.message);
  if (world.npc === 'Your companion') {
    const vocative = act.vocative || act.text.match(/^([\p{Lu}][\p{L}'’-]*(?:\s+[\p{Lu}][\p{L}'’-]*){0,2}),/u)?.[1];
    if (vocative) world.npc = vocative;
  }
  const check = begin ? null : interpretCheck(world, payload.message, act);
  if (check) return {
    context: { world, profile, act, begin, check },
    prompt: makePrompt(world, checkFlags(check), protocol),
  };
  if (world.family === 'arena') {
    const flags = ['intent:' + act.intent, ...arenaFlags(world, act), ...(world.facts.length ? ['memory'] : [])];
    return { context: { world, profile, act, begin }, prompt: makePrompt(world, flags, protocol) };
  }
  // A request to move the story on after resolving a conflict is a transition,
  // while a recap, inspection, or named destination can still stay in the aftermath.
  const advance = world.resolved && (act.intent === 'wait' || /\b(?:continue|what (?:happens|comes) (?:now|next)|what now|what['’]s next)\b/iu.test(act.text));
  if (advance) {
    const flags = world.family === 'tech' ? ['handoff', 'tech'] : ['handoff'];
    return { context: { world, profile, act, begin }, prompt: makePrompt(world, flags, protocol) };
  }
  const existing = act.target ? findItem(world, act.target) : undefined;
  const prop = existing || (act.target ? item(act.target) : null);
  const signature = key(act.text);
  const repeat = world.tried.includes(signature);
  const toolKnown = prop?.examined || prop?.tested || prop?.function;
  const workingGoal = world.chapter === 1 ? world.goal : '';
  const grounded = world.family === 'grounded';
  const credibleUse = !world.resolved && !grounded && act.intent === 'use' && act.relation && (act.destination && [world.problem, world.lead, workingGoal].some(value => isRelated(act.destination, value))) &&
    (toolKnown || world.progress >= 1 || /\bas (?:an? |the )?\w+/iu.test(act.text)) &&
    !/\b(?:what if|pretend|assume|wish|not|don't|don’t|never)\b/iu.test(act.text);
  const directSolve = !world.resolved && act.intent === 'solve' && world.progress >= 2 && (isRelated(act.text, world.problem) || isRelated(act.text, workingGoal) ||
    (world.family === 'social' && world.trust && world.items.some(entry => entry.tested && isRelated(act.text, entry.name))) ||
    /\b(?:it|this|stabilize|fix)\b/iu.test(act.text));
  const support = world.trust || /\b(?:together|backup|brace|anchor|support|second person|two people|neutral witness)\b/iu.test(act.text);
  const exposed = world.pressure >= 3 && !support && (credibleUse || directSolve);
  const fit = Boolean((credibleUse || directSolve) && !exposed);
  const productive = fit || (act.intent === 'inspect' && prop && (!prop.examined || (act.control && !prop.control))) ||
    (act.intent === 'use' && prop && !prop.tested) || (act.intent === 'solve' && !repeat) ||
    (act.intent === 'offer' && !world.trust) || act.intent === 'declare' || (act.intent === 'travel' && !repeat);
  const unknown = act.intent === 'talk' || (world.resolved && act.intent === 'solve');
  const urgent = !grounded && !begin && act.intent === 'wait' && world.idle >= 2 && world.pressure < 3;
  const flags = ['intent:' + act.intent];
  for (const [flag, active] of Object.entries({
    target: (!grounded || act.intent === 'take') && prop, subject: !grounded && act.subject, interface: act.control, examined: prop?.examined,
    'control-known': prop?.control, tested: prop?.tested, fit, exposed, destination: act.destination, carried: prop?.carried,
    blocked: !grounded && act.through && !world.resolved && world.progress < 2, trust: world.trust, pressure: world.pressure > 0,
    urgent, tech: world.family === 'tech', memory: world.facts.length,
    'no-conflict': grounded, pursuit: world.pursuit, unrecognized: unknown,
  })) if (active) flags.push(flag);
  if (grounded && ['status', 'solve', 'offer', 'wait'].includes(act.intent)) flags.shift();
  const context = { world, profile, act, prop, existing, signature, productive, begin };
  return { context, prompt: makePrompt(world, flags, protocol) };
}

function makePrompt(world, flags, protocol) {
  const previous = world.recent.filter(id => Number.isInteger(id) && Object.hasOwn(protocol.fragments, id)).slice(-12);
  return [protocol.bos, ...flags.map(flag => protocol.signals[flag]).filter(Number.isInteger), ...previous, protocol.turn];
}

function rememberProp(context) {
  const { world, prop, existing } = context;
  if (!prop) return;
  if (!existing) world.items = [...world.items.slice(-31), prop];
  world.focus = prop.name;
}

function continuation(event, world, profile) {
  const old = world.problem;
  if (event === 'next-signal') return {
    problem: 'the source of the answering signal',
    prose: 'The restored system picks up a reply from somewhere beyond its normal range.',
    lead: 'Whatever answered knew exactly when the system came back. We can trace it before it drops out.',
    stakes: 'The reply won’t stay clear for long.',
  };
  if (event === 'next-witness') return {
    problem: 'the witness who left a warning',
    prose: 'Someone who had been keeping out of sight leaves a hurried warning and slips away.',
    lead: 'The warning mentions the trouble we just dealt with. Whoever wrote it knows how it started.',
    stakes: 'We can still catch up with the only person who has offered an explanation.',
  };
  return {
    problem: 'the displaced load',
    prose: 'A disturbance starts elsewhere at the exact moment ' + old + ' settles.',
    lead: world.family === 'tech' ? 'Some of the old load went somewhere else. Follow where it went before it builds up again.' :
      'Something nearby took the force of what we just changed. We can trace it back from here.',
    stakes: profile.stakes,
  };
}

export function finishStory(context, event, prose, fragmentIds) {
  const { world, profile, act, prop, signature, productive, begin } = context;
  if (context.check) {
    if (!event.startsWith('check-')) throw new Error('The model did not complete the check. Try the turn again.');
    const result = applyCheck(world, context.check, event, text => fact(world, text));
    return renderReply(world, event, prose, fragmentIds, { checkBody: result.body }, result.check);
  }
  if (event.startsWith('arena-')) {
    const { line, hint } = applyArena(world, event, act, text => fact(world, text));
    return renderReply(world, event, prose, fragmentIds, {
      arenaLine: line, arenaHint: hint, premise: sentence(world.premise),
    }, actionResult(event, world, act));
  }
  if (event.startsWith('pursuit-')) {
    const { line, hint } = applyPursuit(world, event, act, text => fact(world, text));
    return renderReply(world, event, prose, fragmentIds, { pursuitLine: line, pursuitHint: hint }, actionResult(event, world, act));
  }
  const previousLead = world.lead;
  const discovery = prop?.control ? cap(profile.control) + ' is set into ' + prop.name + '. ' + profile.clue : profile.clue;
  const attempt = act.method || ((world.chapter === 1 && world.goal) || 'deal with ' + world.problem);
  let observation = discovery;
  let effect = profile.effect;
  let inference = profile.cause;
  let lead = world.lead || 'Find something in the scene we can check against the problem.';
  let status = world.lastOutcome || profile.baseline;
  let next;
  let declaration = '';
  let resolution = '';
  const warning = profile.warnings[Math.min(world.pressure, profile.warnings.length - 1)];
  const test = prop?.control || act.control ? 'Try the marked control and watch what changes.' : 'A small test should show whether it’s connected.';
  if (event === 'wait') {
    if (world.idle % 2 === 0) status = world.pressure > 0
      ? 'The earlier damage holds. ' + cap(world.problem) + ' still stands between you and a way forward.'
      : 'For now, ' + world.problem + ' gives you time to plan.';
    else status = 'Nothing changes in your favor. Another delay could cost you an option.';
  }
  if (event !== 'escalate' && productive) world.idle = 0;
  else if (!begin && act.intent === 'wait') world.idle++;
  if (signature) world.tried = [...world.tried.slice(-24), signature];
  if (prop && ['explain', 'interface', 'learn', 'revisit', 'test', 'repeat-test', 'take', 'carried', 'resolve'].includes(event)) rememberProp(context);
  if (event === 'explain' && prop) {
    prop.function ||= capabilityFor(prop, profile);
    fact(world, cap(prop.name) + ' — ' + prop.function);
  }
  if (event === 'learn' || event === 'interface') {
    prop.examined = true;
    prop.control ||= event === 'interface';
    prop.function ||= capabilityFor(prop, profile);
    observation = event === 'interface'
      ? 'You find ' + profile.control + ' on ' + prop.name + '. ' + profile.clue
      : 'On ' + prop.name + ', you find ' + (world.family === 'tech' ? 'a faint trace leading to a contact. It ends at a small plate.' : 'a trace that connects it to the trouble. ' + profile.clue);
    prop.observation = observation;
    world.progress = Math.max(world.progress, 1);
    world.lead = lead = test;
    fact(world, observation);
  }
  if (event === 'revisit' && prop) observation = prop.observation || discovery;
  if (event === 'test' || event === 'repeat-test') {
    prop.tested = true;
    prop.function ||= capabilityFor(prop, profile);
    world.progress = Math.max(world.progress, 2);
    world.lead = lead = inference;
    world.lastOutcome = effect;
    fact(world, effect);
  }
  if (event === 'partial') {
    world.progress = Math.max(world.progress, 1);
    world.lead = lead = 'Find what the weak point responds to. A deliberate test should narrow it down.';
    fact(world, 'An attempt to ' + attempt + ' exposed where ' + world.problem + ' is weakest');
  }
  if (event === 'compromised') {
    world.lead = lead = 'We can still use that plan. Ask for help or build some support into it first.';
    fact(world, 'The last attempt was stopped by the worsening conditions');
  }
  if (event === 'resolve') {
    world.resolved = true;
    world.progress = 3;
    resolution = profile.solve;
    world.lastOutcome = resolution;
    world.lead = lead = 'We have a moment. We can see what changed now that the immediate problem is dealt with.';
    fact(world, cap(world.problem) + ' was dealt with when you chose to ' + attempt);
  }
  if (event === 'approach') {
    world.place = act.destination;
    fact(world, 'You reached ' + world.place);
    if (act.escort) fact(world, 'You led ' + act.escort + ' to ' + world.place);
  }
  if (event === 'take' && prop) {
    prop.carried = true;
    world.lastAcquired = prop.name;
    fact(world, 'You took ' + prop.name);
  }
  if (event === 'offer' || event === 'agreement') {
    world.trust = true;
    world.lead = lead = 'I’ll watch for a reaction while you try something.';
    fact(world, world.npc + ' agreed to help');
  }
  if (event === 'declare') {
    declaration = sentence(cap(act.subject));
    fact(world, declaration);
    const newPursuit = (!world.pursuit || world.pursuit.stage === 'used') && extractPursuit(act.subject);
    if (newPursuit) {
      world.pursuit = newPursuit;
      if (!world.problem || world.resolved) world.problem = 'finding ' + newPursuit.item;
      world.lead = lead = 'We can start by looking for ' + newPursuit.item + '.';
    } else if (act.subject.length > 10 && world.problem) {
      world.lead = lead = 'We can test that against ' + world.problem + '.';
    } else {
      lead = 'I’ll keep that in mind.';
    }
  }
  if (event === 'escalate') {
    world.pressure++;
    world.idle = 0;
    world.lastOutcome = warning;
    world.lead = lead = 'Let’s act before we lose another option.';
    fact(world, warning);
  }
  if (event.startsWith('next-')) {
    next = continuation(event, world, profile);
    world.chapter++;
    world.problem = next.problem;
    world.progress = 0;
    world.pressure = 0;
    world.idle = 0;
    world.resolved = false;
    world.lastOutcome = next.prose;
    world.lead = next.lead;
    // Older objects stay in the story, but conclusions about the first obstacle
    // don't prove anything about the next one.
    world.items = world.items.map(entry => ({ ...entry, tested: false }));
    fact(world, next.prose);
  }
  if (event === 'status' && !world.lastOutcome) status = cap(world.problem) + ' is the immediate problem. ' + status;
  if (event === 'status' && world.secret && !world.lastOutcome) status += ' ' + sentence(world.secret);
  if (event === 'status' && world.chapter === 1 && world.goal && !world.resolved) status += ' You still need to ' + world.goal.replace(/[.!?]+$/u, '') + '.';
  const memory = (act.remembered?.length ? act.remembered : world.facts.slice(-4)).join('\n\n');
  const help = world.npc === 'Your companion' ? 'They take the exposed side so you can work.' : world.npc + ' takes the exposed side so you can work.';
  const slots = {
    npc: world.npc, premise: sentence(world.premise), problem: world.problem, status, stakes: profile.stakes,
    warning, warningLower: lower(warning), target: prop?.name || world.focus || profile.device,
    targetCap: cap(prop?.name || world.focus || profile.device), capability: prop?.function || profile.function,
    hint: world.progress >= 1 && previousLead ? '“' + previousLead + '”' : '',
    memory: memory || status, subject: act.subject || 'that', observation, inference, effect, test,
    lead, method: act.method || 'a small test', attempt, setback: world.lastOutcome || 'Your attempt exposes the weak point, but the main problem holds.',
    resolution, handoff: 'The immediate danger has passed. Something else is moving now.',
    destination: act.destination || world.place, arrival: act.escort ?
      'You lead ' + act.escort + ' in with you.' : 'You stop long enough to see what changed from this side.',
    help, helpLower: lower(help), declaration,
    continuation: next?.prose, continuationLower: lower(next?.prose), newProblem: next?.problem,
    newLead: next?.lead, newStakes: next?.stakes,
    grounded: world.family === 'grounded' ? (act.intent === 'begin'
      ? (world.pursuit ? 'First you need ' + world.pursuit.item + '.' :
        world.npc === 'Your companion' ? (world.companion ? cap(world.companion) + ' is beside you.' : '') : world.npc + ' is here with you.')
      : groundedReply(world, act)) : '',
    clarification: clarifyAction(world, act),
  };
  return renderReply(world, event, prose, fragmentIds, slots, actionResult(event, world, act));
}

function groundedReply(world, act) {
  const who = world.npc === 'Your companion' ? cap(world.companion || 'your companion') : world.npc;
  if (act.intent === 'question' || act.intent === 'explain') {
    const subject = act.subject || act.target;
    if (subject) return '“I’d need to see a little more before I could tell you about ' + subject + ',” ' + who + ' says.';
  }
  if (act.intent === 'status') return world.place ? 'You are still at ' + world.place + '. ' + who + ' is beside you.' : who + ' is beside you.';
  if (act.intent === 'wait') return 'You take a moment at ' + (world.place || 'your current spot') + '. Nothing interrupts the pause.';
  return clarifyAction(world, act);
}

function clarifyAction(world, act) {
  const who = world.npc === 'Your companion' ? cap(world.companion || 'your companion') : world.npc;
  if (world.resolved && act.intent === 'solve') return 'That problem is already resolved. ' + world.lastOutcome;
  if (world.pursuit) {
    const p = world.pursuit;
    if (p.stage === 'used') return 'You’ve used ' + p.item + '. What do you want to do with the time that bought you?';
    if (p.source) return 'You have a lead at ' + p.source + '. ' + (p.clue || 'Do you follow it?');
    return '“We’re looking for ' + p.item + ',” ' + who + ' says. “Where should we start?”';
  }
  if (world.lastEvent === 'clarify-action') return world.problem
    ? 'The situation is still ' + world.problem + '. You can pick a person, an object, or a place to act on.'
    : 'Tell me what your character does next, and where or with whom.';
  return 'I’m not sure which action to play out. What does your character try, and what are they acting on?';
}

const successEvents = new Set(['learn', 'interface', 'revisit', 'resolve', 'approach', 'offer', 'agreement',
  'take', 'carried', 'arena-enter', 'arena-hit', 'arena-bite', 'arena-boost', 'arena-axe', 'arena-reverse',
  'arena-reverse-unknown', 'arena-read', 'arena-tactic', 'arena-yield', 'arena-win', 'pursuit-inspect']);
const partialEvents = new Set(['test', 'repeat-test', 'partial', 'arena-feedback', 'pursuit-source']);
const failureEvents = new Set(['blocked', 'compromised', 'arena-counter', 'arena-repeat-bite']);

function actionResult(event, world, act) {
  let outcome;
  if (successEvents.has(event)) outcome = 'success';
  if (partialEvents.has(event)) outcome = 'partial';
  if (failureEvents.has(event)) outcome = 'failure';
  if (event === 'pursuit-obtain') outcome = world.pursuit.stage === 'held' ? 'success' : 'failure';
  if (event === 'pursuit-use') outcome = world.pursuit.stage === 'used' ? 'partial' : 'failure';
  if (event === 'arena-ended' && act.destination) outcome = 'success';
  return outcome ? { type: 'action', outcome } : undefined;
}

function renderReply(world, event, prose, fragmentIds, slots, check) {
  world.turns++;
  world.lastEvent = event;
  if (check?.type === 'action') world.lastActionOutcome = check.outcome;
  world.recent = [...world.recent, ...fragmentIds].slice(-8);
  const reply = prose.replaceAll('\u2063', '').replace(/⟦[^⟧]+⟧/u, '')
    .replace(/\{([A-Za-z]+)\}/gu, (_, slot) => slots[slot] ?? '')
    .split('\n\n').map(value => value.trim()).filter(Boolean).join('\n\n');
  return { world, reply, event, ...(check ? { check } : {}) };
}
