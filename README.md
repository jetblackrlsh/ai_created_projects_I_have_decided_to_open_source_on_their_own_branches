# Single-spread motion comics

AI-assisted source and two reusable agent skills: create an entire eight-page comic as one image, then adapt the accepted spread into a panel-focused motion comic with local Kokoro voices and Stable Audio Small music/SFX. This is camera animation over existing artwork, not articulated character animation.

## Get this project

Use branch `project/spread-motion-comic`, not `main`. In GitHub select this branch and choose **Code → Download ZIP**, or:

    git clone --branch project/spread-motion-comic --single-branch https://github.com/jetblackrlsh/ai_created_projects_I_have_decided_to_open_source_on_their_own_branches.git

## Included

- `skills/create-eight-page-comic-spreads`: whole-image generation, page/panel planning and visual QA. Requires an image-generation-capable host; no model or service account is included.
- `skills/create-spread-motion-comic`: adaptation workflow, reviewed pixel-crop renderer, local speech/music/effects adapters, pinned model/runtime recipe, audio-mix checks and regression tests.
- `tests/smoke_render.py`: self-contained synthetic render and negative controls. It creates no real story and requires no model download.

Install the two folders through your agent host's supported skill installer, or read their SKILL.md files directly. Ask it to create a spread, then use create-spread-motion-comic to adapt that image. Bring your own authorized source image, transcript and model access. The bundle does not grant permission to access personal computers, publish private stories, upload files or incur paid-service charges.

## Renderer quickstart

Requires Python 3.12, Pillow, FFmpeg and ffprobe on PATH. The audio runtime additionally targets Linux x86_64. Install rendering requirements from PyPI:

    python3 -m pip install -r requirements.txt
    python3 tests/smoke_render.py

A passing test writes a temporary synthetic source, silent test audio and two-shot video, fully decodes it, and checks bad source/timing rejection. Silence here is explicitly a technical fixture, not a produced motion-comic soundtrack.

For a real production, first prepare a finished 48 kHz mix and a reviewed manifest as described in `skills/create-spread-motion-comic/references/manifest.md`, then:

    python3 skills/create-spread-motion-comic/scripts/render_spread.py manifest.json output.mp4

Normal production defaults to **1280 × 720 at 24 fps**, including the primary delivered copy. Omit width/height/fps in the manifest for this default. Explicit width 1920 and height 1080 remain supported when the user requests a higher-resolution version.

The CLI validates source SHA-256, rectangles, IDs and duration. It exits nonzero on invalid input or failed encoding. Every output frame is contained/letterboxed, never stretched. `end_rect` enables brief overview-to-panel zooms; separate those from spoken full-panel holds. The accompanying `.render.json` records technical checks, not perceptual approval.

## Local audio production

No private skill dependency is required. Read `skills/create-spread-motion-comic/references/runtime-setup.md` and `vn_spec_schema.md`. After checking model terms and obtaining any necessary user authorization:

    python3.12 skills/create-spread-motion-comic/scripts/setup_audio_runtime.py --runtime-root ./audio-runtime --restore --test --report ./audio-setup-report.json

This downloads about 2 GB of pinned official weights plus isolated dependencies; allow at least 5 GB free. Do not run this command merely to install the skill. The default check without `--restore` performs no downloads. `--test` generates fresh local Kokoro, music and SFX smoke clips and does not certify listening quality.

Use the runtime's Python and `kokoro_tts_vn.py --help` / `sa3_vn_audio.py --help` with the documented story schema. Keep one distinct available stock voice per actual speaker. Narration-only comics remain narration-only. The adapters produce measured speech timelines, voice stems, generated music/SFX and mixing diagnostics. Map the timeline to the source panel rectangles, accounting for silent camera-transition gaps; never estimate speech duration from text.

## Tests and limitations

    python3 -m unittest discover -s skills/create-spread-motion-comic/tests -p test_audio_setup.py -v
    python3 skills/create-spread-motion-comic/scripts/test_priority_audio_mix.py
    python3 skills/create-spread-motion-comic/scripts/test_sfx_comfort.py

Audio numerical tests require NumPy/SciPy/SoundFile. See TEST_REPORT.md for commands actually run for this release. No automatic hosted deployment or CI is configured. Source text/panel extraction and final visual/listening review remain agent/user tasks. The release test does not regenerate all audio models or the original private comic. Tiny source lettering remains tiny source information even after upscaling. Quantitative audio checks cannot prove intelligibility, comfort or audible balance.

## License and provenance

Original project contributions are offered under the repository's CC0 1.0 Universal license, only to the extent the contributors hold those rights. External models, packages, FFmpeg and image-generation services retain their own terms. See THIRD_PARTY_NOTICES.md and PROVENANCE.md. No model weights, private comic, private conversation, generated test video, credentials or personal archive is distributed.
