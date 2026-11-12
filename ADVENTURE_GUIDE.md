# Meridian: Borrowed Dawn

An original standalone superhero thriller for CRPG Forge. A civic administrator is using a citywide emergency network to confiscate abilities and overwrite resistance. The player can save captives, preserve evidence, sabotage the mechanism, and decide what cost they will accept to stop it.

## Scope

- 31 authored scenes, including 10 distinct ending scenes.
- Three starting approaches: clinic/rescue crews, freight tunnels, greenhouse/roof.
- The atrium offers three substantive objectives. You can complete at most two in one run: ward, archive, lens.
- Earlier preparations create concrete later benefits: Bren's token opens the ascent; his support lowers a social challenge; the service map lowers the archive search; a roof escape line bypasses the shutter; isolating the relay lowers the final manual cutoff difficulty.
- A real optional sentinel encounter uses enemy HP, rolled attack checks, fixed damage, and responses. Successful persuasion or technical deception can avoid it.
- A 38-action deadline prevents unlimited preparation. Standalone powers and rest consume actions, while a power paired with a check consumes one action total.
- All mandatory obstacles can be solved without powers. That does not mean every no-power attempt succeeds.
- Defeat can result from zero health, a failed desperate escape/fight, capture, or the deadline. Mixed endings preserve consequences instead of presenting every outcome as victory.

## Default character

Rook has a total of 78 ability-score points: Strength 13, Dexterity 12, Constitution 14, Intelligence 14, Wisdom 13, Charisma 12. Health and Energy derive from the core, not custom adventure overrides. Rook's five costed custom powers are Amber Implement, Pattern Sight, Field Mending, Amber Guard, and Amber Bolt. The first two help noncombat checks; the remaining three demonstrate healing, shielding, and offensive fixed damage.

The player may replace Rook with a validated custom or imported character. The opening makes clear that the mission can belong to another protagonist. References to Rook's identity are the default character's introduction, not a forced change to an imported character's name.

## Spoiler-light play advice

Read the DC, full modifier, resource cost, and consequences before committing. Strength is not the only route. Intelligence and Wisdom have distinct mechanical roles; Charisma can secure cooperation rather than simply cause damage. Capability bonuses such as flight, telekinesis, analysis, and empathy are authored on relevant checks. A power that describes an unsupported ability does not silently gain new mechanics.

The maintenance bay has one rest opportunity. At the final choice, your earlier objective flags expose specific options. No perfect outcome can save all objectives in one run.

## Agent playtesting

Run `node adventure.test.js` from the project directory. It validates the adventure and character, checks every scene's graph reachability, exercises every action through 2,500 seeded playthroughs, round-trips completed saves, verifies victory/mixed/defeat outcomes exist, and verifies at least one entirely nonpowered character run wins.

Random-play outcome percentages are not balance promises or estimates for a deliberate player. The deterministic simulation uses a scrambled seed range to avoid the correlated first outputs of small adjacent xorshift seeds.

## Full route structure

Arrival → clinic / freight / greenhouse → gate / loading / rooftop or maintenance → atrium → ward / archive / lens → crossroads → optional unvisited second objective → ascent → control → bypass / breached sentinel / pressure → final choice → ending.

Ending distinctions:

1. Restoration: clean lens bypass, then successful controlled shutdown.
2. Exposure: signed evidence, then successful citywide broadcast.
3. Costly victory: destructive cutoff loses stored abilities.
4. Evidence survives: failed broadcast preserves physical proof and stops the Engine.
5. Manual victory: skilled ordinary shutdown, with stored abilities recoverable later.
6. Sacrifice: failed destruction attempt costs Imani's life.
7. Partial failure: early pulse harms one district before shutdown.
8. Evacuation: rescued ward survives while Imani sacrifices herself.
9. Escape defeat: the protagonist escapes, but Vey completes the overwrite.
10. Capture defeat: the protagonist is captured and Vey completes the overwrite.

Zero-health and deadline losses are additional engine-level defeat results, rather than extra authored scenes.
