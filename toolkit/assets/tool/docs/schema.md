# Manifest v1

The complete neutral example is `examples/harbor/project.json`. Paths must be relative to its directory and cannot escape it. No external URLs or shell commands are accepted as asset fields.

Required top-level fields:
- `schemaVersion: 1`, `title`, `credits: [string]` (truthful production credits).
- `audioOnlyReview: {approved: true, notes: string}`: an explicit script-review record, not automatically inferred from waveform QA.
- `visualMode: "comic-panels"`, `duration` in seconds (positive, <=300, integral frame count), `fps` integer1–60; optional `size` square pixels256–1920, default1080.
- `cast`: role-to-stock-voice map, all values distinct.
- `panels`: `{id,image,source,sha256,sourceSha256}`; source and image are project-relative files with SHA256. Every declared panel must appear in a shot. A complete source ledger/reviewer must establish that this declared list is the intended comic coverage; software cannot infer omissions from an incomplete list.
- `shots`: `{id,panel,image,start,end}`; sorted, nonoverlapping, frame-aligned. Full images are fitted within safe margins, not arbitrarily face-cropped. Reusing a panel is allowed when the story calls for it.
- `speech`: `{id,shot,file,text,speaker,voice,start,gain?}`; sorted, no overlaps, duration measured from WAV and contained in its shot. Default gain.86. Inputs may use their native sample rates; the mixer explicitly resamples to48kHz. **Outputs**, not native inputs, must be48kHz. Source speech cannot be missing or silent.

Optional fields:
- `effects`: `{id,file,action,at,offset,duration?,peak?,speech_gain?}`. `at` is the intended absolute transient time; `offset` is that transient's offset within the source clip. Actual placement is `at-offset`. No silent clamping. Peak target defaults.25 (<.9); ordinary speech_gain.65, allowed.5–1. Meaningful actions require meaningful source sounds; arithmetic cannot certify semantic sound fidelity.
- `music: {file,peak?}`: a WAV covering the whole duration; no implicit looping. Default peak.24. Score arrangement/crossfades should be explicitly authored before mixing.
- `speechFocus`: `{start,end,gain,reason?}` windows for selective SFX reduction, smoothed40ms. Avoid blanket effect suppression. Music already ducks more strongly.
- `background`: project-relative image for the static audio-drama card; defaults to first shot.
- `fontDir`: explicit local font directory, default Linux DejaVu path. This is a font path only, not an executable.

Planning accepts generated speech with `shot` IDs and writes a NEW `*-planned.json`, measuring durations and honoring optional intro/outro/speechGap. It does not preserve hand-authored absolute music/SFX timing automatically: review those after planning.

## Crop plan
`{"crops":[{"id":"panel1","source":"page.svg","output":"panels/panel1.png","rect":[x,y,width,height]}]}`. Rectangles are integer pixels at96DPI for SVG. Self-contained SVG only: external href, scripts, entities and styles are rejected. All source pixels in the declared rectangle are preserved; no ASCII conversion or redraw. Inkscape is an optional installed dependency, not downloaded by the tool.

## Audio generation jobs
This is a SEPARATE plan, not the film manifest: `{"jobs":[{"id":"score","kind":"music","prompt":"...","seconds":12,"seed":123,"output":"assets/score.wav"}]}`. `kind` is music or sfx. See the adapter help and pinned model notes. Generation output paths are relative to the jobs file.
