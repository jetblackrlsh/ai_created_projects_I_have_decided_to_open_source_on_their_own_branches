# Parity candidate formats and APIs

All ordinary .jet2d.json projects retain format jet2d/version1. Audio format stays compatible with1.1.0. No existing accepted film is overwritten.

## Independent still

StudioPrint2D.capture(project, globalTime) returns {format:"jet2d-still",version:1,title,project,time,captions}. Its project contains one deep-copied visual scene, no audio, and its time is local to that scene. Edit that copy's nodes/camera/keys/time, not the movie. StudioPrint2D.validateStill checks it; await StudioPrint2D.still(still,{width,height,captions,fit}) returns a fresh canvas. fit is contain,cover or stretch. Save as .jetstill2d.json.

## Editable comic

StudioPrint2D.createComic(still) returns {format:"jet2d-comic",version:1,title,pages}. Each page has layout,title,panels and optional background/text/textColor. Each panel has an independent snapshot (the still format), optional caption,fit and balloons. Layouts: cover,one,two,four,six,nine,whos-who,credits.

A balloon contains kind (speech/thought/caption),text,x,y,w,h and optional tail:[x,y],fontSize,fill,border,borderWidth,color,allCaps,strokeColor,strokeWidth. Position/size/tail are fractions of its panel. Font size is based on a1275-pixel page width and scales with the page. Text must fit; errors never silently drop words or panels. validateComic,page(comic,index,options) and pdf(comic,options) are shared browser/native entry points. PDF pages are rendered images on US Letter pages; keep .jetcomic2d.json as editable source.

## Timed ownership

A node may have owners:[{t,parentId,x?,y?,rotation?},…]. Times are strictly increasing local scene seconds. parentId is another group in the same scene, or null for the stage root. A node is rendered once, under its active owner. Coordinates after transfer are local to that parent. Optional placement values override the node's corresponding motion properties until the next owner key. This does not calculate a world-position-preserving handoff automatically. Cycles/unknown owners reject. Duplicate-scene and reusable-template import remap ownership references. A template with owners outside its saved group is refused; save the complete project or edit the keys explicitly.

## Artwork

Embedded image nodes accept PNG/JPEG/WebP data URIs, with declared-type signature checks; remote hrefs and SVG-as-image data remain rejected. Use ordinary transforms/keys on the image layer. Original SVG remains editable; a bitmap's individual painted shapes do not become vectors.

Reusable art uses {format:"jet2d-art-template",version:1,width,height,node}; imported IDs remap to prevent collisions. Character semantic joint metadata is retained so baked action presets can still find joints after renaming. Scene backgrounds/characters/props/effects have library metadata but remain ordinary editable SVG trees.

## Voice and recording

VoiceTools2D.generate(text,preset) returns PCM-WAV bytes, parsed metadata and exact input text/preset. It uses bundled existing synthetic voices, not browser speech synthesis or a remote service. Replacement narration is explicit, must fit the scene, and does not silently rewrite captions.

StudioRecorder2D.plan(project,firstScene,lastScene) resolves range and overlapping cues. controls evaluates the same audio envelopes used in preview/export. record(project,{first,last,signal,onProgress}) returns {blob,extension,mime,duration,mode}. It is browser-only, real-time and codec-dependent. Audio scheduling is prepared while the audio clock is suspended, then started with recording; cancel/failure closes resources and discards partial output. Actual browser capture remains an outstanding release gate.

## Scene edits and global audio

The editor now uses StudioTimeline2D for resize/duplicate/delete operations. Resizing ripples later cues; crossing music/effects can extend/shorten only within valid source limits. Shortening that would cut a scene cue, or resizing across a narration boundary, rejects and asks for explicit cue editing. Duplication copies only the selected scene's audio interval, splits cross-boundary sources with retained source offsets, and moves following audio. Deletion removes the corresponding interval and ripples later cues. Split edges receive short click-protection fades. These operations use normal editor undo/rollback; nothing in an accepted saved movie changes automatically.
