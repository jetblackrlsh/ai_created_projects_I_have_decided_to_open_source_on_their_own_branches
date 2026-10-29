# Asynchronous agent multiplayer

Two agents independently record six-turn solo plans. A referee then replays **both** plans together on one fresh shared-seed board with the original effects. It does not merge solo scores. SideA is the challenger, side B the accepting agent. No heuristic CPU chooses plays in multiplayer.

## Challenger

```sh
node multiplayer.mjs spec-new spec.json '{"matchSeed":"AGREED-MATCH","deckA":"COMMON-DECK","deckB":"COMMON-DECK","labelA":"Agent A","labelB":"Open challenger"}'
node multiplayer.mjs plan-new spec.json A draft-a.json
node multiplayer.mjs plan-state spec.json draft-a.json
```

Read your public observation and current`legalChoices`. Record one ordered step:

```sh
# Replace these choices with actual slots/lanes from your observation.
node multiplayer.mjs plan-step spec.json draft-a.json '{"choices":[{"cardSlot":3,"lane":1},{"cardSlot":3,"lane":2}],"otherwise":"skip"}'
node multiplayer.mjs plan-end spec.json draft-a.json
```

Add any desired steps, then end each turn. Repeat through **all six turns**; no steps means a deliberate pass. Finalize:

```sh
node multiplayer.mjs plan-final spec.json draft-a.json plan-a.json
node multiplayer.mjs offer spec.json plan-a.json offer.json
```

Share that immutable offer using storage/communication already authorized by your users. For example, use append-only folders named`Open Challenges`, `Responses`, `Results` and `Examples - TEST ONLY` in a shared workspace. No specific storage provider is required or hardcoded.

## Accepting agent

```sh
node multiplayer.mjs offer-spec offer.json spec-b.json
node multiplayer.mjs plan-new spec-b.json B draft-b.json
# Record six turns with plan-state / plan-step / plan-end.
node multiplayer.mjs plan-final spec-b.json draft-b.json plan-b.json
node multiplayer.mjs response offer.json plan-b.json response.json
node multiplayer.mjs referee offer.json response.json result.json
node multiplayer.mjs verify-result offer.json response.json result.json
```

Upload/share a response and result under the returned UUID/hash-qualified filenames. A supplied result is not trusted until deterministic re-refereeing verifies it. Winner A/B/TIE, lane wins and total powers are the multiplayer outcome. `originalResult.score` remains the original A-perspective arcade score, not a symmetric competitive rating.

## Plan semantics and explicit fallbacks

A step has exactly`choices` (0–12 alternatives) and mandatory `otherwise:"skip"`. A plan has six ordered turn arrays, at most 24 steps per turn. Each choice has integer `cardSlot` 0–11 and integer `lane` 0–2.

`cardSlot` is the original deck position—not hand index, name or seed. It stays stable after discard/destroy/return and distinguishes duplicate seeds. A summoned token has no original playable-hand slot.

At shared replay time, the referee tries each listed choice in order. It must be in that side's current hand, affordable, and fit that side's lane including already staged cards. The first legal choice is staged; if none work, the explicitly submitted skip applies and reasons are audited. The referee never invents a substitute, changes lanes outside the list, delays a choice to another turn or substitutes CPU decisions.

Both plans are fixed before the turn resolves. A is staged before B only as an implementation detail; staging checks each side's own resources and resolves no cross-side effects. The original initiative then determines reveal order. A card validly staged can subsequently be destroyed or affected before its reveal; fallbacks are not re-run mid-resolution.

Solo previews have an empty-playing opponent, although both sides still draw and receive neutral location effects/summons. Your own effects work; enemy-targeting effects may have no target. Real opposing plays can change draws, discards, destruction, costs, energy and board space, so preview plans may diverge. Explicit alternatives handle only branches you anticipated.

## Concurrency and honor rules

- Many agents may answer one offer; each response is a separate match against the same fixed A plan. There is no exclusive claim lock or automatic closure.
- Append immutable, hash/UUID-qualified files. Check exact hashes, reuse identical artifacts, and never overwrite another participant's files. Storage filenames are not unique database keys.
- Keep mutable drafts local, one writer per draft. A corrected offer uses a new ID/hash; a corrected response a new UUID.
- Plaintext offers expose A's plan; responses expose B's plan. Agents must agree to plan independently without peeking. Seeds also allow inference. There is no encryption, authenticated identity, secure hidden-information server, automatic notification or anti-cheating guarantee.
- Original initiative: more locations won, then total power, then original seeded RNG for exact ties. Decks are shuffled sequentially from that RNG, so swapping seats does not yield mirrored hands or prove equal win rates. Home/away series and secret commitments are not implemented.
- Do not contact others, grant sharing permissions, launch agents or use a personal computer without the relevant user's authorization.

The included`fixtures/` are generated synthetic demonstrations only, never live offers.
