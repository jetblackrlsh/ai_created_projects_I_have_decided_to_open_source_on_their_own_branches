# Cinematography & Style of Non-Interactive Anime Visual Novels (Kinetic Novels)

## 1. What Makes a Kinetic Visual Novel Cinematic?

Unlike branching visual novels that rely on static two-sprite stage setups to accommodate dozens of player routes, a **non-interactive anime visual novel (Kinetic Novel)**—pioneered by VisualArt's/Key (*Planetarian*, *Harmonia*) and elevated to theatrical standards by Type-Moon's *Witch on the Holy Night* (*Mahoutsukai no Yoru* / *Mahoyo*) and 07th Expansion (*Umineko*, *Higurashi*)—treats the 16:9 screen as a **choreographed anime film camera**.

### 1.1 Hybrid Text Presentation (`ADV`, `NVL`, and `CG` Modes)
A hallmark of top-tier kinetic novels is dynamically switching the UI frame to match the narrative tone of each beat:
- **`ADV` Mode (Adventure Window — Dialogue & Banter)**:
  - A sleek, dark glassmorphic window sits in the lower third of the 16:9 frame (`width * 0.72` outer box, `width * 0.66` inner text wrap so zero characters ever clip near screen edges).
  - Features a glowing **Speaker Nameplate Pill** on the top-left border of the dialogue window in the character's signature color, a live **Voice Envelope Indicator** (animated equalizer bars pulsing with the character's Kokoro TTS speech amplitude), an animated VN continuation chevron (`▼`) at the bottom-right corner, and a subtle top-right HUD pill (`AUTO ▶  •  LOG  •  SCENE`).
- **`NVL` Mode (Novel Overlay — Internal Monologue, Lore & Solemn Transitions)**:
  - Used when the omniscient `Narrator` delivers rich psychological introspection, worldbuilding lore, or major time/location transitions.
  - Renders a refined storybook slate with warm cream serif typography, subtle ornamental gold hairlines, and a darkened vignette backdrop so the prose reads like an illustrated picture book (*Mahoyo* style).
- **`CG` Mode (Event CG Showcase — Action Climaxes, Transformations & Reveals)**:
  - Used during full-screen action cutaways, magical blasts, and dramatic reveals where you want maximum visibility of the artwork.
  - Compacts the UI into a streamlined translucent cinema pill at the bottom edge while keeping text 100% legible with a crisp dark outline.

---

## 2. Visual Direction, Shot Pacing & Action Choreography

### 2.1 High Shot Density (`4–8 Seconds` per Visual Beat)
- **Anti-Pattern (Forbidden)**: Holding a single static image on screen for 15–25 seconds while multiple actions, attacks, or dialogue turns occur.
- **Required Kinetic Novel Pattern**:
  - Keep individual spoken lines brisk (`3–10 seconds`, `8–28 words`).
  - Whenever a single spoken line describes two or more sequential visual beats (e.g., *"Elena pulled the brass lever, and the giant bronze gears overhead sparked to life"*), attach `"sub_shots": [...]` to that line so the screen cuts seamlessly from **Sub-Shot A** (close-up of Elena pulling the lever) to **Sub-Shot B** (low-angle shot of the bronze gears igniting with sparks) mid-sentence!

### 2.2 Single-Character Focus & Shot / Reverse-Shot Dialogue
- AI image generators produce dramatically cleaner anime anatomy, facial expressions, and consistent character likeness when **each shot focuses on a single subject** (`character_refs` containing at most 1 character ID).
- **Dialogue Staging**: Alternate between medium and close-up single-character shots of Speaker A and Speaker B (with slightly opposing camera pans or `zoom_in_left` / `zoom_in_right` framing and subtle background bokeh) to create classic anime shot/reverse-shot conversation flow.

### 2.3 Action $\rightarrow$ Struggle $\rightarrow$ Near-Failure $\rightarrow$ Strategic Earned Victory (`8–18+` Shots per Fight)
- Never summarize a fight in 1–2 images or allow a one-shot instant win. Every combat encounter must enforce tension, suspense, struggle, and earned victory across a multi-beat sequence:
  1. **Threat & Escalation**: Enemy emerges with overwhelming force (`zoom_in`, ominous VFX).
  2. **Initial Clash & Setback (Hero Struggle)**: The hero's first defense or transformation is tested and pushed back (`single_shake` at impact onset, or straining against the attack).
  3. **Crisis / Near-Failure (Where It Seems Like the Heroes Will Fail)**: A moment where a shield cracks, magic falters, or the hero is pinned/overwhelmed, making defeat feel genuinely possible.
  4. **Transformation or Power Activation (`3–4` Dedicated Shots)**:
     - *Shot 1*: Artifact/aura flaring around the human character.
     - *Shot 2*: Extreme close-up of physical morphing (eyes glowing, scales/fur/armor forming) or weapon/catalyst ignition.
     - *Shot 3*: Full heroic/monster reveal in the environment.
  5. **Strategic Pivot / Teamwork**: The hero or an ally identifies a tactical opening, combines powers, or deploys a catalyst to turn the tide.
  6. **Earned Counterattack & Cutaway Consequence (Mandatory)**: Protagonist strikes (`speed_lines` + `impact_flash` with a single-impulse camera jolt) followed by an immediate cutaway to the enemy being blasted back (`shatter_flash`, `heavy_impact` / `explosion` SFX).
  7. **Aftermath / De-transformation**: Returning to normal form and reacting to the cost and meaning of the victory.

### 2.4 Camera Shake Discipline (Single-Impulse vs. Barrage)
- **Never Spam Continuous Camera Shake**:
  - For a **single strike, gunshot, punch, or explosion** (`"impact_flash"`, `"shatter_flash"`, `"single_shake"`, `"struggle_shake"`), the camera shakes **only once**—a brief, rapidly damped `0.34s` (`~8 frames`) jolt at the start of the impact shot—and stays 100% steady for the remainder of the shot.
  - Reserve continuous multi-pulse camera shake (`"barrage_shake"` or `"earthquake_shake"`) strictly for a rapid barrage of attacks or a literal ground-shaking tremor (`<= 2` shots per video).

### 2.4 Setting Logic, Establishing Shots & Time-of-Day Continuity
- **Mandatory Establishing Shot**: Whenever `scene.setting` changes to a new location, the first shot of that scene must be a wide anime establishing shot (`"is_establishing_shot": true`) with no characters crowding the foreground, allowing the viewer to take in the architecture, weather, and lighting.
- **Time-of-Day & Lore Plausibility**:
  - Define distinct setting IDs for different times of day (`sanctuary_dawn` vs. `sanctuary_midnight`).
  - Never place vampires or nocturnal ambushes in daytime sunlight.
  - When inside a moving vehicle or room, never use an exterior reference prompt that depicts that same vehicle parked outside the window.

---

## 3. Prompting the Host Image-Generation Tool for Anime Visual Novel Art

When invoking `image-generator` for this skill, structure every prompt with four consistent layers:
1. **Medium & Style Prefix**:
   - `"High-detail modern anime visual novel CG illustration, ufotable and Type-Moon Mahoyo art style, luminous atmospheric lighting, crisp cel-shaded linework with rich painterly background detail, 16:9 widescreen composition"`
2. **Shot Framing & Camera Angle**:
   - Specify `"Wide cinematic establishing shot"`, `"Medium waist-up anime portrait"`, `"Dramatic close-up on face and eyes"`, `"Low-angle heroic action shot"`, or `"Dynamic diagonal Dutch-angle action frame"`.
3. **Subject & Expression Lock (Single-Character Focus)**:
   - Include the character's exact `prompt_tag` (hair color/style, eye color, facial features, and current stage-appropriate outfit—never including late-story power-ups in early scenes) plus their exact micro-expression and pose for this beat.
4. **Environment & Lighting Lock**:
   - Append the active setting's `prompt_tag` (architecture, weather, time-of-day color palette, rim lighting) so every shot within a scene shares cohesive lighting and background architecture.

---

## 4. Audio Architecture: Kokoro TTS + Vocal DSP + Stable Audio Small + Mixing

1. **Voice Track (`voice_stem.wav`) & Sample-Accurate Per-Page Subtitles (`caption_pages`)**:
   - Every character + `Narrator` has a unique Kokoro-82M stock voice (`speed = 1.0` strictly enforced).
   - Apply drift-free WSOLA pitch-shifting (`pitch_semitones`), sub-octave chest resonance (`subharmonic_mix`), EQ (`bass_boost_db`, `treble_boost_db`), saturation (`warmth_drive`), and stereo acoustic space (`reverb_type`: `"dark_lord"`, `"telepathic"`, `"ethereal"`, `"monster_raspy"`) so monsters, villains, elders, and youths sound distinct without altering speaking speed or cutting off the end of any line (`0.45s` natural release tail inside every line WAV).
   - Each line is split into balanced, clause/sentence-aware subtitle pages (`<= 100` chars) and synthesized per-page so `line["caption_pages"]` records exact sample-derived `[start, end]` timestamps—using audio-derived timestamps at 24 fps between the spoken TTS audio and the on-screen subtitle box.
   - Normalize active speech to **`-13.5 dBFS` RMS** (`-1.2 dBFS` ceiling).
2. **Sound Effects Track (`sfx_stem.wav`) & Zero Cross-Scene Bleed**:
   - Generate atmospheric and foley clips via local `sa3-sm-sfx` (`stabilityai/stable-audio-3-optimized` LiteRT) and layer combat beats with strictly non-pitched percussive transient reinforcement (`transformation`, `solar_gunshot`, `beam_blast`, `fire_blast`, `attack_swing`, `barrier_shatter`, `heavy_impact`)—never continuous midrange sine drones that clash with the musical key.
   - Ambient/foley SFX (`type: "none"`) are high-passed at `160 Hz` and capped at `+12 dB` max gain boost so low-frequency room/wind rumble never becomes a loud drone over the music.
   - Trigger each SFX at the exact spoken `"sfx_cue"` phrase via `caption_pages` timestamps, and clamp every SFX event to its own scene boundary (`scene_end - 0.15s`) so SFX never bleed into the next scene's opening music (`no_cross_scene_sfx_bleed: true`).
3. **Background Music Track (`music_stem.wav`) — Single-Mood Consonance & Non-Overlapping Transitions**:
   - Generate a unique, single-mood, key-locked musical theme per scene via local `sa3-sm-music` (`stabilityai/stable-audio-3-optimized` LiteRT), trimming the noisy `30–35s` diffusion decay tail and applying a warm mastering filter (`65 Hz` high-pass, `-2.5 dB` mud cut, `6800 Hz` low-pass) verified for harmonic consonance (`semitone_clash_ratio <= 0.45`).
   - **Zero Overlapping Music Tracks (`music_overlap_sec == 0.0`)**: Track `k` fades out smoothly (`1.4s` cosine fade-out) to `0.0` at `scenes[k]["end"]` before Track `k+1` fades in smoothly (`1.4s` cosine fade-in) from `0.0` at `scenes[k+1]["start"]`, and intra-scene loops taper smoothly out and in (`1.1s` cosine taper) with zero competing bar overlap.
   - Normalize unducked music to **`-21.0 dBFS` RMS** and smoothly sidechain-duck to **`-27.8 dBFS` RMS** under active speech/SFX.
   - Guarantees: **`Voices (-14.4 dBFS) > SFX (-17.0 dBFS) > Background Music (-27.8 dBFS) > Audible Floor (-34.0 dBFS)`**.
