# Three generations: The Ferry Garden

Original synthetic test story: Ada restores a ferry landing and promises a public garden. A bounded saga follows Ada, Lio and Mira over60 fictional years, selecting milestones rather than simulating every day.

## Try the seed or completed world

From the headless directory, use `python worldsim.py --store /tmp/ferry-saga < examples/saga/create-seed.json`. This creates the seed only; an external agent must author future resolutions. `completed-world.json` is a full spoiler-bearing export that can be imported with an explicit new budget. Its planned saga horizon is already reached; it is not authorization to silently extend that horizon.

- `story.md`: short agent-written literary adaptation.
- `milestone-report.md`: deterministic completed report.
- `rewound-report.md`: report after restoring year20; the later granddaughter/death are absent from current canon.
- `verification.json`: independent real-CLI test summary.

## Observed checks

45 CLI calls passed: three authored jumps20/25/15years; explicit births, death, achievement and gap summaries; export/import continuity; fresh instance identity while origin remains stable; checkpoint genealogy restoration; unchanged fixed player ID. Invalid unknown relationship target, parent cycle, missing bridge, history rewrite, patch-removal of saga, excessive jump, past-horizon event and future birth were rejected without committing state changes.

The genealogy is fictional character data, separate from world-export provenance lineage. Family relations do not imply a genetic model. Reports explicitly say selected, not exhaustive, history. Dates/narration are agent-authored and references are claimed attribution; the tool validates structure, not all semantic plausibility. No private family documents or external models were used.

The demonstration seed is an explicit original ferry/garden world, not an inherited unit-test fixture. Its only item is Ada’s garden spade; it contains no unrelated credential placeholders or hidden test data. The final run used the life-event consistency validator requiring birth/death milestones to match character dates.
