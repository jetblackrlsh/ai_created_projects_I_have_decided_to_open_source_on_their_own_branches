# Action and emotion presets

This expansion adds 38 reusable articulated actions to the original 20, for 58 total. Use the blank articulated person puppet, not the older whole-limb catalog actor. Read ARTICULATED-PUPPET.md for rig and artwork editing.

## Quick start

1. Add or select an articulated person puppet.
2. Choose All, Everyday, Combat, Powers or Emotions in the category selector.
3. Pick an action, duration, intensity (0.25–1.5), and optional left/right mirror.
4. Optionally enable the matching prop/effect. Without it, only the body and face animate.
5. Apply at the playhead. It must fit the scene and not overlap another registered clip on that puppet.
6. Preview the whole motion, especially anticipation, the action beat and recovery. Adjust the editable keys for your shot.
7. Save the project, or save the selected preset as a portable .jetmotion2d.json template.

Applying a preset does not generate sound. Add music and action-timed sound effects separately through the existing audio workflow. The included demonstration projects contain music and effects as examples.

## Combat — 14

- punch-jab: short straight strike and return to guard.
- punch-cross: stronger torso turn and extended strike.
- punch-uppercut: dip and rising strike.
- kick-front: stylized forward-diagonal extension, not a depth-facing kick toward the camera.
- kick-side: higher sideways leg extension.
- weapon-slash: diagonal swing; optional generic sword.
- weapon-overhead: overhead swing; optional generic sword.
- shoot-pistol: aim, stylized recoil and recovery; optional pistol silhouette and flash.
- shoot-rifle: two-hand long-gun pose and recoil; optional generic long-gun silhouette and flash.
- block-high: raised defensive guard; optional shield.
- block-low: lower crouched guard; optional shield.
- hit-recoil: flinch and upper-body recoil.
- knockback: exaggerated backward stagger, then recovery.
- dodge: lean and duck away.

## Powers — 8

- cast-projectile: wind up and extend a hand; optional glowing orb. It does not launch a separate projectile automatically.
- cast-area: spread both arms; optional expanding aura.
- channel-power: sustained arm/hand performance with a subtle pulse; optional orb.
- charge-release: gather then release energy; optional aura.
- shield-power: defensive gesture; optional barrier ring.
- telekinesis: focused reaching gesture; optional orb. Animate the affected object separately.
- heal: gentle two-hand blessing gesture; optional green orb.
- transform: raised-arm transformation pose; optional aura. Replace or swap character artwork separately.

## Emotions — 16

happy, laugh, angry, furious, afraid, panic, surprised, confused, curious, disgusted, embarrassed, proud, crying, relieved, determined and tired.

These combine torso, head, shoulders, brows, eyes, mouth and hand shapes. Crying is a performed gesture, not simulated tears. The neutral face uses simple shapes rather than a full expression/mouth-shape library. Restyle the artwork for stronger acting if desired.

## Motion and accessory behavior

Each action has a neutral start, preparation, action/hold and return. Some expressive/channeling actions add a small oscillation during the hold. Intensity changes transform offsets, not clip duration or hand-state visibility. Mirror swaps semantic left/right channels and reverses horizontal movement and rotations.

Optional props are scene-local SVG children attached to a wrist, or behind the puppet for an aura. They are visible only during their preset interval; gun flashes occur at the action peak. They are generic cartoon graphics, not weapon operation instructions or a physical simulation. Props can be recolored and edited in the normal layer editor. Clear selected puppet animation removes preset-generated props and their interval records as well as keys; other characters and custom artwork remain.

A saved .jetmotion2d.json contains motion, name and options, not the actual accessory SVG. Loading a clip applies motion only; create the accessory with addActionProp or use the preset UI checkbox when applying the named preset. Project saves preserve the actual accessory nodes and their keys. Do not assume an imported clip automatically carries its visual effects or audio.

The 38-action showcase is split into Combat, Powers and Emotions editable projects to stay within the existing 5,000-node safety limit. The combined MP4 demonstrates all three. Do not concatenate all their nodes into one oversized project without deliberately simplifying it.

## Programmatic use

Load core.js, puppet.js, then puppet-actions.js (the studio already does this). StudioPuppet2D.makeClip(name, seconds, {mirror: false, intensity: 1}) creates a semantic clip; applyClip(rig, clip, start) writes it. addActionProp(rig, clip, start) adds its matching visual accessory when one exists, or returns false. expandedActions lists these 38 names; actionInfo contains category, label, prop and action-peak fraction. All original twenty no-options clips remain unchanged.

## Limits and verification

Front-view forward kinematics only. No inverse kinematics, physical balance, automatic foot planting, collision/contact system, combat rules, target tracking, automatic lipsync, or arbitrary-proportion retargeting. Mirroring and large intensities can need shot-specific adjustments. Two actors do not automatically line up their attack and reaction: stage, time and review them yourself.

Native SVG/raster tests cover all 38 actions at three intensities in both directions, including delayed start/end visibility and restyling. UI handler tests cover category filters, mirrored prop placement, invalid settings, overlap rejection, cancellation and clearing. Real-browser playback, file dialogs and MediaRecorder remain unverified; the user has explicitly made those checks non-blocking.
