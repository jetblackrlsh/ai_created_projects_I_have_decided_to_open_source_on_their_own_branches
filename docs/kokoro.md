# Preferred offline speech: Kokoro

This studio supports **Kokoro ONNX** through an optional local Python CLI. It does not execute Python in the browser, bundle model weights, clone voices, call a hosted TTS API, require API keys, or download anything when START.html opens. The six bundled meSpeak/eSpeak synthesized voices are still available immediately and without setup.

## Compatibility and privacy

- New **blank** projects have `voicePreferences` set to `{provider:"kokoro",voice:"af_heart",speed:1,lang:"en-us"}`.
- Existing projects without this field retain the bundled provider and their unchanged audio. Loading a project never regenerates audio.
- Picking a provider only changes the next-clip controls. **Save provider preference** explicitly persists it. Existing cast locks and recordings are not replaced.
- Each speaker can be locked to one configuration. Legacy `voiceCast` strings continue working; Kokoro cast entries are objects. A conflicting lock is refused. To deliberately recast, edit `voiceCast` in a separate project copy and regenerate/review all that speaker's cues.
- No private story or voice data needs to leave your machine. Installing Python dependencies and explicitly downloading model files require internet access; speech generation uses installed local models.

## Explicit setup

Use a terminal in the studio folder. Python 3 and the optional Kokoro dependencies are not bundled. First inspect the adapter without installing anything:

```sh
python3 tools/kokoro-tts.py status
python3 tools/kokoro-tts.py --help
```

Follow the adapter's setup help. Downloading model weights is an **explicit** operation, never an automatic editor fallback:

```sh
python3 tools/kokoro-tts.py setup --download-models
```

If setup is unavailable, keep using the bundled voices or import existing authorized recordings. Check model and dependency licensing before redistributing them. This release does not include model weights.

## Editor workflow

1. Select **Kokoro**, enter a supported voice ID (for example `af_heart`), speed, language (`en-us`), speaker ID and the exact spoken text. You can copy current scene captions first.
2. Click **Download Kokoro request JSON**.
3. Generate a real WAV locally:

   ```sh
   python3 tools/kokoro-tts.py synthesize --request Kokoro-request.json --output clip.wav
   ```

4. Import `clip.wav` and its `clip.wav.json` sidecar together using the speech import picker. Alternatively, select the adapter's embedded `jet-kokoro-clip` JSON on its own. The editor checks WAV structure/measured duration and matching sidecar voice/text/settings. If a SHA-256 is supplied, it must match the exact WAV bytes. A WAV without sidecar remains supported but is explicitly **user-labelled**: the editor cannot prove its originating synthesizer or wording.
5. Audition. **Replace current scene narration** replaces narration cues starting in this scene; it refuses narration crossing into the scene and refuses an overlong clip. **Add speaker clip at playhead** preserves existing cues and adds a speaker-labelled clip plus a caption. Review overlapping speech manually.
6. Save the project JSON. Actual WAV bytes, voice configuration and provenance are embedded and portable. Playback, recording and the existing FFmpeg exporter use the same ordinary narration audio path; they do not need Kokoro installed after generation.

Changing the text/provider/voice after import invalidates applying that clip until it is regenerated or reimported. Imports do not rewrite captions unless you explicitly add the speaker clip. Neither path claims lip sync.

## Headless project workflow

Create a manifest with global start times and one clip per scene-contained spoken line. This **adds** audio; it never silently deletes or retimes existing cues. Choose a new output filename.

```json
{"clips":[{"wav":"clip.wav","metadata":"clip.wav.json","speakerId":"hero","text":"A line of dialogue.","start":0,"voice":"af_heart","speed":1,"lang":"en-us"}]}
```

```sh
node scripts/kokoro-project.cjs import input.jet2d.json manifest.json NEW-output.jet2d.json
```

To synthesize each manifest line then embed it, omit `wav`/`metadata` and run:

```sh
node scripts/kokoro-project.cjs synthesize input.jet2d.json manifest.json NEW-output.jet2d.json
```

This invokes the installed local adapter, uses temporary files, imports measured WAV clips, refuses invalid cast/timing, and writes a new output only after the complete manifest passes. It does not install dependencies or download models. The optional `PYTHON` environment variable selects an already-installed Python executable.

## Verification scope

`node scripts/verify-kokoro.cjs` checks schema/defaults, unchanged legacy validation, WAV parsing, sidecar mismatch rejection, per-speaker locks, clip timing and portable JSON. `node scripts/verify-kokoro-ui.cjs` is a jsdom/native-canvas integration harness requiring the same development dependencies as other UI tests; it exercises the real handlers, actual file-import bytes and bundled synthesis. Their fixture is a synthetic tone or bundled synthesized voice, **not proof of Kokoro model generation or naturalness**.

`node scripts/verify-kokoro-browser.cjs` is an optional real, sandbox-enabled Chromium integration check requiring Playwright and installed Chromium. The current cloud process sandbox prevented Chromium startup, so no real-browser certification or listening review is claimed for this build. No personal computer was used.
