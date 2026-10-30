# Reusable scene library (1.5.0-rc1)

This adds 72 original generic SVG props, 42 layered settings and 22 transparent animated overlays. The older catalog remains available unchanged: 9 props, 25 named backgrounds and 7 effects. Some older backgrounds share layouts. These new assets are deliberately simple, restylable flat-vector starter art, not detailed painted scenery or physical simulations.

## Quick start
1. Extract the complete ZIP and open START.html. Find **Reusable scene library**.
2. Choose a background category and setting, then Add background. It replaces only a background previously added by this new panel, preserving characters, props and audio. Older manually placed backdrops remain: remove those explicitly if they obscure the new background.
3. Add a blank articulated puppet in the puppet panel. Refresh the scene-library puppet list.
4. Pick a prop. For a handheld object, enable attachment, select the actor and left/right hand, and set scale, rotation and grip offsets before adding. Left/right are the puppet's semantic sides, not necessarily the viewer's. Existing hand props are never silently replaced.
5. Apply the matching puppet motion with preset accessory insertion OFF. A manually attached weapon and the automatic action accessory cannot occupy the same hand.
6. At the desired playhead time, select an overlay, tint, duration, size and intensity. Add it, then use the layer editor to reposition it or modify keys.
7. Add music and separate sound cues, preview, and Save project. Visual fire/explosions do not create sound automatically.

The new preview is Examples/Scene-Library/Scene-Library-Showcase.mp4, with a pitch-preserving 2x companion and editable project. It demonstrates eight combinations and then every overlay individually. Music and illustrative sound cues are embedded; they are not automatic effect-to-sound bindings.

## Props and motion fit
- Fantasy/historical: blades, axes, hammer, mace, club, spear, halberd, bows, shields, staff and wand.
- Modern/science fiction: revolver, handgun, long gun, blaster, energy sword, scanner and hologram projector.
- Daily life: mugs, bottles, dishes, food, books, scrolls, maps, phone, camera, microphone and laptop.
- Adventure/tools/scenery: treasure, keys, luggage, lights, hand tools, furniture, containers, rope, telescope, potions, crystal ball, ball, gift and guitar.

Each prop has suggested actions in the panel and a stable grip origin. Suggestions are starting points, not a guarantee of contact. Handheld props inherit wrist/arm animation. There is no two-handed IK, collision detection, automatic aiming, projectile flight or automatic object interaction. Bow shooting and instrument playing do not have bespoke finger rigs. Stage-only scenery cannot attach through the hand helper. A shield generally belongs on the blocking hand; inspect mirrored actions. Adjust wrist poses, prop rotation and scale for the shot.

Props added freely are normal scene layers. Library hand-prop removal preserves other art and animation. Clearing a puppet action removes its generated accessories, but intentionally preserves manually attached reusable props.

## Backgrounds
Nature, fantasy, modern and science-fiction sets have editable groups and retain a foreground acting area. Shared stylistic elements keep sets consistent; no claim is made that every setting has wholly unique geometry. Groups are normal SVG layers, so users can recolor, hide or animate pieces for parallax. Parallax is not automatic.

## Visual effects
Atmosphere: rising smoke, drifting fog, dust.
Elements: flames, cartoon explosion, debris, water splash, bubbles, embers.
Weather: rain, snow, wind, leaves.
Magic/energy: electric arcs, magic motes, beam, portal.
Impacts: speed lines, impact starburst, shockwave.
Celebration: confetti, floating hearts.

Effects use transparent artwork and deterministic baked transform/opacity keys. Duration 0.1–30 seconds, intensity 0.25–2, scale 0.1–4, six-digit tint. Timing is local to the scene and cannot overrun it. They disappear before/after their interval. Weather and flame motion repeat within that interval; extend by adding another instance. An effect's baked particle geometry is not regenerated merely by editing its metadata: recreate it with different options, or edit its layers/keys. They are stylized 2D overlays, not a fluid/particle physics engine. Transparent artwork does not imply an alpha-channel MP4 export; conventional MP4 exports composite the scene.

## Headless authoring
Require app/core.js, app/puppet-actions.js and app/scene-library.js. StudioSceneLibrary2D exposes props/backgrounds/effects metadata and:
- prop(kind, uniqueId)
- background(kind, uniqueId, width, height)
- effect(kind, uniqueId, start, duration, x, y, {color, intensity, scale, width, height})
- attach(puppet, kind, uniqueId, 'L' or 'R', {scale, rotation, x, y})
- remove(puppet, side)

Use globally unique IDs, insert returned nodes into the intended scene, validate the whole project, and save it. Attachment is to humanoid-v1 wrist groups only. Ordinary background/FX factories do not mutate a project.

## Verification and limits
See SCENE-LIBRARY-TEST-REPORT.json and example verification files. All assets were rendered natively; all overlays checked at multiple times and two intensities; UI handlers exercised with jsdom/native canvas. Static contact sheets and motion samples were inspected. Browser-specific playback/file dialogs/recording remain unverified, consistent with the non-blocking browser acceptance policy. Existing 58-preset regression checks remain separate. No claim of perfect visual contact, physical realism or full SVG support.

## Exact inventory

### props (72)
- longsword — Longsword (Fantasy weapons)
- greatsword — Greatsword (Fantasy weapons)
- rapier — Rapier (Fantasy weapons)
- katana — Curved katana (Historical weapons)
- scimitar — Scimitar (Fantasy weapons)
- dagger — Dagger (Fantasy weapons)
- battleaxe — Battle axe (Fantasy weapons)
- double-axe — Double axe (Fantasy weapons)
- warhammer — War hammer (Fantasy weapons)
- mace — Mace (Fantasy weapons)
- wood-club — Wooden club (Fantasy weapons)
- halberd — Halberd (Historical weapons)
- wood-spear — Long spear (Historical weapons)
- wizard-staff — Crystal staff (Magic weapons)
- wand — Magic wand (Magic weapons)
- longbow — Longbow (Historical weapons)
- crossbow — Crossbow (Historical weapons)
- round-shield — Round shield (Armor)
- kite-shield — Kite shield (Armor)
- buckler — Small buckler (Armor)
- revolver — Western revolver (Modern weapons)
- handgun — Modern handgun (Modern weapons)
- shotgun — Wood-stock long gun (Modern weapons)
- scifi-blaster — Science-fiction blaster (Science fiction props)
- energy-sword — Energy sword (Science fiction props)
- scifi-rifle — Science-fiction long gun (Science fiction props)
- scanner — Hand scanner (Science fiction props)
- holo-projector — Hologram projector (Science fiction props)
- mug — Mug (Food and daily life)
- water-bottle — Water bottle (Food and daily life)
- plate — Plate (Food and daily life)
- apple — Apple (Food and daily life)
- bread — Bread loaf (Food and daily life)
- bowl — Bowl (Food and daily life)
- book — Closed book (Documents and devices)
- open-book — Open book (Documents and devices)
- scroll — Scroll (Documents and devices)
- map — Folded map (Documents and devices)
- quill — Quill pen (Documents and devices)
- phone — Phone (Documents and devices)
- laptop — Laptop (Documents and devices)
- camera — Camera (Documents and devices)
- microphone — Microphone (Documents and devices)
- key — Key (Treasure and travel)
- coin-pouch — Coin pouch (Treasure and travel)
- gem — Cut gemstone (Treasure and travel)
- backpack — Backpack (Treasure and travel)
- suitcase — Suitcase (Treasure and travel)
- torch — Lit torch (Tools)
- flashlight — Flashlight (Tools)
- shovel — Shovel (Tools)
- pickaxe — Pickaxe (Tools)
- wrench — Wrench (Tools)
- tool-hammer — Claw hammer (Tools)
- broom — Broom (Tools)
- umbrella — Open umbrella (Treasure and travel)
- medical-kit — Medical kit (Tools)
- toolbox — Toolbox (Tools)
- crate — Wood crate (Furniture and scenery)
- barrel — Barrel (Furniture and scenery)
- chair — Chair (Furniture and scenery)
- table — Small table (Furniture and scenery)
- treasure-chest — Treasure chest (Treasure and travel)
- signpost — Blank signpost (Furniture and scenery)
- rope-coil — Coiled rope (Treasure and travel)
- telescope — Telescope (Treasure and travel)
- candle — Candle (Food and daily life)
- potion — Potion flask (Magic props)
- crystal-ball — Crystal ball (Magic props)
- soccer-ball — Patterned ball (Food and daily life)
- gift-box — Gift box (Food and daily life)
- guitar — Guitar (Food and daily life)

### backgrounds (42)
- meadow — Meadow (Nature)
- deciduous-forest — Deciduous Forest (Nature)
- pine-forest — Pine Forest (Nature)
- rainforest — Rainforest (Nature)
- swamp — Swamp (Nature)
- desert-dunes — Desert Dunes (Nature)
- red-canyon — Red Canyon (Nature)
- snowy-forest — Snowy Forest (Nature)
- tundra — Tundra (Nature)
- alpine-mountains — Alpine Mountains (Nature)
- tropical-beach — Tropical Beach (Nature)
- open-ocean — Open Ocean (Nature)
- underwater-reef — Underwater Reef (Nature)
- volcano — Volcano (Nature)
- crystal-cavern — Crystal Cavern (Nature)
- moonlit-forest — Moonlit Forest (Nature)
- farmstead — Farmstead (Fantasy)
- medieval-village — Medieval Village (Fantasy)
- castle-courtyard — Castle Courtyard (Fantasy)
- tavern-interior — Tavern Interior (Fantasy)
- stone-dungeon — Stone Dungeon (Fantasy)
- ancient-temple — Ancient Temple (Fantasy)
- misty-graveyard — Misty Graveyard (Fantasy)
- western-town — Western Town (Modern)
- city-day — City Day (Modern)
- city-night — City Night (Modern)
- urban-alley — Urban Alley (Modern)
- city-park — City Park (Modern)
- subway-platform — Subway Platform (Modern)
- office — Office (Modern)
- classroom — Classroom (Modern)
- hospital-room — Hospital Room (Modern)
- kitchen — Kitchen (Modern)
- bedroom — Bedroom (Modern)
- living-room — Living Room (Modern)
- warehouse — Warehouse (Modern)
- starship-bridge — Starship Bridge (ScienceFiction)
- station-corridor — Station Corridor (ScienceFiction)
- alien-planet — Alien Planet (ScienceFiction)
- cyberpunk-street — Cyberpunk Street (ScienceFiction)
- wasteland — Wasteland (ScienceFiction)
- moon-base — Moon Base (ScienceFiction)

### effects (22)
- smoke-plume — Rising smoke (Atmosphere)
- ground-fog — Drifting fog (Atmosphere)
- fire-flames — Looping flames (Elements)
- fireball-burst — Cartoon explosion (Impacts)
- debris-burst — Debris burst (Impacts)
- electric-arcs — Electric arcs (Magic and energy)
- magic-particles — Magic motes (Magic and energy)
- falling-snow — Snowfall (Weather)
- rain-streaks — Rain (Weather)
- wind-gust — Wind gusts (Weather)
- dust-cloud — Dust cloud (Atmosphere)
- water-splash — Water splash (Elements)
- rising-bubbles — Bubbles (Elements)
- speed-lines — Speed lines (Impacts)
- impact-star — Impact starburst (Impacts)
- shockwave — Shockwave ring (Impacts)
- confetti — Confetti (Celebration)
- falling-leaves — Falling leaves (Weather)
- floating-hearts — Floating hearts (Celebration)
- embers — Fire embers (Elements)
- energy-beam — Energy beam (Magic and energy)
- portal-swirl — Portal swirl (Magic and energy)
