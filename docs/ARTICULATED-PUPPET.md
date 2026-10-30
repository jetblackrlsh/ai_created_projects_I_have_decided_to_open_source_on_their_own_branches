# Blank articulated person puppet — 1.4.0-rc1

This is a new, separate reusable humanoid rig. Existing character templates, story projects and approved film exports are unchanged. The older whole-arm/whole-leg library is still available, but its controls deliberately do not target the new puppet.

## What is articulated

The neutral puppet has **17 skeletal controls**: root, pelvis, torso, neck, head, left/right shoulders, elbows, wrists, hips, knees and ankles. These are nested SVG groups with meaningful pivots. An elbow moves its forearm and hand without moving the shoulder; rotating a hip carries its knee/ankle with it.

There are **29 named controls in total**, counting the skeleton plus two eyes, two eyebrows, mouth, hair and three alternative hand-art states per side. The 29 count is not 29 anatomical joints. Hands have open/fist/point artwork; individual fingers are not independently articulated.

This is a front-view, forward-kinematic cutout rig. There is no automatic inverse kinematics, planted-foot solver, physical balance, collision avoidance, automatic lip sync, depth turn or side/back-view art system. A walking clip animates in place; move the root separately for travel. Some poses are stylized and may need adjustment for a particular shot.

## First use

1. Extract the whole studio ZIP and open START.html.
2. Find **Blank articulated person puppet** and click **Add blank person puppet**.
3. Choose skin, shirt, pants, shoes and hair colors. Enable **Show hair** if wanted; click **Apply appearance only**.
4. Select a joint such as elbowR, set a rotation, and click **Key this pose at playhead**. Rotation is in degrees. X/Y are local offsets from the neutral joint anchor, not world coordinates.
5. Choose a hand and open/fist/point, then click **Key hand shape**.
6. Move the playhead earlier if necessary, choose an action/duration, and click **Apply puppet action at playhead**.
7. Preview the motion, then save the project JSON. All layers, keys, style and puppet metadata are portable.

Action clips must fit the scene and cannot overlap another registered clip on the same puppet. The error preserves the existing project. Use **Clear selected puppet animation** only when you intend to discard that puppet's keys and return it to neutral; its appearance and other characters remain unchanged. This asks for confirmation. Editor undo is available for committed edits, but saving a backup is still wise.

The pose controls key a complete sampled pose at the chosen time, not just the visible numeric field. A pose key added within a clip changes that animation. Refresh puppets after switching scenes or adding/removing actors elsewhere.

## Reusable actions and poses

The original twenty articulated presets (unchanged): idle, breathe, blink, walk, run, wave, talk, nod, point, reach, carry, push, sit, stand-up, crouch, kneel, jump, celebrate, sad, bow.

They explicitly animate the relevant elbow, knee and wrist chains rather than only swinging a single limb. Motion remains editable as standard node keys. The talk preset is a generic mouth/gesture cycle, not phoneme timing. Clip templates are sampled at 24 keys/second; duration is limited to 30 seconds per template.

- **Save reusable pose** writes `.jetpose2d.json`, sampled at the playhead.
- **Save selected action template** writes `.jetmotion2d.json` for the chosen preset and duration. It does not export arbitrary timeline edits as a new clip.
- **Load pose/action template** retargets by semantic joint name, not by character-specific node IDs. Styles and base placement remain that character's own; intentional relative root movement in a pose/clip is retained.
- Both formats declare `humanoid-v1`. Unknown rig versions, joints, non-finite values or malformed frame sequences fail before mutation.

Examples/Articulated-Puppet/ contains an editable demonstration project, a wave template, a bent-elbow pose, a torso SVG and reviewed contact sheets. The two demonstration MP4s show all 20 presets, with the existing Tranquility music. These are motion studies, not narrated stories.

## Restyle without re-rigging

The appearance buttons change named palette slots without changing the joint hierarchy or motion keys. Skin, clothing and hair are a deliberately simple starting point; do not treat recoloring alone as a finished character design.

For a custom costume/head/hand shape:

1. Prepare static SVG artwork, using the supported SVG subset. Scripts, external images, filters and unsupported SVG elements are rejected by the existing importer.
2. Select the target joint. For a torso, choose **torso**.
3. Open **Replace selected joint artwork with SVG**.
4. Set local X/Y alignment and select the SVG. The example torso is 56×110 with offsets X=-28, Y=-104.
5. Inspect the result while bending and playing actions. Adjust imported artwork through the regular layer editor as needed.

Only the selected joint's decorative shapes are replaced. Child joints and animation remain in place. The importer normalizes the SVG viewBox origin; offsets then align it to the pivot. A head replacement keeps its facial child controls, so remove/hide or reposition those intentionally if the new face already contains eyes/mouth. Hair visibility still follows Show hair. Custom imported colors are preserved rather than automatically assigned to palette slots.

Keep semantic joint groups, puppetJoint metadata and bindPose anchors intact. You may replace their artwork; deleting/renaming the skeleton breaks retargeting. For a character with different proportions, adjust anchors/geometry deliberately and retest every action. This version does not automatically solve motion for arbitrary proportions.

## API

Browser: `StudioPuppet2D`. Node: `require('./app/puppet.js')`.

```js
const rig = StudioPuppet2D.create('hero', 480, 450);
StudioPuppet2D.restyle(rig, {shirt:'#5577aa', skin:'#9a6848', hairVisible:true});
const clip = StudioPuppet2D.makeClip('wave', 2);
StudioPuppet2D.applyClip(rig, clip, 0);
const savedPose = StudioPuppet2D.capturePose(rig, 0.7, 'Greeting');
// Apply to another compatible rig at scene-local time 1:
StudioPuppet2D.applyPose(otherRig, savedPose, 1);
```

`replaceArtwork(rig, jointName, staticNodes, {x,y})` accepts validated studio SVG nodes and preserves skeletal descendants. Imported art may not carry owners, animation keys or puppet-joint metadata. `clearAnimation(rig)` resets keys/clip registrations, not styling. `joint(rig,name)` returns the editable node.

All times passed to the puppet API are local scene seconds. The UI converts its global playhead to local time. The public core remains unchanged; no runtime rig-specific renderer is required. Baked puppet animation remains ordinary editable SVG/group transforms.

## Verification and limits

Automated checks cover independent elbows/knees, constant segment length, semantic retargeting, style/key invariance, delayed-clip boundaries, overlap rejection, invalid input transaction safety, 120 action-time SVG samples, and native raster contact sheets. Actual UI handlers are exercised with jsdom/native Canvas, including adding/restyling/keying, hand states, template downloads, protected artwork replacement and unsafe-SVG rejection.

The 40-second normal/20-second 2× demonstration was rendered through the actual SVG engine and native Canvas, mixed with music and fully decoded by FFmpeg. This is not proof of physical browser file dialogs, playback or MediaRecorder. Those remain unverified, and the user's accepted non-blocking browser scope remains in effect.

## Expanded actions

Version 1.4.0 adds 38 combat, power and emotion presets, category filters, mirroring, intensity and optional generic props/effects. See ACTION-PRESETS.md. There are now 58 presets total. The older 20-action demonstration remains unchanged.
