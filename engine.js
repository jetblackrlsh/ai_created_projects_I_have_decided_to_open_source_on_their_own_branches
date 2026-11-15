(function (global) {
  'use strict';

  const STOPWORDS = new Set([
    'i', 'me', 'my', 'mine', 'we', 'our', 'you', 'your', 'the', 'a', 'an',
    'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'into', 'onto',
    'and', 'or', 'but', 'so', 'then', 'try', 'attempt', 'want', 'going', 'use',
    'using', 'that', 'this', 'it', 'its', 'them', 'they', 'their', 'him', 'her'
  ]);

  const SYNONYM_GROUPS = [
    ['sneak', 'stealth', 'hide', 'creep', 'shadow', 'quiet', 'silent', 'slip', 'tiptoe'],
    ['fight', 'attack', 'hit', 'strike', 'punch', 'kick', 'slash', 'shoot', 'stab', 'brawl', 'smash', 'break'],
    ['talk', 'persuade', 'charm', 'bluff', 'lie', 'convince', 'negotiate', 'intimidate', 'bribe', 'sweet'],
    ['climb', 'jump', 'leap', 'dodge', 'roll', 'flip', 'vault', 'acrobat', 'run', 'sprint', 'dash'],
    ['lock', 'pick', 'hack', 'tinker', 'repair', 'wire', 'gadget', 'mechanism', 'trap', 'disable', 'open', 'pry'],
    ['search', 'look', 'inspect', 'investigate', 'read', 'study', 'spot', 'track', 'listen', 'sense'],
    ['magic', 'spell', 'cast', 'arcane', 'ritual', 'enchant', 'summon', 'channel', 'curse', 'ward']
  ];

  // Coherent, grounded Scene Sparks (no nonsensical verb+noun mashups)
  const SCENE_SPARKS = [
    'A locked strongbox sits unattended in an empty room, its keyhole freshly scratched.',
    'An urgent, sealed message is delivered to you—addressed to someone else.',
    'A distant bell or alarm starts ringing, and people nearby begin hurrying toward the exits.',
    'You notice fresh footprints leading into a place that is supposed to be abandoned.',
    'A power outage, sudden fog, or blown-out lantern plunges the area into dim shadow.',
    'Two factions are arguing in hushed, tense voices just around the corner.',
    'Something valuable you need is being loaded onto a departing carriage, ship, or transport.',
    'A trusted contact fails to show up at the meeting spot, leaving only a small clue behind.',
    'The weather takes a sharp turn—heavy rain, rising water, or a biting wind forces everyone indoors.',
    'A crowd gathers around a public notice, a street performer, or a sudden commotion.',
    'You spot a hidden door, hatch, or maintenance passage that wasn’t on any map.',
    'Someone nearby drops a key, badge, or folded note and walks away without noticing.'
  ];

  // Coherent Plot Twists
  const TWISTS = [
    'The obstacle you were trying to bypass was actually protecting you from something worse.',
    'Someone you thought was an enemy offers a quiet truce—for now.',
    'The item or person you are looking for was moved only minutes before you arrived.',
    'A bystander recognizes you or knows a secret about what you are carrying.',
    'There is a second, hidden condition attached to getting what you want here.',
    'An authority figure or rival patrol arrives unexpectedly, forcing everyone to improvise.',
    'The person helping you has an ulterior motive that conflicts with your goal.',
    'A minor detail you ignored earlier turns out to be the key to the whole situation.'
  ];

  // Coherent NPC Building Blocks (Role + Trait + Motivation)
  const NPC_ROLES = [
    'A retired courier',
    'An overworked archivist',
    'A street-smart mechanic',
    'A nervous merchant',
    'An off-duty guard',
    'A wandering scholar',
    'A sharp-eyed tavern keeper',
    'A secretive smuggler',
    'An ambitious apprentice',
    'A weary medic'
  ];

  const NPC_TRAITS = [
    'who never makes eye contact',
    'who speaks in clipped, practical sentences',
    'who keeps glancing toward the nearest exit',
    'who is surprisingly calm under pressure',
    'who has ink-stained fingers and a sharp memory',
    'who wears a heavy coat despite the weather',
    'who laughs softly whenever things get tense',
    'who insists on being paid upfront'
  ];

  const NPC_GOALS = [
    'and is trying to offload a hot package before sundown.',
    'and is searching for a missing friend who vanished nearby.',
    'and wants someone capable to do a quiet favor.',
    'and is hiding from someone they owe money to.',
    'and knows a shortcut through the area—for a price.',
    'and is waiting for a signal that hasn’t come yet.',
    'and wants to leave town as fast as possible.',
    'and is guarding a secret they don’t fully understand.'
  ];

  const WIN_CUES = [
    'You pull it off cleanly, seizing momentum in the scene.',
    'It works—the obstacle gives way and new possibilities open up.',
    'Success! Your move lands just as you intended.',
    'You come out on top, shifting the situation in your favor.',
    'Cleanly executed—you have the upper hand for now.'
  ];

  const FAIL_CUES = [
    'It goes sideways—an unexpected complication raises the stakes.',
    'Not quite enough; you’re forced onto the back foot as tension rises.',
    'The attempt backfires, drawing unwanted trouble.',
    'Something gives way at the worst moment—things just got harder.',
    'You fall short, and the opposition capitalizes on the opening.'
  ];

  function tokenize(text) {
    return (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOPWORDS.has(w));
  }

  function findSynonymGroupIndex(word) {
    for (let i = 0; i < SYNONYM_GROUPS.length; i += 1) {
      if (SYNONYM_GROUPS[i].some((syn) => word.startsWith(syn) || syn.startsWith(word))) {
        return i;
      }
    }
    return -1;
  }

  function matchBestSkill(actionText, skills) {
    const actionTokens = tokenize(actionText);
    if (!actionTokens.length || !skills.length) {
      return skills[0] || null;
    }

    let bestSkill = skills[0];
    let bestScore = 0;

    for (const skill of skills) {
      if (skill.id === 'do-anything') continue;

      const skillTokens = tokenize(skill.name);
      let score = 0;

      for (const st of skillTokens) {
        for (const at of actionTokens) {
          if (at === st) {
            score += 4;
          } else if (at.length >= 4 && st.length >= 4 && (at.startsWith(st.slice(0, 4)) || st.startsWith(at.slice(0, 4)))) {
            score += 2.5;
          } else {
            const sg = findSynonymGroupIndex(st);
            const ag = findSynonymGroupIndex(at);
            if (sg !== -1 && sg === ag) {
              score += 1.5;
            }
          }
        }
      }

      const weightedScore = score > 0 ? score + skill.level * 0.1 : 0;
      if (weightedScore > bestScore) {
        bestScore = weightedScore;
        bestSkill = skill;
      }
    }

    return bestSkill;
  }

  const DIFFICULTY_LABELS = {
    1: 'Easy',
    2: 'Moderate',
    3: 'Hard',
    4: 'Very Hard',
    5: 'Extreme'
  };

  function evaluateOpposition(actionText, tension, oppOverride, useStaticTarget) {
    let diceCount = 1;
    let reason = '';

    if (oppOverride && oppOverride !== 'auto') {
      diceCount = Math.max(1, Math.min(5, Number(oppOverride) || 1));
      const label = DIFFICULTY_LABELS[diceCount] || `${diceCount}d6`;
      reason = useStaticTarget ? `${label} · Target ${diceCount * 3}` : `${label} · ${diceCount}d6`;
    } else {
      const lower = (actionText || '').toLowerCase();
      let baseDice = 1;
      if (tension >= 4) baseDice = 3;
      else if (tension >= 2) baseDice = 2;

      let modifier = 0;
      let riskLabel = 'Standard Risk';

      if (/\b(impossible|boss|dragon|vault|all at once|blindfolded|mid-air|explode|massive|armored)\b/.test(lower)) {
        modifier += 1;
        riskLabel = 'High Stakes';
      } else if (/\b(careful|carefully|slowly|quietly|small|simple|peek|listen)\b/.test(lower)) {
        if (baseDice > 1) modifier -= 1;
        riskLabel = 'Cautious';
      }

      diceCount = Math.max(1, Math.min(5, baseDice + modifier));
      reason = useStaticTarget
        ? `${riskLabel} · Target ${diceCount * 3}`
        : `${diceCount}d6 (${riskLabel} · Tension ${tension})`;
    }

    return {
      diceCount,
      isStatic: Boolean(useStaticTarget),
      staticTarget: useStaticTarget ? diceCount * 3 : null,
      reason
    };
  }

  function rollDice(count) {
    const dice = [];
    for (let i = 0; i < count; i += 1) {
      dice.push(Math.floor(Math.random() * 6) + 1);
    }
    return dice;
  }

  function sumDice(dice) {
    return dice.reduce((acc, val) => acc + val, 0);
  }

  function formatActionPhrase(rawAction) {
    let text = (rawAction || '').trim();
    text = text.replace(/^i\s+(try\s+to\s+|attempt\s+to\s+|want\s+to\s+|will\s+)?/i, '');
    text = text.replace(/[.!?]+$/, '');
    if (!text) return 'act';
    return text.charAt(0).toLowerCase() + text.slice(1);
  }

  function suggestSkillName(rawAction) {
    const tokens = tokenize(rawAction);
    if (!tokens.length) return 'Improvised Stunt';
    const picked = tokens.slice(0, 3).map((w) => w.charAt(0).toUpperCase() + w.slice(1));
    return picked.join(' ');
  }

  function resolveTurn(state, actionText, skill, oppOverride, useStaticTarget) {
    const opp = evaluateOpposition(actionText, state.adventure.tension, oppOverride, useStaticTarget);
    const playerDice = rollDice(skill.level);
    const gmDice = opp.isStatic ? [] : rollDice(opp.diceCount);
    const playerSum = sumDice(playerDice);
    const gmSum = opp.isStatic ? opp.staticTarget : sumDice(gmDice);
    const won = playerSum > gmSum;
    const allSixes = playerDice.length > 0 && playerDice.every((d) => d === 6);

    let narrative = '';
    let nextTension = state.adventure.tension;

    if (won) {
      nextTension = Math.max(1, state.adventure.tension - (allSixes ? 1 : 0));
      const cue = WIN_CUES[Math.floor(Math.random() * WIN_CUES.length)];
      narrative = allSixes
        ? `All 6s! (${playerSum} vs ${gmSum}) — ${cue}`
        : `Success (${playerSum} vs ${gmSum}) — ${cue}`;
    } else {
      nextTension = Math.min(5, state.adventure.tension + 1);
      const cue = FAIL_CUES[Math.floor(Math.random() * FAIL_CUES.length)];
      narrative = `Failed (${playerSum} vs ${gmSum}, +1 XP) — ${cue}`;
    }

    return {
      opp,
      playerDice,
      gmDice,
      playerSum,
      gmSum,
      won,
      allSixes,
      narrative,
      nextTension
    };
  }

  function askOracle(question, odds) {
    const roll = Math.floor(Math.random() * 6) + 1;
    let label = '';
    let detail = '';

    if (odds === 'likely') {
      if (roll >= 5) { label = 'Yes, and'; detail = 'an extra opportunity or advantage appears.'; }
      else if (roll >= 3) { label = 'Yes'; detail = 'straightforwardly.'; }
      else if (roll === 2) { label = 'Yes, but'; detail = 'there is a minor catch.'; }
      else { label = 'No, but'; detail = 'there is a small silver lining.'; }
    } else if (odds === 'unlikely') {
      if (roll === 6) { label = 'Yes, but'; detail = 'against the odds, it comes with a complication.'; }
      else if (roll === 5) { label = 'No, but'; detail = 'you spot a partial workaround.'; }
      else if (roll >= 3) { label = 'No'; detail = 'not this time.'; }
      else { label = 'No, and'; detail = 'the situation tightens.'; }
    } else {
      if (roll === 6) { label = 'Yes, and'; detail = 'it brings an unexpected advantage.'; }
      else if (roll === 5) { label = 'Yes'; detail = 'straightforwardly.'; }
      else if (roll === 4) { label = 'Yes, but'; detail = 'it comes with a catch.'; }
      else if (roll === 3) { label = 'No, but'; detail = 'there is a silver lining nearby.'; }
      else if (roll === 2) { label = 'No'; detail = 'unfortunately not.'; }
      else { label = 'No, and'; detail = 'things just got more complicated.'; }
    }

    return {
      question: (question || '').trim(),
      odds: odds || 'even',
      roll,
      label,
      detail
    };
  }

  function rollSpark() {
    return SCENE_SPARKS[Math.floor(Math.random() * SCENE_SPARKS.length)];
  }

  function rollTwist() {
    return TWISTS[Math.floor(Math.random() * TWISTS.length)];
  }

  function rollNpc() {
    const role = NPC_ROLES[Math.floor(Math.random() * NPC_ROLES.length)];
    const trait = NPC_TRAITS[Math.floor(Math.random() * NPC_TRAITS.length)];
    const goal = NPC_GOALS[Math.floor(Math.random() * NPC_GOALS.length)];
    return `${role} ${trait}, ${goal}`;
  }

  function createFreshCharacter(name, startingSkills) {
    const skills = [
      {
        id: 'do-anything',
        name: 'Do Anything',
        level: 1,
        parentId: null
      }
    ];

    if (Array.isArray(startingSkills)) {
      startingSkills.forEach((s, idx) => {
        if (s && typeof s.name === 'string' && s.name.trim()) {
          const lvl = Math.max(1, Math.min(20, Math.floor(Number(s.level) || 1)));
          skills.push({
            id: `start-skill-${idx}-${Date.now()}`,
            name: s.name.trim().slice(0, 48),
            level: lvl,
            parentId: null
          });
        }
      });
    }

    return {
      name: (name || 'Unnamed Adventurer').trim() || 'Unnamed Adventurer',
      xp: 0,
      statuses: [],
      stats: {
        rolls: 0,
        wins: 0
      },
      skills
    };
  }

  function createSandboxState(customTitle, customGenre, customOpening) {
    const title = (customTitle || '').trim() || 'Untitled Sandbox';
    const genre = (customGenre || '').trim() || 'Solo Sandbox';
    const opening = (customOpening || '').trim();

    const log = [];
    if (opening) {
      log.push({
        id: 'entry-init-' + Date.now(),
        speaker: 'gm',
        label: 'Starter Hook',
        text: opening,
        rollSummary: null
      });
    }

    return {
      scenarioId: 'sandbox',
      title,
      genre,
      tension: 2,
      log
    };
  }

  function exportStoryLogMarkdown(state) {
    const lines = [];
    const stats = state.character.stats || { rolls: 0, wins: 0 };
    const byId = new Map(state.character.skills.map((s) => [s.id, s]));

    lines.push(`# ${state.adventure.title}`);
    lines.push(
      `**Genre:** ${state.adventure.genre} · **Character:** ${state.character.name} · **XP:** ${state.character.xp} · **Rolls:** ${stats.rolls} (${stats.wins} wins)`
    );
    if (Array.isArray(state.character.statuses) && state.character.statuses.length) {
      lines.push(`**Statuses:** ${state.character.statuses.join(', ')}`);
    }
    lines.push('');
    lines.push('## Skills');
    for (const s of state.character.skills) {
      const parent = s.parentId && byId.has(s.parentId) ? ` *(from ${byId.get(s.parentId).name})*` : '';
      lines.push(`- **${s.name}** — Level ${s.level} (${s.level}d6)${parent}`);
    }
    lines.push('');
    lines.push('## Story Chronicle');
    lines.push('');

    if (!state.adventure.log.length) {
      lines.push('_No entries yet._');
    } else {
      for (const entry of state.adventure.log) {
        if (entry.speaker === 'player' && entry.rollSummary) {
          const rs = entry.rollSummary;
          const outcome = rs.won ? 'SUCCESS' : 'FAILED';
          lines.push(`**${entry.label}:** ${entry.text}`);
          const oppText = rs.isStatic
            ? `**Static Target:** \`${rs.gmSum}\``
            : `**GM:** \`[${rs.gmDice.join(', ')}] = ${rs.gmSum}\``;
          lines.push(
            `> **${outcome}** · **${rs.skillName} (${rs.skillLevel}d6):** \`[${rs.playerDice.join(', ')}] = ${rs.playerSum}\` vs ${oppText}`
          );
          lines.push('');
        } else if (entry.speaker === 'oracle') {
          lines.push(`> **${entry.label}:** ${entry.text}`);
          lines.push('');
        } else if (entry.speaker === 'system') {
          lines.push(`★ **${entry.label}:** ${entry.text}`);
          lines.push('');
        } else if (entry.label === 'Starter Hook') {
          lines.push(`> **Starter Hook:** ${entry.text}`);
          lines.push('');
        } else if (entry.label === 'Scene Note') {
          lines.push(entry.text);
          lines.push('');
        } else {
          lines.push(`*${entry.label}: ${entry.text}*`);
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  }

  function exportCharacterJSON(character) {
    return JSON.stringify(
      {
        schemaVersion: 1,
        type: 'rfs-character',
        exportedAt: new Date().toISOString(),
        character
      },
      null,
      2
    );
  }

  function exportAdventureJSON(state) {
    return JSON.stringify(
      {
        schemaVersion: 1,
        type: 'rfs-adventure',
        exportedAt: new Date().toISOString(),
        character: state.character,
        adventure: state.adventure
      },
      null,
      2
    );
  }

  function normalizeCharacter(raw) {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.skills) || raw.skills.length === 0) {
      throw new Error('Invalid character data: missing skills array.');
    }
    const skills = raw.skills
      .filter((s) => s && typeof s.name === 'string' && Number.isFinite(Number(s.level)))
      .map((s, idx) => ({
        id: typeof s.id === 'string' && s.id ? s.id : `skill-${idx}-${Date.now()}`,
        name: s.name.trim().slice(0, 48) || 'Unnamed Skill',
        level: Math.max(1, Math.min(20, Math.floor(Number(s.level)))),
        parentId: typeof s.parentId === 'string' ? s.parentId : null
      }));

    if (!skills.length) {
      throw new Error('Invalid character data: no valid skills found.');
    }

    return {
      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 48) : 'Imported Adventurer',
      xp: Number.isFinite(Number(raw.xp)) ? Math.max(0, Math.floor(Number(raw.xp))) : 0,
      statuses: Array.isArray(raw.statuses)
        ? raw.statuses.filter((st) => typeof st === 'string' && st.trim()).map((st) => st.trim().slice(0, 36)).slice(0, 20)
        : [],
      stats: {
        rolls: Number.isFinite(Number(raw.stats?.rolls)) ? Math.max(0, Math.floor(Number(raw.stats.rolls))) : 0,
        wins: Number.isFinite(Number(raw.stats?.wins)) ? Math.max(0, Math.floor(Number(raw.stats.wins))) : 0
      },
      skills
    };
  }

  function normalizeAdventure(raw) {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.log)) {
      throw new Error('Invalid sandbox data: missing log array.');
    }
    return {
      scenarioId: 'sandbox',
      title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim().slice(0, 60) : 'Imported Sandbox',
      genre: typeof raw.genre === 'string' && raw.genre.trim() ? raw.genre.trim().slice(0, 32) : 'Solo Sandbox',
      tension: Number.isFinite(Number(raw.tension)) ? Math.max(1, Math.min(5, Math.floor(Number(raw.tension)))) : 2,
      log: raw.log.slice(-200).map((entry, idx) => ({
        id: typeof entry.id === 'string' ? entry.id : `imported-${idx}`,
        speaker: ['player', 'system', 'oracle'].includes(entry.speaker) ? entry.speaker : 'gm',
        label: typeof entry.label === 'string' ? entry.label : 'Log',
        text: typeof entry.text === 'string' ? entry.text : '',
        rollSummary: entry.rollSummary || null
      }))
    };
  }

  function parseImportJSON(jsonText) {
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error('Could not parse JSON. Please check the file syntax.');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('JSON root must be an object.');
    }

    if (parsed.type === 'rfs-character' || (parsed.character && !parsed.adventure)) {
      return {
        kind: 'character',
        character: normalizeCharacter(parsed.character || parsed)
      };
    }

    if (parsed.type === 'rfs-adventure' || (parsed.character && parsed.adventure)) {
      return {
        kind: 'adventure',
        character: normalizeCharacter(parsed.character),
        adventure: normalizeAdventure(parsed.adventure)
      };
    }

    if (Array.isArray(parsed.skills)) {
      return {
        kind: 'character',
        character: normalizeCharacter(parsed)
      };
    }

    throw new Error('Unrecognized Roll for Shoes JSON format.');
  }

  global.RFS = {
    matchBestSkill,
    evaluateOpposition,
    suggestSkillName,
    resolveTurn,
    askOracle,
    rollSpark,
    rollTwist,
    rollNpc,
    createFreshCharacter,
    createSandboxState,
    exportStoryLogMarkdown,
    exportCharacterJSON,
    exportAdventureJSON,
    parseImportJSON
  };
})(window);
