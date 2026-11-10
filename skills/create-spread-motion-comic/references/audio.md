# Audio production

Read runtime-setup.md, audio-runtime-manifest.json, audio-runtime-requirements.txt, vn_spec_schema.md and audio-mixing.md in this directory. Use the bundled scripts/setup_audio_runtime.py and adapters. Obtain the current user’s authorization before downloading required external models/runtime and check applicable model terms. A prior private user’s permission is not a grant to other users. No weights are bundled.

Assign narrator and every speaking character a distinct stable Kokoro voice. Use language-compatible stock voices and verify availability before recording all lines. Keep casting in a JSON mapping and labels in the transcript. Do not clone a real person's voice. Normalize measured speech, preserve utterance boundaries, and keep separate voice, effects and music stems.

Use continuous musical phrases across coherent scenes rather than restarting a tiny loop for each panel. Generate distinct motivated effects synchronized with the action. Document intentionally quiet panels. Check generation output, duration, nonzero amplitude and full decode. Stable Audio silence/failure is not equivalent to an intentional silent passage.

Start from the bundled backend's active-RMS normalization, music-to-voice target near -12 dB, bounded speech ducking near 0.5, effect ducking near 0.7 and presence floor near 0.4. These are starting points, not approval. Keep speech most prominent, relevant SFX next and music audibly supporting them. Do not multiply repeated ducking envelopes until the music vanishes. Leave peak headroom and inspect per-speech-window levels, flagged quiet music and peak-cap effects.

Use the backend's source placement, canonical-master reconstruction and encoded-boundary timing checks with its negative controls. Do not remove audible music merely to increase isolated-speech correlation. Diagnose speech prominence separately from timing. Listen to the final encoded mix when possible; otherwise explicitly mark listening unverified. Preserve stems for a targeted rebalance instead of regenerating accepted speech.
