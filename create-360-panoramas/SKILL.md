---
name: create-360-panoramas
description: Create and inspect 360-degree equirectangular panorama artwork from a scene, dream, world, or visual idea. Use when asked for a 360 photo sphere, spherical panorama, or immersive panoramic illustration, including experiments for XREAL Aura or Google Photos.
---

# Create 360 Panoramas

Make a static spherical image people can look around in, not merely an extra-wide picture. Respect the requested scene, references, style, and canon; if none is specified, use the user's preferred art style. For established personal worlds, find trustworthy source material rather than inventing canonical details. Use built-in image generation for artwork. Do not silently alter user-supplied reference art.

## Generate

1. Ask image generation for a single 2:1 equirectangular image covering 360° horizontally and 180° vertically, designed from one viewpoint. Specify continuous left/right seam, horizon alignment, coherent zenith and nadir, and no text unless requested. The model may make a plausible wide illustration rather than correct spherical geometry: prompting is not verification.
2. Keep the original generated image. Produce a JPEG with Google Photo Sphere GPano XMP as an *experimental compatibility aid*, using `scripts/package_and_test.py`. This is image encoding and metadata packaging, not a claim that Google Photos or a headset accepts it. Do not stretch a non-2:1 image into compliance; regenerate or openly disclose a workaround.
3. Run the bundled test script to create six rectilinear views (front, left, right, seam/rear, up, down) and a report. Inspect the images visually, particularly the wrap, poles, duplicated geometry, and quality at usable scale. Edge-error numbers are diagnostics, not a pass/fail proof. If defects are consequential, iterate with image generation and retest, preserving source. Don't use numeric checks alone to call a panorama seamless.
4. When possible, additionally test in an actual interactive spherical viewer and state precisely what was tested. Do not claim Aura/Google Photos/VR/head tracking, stereoscopic depth or walkable geometry was tested unless it was. An equirectangular mono image is a 360° view from one point, not a true volumetric space or automatically 3D scene.
5. Deliver the original-quality metadata-bearing JPEG as a file, alongside a concise explanation of findings, limitations and how to open it. If appropriate, provide the contact sheet and an optional browser 360 viewer, explaining whether it uploads files. For Google Photos, save original bytes and try Spatial > 360/immersive; recognition is not guaranteed. Do not claim a 2D-to-3D conversion makes a full 360 image.
6. For substantial work, save sources and editable test assets to the user's private Drive when authorized, and verify the backup. Keep a short reusable process record with prompt, image dimensions, packaging, actual tests, discovered seam/pole defects, viewer/compatibility gaps, and next iteration ideas. Never bundle private user artwork or personal information into a public skill without specific authorization.

## Local tool

`python scripts/package_and_test.py input.png output-directory` requires Pillow, NumPy, and SciPy. It makes `panorama-360.jpg`, `projection-contact-sheet.jpg`, and `technical-report.json`; examine the contact sheet manually. It refuses files not exactly 2:1. It uses simple bilinear sphere-to-perspective projections; it does not certify geometry or simulate headset optics. See `references/format-notes.md` for GPano details and lessons from the first Storyverse test.
