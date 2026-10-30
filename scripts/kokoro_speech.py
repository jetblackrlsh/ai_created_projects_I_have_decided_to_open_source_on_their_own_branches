#!/usr/bin/env python3
"""Render a film's line list with Kokoro TTS and report measured durations.

The voice timeline is canonical in this workflow: render lines FIRST,
measure them, and score visuals, music and effects against the measured
times. This script reads a lines JSON:

    [{"id": "n1", "voice": "af_heart", "speed": 1.0, "text": "..."},
     {"id": "f1", "voice": "am_michael", "speed": 1.0, "text": "..."}]

and writes <id>.wav per line plus durations.json {id: seconds}.

Cast deliberately: one voice per character, a distinct narrator, small
speed changes for character (0.95 reads solemn). The narrator introduces
each speaker storybook-style in the narration text itself; characters then
speak their own lines — never have the narrator read dialogue.

Usage:
    python3 kokoro_speech.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin \
        --lines lines.json --out ./audio
"""
import argparse
import json
import os

import soundfile as sf
from kokoro_onnx import Kokoro


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True, help="kokoro-v1.0.onnx path")
    ap.add_argument("--voices", required=True, help="voices-v1.0.bin path")
    ap.add_argument("--lines", required=True, help="lines JSON file")
    ap.add_argument("--out", required=True, help="output directory")
    ap.add_argument("--lang", default="en-us")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    with open(args.lines) as f:
        lines = json.load(f)

    k = Kokoro(args.model, args.voices)
    durations = {}
    total = 0.0
    for line in lines:
        samples, sr = k.create(line["text"], voice=line["voice"],
                               speed=line.get("speed", 1.0), lang=args.lang)
        path = os.path.join(args.out, line["id"] + ".wav")
        sf.write(path, samples, sr)
        dur = len(samples) / sr
        durations[line["id"]] = round(dur, 3)
        total += dur
        print(f"{line['id']} {line['voice']} {dur:.2f}s  {line['text'][:52]}...")
    with open(os.path.join(args.out, "durations.json"), "w") as f:
        json.dump(durations, f, indent=2)
    print(f"TOTAL SPEECH {total:.1f}s across {len(lines)} lines")


if __name__ == "__main__":
    main()
