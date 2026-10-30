# Stagecraft: characters, staging and speech (1.6.0-rc1)

## What changed
- Front, back, left and right view-specific cutout characters. Same identity/appearance descriptor generates matching views. Back faces stay hidden even during expression presets; profile faces have a nose silhouette and one visible eye.
- Six hair styles, beard/glasses, four outfit silhouettes and seeded extras with reusable appearance descriptors. Keep a cast ledger: reuse an identity only when it is the same person, not because a convenient extra already exists.
- Timed prop visibility, to hide weapons during passive gestures instead of waving them through faces. Hidden means off-screen/stowed for staging, not lost or destroyed. A narratively dropped sword must still be shown on the ground.
- Travel bakes walk/run/quiet/carry leg motion and root displacement together. It rejects overlapping registered actions without changing the actor. No physical foot-plant solver is claimed.
- A paired lift-and-carry helper connects a back-view carrier and a side-view passenger, with an explicit draw order. It is a starting pose, not an IK/physics constraint. Review costume alignment and each contact frame.
- Stable project voice casting and speaker-labelled speech cues. Different characters get different bundled synthetic presets. A speaker's preset cannot silently change mid-project.
- Reusable title/credits cards. Narrate both with the narrator, and size the card to the recorded duration.

## Browser controls
Open START.html and find “Character views, staging & dialogue.” Choose identity, view, appearance or an extra seed, and add the character. For the same person in another angle, keep their identity and appearance settings. View changes are cuts between separately authored art variants, not simulated 3D turns. Existing custom front art is not automatically reverse-engineered into a back view.

Select an actor root, set destination X, duration and gait, then apply travel at the playhead. Select the weapon/prop itself and restrict its visibility interval when needed. The interval hides it before and after; it does not delete the prop. New panel changes load a validated project copy; save a backup before a large edit. Standard imported SVG undo remains available, but panel commits do not promise preservation of earlier undo history.

Lock a speaker ID to a voice preset, enter the actual line, and generate/add it. Speech must fit the current scene. Reuse that ID for all their later lines. Speaker cues use the narration mix bus for intelligibility/ducking, with separate speakerId, speechRole, text and voicePreset metadata. This is not voice cloning. Six bundled synthesis presets remain intentionally synthetic, not natural human voice acting. Mouth motion is illustrative, not phoneme lip sync.

Append title/credits cards with the card controls, then add narrator speech at the card's playhead. The paired carry helper is currently available to script/agent authors; the UI can pose its resulting ordinary SVG keys afterward.

## Agent/Node API
Load app/stagecraft.js after puppet-actions.js and scene-library.js. It exports StudioStagecraft2D (or require it in Node).

- createCharacter(id,x,y,{identity,view,hairStyle,beard,glasses,outfit,build,style}) creates an ordinary humanoid-v1 rig. Views: front/back/right/left. Hair: short/bald/curly/long/dreads/ponytail. Outfit: shirt/armor/coat/tunic. Build: .7–1.4.
- extraDescriptor(seed,excluded) returns a stable appearance with a signature. Pass previously used signatures/descriptors to exclude repeats. Visually inspect near-matches and deliberately recolor extras who might still resemble leads. The generator has finite combinations; seeds alone are not an unlimited uniqueness guarantee.
- visibility(prop,[[start,end],...],sceneDuration) bakes hold opacity keys. Intervals cannot overlap. Preserve narrative ownership; use only for visibility.
- travel(rig,{from:[x,y],to:[x,y],start,duration,gait}) combines linear displacement and articulated gait. Gait: walk/run/quiet/carry. Max30seconds per segment. Use proportional speed and scene bounds. Keep later generic action clips from overwriting intended root motion.
- carryPair(carrier,passenger,{start,lift,duration,from,to}) requires back carrier and side passenger. It returns drawOrder; place passenger behind carrier. Review endpoints, bend/shoulder contact, ongoing leg motion and release. It does not prevent scene overlaps or infer the correct hand grip.
- cast(project,speakerId,preset) locks narrator/warm/bright/gruff/whisper/robot. To intentionally recast, edit the map and regenerate all affected lines, not one unnoticed line.
- speech(project,speakerId,text,start,VoiceTools2D.generate(text,preset)) embeds actual voice bytes with speaker metadata. It does not invent dialogue or fit scene length automatically; validate the complete project afterward.
- card(id,title,lines,duration,width,height) creates an editable title/credit scene. It does not generate audio by itself.

## Adaptation acceptance
Create a source paragraph → scene → utterance ledger. Convert reported dialogue into direct speech when supported. Preserve facts, intent, uncertainty and the ending; label dramatized dialogue rather than calling it a verbatim journal reading. Do not invent words for a conversation the dreamer explicitly cannot remember.

Before movie export, inspect all view changes, pickup/carry contacts, grounded travel, passive weapon visibility, extra identities, speaker assignments, introduction and credits. Verify generated audio files differ for cast presets and consistent speakers keep the same preset. Keep music/SFX mandatory and audible in both speeds.

## Verification scope
New API tests cover four views, hidden back faces, deterministic SVG/JSON,18 distinct extra descriptors, travel keys, overlap rollback, visibility, carry pairing, speaker-lock rejection, cards and invalid inputs. Actual new UI handlers plus SVG import/edit/undo/save/reload are exercised in a jsdom/native-canvas harness. Existing58 actions pass1824 raster regression samples. Physical Chrome playback/recording is not verified in this environment. These are view-specific 2D puppets, not automatic 3D rotation, IK, planted feet, collision or phoneme lip sync.
