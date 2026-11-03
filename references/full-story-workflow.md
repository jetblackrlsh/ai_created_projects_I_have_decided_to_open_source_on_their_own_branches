# Full story production workflow

Use this mode for story/session adaptations, narrated films, action stories or a requested full audiovisual workflow. Keep the lighter still/silent-loop mode for those explicit requests. This mode adds story, audio, timing, accessibility and delivery to the visual requirements in production-quality.md; it never substitutes checklist counts for good artwork or performance.

For source comparison and adopted/non-adopted requirements, read story-integration.md only when reviewing the integration.

## 1. Clarify the story before scripting

Read the complete source. Write script/story_clarity_audit.md: protagonist and goal, stakes, world rules/jargon, motivations, location transitions, cause → choice → consequence, source ambiguity, and the specific clarifying bridge or visual staging that resolves each issue. Distinguish source facts from adaptation choices. Do not silently invent consequential lore or change the intended outcome.

Write script/adaptation_script.md and script/lines.json. Advance events chronologically. Convert important implied conversations to concise direct dialogue. Narration describes essential physical action and environment changes that dialogue cannot communicate; dialogue drives choices, discoveries and emotion. Do not pre-summarize an action and repeat it afterward in speech. Review the audio-only experience for comprehensible geography, actions and causal links. Use no narration only when the chosen format supports that intentionally; disclose any limitation in eyes-closed comprehension.

Keep action-story lines brisk and turn gaps intentional, but do not enforce an arbitrary minimum cast, line count or duration. Do not speed speech merely to fit a pre-rendered shot. Script clearly motivated anticipation/action/reaction/settle beats and reserve time for meaningful silent action.

## 2. Preflight and generate authentic audio

Read audio-workflow.md. The installed companion skill **webgl-canvas-story-animator** supplies Kokoro and Stable Audio setup/generation helpers and model manifest; locate it by exact skill name using skills.read/list or the personal-skills checkout. This is an explicit dependency for model generation, not an implicit claim that its models ran. If unavailable, report the missing dependency and use the public source linked in audio-workflow.md only within current permissions. Do not substitute generic synthesized tones, other TTS or stock audio while labeling them Kokoro/Stable Audio.

Verify existing runtime, weights and voice bank before restoring missing files. Synthesize a short real sample and listen before committing a full script. Cast a distinct stock Kokoro voice for each speaking role and narrator; validate IDs against the available bank. Record model/runtime versions, voice, speed, text, seed where applicable, output checksum and actual WAV duration. Generate appropriate Stable Audio Small-Music and Small-SFX cues with prompts/seeds and provenance. Adjust cue count to dramatic needs rather than padding a short film to a fixed quota.

## 3. Lock the canonical timeline from measured media

Use actual synthesized WAV lengths, then schedule lines, action gaps, scene boundaries, camera moves, caption cues and SFX against one audio/timeline.json. Treat audio sample time as the clock and evaluate visual frames at frame/fps. Preserve the user's specified duration or ask before materially expanding it; edit/regenerate dialogue instead of silently time-stretching speech unnaturally.

Canonical schema (seconds are finite numbers):

    {"title":"...","sample_rate":48000,"total_duration":40,
     "cast":{"Iona":{"voice":"af_sky","model":"Kokoro-82M"}},
     "scenes":[{"id":"s1","title":"...","location":"...","start":0,"end":8,"duration":8}],
     "lines":[{"id":"l1","scene":"s1","speaker":"Iona","voice":"af_sky",
       "text":"...","caption":"...","start":1,"end":3,"duration":2,
       "file":"lines/l1.wav","sha256":"...","envelope_20hz":[]}],
     "sfx_events":[{"id":"impact","start":6,"end":7,"description":"metal impact"}]}

Store media paths relative to audio/, prevent path traversal, and measure rather than fabricate start/end/duration values. Plan intentional overlapping speech explicitly. Include source identifiers in provenance. Lip movement can follow an amplitude envelope but must not be described as phoneme-accurate lip sync. Keep expressions and gestures directed separately from mouth motion.

## 4. Produce visuals without lowering the art standard

Follow production-quality.md's design, coverage, motion-sample and final gates. Integrate the story animator's depth architecture: shader atmosphere/energy, distant environment, midground set pieces, interactive stage/props, foreground occlusion/FX. Use enough independent layers to preserve all these functions; a fixed count alone proves nothing. Articulate the joints actually required by the action and preserve sculpted, detailed silhouettes and materials. Do not force armor or mechanical plate counts on unrelated designs.

Maintain the required varied viewpoints, genuine perspective changes, pans and zooms. Stage every important story prop state and causal event so the audience can follow it. Render a representative near-final close/wide pair and short action/camera sample before the full video. Align contact/impact frames and reactions with the canonical event timeline.

## 5. Mix and review sound

Keep voice_stem.wav, sfx_stem.wav and music_stem.wav at 48 kHz stereo, plus master.wav. Align SFX by audible transient, not file start alone; trim late events at the endpoint rather than moving them earlier. Use smooth music crossfades and speech/SFX ducking. Speech must remain intelligible, SFX clear and music audible without masking either. Starting targets of about 8–14 dB speech-over-music and 6–12 dB SFX-over-music are mix guides, not perceptual guarantees. Measure comparable active windows, integrated loudness/true peak and clipping; listen to dense and quiet passages. Record failed checks honestly and fix them.

Generate synchronized WebVTT speech plus useful SFX/music cues. Keep readable line lengths and suitable cue durations; do not cover important faces/hands. Verify cue timestamps and speaker labels against the delivered audio, not an obsolete script. Check phrase pronunciation, loudness, edit clicks, clipping, tail cuts, dropouts and voice consistency by listening.

## 6. Player, export and delivery

Deliver editable Canvas/GLSL source with an interactive index.html using play/pause, seek, replay, volume/mute and caption toggle. Drive renderAt(audio.currentTime) from the actual audio element, and render immediately after seeking; avoid separate unsynchronized animation clocks. Start audio on a user gesture. Include a useful paused poster and reduced-motion option; label any Canvas-only fallback. Package external audio/media with relative paths and document whether HTTP serving is required. Test play, seek and captions in a browser when available; headless Canvas/EGL tests do not validate these controls.

Export the requested resolution/rate, defaulting to fast 640×360 6fps H.264 yuv420p + AAC 48 kHz stereo; retain selectable full 1920×1080 24fps for this full-story workflow. Keep frame count, video duration, master and captions consistent. Do not use -shortest to hide a mismatched or truncated ending. Retain the original high-quality video, source package, timeline, captions, preview/contact sheet and factual production/QA notes.

Prepare youtube_metadata.md only as upload-ready text, not an upload: title/date when requested, accurate synopsis, timestamped scene navigation, tags, cast and credits derived from actual outputs. Do not copy the companion generator's story-specific paragraph or assert model use/accessibility not verified. YouTube chapter eligibility and publishing are separate from providing scene timestamps.

Run scripts/validate_story_project.py PROJECT --width 640 --height 360 --fps 6 (or explicit 1920/1080/24 for full mode), plus actual GLSL and visual/audio reviews. Read its results as technical evidence only. A technical pass does not prove story clarity, emotion, beauty, originality, model authenticity, browser playback or accessibility. Record which of those were actually reviewed.

Save full-quality requested videos privately to the user's own Drive when authorized by current instructions, verify file access and links, and include captions/source as requested. Do not publish the film, upload to YouTube or change sharing just to deliver it.
