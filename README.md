# Fableglass

Fableglass is a local, text-based game master emulator for single-player role-play. Describe your character and situation in your own words, then ask questions or take actions. It can name a person or destination, give a count, remember what you found, and resolve actions as successes, partial successes, or setbacks.

The project includes a small compiler that writes the weights for a Llama-format Transformer from authored rules. There is no training run or pretrained checkpoint in the build. The app runs on the CPU using stock llama.cpp and keeps stories in your browser profile.

## What makes it different

- **Story logic compiled into weights.** The model uses attention, feed-forward gates, and an output projection to select events and fragments. You can edit a rule, rebuild the checkpoint, and test the effect on its emitted token IDs. The checkpoint runs directly in llama.cpp.
- **Structured story state.** The JavaScript app tracks locations, inventory, objectives, established facts, and prior action outcomes. It supplies these as features for the next turn. The game can remember a shelter it just named and use it when you say “I take them there.”
- **Short responses focused on play.** Who, what, where, and quantity questions lead with the relevant answer. Yes/no questions can give a short qualification when the fiction does not establish the fact. Attempted actions show what happened and whether the attempt worked. Questions leave scene pressure alone. Deliberate waits can let it rise.
- **Readable, reproducible implementation.** The source generates a reference Q8_0 checkpoint with **500,412,160 coefficient positions** across 25 layers. In the compiler’s prequantization output, 154,545 positions are nonzero. Most of the nominal parameter count comes from structural zeros in dense tensors. The Q8_0 file is 531,920,640 bytes, about 507 MiB.

See [How weight-space programming works in Fableglass](docs/architecture.md) for the compiler, native inference, and app boundary.

## Install and run

The provided setup targets **Windows x64**. Use Git, Python 3.13, and Node.js 22 or newer on your PATH. The launcher opens Microsoft Edge when available, with the default browser as a fallback. Allow about 3 GB of free disk space during setup for the Python environment, runtime, and intermediate checkpoints.

From PowerShell, run:

```powershell
git clone --single-branch --branch project/fableglass https://github.com/jetblackrlsh/ai_created_projects_I_have_decided_to_open_source_on_their_own_branches.git Fableglass-Project
Set-Location Fableglass-Project
& '.\Setup Fableglass.ps1'
```

Setup downloads the pinned [llama.cpp b12128 Windows x64 CPU release](https://github.com/ggml-org/llama.cpp/releases/tag/b12128), verifies its checksum, installs the pinned compiler dependencies into a local Python environment, and builds the checkpoint. It verifies the weight hash and token manifest. To use an already downloaded copy of the same upstream runtime archive, pass its path as `-RuntimeArchive`.

Double-click **Play Fableglass.cmd** when setup finishes. To open it from Start, create a Windows shortcut to the launcher and place it in the folder opened by **Win+R**, then **shell:programs**. Name the shortcut **Fableglass**. Leave the launcher in the checkout so it can find the project folder.

The app listens on `127.0.0.1:26735`. Once setup finishes, inference requires no internet connection or API account. **Stop model** releases the local server. If startup fails, inspect `Fableglass/engine.log` or run the headless command below to see the error.

## Play and keep a story coherent

Choose **New story** and describe the situation in a few lines. Give the game a place, a character, and something concrete to do. You can state important abilities, relationships, supplies, and facts in the opening. For example:

> At a hillside observatory with Inez, I carry a lantern and a coil of rope. The stairwell is blocked. A survey team is waiting on the upper gallery, and we need another way to reach it.

Good follow-up turns include:

- **Check the situation.** “How many people are on the gallery?” or “Is the side entrance blocked?”
- **Find someone or somewhere.** “Who has the maintenance keys?” or “Where can I take the team to safety?”
- **Try one concrete action.** “I examine the rope.” Then try an action that uses what you learned. A partial success can give you something to build on.
- **Use a remembered reference.** If the narrator names a refuge, “I lead them there” can use the last location answer. Name the destination explicitly if you have since discussed several places.

**Story notes** shows retained facts and carried items. **Undo turn** restores a recent state, so you can try a different approach after a setback. **Replay story** reruns your recorded moves in a separate copy with the current version. **Rename** can distinguish branches of play. **Delete story** removes the selected story from the current browser profile after confirmation.

Use the same browser profile and local address to reopen your saved stories. Browser data cleanup can erase saves. Only edit the story through the app if you want its state and transcript to stay in sync.

## What it is useful for

Fableglass works as a quick solo play aid, a prompt for improvising what happens next, or a test environment for game-master rules. The direct check format suits sessions where you want a usable next move, such as a destination, a clue, or the outcome of a risky attempt. The project also offers a concrete way to study what a programmed Transformer contributes to a larger application and to reproduce that contribution without a training setup.

Expect a bounded action vocabulary and a small collection of narrative structures. An indirect or compound move can be misread. New names and quantities can fit the scene without being deeply reasoned out. Long, highly open-ended sessions can still produce repetitive wording or shallow consequences. Parameter count, benchmark passes, and a short demo do not measure general language competence or establish long-session story quality.

## Test and modify

After setup, use one terminal to start the model without opening the app:

```powershell
node .\Fableglass\server.mjs --no-open
```

After `/api/status` reports readiness, run the synthetic cross-genre suite from another terminal:

```powershell
.\.venv\Scripts\python.exe .\tools\wsp.py run .\tests\game-master.json --base http://127.0.0.1:26735 --repeats 3 --output benchmark.json
```

The suite checks short interactions across investigation, social conflict, physical obstacles, objectives, and encounters. A failure records the response and the violated invariant. The harness also supports checkpoint inspection, local native token probes, and comparisons using the same suite and settings. See [build and verification details](docs/build-and-test.md) for native probes, the exact build process, and how to change rules.

## License

Fableglass’s original material follows this repository’s [CC0 1.0 Universal dedication](LICENSE). Setup fetches third-party tooling from its upstream distribution. See [third-party notices](THIRD_PARTY_NOTICES.md).
