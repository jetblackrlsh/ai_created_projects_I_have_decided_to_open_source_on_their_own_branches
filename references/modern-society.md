# Modern society and mastery: original v3 rules

This is an original, explicit interpretation of superhero-society story possibilities. It does not reproduce or claim knowledge of any video creator's hidden simulator. Its numbers are invented game-model quantities, not estimates of real politics, economics or people. Phones, the ranking app, media and elections exist only inside saved simulation state; no real services, accounts or communications are used.

## Use-earned power mastery

A successful state-changing action earns one XP and one use in the ability’s own power_mastery record. Each ability separately loses five XP after ten unused years and every five thereafter; using another ability does not prevent this rust. Cumulative uses remain. See [expanded systems](expanded-systems.md) for all newer subsystems. Failed actions and ward-blocked attacks earn none. Every ten XP increases that power’s level by one, to a maximum of five. Children and newly created clones start at zero; mastery is not inherited as free experience. An old full save without any mastery fields starts at zero. A shared-mastery save migrates once by crediting its previous shared XP/level to each then-held ability, explicitly marked in state because old per-power attribution is unknown. Later acquisitions start at zero; archived personal progression is retained for lost powers but excluded while unheld.

Mastery changes mechanics:
- Energy cost falls by two per level, to a minimum of 15.
- Cooldowns fall by one year per two mastery levels, to a minimum of two years. Necromancy/Cloning retain longer base cooldowns.
- Fire/Lightning injury, Water/Weather/Plant Control food production, Strength hauling and Healing/Regeneration/Immortal recovery gain 10% per level.
- Other powers gain efficiency and reuse frequency, not unimplemented new physics or arbitrary effects.

The level used for an action is the level before that action's experience award. Existing resurrection, clone, resource and action caps still apply. Compatibility mastery_level is the best CURRENT ability’s level. Exported mastery_levels describe that best level per living powered agent; pooled_powered_agent_mean_mastery summarizes those agents. power_mastery_levels and pooled_held_power_mean_mastery instead count every held ability’s separate level. Rankings use best held mastery: novice secondary powers neither inherit expert effects nor dilute expertise. See README for per-power configuration and named goals.

## Run a modern world

Use --mode modern, default horizon 100 years and 300 founders, with all 53 powers eligible. Example:

python3 scripts/simulate_world.py --mode modern --runs 100 --years 100 --power-rate 0.20 --output-json modern.json --output-report modern.md

Modern mode replaces the monarchy/court loop with households, employment, phones, public rankings, media and elected administrations. It retains concrete powers, inheritance, aging, injuries, resurrection/cloning, resources and seeded randomness. Versus remains its separate aggregate model; older individual-agent modes retain their own institutions while gaining mastery.

## Work, phones and the public ranking app

Each person records job, income, wealth, phone ownership, reputation, followers and app_score. Adults compete for a limited number of professional positions. Job selection combines curiosity, compassion, public reputation, app visibility and a small seeded random variation. Higher scores can secure paid medical, engineering, civil-service or hero-contractor opportunities; others teach, farm or may remain unemployed. Inactive children and prisoners do not earn job income. Annual earnings change wealth, phones can be purchased with sufficient savings, and farmers/medics/engineers add food/medicine/infrastructure.

A phone enables a public app score combining mastery, reputation and follower reach. Without a phone, or while the app is banned, app_score is zero. The score affects employment ranking, electoral nomination and campaign influence. It is not merely a decorative leaderboard. App_opportunities counts promotions into professional work when app_score is at least 40; it is a model indicator, not a causal estimate of how many jobs would otherwise have been lost.

Public supportive power actions can improve reputation and followers; public villainous acts harm reputation while still attracting attention. Secret acts do not automatically become public reputation changes. Independent journalists can expose a greedy leader when press conditions permit, reducing their reputation and improving oversight. The bounded simulated feed now supports virality, fakes, forensic corrections and lingering grievances; see expanded-systems.md. It does not access real internet services or implement a full social graph/natural-language persuasion system.

## Elections and governing consequences

Elections occur in year 1 and every four years afterward, with early elections when a leader dies or no leader exists. Adult, non-imprisoned citizens cast individual ballots. Up to three eligible nominees are selected using charisma, reputation and app visibility. Voter preferences combine personality alignment, charisma, public reputation, phone-mediated campaigns, a freedom-oriented platform preference and seeded noise. Nominees belong to toy pluralist, security or populist parties derived from personality. These are original game archetypes, not real-world parties.

The winner actually becomes leader. Democratic administrations limit each person to two election wins. Different administrations alter freedom, election integrity and press freedom. Pluralists generally reinforce institutions; security administrations trade liberties for control; populist changes depend partly on greed. These are explicit fictional rule assumptions, not empirical claims that political labels determine outcomes.

Freedom, election integrity and press freedom range from 0 to 100. Freedom below 35 or integrity below 30 triggers an authoritarian regime. Freedom at least 55 and integrity at least 50 allow democratic restoration. Elections below democratic/free-election criteria favor the incumbent and are marked restricted, rather than counted as freely competitive elections. A free-democracy final outcome requires democratic regime and freedom at least 60; other democratic worlds are constrained_democracy. Extinct worlds are reported separately.

Democracy_survived means the world remains populated and has experienced no recorded democratic breakdown. A world that breaks down and recovers can finish democratic without satisfying this stricter survival measure. Democratic_years, breakdowns, recoveries, free elections and peaceful transfers are exported separately.

## Modern-only interventions

Use existing checkpoint/save commands with these --policy-override choices:
- civil_rights_act: adds annual liberty protection.
- election_protection: reinforces election integrity.
- free_press: enables independent press oversight; it is already enabled initially.
- emergency_powers: imposes recurring freedom/integrity penalties and can produce authoritarian outcomes.
- ban_ranking_app: removes app scores and app-mediated opportunities/campaign visibility.
- restore_ranking_app: reenables the app.

Existing decrees such as registration_act and power_ban remain coarse institutions; in modern mode they also reduce the freedom index. Amnesty releases prisoners, and build_* adds the corresponding counter-tech. These are not comprehensive law-enforcement or fiscal models. Modern policy changes apply on resume at the next year and remain in force; --policy-override represents the user's simulation intervention, not a real political action.

Injected events are simplified modern crises/opportunities: power-awakening variants affect selected citizens; famine/visitors cause casualties; demon_rift enables emergency powers; golden_age adds food; prophet boosts charisma; nothing records a quiet intervention. They occur in the next simulated year in modern mode, unlike the original modes' fresh-run year-5 timing.

## Output, compatibility and interpretation

The featured world's JSON includes agents, jobs/income/wealth/phones, ranking_leaderboard, government, election ballots/history, indices, power metrics and mastery. Its Markdown report shows modern results rather than monarchy/dynasty fields. Batch output counts free democracies, constrained democracies, authoritarian worlds and extinctions; reports democratic survival and mean freedom, integrity, elections, transfers, unemployment, app opportunities, press freedom, phone ownership, media reports and democratic years.

Version-3 full saves include society, elections, reputation, phones, jobs, mastery, powers and RNG state. Full v1/v2 saves remain loadable in their original modes; people and history are retained and missing new fields initialize at the resume boundary. This intentionally changes future behavior to the current engine's rules. It does not silently turn old monarchies into modern societies. Legacy summary-only files remain unresumable.

Same-version deterministic save/resume and ballot totals are tested. Scenario comparisons and invariants test that policies and app availability have mechanical consequences, but do not validate the invented freedom scale, prove competitive balance or predict real democracies. A drama-selected featured world is not automatically representative of the batch.
