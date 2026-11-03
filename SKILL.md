---
name: webgl-canvas-story-animator
description: >-
  Adapt narrative stories into high-clarity, fast-paced, kinetic 2D animations rendered with
  custom WebGL GLSL fragment/vertex shaders and high-detail 5-layer 2D Canvas environments and
  14-part articulated character rigs, complete with pre-adaptation Story Clarity Audits,
  zero-repetition screenplay pacing, synchronized WebVTT/HUD captions, descriptive audio,
  unique Kokoro TTS character voices, Stable Audio 3 Small-Music and Small-SFX, sidechain-ducked
  mixing, YouTube upload metadata, interactive web player, and 24 fps 1080p H.264 MP4 export.
---

# WebGL Shaders & 2D Canvas Story Animator

Use this skill whenever the user asks to adapt a story, session log, or narrative document into a rich 2D animated film or interactive web animation using **WebGL shaders** and **2D Canvas**, with **Kokoro TTS** voices, **Stable Audio** music and sound effects, **descriptive audio narration**, **adapted character dialogue**, **synchronized captions**, and **YouTube upload metadata**.

---

## Mandatory Architectural, Storytelling & Visual Invariants (All 11 Invariants)

Every animation produced with this skill **must** implement and pass automated verification for all 11 invariants:

1. **Mandatory Pre-Adaptation Story Clarity Audit (`script/story_clarity_audit.md`)**:
   - Before writing a single line of script, audit the source material for **narrative gaps, unexplained jargon, abrupt transitions, unstated character motivations, and implicit cause-and-effect chains**.
   - Explicitly add **clarifying narrative bridges** in the screenplay so a first-time viewer or listener with zero background knowledge understands *who* every character is, *what* is at stake, *why* each decision is made, and *how* each event causes the next.
2. **Zero Narrator-Dialogue Repetition (Strict Chronological Lockstep)**:
   - **Never say the same beat twice.** If a character's dialogue announces a plan, observation, or action, the narrator **must not** pre-summarize or repeat that same beat (and vice versa).
   - Narration and dialogue must alternate in **strict chronological order**: concise, vivid descriptive narration sets the physical stage and visual action that cannot be heard in speech alone, while fast, natural character dialogue drives decisions, discoveries, and emotional turns.
3. **Fast-Paced, Kinetic Action & 24 FPS Dynamic Camera Choreography**:
   - Keep utterances brisk and punchy (`3–10 seconds` per line, conversational speeds `1.02–1.12`, tight `0.12s–0.22s` turn-taking gaps) so scenes feel energetic rather than static.
   - Render at **24 fps** with an active **2D Camera Rig** (`zoom`, `panX`, `panY`, `shake`, whip-pans, dramatic push-ins, impact frames, speed-lines, and particle bursts) choreographed to sub-beat action keyframes within each scene.
4. **High-Detail 5-Layer Environments (WebGL Shaders + 4 Canvas Depth Layers)**:
   - Never use flat, empty rectangle floors or bare backdrops. Every scene must composite **5 distinct visual depth layers**:
     1. **Pass 1 (WebGL GLSL Volumetric & Megastructure Shader)**: Custom fragment shaders for atmospheric scattering, cosmic bodies, rotating SDF machinery, volumetric lighting, and energy fields.
     2. **Pass 2 (Far Background Parallax)**: Detailed mountain silhouettes, multi-tiered city skyscrapers with lit window grids and sky-bridges, or deep subterranean cavern ribs and reactor shafts.
     3. **Pass 3 (Midground Architecture & Set-Pieces)**: Detailed trusses, suspension cables, server racks with blinking LEDs, gantry cranes, hazard blast doors, and live telemetry monitors.
     4. **Pass 4 (Main Stage Ground & Interactive Props)**: Beveled deck plating, perspective grid seams, glowing floor conduits, botanical foliage/rocks, and persistent story props.
     5. **Pass 5 (Foreground Framing, Particles & Kinetic FX)**: Foreground silhouette pillars/cables, volumetric light shafts, sparks, speed-lines, and shockwave rings.
5. **High-Detail Multi-Joint Character & Construct Rigs**:
   - Never draw stick figures or simple boxes. Every character must be rendered with **sculpted multi-layered anatomy and armor**:
     - **Humanoids (14+ articulated parts)**: Contoured head, jawline, layered hair locks, brows, multi-layer eyes or HUD visor with scanline reticle, speech-reactive mouth/jaw, neck, sculpted chestplate with glowing seams/emblem, pauldrons, utility belt, multi-wave cloth cape/coat, tapered upper/lower arms with gauntlets and hands, and contoured thighs, knee guards, shin greaves, and detailed boots.
     - **Mechanical Titans & Robots**: Multi-plate interlocking polyhedral armor (20+ individually animated plates/segments), rotating internal energy cores, articulated fingers/claws, thruster plumes, and dynamic morphing geometry.
6. **Audio-First Descriptive Narration (Eyes-Closed Comprehension)**:
   - Weave concrete visual action, character posture, and environment shifts smoothly into the narrator's prose (without duplicating dialogue) so someone not watching the screen can follow every physical action effortlessly.
7. **Implied-to-Direct Dialogue Adaptation**:
   - Convert all reported or implied conversations in the source prose into crisp, direct back-and-forth dialogue spoken by the characters themselves.
8. **Unique Kokoro TTS Voices for Every Speaking Character**:
   - Every speaking character—plus the Narrator—must be assigned a **unique stock voice** from Kokoro-82M (`kokoro-onnx`: `af_heart`, `af_bella`, `af_nicole`, `af_sarah`, `af_sky`, `am_adam`, `am_michael`, `bf_emma`, `bf_isabella`, `bm_george`, `bm_lewis`).
9. **Stable Audio 3 Music & Sound Effects (`sm-music` & `sm-sfx`)**:
   - Generate multi-movement instrumental scores (`sm-music`) and action/foley sound effects (`sm-sfx`) locally via Stable Audio 3 LiteRT (`stabilityai/stable-audio-3-optimized`).
10. **Strict Loudness Hierarchy (Dialogue & SFX Louder Than Audible Background Music)**:
    - Mix three 48 kHz stereo stems (`voice_stem.wav`, `sfx_stem.wav`, `music_stem.wav`) into `master.wav` so Dialogue/Narration ($\approx -14\text{ dBFS}$ RMS) and SFX ($\approx -4\text{ dBFS}$ peak) sit **8–14 dB** and **6–12 dB** louder than the ducked background music ($\approx -28\text{ dBFS}$ RMS), while the background music remains continuously audible throughout.
11. **Dual Deliverable (`index.html` + 24 fps `animation.mp4`) & YouTube Upload Metadata (`youtube_metadata.md`)**:
    - Deliver the interactive WebGL+Canvas player (`index.html`), the 24 fps `1920x1080` H.264/AAC video (`animation.mp4`), synchronized WebVTT captions (`audio/captions.vtt`), and `youtube_metadata.md` (`Title MM/DD/YYYY`, `Description` with `00:00` chapters, and `Tags (Comma Separated List)`).

---

## Canonical Project Structure

```text
<project-root>/
├── index.html                    # Interactive WebGL Shader + 2D Canvas animation player
├── animation.mp4                 # Rendered 1920x1080 24fps H.264 + AAC 48kHz stereo film
├── youtube_metadata.md           # Copy-paste YouTube upload metadata (Title MM/DD/YYYY, Description, Tags)
├── README.md                     # Production overview, clarity audit summary, cast & verification
├── script/
│   ├── story_clarity_audit.md    # Pre-adaptation audit of source ambiguities & clarifying bridges added
│   ├── adaptation_script.md      # Zero-repetition, high-clarity screenplay with camera/action beats
│   ├── lines.json                # Canonical cast & brisk utterance list for Kokoro TTS
│   ├── sfx_score.json            # Stable Audio 3 Small-SFX generation prompts & kinetic timeline events
│   └── music_cues.json           # Stable Audio 3 Small-Music movement prompts & crossfade cues
├── audio/
│   ├── lines/                    # Individual Kokoro TTS WAVs (<id>.wav + metadata)
│   ├── sfx/                      # Generated Stable Audio 3 Small-SFX WAV clips
│   ├── music/                    # Generated Stable Audio 3 Small-Music WAV cues
│   ├── voice_stem.wav            # 48 kHz stereo canonical voice stem
│   ├── sfx_stem.wav              # 48 kHz stereo event-placed SFX stem
│   ├── music_stem.wav            # 48 kHz stereo ducked background music stem
│   ├── master.wav                # 48 kHz stereo final mastered mix
│   ├── timeline.json             # Sample-accurate start/end times per line, scene, and SFX event
│   ├── captions.vtt              # Synchronized WebVTT captions with speaker & SFX tags
│   └── audio_verification.json   # Automated RMS/Peak/Loudness-hierarchy audit
└── src/
    ├── shaders.js                # Custom GLSL vertex & multi-scene fragment shaders
    ├── scene-renderer.js         # 5-layer environments, 14-part character rigs, camera & kinetic FX
    └── render-mp4.mjs            # Deterministic 24fps frame renderer + FFmpeg H.264/AAC encoder
```

---

## Step-by-Step Production Workflow

### Step 1: Read Reference Specifications
Consult `./references/` before starting:
- **[Story Clarity Audit, Zero-Repetition Pacing & Dialogue Adaptation](./references/narrative-and-dialogue.md)**
- **[Kokoro TTS, Stable Audio 3 LiteRT & Loudness Hierarchy Mixing](./references/audio-pipeline-and-mixing.md)**
- **[WebGL Shaders, 5-Layer Environments, High-Detail Rigs & Kinetic Camera](./references/webgl-and-canvas-engine.md)**

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

### Step 6: Render 5-Layer Environments, High-Detail Characters, Kinetic 24fps MP4 & YouTube Metadata
1. Implement `src/shaders.js` and `src/scene-renderer.js` with 5-layer environments, 14-part articulated character rigs, and sub-beat kinetic camera/action choreography.
2. Render the 24 fps `1920x1080` `animation.mp4` and visually inspect full-resolution keyframes across scenes.
3. Generate `youtube_metadata.md` and run `validate_project.py`:
   ```bash
   ~/.cache/story-animation-models/venv/bin/python <path-to-skill>/scripts/generate_youtube_metadata.py \
     --timeline <project-root>/audio/timeline.json \
     --out <project-root>/youtube_metadata.md
   ~/.cache/story-animation-models/venv/bin/python <path-to-skill>/scripts/validate_project.py <project-root>
   ```
