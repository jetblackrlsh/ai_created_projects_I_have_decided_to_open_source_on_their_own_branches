---
name: anime-visual-novel-adapter
description: >-
  Adapt narrative stories, dream journals, lore entries, and scripts into complete 1080p 24fps
  non-interactive Anime Visual Novel (Kinetic Novel) videos using the host assistant's supported image
  generation tools with locked `character_sheets`, Kokoro TTS (`kokoro-onnx`)
  at locked `speed = 1.0` with unique voices, per-character Vocal DSP (pitch-shifting, subharmonics,
  reverb), and sample-accurate per-page subtitle sync (`caption_pages`), Stable Audio Small Music
  (`sa3-sm-music`) with single-mood key-locked per-scene themes and smooth non-overlapping transitions,
  Stable Audio Small SFX (`sa3-sm-sfx`) layered with cue-timed non-dissonant procedural combat/magic
  transients, hybrid ADV/NVL/CG visual novel UI, subpixel virtual camera choreography with disciplined
  single-impulse vs. barrage camera shake, 24fps anime VFX overlays, mandatory 5-pillar visual QA,
  strict audio loudness hierarchy (voice-first audio mixing),
  interactive web theater (`index.html`), and YouTube metadata (`youtube_metadata.md`).
---

# Anime Visual Novel (Kinetic Novel) Story Adapter (`anime-visual-novel-adapter`)

Use this skill whenever the user asks to adapt a story, dream journal, RPG session, folktale, or script into a **non-interactive Anime Visual Novel (Kinetic Novel) video** combining:
1. **Host AI Image Generation** for anime character anchors, time-of-day setting plates, and high-density single-character & Event CG shots (`images/`).
2. **Authentic Kinetic Novel Cinematography & Hybrid ADV/NVL/CG Presentation** inspired by *Witch on the Holy Night* (*Mahoyo*), VisualArt's/Key, and ufotable/CoMix Wave visual direction.
3. **Kokoro TTS (`kokoro-onnx`) + Character Vocal DSP** with a unique stock voice per character + omniscient `Narrator`, WSOLA pitch-shifting (`pitch_semitones`), subharmonic chest resonance (`subharmonic_mix`), EQ, harmonic grit (`warmth_drive`), and acoustic space (`reverb_type`), plus strict date & hyphen/dash normalization.
4. **Stable Audio Small Music (`sa3-sm-music`) & SFX (`sa3-sm-sfx`)** generated locally via `stabilityai/stable-audio-3-optimized` LiteRT (`w8a8`), paired with procedural anime battle/magic transients triggered on exact spoken `"sfx_cue"` words.
5. **Strict Audio Mixing Loudness Hierarchy**: `Voices (~ -13.5 dBFS RMS) > Sound Effects (~ -15.5 dBFS RMS / -4.5 dBFS peak) > Background Music (~ -27.5 dBFS ducked RMS, continuously audible > -34 dBFS)`.

---

## 1. Cinematography & Style of Non-Interactive Anime Visual Novels (Kinetic Novels)

A **Kinetic Novel** is a strictly linear, non-interactive anime visual novel where every camera move, expression change, sound cue, and UI transition is choreographed like an animated film:

- **Hybrid UI Presentation Modes (`vn_mode`: `"ADV"` | `"NVL"` | `"CG"`)**:
  - **`"ADV"` (Adventure Mode — Default for Dialogue & Character Beats)**: Translucent glassmorphic lower-third anime dialogue window with ornamental corner accents, a color-coded speaker nameplate pill, a live voice-envelope waveform indicator, `AUTO ▶ | LOG` VN status badges, and paginated, title-safe dialogue text (`width * 0.68` safe width).
  - **`"NVL"` (Novel Mode — Atmospheric Narration & Internal Monologue)**: Literary semi-transparent storybook overlay with classic serif typography and gold dividers, used when establishing lore, internal psychological tension, or solemn transitions.
  - **`"CG"` (Event CG Showcase Mode — Climax, Transformations & Impact Shots)**: Streamlined cinematic lower-third pill that maximizes unobstructed full-screen visibility for high-impact Event CGs, transformations, and magical clashes.
- **Virtual 2D Camera Choreography (`camera_motion` & `crop_box`)**:
  - Every shot uses smooth subpixel bicubic camera movement (`"zoom_in"`, `"zoom_out"`, `"pan_right"`, `"pan_left"`, `"pan_up"`, `"pan_down"`, `"zoom_in_left"`, `"zoom_in_right"`, `"dutch_tilt"`, or `"static"`), plus optional `"dof_blur": true` (rack-focus depth-of-field blur on background edges) and `"crop_box": [x1, y1, x2, y2]` for smart reframing.
- **Procedural 24fps Anime Visual Effects (`vfx`) & Camera Shake Discipline**:
  - Layer live 24fps anime shaders/particles over shots: `"sakura_petals"`, `"rain_streaks"`, `"speed_lines"`, `"impact_flash"`, `"single_shake"`, `"struggle_shake"`, `"shatter_flash"`, `"barrage_shake"`, `"earthquake_shake"`, `"fire"`, `"blue_hellfire"`, `"solar_light"`, `"crimson_magic"`, `"teal_magic"`, `"nature_vines"`, `"kinetic_rings"`, `"lucid_light"`, `"cosmic_stars"`, `"bubbles"`, and `"alarm_pulses"`.
  - **Camera Shake Discipline (Never Spam Camera Shake!)**:
    - For a single strike, gunshot, transformation burst, or explosion (`"impact_flash"`, `"shatter_flash"`, `"single_shake"`, `"struggle_shake"`), the camera shakes **ONLY ONCE** for a crisp, rapidly damped `0.34s` (`~8 frames`) impulse right at the onset of the impact cut, and remains **100% steady** for the rest of the shot.
    - Continuous/repeated multi-pulse camera shaking (`"barrage_shake"` or `"earthquake_shake"`) is reserved **strictly** for a rapid barrage of attacks or an earthquake, and `validate_vn_video.py` enforces a hard maximum of `<= 2` barrage/earthquake shake shots per video.

Consult **[Cinematography & Visual Novel Style Guide](./references/cinematography_and_vn_style.md)** for full details.

---

## 2. Mandatory Storytelling, Cinematography, Visual QA & Audio Invariants

Every video produced with this skill **must** obey all rules synthesized from the user's video production skills:

1. **Mandatory Pre-Adaptation Story Clarity Audit AND Post-Draft Original Story Fidelity Review (`script/story_clarity_audit.md`)**:
   - **Pre-Adaptation Clarity Audit**: Before authoring `script/vn_story_spec.json`, identify every potential point of audience confusion in the source text (abrupt transitions, unstated character motivations, undefined lore/powers, implicit cause-and-effect) and document the concrete clarifying bridges added.
   - **Mandatory Post-Draft Original Story Fidelity Review (`## Post-Draft Original Story Fidelity Review`)**: After drafting `script/vn_story_spec.json`, **go back and re-read the entire original source story** chapter by chapter / section by section and compare it against your draft. Verify and document that zero key details, lore mechanics, character relationships (e.g., cousins vs. siblings), character motivations, or philosophical themes needed for the story to make complete sense were left out.
2. **Action Pacing, Suspense, Struggle & Earned Victory Protocol (`## Action Pacing, Struggle & Earned Victory Audit`)**:
   - Action sequences must **never** feel rushed, effortless, or resolved in a single sentence.
   - Every major combat encounter or crisis must build genuine **tension and suspense** across multiple distinct beats/lines:
     1. *Threat & Setback / Pinning*: The antagonist or monster presses the attack, outmaneuvers the hero, or shatters initial defenses.
     2. *Heroic Struggle & Near-Failure*: The hero struggles under pressure, experiences a limitation/vulnerability of their power, or reaches a moment where it genuinely seems like the heroes will fail.
     3. *Strategic Adaptation & Teamwork*: Victory requires a smart tactical choice, weapon/artifact synergy, or timely teamwork rather than brute force alone.
     4. *Earned Climax & Consequence*: The decisive blow lands with earned weight, followed by a clear cutaway showing the impact and aftermath.
3. **Audio-First Descriptive Action Narration (Eyes-Closed Comprehension)**:
   - The `Narrator` must explicitly describe setting transitions, physical actions, facial expressions, attacks, transformations, and consequences out loud so a listener with their eyes closed can follow 100% of the story.
4. **Implied-to-Direct Dialogue Conversion (`"implied_adaptation": true`)**:
   - Never let the narrator summarize a conversation second-hand. Convert all reported or implied speech into direct, natural, in-character spoken dialogue.
5. **Zero Narrator-Dialogue Repetition (Strict Chronological Lockstep)**:
   - Never state the same beat twice. Narration and dialogue must alternate in strict chronological lockstep—if a character announces an action or reaction, the narrator must not pre-summarize or repeat it (and vice versa).
6. **No Invented Proper Names & Unhurried Dramatic Struggle**:
   - Never invent proper names for unnamed characters (refer to them by their role/description from the source text). Never rush or truncate obstacles, tension, or struggle.
7. **High Shot Density & Sub-Shots (`4–8s` per visual cut)**:
   - Never hold a single static image across long multi-sentence paragraphs. Keep lines brisk (`3–10s`, 1–2 sentences) OR attach `"sub_shots": [...]` to a line so the visual cuts across 2–3 sequential images during a single spoken utterance.
8. **Single-Character Focus + Multi-Step Action & Transformation Cutaways**:
   - Focus each shot on **one primary character/subject at a time** (`character_refs` containing at most 1 character) for clean anime anatomy and shot/reverse-shot dialogue.
   - **Fights (`6–16+` shots)** must use **Action $\rightarrow$ Struggle / Near-Defeat $\rightarrow$ Strategic Turn $\rightarrow$ Cutaway Consequence editing**.
   - **Transformations (`3–4+` shots)** must show: (1) Artifact/power surge on the human character $\rightarrow$ (2) Mid-transformation close-up (scales/claws/fur/glowing eyes morphing) $\rightarrow$ (3) Full transformed reveal $\rightarrow$ (4) De-transformation / reaction.
9. **Establishing Shots & Time-of-Day Setting Continuity**:
   - Begin every new location with a **wide anime establishing shot** (`"is_establishing_shot": true`).
   - Define separate setting entries for different times of day (e.g., `_dawn`, `_day`, `_night`). Never place nocturnal/sunlight-weak characters (like vampires/Dracula) outdoors in daytime sunlight, and never show a parked exterior vehicle outside the window of that same moving vehicle.
10. **Strict Character Consistency (`character_sheets`) & Mandatory 5-Pillar Visual QA Review (host image-viewing tool)**:
    - Define a top-level `"character_sheets"` dictionary in `vn_story_spec.json` with a locked, detailed visual anchor (`>= 80 chars` specifying exact age, skin tone, hair color & exact hairstyle, eye color, facial hair, exact top/outer garment, exact bottom garment, signature accessories, and forbidden off-model outfit changes) for every recurring visual character (including distinct era/form keys like `"Hero (Young)"` vs `"Hero"`).
    - `prepare_vn_image_manifest.py --mode queue` automatically injects the verbatim `Character Model Lock` into every shot and `sub_shot` prompt. Always pass the enriched queue prompts from `script/image_generation_queue.json` to the host image-generation tool so characters never drift off-model.
    - Visually inspect **every generated image** using the host image-viewing tool across all **5 pillars** before rendering the video:
      1. *Anatomical & Object Accuracy*: No extra limbs/hands/tails, no floating weapons, no weapons pointed backward, no human flesh hands on wooden/mechanical golems.
      2. *Pre- vs. Post-Acquisition Costume/Prop Continuity*: Base character shots must wear their initial outfit without late-story power-ups or artifacts before they are acquired.
      3. *Story Logic & Time-of-Day Lighting*: Lighting and environment match the exact narrative beat.
      4. *Single-Subject Framing*: Use `"crop_box": [x1, y1, x2, y2]` to reframe minor edge flaws or use the host image-generation tool to replace any defective shot.
      5. *Cross-Shot Character Model Consistency Audit*: Compare every character's hairstyle, hair color, facial hair, age, jacket/shirt, pants/shorts, and accessories across all shots in the video; immediately regenerate any shot where a character looks off-model!
11. **Unique Kokoro Voices, Zero Speed Modification (`speed = 1.0`), Drift-Free Vocal DSP & Strict Full-Line Audio Timing**:
    - Every character + `Narrator` must use a unique stock voice from Kokoro-82M (`kokoro-onnx`), shaped with optional WSOLA `pitch_semitones`, `subharmonic_mix`, `bass_boost_db`, `treble_boost_db`, `warmth_drive`, and `reverb_type`.
    - **NEVER Modify Voice Speed (`speed` MUST ALWAYS be `1.0`)**: Never alter the speaking speed (`speed != 1.0`) in Kokoro TTS or during Vocal DSP. `kokoro_tts_vn.py` hard-locks `speed = 1.0` and uses drift-free WSOLA pitch-shifting (`max_drift = 8ms` anchored to `nominal_ana`) so voice timbre changes never alter speaking speed or truncate the end of a line.
    - **NEVER Cut Off Lines at the End & Always Hold Until Full Line Completion Before Transitioning**:
      - `kokoro_tts_vn.py` calls `engine.create(..., speed=1.0, trim=False)` and `trim_with_natural_release(..., lead_sec=0.08, tail_sec=0.45)` so the final phoneme release and any character reverb tail decay naturally into a `0.45s` post-speech silence cushion inside every line WAV (`final 220ms RMS < 0.015` verified by `validate_vn_video.py`).
      - Between lines in the same scene, `kokoro_tts_vn.py` enforces `pause_before >= 0.55s` (giving `>= 1.00s` total breathing room after the last spoken word).
      - Before transitioning to a new scene, `kokoro_tts_vn.py` enforces `scene_gap >= 1.35s` (giving `>= 1.80s` total breathing room after the last spoken word of the scene), and `render_vn_video.py` holds the current shot and caption on screen until at least `l["end"] + 0.22s` (`0.67s` after speech ends) before starting any crossfade to the next shot or scene.
    - **Sample-Accurate Subtitle-to-TTS Synchronization (`caption_pages`)**:
      - Never paginate subtitles by dividing line duration into uniform `1/N` fractions (`int(line_prog * len(pages))`), which causes multi-page subtitles to flip prematurely before the TTS finishes speaking each page.
      - Instead, `kokoro_tts_vn.py` splits every line into balanced, clause/sentence-aware subtitle pages (`split_caption_into_pages(..., max_chars=100)`, preventing tiny orphan tail pages), synthesizes each subtitle page `p_i` individually at `speed = 1.0`, and records each page's exact sample-derived `[start, end]` timestamps in `line["caption_pages"]` (as well as per-page cues in `captions.vtt` and `subtitles.srt`).
      - `render_vn_video.py` selects the active on-screen subtitle page directly from `active_line["caption_pages"]` by frame timestamp `t_sec = frame_idx / 24.0`, using audio-derived timestamps at 24 fps between the spoken TTS audio and the on-screen subtitle box.
    - All dates (`MM/DD/YYYY`), hyphens (`-`), and dashes (`—`, `–`) are automatically expanded/sanitized so Kokoro never pronounces hyphens as `"Euros"`.
12. **Per-Scene Original Music (`sa3-sm-music`), Single-Mood Key-Locked Prompts, Smooth Non-Overlapping Music Transitions & Cue-Timed Non-Dissonant SFX (`sa3-sm-sfx`)**:
    - Every scene defines its own `"music_prompt"` and `"music_seed"`.
    - **Single-Mood, Key-Locked Music Prompts (No Multi-Genre `"transitioning into..."` Collisions)**:
      - Never write a single `"music_prompt"` that asks `sa3-sm-music` to transition between two conflicting genres/tempos/moods (e.g., `"celesta chimes and woodland flute transitioning into urgent monster battle percussion and brass"`), because diffusion music models layer both styles simultaneously in clashing keys!
      - Instead, split peaceful exploration and battle sequences into distinct scenes/cues, and give each `"music_prompt"` a **single cohesive mood, a single tempo, and an explicit musical key** (e.g., `"in A minor"`, `"in D minor"`, `"in E minor"`). `sa3_vn_audio.py` trims the noisy `30–35s` diffusion decay tail, applies a warm mastering filter (`65 Hz` high-pass, `-2.5 dB` mud cut, `6800 Hz` low-pass), and verifies `music_max_spectral_flatness <= 0.05` and `music_max_semitone_clash_ratio <= 0.45` (`consonant_music_tracks: true`).
    - **Zero Overlapping Music Tracks (`music_overlap_sec == 0.0`) & Zero Cross-Scene SFX Bleed**:
      - Never overlap two music tracks across scene boundaries or overlap unsynchronized bars when looping a track within a scene. In `sa3_vn_audio.py`, Track `k` fades out smoothly (`1.4s` cosine fade-out) to `0.0` at `scenes[k]["end"]` (during the inter-scene silence gap) before Track `k+1` fades in smoothly (`1.4s` cosine fade-in) from `0.0` at `scenes[k+1]["start"]`.
      - Every SFX event is strictly clamped to its own scene boundary (`scene_end - 0.15s` with a `0.28s` cosine fade-out) so combat/explosion SFX at the end of one chapter never bleed into the opening music of the next chapter (`no_cross_scene_sfx_bleed: true`).
      - Procedural SFX transient layers (`synthesize_battle_sfx_layer`) must use strictly non-pitched percussive impacts and filtered noise whooshes—never continuous midrange sine drones (`440–3100 Hz`) that clash harmonically with the background music. Ambient/foley SFX (`type: "none"`) are high-passed at `160 Hz` and capped at `+12 dB` max gain boost so low-frequency room/wind rumble never becomes a loud drone over the music.
13. **Strict Loudness Hierarchy, Title/Credits Cards & YouTube Metadata**:
    - Enforces `Voices > SFX > Background Music > Audible Floor (-34 dBFS)` (`voice_over_music_margin_db >= 8.0 dB`, `sfx_over_music_margin_db >= 6.0 dB`).
    - Starts with an animated **Opening Title Card** (`>= 3.0s`), ends with a **Closing Credits Card** (`>= 4.0s`), and outputs `youtube_metadata.md` (`Title MM/DD/YYYY`, `Description` with `00:00` chapters, and `Comma Separated List Of Tags`).

---

## 3. Canonical Project Structure

```text
<project-root>/
├── vn_story_video.mp4                # Final 1920x1080 24fps H.264 + AAC 48kHz stereo video (+ soft subs)
├── youtube_metadata.md               # Title MM/DD/YYYY, Description (00:00 chapters), Comma Separated List Of Tags
├── index.html                        # Interactive Anime Visual Novel Web Theater with chapter jump & backlog
├── script/
│   ├── story_clarity_audit.md        # Pre-adaptation clarity audit, Post-Draft Original Story Fidelity Review & Action Struggle Audit
│   ├── vn_story_spec.json            # Unified VN storyboard spec: cast, character_sheets, settings, scenes, lines, sub_shots, VFX, SFX
│   └── image_generation_queue.json   # Auto-generated prompt queue (with Character Model Locks) for the host image-generation tool
├── images/
│   ├── title_bg.png                  # 1920x1080 anime visual novel title screen illustration
│   ├── credits_bg.png                # 1920x1080 anime visual novel closing credits backdrop
│   ├── characters/                   # Character reference portraits (<char_id>.png)
│   ├── settings/                     # Setting/background plates (<setting_id>.png)
│   ├── shots/                        # Per-line & per-sub-shot 1920x1080 anime CGs (shot_<id>.png)
│   └── image_manifest.json           # Verified 1920x1080 dimensions, SHA-256 hashes, and QA status
├── keyframes/
│   ├── card_title.png                # Rendered Title Card inspection frame
│   ├── frame_*.png                   # Rendered midpoint inspection frame per shot (with ADV/NVL/CG UI)
│   └── card_credits.png              # Rendered Closing Credits inspection frame
└── audio/
    ├── lines/                        # Individual Kokoro TTS + Vocal DSP WAVs & JSON metadata (with 24fps envelope & caption_pages)
    ├── sfx/                          # Stable Audio Small SFX (`sa3-sm-sfx`) + procedural battle layers
    ├── music/                        # Per-scene Stable Audio Small Music (`sa3-sm-music`) WAVs
    ├── voice_stem.wav                # 48 kHz stereo voice stem
    ├── sfx_stem.wav                  # 48 kHz stereo cue-aligned SFX stem
    ├── music_stem.wav                # 48 kHz stereo sidechain-ducked background music stem
    ├── master.wav / .m4a             # 48 kHz stereo final mastered mix
    ├── timeline.json                 # Sample-accurate timestamps for Title Card, Scenes, Lines, caption_pages, Sub-Shots, SFX, Credits
    ├── captions.vtt                  # Synchronized per-page WebVTT captions
    ├── subtitles.srt                 # Per-page soft subtitle track muxed into vn_story_video.mp4
    └── audio_verification.json       # Automated RMS/Peak/Loudness-hierarchy & harmonic consonance audit
```

---

## 4. Step-by-Step Production Workflow

### Step 1: Check Dependencies and Local Audio Models
Read [Runtime setup](references/runtime-setup.md). Use Python 3.10 or newer, FFmpeg/ffprobe, the Python dependencies, and the documented local model/runtime layout. Do not invoke an unbundled setup script. Resolve `<skill-root>` to this installed skill's directory. Run in an authorized cloud workspace; do not access a personal computer implicitly.

### Step 2: Write `script/story_clarity_audit.md` and `script/vn_story_spec.json`
1. Write the pre-adaptation clarity audit in `script/story_clarity_audit.md` documenting at least 4 concrete clarifying bridges added to the source story.
2. Author `script/vn_story_spec.json` following **[references/vn_spec_schema.md](./references/vn_spec_schema.md)** (including top-level `character_sheets` locks `>= 80 chars` for every recurring character, single-mood key-locked `music_prompt`s, and multi-beat action struggle & earned victory sequences).
3. Re-read the original source story end-to-end and append the mandatory `## Post-Draft Original Story Fidelity Review` and `## Action Pacing, Struggle & Earned Victory Audit` sections to `script/story_clarity_audit.md`.

### Step 3: Build the Image Generation Queue & Generate Anime Visuals via the Host Image Tool
1. Run `prepare_vn_image_manifest.py --mode queue` to export the structured prompt list in `script/image_generation_queue.json` (with verbatim character model locks in every shot and sub-shot prompt):
   ```bash
   python <skill-root>/scripts/prepare_vn_image_manifest.py \
     --spec <project-root>/script/vn_story_spec.json \
     --project-dir <project-root> \
     --mode queue
   ```
2. Use the host assistant's supported image-generation tool to generate each queued illustration, preserving prompts and reference continuity. In ChatGPT, use the available image generation tool and inspect outputs with the image-viewing tool. Save each result to its queue target path. Do not assume Antigravity-specific subagents exist. The script supports only `queue` and `finalize`; it does not generate images or provide an SDXL mode.
3. Normalize all generated images to `1920x1080`, apply `crop_box` reframing if specified, and write `images/image_manifest.json`:
   ```bash
   python <skill-root>/scripts/prepare_vn_image_manifest.py \
     --spec <project-root>/script/vn_story_spec.json \
     --project-dir <project-root> \
     --mode finalize
   ```
4. **Mandatory 5-Pillar Visual QA**: Use the host image-viewing tool on every generated image in `<project-root>/images/` to verify anatomy, prop continuity, time-of-day setting logic, framing, and cross-shot character consistency. Regenerate with the full character model lock or apply `"crop_box"` to any image that needs adjustment, then re-run `--mode finalize`.

### Step 4: Synthesize Kokoro TTS Voices with Character Vocal DSP & Build Timeline
```bash
python <skill-root>/scripts/kokoro_tts_vn.py \
  --spec <project-root>/script/vn_story_spec.json \
  --out-dir <project-root>/audio
```

### Step 5: Generate Stable Audio Small Music & Cue-Timed Multi-Layer SFX + Mix Stems
```bash
python <skill-root>/scripts/sa3_vn_audio.py \
  --spec <project-root>/script/vn_story_spec.json \
  --timeline <project-root>/audio/timeline.json \
  --audio-dir <project-root>/audio
```

### Step 6: Render 1080p 24fps Anime Visual Novel Video (`vn_story_video.mp4`), Web Theater & Validate
```bash
python <skill-root>/scripts/render_vn_video.py \
  --project-dir <project-root>
python <skill-root>/scripts/validate_vn_video.py \
  <project-root>
```
Visually inspect rendered keyframes in `<project-root>/keyframes/` using the host image-viewing tool to confirm ADV/NVL/CG text boxes, speaker badges, and VFX look crisp before delivering the final video.

## Portable edition boundaries
Follow the host assistant's permissions and safety rules. This skill does not authorize paid services, public uploads, model license acceptance, personal-computer access, or disclosure of private source stories. Keep source material private unless publication is explicitly authorized. Use descriptive visual traits rather than requesting imitation of living artists when the host image policy requires it. Do not claim exact word-level alignment or zero audiovisual drift: caption pages have sample-derived audio timing, video is quantized to 24 fps, and within-page SFX cue placement is approximate. Review the finished output.
