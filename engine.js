(() => {
  const { ORACLE_LIKELIHOODS, ORACLE_SCALES, INSPIRATION_TABLES } = window.ElfGameData;

  function rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1;
  }

  function rollDice(count, sides) {
    const rolls = [];
    let total = 0;
    for (let i = 0; i < count; i += 1) {
      const r = rollDie(sides);
      rolls.push(r);
      total += r;
    }
    return { rolls, total };
  }

  function formatSigned(num) {
    return num >= 0 ? `+${num}` : `${num}`;
  }

  function getAbilityAdjustment(score) {
    return Math.floor((Number(score) - 10) / 2);
  }

  function calculateDerivedStats(char) {
    const level = Math.max(0, Math.min(3, Number(char.level) || 0));
    const strAdj = getAbilityAdjustment(char.abilities.STR);
    const dexAdj = getAbilityAdjustment(char.abilities.DEX);
    const conAdj = getAbilityAdjustment(char.abilities.CON);
    const wisAdj = getAbilityAdjustment(char.abilities.WIS);
    const isMundane = char.stance === 'mundane';
    const mundaneBonus = isMundane ? 1 : 0;

    const melee = level + strAdj + mundaneBonus;
    const ranged = level + dexAdj + mundaneBonus;

    let ac = 10 - conAdj - dexAdj - level;
    const acParts = [`10 base`, `${-conAdj >= 0 ? '+' : ''}${-conAdj} (CON Adj)`, `${-dexAdj >= 0 ? '+' : ''}${-dexAdj} (DEX Adj)`, `-${level} (Lvl)`];
    if (char.wearingArmor) {
      ac -= 1;
      acParts.push(`-1 (Armor)`);
    }
    if (isMundane) {
      ac -= 1;
      acParts.push(`-1 (Mundane)`);
    }
    if (char.defending) {
      ac -= 1;
      acParts.push(`-1 (Defending)`);
    }

    const savingThrow = Number(char.abilities.CON) + wisAdj + level + mundaneBonus;

    const baseSizeMap = { small: '¼ Sq', medium: '1 Sq', large: '2 Sq' };
    const baseSpeedMap = { small: 2, medium: 4, large: 8 };
    const speed = (baseSpeedMap[char.size] ?? 4) + mundaneBonus;

    const hpDiceCount = 1 + level + (char.charClass === 'fighter' ? level : 0);
    const hpFlatBonus = conAdj + level + mundaneBonus;

    return {
      melee,
      ranged,
      ac,
      savingThrow,
      sizeLabel: baseSizeMap[char.size] ?? '1 Sq',
      speed,
      hpDiceCount,
      hpFlatBonus,
      formulas: {
        melee: `Level (${level}) + STR Adj (${formatSigned(strAdj)})${isMundane ? ' + 1 (Mundane)' : ''} = ${formatSigned(melee)}`,
        ranged: `Level (${level}) + DEX Adj (${formatSigned(dexAdj)})${isMundane ? ' + 1 (Mundane)' : ''} = ${formatSigned(ranged)}`,
        ac: `${acParts.join(' ')} = ${ac} (lower is harder to hit)`,
        savingThrow: `CON (${char.abilities.CON}) + WIS Adj (${formatSigned(wisAdj)}) + Level (${level})${isMundane ? ' + 1 (Mundane)' : ''} = ${savingThrow}`,
        speed: `Base (${baseSpeedMap[char.size] ?? 4})${isMundane ? ' + 1 (Mundane)' : ''} = ${speed} squares (${speed * 5} ft/Move)`,
        hp: `${hpDiceCount}D6 ${formatSigned(hpFlatBonus)} (${formatSigned(conAdj)} CON Adj, +${level} Lvl${isMundane ? ', +1 Mundane' : ''})`,
      },
    };
  }

  function rollSuggestedMaxHP(char) {
    const derived = calculateDerivedStats(char);
    const rolled = rollDice(derived.hpDiceCount, 6);
    const total = Math.max(1, rolled.total + derived.hpFlatBonus);
    return {
      total,
      diceRolls: rolled.rolls,
      flatBonus: derived.hpFlatBonus,
      formula: derived.formulas.hp,
    };
  }

  function evaluateD20RollUnder({ rawRoll, modifiers, target, targetLabel, statReason }) {
    const netMod = modifiers.reduce((sum, m) => sum + m.value, 0);
    const modifiedRoll = rawRoll + netMod;

    let success;
    let natNote = '';
    if (rawRoll === 1) {
      success = true;
      natNote = 'Natural 1! By Elf Game rules, a 1 on the D20 is ALWAYS a Success.';
    } else if (rawRoll === 20) {
      success = false;
      natNote = 'Natural 20! By Elf Game rules, a 20 on the D20 is ALWAYS a Failure.';
    } else {
      success = modifiedRoll <= target;
    }

    const modText = modifiers.length
      ? modifiers.map((m) => `${m.label}: ${formatSigned(m.value)}`).join(' · ')
      : 'No modifiers';

    const comparison = `${modifiedRoll} ${success ? '≤' : '>'} ${target}`;
    const explain = natNote
      ? `${natNote} (${statReason})`
      : `${statReason} Your modified roll was ${modifiedRoll}, which is ${success ? 'less than or equal to' : 'greater than'} ${targetLabel} (${target}), so the check ${success ? 'succeeded' : 'failed'}.`;

    return {
      rawRoll,
      modifiers,
      modifiedRoll,
      target,
      targetLabel,
      success,
      isNat1: rawRoll === 1,
      isNat20: rawRoll === 20,
      steps: [
        `1D20: ${rawRoll}`,
        modText,
        `Final: ${modifiedRoll}`,
        `Target (${targetLabel}): ${target}`,
        `Result: ${comparison}`,
      ],
      explain,
    };
  }

  function resolveAbilityTest(char, abilityKey, difficultyMod = 0, note = '') {
    const score = Number(char.abilities[abilityKey]) || 10;
    const rawRoll = rollDie(20);
    const modifiers = [];

    if (char.charClass === 'tradesman' && Number(char.level) > 0) {
      modifiers.push({ label: `Tradesman (Lvl ${char.level})`, value: -Number(char.level) });
    }
    if (difficultyMod !== 0) {
      modifiers.push({ label: 'Difficulty', value: Number(difficultyMod) });
    }

    const result = evaluateD20RollUnder({
      rawRoll,
      modifiers,
      target: score,
      targetLabel: `${abilityKey} Score`,
      statReason: `Your ${abilityKey} score of ${score} set the target you needed to roll under or equal to.`,
    });

    return { ...result, checkType: 'ability', abilityKey, note };
  }

  function resolveSavingThrow(char, difficultyMod = 0, note = '') {
    const derived = calculateDerivedStats(char);
    const rawRoll = rollDie(20);
    const modifiers = [];

    if (char.charClass === 'tradesman' && Number(char.level) > 0) {
      modifiers.push({ label: `Tradesman (Lvl ${char.level})`, value: -Number(char.level) });
    }
    if (difficultyMod !== 0) {
      modifiers.push({ label: 'Difficulty', value: Number(difficultyMod) });
    }

    const result = evaluateD20RollUnder({
      rawRoll,
      modifiers,
      target: derived.savingThrow,
      targetLabel: 'Saving Throw',
      statReason: `Your Saving Throw (${derived.savingThrow}) combines CON (${char.abilities.CON}), WIS Adj, Level${char.stance === 'mundane' ? ', and Mundane (+1)' : ''}.`,
    });

    return { ...result, checkType: 'save', note };
  }

  function resolveAttackRoll(char, attackType, targetAC = 10, note = '') {
    const derived = calculateDerivedStats(char);
    const score = attackType === 'melee' ? derived.melee : derived.ranged;
    const label = attackType === 'melee' ? 'Melee Score' : 'Ranged Score';
    const rawRoll = rollDie(20);
    const modifiers = [];

    if (score !== 0) {
      modifiers.push({ label, value: -score });
    }

    const result = evaluateD20RollUnder({
      rawRoll,
      modifiers,
      target: Number(targetAC),
      targetLabel: `Target AC`,
      statReason: `Your ${label} (${formatSigned(score)}) subtracted ${score} from the D20 roll (lower rolls are better against AC ${targetAC}).`,
    });

    const damage = result.success ? rollDie(6) : 0;
    return { ...result, checkType: 'attack', attackType, damage, note };
  }

  function resolveEnemyAttackRoll(char, enemyAttackBonus = 0, note = '') {
    const derived = calculateDerivedStats(char);
    const bonus = Number(enemyAttackBonus) || 0;
    const rawRoll = rollDie(20);
    const modifiers = [];

    if (bonus !== 0) {
      modifiers.push({ label: 'Enemy Atk Bonus', value: -bonus });
    }

    const result = evaluateD20RollUnder({
      rawRoll,
      modifiers,
      target: derived.ac,
      targetLabel: `Your AC`,
      statReason: `The enemy's attack bonus (${formatSigned(bonus)}) subtracted ${bonus} from the D20 roll against your Armor Class of ${derived.ac} (${derived.formulas.ac}).`,
    });

    const damage = result.success ? rollDie(6) : 0;
    return { ...result, checkType: 'enemy-attack', enemyAttackBonus: bonus, playerAC: derived.ac, damage, note };
  }

  function resolveYesNoOracle(question, likelihoodKey = 'even') {
    const cfg = ORACLE_LIKELIHOODS[likelihoodKey] || ORACLE_LIKELIHOODS.even;
    const roll = rollDie(100);
    const isYes = roll <= cfg.target;

    let answer;
    let twistNote = '';
    if (roll <= 5) {
      answer = 'Yes, and... (Extreme Yes!)';
      twistNote = 'An extra stroke of good fortune accompanies this.';
    } else if (roll >= 96) {
      answer = 'No, and... (Extreme No!)';
      twistNote = 'An unexpected complication makes things worse.';
    } else if (isYes && roll >= cfg.target - 9) {
      answer = 'Yes, but...';
      twistNote = 'It is true, with a small catch or cost.';
    } else if (!isYes && roll <= cfg.target + 10) {
      answer = 'No, but...';
      twistNote = 'Not quite, though a silver lining or clue appears.';
    } else {
      answer = isYes ? 'Yes' : 'No';
    }

    return {
      question: question.trim() || 'Oracle Question',
      likelihoodLabel: cfg.label,
      target: cfg.target,
      roll,
      answer,
      twistNote,
    };
  }

  function resolveHowManyOracle(question, scaleKey = 'small') {
    const cfg = ORACLE_SCALES[scaleKey] || ORACLE_SCALES.small;
    const rolled = rollDice(cfg.count, cfg.sides);
    return {
      question: question.trim() || 'How many?',
      scaleLabel: `${cfg.label} (${cfg.count}d${cfg.sides})`,
      rolls: rolled.rolls,
      total: rolled.total,
    };
  }

  function rollInspiration(categoryKey = 'creatures') {
    const table = INSPIRATION_TABLES[categoryKey] || INSPIRATION_TABLES.creatures;
    const index = Math.floor(Math.random() * table.items.length);
    return {
      categoryKey,
      categoryLabel: table.label,
      result: table.items[index],
    };
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function generateRandomCharacter() {
    const abilityKeys = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    const rawPool = abilityKeys.map(() => rollDice(3, 6));
    const totals = rawPool.map((r) => r.total);
    const shuffled = shuffleArray(totals);
    const abilities = {};
    abilityKeys.forEach((key, idx) => {
      abilities[key] = shuffled[idx];
    });

    const level = Math.floor(Math.random() * 4); // 0 to 3
    const charClass = pickRandom(['none', 'fighter', 'tradesman']);
    const stance = pickRandom(['mundane', 'magical']);
    const size = pickRandom(['small', 'medium', 'large']);
    const wearingArmor = Math.random() < 0.5;

    const draft = {
      level,
      charClass,
      stance,
      size,
      wearingArmor,
      defending: false,
      abilities,
    };

    const hpRes = rollSuggestedMaxHP(draft);
    const derived = calculateDerivedStats(draft);

    const classLabel = charClass === 'none' ? 'Standard (No Class)' : charClass === 'fighter' ? 'Fighter' : 'Tradesman';
    const stanceLabel = stance === 'magical' ? 'Magical' : 'Mundane';
    const sizeLabel = size.charAt(0).toUpperCase() + size.slice(1);

    const steps = [
      `1. Rolled 3d6 × 6: [${totals.join(', ')}] and randomly assigned → ${abilityKeys.map((k) => `${k} ${abilities[k]}`).join(', ')}.`,
      `2. Rolled Level (0–3): Level ${level}.`,
      `3. Rolled Class, Stance, Size & Armor: ${classLabel}, ${stanceLabel}, ${sizeLabel}, ${wearingArmor ? 'Wearing Armor (-1 AC)' : 'Unarmored'}.`,
      `4. Rolled Hit Points: [${hpRes.diceRolls.join(' + ')}] ${formatSigned(hpRes.flatBonus)} = ${hpRes.total} Max HP.`,
      `5. Derived Combat Stats: AC ${derived.ac}, Saving Throw ${derived.savingThrow}, Melee ${formatSigned(derived.melee)}, Ranged ${formatSigned(derived.ranged)}, Speed ${derived.speed} Sq.`,
    ];

    return {
      characterPatch: {
        ...draft,
        maxHp: hpRes.total,
        currentHp: hpRes.total,
      },
      steps,
    };
  }

  window.ElfGameEngine = {
    getAbilityAdjustment,
    calculateDerivedStats,
    rollSuggestedMaxHP,
    rollDice,
    formatSigned,
    resolveAbilityTest,
    resolveSavingThrow,
    resolveAttackRoll,
    resolveEnemyAttackRoll,
    resolveYesNoOracle,
    resolveHowManyOracle,
    rollInspiration,
    generateRandomCharacter,
  };
})();
