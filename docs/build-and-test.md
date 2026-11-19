# Build and verify Fableglass

## Reference artifacts

| Item | Version or digest |
| --- | --- |
| Runtime | [llama.cpp b12128 Windows x64 CPU release](https://github.com/ggml-org/llama.cpp/releases/tag/b12128) |
| Runtime ZIP SHA-256 | `2864bc950fe1681f1867ebc1bf0d6a66d18cc5561b29c285b4504787145bd7b7` |
| Reference Q8_0 SHA-256 | `4bb325f66e53e79790b70a5495a611cce5da3c67b581fcd261f732d3527632f0` |
| Compiler dependencies | `requirements.txt` |

Run the setup at the repository root to generate the reference model. The setup compares the rebuilt GGUF and token manifest to the published reference. The generated checkpoint, extracted runtime, caches, and engine logs stay out of the Git tree.

## Compile an experiment

Use a separate directory when changing authoring rules. From the repository root after setup:

```powershell
New-Item -ItemType Directory -Path experiment -Force | Out-Null
.\.venv\Scripts\python.exe .\Fableglass\compile_story.py --model .\experiment\fableglass-f16.gguf --protocol .\experiment\protocol.json
.\Fableglass\runtime\llama-quantize.exe .\experiment\fableglass-f16.gguf .\experiment\fableglass-q8.gguf Q8_0 8
.\.venv\Scripts\python.exe .\tools\wsp.py inspect .\experiment\fableglass-q8.gguf
```

The compiler generates the model and token manifest together. Keep that pair together because changes to the catalog or feature set can move token IDs. To run the experiment on a separate local port:

```powershell
$env:FABLEGLASS_PORT = '26739'
$env:FABLEGLASS_PROTOCOL = (Resolve-Path .\experiment\protocol.json).Path
$env:FABLEGLASS_MODEL = (Resolve-Path .\experiment\fableglass-q8.gguf).Path
node .\Fableglass\server.mjs --no-open
```

Use a separate terminal or clear these three variables before starting the normal installation again. Keep early experiments narrow. Define what should change, a near case that should behave differently, and what prior behaviors should still pass. Test the quantized artifact in the target runtime before using it.

## Two kinds of tests

**Native inference** tests the checkpoint independently of the app. Start llama.cpp directly in one terminal:

```powershell
.\Fableglass\runtime\llama-server.exe -m .\Fableglass\fableglass-q8.gguf --host 127.0.0.1 --port 26740 -ngl 0 -c 256 -t 8 -np 1 --no-webui
```

Once `http://127.0.0.1:26740/health` is ready, run the reference-token probes from another terminal:

```powershell
.\.venv\Scripts\python.exe .\tools\wsp.py run .\tests\native-checks.json --base http://127.0.0.1:26740 --repeats 2
```

The probes exercise yes, no, unknown evidence, known numbers and names, and graded actions. They also check that each completion terminates. The fixture uses reference-manifest token IDs.

**Application tests** check the text adapter, steady state, emitted result, and rendered reply together. Start the application headlessly as described in the [README](../README.md). The suites send only synthetic stories and use a fresh state for each case. They leave existing saves alone.

```powershell
.\.venv\Scripts\python.exe .\tools\wsp.py run .\tests\game-master.json --base http://127.0.0.1:26735 --repeats 3 --runtime 'llama.cpp b12128 CPU Q8_0 8 threads' --artifact .\Fableglass\fableglass-q8.gguf --output benchmark.json
.\.venv\Scripts\python.exe .\tools\wsp.py run .\tests\direct-questions.json --base http://127.0.0.1:26735
```

The harness reports grouped checks and request latencies. Compare identical benchmark settings with `wsp.py compare baseline.json benchmark.json`. Keep the same hardware, runtime, quantization, and thread settings when comparing speed. Read samples too. Passing state checks does not establish that narrative prose is natural over a long session.

The branch was verified from a clean Windows x64 checkout using Python 3.13, Node.js 22, and a Ryzen 7 7435HS. Setup rebuilt the reference checksum. The tested Q8_0 model passed 16 native probes, 33 direct-question turns, and 135 cross-genre turns. In the cross-genre run, median request latency was 79 ms, with a 103 ms p95 after warm-up at eight CPU threads.
