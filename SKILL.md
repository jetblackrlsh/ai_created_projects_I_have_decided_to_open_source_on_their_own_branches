---
name: ascii-film-maker
description: Produce a complete animated ASCII film — detailed color ASCII video converted from shaded raster art, with an audio-first script, Kokoro TTS voices, and a fully generated soundtrack (Stable Audio 3 Small-Music score + Small-SFX effects) mixed and encoded locally on CPU. Trigger when asked to make an ASCII animation/film/video with voices, music and sound effects.
---

# ASCII Film Maker

Make a finished ASCII film, not a silent novelty: **detailed color ASCII frames**
(converted from shaded raster scenes you compose in code), **a story that works
by audio alone**, **distinct character voices**, and a **generated score and
sound-effects track**. Everything runs locally on CPU; no browser, no cloud
render, no per-generation fees.

The reference production for this workflow is a 213-second original samurai
story at 1848×1040, 12 fps (2,556 frames): pose-rigged shaded sprites converted
through the density pipeline below, 16 voice lines, 3 generated music cues and
20 generated effects clips.

## Pipeline at a glance

1. **Script** — audio-first story, written for the ear.
2. **Voices** — Kokoro TTS per line; measured durations define the timeline.
3. **Visuals** — compose each frame as shaded raster art (pose rigs + scene
   drawing), then convert every frame to color ASCII.
4. **Music** — Stable Audio 3 Small-Music cues matched to story beats.
5. **SFX** — Stable Audio 3 Small-SFX clips placed on an event timeline.
6. **Mix** — staged FFmpeg mix: music sidechain-ducked under the voices,
   effects on top, peak-limited master.
7. **Encode + verify** — H.264/AAC MP4; decode check, level checks, frame
   checks before anything ships.

## One-time setup

### Stable Audio 3 (LiteRT route — the one that works on CPU)

Use Stability AI's official **optimized** collection with its LiteRT runtime,
not the full PyTorch packages:

```bash
git clone https://github.com/Stability-AI/stable-audio-3
cd stable-audio-3/optimized/tflite
python3 -m venv .venv
.venv/bin/pip install "ai_edge_litert>=2.2.0" "numpy>=1.24" \
    "sentencepiece>=0.2" "soundfile>=0.12" "huggingface_hub>=0.20"
```

Then fetch **only the four weight files you need** (~1.74 GB total) with
`scripts/download_sa3.py` in this package. It downloads from the public,
ungated `stabilityai/stable-audio-3-optimized` collection at a pinned
revision, streaming with plain `urllib`, and verifies exact sizes and the
publisher SHA-256 hashes before accepting a file. See
`references/models-manifest.json` for the file list.

> **Do not rely on `hf_hub_download` / Xet for these files.** In the reference
> environment the Hub route stalled at 0 bytes for minutes while the direct
> HTTPS route fetched everything in minutes. If a lazy download stalls, stop
> and use the direct script.
>
> The gated full-model repos (`stable-audio-3-small-sfx` /
> `stable-audio-3-small-music`, PyTorch safetensors, ~5.8 GB) are **not**
> needed for this workflow.

Run generations **offline** once the files are in place:
`HF_HUB_OFFLINE=1 HF_HUB_DISABLE_IMPLICIT_TOKEN=1`.

Generation settings that worked: `--dit-precision w8a8
--decoder-precision w8a8 --steps 8 --cfg 1 --threads <vCPU count>`, explicit
`--dit sm-music|sm-sfx --decoder same-s`, fixed `--seed` per clip for
reproducibility. Use **plain descriptive prompts** on this runtime (the
`TrackType:` prefixes belong to the PyTorch models). For music, end the
prompt with `instrumental, no vocals` unless vocals are intended.

### Kokoro TTS

`kokoro-onnx` with the Kokoro-82M model + voice pack. Cast deliberately:
one voice per character, a distinct narrator voice, small speed adjustments
for gravity (e.g. 0.95 for a solemn gatekeeper). `scripts/kokoro_speech.py`
renders a lines file to per-line WAVs and prints measured durations.

### Tools

Python 3.11+, `numpy`, `soundfile`, `Pillow`, and `ffmpeg` on PATH. A bold
monospace font for the ASCII render (DejaVu Sans Mono Bold is the reference).

## Stage 1 — Script (audio-first, non-negotiable)

These rules exist because a film that only works with eyes open is a failed
film:

- **The audio alone must tell the whole story.** The narration describes every
  meaningful action as it happens, so a listener who never sees a frame is
  never confused about what is occurring.
- **The narrator introduces each speaker storybook-style** ("Hayate answered
  gently"), and then **the character speaks in their own voice**. The narrator
  never reads the characters' lines, and never relays a conversation in
  reported speech — adapt reported speech into direct dialogue.
- **Establish physical story objects early in narration** (a weapon, a sealed
  cord, a key). If the climax turns on an object, the audience must already
  know it exists and what it means.
- Write the script as a line list: `(id, voice, speed, text)`. Narration lines
  carry the action beats; dialogue lines are short and castable.

## Stage 2 — Voices and the canonical timeline

Render every line first and **measure** each duration. The voice timeline is
canonical: visuals, music cues and effects are all scored against it, never
the other way round. Assemble the voice track (`voice.wav`, 48 kHz) before
any other audio work. Keep a per-line start-time table — subtitles, cue
boundaries and effect placements all read from it.

Subtitles: condensed text per line, shown while the line plays. Keep them
clear of characters' faces (see Visuals).

## Stage 3 — Visuals (shaded raster → color ASCII)

Do **not** draw characters out of ASCII characters directly — stick-figure
glyph art reads as crude next to converted art. Instead:

1. **Draw characters as shaded raster art** with a small pose rig: a function
   per character that draws the figure (proportions, palette, signature
   props) in named poses (`idle`, `walk`, `strike`, `block`, `charge`,
   `kneel`, `hit`, …) with PIL. Brighten palettes once and re-check — a first
   pass that is too dark or sparse converts to mush.
2. **Compose each frame as a raster scene**: background, ground line, actors
   placed by the choreography timeline, effects shapes (arcs, waves, petals),
   then story-critical props drawn visibly on the characters (the reference
   film's red oath-cord is drawn on the gatekeeper's chest in every duel
   frame, and its cut ends stay in the dust afterwards).
3. **Convert every frame** with the density pipeline (`scripts/ascii_convert.py`):
   - downscale the scene to the cell grid (reference: 1680×1040 scene →
     168×52 cells, output 1848×1040, cells 11×20 px);
   - luminance normalized as `clip((lum − 10)/245, 0, 1) ** 0.7`;
   - density ramp `" .·:;+*x%#@"` picks the glyph per cell;
   - glyph color = the cell's average RGB × 1.4 (clipped), with dark colors
     lifted so their max channel reaches ~46 (keeps dark costumes readable);
   - draw glyphs in a bold monospace font on a near-black background.
4. **Verify visually at full size**, frame by frame at story beats — and if
   captions/subtitles are composited, check their geometry against face
   positions. Contact sheets alone have missed caption-over-face collisions
   before; a full-size pass is the authority.

Frame rate: 12 fps is enough for this aesthetic and halves render cost.

## Stage 4 — Music (Small-Music)

Score by **story beats**, not by the clock: one cue per dramatic movement
(reference film: arrival/tension 64 s, duel 100 s, resolution 55 s). Each cue
is a separate generation (≤ 120 s per generation on the small models) with a
prompt naming instrumentation, mood and dramatic function, ending
`instrumental, no vocals`. Crossfade cues at their joins (2 s), underneath
narration where possible. Normalize cues to a common RMS (≈ −19 dBFS) before
assembly so no cue swallows the next.

## Stage 5 — SFX (Small-SFX)

- **Every film ships with a sound-effects layer.** Silence needs a written
  reason in the production notes; "forgot" is not one.
- Build an **event score**: a list of `(time, clip, gain, source_offset)`
  keyed to the voice timeline's action beats (draws, swings, impacts, the
  story-object moment, the door, the weather). One generated clip per effect
  type, reused at multiple timestamps with different source offsets for
  variation.
- **Scan every generated clip's peak/RMS before mixing.** Generations vary
  wildly in loudness (a whispered snip vs a clipping stomp); set placement
  gains from the measurements, not from hope.
- Ambience counts: a quiet night/wind bed under the opening and the finale
  makes the world feel inhabited. Keep it low.

## Stage 6 — Mix (staged, verified)

Build three 48 kHz stems: `voice.wav` (untouched), `music_bed.wav`,
`sfx_bed.wav`. Then, with FFmpeg, **in stages**:

1. Duck the music under the voice:
   `sidechaincompress=threshold=0.02:ratio=8:attack=20:release=400`
   with the voice as the sidechain → `music_ducked.wav`.
2. Mix voice (centered) + ducked music + effects with `amix=normalize=0`,
   then `alimiter=limit=0.72` → master (peaks ≈ −2.9 dB).

> **Never feed one filter output to two downstream filters in a single
> filtergraph** (e.g. a mix used both as a sidechain source and as an amix
> input). It can silently drop a track with no error. Intermediate files are
> cheap; a voiceless film is not.

**Verify the master before encoding:**

- Voice RMS in narration windows ≈ voice-track RMS (music/effects add, never
  replace).
- Cross-correlate the master against `voice.wav` over a narration span:
  expect a strong peak (≥ 0.9) at a small lag (a few ms of filter latency is
  normal). Low zero-lag correlation with a strong lagged peak means latency,
  not absence — check before panicking, and before shipping.
- Event windows (impacts, the story-object moment) should measure louder
  than the seconds just before them.

## Stage 7 — Encode

```bash
ffmpeg -framerate 12 -i frames/frame_%04d.png -i master.wav \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart -shortest film.mp4
```

Verify: full decode with no errors (`ffmpeg -i film.mp4 -f null -`),
duration matches the timeline, and — for an audio-only re-take of an existing
film — an extracted frame is identical to the previous cut's frame at the
same timestamp.

## Measured performance (reference machine: 2 vCPU, ~7 GB RAM)

- Model downloads (direct route): ~1.74 GB in ≈ 3–5 minutes.
- First generation pays a one-time XNNPACK cache build (a 2 s effect took
  ~23 s cold); afterwards ≈ 5 s per short effect, 64 s music cue ≈ 29 s,
  100 s cue ≈ 43 s. A full 20-clip soundtrack: ≈ 3.5 minutes.
- Frame conversion/render and encode are project-dependent (reference film:
  ≈ 14 min render, ≈ 2 min encode for 2,556 frames).

Timings are machine-specific measurements, not promises.

## Pitfalls collected the hard way

- HF Hub/Xet downloads stalling at 0 bytes → use `download_sa3.py`.
- Stick-figure ASCII characters → always convert shaded raster art.
- One loud generation (peak 0.98) next to a quiet one (peak 0.10) → per-clip
  RMS scan + gain staging before the mix.
- Single-graph filter splits silently dropping the voice → staged mixing.
- Judging a mix by levels alone → cross-correlation check for the voice.
- Caption/subtitle collisions with faces that contact sheets miss →
  full-size visual pass.
- Music cue boundaries placed mid-line → join cues under narration or at
  beat changes, with crossfades.

## Files in this package

- `scripts/download_sa3.py` — pinned, hash-verified model downloads.
- `scripts/sa3_generate.py` — batch music/SFX generation from a clips JSON.
- `scripts/kokoro_speech.py` — line-list TTS rendering + duration table.
- `scripts/ascii_convert.py` — the density/color ASCII frame converter.
- `scripts/mix_audio.py` — stem assembly + staged ducking mix.
- `references/models.md`, `references/models-manifest.json` — model facts.
- `references/production.md` — the production playbook in full.
- `references/visuals.md` — pose-rig and conversion notes.
- `tests/smoke_fixture.py` — dependency-light end-to-end fixture check.
