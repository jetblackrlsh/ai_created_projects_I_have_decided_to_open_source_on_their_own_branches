---
name: superpower-world-sim
description: Run seeded superpower civilization simulations, Monte Carlo world experiments, and interactive god-mode, monarch and contemporary-society storylines with phone/app media and elections. Use when the user asks for superpowers evolving over centuries, an ordinary ruler governing superhumans, cosmic-wheel interventions, speed versus strength versus intelligence civilizations, or an interactive superpower world simulation with saved checkpoints.
---

# Superpower World Sim

Run the bundled Python 3 standard-library v3 engine. Every one of the 53 defined powers has a concrete state-changing action, with energy, cooldowns, conditions and limits. Successful use earns mastery that improves efficiency and supported effects; disuse can decay it. Repertoires can combine up to three powers, and Siphon can permanently transfer one. Use its measured results as creative simulation outputs, not scientific predictions. Require no paid API, external service, or graphical application.

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

Full state restores agents, RNG, year, laws, counters, history, power conditions/cooldowns, resources and revival/clone state, or tribal economy in versus. Full version-1/2 state is migrated at the resume boundary; version-3 saves preserve powers, mastery and modern-society state exactly. Full v2 saves remain supported in their original modes. Saved configuration controls mode, seed, original horizon and parameters; do not expect CLI parameter changes to alter those on resume. Resume beyond the saved year and within the original horizon. Policies take effect at the next simulated year; injected events occur then too. On fresh runs in the original modes, injected events occur in year 5, so use at least five years to see one; modern-mode injections occur in the next year. Policies and injected events are not supported in versus mode. Missing, malformed or legacy summary-only state files must not be described as resumable. Version-1/2 migration preserves existing history but intentionally changes future rules to v3; newly introduced mastery starts at zero rather than inventing old experience. Keep state files private unless the user asks to share them.

## Tell the story faithfully

- Present batch outcome counts or matchup odds, identifying the actual number of runs.
- Narrate the featured world chronologically around named people, families and turning points.
- Distinguish objective truth from public belief. Do not infer that every secret was eventually solved.
- Explain surviving powers, institutions and mortality with the model's actual evidence.
- Treat generated names and events as fiction. Some famines and technologies are scheduled; event prose is templated. Do not call the model wholly unscripted.
- Preserve uncertainty: percentages summarize the configured toy model, not real-world odds.
- Do not promise custom JSON scenarios, GUI gameplay, arbitrary powers, detailed economics, or autonomous ongoing simulation. Those are not bundled features.

Use `--list-powers` to inspect the implemented action catalog. Consult the mechanics reference before narrating resurrection, cloning, control, injuries or resource effects. Narrate only actions recorded by the engine, not actions a power might suggest in another fictional universe.

In modern mode, explain election results, jobs, public ranking/reputation and civil-liberty metrics from engine output. Do not equate the fictional freedom index with a real-world assessment or claim knowledge of another creator's hidden code. Offer the modern-only civil-rights, election-protection, emergency-powers, press and app policies at checkpoints.

Read `references/expanded-systems.md` before narrating clinical, court, deception, combination or stolen-power consequences. Respect engine truth versus public belief and note the difference between forged evidence and proven wrongdoing. Do not imply that a correction instantly removes grievances or that a reputation score proves guilt.

Run `python3 -m unittest discover -s <skill_dir>/scripts -p 'test_*.py' -v` when validating or modifying the engine. Use `scripts/check_stability.py` and `scripts/check_modern_stability.py` for reproducible multi-world checks.
