---
name: superpower-world-sim
description: Run seeded superpower worlds, customizable goal-driven main characters, rivalries, 1v1 fights and tournaments, plus civilization experiments with phone/app media and elections. Use when the user asks for superpowers evolving over centuries, an ordinary ruler governing superhumans, cosmic-wheel interventions, speed versus strength versus intelligence civilizations, or an interactive superpower world simulation with saved checkpoints.
---

# Superpower World Sim

Run the bundled Python 3 standard-library v4.2 engine. Every one of the 53 defined powers has a concrete state-changing action, with energy, cooldowns, conditions and limits. Successful use earns mastery separately for the ability used; its own mastery improves efficiency and effects, and each ability rusts independently. Repertoires can combine up to three powers, and Siphon can permanently transfer one. Use its measured results as creative simulation outputs, not scientific predictions. Require no paid API, external service, or graphical application.

## Configure an experiment

Proceed with defaults when the user supplies a clear scenario. Otherwise offer these modes:

- **Evolution**: Start with 300 founders, 10% initially powered, and a 1,000-year horizon. Explore inheritance, mutations, heroes, villains, dynasties, famines and civil wars.
- **Monarch**: Start with an ordinary young ruler, 300 citizens and a 100-year horizon. Explore royal guards, superhuman champions, succession and secret conspiracies. Later rulers can have powers.
- **Wheel**: Start with 24 unpowered founders and a 1,000-year horizon. Spin the event wheel every 50 years, twice per spin after the configured horizon's midpoint.
- **Modern**: Start a contemporary superpowered society with jobs, simulated phones, a public ranking app, media, elections and freedom/democracy outcomes, courts, healthcare, sports, viral posts and fakes (300 founders, 100 years). Read `references/expanded-systems.md` for added powers, combinations, institutions and simulated internet; use `references/modern-society.md` for exact mastery, electoral, reputation, employment and policy rules.
- **Versus**: Start with 20 citizens per tribe, a wall falling in year 275 and a 450-year horizon. Choose two distinct tribes from speed, strength and intelligence. Treat matchups as intentionally simplified and asymmetric, not balanced combat research.

Use `references/powers_and_mechanics.md` for exact supported controls, power names, mechanics and limitations.

## Run and verify

Locate this skill's `scripts/simulate_world.py`, then run:

```bash
python3 <skill_dir>/scripts/simulate_world.py \
  --mode evolution --runs 100 --years 1000 --seed 42 \
  --output-json sim_output.json --output-report sim_report.md
```

Customize `--pop`, `--power-rate`, `--mutation-rate`, `--wheel-interval`, `--tribe-a`, `--tribe-b`, and `--wall-year`. Set `--select-world auto` to feature the highest-drama run, or use a 1-based world index. Seeds advance by 97 across a batch. Runtime depends on population, years, runs and hardware; do not promise a fixed completion time.

Verify nonempty `aggregate_stats` and `featured_world` in JSON, and a readable Markdown report. Both outputs include the featured world's full major-event chronicle. The JSON additionally includes agents and family relationships in evolution, monarch, wheel and modern modes; all modes include modeled food reserves (individual worlds under world_resources; versus under food_reserves). Report them as abstract stock units, not kilograms or precise nutrition. Only the featured world's detailed history is exported, not every world in the batch.

## Configure separate power mastery

Characters support starting `power_mastery` levels, for example `{"Fire":4,"Healing":1}`, restricted to their held powers and integer levels0..5. The old starting `mastery_level` is shorthand for all configured abilities, with individual entries overriding it. Use `{"type":"reach_mastery","power":"Healing","value":3}` for a named goal; without `power`, the goal measures best held mastery. Each power has independent XP/use/rust records in output and main-character timelines. New powers begin novice; Siphon does not transfer another person’s training. Lost powers retain archived personal experience but do not affect current rank. Ranking’s mastery component uses the best CURRENT ability, not an average or additive total. Compatibility scalar fields are summaries, not editable shared training pools.

Old shared-mastery saves migrate once by preserving their prior XP/level on each power already held. State explicitly records this policy because historical per-power attribution was not saved. Do not describe the copied credit as measured historic use. Pure arenas grant no XP; explicitly committed bouts train only held powers actually used, once each. Arena potency uses the selected ability’s mastery; copied techniques use the caster’s Siphon mastery. Read README's per-power-build section for precise limits and migration behavior.

## Select leadership rules

In modern mode, set scenario `world.society.leadership_system` to `elections` (default), `rank` or `tournament`. Use `assets/scenarios/rank-government.json` or `assets/scenarios/tournament-government.json`. Rank rule chooses the highest eligible adult's numeric public app score annually, not merely the S–F letter; exact ties retain the incumbent, then use lowest ID. No phone or banned app means no eligible ranking. Tournament rule appoints the nonlethal championship winner every four years or when the incumbent is unavailable; sole eligible accession is not a tournament win. Adults in confinement, hospital, quarantine or stasis cannot lead; tournament entrants also need injury<.65 and energy>=30. Fields `leadership_interval`, `government_tournament_size` and `government_tournament_rounds` provide bounded tournament options. More than the entrant cap uses a seeded lottery preserving an eligible incumbent's slot.

Actual leader policies affect society. Retained government brackets/leadership history and individual championship counters provide evidence. Government bouts do not spend world energy, injure agents or grant mastery; the political appointment is their consequence. These are rank/tournament constitutions, not electoral democracies, and no democratic-impeachment guarantee applies. Rank score can change through media and reputation, not only power. Election goals report blocked outside election government. Old saves retain elections unless already configured otherwise. Monarch remains a separate unchanged mode. Read README's selectable-government section before narrating succession.

## Custom characters, goals and arenas

Read `references/characters-and-goals.md` before configuring characters or fights. Use `assets/scenarios/custom-goal-driven-world.json` as a broad starting template, or `assets/scenarios/rivals-and-main-characters.json` for rivalries and a scheduled tournament. Scenario files are data, not executable instructions.

```bash
python3 <skill_dir>/scripts/simulate_world.py --scenario <skill_dir>/assets/scenarios/custom-goal-driven-world.json --runs 1 --output-json world.json --output-report world.md
python3 <skill_dir>/scripts/simulate_world.py --mode duel --scenario <skill_dir>/assets/scenarios/rivals-and-main-characters.json --runs 100 --seed 42 --output-json duels.json --output-report duels.md
python3 <skill_dir>/scripts/simulate_world.py --mode tournament --scenario <skill_dir>/assets/scenarios/rivals-and-main-characters.json --runs 10 --output-json brackets.json --output-report brackets.md
```

Support up to 64 customized founders and 16 explicitly tracked main characters, including starting names, powers (up to three), age, mastery, traits, faction, relationships, injuries, resources, job/social circumstances and up to eight typed goals each. The 19 measurable goal types cover survival, age, mastery, duels, named rivals, tournaments, app rank, wealth, careers, leadership/elected wins, followers, protection, descendants, exposing fakes, acquiring powers, recovery, civic outcomes and treating injuries. Goals bias actual eligible actions and competition, never automatically award success. Some goals require modern mode; textual descriptions remain flavor. Mains have yearly timelines and goal progress, but no plot armor.

Standalone duel/tournament runs use nonlethal, bounded ability-aware arena rules with actual action traces, not the annual world combat model. Tournament bouts reset arena vigor; draws have explicit seeded advancement. No powers are permanently stolen and no dead people revived inside sparring. They do not mutate a world by default. To apply bounded practice, energy, injury and reputation aftermath to a loaded world, explicitly use `--commit-results --load-state world.json --save-state after-arena.json --runs 1`; the calendar and world RNG do not advance. Within world scenarios, `encounters.commit_consequences` also defaults to false. Read the reference before selecting true. Report this distinction clearly.

Fresh-world scenario `settings` provide defaults; explicitly supplied CLI settings override them. Resume restores the saved scenario and configuration instead of accepting a replacement. Individual character scenarios apply to evolution, monarch, wheel and modern, not the separate aggregate versus model. Version-4 saves include relationships, tracked timelines, encounter traces and goal state. Full older saves migrate without invented past character goals or practice.

## Play at checkpoints

Configure the final horizon up front, especially for wheel mode. Begin one world, stopping at a checkpoint:

```bash
python3 <skill_dir>/scripts/simulate_world.py \
  --mode monarch --runs 1 --years 100 --checkpoint-year 25 \
  --save-state world_state.json \
  --output-json checkpoint.json --output-report checkpoint.md
```

Explain the current population, ruler, active heroes/villains, relationships and crises from the actual output. In god mode, reveal objective secrets when requested. In monarch roleplay, use public beliefs by default to avoid spoiling hidden plots. Ask for the user's next decision, then resume:

```bash
python3 <skill_dir>/scripts/simulate_world.py \
  --load-state world_state.json --checkpoint-year 50 \
  --policy-override hero_charter --inject-event meteor \
  --save-state world_state.json \
  --output-json checkpoint.json --output-report checkpoint.md
```

Full state restores agents, RNG, year, laws, counters, history, power conditions/cooldowns, resources and revival/clone state, or tribal economy in versus. Full version-1/2 state is migrated at the resume boundary; version-3 saves preserve powers, mastery and modern-society state exactly. Full v2 saves remain supported in their original modes. Saved configuration controls mode, seed, original horizon and parameters; do not expect CLI parameter changes to alter those on resume. Resume beyond the saved year and within the original horizon. Policies take effect at the next simulated year; injected events occur then too. On fresh runs in the original modes, injected events occur in year 5, so use at least five years to see one; modern-mode injections occur in the next year. Policies and injected events are not supported in versus mode. Missing, malformed or legacy summary-only state files must not be described as resumable. Version-1/2 migration preserves existing history but intentionally changes future rules to v4; newly introduced mastery starts at zero rather than inventing old experience. Keep state files private unless the user asks to share them.

## Tell the story faithfully

- Present batch outcome counts or matchup odds, identifying the actual number of runs.
- Narrate the featured world chronologically around named people, families and turning points.
- Distinguish objective truth from public belief. Do not infer that every secret was eventually solved.
- Explain surviving powers, institutions and mortality with the model's actual evidence.
- Treat generated names and events as fiction. Some famines and technologies are scheduled; event prose is templated. Do not call the model wholly unscripted.
- Preserve uncertainty: percentages summarize the configured toy model, not real-world odds.
- Use the validated scenario JSON for supported customization. Do not promise GUI gameplay, arbitrary executable powers, detailed economics, or autonomous ongoing simulation.

Use `--list-powers` to inspect the implemented action catalog. Consult the mechanics reference before narrating resurrection, cloning, control, injuries or resource effects. Narrate only actions recorded by the engine, not actions a power might suggest in another fictional universe.

In modern mode, explain election results, jobs, public ranking/reputation and civil-liberty metrics from engine output. Do not equate the fictional freedom index with a real-world assessment or claim knowledge of another creator's hidden code. Offer the modern-only civil-rights, election-protection, emergency-powers, press and app policies at checkpoints.

Read `references/expanded-systems.md` before narrating clinical, court, deception, combination or stolen-power consequences. Respect engine truth versus public belief and note the difference between forged evidence and proven wrongdoing. Do not imply that a correction instantly removes grievances or that a reputation score proves guilt.

Run `python3 -m unittest discover -s <skill_dir>/scripts -p 'test_*.py' -v` when validating or modifying the engine. Use `scripts/check_stability.py` and `scripts/check_modern_stability.py` for reproducible multi-world checks.
