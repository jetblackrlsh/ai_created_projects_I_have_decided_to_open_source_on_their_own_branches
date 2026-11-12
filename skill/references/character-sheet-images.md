# Optional character-sheet images

## Source of truth

1. Resolve the requested character or build a compatible character JSON under the existing engine rules. Preserve requested identity and supplied visual references. Obtain missing reference images only when they are necessary to match a particular person; do not substitute a remembered likeness as a verified reference.
2. Run `validateCharacter` and each power through the current bundled runtime. Stop on errors. Use `modifier(score)` and a fresh `Engine(adventure, character, seed).getState()` to derive starting resources rather than calculating from memory. For an in-progress character, use its validated save and label current versus maximum resources.
3. Save that exact JSON as the authoritative import file. Create a concise sheet-text manifest directly from its fields: name/concept, six ability scores and modifiers, health/energy, innate capabilities, and every power's actual effects, targets, costs, cooldowns, durations and limits. Never add unearned bonuses, free abilities or descriptive promises absent from the data.

## Generate and inspect

Use the available image-generation tool for requested illustrated sheets. Prefer a clean portrait-plus-stat-panel layout, large readable text, restrained decoration, and visible grouping of abilities. Use reference images only for visual identity and style, not as numerical authority. Include the exact approved text from the manifest in the prompt. Avoid crowding: use additional sheets when the full mechanical description will not fit legibly. A concise overview must say it is an overview and direct readers to the full JSON for omitted details.

Inspect the output at readable resolution. Compare every visible number, stat label, power name, cost, limit and capability against the manifest. Check anatomy, spelling and visual identity. Regenerate or correct discrepancies and inspect again. Do not claim that image text is verified merely because the prompt was correct. If text cannot be reliably corrected, deliver the accurate text/JSON alongside clearly labeled illustrative artwork, not a falsely certified sheet.

## Delivery and boundaries

Deliver the image plus its matching validated JSON. Explain how to import the JSON in the game's character setup; images cannot be imported as characters. Store requested private character sheets in the user's appropriate private folder, not the public engine repository by default. Do not bundle licensed franchise art or private likeness references in the CC0 engine/skill release.

For unsupported concepts, disclose the mechanical approximation before presenting the sheet as playable. Examples: teleportation may be a capability recognized by authored traversal choices; a summon may provide a bounded check bonus rather than an independent actor. A descriptive label never overrides the actual engine effects. No engine changes are authorized by a request for character art.
