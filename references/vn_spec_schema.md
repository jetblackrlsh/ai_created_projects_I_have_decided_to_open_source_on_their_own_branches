# Anime Visual Novel Specification Schema (`script/vn_story_spec.json`)

Save your story adaptation specification at `<project-root>/script/vn_story_spec.json` (UTF-8 JSON).

## Complete Example & Field Reference

```json
{
  "title": "Chronicles of the Astral Clocktower",
  "subtitle": "An Anime Visual Novel Adaptation",
  "author_credit": "Adapted with Anime Visual Novel Adapter",
  "synopsis": "High atop the rain-swept Astral Clocktower, apprentice horologist Elena discovers why the city's time-anchor has stalled—and must awaken the dormant Chrono-Key before the Shadow Hound shatters the ward.",
  "date": "11/04/2026",
  "tags": [
    "anime visual novel",
    "kinetic novel",
    "story adaptation",
    "audio drama",
    "fantasy anime"
  ],
  "title_duration": 3.5,
  "credits_duration": 4.5,
  "art_style_prefix": "High-detail modern anime visual novel CG illustration, ufotable and Type-Moon Mahoyo style, luminous atmospheric lighting, crisp cel-shaded anime linework, rich painterly background, 16:9 widescreen",
  "character_sheets": {
    "Elena": "Elena, a 19-year-old female horologist with fair skin, a silver-streaked dark navy braided bob haircut, bright emerald green eyes, wearing a fitted copper-trimmed navy coat over a high-collared cream blouse with a brass pocket-watch chain across her vest and brown leather fingerless gloves",
    "Shadow Hound": "Shadow Hound, a towering black-scaled demonic wolf beast with glowing blue hellfire eyes, jagged obsidian fangs, and blue-cyan spectral flames curling from its armored shoulders"
  },
  "title_image_prompt": "Wide cinematic anime visual novel title screen illustration of a towering gothic brass and stone clocktower rising above a mist-shrouded twilight city, glowing cyan astral clock face, falling rain streaks and warm lantern light, masterpiece",
  "credits_image_prompt": "Serene wide anime visual novel illustration of the Astral Clocktower balcony at dawn after the storm, golden morning sunlight breaking through parted clouds over the city rooftops, glowing brass gears turning peacefully",
  "cast": {
    "Narrator": {
      "role": "Omniscient Visual Novel Narrator",
      "voice": "bm_george",
      "speed": 1.0,
      "pan": 0.0,
      "color": [242, 198, 114],
      "pitch_semitones": 0.0,
      "subharmonic_mix": 0.0,
      "bass_boost_db": 1.0,
      "treble_boost_db": 0.5,
      "warmth_drive": 0.0,
      "reverb_type": "none"
    },
    "Elena": {
      "role": "Apprentice Horologist",
      "voice": "af_heart",
      "speed": 1.0,
      "pan": -0.12,
      "color": [118, 215, 242],
      "pitch_semitones": 0.6,
      "subharmonic_mix": 0.0,
      "bass_boost_db": 0.0,
      "treble_boost_db": 1.0,
      "warmth_drive": 0.0,
      "reverb_type": "none",
      "generate_anchor": true,
      "prompt_tag": "Elena, a 19-year-old anime female horologist with a silver-streaked dark navy braided bob haircut, bright emerald green eyes, wearing a fitted copper-trimmed navy coat over a cream blouse with a brass pocket-watch chain",
      "visual_description": "Anime character reference portrait of Elena, a 19-year-old female horologist with a silver-streaked dark navy braided bob haircut and bright emerald green eyes, wearing a copper-trimmed navy coat over a cream blouse, warm studio lighting, clean anime visual novel sprite style"
    },
    "Chrono-Key": {
      "role": "Sentient Astral Artifact",
      "voice": "af_nicole",
      "speed": 1.0,
      "pan": 0.12,
      "color": [196, 152, 255],
      "pitch_semitones": 1.2,
      "subharmonic_mix": 0.0,
      "bass_boost_db": 0.0,
      "treble_boost_db": 2.0,
      "warmth_drive": 0.0,
      "reverb_type": "telepathic",
      "generate_anchor": false
    },
    "Shadow Hound": {
      "role": "Nocturnal Rift Beast",
      "voice": "am_fenrir",
      "speed": 1.0,
      "pan": 0.18,
      "color": [255, 112, 112],
      "pitch_semitones": -2.8,
      "subharmonic_mix": 0.28,
      "bass_boost_db": 3.0,
      "treble_boost_db": 1.0,
      "warmth_drive": 0.25,
      "reverb_type": "monster_raspy",
      "generate_anchor": true,
      "prompt_tag": "a towering black-scaled demonic wolf beast with glowing blue hellfire eyes, jagged obsidian fangs, and blue-cyan spectral flames curling from its shoulders",
      "visual_description": "Anime visual novel creature portrait of a towering black-scaled demonic wolf beast with glowing blue hellfire eyes, jagged obsidian fangs, and blue spectral flames curling from its shoulders, dark moonlit gothic atmosphere"
    }
  },
  "settings": {
    "clocktower_gear_chamber_night": {
      "name": "Astral Clocktower — Gear Chamber (Midnight Storm)",
      "prompt_tag": "inside the circular gothic stone gear chamber of the Astral Clocktower at midnight, giant frozen bronze clockwork gears on curved stone walls, rain-lashed arched glass window flashing with storm lightning, warm amber oil lanterns",
      "visual_description": "Wide anime visual novel background plate of the interior circular stone gear chamber of a gothic clocktower at midnight, giant frozen bronze clockwork gears, rain-lashed arched glass window, warm amber oil lanterns, no people, luminous cinematic anime background style"
    },
    "clocktower_balcony_dawn": {
      "name": "Astral Clocktower — High Balcony (Golden Dawn)",
      "prompt_tag": "on the high stone balcony of the Astral Clocktower at golden dawn, warm sunrise light breaking through parted clouds over a medieval-fantasy city, wet stone balustrade glistening",
      "visual_description": "Wide anime visual novel background plate of a high stone balcony on a gothic clocktower at golden dawn, warm sunrise light breaking through parted clouds over a fantasy city, no people, luminous cinematic anime style"
    }
  },
  "scenes": [
    {
      "id": "S01",
      "title": "Scene 1: The Frozen Pendulum",
      "setting": "clocktower_gear_chamber_night",
      "music_prompt": "Mysterious fantasy anime visual novel soundtrack in A minor, warm fingerpicked acoustic guitar and gentle harp arpeggios, calm atmosphere, 92bpm, instrumental, no vocals",
      "music_seed": 101,
      "music_seconds": 35.0
    },
    {
      "id": "S02",
      "title": "Scene 2: Clash in the Gear Chamber",
      "setting": "clocktower_gear_chamber_night",
      "music_prompt": "Heroic dark fantasy anime orchestral soundtrack in E minor, rhythmic cello ostinato, driving acoustic guitar, and warm orchestral strings, 116bpm, instrumental, no vocals",
      "music_seed": 202,
      "music_seconds": 35.0
    }
  ],
  "lines": [
    {
      "id": "L01",
      "scene": "S01",
      "speaker": "Narrator",
      "type": "narration",
      "vn_mode": "NVL",
      "is_establishing_shot": true,
      "shot": "wide",
      "camera_motion": "pan_right",
      "zoom_amount": 0.12,
      "vfx": ["rain_streaks"],
      "character_refs": [],
      "text": "At the stroke of midnight, the great bronze pendulum of the Astral Clocktower hung frozen in place, starving the city's protective barrier of power while a violent storm lashed the arched glass window.",
      "image_prompt": "Wide establishing shot inside the circular gothic stone gear chamber at midnight, giant frozen bronze pendulum and clockwork gears, rain lashing the tall arched window, no people",
      "sfx_events": [
        {
          "name": "storm_rain_ambience",
          "prompt": "Heavy rain pattering against tall glass window with distant rolling thunder rumble",
          "type": "none",
          "seed": 301,
          "seconds": 4.0,
          "cue": "violent storm",
          "align": "middle"
        }
      ]
    },
    {
      "id": "L02",
      "scene": "S01",
      "speaker": "Elena",
      "type": "dialogue",
      "vn_mode": "ADV",
      "implied_adaptation": true,
      "shot": "close_up",
      "camera_motion": "zoom_in",
      "zoom_amount": 0.14,
      "dof_blur": true,
      "vfx": ["struggle_shake"],
      "character_refs": ["Elena"],
      "text": "The main drive shaft is fused solid by dark frost! If I cannot release this brake lever before the ward collapses, the entire lower district will be exposed!",
      "image_prompt": "Close-up anime visual novel shot of Elena straining with both hands against a heavy frost-covered brass brake lever, determined expression, emerald eyes reflecting amber lantern light",
      "sub_shots": [
        {
          "id": "L02_b",
          "fraction": 0.52,
          "camera_motion": "zoom_in_right",
          "vfx": ["teal_magic"],
          "image_prompt": "Extreme close-up of Elena's hands gripping the frosted brass lever as a silver key-pendant at her collar begins to pulse with cyan astral light"
        }
      ],
      "sfx_events": [
        {
          "name": "metallic_lever_strain",
          "prompt": "Heavy rusted bronze gear and metallic lever straining and groaning under pressure",
          "type": "none",
          "seed": 302,
          "seconds": 3.5,
          "cue": "brake lever"
        }
      ]
    }
  ]
}
```

## Supported Values Quick Reference

- **`vn_mode`**:
  - `"ADV"`: Classic Anime Visual Novel lower-third dialogue box with speaker nameplate, live voice-envelope indicator, and VN corner HUD (`AUTO ▶ | LOG`).
  - `"NVL"`: Storybook literary narration slate with serif typography and ornamental dividers.
  - `"CG"`: Streamlined Event CG showcase caption pill for action climaxes and full-screen reveals.
- **`shot`**: `"wide"`, `"medium"`, `"close_up"`, `"extreme_close_up"`, `"low_angle"`, `"high_angle"`, `"ots_left"`, `"ots_right"`, `"dutch_tilt"`.
- **`camera_motion`**: `"zoom_in"`, `"zoom_out"`, `"pan_right"`, `"pan_left"`, `"pan_up"`, `"pan_down"`, `"zoom_in_left"`, `"zoom_in_right"`, `"dutch_tilt"`, `"static"`.
- **`character_sheets`**:
  - Top-level dictionary mapping each character's canonical name (`"Elena"`, `"Hero"`, `"Hero (Young)"`, etc.) to a detailed `>= 80`-character model sheet lock (exact age, skin tone, hair color/style, eye color, facial hair, and canonical outfit). `prepare_vn_image_manifest.py` automatically injects this lock into every shot and sub-shot prompt referencing that character.
- **`vfx`** (list of 24fps procedural overlays):
  - `"sakura_petals"`, `"rain_streaks"`, `"speed_lines"`, `"impact_flash"`, `"single_shake"`, `"struggle_shake"`, `"shatter_flash"`, `"barrage_shake"`, `"earthquake_shake"`, `"fire"`, `"blue_hellfire"`, `"solar_light"`, `"crimson_magic"`, `"teal_magic"`, `"nature_vines"`, `"kinetic_rings"`, `"lucid_light"`, `"cosmic_stars"`, `"bubbles"`, `"alarm_pulses"`.
  - **Camera Shake Note**: `"impact_flash"`, `"shatter_flash"`, `"single_shake"`, and `"struggle_shake"` produce a **single damped camera jolt** (`0.34s`) at the start of the shot and remain steady afterward. Use `"barrage_shake"` or `"earthquake_shake"` (`<= 2` shots per video) only when a rapid barrage of hits or a continuous earthquake is occurring.
- **`sfx_events[].type`** (procedural anime combat/magic transient layer blended with Stable Audio Small SFX):
  - `"none"`, `"power_activation"`, `"transformation"`, `"solar_gunshot"`, `"beam_blast"`, `"fire_blast"`, `"attack_swing"`, `"claw_slash"`, `"barrier_shatter"`, `"defense_shield"`, `"heavy_impact"`, `"wooden_impact"`, `"earth_magic"`, `"explosion"`, `"vn_text_blip"`.
- **`cast.<Speaker>.reverb_type`**:
  - `"none"`, `"dark_lord"`, `"telepathic"`, `"ethereal"`, `"monster_raspy"`.
- **`cast.<Speaker>.speed`**:
  - **MUST always be `1.0`** (or omitted, as `kokoro_tts_vn.py` strictly locks `speed = 1.0`). Never modify the speed of voices (`speed != 1.0`), as altering TTS speed causes unforeseen cadence and phoneme artifacts.
- **`scenes[].music_prompt`**:
  - Always specify a **single cohesive mood, a single tempo, and an explicit musical key** (e.g., `"in A minor"`, `"in D minor"`, `"in E minor"`). Never write a multi-genre `"transitioning into..."` prompt or combine conflicting instrumentations in a single scene cue, and split peaceful exploration vs. combat into separate scenes so each music track is harmonically consonant (`semitone_clash_ratio <= 0.45`).
