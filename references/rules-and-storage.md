# Rules and storage v1

## Default homebrew
Attributes: Might, Agility, Insight, Presence. Allocate +3, +2, +1, +0 once at creation (or choose a different explicit system at setup). A relevant power grants only an explicitly established bonus, never automatic superiority. DCs 10/13/16/19/22/25 correspond to easy/moderate/challenging/hard/formidable/extraordinary. Total = d20 + named modifiers. Natural 20 succeeds and natural 1 fails by default, taking precedence over partial success; only call possible checks. Otherwise total >= DC succeeds; a predeclared miss by 1–3 is partial; other misses fail. If natural overrides are disabled, resolve numerically but narrate appropriate non-outcome-changing flavor. No retroactive stakes or modifiers.

Combat default: spotlight rounds; player acts, each active opposition group acts once, then allies act. Declare threat and resources before beginning. One meaningful action and reasonable movement per turn. Fictional harm uses three recorded conditions (Hurt, Injured, Incapacitated); define what causes/removes each before risk. No infinite player reactions while enemies wait. Alternative tactical rules are allowed if fixed at setup. No numeric combat subsystem is silently implied by the validator.

## Canonical state
The toolkit creates the core state. Extend it with setting-specific fields as needed, e.g. scan collections, but do not require any franchise. Canonical keys include schema_version, campaign_id, title, system, created_at/updated_at, revision, rules, setting, tone, player_characters, companions, inventory, abilities, transformations, factions, npcs, relationships, locations, quests, clues, world_clocks, resources, current_scene, pending_check, resolved_check_ids, turn_index, session_index, chronicle, continuity_flags, open_threads, next_scene_prompt. Keep secrets in a separate GM-only file when the storage surface actually supports that; otherwise state that private GM storage is unavailable rather than pretending.

A pending check contains id, scene_id, action verbatim, dc, named modifiers, success/failure text, optional partial text and partial_margin, natural_override. Chronicle records sequence, verbatim action/dialogue, roll math, actual consequences and changes; add in-world timestamps when known. For actions without dice, record roll:null and an explicit narrative-resolution provenance.

## Durable save protocol
Local toolkit saves are atomic with a lock and expected revision; commit state and its embedded chronicle together. session-log.md is a regenerated readable projection, not an independently authoritative ledger. A stale leftover lock requires checking that no writer is active before removal. Export does not advance clocks. Copies of player exports must omit GM secrets.

Connected Drive adapter is an agent workflow, not bundled credentials: locate authorized folder/file, read latest revision/checksum, compare expected version, upload changed canonical state, re-read and compare content/checksum. Use a connector with conditional updates where available. If no compare-and-swap is available, avoid concurrent writers and disclose that boundary. On conflict, reconcile, never silently overwrite. Keep immutable turn snapshots if needed. Never store access tokens inside campaign state. A Google Doc is a human-readable export, not a replacement for JSON.

On pause, include the full chronological log and then a summary plus exact pending check/resume point. Do not omit unsuccessful actions. Avoid needless tool calls for story flavor but do not sacrifice the per-action save requirement. Batch only state+log writes belonging to the same action, not unresolved rolls.


### Explicit character math and compatibility
New campaigns begin with `character_setup.confirmed=false`; character review precedes the first scene/check. Stat-aware rules use `rules.check_math={"mode":"attributes","formula":"direct"}` or `formula:"d20"`. Store the player's original attribute values on the character, not only a summarized total. Each declaration carries actor_id, attribute, named circumstance_modifiers; the engine derives and freezes attribute_snapshot and modifiers. Legacy states with no check_math retain their original mechanics. Narrative mode is explicit, not an accidental missing sheet. Pending checks always resolve from the declared snapshot. No migration mid-check.

Plugin circumstance entries are `{name,value,reason}` objects in an array; the Python adapter also accepts a named mapping for legacy local callers. The host must always present reasons.
