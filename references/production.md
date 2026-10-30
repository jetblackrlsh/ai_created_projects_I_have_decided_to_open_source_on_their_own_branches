# Production playbook

The full workflow, in order, with the checks that keep a production honest.
Written from the reference production (a 213 s, 2,556-frame ASCII film) and
the failures that preceded it.

## 1. Script

- Write for the ear first. The narration describes every meaningful action;
  a listener who never sees a frame must never be confused.
- The narrator introduces each speaker storybook-style ("…answered
  gently"), then the character speaks in their own voice. The narrator
  never reads dialogue and never relays conversations in reported speech —
  rewrite reported speech as direct lines.
- Establish physical story objects in early narration (the reference film's
  oath-cord is described, with its knot and wax seal, a full minute before
  it is cut). Climaxes that turn on objects fail when the object debuts at
  the climax.
- Keep a line list: `(id, voice, speed, text)`. Narration carries beats;
  dialogue stays short.

## 2. Voices → canonical timeline

- Render all lines with Kokoro (`scripts/kokoro_speech.py`), record each
  measured duration, and build the start-time table. Everything else —
  choreography, cue boundaries, effect placements, subtitles — reads from
  this table.
- Assemble `voice.wav` (48 kHz) once. Never edit it downstream; fixes go
  back to the line list and re-render.

## 3. Visuals

- Draw characters as shaded raster art from a pose rig; compose full raster
  scenes per frame; convert with the density pipeline
  (`references/visuals.md`, `scripts/ascii_convert.py`).
- Story-critical props are drawn on the characters in every relevant frame,
  and consequences persist (a cut cord's knot stays in the dust).
- Subtitles: condensed per-line text while the line plays.
- Verify at full size at story beats. Contact sheets are a navigation aid,
  not a verification method — they have missed both sparse-looking palettes
  and caption-over-face collisions that a full-size pass caught.

## 4. Music

- One Small-Music generation per dramatic movement (≤ 120 s each). Prompt:
  instrumentation + mood + function + `instrumental, no vocals`.
- Normalize cues to a shared RMS (≈ −19 dBFS). Join with 2 s crossfades,
  placed under narration or at beat changes — never mid-line if it can be
  avoided, and never as a hard cut in a quiet passage.

## 5. SFX

- A sound-effects layer is mandatory. If a scene is deliberately silent,
  write the reason in the production notes.
- Write an event score against the voice timeline: `(time, clip, gain,
  source_offset)`. Generate one clip per effect type; reuse with different
  offsets for variation.
- Scan peak/RMS of every generation first. In the reference batch, peaks
  ranged 0.10–0.98 across clips; placement gains were set from the scan
  (a near-whispered cord-snip needed gain 1.8 to read at all; a stomp at
  0.95 sat correctly under its own rumble).
- Include an ambience bed (night wind, room tone) at low gain under
  openings and finales.

## 6. Mix (staged)

Stems: voice / music bed / sfx bed, all 48 kHz.

1. `sidechaincompress` the music under the voice → intermediate file.
2. `amix` voice + ducked music + sfx (`normalize=0`), `alimiter` at 0.72
   (≈ −2.9 dB peak) → master.

**Never split one filter output into two consumers inside one
filtergraph.** A mix feeding both a sidechain and an amix in a single
graph silently dropped the narration in an earlier production — the file
looked fine on levels until a correlation check was run. Intermediate
files make each stage independently inspectable.

### Mix verification (all three, every time)

1. **Levels:** voice RMS in narration windows ≈ the voice track's own RMS
   there (other stems add energy; they must not replace it).
2. **Correlation:** cross-correlate master vs `voice.wav` over a narration
   span. Expect a peak ≥ 0.9 at a small lag (the reference mix peaked at
   0.98 at +240 samples = 5 ms of filter latency). A weak zero-lag number
   with a strong lagged peak is latency, not a missing voice. No peak at
   any lag is a missing voice — stop and fix the mix.
3. **Events:** each scored effect's window measures louder than the
   2 seconds preceding it.

## 7. Encode + final verification

```bash
ffmpeg -framerate 12 -i frames/frame_%04d.png -i master.wav \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart -shortest film.mp4
```

- Full decode pass (`ffmpeg -i film.mp4 -f null -`) with no errors.
- Duration equals the timeline (213.000 s in the reference).
- For an audio-only re-take: extract a frame at a story beat from both
  cuts and confirm they are identical — proof the visuals did not drift
  when only the soundtrack changed.

## Timing budget (reference production, 2 vCPU)

| Stage | Wall time |
| --- | --- |
| Model downloads (one-time) | ≈ 3–5 min |
| TTS, 16 lines | ≈ 2 min |
| Frame render, 2,556 frames | ≈ 14 min |
| SA3 batch, 20 clips | ≈ 3.5 min |
| Mix + verification | ≈ 1 min |
| Encode | ≈ 2 min |
