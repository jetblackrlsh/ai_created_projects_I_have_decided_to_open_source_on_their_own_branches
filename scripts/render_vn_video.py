#!/usr/bin/env python3
"""Render a 1920x1080 24fps H.264/AAC Non-Interactive Anime Visual Novel (Kinetic Novel) Video
(`vn_story_video.mp4`), Interactive Web Theater (`index.html`), Keyframes (`keyframes/`), and
YouTube Metadata (`youtube_metadata.md`).

Features:
1. Authentic Kinetic Visual Novel Presentation Modes (`ADV`, `NVL`, and `CG`):
   - `ADV` (Adventure Dialogue Window): Sleek dark glassmorphic lower-third VN box, glowing character
     nameplate pill in the speaker's signature color, live 24fps voice-envelope waveform indicator,
     animated continuation chevron (`▼`), and top-right VN status HUD (`AUTO ▶ • LOG`).
   - `NVL` (Novel Literary Overlay): Semi-transparent storybook slate with classic serif typography
     and ornamental gold hairlines (*Witch on the Holy Night* / *Mahoyo* hybrid style).
   - `CG` (Event CG Showcase): Streamlined lower-third subtitle pill for full-screen action/reveal shots.
2. Subpixel 24fps Virtual Camera Choreography (`zoom_in`, `zoom_out`, `pan_right`, `pan_left`,
   `pan_up`, `pan_down`, `zoom_in_left`, `zoom_in_right`, `dutch_tilt`, `static`) + `sub_shots` cuts
   within a spoken line + optional Depth-of-Field border bokeh (`dof_blur`).
3. 20 Procedural 24fps Anime Visual Effects (`vfx`) & Disciplined Camera Shake:
   `sakura_petals`, `rain_streaks`, `speed_lines`, `impact_flash`, `single_shake`, `struggle_shake`,
   `shatter_flash`, `barrage_shake`, `earthquake_shake`, `fire`, `blue_hellfire`, `solar_light`,
   `crimson_magic`, `teal_magic`, `nature_vines`, `kinetic_rings`, `lucid_light`, `cosmic_stars`,
   `bubbles`, `alarm_pulses`.
4. Sample-Accurate Per-Page Subtitle Rendering (`caption_pages`) & Full-Line Visual Hold (`l["end"] + 0.22s`).
"""
import argparse
import html as html_escape
import os
import json
import math
import subprocess
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

WIDTH = 1920
HEIGHT = 1080
FPS = 24

SPEAKER_COLORS = [
    (242, 198, 114),  # Warm gold (Narrator)
    (118, 215, 242),  # Cyan sky
    (255, 138, 120),  # Coral ember
    (168, 232, 148),  # Mint leaf
    (212, 162, 252),  # Astral lavender
    (255, 214, 132),  # Amber sun
]


def load_font(size: int, bold: bool = False, serif: bool = True) -> ImageFont.FreeTypeFont:
    if serif:
        candidates = (
            ["C:/Windows/Fonts/georgiab.ttf", "C:/Windows/Fonts/palab.ttf", "C:/Windows/Fonts/timesbd.ttf"]
            if bold else
            ["C:/Windows/Fonts/georgia.ttf", "C:/Windows/Fonts/pala.ttf", "C:/Windows/Fonts/times.ttf"]
        )
    else:
        candidates = (
            ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/calibrib.ttf"]
            if bold else
            ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/calibri.ttf"]
        )
    family = 'DejaVuSerif' if serif else 'DejaVuSans'
    variant = '-Bold' if bold else ''
    candidates = [os.environ.get('VN_FONT_PATH', ''),
                  f'/usr/share/fonts/truetype/dejavu/{family}{variant}.ttf',
                  f'{family}{variant}.ttf'] + candidates
    for c in candidates:
        if c:
            try:
                return ImageFont.truetype(c, size=size)
            except OSError:
                continue
    return ImageFont.load_default(size=size)


def paginate_text(text: str, max_chars_per_page: int = 112) -> list[str]:
    words = text.strip().split()
    if not words:
        return [""]
    pages = []
    cur = []
    cur_len = 0
    for w in words:
        add = len(w) + (1 if cur else 0)
        if cur and cur_len + add > max_chars_per_page:
            pages.append(" ".join(cur))
            cur = [w]
            cur_len = len(w)
        else:
            cur.append(w)
            cur_len += add
    if cur:
        pages.append(" ".join(cur))
    return pages


def wrap_lines_pixel(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width_px: int) -> list[str]:
    words = text.strip().split()
    if not words:
        return []
    lines = []
    cur = words[0]
    for w in words[1:]:
        test = f"{cur} {w}"
        bbox = draw.textbbox((0, 0), test, font=font)
        if (bbox[2] - bbox[0]) <= max_width_px:
            cur = test
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    return lines


def apply_virtual_camera(
    img: Image.Image,
    progress: float,
    motion: str,
    zoom_amount: float = 0.12,
    vfx_list: list[str] | None = None,
    frame_idx: int = 0,
    dof_blur: bool = False,
    shot_local_sec: float = 0.0,
) -> Image.Image:
    p = max(0.0, min(1.0, progress))
    ease = p * p * (3.0 - 2.0 * p)
    z = max(0.04, min(0.26, float(zoom_amount)))
    m = (motion or "zoom_in").lower().strip()

    w, h = WIDTH, HEIGHT
    if m == "static":
        scale = 1.02
        cx, cy = w * 0.5, h * 0.5
    elif m == "zoom_out":
        scale = (1.02 + z) - z * ease
        cx, cy = w * 0.5, h * (0.48 + 0.02 * ease)
    elif m == "pan_right":
        scale = 1.02 + z
        cx = w * (0.45 + 0.10 * ease)
        cy = h * 0.50
    elif m == "pan_left":
        scale = 1.02 + z
        cx = w * (0.55 - 0.10 * ease)
        cy = h * 0.50
    elif m in ("pan_up", "tilt_up"):
        scale = 1.02 + z
        cx = w * 0.50
        cy = h * (0.55 - 0.10 * ease)
    elif m == "pan_down":
        scale = 1.02 + z
        cx = w * 0.50
        cy = h * (0.45 + 0.10 * ease)
    elif m == "zoom_in_left":
        scale = 1.02 + z * ease
        cx = w * (0.50 - 0.06 * ease)
        cy = h * (0.50 - 0.03 * ease)
    elif m == "zoom_in_right":
        scale = 1.02 + z * ease
        cx = w * (0.50 + 0.06 * ease)
        cy = h * (0.50 - 0.03 * ease)
    elif m == "dutch_tilt":
        scale = 1.06 + 0.08 * ease
        cx, cy = w * 0.50, h * 0.48
    else:  # zoom_in
        scale = 1.02 + z * ease
        cx, cy = w * 0.50, h * (0.50 - 0.02 * ease)

    crop_w = w / scale
    crop_h = h / scale
    x0 = max(0.0, min(w - crop_w, cx - crop_w * 0.5))
    y0 = max(0.0, min(h - crop_h, cy - crop_h * 0.5))

    vfx_set = {v.lower().strip() for v in (vfx_list or [])}
    if "barrage_shake" in vfx_set or "earthquake_shake" in vfx_set:
        # Multi-pulse camera shake reserved strictly for barrages of attacks or earthquakes
        sec = frame_idx / float(FPS)
        pulse = max(0.0, math.sin(sec * 2.2 * math.pi)) ** 2
        amp = 6.5 if "earthquake_shake" in vfx_set else 5.0
        dx = amp * pulse * math.sin(frame_idx * 1.9)
        dy = amp * pulse * math.cos(frame_idx * 2.5)
        x0 = max(0.0, min(w - crop_w, x0 + dx))
        y0 = max(0.0, min(h - crop_h, y0 + dy))
    elif "single_shake" in vfx_set or "struggle_shake" in vfx_set or "shatter_flash" in vfx_set or "impact_flash" in vfx_set:
        # Single-strike / explosion camera shake: shakes ONCE for a brief 0.34s damped jolt at impact onset,
        # then stays 100% steady so camera shake is never spammed across the shot!
        if 0.0 <= shot_local_sec <= 0.34:
            decay = math.exp(-shot_local_sec / 0.085)
            amp = 8.5 if ("shatter_flash" in vfx_set or "impact_flash" in vfx_set) else 6.0
            dx = amp * decay * math.sin(shot_local_sec * 52.0)
            dy = amp * decay * math.cos(shot_local_sec * 68.0)
            x0 = max(0.0, min(w - crop_w, x0 + dx))
            y0 = max(0.0, min(h - crop_h, y0 + dy))

    out = img.transform((w, h), Image.Transform.EXTENT, (x0, y0, x0 + crop_w, y0 + crop_h), Image.Resampling.BILINEAR)
    if m == "dutch_tilt":
        angle = 2.4 * math.sin(ease * math.pi * 0.5)
        out = out.rotate(angle, resample=Image.Resampling.BILINEAR, expand=False)

    if dof_blur:
        blurred = out.filter(ImageFilter.GaussianBlur(radius=4.5))
        mask = Image.new("L", (w, h), 0)
        mdraw = ImageDraw.Draw(mask)
        mdraw.ellipse([int(w * 0.16), int(h * 0.06), int(w * 0.84), int(h * 0.94)], fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(radius=48))
        out = Image.composite(out, blurred, mask)

    return out


def apply_anime_vfx(frame_img: Image.Image, frame_idx: int, shot_prog: float, vfx_list: list[str], seed: int = 101) -> Image.Image:
    if not vfx_list:
        return frame_img

    w, h = WIDTH, HEIGHT
    sec = frame_idx / float(FPS)
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    rng = np.random.RandomState(seed)

    for raw_vfx in vfx_list:
        vfx = raw_vfx.lower().strip()

        if vfx == "sakura_petals":
            for _ in range(32):
                px_start = rng.uniform(-0.1, 1.1)
                py_start = rng.uniform(0.0, 1.0)
                spd_x = rng.uniform(0.06, 0.14)
                spd_y = rng.uniform(0.08, 0.18)
                pw = rng.uniform(6.0, 13.0)
                ph = pw * rng.uniform(0.55, 0.78)
                phase = rng.uniform(0.0, 2 * math.pi)
                cx = ((px_start - sec * spd_x) % 1.0) * w + 16.0 * math.sin(sec * 2.5 + phase)
                cy = ((py_start + sec * spd_y) % 1.0) * h
                alpha = int(175 + 50 * math.sin(sec * 3.0 + phase))
                draw.ellipse(
                    [(cx - pw, cy - ph), (cx + pw, cy + ph)],
                    fill=(255, 196, 218, alpha),
                    outline=(255, 232, 242, min(255, alpha + 30)),
                )

        elif vfx == "rain_streaks":
            draw.rectangle([(0, 0), (w, h)], fill=(18, 28, 48, 24))
            for _ in range(58):
                rx_base = rng.uniform(0.0, 1.05) * w
                ry_start = rng.uniform(0.0, 1.0)
                spd = rng.uniform(0.65, 1.15)
                rlen = rng.uniform(28.0, 62.0)
                cy = ((ry_start + sec * spd) % 1.0) * h
                cx = (rx_base - (cy / float(h)) * 140.0) % w
                alpha = int(rng.uniform(75, 155))
                draw.line([(cx, cy), (cx - rlen * 0.22, cy + rlen)], fill=(195, 225, 255, alpha), width=2)

        elif vfx == "speed_lines":
            cx, cy = w * 0.5, h * 0.46
            for i in range(44):
                ang = (i / 44.0) * 2.0 * math.pi + 0.08 * math.sin(frame_idx * 0.7 + i)
                r_inner = rng.uniform(0.32, 0.44) * max(w, h)
                r_outer = max(w, h) * 0.75
                x1 = cx + math.cos(ang) * r_inner
                y1 = cy + math.sin(ang) * r_inner
                x2 = cx + math.cos(ang) * r_outer
                y2 = cy + math.sin(ang) * r_outer
                alpha = int(110 + 85 * ((frame_idx + i * 3) % 5 == 0))
                draw.line([(x1, y1), (x2, y2)], fill=(245, 250, 255, alpha), width=3)

        elif vfx == "impact_flash":
            if shot_prog < 0.18:
                ft = max(0.0, 1.0 - (shot_prog / 0.18)) ** 2
                draw.rectangle([(0, 0), (w, h)], fill=(255, 250, 240, int(165 * ft)))

        elif vfx == "shatter_flash":
            if shot_prog < 0.24:
                ft = max(0.0, 1.0 - (shot_prog / 0.24)) ** 2
                draw.rectangle([(0, 0), (w, h)], fill=(230, 195, 255, int(135 * ft)))
            for _ in range(20):
                ang = rng.uniform(0, 2 * math.pi)
                dist = (sec * rng.uniform(110, 250)) % (max(w, h) * 0.55)
                cx = w * 0.5 + math.cos(ang) * dist
                cy = h * 0.48 + math.sin(ang) * dist
                sz = rng.uniform(6.0, 15.0)
                pts = [
                    (cx + math.cos(ang + sec * 4) * sz, cy + math.sin(ang + sec * 4) * sz),
                    (cx + math.cos(ang + 2.1 + sec * 4) * sz, cy + math.sin(ang + 2.1 + sec * 4) * sz),
                    (cx + math.cos(ang + 4.2 + sec * 4) * sz, cy + math.sin(ang + 4.2 + sec * 4) * sz),
                ]
                draw.polygon(pts, fill=(220, 245, 255, 145), outline=(255, 255, 255, 215))

        elif vfx == "fire":
            flicker = 0.5 + 0.5 * math.sin(sec * 11.0) * math.cos(sec * 6.3)
            draw.rectangle([(0, int(h * 0.55)), (w, h)], fill=(255, 90, 15, int(18 + 18 * flicker)))
            for _ in range(36):
                ex_base = rng.uniform(0.05, 0.95) * w
                ey_start = rng.uniform(0.0, 1.0)
                spd = rng.uniform(0.16, 0.38)
                er = rng.uniform(2.2, 5.5)
                phase = rng.uniform(0, 2 * math.pi)
                cur_y = ((ey_start - sec * spd) % 1.0) * h
                cur_x = ex_base + 14.0 * math.sin(sec * 3.2 + phase)
                e_alpha = int(220 * (cur_y / float(h)))
                draw.ellipse([(cur_x - er * 1.8, cur_y - er * 1.8), (cur_x + er * 1.8, cur_y + er * 1.8)], fill=(255, 110, 20, e_alpha // 3))
                draw.ellipse([(cur_x - er, cur_y - er), (cur_x + er, cur_y + er)], fill=(255, 235, 130, e_alpha))

        elif vfx == "blue_hellfire":
            flicker = 0.5 + 0.5 * math.sin(sec * 9.5) * math.cos(sec * 5.7)
            draw.rectangle([(0, int(h * 0.45)), (w, h)], fill=(20, 130, 255, int(16 + 20 * flicker)))
            for _ in range(34):
                ex_base = rng.uniform(0.06, 0.94) * w
                ey_start = rng.uniform(0.0, 1.0)
                spd = rng.uniform(0.22, 0.48)
                er = rng.uniform(2.0, 5.2)
                phase = rng.uniform(0, 2 * math.pi)
                cur_y = ((ey_start - sec * spd) % 1.0) * h
                cur_x = ex_base + 14.0 * math.sin(sec * 3.8 + phase)
                e_alpha = int(225 * (cur_y / float(h)))
                draw.ellipse([(cur_x - er * 2, cur_y - er * 2), (cur_x + er * 2, cur_y + er * 2)], fill=(30, 150, 255, e_alpha // 3))
                draw.ellipse([(cur_x - er, cur_y - er), (cur_x + er, cur_y + er)], fill=(185, 240, 255, e_alpha))

        elif vfx in ("teal_magic", "nature_vines", "crimson_magic", "solar_light", "lucid_light", "cosmic_stars"):
            palette = {
                "teal_magic": ((30, 240, 195), (195, 255, 242)),
                "nature_vines": ((40, 235, 95), (195, 255, 185)),
                "crimson_magic": ((235, 25, 60), (255, 215, 110)),
                "solar_light": ((255, 195, 40), (255, 245, 165)),
                "lucid_light": ((185, 70, 255), (245, 215, 255)),
                "cosmic_stars": ((140, 120, 255), (240, 235, 255)),
            }[vfx]
            outer_rgb, core_rgb = palette
            for _ in range(30):
                sx = rng.uniform(0.06, 0.94) * w
                sy_start = rng.uniform(0.06, 0.92)
                spd = rng.uniform(0.04, 0.14)
                sr = rng.uniform(2.2, 5.6)
                phase = rng.uniform(0, 2 * math.pi)
                cur_y = ((sy_start - sec * spd) % 1.0) * h
                cur_x = sx + 14.0 * math.cos(sec * 2.2 + phase)
                tw = (0.5 + 0.5 * math.sin(sec * 5.2 + phase)) ** 2
                s_alpha = int(225 * tw)
                draw.ellipse([(cur_x - sr * 2.2, cur_y - sr * 2.2), (cur_x + sr * 2.2, cur_y + sr * 2.2)], fill=(*outer_rgb, s_alpha // 3))
                arm = sr * 2.4
                draw.line([(cur_x - arm, cur_y), (cur_x + arm, cur_y)], fill=(*core_rgb, s_alpha), width=2)
                draw.line([(cur_x, cur_y - arm), (cur_x, cur_y + arm)], fill=(*core_rgb, s_alpha), width=2)

        elif vfx in ("kinetic_rings", "alarm_pulses"):
            ring_rgb = (90, 235, 255) if vfx == "kinetic_rings" else (255, 215, 90)
            for r_idx in range(4):
                prog = (sec * 0.9 + r_idx * 0.25) % 1.0
                rx = prog * w * 0.45
                ry = prog * h * 0.28
                cx, cy = w * 0.5, h * 0.52
                r_alpha = int(210 * (1.0 - prog))
                draw.ellipse([(cx - rx, cy - ry), (cx + rx, cy + ry)], outline=(*ring_rgb, r_alpha), width=3)

        elif vfx == "bubbles":
            for _ in range(26):
                bx_base = rng.uniform(0.15, 0.85) * w
                by_start = rng.uniform(0.0, 1.0)
                spd = rng.uniform(0.09, 0.20)
                rad = rng.uniform(4.5, 13.5)
                phase = rng.uniform(0, 2 * math.pi)
                cur_y = ((by_start - sec * spd) % 1.0) * h
                cur_x = bx_base + 10.0 * math.sin(sec * 2.4 + phase)
                alpha = int(125 + 45 * math.sin(sec * 2.0 + phase))
                draw.ellipse([(cur_x - rad, cur_y - rad), (cur_x + rad, cur_y + rad)], fill=(200, 245, 255, alpha // 3), outline=(225, 255, 255, alpha), width=2)

    return Image.alpha_composite(frame_img.convert("RGBA"), overlay).convert("RGB")


def draw_title_card(base_img: Image.Image, timeline: dict, t: float, fonts: dict) -> Image.Image:
    tc = timeline["title_card"]
    dur = max(0.1, tc["duration"])
    prog = max(0.0, min(1.0, (t - tc["start"]) / dur))

    frame = apply_virtual_camera(base_img, prog, "zoom_in", 0.10).convert("RGBA")
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    draw.rectangle([0, 0, WIDTH, HEIGHT], fill=(8, 11, 22, 138))
    pad_x, pad_y = 140, 115
    draw.rounded_rectangle(
        [pad_x, pad_y, WIDTH - pad_x, HEIGHT - pad_y],
        radius=22,
        fill=(10, 14, 28, 178),
        outline=(236, 194, 112, 225),
        width=3,
    )
    draw.rounded_rectangle(
        [pad_x + 14, pad_y + 14, WIDTH - pad_x - 14, HEIGHT - pad_y - 14],
        radius=16,
        outline=(118, 215, 242, 115),
        width=1,
    )

    badge_txt = "KINETIC ANIME VISUAL NOVEL ADAPTATION"
    bb = draw.textbbox((0, 0), badge_txt, font=fonts["badge"])
    draw.text(((WIDTH - (bb[2] - bb[0])) // 2, pad_y + 88), badge_txt, font=fonts["badge"], fill=(118, 215, 242, 240))

    title_lines = wrap_lines_pixel(draw, timeline.get("title", "Anime Visual Novel"), fonts["title"], WIDTH - 420)
    y_cursor = pad_y + 175
    for tl in title_lines:
        tb = draw.textbbox((0, 0), tl, font=fonts["title"])
        tw, th = tb[2] - tb[0], tb[3] - tb[1]
        draw.text(((WIDTH - tw) // 2 + 3, y_cursor + 4), tl, font=fonts["title"], fill=(0, 0, 0, 225))
        draw.text(((WIDTH - tw) // 2, y_cursor), tl, font=fonts["title"], fill=(252, 246, 234, 255))
        y_cursor += th + 22

    div_y = y_cursor + 24
    draw.line([(WIDTH // 2 - 240, div_y), (WIDTH // 2 + 240, div_y)], fill=(236, 194, 112, 210), width=2)

    sub = timeline.get("subtitle", "")
    if sub:
        sb = draw.textbbox((0, 0), sub, font=fonts["subtitle"])
        draw.text(((WIDTH - (sb[2] - sb[0])) // 2, div_y + 32), sub, font=fonts["subtitle"], fill=(214, 228, 248, 245))

    footer = "Built-In AI Anime Visuals  •  Kokoro TTS + Vocal DSP  •  Stable Audio Small Music & SFX"
    fb = draw.textbbox((0, 0), footer, font=fonts["small"])
    draw.text(((WIDTH - (fb[2] - fb[0])) // 2, HEIGHT - pad_y - 82), footer, font=fonts["small"], fill=(188, 202, 224, 225))

    out = Image.alpha_composite(frame, overlay).convert("RGB")
    if t < 0.55:
        alpha = max(0.0, min(1.0, t / 0.55))
        out = Image.blend(Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0)), out, alpha)
    return out


def draw_credits_card(base_img: Image.Image, timeline: dict, t: float, fonts: dict, speaker_color_map: dict) -> Image.Image:
    cc = timeline["credits_card"]
    dur = max(0.1, cc["duration"])
    prog = max(0.0, min(1.0, (t - cc["start"]) / dur))

    frame = apply_virtual_camera(base_img, prog, "zoom_out", 0.10).convert("RGBA")
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    draw.rectangle([0, 0, WIDTH, HEIGHT], fill=(8, 11, 22, 172))
    pad_x, pad_y = 125, 84
    draw.rounded_rectangle(
        [pad_x, pad_y, WIDTH - pad_x, HEIGHT - pad_y],
        radius=22,
        fill=(10, 14, 28, 192),
        outline=(236, 194, 112, 215),
        width=3,
    )

    header = "VISUAL NOVEL CAST & PRODUCTION CREDITS"
    hb = draw.textbbox((0, 0), header, font=fonts["credits_header"])
    draw.text(((WIDTH - (hb[2] - hb[0])) // 2, pad_y + 40), header, font=fonts["credits_header"], fill=(236, 194, 112, 255))

    sub_title = f"{timeline.get('title', '')} — {timeline.get('subtitle', '')}".strip(" —")
    stb = draw.textbbox((0, 0), sub_title, font=fonts["small"])
    draw.text(((WIDTH - (stb[2] - stb[0])) // 2, pad_y + 98), sub_title, font=fonts["small"], fill=(220, 228, 242, 230))
    draw.line([(pad_x + 80, pad_y + 144), (WIDTH - pad_x - 80, pad_y + 144)], fill=(236, 194, 112, 130), width=2)

    col1_x = pad_x + 85
    y_left = pad_y + 176
    draw.text((col1_x, y_left), "VOICE CAST (KOKORO TTS + VOCAL DSP)", font=fonts["badge"], fill=(236, 194, 112, 240))
    y_left += 46

    for speaker, info in timeline.get("cast", {}).items():
        role = info.get("role", "Character")
        voice = info.get("voice", "kokoro")
        c_rgb = speaker_color_map.get(speaker, (240, 240, 240))
        draw.text((col1_x, y_left), f"• {speaker}", font=fonts["credits_item_bold"], fill=(*c_rgb, 255))
        draw.text((col1_x + 250, y_left + 2), f"{role}  ({voice})", font=fonts["credits_item"], fill=(225, 232, 245, 235))
        y_left += 44

    col2_x = WIDTH // 2 + 45
    y_right = pad_y + 176
    draw.text((col2_x, y_right), "KINETIC NOVEL ENGINE & MODELS", font=fonts["badge"], fill=(118, 215, 242, 240))
    y_right += 46

    tech_rows = [
        ("Anime CG Art:", "Built-In AI Image Generator (1080p)"),
        ("Presentation:", "Hybrid ADV / NVL / Event CG UI"),
        ("Music Score:", "Stable Audio Small Music (sa3-sm-music)"),
        ("Sound Effects:", "Stable Audio Small SFX (sa3-sm-sfx)"),
        ("Audio Mix:", "48kHz Sidechain-Ducked Stereo Master"),
        ("Accessibility:", "Descriptive Narration & Safe Captions"),
    ]
    for label, val in tech_rows:
        draw.text((col2_x, y_right), label, font=fonts["credits_item_bold"], fill=(165, 212, 245, 245))
        draw.text((col2_x + 225, y_right), val, font=fonts["credits_item"], fill=(230, 235, 245, 235))
        y_right += 44

    footer_msg = "Thank you for watching & reading!"
    fmb = draw.textbbox((0, 0), footer_msg, font=fonts["subtitle"])
    draw.text(((WIDTH - (fmb[2] - fmb[0])) // 2, HEIGHT - pad_y - 78), footer_msg, font=fonts["subtitle"], fill=(252, 246, 234, 245))

    out = Image.alpha_composite(frame, overlay).convert("RGB")
    rem = cc["end"] - t
    if rem < 0.65:
        alpha = max(0.0, min(1.0, rem / 0.65))
        out = Image.blend(Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0)), out, alpha)
    return out


def draw_vn_frame(
    shot_img: Image.Image,
    active_line: dict | None,
    active_scene: dict | None,
    shot_progress: float,
    motion: str,
    zoom_amount: float,
    vfx_list: list[str],
    dof_blur: bool,
    frame_idx: int,
    fonts: dict,
    speaker_color_map: dict,
    shot_local_sec: float = 0.0,
    line_progress: float | None = None,
) -> Image.Image:
    cam_img = apply_virtual_camera(
        shot_img,
        progress=shot_progress,
        motion=motion,
        zoom_amount=zoom_amount,
        vfx_list=vfx_list,
        frame_idx=frame_idx,
        dof_blur=dof_blur,
        shot_local_sec=shot_local_sec,
    )
    vfx_img = apply_anime_vfx(cam_img, frame_idx, shot_progress, vfx_list, seed=101 + (active_line["start"] if active_line else 0).__hash__() % 900)
    frame = vfx_img.convert("RGBA")
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Top-left Scene Chapter Pill & Top-right Kinetic Novel HUD Badge
    if active_scene:
        sc_label = active_scene.get("title", "")
        if sc_label:
            sb = draw.textbbox((0, 0), sc_label, font=fonts["hud"])
            sw, sh = sb[2] - sb[0], sb[3] - sb[1]
            draw.rounded_rectangle(
                [54, 34, 54 + sw + 34, 34 + sh + 20],
                radius=11,
                fill=(10, 14, 26, 162),
                outline=(236, 194, 112, 135),
                width=1,
            )
            draw.text((71, 42), sc_label, font=fonts["hud"], fill=(242, 234, 216, 235))

    vn_mode = (active_line.get("vn_mode", "ADV") if active_line else "ADV").upper()
    hud_txt = f"AUTO   •   {vn_mode} MODE"
    hb = draw.textbbox((0, 0), hud_txt, font=fonts["hud_small"])
    hw, hh = hb[2] - hb[0], hb[3] - hb[1]
    draw.rounded_rectangle(
        [WIDTH - 54 - hw - 32, 34, WIDTH - 54, 34 + hh + 20],
        radius=11,
        fill=(10, 14, 26, 155),
        outline=(118, 215, 242, 125),
        width=1,
    )
    draw.text((WIDTH - 54 - hw - 16, 43), hud_txt, font=fonts["hud_small"], fill=(195, 228, 248, 230))

    if active_line:
        speaker = active_line["speaker"]
        t_sec = frame_idx / float(FPS)
        cap_pages = active_line.get("caption_pages", [])
        if cap_pages:
            pages = [cp["text"] for cp in cap_pages]
            page_idx = 0
            for cp_i, cp in enumerate(cap_pages):
                if t_sec >= float(cp["start"]) - 0.02:
                    page_idx = cp_i
            page_text = pages[page_idx]
        else:
            cap_raw = active_line.get("caption") or active_line["text"]
            pages = paginate_text(cap_raw, max_chars_per_page=100)
            eff_line_prog = shot_progress if line_progress is None else line_progress
            line_prog = max(0.0, min(0.999, eff_line_prog))
            total_chars = max(1, sum(len(p) for p in pages))
            cum_chars = 0
            page_idx = len(pages) - 1
            for p_i, p_str in enumerate(pages):
                cum_chars += len(p_str)
                if line_prog <= (cum_chars / float(total_chars)):
                    page_idx = p_i
                    break
            page_text = pages[page_idx]

        max_text_w = int(WIDTH * 0.66)  # 1267 px -> leaves 326 px (17%) safe margin on left & right!
        spk_color = speaker_color_map.get(speaker, (242, 198, 114))

        # Live 24fps speech amplitude for speaking indicator
        env_list = active_line.get("speech_env_24fps", [])
        full_prog = max(0.0, min(0.999, (frame_idx / float(FPS) - active_line["start"]) / max(0.1, active_line["duration"])))
        env_idx = min(len(env_list) - 1, int(full_prog * max(1, len(env_list)))) if env_list else 0
        speech_amp = float(env_list[env_idx]) if env_list else 0.5

        if vn_mode == "NVL":
            # Mahoyo-inspired Literary NVL Slate in lower-mid frame with serif typography
            wrapped = wrap_lines_pixel(draw, page_text, fonts["nvl_caption"], max_text_w)
            line_h = 46
            box_h = 68 + len(wrapped) * line_h + 28
            box_w = max_text_w + 116
            box_x0 = (WIDTH - box_w) // 2
            box_y1 = HEIGHT - 44
            box_y0 = box_y1 - box_h

            draw.rounded_rectangle(
                [box_x0, box_y0, box_x0 + box_w, box_y1],
                radius=16,
                fill=(8, 10, 20, 218),
                outline=(236, 194, 112, 185),
                width=2,
            )
            draw.line([(box_x0 + 36, box_y0 + 46), (box_x0 + box_w - 36, box_y0 + 46)], fill=(236, 194, 112, 95), width=1)

            role_tag = "NARRATION" if speaker == "Narrator" else f"{speaker.upper()} — MONOLOGUE"
            if len(pages) > 1:
                role_tag = f"{role_tag}  ({page_idx + 1}/{len(pages)})"
            rb = draw.textbbox((0, 0), role_tag, font=fonts["speaker"])
            draw.text(((WIDTH - (rb[2] - rb[0])) // 2, box_y0 + 13), role_tag, font=fonts["speaker"], fill=(*spk_color, 245))

            ty = box_y0 + 58
            for wl in wrapped:
                wb = draw.textbbox((0, 0), wl, font=fonts["nvl_caption"])
                wx = (WIDTH - (wb[2] - wb[0])) // 2
                draw.text(
                    (wx, ty),
                    wl,
                    font=fonts["nvl_caption"],
                    fill=(248, 242, 228, 255),
                    stroke_width=3,
                    stroke_fill=(6, 8, 14, 245),
                )
                ty += line_h

        else:
            # Classic Anime Visual Novel ADV Dialogue Window (or streamlined CG Window)
            wrapped = wrap_lines_pixel(draw, page_text, fonts["caption"], max_text_w)
            line_h = 44
            box_h = 56 + len(wrapped) * line_h + 26
            box_w = max_text_w + 112
            box_x0 = (WIDTH - box_w) // 2
            box_y1 = HEIGHT - 38
            box_y0 = box_y1 - box_h

            bg_alpha = 185 if vn_mode == "CG" else 216
            draw.rounded_rectangle(
                [box_x0, box_y0, box_x0 + box_w, box_y1],
                radius=18,
                fill=(10, 14, 26, bg_alpha),
                outline=(*spk_color, 210),
                width=2,
            )
            # Inner ornamental VN frame line
            draw.rounded_rectangle(
                [box_x0 + 6, box_y0 + 6, box_x0 + box_w - 6, box_y1 - 6],
                radius=14,
                outline=(*spk_color, 70),
                width=1,
            )

            # Top-left Raised Anime VN Speaker Nameplate Pill
            role_tag = "NARRATOR" if speaker == "Narrator" else speaker.upper()
            if len(pages) > 1:
                role_tag = f"{role_tag}  ({page_idx + 1}/{len(pages)})"
            rb = draw.textbbox((0, 0), role_tag, font=fonts["speaker"])
            rw, rh = rb[2] - rb[0], rb[3] - rb[1]
            np_x0 = box_x0 + 32
            np_y0 = box_y0 - 18
            np_w = rw + 74
            np_h = rh + 18
            draw.rounded_rectangle(
                [np_x0, np_y0, np_x0 + np_w, np_y0 + np_h],
                radius=10,
                fill=(16, 22, 38, 248),
                outline=(*spk_color, 245),
                width=2,
            )
            draw.text((np_x0 + 18, np_y0 + 7), role_tag, font=fonts["speaker"], fill=(*spk_color, 255))

            # Live Voice-Envelope Equalizer Bars inside the Nameplate Pill
            bar_base_x = np_x0 + rw + 30
            bar_mid_y = np_y0 + np_h // 2 + 1
            for b_i, mult in enumerate([0.65, 1.0, 0.8, 0.55]):
                bh = max(3, int(round((3.0 + 10.0 * speech_amp * mult))))
                bx = bar_base_x + b_i * 7
                draw.line([(bx, bar_mid_y - bh // 2), (bx, bar_mid_y + bh // 2)], fill=(*spk_color, 235), width=3)

            # Render wrapped dialogue lines centered in the safe box
            ty = box_y0 + 38
            for wl in wrapped:
                wb = draw.textbbox((0, 0), wl, font=fonts["caption"])
                wx = (WIDTH - (wb[2] - wb[0])) // 2
                draw.text(
                    (wx, ty),
                    wl,
                    font=fonts["caption"],
                    fill=(252, 248, 240, 255),
                    stroke_width=3,
                    stroke_fill=(8, 10, 16, 248),
                )
                ty += line_h

            # Animated VN continuation chevron (▼) at bottom-right of dialogue box
            bob = int(round(2.5 * math.sin(frame_idx * 0.35)))
            cx_tri = box_x0 + box_w - 30
            cy_tri = box_y1 - 22 + bob
            draw.polygon(
                [(cx_tri - 7, cy_tri - 4), (cx_tri + 7, cy_tri - 4), (cx_tri, cy_tri + 5)],
                fill=(*spk_color, 225),
            )

    return Image.alpha_composite(frame, overlay).convert("RGB")


def generate_vn_web_theater(project_dir: Path, timeline: dict):
    lines_json = json.dumps([
        {
            "id": l["id"],
            "speaker": l["speaker"],
            "vn_mode": l.get("vn_mode", "ADV"),
            "text": l.get("caption") or l["text"],
            "start": l["start"],
        }
        for l in timeline.get("lines", [])
    ])
    scenes_json = json.dumps([
        {"title": s.get("title", s["id"]), "time": s["start"]}
        for s in timeline.get("scenes", [])
    ])
    # Escape HTML text and script data separately; never interpolate story markup.
    lines_json = lines_json.replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    scenes_json = scenes_json.replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    safe_title = html_escape.escape(str(timeline.get('title', 'Anime Visual Novel')))
    safe_subtitle = html_escape.escape(str(timeline.get('subtitle', '')))
    credits_start = float(timeline['credits_card']['start'])
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{safe_title} — Kinetic Visual Novel Web Theater</title>
  <style>
    :root {{
      --bg: #070a12;
      --panel: #111728;
      --gold: #ecc270;
      --cyan: #76d7f2;
      --text: #f5f0e6;
      --muted: #9aa8c4;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: radial-gradient(circle at top, #17223d 0%, var(--bg) 72%);
      color: var(--text);
      font-family: "Segoe UI", system-ui, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 18px;
    }}
    header {{
      max-width: 1220px;
      width: 100%;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 1px solid rgba(236, 194, 112, 0.28);
      padding-bottom: 10px;
    }}
    h1 {{ font-family: Georgia, serif; font-size: 1.7rem; color: var(--gold); }}
    .subtitle {{ color: var(--muted); font-size: 0.95rem; }}
    .layout {{
      max-width: 1220px;
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 18px;
    }}
    @media (max-width: 980px) {{ .layout {{ grid-template-columns: 1fr; }} }}
    .player-wrap {{
      background: #000;
      border-radius: 14px;
      overflow: hidden;
      border: 2px solid rgba(236, 194, 112, 0.42);
      box-shadow: 0 18px 55px rgba(0, 0, 0, 0.75);
    }}
    video {{ width: 100%; display: block; aspect-ratio: 16 / 9; }}
    .backlog {{
      background: var(--panel);
      border: 1px solid rgba(118, 215, 242, 0.28);
      border-radius: 14px;
      padding: 14px;
      max-height: 520px;
      overflow-y: auto;
    }}
    .backlog h2 {{ font-size: 0.95rem; color: var(--cyan); letter-spacing: 0.06em; margin-bottom: 10px; }}
    .log-entry {{
      padding: 8px 10px;
      border-radius: 8px;
      margin-bottom: 8px;
      background: rgba(255, 255, 255, 0.03);
      cursor: pointer;
      font-size: 0.86rem;
      line-height: 1.4;
      border-left: 3px solid var(--gold);
    }}
    .log-entry:hover {{ background: rgba(118, 215, 242, 0.12); }}
    .log-spk {{ font-weight: 700; color: var(--gold); font-size: 0.78rem; text-transform: uppercase; }}
    .chapters {{
      max-width: 1220px;
      width: 100%;
      margin-top: 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }}
    .chapter-btn {{
      background: var(--panel);
      color: var(--text);
      border: 1px solid rgba(236, 194, 112, 0.35);
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.88rem;
    }}
    .chapter-btn:hover {{ background: rgba(236, 194, 112, 0.18); border-color: var(--gold); }}
  </style>
</head>
<body>
  <header>
    <div>
      <h1>{safe_title}</h1>
      <div class="subtitle">{safe_subtitle}</div>
    </div>
    <div class="subtitle">Kinetic Visual Novel • 1080p 24fps • Kokoro TTS • Stable Audio Small</div>
  </header>
  <div class="layout">
    <div class="player-wrap">
      <video id="vid" controls preload="metadata" poster="images/title_bg.png">
        <source src="vn_story_video.mp4" type="video/mp4" />
        <track label="English Captions" kind="captions" srclang="en" src="audio/captions.vtt" default />
      </video>
    </div>
    <div class="backlog">
      <h2>VISUAL NOVEL TEXT LOG (CLICK TO JUMP)</h2>
      <div id="log-list"></div>
    </div>
  </div>
  <div class="chapters" id="chapters"></div>
  <script>
    const v = document.getElementById('vid');
    const chapters = [
      {{ title: "00:00 Title Screen", time: 0 }},
      ...{scenes_json},
      {{ title: "Closing Credits", time: {credits_start} }}
    ];
    const chWrap = document.getElementById('chapters');
    chapters.forEach(ch => {{
      const btn = document.createElement('button');
      btn.className = 'chapter-btn';
      const m = Math.floor(ch.time / 60).toString().padStart(2, '0');
      const s = Math.floor(ch.time % 60).toString().padStart(2, '0');
      btn.textContent = `${{m}}:${{s}} — ${{ch.title}}`;
      btn.onclick = () => {{ v.currentTime = ch.time; v.play(); }};
      chWrap.appendChild(btn);
    }});
    const lines = {lines_json};
    const logList = document.getElementById('log-list');
    lines.forEach(l => {{
      const div = document.createElement('div');
      div.className = 'log-entry';
      const speaker = document.createElement('div');
      speaker.className = 'log-spk';
      speaker.textContent = `[${{l.vn_mode}}] ${{l.speaker}}`;
      const text = document.createElement('div');
      text.textContent = l.text;
      div.append(speaker, text);
      div.onclick = () => {{ v.currentTime = l.start; v.play(); }};
      logList.appendChild(div);
    }});
  </script>
</body>
</html>
"""
    (project_dir / "index.html").write_text(html, encoding="utf-8")


def generate_youtube_metadata(project_dir: Path, timeline: dict):
    date_str = timeline.get("date", "11/04/2026")
    title = timeline.get("title", "Anime Visual Novel Adaptation")
    subtitle = timeline.get("subtitle", "")

    def fmt_ts(sec: float) -> str:
        s = int(round(sec))
        return f"{s // 60:02d}:{s % 60:02d}"

    chapters = ["00:00 Opening Title Screen"]
    for sc in timeline.get("scenes", []):
        chapters.append(f"{fmt_ts(sc['start'])} {sc.get('title', sc['id'])}")
    chapters.append(f"{fmt_ts(timeline['credits_card']['start'])} Closing Credits & Voice Cast")

    cast_lines = []
    for spk, info in timeline.get("cast", {}).items():
        cast_lines.append(f"- {spk} ({info.get('role', 'Character')}): Kokoro TTS `{info.get('voice')}`")

    tags = timeline.get("tags") or [
        "anime visual novel",
        "kinetic novel",
        "story adaptation",
        "kokoro tts",
        "stable audio small",
        "audio drama",
        "anime story video",
    ]
    tags_csv = ", ".join(str(t).strip() for t in tags if str(t).strip())

    md = f"""# Title {date_str}
{title}: {subtitle} ({date_str})

## Description
{timeline.get('synopsis', 'A complete non-interactive Anime Visual Novel (Kinetic Novel) adaptation featuring built-in AI anime illustrations, multi-voice Kokoro TTS acting, and Stable Audio Small music and sound effects.')}

### Chapter Timestamps
{chr(10).join(chapters)}

### Voice Cast (Kokoro-82M TTS + Vocal DSP)
{chr(10).join(cast_lines)}

### Production Provenance
- **Visual Style**: Non-Interactive Anime Visual Novel (Hybrid ADV / NVL / Event CG Presentation)
- **Illustrations**: Host AI image-generation tool (`1920x1080` HD)
- **Music & Foley SFX**: Stable Audio Small Music (`sa3-sm-music`) & Stable Audio Small SFX (`sa3-sm-sfx`)

## Comma Separated List Of Tags
{tags_csv}
"""
    (project_dir / "youtube_metadata.md").write_text(md, encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project-dir", required=True, help="Path to project root directory")
    ap.add_argument("--out-mp4", default=None, help="Optional custom output MP4 path")
    args = ap.parse_args()

    root = Path(args.project_dir).resolve()
    timeline_path = root / "audio" / "timeline.json"
    images_dir = root / "images"
    master_wav = root / "audio" / "master.wav"
    srt_path = root / "audio" / "subtitles.srt"
    out_mp4 = Path(args.out_mp4).resolve() if args.out_mp4 else (root / "vn_story_video.mp4")

    timeline = json.loads(timeline_path.read_text(encoding="utf-8"))
    total_dur = float(timeline["total_duration"])
    total_frames = int(math.ceil(total_dur * FPS))

    fonts = {
        "title": load_font(62, bold=True, serif=True),
        "subtitle": load_font(31, bold=False, serif=True),
        "badge": load_font(21, bold=True, serif=False),
        "small": load_font(21, bold=False, serif=False),
        "hud": load_font(21, bold=True, serif=False),
        "hud_small": load_font(18, bold=True, serif=False),
        "speaker": load_font(20, bold=True, serif=False),
        "caption": load_font(30, bold=True, serif=False),
        "nvl_caption": load_font(30, bold=False, serif=True),
        "credits_header": load_font(40, bold=True, serif=True),
        "credits_item_bold": load_font(22, bold=True, serif=False),
        "credits_item": load_font(21, bold=False, serif=False),
    }

    speaker_color_map = {}
    for idx, (spk, info) in enumerate(timeline.get("cast", {}).items()):
        if "color" in info and len(info["color"]) == 3:
            speaker_color_map[spk] = tuple(int(c) for c in info["color"])
        else:
            speaker_color_map[spk] = SPEAKER_COLORS[idx % len(SPEAKER_COLORS)]

    img_cache = {}
    title_bg = Image.open(images_dir / "title_bg.png").convert("RGB").resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    credits_bg = Image.open(images_dir / "credits_bg.png").convert("RGB").resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)

    lines = timeline.get("lines", [])
    scenes = timeline.get("scenes", [])
    for l in lines:
        rel = l.get("image_file", f"shots/shot_{l['id']}.png")
        p = images_dir / rel
        if not p.exists():
            p = images_dir / f"shot_{l['id']}.png"
        img_cache[f"shot_{l['id']}"] = Image.open(p).convert("RGB").resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
        for sub in l.get("sub_shots", []):
            sp = images_dir / sub["image_file"]
            if sp.exists():
                img_cache[f"sub_{sub['id']}"] = Image.open(sp).convert("RGB").resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)

    title_end = float(timeline["title_card"]["end"])
    credits_start = float(timeline["credits_card"]["start"])

    # Build visual spans supporting both main line shots and mid-line `sub_shots` cuts.
    # CRITICAL RULE: Never cut away from a line's shot until AFTER the full line (including its 0.45s tail
    # plus an extra >= 0.30s post-line visual hold) has finished speaking!
    shot_spans = []
    default_motions = ["zoom_in", "pan_right", "zoom_out", "pan_left", "zoom_in_left", "zoom_in_right"]
    line_cut_boundaries = [title_end]
    for idx in range(len(lines) - 1):
        cur_end = float(lines[idx]["end"])
        nxt_start = float(lines[idx + 1]["start"])
        gap = max(0.0, nxt_start - cur_end)
        # Hold current shot for 68% of the inter-line/inter-scene gap (at least +0.30s after cur_end)
        cut_t = min(nxt_start - 0.15, max(cur_end + 0.30, cur_end + 0.68 * gap))
        line_cut_boundaries.append(round(cut_t, 4))
    line_cut_boundaries.append(credits_start)

    for idx, l in enumerate(lines):
        span_start = line_cut_boundaries[idx]
        span_end = line_cut_boundaries[idx + 1]
        speech_dur = float(l.get("speech_duration", max(0.4, float(l["duration"]) - 0.45)))
        sub_shots = l.get("sub_shots", [])
        if not sub_shots:
            shot_spans.append({
                "line": l,
                "img_key": f"shot_{l['id']}",
                "span_start": span_start,
                "span_end": span_end,
                "motion": l.get("camera_motion") or default_motions[idx % len(default_motions)],
                "zoom_amount": float(l.get("zoom_amount", 0.12)),
                "vfx": l.get("vfx", []),
                "dof_blur": bool(l.get("dof_blur", False)),
            })
        else:
            # Split [span_start, span_end] across main shot + sub_shots using active speech_dur so sub_shots
            # cut on the spoken beat and hold cleanly through the end of the line!
            cuts = [span_start] + [
                l["start"] + min(0.86, max(0.22, float(sub.get("fraction", (s_i + 1) / float(len(sub_shots) + 1))))) * speech_dur
                for s_i, sub in enumerate(sub_shots)
            ] + [span_end]
            shot_spans.append({
                "line": l,
                "img_key": f"shot_{l['id']}",
                "span_start": cuts[0],
                "span_end": cuts[1],
                "motion": l.get("camera_motion") or default_motions[idx % len(default_motions)],
                "zoom_amount": float(l.get("zoom_amount", 0.12)),
                "vfx": l.get("vfx", []),
                "dof_blur": bool(l.get("dof_blur", False)),
            })
            for s_i, sub in enumerate(sub_shots):
                sub_key = f"sub_{sub['id']}" if f"sub_{sub['id']}" in img_cache else f"shot_{l['id']}"
                shot_spans.append({
                    "line": l,
                    "img_key": sub_key,
                    "span_start": cuts[s_i + 1],
                    "span_end": cuts[s_i + 2],
                    "motion": sub.get("camera_motion", "zoom_in"),
                    "zoom_amount": float(sub.get("zoom_amount", 0.14)),
                    "vfx": sub.get("vfx", l.get("vfx", [])),
                    "dof_blur": bool(sub.get("dof_blur", l.get("dof_blur", False))),
                })

    keyframes_dir = root / "keyframes"
    keyframes_dir.mkdir(parents=True, exist_ok=True)

    ffmpeg_cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-f", "rawvideo",
        "-pix_fmt", "rgb24",
        "-s", f"{WIDTH}x{HEIGHT}",
        "-r", str(FPS),
        "-i", "pipe:0",
        "-i", str(master_wav),
    ]
    if srt_path.exists():
        ffmpeg_cmd.extend(["-i", str(srt_path)])
    ffmpeg_cmd.extend([
        "-map", "0:v:0",
        "-map", "1:a:0",
    ])
    if srt_path.exists():
        ffmpeg_cmd.extend(["-map", "2:s:0", "-c:s", "mov_text", "-metadata:s:s:0", "language=eng"])
    ffmpeg_cmd.extend([
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        str(out_mp4),
    ])

    print(f"[VN-VIDEO] Encoding {total_frames} frames ({total_dur:.2f}s @ {FPS}fps, 1920x1080) -> {out_mp4.name}", flush=True)
    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)
    t0 = time.time()
    saved_keyframes = set()

    for f_idx in range(total_frames):
        t = f_idx / float(FPS)

        if t < title_end:
            frame_img = draw_title_card(title_bg, timeline, t, fonts)
            if "title_card" not in saved_keyframes and t >= title_end * 0.5:
                frame_img.save(keyframes_dir / "card_title.png")
                saved_keyframes.add("title_card")
        elif t >= credits_start:
            frame_img = draw_credits_card(credits_bg, timeline, t, fonts, speaker_color_map)
            if "credits_card" not in saved_keyframes and t >= credits_start + 1.5:
                frame_img.save(keyframes_dir / "card_credits.png")
                saved_keyframes.add("credits_card")
        else:
            active_span = shot_spans[-1]
            for sp in shot_spans:
                if sp["span_start"] <= t <= sp["span_end"]:
                    active_span = sp
                    break
            l_obj = active_span["line"]
            shot_img = img_cache[active_span["img_key"]]
            span_dur = max(0.1, active_span["span_end"] - active_span["span_start"])
            shot_prog = (t - active_span["span_start"]) / span_dur
            shot_local_sec = max(0.0, t - active_span["span_start"])

            speech_dur = float(l_obj.get("speech_duration", max(0.4, float(l_obj["duration"]) - 0.45)))
            speaking_line = None
            # Keep caption box visible until the entire line + its 0.45s tail + 0.22s reading hold completes!
            caption_hold_end = min(active_span["span_end"] - 0.12, float(l_obj["end"]) + 0.22)
            if (l_obj["start"] - 0.08) <= t <= caption_hold_end:
                speaking_line = l_obj
                line_prog = max(0.0, min(0.999, (t - l_obj["start"]) / max(0.2, speech_dur)))
            else:
                line_prog = shot_prog

            active_sc = None
            for sc in scenes:
                if sc["start"] <= t <= sc["end"]:
                    active_sc = sc
                    break

            frame_img = draw_vn_frame(
                shot_img=shot_img,
                active_line=speaking_line,
                active_scene=active_sc,
                shot_progress=shot_prog,
                motion=active_span["motion"],
                zoom_amount=active_span["zoom_amount"],
                vfx_list=active_span["vfx"],
                dof_blur=active_span["dof_blur"],
                frame_idx=f_idx,
                fonts=fonts,
                speaker_color_map=speaker_color_map,
                shot_local_sec=shot_local_sec,
                line_progress=line_prog,
            )

            # Smooth 0.24s crossfade strictly at the start of the new shot span (after previous line finished)
            if (t - active_span["span_start"]) < 0.24 and active_span is not shot_spans[0]:
                alpha = max(0.0, min(1.0, (t - active_span["span_start"]) / 0.24))
                prev_idx = shot_spans.index(active_span) - 1
                prev_img = img_cache[shot_spans[prev_idx]["img_key"]]
                frame_img = Image.blend(prev_img, frame_img, alpha)

            lid = l_obj["id"]
            if lid not in saved_keyframes and speaking_line and t >= (l_obj["start"] + speech_dur * 0.45):
                frame_img.save(keyframes_dir / f"frame_{lid}.png")
                saved_keyframes.add(lid)

        proc.stdin.write(np.asarray(frame_img, dtype=np.uint8).tobytes())

        if (f_idx + 1) % 240 == 0 or f_idx == total_frames - 1:
            elapsed = max(0.1, time.time() - t0)
            rate = (f_idx + 1) / elapsed
            print(f"  [Frame {f_idx + 1}/{total_frames}] ({(f_idx + 1) * 100.0 / total_frames:.1f}%) — {rate:.1f} fps", flush=True)

    proc.stdin.close()
    rc = proc.wait()
    if rc != 0:
        raise RuntimeError(f"FFmpeg exited with code {rc}")

    generate_vn_web_theater(root, timeline)
    generate_youtube_metadata(root, timeline)
    print(f"VN_VIDEO_RENDER_COMPLETE mp4={out_mp4} keyframes={len(saved_keyframes)}", flush=True)


if __name__ == "__main__":
    main()
