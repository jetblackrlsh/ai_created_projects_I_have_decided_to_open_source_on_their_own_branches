# Moth-restlessness demo: down, then up—without rewinding time

Original fictional test, executed through the real CLI in a fresh temporary store.

1. The Lantern Conservatory begins with moth restlessness **7/10**.
2. The courier delivers calming flowers. A targeted resolution transfers the flowers to Lio, advances a cumulative delivery clock0→1, advances time0→1 minute, and lowers restlessness **7→2**.
3. The courier tests a brass bell. Another targeted resolution advances time1→2 and raises restlessness **2→9**.

The public meter is visible in `observe`; a private keeper-worry meter is absent. Repeating the identical first resolution leaves stored bytes unchanged. The world still uses full snapshots internally; the improvement is smaller requests, not smaller snapshot storage.

The first patch request was **462 bytes**, versus **1,261 bytes** for the equivalent complete-state resolve (compact UTF-8 JSON). That is about63% less request data for this small example. The regression test also checks a large synthetic ledger case without pretending storage growth is fixed.

## Reproduce the first delivery

From the headless tool directory, choose a fresh real store directory:

```sh
python worldsim.py --store /tmp/moth-demo < examples/meters-patches/create.json
python worldsim.py --store /tmp/moth-demo < examples/meters-patches/action.json
python worldsim.py --store /tmp/moth-demo < examples/meters-patches/resolve_patch.json
printf '%s\n' '{"op":"observe"}' | python worldsim.py --store /tmp/moth-demo
```

The example files contain original fiction, not real commands for characters to execute. `proof.json` records measured outcomes; `narrative.md` is a deterministic chronological report quoting the test agent's narration. Clock progress remains monotonic; the new meter is what rises and falls.
