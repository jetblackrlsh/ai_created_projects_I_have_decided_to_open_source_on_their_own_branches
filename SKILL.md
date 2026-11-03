---
name: webgl-canvas-story-animator
description: >-
  Adapt narrative stories into Studio Ghibli / Makoto Shinkai / "The Moss Keeper" style painterly
  anime 2D animations rendered with custom WebGL GLSL atmospheric shaders and a deterministic
  gouache bristle-brush & 3-tone cel-shaded 2D Canvas engine (`painterly-anime-engine.js`),
  complete with pre-adaptation Story Clarity Audits, zero-repetition screenplay pacing,
  multi-shot anime cinematography, live procedural film grain, synchronized WebVTT/HUD captions,
  descriptive audio, unique Kokoro TTS character voices, Stable Audio 3 Small-Music and Small-SFX,
  sidechain-ducked mixing, YouTube upload metadata, interactive web player, standalone theater
  mode (`cinema.html`), and 24 fps 1080p H.264 MP4 export.
---

# WebGL Shaders & 2D Canvas Painterly Anime Story Animator (Antigravity-High Detail Edition v1)

Use this skill whenever the user asks to adapt a story, session log, or narrative document into a rich, hand-painted Studio Ghibli / Makoto Shinkai style 2D animated film or interactive web animation (**Antigravity-High Detail Edition v1**) using **WebGL shaders** and **2D Canvas**, with **Kokoro TTS** voices, **Stable Audio** music and sound effects, **descriptive audio narration**, **adapted character dialogue**, **synchronized captions**, and **YouTube upload metadata**.

---

## Mandatory Architectural, Storytelling & Painterly Visual Invariants (All 15 Invariants)

Every animation produced with this skill **must** implement and pass automated verification (`scripts/validate_project.py`) for all 15 invariants:

1. **Mandatory Pre-Adaptation Story Clarity Audit (`script/story_clarity_audit.md`)**:
   - Before writing a single line of script, audit the source material for **narrative gaps, unexplained jargon, abrupt transitions, unstated character motivations, and implicit cause-and-effect chains**.
   - Explicitly add **clarifying narrative bridges** in the screenplay so a first-time viewer or listener with zero background knowledge understands *who* every character is, *what* is at stake, *why* each decision is made, and *how* each event causes the next.
2. **Zero Narrator-Dialogue Repetition (Strict Chronological Lockstep)**:
   - **Never say the same beat twice.** If a character's dialogue announces a plan, observation, or action, the narrator **must not** pre-summarize or repeat that same beat (and vice versa).
   - Narration and dialogue must alternate in **strict chronological order**: concise, vivid descriptive narration sets the physical stage and visual action that cannot be heard in speech alone, while fast, natural character dialogue drives decisions, discoveries, and emotional turns.
3. **Mandatory Multi-Shot Anime Cinematography (`computeCinematicShot` & `applyCameraTransform`)**:
   - **Never lock the camera in a single static wide front view for an entire scene.**
   - Every line in `script/lines.json` must specify a cinematic camera shot (`"shot": "wide" | "medium" | "close_up" | "extreme_close_up" | "ots_left" | "ots_right" | "low_angle" | "dutch_tilt" | "pan_left_to_right" | "pan_right_to_left" | "push_in" | "pull_out"`), with **at least 5 distinct shot types** across the animation and **at least 2 shot changes within every scene**.
   - Use `computeCinematicShot` and `applyCameraTransform` with multi-plane parallax (`depth = 0.35` far background, `0.70` midground, `1.0` stage, `1.35` foreground) and `drawDepthOfFieldBokeh` for close-ups and over-the-shoulder shots.
4. **Moss-Keeper Painterly Gouache & Bristle-Brush Environment Engine — Outdoor AND Indoor (`src/painterly-anime-engine.js`)**:
   - **Every background—whether an ancient forest, a cosmic void, a rustic timber lodge, a European café-hotel, an arcane library, a sunlit streetscape, or a grand banquet hall—must have rich, consistent, hand-painted anime detail.**
   - Never use flat solid-color walls or bare `ctx.fillRect()` boxes for interior scenes. Use the engine's dedicated painterly architectural and nature builders (`drawPainterlyTimberWall`, `drawPainterlyStoneHearth`, `drawDetailedBuckTrophy`, `drawPainterlyBookshelfSection`, `drawPainterlyArchedWindow`, `drawForestCanopyVista`, `drawMossCluster`, `fillBristleCluster`).
   - `scripts/validate_project.py` enforces quantitative visual richness (`edge_strength >= 4.2` and `unique_quantized_colors >= 1200`) across every rendered scene keyframe (`keyframes/scene_*.png`).
5. **High-Detail Stylized Anime Character & Construct Rigs (`drawMasterAnimeCharacter`, `drawMasterMuppetCharacter`, `drawMossKeeperTitanRig`)**:
   - **Never draw primitive `roundRect` capsule heads, dot eyes, or stick/rectangle bodies.**
   - All human/humanoid characters must use `drawMasterAnimeCharacter` (or equivalent sculpted bezier anatomy) featuring: tapered anime jawlines & cheekbones, 3-tone cel-shaded skin with warm blush, multi-stop jewel anime eyes with winged upper lashes & dual specular catchlights, sculpted nose bridge & shadow wedge, lip-synced oral cavity with teeth & tongue, multi-layered hair locks with crown specular halo bands, articulated upper/lower arms with hands, and multi-layer wardrobe folds.
6. **Title-Safe Paginated Captions & Pixel-Level Clipping Validation (`paginateCaptionText`, `wrapCaptionLines`)**:
   - **Captions must never overflow or get cut off on the left or right sides of the video.**
   - `drawCinemaCaptionsAndHud` automatically paginates long utterances into time-synced pages (`<= 108` chars per page) via `paginateCaptionText` and wraps each page strictly within `width * 0.68` (`16%` horizontal safe margin on both sides) via `wrapCaptionLines` inside a high-contrast glassmorphic subtitle pill.
   - `scripts/validate_project.py` inspects the bottom caption band of every rendered keyframe PNG (`keyframes/scene_*.png`) to verify zero caption glyph pixels encroach on the outer `7.5%` left/right borders.
7. **Strict TTS Hyphen, Dash & Mojibake Sanitization (`sanitize_text_for_tts`)**:
   - **Never pass hyphens (`-`), em-dashes (`—`), en-dashes (`–`), or Windows-1252 mojibake (`â€”`, `€`) into Kokoro TTS**, which causes TTS phonemizers to pronounce dashes as `"Euros"` or symbols.
   - `scripts/kokoro_tts_render.py` enforces `encoding="utf-8"` on all file I/O, sanitizes all dashes to natural comma pauses and compound hyphens to spaces in `tts_text`, and `scripts/validate_project.py` verifies every line's `tts_text` is 100% hyphen-, dash-, and mojibake-free.
8. **Clean Opening SFX Rule & Natural Attack Preservation**:
   - **Never trigger a disruptive SFX in the first `2.5` seconds of the animation** while the viewer settles into the opening narration (`clean_opening_no_disruptive_sfx: True`).
   - `scripts/mix_and_verify_audio.py` preserves the natural start (`src_offset = 0.0`) of every SFX clip with smooth raised-cosine fade-in (`120ms`) and fade-out (`350ms`) so SFX never click, pop, or slice into the middle of a waveform.
9. **Live 6-Frame Procedural Film Grain, Poster Fade & Modern Web Performance**:
   - Include a live `<canvas id="grain">` overlay (`mix-blend-mode: overlay; opacity: 0.055`, cycling 6 noise frames every `~84ms`, hidden under `@media (prefers-reduced-motion: reduce)`), a `<img id="poster">` fade-out (`keyframes/poster_glade.jpg`), classic serif typography (`"Iowan Old Style", "Palatino Linotype", Georgia, serif`), and `content-visibility: auto` offscreen loop pausing via `contentvisibilityautostatechange`.
10. **Audio-First Descriptive Narration (Eyes-Closed Comprehension)**:
    - Weave concrete visual action, character posture, and environment shifts smoothly into the narrator's prose (without duplicating dialogue) so someone not watching the screen can follow every physical action effortlessly.
11. **Implied-to-Direct Dialogue Adaptation**:
    - Convert all reported or implied conversations in the source prose into crisp, direct back-and-forth dialogue spoken by the characters themselves.
12. **Unique Kokoro TTS Voices for Every Speaking Character**:
    - Every speaking character—plus the Narrator—must be assigned a **unique stock voice** from Kokoro-82M (`kokoro-onnx`: `af_heart`, `af_bella`, `af_nicole`, `af_sarah`, `af_sky`, `am_adam`, `am_michael`, `bf_emma`, `bf_isabella`, `bm_george`, `bm_lewis`).
13. **Stable Audio 3 Music & Sound Effects (`sm-music` & `sm-sfx`)**:
    - Generate multi-movement instrumental scores (`sm-music`) and action/foley sound effects (`sm-sfx`) locally via Stable Audio 3 LiteRT (`stabilityai/stable-audio-3-optimized`) or high-precision acoustic foley synthesis with full provenance.
14. **Strict Loudness Hierarchy (Dialogue & SFX Louder Than Audible Background Music)**:
    - Mix three 48 kHz stereo stems (`voice_stem.wav`, `sfx_stem.wav`, `music_stem.wav`) into `master.wav` so Dialogue/Narration ($\approx -14\text{ dBFS}$ RMS) and SFX ($\approx -5\text{ dBFS}$ peak) sit **8–14 dB** and **6–12 dB** louder than the ducked background music ($\approx -28\text{ dBFS}$ RMS), while the background music remains continuously audible throughout.
15. **Dual Deliverable (`index.html` + `cinema.html` + 24 fps `animation.mp4`) & YouTube Upload Metadata (`youtube_metadata.md`)**:
    - Deliver the interactive studio player (`index.html`), the minimalist standalone theater (`cinema.html`), the 24 fps `1920x1080` H.264/AAC video (`animation.mp4`), synchronized WebVTT captions (`audio/captions.vtt`), and `youtube_metadata.md` (`Title MM/DD/YYYY`, `Description` with `00:00` chapters, and `Tags (Comma Separated List)`).

---

## Canonical Project Structure

```text
<project-root>/
├── index.html                        # Interactive Studio Player with Pure Cinema Mode, Film Grain & 3-Stem Mixer
├── cinema.html                       # Standalone Moss-Keeper style letterboxed theater with Poster & Film Grain
├── animation.mp4                     # Rendered 1920x1080 24fps H.264 + AAC 48kHz stereo painterly anime film
├── youtube_metadata.md               # Copy-paste YouTube upload metadata (Title MM/DD/YYYY, Description, Tags)
├── README.md                         # Production overview, clarity audit summary, cast & verification
├── keyframes/
│   ├── poster_glade.jpg              # High-resolution painted poster frame for #poster fade-in
│   └── scene_S01.png .. S11.png      # Full-resolution 1920x1080 inspection keyframes across scenes & sub-shots
├── script/
│   ├── story_clarity_audit.md        # Pre-adaptation audit of source ambiguities & clarifying bridges added
│   ├── adaptation_script.md          # Zero-repetition, high-clarity screenplay with camera/action beats
│   ├── lines.json                    # Canonical cast & brisk utterance list for Kokoro TTS
│   ├── sfx_score.json                # Stable Audio 3 Small-SFX generation prompts & kinetic timeline events
│   └── music_cues.json               # Stable Audio 3 Small-Music movement prompts & crossfade cues
├── audio/
│   ├── lines/                        # Individual Kokoro TTS WAVs (<id>.wav + metadata)
│   ├── sfx/                          # Generated Stable Audio 3 Small-SFX WAV clips
│   ├── music/                        # Generated Stable Audio 3 Small-Music WAV cues
│   ├── voice_stem.wav / .m4a         # 48 kHz stereo canonical voice stem
│   ├── sfx_stem.wav / .m4a           # 48 kHz stereo event-placed SFX stem
│   ├── music_stem.wav / .m4a         # 48 kHz stereo ducked background music stem
│   ├── master.wav / .m4a             # 48 kHz stereo final mastered mix
│   ├── timeline.json                 # Sample-accurate start/end times per line, scene, and SFX event
│   ├── captions.vtt                  # Synchronized WebVTT captions with speaker & SFX tags
│   └── audio_verification.json       # Automated RMS/Peak/Loudness-hierarchy audit
└── src/
    ├── painterly-anime-engine.js     # Reusable Ghibli/Shinkai/Moss-Keeper bristle-brush & cel-shaded 2D engine
    ├── shaders.js                    # Custom GLSL vertex & golden-hour atmospheric scattering fragment shaders
    ├── scene-renderer.js             # Multi-shot anime cinematography, 5-layer glade/vault stages & character rigs
    └── render-mp4.mjs                # Deterministic 24fps frame renderer + FFmpeg H.264/AAC encoder
```

---

## Step-by-Step Production Workflow

### Step 1: Read Reference Specifications
Consult `./references/` before starting:
- **[Studio Ghibli / Makoto Shinkai / "The Moss Keeper" Painterly Anime Engine](./references/webgl-and-canvas-engine.md)**
- **[Story Clarity Audit, Zero-Repetition Pacing & Dialogue Adaptation](./references/narrative-and-dialogue.md)**
- **[Kokoro TTS, Stable Audio 3 LiteRT & Loudness Hierarchy Mixing](./references/audio-pipeline-and-mixing.md)**

### Step 2: Provision Local Audio Models
```bash
python3 <path-to-skill>/scripts/setup_audio_models.py --cache-dir ~/.cache/story-animation-models
```

### Step 3: Conduct the Story Clarity Audit (`script/story_clarity_audit.md`) & Write `script/lines.json`
1. Read the source story critically and write `script/story_clarity_audit.md` listing every potential point of audience confusion (unexplained world rules, sudden location jumps, unclear technology or character motives, implicit cause-and-effect) and the exact **clarifying narrative bridge** you are adding to resolve it.
2. Write `script/lines.json` following **Zero Narrator-Dialogue Repetition**:
   - Keep narration brisk, visual, and action-focused; never summarize what a character is about to say or just said.
   - Make dialogue snappy, natural, and causal—explicitly connecting *why* each action happens.

### Step 4: Render Kokoro TTS & Build the Canonical Timeline
```bash
~/.cache/story-animation-models/venv/bin/python <path-to-skill>/scripts/kokoro_tts_render.py \
  --lines <project-root>/script/lines.json \
  --out-dir <project-root>/audio
```

### Step 5: Generate Stable Audio 3 Music & SFX and Mix Stems
```bash
~/.cache/story-animation-models/venv/bin/python <path-to-skill>/scripts/sa3_audio_gen.py \
  --music <project-root>/script/music_cues.json \
  --sfx <project-root>/script/sfx_score.json \
  --out-dir <project-root>/audio
~/.cache/story-animation-models/venv/bin/python <path-to-skill>/scripts/mix_and_verify_audio.py \
  --timeline <project-root>/audio/timeline.json \
  --music <project-root>/script/music_cues.json \
  --sfx <project-root>/script/sfx_score.json \
  --audio-dir <project-root>/audio
```

### Step 6: Render Painterly Anime Scenes, Keyframes, 24fps MP4 & Validate
1. Copy `<path-to-skill>/scripts/painterly-anime-engine.js` into `<project-root>/src/painterly-anime-engine.js` and implement `src/shaders.js` and `src/scene-renderer.js` with multi-shot anime cinematography, scalloped bristle-brush environments, and 3-tone cel-shaded rigs.
2. Render the 24 fps `1920x1080` `animation.mp4` and visually inspect full-resolution keyframes in `keyframes/` to verify painterly brushwork, foliage clusters, and character silhouettes.
3. Generate `youtube_metadata.md` and run `validate_project.py`:
   ```bash
   python <path-to-skill>/scripts/generate_youtube_metadata.py \
     --timeline <project-root>/audio/timeline.json \
     --out <project-root>/youtube_metadata.md
   python <path-to-skill>/scripts/validate_project.py <project-root>
   ```


---

## Bundled Reference Examples (`examples/`)

This skill packages two complete, end-to-end reference productions in `./examples/` that pass all 15 invariants in `scripts/validate_project.py` and demonstrate the expected anime character detailing, multi-plane background richness, 11-shot cinematography, title-safe paginated captions, and 3-stem audio mix:

1. **`examples/dream-journal-2026-11-03/` — *Echoes in the Static & The Unfinished Bite (Dream Journal 11/03/2026)***:
   - **6-Scene Painterly Anime Film (`1920x1080`, 24 fps, `5m 32.94s`, `7,991` frames)**: `examples/dream-journal-2026-11-03/animation.mp4`
   - **Interactive WebGL + 2D Canvas Studio Player**: `examples/dream-journal-2026-11-03/index.html`
   - **Standalone Moss-Keeper Theater Mode**: `examples/dream-journal-2026-11-03/cinema.html`
   - **Scene Renderer & Multi-Shot Cinematography**: `examples/dream-journal-2026-11-03/src/scene-renderer.js` (showcases `drawMasterAnimeCharacter`, `drawMasterMuppetCharacter`, `drawPainterlyTimberWall`, `drawDetailedBuckTrophy`, `drawPainterlyStoneHearth`, `drawPainterlyBookshelfSection`, `drawPainterlyArchedWindow`, and 9 distinct camera shot types across 39 lines)
   - **Story Clarity Audit & Screenplay**: `examples/dream-journal-2026-11-03/script/story_clarity_audit.md`, `examples/dream-journal-2026-11-03/script/lines.json`
   - **Full-Resolution 1080p Keyframes**: `examples/dream-journal-2026-11-03/keyframes/` (`scene_S01.png`–`scene_S06.png` + sub-shot showcases)
2. **`examples/the-awakening-of-mosaic/` — *The Awakening of Mosaic (Antigravity-High Detail Edition v1)***:
   - **11-Scene Painterly Anime Film (`1920x1080`, 24 fps, `7m 03.50s`)**: `examples/the-awakening-of-mosaic/animation.mp4`
   - **Interactive Studio Player & Theater Mode**: `examples/the-awakening-of-mosaic/index.html`, `examples/the-awakening-of-mosaic/cinema.html`
