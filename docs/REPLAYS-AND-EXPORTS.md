# Replays, board images, card close-ups and MP4

Open the downloaded`replays/Aether-Snap-Replay-Viewer.html`. Try a built-in synthetic solo/multiplayer demo, or import:

- a completed headless save/demo JSON;
- the complete original browser JSON/text log (initialization, seed/deck codes and every event through RESULT);
- a full async multiplayer referee result; or
- the matching multiplayer offer and response selected together.

Play/pause, step both directions, seek, reset, choose speed, jump to turns/outcome and inspect visible cards. The timeline shows reached events only. A/Player is the viewing perspective: opponent hand identities and face-down cards remain concealed; locations reveal in original order. This is not a secure hidden-information host: technically inspectable exports/seeds contain information.

Legacy logs do not record staging deliberation, undo history or exact thinking times. The viewer infers unambiguous final committed staging and validates the **complete regenerated semantic event stream**. Incomplete, ambiguous, edited or incompatible logs are rejected rather than filled with imagined gameplay. Playback is event-paced, not exact wall-clock reenactment.

## PNG buttons

**Board PNG** exports the current state at 1920×1080. Inspect a visible card and click **Export readable card PNG** for 1200×1980, original SVG plus full ability/stats. Browser PNGs embed an`AetherSnapProvenance` PNG text chunk containing source/engine/frame information. There is no browser MP4 recorder: the MP4 button explains the reliable local CLI route below and saves a replay bundle.

## CLI prerequisites

Node 18+, `npm ci` for pinned`@napi-rs/canvas`. For MP4, additionally install`ffmpeg` with libx264 and `ffprobe` on PATH. These external programs/binaries are not bundled. No account or paid API is used. After dependencies are installed, rendering is offline.

```sh
node replays/export-replay.cjs info fixtures/multiplayer-result.json
node replays/export-replay.cjs frame fixtures/multiplayer-result.json final.png
node replays/export-replay.cjs frame fixtures/multiplayer-result.json turn2.png --turn 2 --point end
node replays/export-replay.cjs frame fixtures/multiplayer-result.json exact.png --index 10
node replays/export-replay.cjs frame fixtures/multiplayer-result.json effect.png --event "destroyed" --occurrence 0
```

To export a close-up, get an exact UID and frame from`info`, then:

```sh
node replays/export-replay.cjs card fixtures/multiplayer-result.json card.png --uid ACTUAL_UID --index ACTUAL_INDEX
```

A card's current power depends on frame. Without a selector, the latest publicly visible state is used; use an exact index for chronological commentary. Hidden/never-public opponent cards are rejected. Indices are zero-based. Turn`start` is before that turn's reveal/draw sequence; turn `end` is its SUMMARY state before the next turn. No selector means the final outcome state.

```sh
node replays/export-replay.cjs mp4 fixtures/multiplayer-result.json match.mp4
node replays/export-replay.cjs mp4 fixtures/multiplayer-result.json match-fast.mp4 --width 1280 --height 720 --speed 2
```

MP4 is genuine H.264/yuv420p,30 fps,1920×1080 by default (or 1280×720). All validated snapshots are retained with event-paced holds:900ms ordinary events,1000ms visual events,330ms state updates at1×, adjustable 0.5–8×. The export is silent; synthesized browser music and historical thinking times are not recovered. FFmpeg CFR resampling can shift transitions by about1–2 video frames. WebM is never relabeled MP4.

Add`--response RESPONSE.json` when using an offer as the primary input. Use only one selector (`--index`, `--turn` or `--event`). Board PNG sizes are16:9 from 1280×720 to3840×2160. Card widths 600–2400 produce height 1.65×width. Every CLI output has a provenance sidecar with exact input/output hashes, engine/renderer identity, frame/card details and result. Output/provenance collisions are refused.

Native MP4 rendering uses one short-lived process per frame, a bounded temporary PNG cache and single-thread FFmpeg. Temporary files are cleaned on success/handled failure. If forcibly interrupted, clean only that run's abandoned`aether-mp4-*` temporary cache, not unrelated projects.

## Verification limits

Reconstruction and native media are tested. Native PNGs/decoded MP4 frames have been visually checked in development. Actual browser rendering/download integration was blocked in the development cloud environment; DOM-mock tests do not count as rendered browser QA. Fonts may differ across operating systems. Bundled fixtures are synthetic demonstrations; generate your own media from them or your authorized matches.
