# Agency follow-up: corrected offer / acceptance

This separate fresh-store check does not alter the original seven-turn evidence. The test prompt explicitly stated: **World resolver cannot invent player decisions or commitments.** Two more agent-authored turns were submitted through real CLI subprocesses.

1. Player asks whether Mara needs help. World offers the seed-delivery task, leaves the tin with Mara, and awaits a decision. Export verified `player.commitments == []` and tin holder `mara`.
2. Player explicitly accepts, promises delivery, and takes the offered tin. Only this resolution adds the commitment and transfers the tin to `courier`.

Both resolutions passed. Final replay matched exported state. The configured two-turn budget paused the session after acceptance. This demonstrates the corrected resolver practice, not an engine-level semantic guarantee: the engine cannot infer acceptance from arbitrary prose and still relies on the host to respect player agency.

Evidence: `agency-followup.jsonl` contains all 10 CLI requests/results, including replayed final state. Original seven-turn evidence remains unchanged.
