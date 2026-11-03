# Production quality: camera, detail, expression and living worlds

Apply these standards to animations using this skill. They define required production work and review, not a promise of a particular artistic result. Preserve any more specific direction in the current request.

## Visual development before rendering

Inspect the supplied reference and identify concrete qualities to carry into the new work rather than matching only its colors. The Keeper reference supplied with this update uses polished graphic illustration: modeled warm/cool gradients, layered hair locks and rim light, expressive eyes and mouth, tailored garment panels with seams and gold trim, decorative star motifs, buckles and boot laces, articulated hands, intricate armillary rings and luminous cores, varied architectural silhouettes, repeated but varied arches/windows, foreground foliage and atmospheric depth. It is not a painterly benchmark. Use these as examples of integrated design detail, not a requirement to reuse the same character or setting.

Prepare a design sheet or representative close and wide frames. Give main characters identifiable silhouettes, facial structure, layered clothing, material separation and consistent proportions. Detail props where they are seen or handled: grips, joints, mechanical features, ornament and contact shadows. Give environments a coherent perspective, foreground/midground/background separation, architectural variety, material shading and lived-in accents. Avoid solving detail with uniform noise, repeated stickers, bright bloom, or simply more paths. Details must remain legible at delivery size and stable during movement. Make the hero large enough in key design frames to assess facial and costume detail; match framing to the shot rather than imposing one occupancy ratio on every view.

Use original authored geometry; this update does not authorize raster tracing, reference-image embedding, generative-image substitution, or a different medium. A few refined shapes can outperform many careless ones. Inspect the result rather than declaring it polished because a checklist was filled.

## Cinematography requirements

Every animation should include camera movement, pans, zooms, perspective changes and varied shot types rather than feeling flat or retaining one viewpoint. Make each move serve geography, action, emotion or revelation. Mix wider establishing/action views with medium coverage and expressive closer views as the story warrants. Avoid constant floating camera movement that distracts from performance.

Write a shot plan recording time span, shot scale, viewpoint/elevation, focal subject, camera move, action beat and transition. Establish geography and screen direction before crossing an axis; use a motivated transition when changing it. Do not confuse a new background, crop, mirror, shear or zoom of the same frontal cutout with a genuinely different perspective.

For a 2D approach, draw alternate poses/views with foreshortening and viewpoint-consistent landmarks. For a layered-depth approach, establish depth coordinates and a camera model with correct parallax, scale, overlap and occlusion. A flat 2D affine transform cannot reveal hidden surfaces. Do not claim a 3D orbit or perspective change unless the image actually supports that claim. Use eased camera trajectories and stable targets; prevent accidental cropping of hands, feet or key props.

## Expressive performance and smooth motion

Assign each beat an intention and an observable emotional change. Coordinate brows, eyelids, eye direction, mouth shape, head tilt, shoulders, hands and body posture. Include focused eyelines and reactions to events. Blinks and a static smile alone are not an expressive performance; make the emotion readable at final resolution.

Block key poses and timing before adding in-betweens. Use anticipation, a clear action, impact/settle, and follow-through. Establish coherent joint pivots, limb proportions, planted feet and held-prop contacts. Keep collisions, recoil and reactions causally ordered in action scenes. Use smooth, deliberate easing and arcs without losing weight; 24 fps encoding alone does not establish smooth animation. Reserve stepped/held timing for intentional style.

Let hair, fabric and props respond with different bounded delays, not identical sinusoidal oscillation. Inspect interpolation between key poses for deformation, disconnected limbs, slipping grips, foot sliding and popping. Keep face features attached to the head and maintain character identity across alternate views.

## Author neutral human poses before animating

Create and inspect an explicit relaxed pose for each human character and authored viewpoint, separate from ready/combat/brace/gesture poses. For an ordinary arms-at-sides rest, let the shoulders settle, upper arms hang with gravity, elbows retain a gentle natural bend, and hands sit naturally lower beside the hips or thighs according to the character’s proportions and costume. Do not reuse high outward hand targets and sharply bent mirrored elbows as an idle default. Preserve intentional asymmetry, weight distribution and relaxed wrist/finger orientation rather than making a rigid mannequin. Respect the depicted anatomy, mobility and specific action rather than imposing one body template.

Choose each arm’s IK bend branch from the intended silhouette, viewpoint and action. In a frontal relaxed pose, avoid elbows folding inward through the torso with forearms jutting outward; keep the elbows appropriately clear of the body and wrists connected to the forearm. Check shoulder → elbow → wrist ordering and both visible contours. Lowering the hand target and selecting a suitable elbow branch are distinct decisions. Do not globally flip IK signs, prescribe one universal elbow angle, or assume that the same branch works for rest, reaching, running, bracing and overhead views. Keep branch changes continuous and handle unreachable/near-coincident targets without NaNs, snapping or limb-length distortion.

Render believable upper-arm/forearm contours and sleeve joins around the elbow, with deliberate taper, overlap and rounded transitions where the design calls for them. A mathematically valid joint solution can still produce pinched, self-crossing or mechanical-looking arm silhouettes. Check costume seams, cuffs, hand orientation and prop contacts after changing the pose; update effects anchored to wrists from the same solved transform rather than independent offsets.

Before full export, inspect a pose sheet containing neutral rest, movement, action extremes and the transitions between them, in the actual shot viewpoints. Check the full-body silhouette and close arm crops at delivery resolution, with effects disabled as well as enabled. Watch motion to catch branch pops, raised idle fists, mirrored stiffness, torso intersections and detaching cuffs/hands. Recheck existing reach/brace/prop-contact shots after any neutral-pose change. Record the visual finding and correction; valid bone lengths or one clean action frame do not establish a natural rest pose.

## Living environment

Use independent environmental motion appropriate to the setting, such as layered clouds, wind-driven foliage, cloth, drifting particles, moving machinery, distant activity, water or light changes. Vary depth, phase, speed and scale. Tie effects to actions where relevant, such as a shockwave disturbing dust or wind moving hair and banners together. Environmental life must support, not obscure, the character. A single particle overlay or pulsing glow is not enough evidence that a world feels alive. Use GLSL meaningfully for emissive bloom, atmosphere and lighting where appropriate, but preserve facial contrast. Bloom, vignette and grading cannot repair flat or underdeveloped base artwork.

## Staged quality gates

1. **Design review:** inspect a close and wide representative frame. Compare concrete detail, silhouette, materials, face readability and environment depth against the reference or requested style. Correct weak design before rendering hundreds of frames. Include the explicit neutral human pose and verify lowered relaxed hands, appropriate elbow placement and clean arm contours.
2. **Coverage review:** inspect a storyboard/contact sheet of all shots. Confirm visible variation in shot scale and perspective, planned pans/zooms, consistent geography and no reliance on a single transformed view.
3. **Motion sample:** render short samples containing a camera move, facial change, articulated action and transition. Watch at normal speed and inspect critical in-betweens. Check easing, contacts, expression, parallax, silhouettes, occlusion and continuity, including rest-to-movement/action arm transitions and IK branch stability. Inspect transitions for unintended dark/blank frames and accidental fades to black.
4. **Final review:** inspect every shot and transition at delivery resolution and normal playback speed. Include early/middle/late frames from each shot in a contact sheet, then review temporal behavior separately. Run technical video/GLSL tests as well; these do not replace visual review.

Record specific observed defects and fixes. If production constraints prevent meeting a requirement, state what is missing and reduce or renegotiate scope rather than claiming success. Distinguish a graphic illustration, limited animation and fully articulated or depth-aware motion precisely. Avoid claims such as cinematic, premium or high quality without describing the concrete work and evidence.
