# Production contract

## Project and execution

Use a fresh versioned project folder. All file paths below resolve relative to `project.json`; never embed the author's workspace path. Install Pillow, NumPy and SciPy in an isolated environment and use system FFmpeg/ffprobe. Reuse verified local model runtimes separately (see models.md); bundled scripts contain no model weights or runtime binaries.

Minimal project shape (replace example assets with generated and reviewed material):

```json
{
  "title": "The Lost Lantern",
  "credits": ["AI-assisted story and production", "Stock synthetic voices: Kokoro", "Music and effects: Stable Audio 3 Small", "Anime art converted to ASCII"],
  "duration": 10,
  "fps": 24,
  "shots": [{"id":"arrival","start":0,"end":5,"image":"art/arrival.png"},{"id":"discovery","start":5,"end":10,"image":"art/discovery.png"}],
  "speech": [
    {"id":"n1","speaker":"Narrator","voice":"af_heart","text":"At the garden gate, the keeper calls to her friend.","file":"audio/n1.wav","start":0.3},
    {"id":"d1","speaker":"Keeper","voice":"af_bella","text":"I found your lantern.","file":"audio/d1.wav","start":5.0}
  ],
  "music":{"file":"audio/score.wav","peak":0.24},
  "effects":[{"id":"gate","file":"audio/gate.wav","at":4.5,"offset":0.25,"duration":1.5,"peak":0.25,"action":"Keeper opens the wooden gate"}]
}
```

Run scripts with the model-independent Python environment:

```
python SKILL/scripts/mix_audio.py PROJECT/project.json
python SKILL/scripts/render_pair.py PROJECT/project.json
python SKILL/scripts/validate_audio.py PROJECT/project.json
```

The mixer resamples each decoded source to 48 kHz, places by integer sample, rejects speech overlap/out-of-range clips, checks distinct consistent cast, places effects by `at-offset` without silently clamping, and rejects a transient outside the retained clip. Record supplied offset selection evidence. It retains stems, scales the final mix down only if needed, and encodes the AAC master once. Set duration after measuring narration; never accelerate speech to satisfy an arbitrary shot length. Music must span the complete timeline; intentional extensions require explicit editing, not an accidental loop. Use WAV sources (decode FLAC beforehand). Defaults are starting values, not universal loudness targets.

## Required review

Before generation, listen mentally/read the script without images: what happens, who acts and speaks, why, where, and the outcome must be explicit. Dialogue is separate voiced clips, not narrator quotations. Maintain a cast table with genuine distinct stock IDs. The mixer checks consistency/uniqueness of declared voice IDs, not whether submitted WAVs genuinely came from those voices; verify synthesis provenance and use the Kokoro helper to validate actual available stock IDs. Avoid presenting synthetic stock voices as recordings of real actors or children.

For each meaningful action list source sound, variation, selected transient offset, absolute action time, trim/fades, gain, scene and review status. A sword falling needs its landing and rattle, not just the preceding clash. Distinct attacks need different sounds or justified variations. Review quiet effects against music; music ducking often creates more clarity than making everything louder. Preserve voice intelligibility and decoded headroom.

Use Whisper.cpp only as an optional content-omission check. Its timestamp estimates are not the authority for subtitles: previous otherwise-correct ASR drifted by seconds. Derive captions from measured source-clip placement.

## Export gates

- Complete fixed sample timeline; canonical 48 kHz stereo PCM. Never concatenate mixed-rate AAC streams. Both outputs must contain the exact same AAC elementary bytes, duration and stream starts.
- Run full decode; verify frame count, stream durations, contiguous AAC packets, no clipping, SFX reconstruction from current source/config.
- Match beginning and end waveform anchors of **every** speech clip against decoded exports and exact mixed master. Retain isolated-voice correlation separately; music/effects can reduce it without drift. Do not silently change the recorded criterion. Inject 50 ms delay and prove the check detects it.
- Inspect source voice placements, source offsets and caption timings. Listening and visual inspection remain independent gates; machine reports explicitly mark them unverified.
- Static audio-drama card: fitting ASCII background, full title and accurate credits throughout, no extra padding absent from illustrated version. Lossy video may vary a little between decoded frames; do not claim pixel-identical card frames without measurement.
- Inspect final encoded glyphs, all repaired panels and key caption transitions. Keep native-size glyph rendering and whole-cell camera translation; no fractional zoom that shimmers or blurs text.

## Established evidence and limits

Prior 68-second prototype: 12 shots, 17 utterances/four stock voices, 14 meaningful effect events; 34 start/end anchors matched at 0 ms, deliberate 50 ms delays detected, identical AAC in paired exports. This is evidence for the design, not proof every future film passes. Latest stronger-effects revision had no independent auditory audition; do not report it as listener-approved.

CPU timing depends on hardware/runtime/settings. On one roughly nine-logical-CPU workspace: SDXS DreamShaper one-step 512 px averaged 3.52 s/full fresh process; official anime adapter roughly 4.14 s versus base 3.37 s in a matched small test. Anime is a preferred aesthetic, not demonstrated superior anatomy/action accuracy. Detailed automatic ASCII can conceal or transform defects but does not recover missing anatomy. Keep claims modest; measure future runs separately. ASCII-only local repair cannot solve every defect, and never authorizes a redraw.
