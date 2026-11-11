# Manifest

The renderer needs Python 3, Pillow, NumPy, DejaVu Sans fonts and FFmpeg on PATH. Install from official OS/Python registries. Keep paths relative to the manifest. Use `python scripts/render.py manifest.json video.mp4`; `--frames-only` outputs scene midpoint PNGs without encoding.

```json
{
  "width":640,"height":360,"fps":24,"audio":"audio/master.wav",
  "scenes":[{
    "id":"opening","duration":6.5,"title":"A clear idea, made visible",
    "layout":"host-right","host":"host/explaining.png",
    "host_talking":"host/explaining-open.png",
    "bullets":["One claim per scene","Show the evidence"],
    "speech":[{"start":0.2,"end":5.8,"subtitle":"One claim per scene. Show the evidence."}]
  }]
}
```

Allowed layouts: `host-right`, `host-left`, `full`. `background` is a Pillow color string. Scene-level host path chooses pose/expression. `host_talking` is optional and must use the same canvas/anchor as host. Gentle bob and mouth toggle occur only during listed speech spans; no promise of lip sync.

Instead of bullets use `bars:[{"label":"Example A","value":0.6}]`, normalized to 0–1; include real units, scale/context visibly and in source ledger. Bars animate to supplied values and do not compute statistics.

For evidence use `image`, `image_sha256`, `source_kind` (original/generated/screenshot/licensed), `source_label`. Screenshots additionally require `source_url`, `captured_at`. Optional `crop:[left,top,right,bottom]` uses original image pixels. Optional `highlights:[{"rect":[0.1,0.2,0.8,0.4],"at":1.2}]` uses normalized coordinates within the displayed crop. The renderer contains images without stretching. It verifies hashes, not source truth or rights.

Speech offsets are scene-local seconds. Keep subtitles short enough for two lines; split longer utterances into timed chunks without changing spoken content. The audio adapter provides actual measured timing. Scene duration is rounded up to frames. The soundtrack must include the same frame-aligned holds; verify no cumulative drift.

Output also includes each midpoint preview and `render-receipt.json`. These do not replace all-frame/transition inspection or audio decode and listening checks. Supplied master is padded only at its end if short; absence of audio is allowed for an explicitly labelled renderer smoke test, never a complete video.

## Synthetic renderer fixture
`assets/demo/` contains a nonpersonal placeholder mascot and evidence card, not a final host design or a real website. Generate audio from `audio-input.json` using the audio workflow; replace the demo scene timing/speech with the resulting measured timeline if runtime/model output differs. Copy the generated master to `master.wav` beside the manifest. Then render and run `scripts/verify_video.py` (see `--help`). For a silent layout-only smoke test, copy the fixture and remove its `audio` property. Never deliver a silent fixture as a completed video.
