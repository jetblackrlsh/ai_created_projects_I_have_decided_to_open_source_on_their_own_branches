# Story-first adventure review

This review is mandatory for every new or substantially revised adventure. Mechanical validation alone is not narrative validation.

## 1. Draft before programming
Write the adventure first as a branching choose-your-own-adventure manuscript, not JSON and not engine code. Use scene IDs, a short title, about one plain-language paragraph per scene, choices, and separate success/failure passages with destinations. State concrete locations, people, obstacles, stakes and immediate goals. Do not pad scenes with thematic commentary, extended metaphors or repeated moral interpretation.

Establish information before the player acts on it. If a choice uses a key, person, plan, location, weakness or special rule, earlier text on EVERY valid inbound path must introduce it, or the current scene must clearly establish it. Do not assume a clue or ally from an optional branch.

## 2. Read as a newcomer
Read complete valid paths in order, using only information the player has encountered on that path. Start without the author's background knowledge. Include a success-heavy path, a failure-heavy path, a nonpowered path, and each materially different branch and ending. For larger graphs, read every distinct incoming transition into each scene, then trace complete representative paths. Record coverage, not a vague “reviewed.”

For each transition check:
- What does the player know, want, possess and control now?
- Is the chosen approach understandable from the current paragraph?
- Do the success/failure text, costs, flags, inventory, damage and next scene agree?
- Does the next paragraph say how the player got there and preserve the previous outcome?
- Has an enemy actually been defeated, left behind, or still remain present?
- Does a later action use information or an item the current route never supplied?
- Could a first-time reader explain the immediate problem without author notes?

Mark incoherent or unexplained transitions as FAIL. Revise the manuscript and repeat affected full paths until failures are resolved. Do not implement known narrative failures and hope engine tests will fix them.

## 3. Implement and reconcile
Only after the manuscript review passes, translate it into supported adventure data. Keep consequential actions checked, with specific outcomes and viable ordinary approaches. Add no unsupported powers to make a scene work. Preserve custom/imported/random character support; no route may assume a prepared character's unlisted ability.

Compare the implemented graph and every outcome against the reviewed manuscript. Generate real success/failure play logs and read them again in sequence. Record any differences and revise the data or manuscript. Include a short review report listing paths/edges examined, issues fixed, and remaining limitations. Do not claim all stories were reviewed because the engine passed tests.

## 4. Interface review
Keep the current scene and next decision prominent. Secondary information belongs in disclosures or tabs. Make selected power descriptions, effects, duration, cost and cooldown visible before commitment. Check long names, long descriptions, empty powers, unavailable actions, party turns, saves, Auto play, and endings. Test desktop browser rendering at typical laptop and desktop widths if available; distinguish real browser QA from a DOM test or static code review.
