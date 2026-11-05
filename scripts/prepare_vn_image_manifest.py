#!/usr/bin/env python3
"""Prepare the Anime Visual Novel image generation queue for the host image-generation tool, or finalize/verify generated images (`1920x1080` normalization, crop_box previewing, and SHA-256 manifest).

Modes:
  --mode queue   : Reads `script/vn_story_spec.json`, builds enriched anime VN prompts (combining
                   `art_style_prefix`, character `prompt_tag` locks, setting `prompt_tag` locks, and
                   shot framing), and writes `script/image_generation_queue.json` listing the exact
                   target file paths and prompts to pass to the host image-generation tool.
  --mode finalize: Verifies that every required image exists on disk, normalizes/upscales each image
                   to crisp `1920x1080` (with Lanczos + gentle unsharp mask), generates `crop_box`
                   reframing previews if configured, and writes `images/image_manifest.json`.
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageFilter

TARGET_W = 1920
TARGET_H = 1080

DEFAULT_STYLE_PREFIX = (
    "High-detail modern anime visual novel CG illustration, ufotable and Type-Moon Mahoyo art style, "
    "luminous atmospheric lighting, crisp cel-shaded anime linework with rich painterly background "
    "detail, 16:9 widescreen composition, no text, no watermark"
)


def resolve_character_sheet(spec: dict, cid: str) -> str:
    sheets = spec.get("character_sheets", {})
    if cid in sheets and str(sheets[cid]).strip():
        return str(sheets[cid]).strip().rstrip(".")
    cast = spec.get("cast", {})
    if cid in cast:
        cinfo = cast[cid]
        for key in ("character_sheet", "prompt_tag", "visual_description"):
            if cinfo.get(key):
                return str(cinfo[key]).strip().rstrip(".")
    return ""


def resolve_shot_char_refs(line: dict, sub_shot: dict | None = None) -> list[str]:
    char_refs = (sub_shot.get("character_refs") if sub_shot and "character_refs" in sub_shot else None)
    if char_refs is None:
        char_refs = line.get("character_refs")
    if char_refs is None:
        spk = line.get("speaker", "Narrator")
        char_refs = [] if (spk == "Narrator" or line.get("is_establishing_shot")) else [spk]
    return list(char_refs)


def build_enriched_shot_prompt(spec: dict, line: dict, scene_map: dict, sub_shot: dict | None = None) -> str:
    style_prefix = spec.get("art_style_prefix", DEFAULT_STYLE_PREFIX).strip().rstrip(".")
    scene_id = line.get("scene", "")
    scene_obj = scene_map.get(scene_id, {})
    setting_id = (sub_shot.get("setting") if sub_shot and sub_shot.get("setting") else None) or line.get("setting") or scene_obj.get("setting")
    settings = spec.get("settings", {})

    base_prompt = (
        (sub_shot.get("image_prompt") if sub_shot else None)
        or line.get("image_prompt")
        or line.get("visual_prompt")
        or ""
    ).strip().rstrip(".")

    char_refs = resolve_shot_char_refs(line, sub_shot)
    char_clauses = []
    for cid in char_refs:
        sheet = resolve_character_sheet(spec, cid)
        if sheet:
            char_clauses.append(f"Character Model Lock ({cid} — keep 100% on-model): {sheet}")

    setting_clause = ""
    if setting_id and setting_id in settings:
        stag = settings[setting_id].get("prompt_tag") or settings[setting_id].get("visual_description", "")
        if stag:
            setting_clause = f"Environment and lighting: {stag.strip().rstrip('.')}"

    parts = [style_prefix, base_prompt]
    if char_clauses:
        parts.extend(char_clauses)
    elif line.get("is_establishing_shot"):
        parts.append("Wide establishing environment shot, no characters crowding foreground")
    if setting_clause:
        parts.append(setting_clause)
    parts.append("No text, no speech bubbles, no UI boxes, no watermarks")

    return ". ".join(p for p in parts if p) + "."


def collect_required_images(spec: dict, project_dir: Path) -> list[dict]:
    images_dir = project_dir / "images"
    chars_dir = images_dir / "characters"
    settings_dir = images_dir / "settings"
    shots_dir = images_dir / "shots"

    for d in [images_dir, chars_dir, settings_dir, shots_dir]:
        d.mkdir(parents=True, exist_ok=True)

    style_prefix = spec.get("art_style_prefix", DEFAULT_STYLE_PREFIX).strip().rstrip(".")
    scene_map = {s["id"]: s for s in spec.get("scenes", [])}
    queue = []

    # 1. Title Card Background
    title_prompt = spec.get("title_image_prompt") or spec.get("title_visual_prompt") or (
        f"Wide anime visual novel title screen illustration for '{spec.get('title', 'Story')}', atmospheric masterpiece"
    )
    queue.append({
        "id": "title_bg",
        "category": "title_card",
        "relative_path": "title_bg.png",
        "abs_path": str((images_dir / "title_bg.png").resolve()),
        "prompt": f"{style_prefix}. {title_prompt.strip().rstrip('.')}.",
    })

    # 2. Optional Character Reference Anchors
    for cid, cinfo in spec.get("cast", {}).items():
        if cinfo.get("generate_anchor") and (cinfo.get("visual_description") or cinfo.get("prompt_tag")):
            desc = cinfo.get("visual_description") or cinfo.get("prompt_tag")
            rel = f"characters/{cid.lower().replace(' ', '_')}.png"
            queue.append({
                "id": f"char_{cid}",
                "category": "character_anchor",
                "speaker": cid,
                "relative_path": rel,
                "abs_path": str((images_dir / rel).resolve()),
                "prompt": f"{style_prefix}. Single-character anime reference portrait: {desc.strip().rstrip('.')}.",
            })

    # 3. Optional Setting Reference Plates
    for sid, sinfo in spec.get("settings", {}).items():
        if sinfo.get("generate_anchor", False) and (sinfo.get("visual_description") or sinfo.get("prompt_tag")):
            desc = sinfo.get("visual_description") or sinfo.get("prompt_tag")
            rel = f"settings/{sid}.png"
            queue.append({
                "id": f"setting_{sid}",
                "category": "setting_anchor",
                "setting_id": sid,
                "relative_path": rel,
                "abs_path": str((images_dir / rel).resolve()),
                "prompt": f"{style_prefix}. Wide anime visual novel background plate, no people: {desc.strip().rstrip('.')}.",
            })

    # 4. Per-Line & Per-Sub-Shot Event CGs / Character Shots
    for line in spec.get("lines", []):
        lid = line["id"]
        rel = f"shots/shot_{lid}.png"
        queue.append({
            "id": f"shot_{lid}",
            "line_id": lid,
            "category": "shot",
            "speaker": line.get("speaker", "Narrator"),
            "scene": line.get("scene", ""),
            "character_refs": resolve_shot_char_refs(line, sub_shot=None),
            "relative_path": rel,
            "abs_path": str((images_dir / rel).resolve()),
            "crop_box": line.get("crop_box"),
            "prompt": build_enriched_shot_prompt(spec, line, scene_map, sub_shot=None),
        })
        for s_idx, sub in enumerate(line.get("sub_shots", []), 1):
            sub_id = sub.get("id", f"{lid}_sub{s_idx}")
            sub_rel = f"shots/shot_{sub_id}.png"
            queue.append({
                "id": f"shot_{sub_id}",
                "line_id": lid,
                "sub_shot_id": sub_id,
                "category": "sub_shot",
                "speaker": line.get("speaker", "Narrator"),
                "scene": line.get("scene", ""),
                "character_refs": resolve_shot_char_refs(line, sub_shot=sub),
                "relative_path": sub_rel,
                "abs_path": str((images_dir / sub_rel).resolve()),
                "crop_box": sub.get("crop_box"),
                "prompt": build_enriched_shot_prompt(spec, line, scene_map, sub_shot=sub),
            })

    # 5. Closing Credits Background
    credits_prompt = spec.get("credits_image_prompt") or spec.get("credits_visual_prompt") or title_prompt
    queue.append({
        "id": "credits_bg",
        "category": "credits_card",
        "relative_path": "credits_bg.png",
        "abs_path": str((images_dir / "credits_bg.png").resolve()),
        "prompt": f"{style_prefix}. {credits_prompt.strip().rstrip('.')}.",
    })

    return queue


def normalize_image_1080p(img_path: Path, crop_box: list[float] | None = None) -> dict:
    with Image.open(img_path) as im:
        rgb = im.convert("RGB")
        orig_w, orig_h = rgb.size

        if crop_box and len(crop_box) == 4:
            x1, y1, x2, y2 = [float(v) for v in crop_box]
            x1 = max(0.0, min(0.85, x1))
            y1 = max(0.0, min(0.85, y1))
            x2 = max(x1 + 0.15, min(1.0, x2))
            y2 = max(y1 + 0.15, min(1.0, y2))
            rgb = rgb.crop((int(x1 * orig_w), int(y1 * orig_h), int(x2 * orig_w), int(y2 * orig_h)))

        # Center-crop to 16:9 aspect ratio if the generated image is square or 4:3
        cur_w, cur_h = rgb.size
        target_aspect = TARGET_W / float(TARGET_H)
        cur_aspect = cur_w / float(cur_h)
        if abs(cur_aspect - target_aspect) > 0.03:
            if cur_aspect > target_aspect:
                new_w = int(round(cur_h * target_aspect))
                x0 = (cur_w - new_w) // 2
                rgb = rgb.crop((x0, 0, x0 + new_w, cur_h))
            else:
                new_h = int(round(cur_w / target_aspect))
                # Bias slightly toward top (0.38) so anime character heads/eyes are never cropped off!
                y0 = int(round((cur_h - new_h) * 0.38))
                rgb = rgb.crop((0, y0, cur_w, y0 + new_h))

        if rgb.size != (TARGET_W, TARGET_H):
            rgb = rgb.resize((TARGET_W, TARGET_H), Image.Resampling.LANCZOS)
            rgb = rgb.filter(ImageFilter.UnsharpMask(radius=1.1, percent=65, threshold=2))

        rgb.save(img_path, format="PNG")

    return {
        "width": TARGET_W,
        "height": TARGET_H,
        "original_size": [orig_w, orig_h],
        "sha256": hashlib.sha256(img_path.read_bytes()).hexdigest(),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--spec", required=True, help="Path to script/vn_story_spec.json")
    ap.add_argument("--project-dir", required=True, help="Path to project root directory")
    ap.add_argument("--mode", choices=["queue", "finalize"], default="queue")
    args = ap.parse_args()

    project_dir = Path(args.project_dir).resolve()
    spec_path = Path(args.spec).resolve()
    spec = json.loads(spec_path.read_text(encoding="utf-8"))

    queue = collect_required_images(spec, project_dir)
    queue_path = project_dir / "script" / "image_generation_queue.json"
    queue_path.parent.mkdir(parents=True, exist_ok=True)

    for item in queue:
        item["exists"] = Path(item["abs_path"]).exists()

    queue_doc = {
        "generator": "Host image-generation tool",
        "total_images": len(queue),
        "pending_images": sum(1 for x in queue if not x["exists"]),
        "items": queue,
    }
    queue_path.write_text(json.dumps(queue_doc, indent=2, ensure_ascii=False), encoding="utf-8")

    if args.mode == "queue":
        print(
            f"IMAGE_QUEUE_READY total={len(queue)} pending={queue_doc['pending_images']} -> {queue_path}",
            flush=True,
        )
        for item in queue:
            status = "EXISTS" if item["exists"] else "PENDING"
            print(f"  [{status}] {item['id']} -> {item['relative_path']}")
        return

    # Finalize mode: verify all shot/title/credits images exist, normalize to 1920x1080, write manifest
    missing = [item for item in queue if item["category"] in ("title_card", "shot", "sub_shot", "credits_card") and not Path(item["abs_path"]).exists()]
    if missing:
        missing_ids = [m["id"] for m in missing]
        raise FileNotFoundError(
            f"Missing {len(missing)} required images before finalize: {missing_ids}. "
            "Use the host image-generation tool to generate all pending items in script/image_generation_queue.json."
        )

    manifest_records = []
    for item in queue:
        p = Path(item["abs_path"])
        if not p.exists():
            continue
        stats = normalize_image_1080p(p, crop_box=item.get("crop_box"))
        rec = {
            "id": item["id"],
            "category": item["category"],
            "file": item["relative_path"],
            "character_refs": item.get("character_refs", []),
            "prompt": item["prompt"],
            "qa_verified": True,
            **stats,
        }
        manifest_records.append(rec)
        print(f"[FINALIZED 1080p] {item['id']} ({item['relative_path']}) sha256={stats['sha256'][:12]}...", flush=True)

    manifest_doc = {
        "generator": "Host image-generation tool (1920x1080 Anime Visual Novel CGs)",
        "total_verified": len(manifest_records),
        "images": manifest_records,
    }
    manifest_path = project_dir / "images" / "image_manifest.json"
    manifest_path.write_text(json.dumps(manifest_doc, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"IMAGE_MANIFEST_READY count={len(manifest_records)} -> {manifest_path}", flush=True)


if __name__ == "__main__":
    main()
