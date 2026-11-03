# Story Clarity Audit, Zero-Repetition Pacing & Dialogue Adaptation Guide

## 1. Mandatory Pre-Adaptation Story Clarity Audit (`script/story_clarity_audit.md`)

Raw stories, RPG session summaries, and outline notes frequently skip causal links or introduce terms (*"the Ring"*, *"the First Signal"*, *"the Vessel"*, *"full AI integration"*) without explaining how they fit together. If you animate a summary literally without clarifying those links, the audience will feel lost.

Before writing `script/lines.json`, you **must** create `script/story_clarity_audit.md` with a structured table answering five questions for every scene:
1. **What is potentially confusing or abrupt in the source text?**
2. **What is the true cause-and-effect chain behind this beat?**
3. **What clarifying bridge (in narration or dialogue) makes this unmistakable to a first-time viewer?**
4. **How is visual staging (HUD callouts, environment details, prop state changes) reinforcing this clarity?**
5. **What repetition was eliminated?**

### Rules for Adding Story Clarifications
- **Clarify Stakes & World Rules Early**: In the opening scene, state clearly what the central anomaly is and why it threatens the world, plus who the protagonist is and what they are trying to achieve.
- **Explicitly Connect Cause & Effect**: Whenever a character's choice causes a downstream consequence (e.g., unlocking a restricted lab AI to fabricate rescue armor accidentally opens a backdoor for an underground signal to accelerate building a giant mechanical vessel), spell out that causal chain clearly in the dialogue/narration as it unfolds.
- **Define Technical or Lore Terms on First Mention**: Never drop terms like *"First Signal"*, *"Vessel directive"*, or *"distilled intelligence"* without an immediate, plain-English explanation of what they mean physically in the scene.

---

## 2. Zero Narrator-Dialogue Repetition (Strict Chronological Lockstep)

The #1 killer of pacing and clarity in animated adaptations is **Narrator-Dialogue Echoing**—where the narrator summarizes an action or conversation, and then the characters immediately say the exact same thing again.

### Anti-Pattern (FORBIDDEN — Redundant & Out-of-Order)
> ❌ **Narrator**: *"The giant launches a kinetic sphere; the Traveler catches it, vaults onto its fist, and locks magnetic boot clamps into its shoulder."*  
> ❌ **Traveler**: *"What if we have a friendly sparring match? ARCHITECT-S1, turn my boot stabilizers into magnetic clamps!"*  
> *(Why this fails: The narrator spoiled the entire sequence before the character even proposed sparring, and repeated the boot-clamp beat twice!)*

### Required Pattern (REQUIRED — Chronological Lockstep, Zero Duplication)
> ✅ **Traveler**: *"Hold on! You don't have to fight me to the death—what if we test our limits in a friendly sparring match?"*  
> ✅ **Mosaic**: *"A non-lethal calibration trial? Accepted. Catch this kinetic sphere if you can!"*  
> ✅ **Narrator**: *"Mosaic hurls a blazing plasma orb across the vault—the Traveler catches it two-handed, spins, and fires it right back! As the giant lunges with a restrained fist, the Traveler vaults onto its knuckles and sprints up its metallic forearm while its shoulder plates shift to throw him off."*  
> ✅ **Traveler**: *"ARCHITECT-S1, copy how its metal reshapes! Convert my boot stabilizers into magnetic traction clamps—now!"*  
> ✅ **ARCHITECT-S1**: *"Actuators re-routed! Electromagnetic boot clamps locked to the hull—armor at ninety-four percent, power at sixty-four!"*  
> *(Why this works: Every single line moves time forward. Dialogue initiates choices; narration describes the kinetic physical action between lines; zero ideas are repeated.)*

### Quantitative Pacing Targets
- **Utterance Length**: Keep individual lines between **3 and 11 seconds** (`8–28 words`). Never write 22-second wall-of-text monologues.
- **Turn-Taking Gaps**: Use crisp `0.14s–0.24s` gaps between rapid dialogue turns within a scene, and `0.45s–0.65s` at scene transitions.
- **Speech Speed**: Use lively conversational speeds (`1.03–1.12`) so dialogue crackles with urgency and energy.

---

## 3. Unique Kokoro TTS Voice Casting Rules

Every speaking entity in the production **must** have a unique stock voice ID from the Kokoro-82M (`kokoro-onnx` v1.0) voice bank (`len(cast) == len(set(voices))`):

| Voice ID | Accent / Gender | Vocal Timbre & Recommended Archetype | Recommended Speed |
| :--- | :--- | :--- | :--- |
| `af_heart` | US Female | Warm, expressive, clear cinematic narrator | `1.05` |
| `am_adam` | US Male | Earnest, quick-thinking protagonist / hero | `1.06` |
| `af_sky` | US Female | Bright, rapid-fire speedster / scout | `1.12` |
| `bf_emma` | UK Female | Authoritative, poised veteran engineer / commander | `1.03` |
| `bm_george` | UK Male | Deep, resonant, analytical mainframe AI | `1.02` |
| `am_michael` | US Male | Crisp, tactical onboard wrist AI companion | `1.06` |
| `bm_lewis` | UK Male | Rich, monumental awakened construct / titan | `0.96` |
| `af_bella` | US Female | Light, enthusiastic miniature shapeshifting robot | `1.12` |
| `af_nicole` | US Female | Mystical, resonant cosmic sorcerer / oracle | `1.00` |
