# Heroic Motion Comics — tool and agent skill

Turn original comic panels into normal-speed narrated motion comics and matching title-card audio dramas. This is panel-based camera animation, not articulated character animation.

Read SKILL.md, then assets/tool/README.md and assets/tool/docs/heroic.md. From assets/tool:

```sh
python -m pip install -r requirements.txt
python -m unittest discover -s tests -v
python heroic_motion.py validate-exact examples/heroic-harbor/project.json
```

Install FFmpeg/ffprobe separately. Exact-master mode preserves AAC packets and their timing; the included neutral 12-second harbor fixture includes a complete soundtrack and paired outputs. New-audio mode supports separately configured local Kokoro and Stable Audio installations; no models, credentials, auto-download or paid API are bundled. Review third-party model/runtime/output terms before use.

The 25-test suite was rerun from this sanitized publication copy, including a 50ms negative drift test, pixel-exact panel crops and full decode. Reproducible older demo renders, redundant stems and delivery ZIP were omitted to keep this public distribution compact; raw neutral assets and projects remain. The new heroic fixture outputs are included for regression tests.

Original tool/skill code is MIT-licensed, with inherited Motion Manga engine notices preserved. Generated media and third-party models/dependencies are not relicensed by MIT; see assets/tool/NOTICE.md. No private user stories, book scans, copied instructional art, distinctive private cast or artifact are included. No comics-publisher affiliation or endorsement.

Drawing companion: https://github.com/jetblackrlsh/ai_created_projects_I_have_decided_to_open_source_on_their_own_branches/tree/project/heroic-comics-drawing
