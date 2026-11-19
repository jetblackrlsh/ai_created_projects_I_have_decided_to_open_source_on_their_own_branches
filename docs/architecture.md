# How weight-space programming works in Fableglass

Fableglass is an experiment in assigning specific computations to a Transformer’s parameters. Its compiler consumes source code and an authored catalog. It writes every tensor numerically. The project uses no optimizer, model training loop, training corpus, or pretrained model inputs. The checkpoint and the surrounding application together produce the role-play experience.

## What happens on a turn

1. The browser sends a free-text premise or move and the latest story state to the local Node server. The application classifies the request and extracts known facts, objects, names, and constraints.
2. The server maps the relevant features to internal token IDs and calls standard llama.cpp. Features can express that a question expects a number, an object is already carried, or a move is risky and prepared.
3. The checkpoint generates an event token, a prose token, a dialogue token, and end-of-sequence. Event tokens include checks, scene transitions, pursuit steps, and encounter outcomes. A token can designate an authored option that the app renders with the current scene’s names and details.
4. The app applies the selected event to its world state and fills the returned fragment’s slots. It returns the resulting text and state to the browser. The browser saves the transcript and recent snapshots for undo.

The model sees control tokens and a limited recent-fragment history. Arbitrary text, persistent story memory, numerical lookup, and factual grounding are application responsibilities. Neither a person’s name typed in a story nor a newly established game fact is written into the checkpoint.

## How the compiler implements a rule

- **Coordinates.** `circuits.py` allocates residual-stream directions for features and phase signals. An embedding can activate one direction to mark an input as present, or another direction to move generation to its next stage.
- **Feature collection.** The first attention block uses zero query and key projections to attend uniformly to visible tokens. Its value and output projections copy useful features into distinct pooled directions. Thresholds turn those averages into feature-presence signals.
- **Eligibility.** Pairs of offset SwiGLU units approximate a threshold with a bounded output. Their weighted difference lets a feed-forward block implement combinations of required and excluded features. `narrator.py` describes those conditions and the allowed output fragments.
- **Emission.** `compile_story.py` assigns projection weights to boost eligible event tokens. The emitted event changes the active phase so the model can choose its prose and dialogue fragments and then stop. Recent fragment features discourage some repeated wording when alternatives exist.
- **Quantization.** The compiler writes a GGUF with F16 matrices and normalization tensors. Stock `llama-quantize` converts the model to Q8_0. Quantization changes numerical precision, so the supported artifact is tested in the runtime after conversion.

This uses ideas related to RASP and Tracr, which formalize operations that map to Transformer computations. Fableglass builds its own circuits for a stock Llama-format runtime. [Thinking Like Transformers, ICML 2021](https://proceedings.mlr.press/v139/weiss21a.html) · [Tracr, NeurIPS 2023](https://proceedings.neurips.cc/paper_files/paper/2023/hash/771155abaae744e08576f1f3b4b7ac0d-Abstract-Conference.html)

## Where to look in the source

| Component | Responsibility |
| --- | --- |
| `Fableglass/checks.mjs` | Question types, references, named destinations, and results for generic action checks |
| `Fableglass/story.mjs` | Story state, intent features, scene transitions, and response rendering |
| `Fableglass/pursuit.mjs`, `Fableglass/arena.mjs` | State and consequences for specific kinds of play |
| `Fableglass/narrator.py` | Authored event conditions, priorities, and fragments |
| `Fableglass/circuits.py`, `Fableglass/compile_story.py` | Transformer tensor construction and matching protocol generation |
| `Fableglass/server.mjs`, `Fableglass/web/` | Local inference orchestration and browser interface |

The checkpoint’s coefficient count describes the dense tensor shapes. It does not measure how much language knowledge the model has or how much work its authored rules can do.
