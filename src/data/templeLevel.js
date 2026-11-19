// Built-in Campaign Level: "The Temple of the Four Elements"
// Tile legend:
// 0 = Void/Wall, 1 = Stone Floor, 2 = Temple Marble, 3 = Pillar (solid),
// 4 = Fire Floor, 5 = Water Floor, 6 = Earth Floor, 7 = Air Floor,
// 8 = Sanctum Carpet, 9 = Temple Altar (interactive/visual), 10 = Torch Wall

export const TILE_SIZE = 48;

export const TILE_DEFS = [
  { id: 0, name: 'Dungeon Wall', solid: true, color: '#1b1d2b' },
  { id: 1, name: 'Stone Floor', solid: false, color: '#313548' },
  { id: 2, name: 'Temple Marble', solid: false, color: '#4c516d' },
  { id: 3, name: 'Pillar', solid: true, color: '#616785' },
  { id: 4, name: 'Crucible (Fire)', solid: false, color: '#5c241e' },
  { id: 5, name: 'Tidepool (Water)', solid: false, color: '#1c3f59' },
  { id: 6, name: 'Monolith (Earth)', solid: false, color: '#2b472f' },
  { id: 7, name: 'Skyfloor (Air)', solid: false, color: '#39345e' },
  { id: 8, name: 'Sanctum Carpet', solid: false, color: '#78263b' },
  { id: 9, name: 'Sanctum Altar', solid: false, color: '#c89b3c' },
  { id: 10, name: 'Torch Wall', solid: true, color: '#30293d' },
];

export function createTempleOfFourElementsLevel() {
  const width = 36;
  const height = 28;
  const tiles = Array.from({ length: height }, () => Array(width).fill(0));

  const fillRect = (x1, y1, x2, y2, tile) => {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        if (y >= 0 && y < height && x >= 0 && x < width) tiles[y][x] = tile;
      }
    }
  };

  // Courtyard (South center - driven-out worshippers & High Priest Aldric)
  fillRect(13, 21, 22, 26, 1);
  fillRect(16, 20, 19, 25, 8); // red carpet leading into temple
  tiles[21][13] = 10; tiles[21][22] = 10; tiles[26][13] = 10; tiles[26][22] = 10;

  // Entrance hallway into Central Sanctum
  fillRect(16, 17, 19, 21, 2);
  fillRect(17, 17, 18, 21, 8);

  // Central Sanctum (Temple Heart)
  fillRect(12, 9, 23, 17, 2);
  fillRect(15, 11, 20, 15, 8);
  // Central Altar
  fillRect(17, 12, 18, 13, 9);
  // Four Sanctum pillars
  tiles[10][13] = 3; tiles[10][22] = 3;
  tiles[16][13] = 3; tiles[16][22] = 3;
  // Torches on sanctum walls
  tiles[8][15] = 10; tiles[8][20] = 10;
  tiles[18][14] = 10; tiles[18][21] = 10;

  // --- NORTH-WEST WING: Crucible of Flame (Ignis-Kael) ---
  fillRect(9, 10, 12, 12, 1); // connecting corridor
  fillRect(2, 2, 10, 10, 4);
  fillRect(4, 4, 8, 8, 1);
  tiles[3][3] = 3; tiles[3][9] = 3; tiles[9][3] = 3;
  tiles[1][6] = 10; tiles[6][1] = 10;

  // --- NORTH-EAST WING: Nave of Tides (Nerai-Vex) ---
  fillRect(23, 10, 26, 12, 1); // connecting corridor
  fillRect(25, 2, 33, 10, 5);
  fillRect(27, 4, 31, 8, 2);
  tiles[3][26] = 3; tiles[3][32] = 3; tiles[9][32] = 3;
  tiles[1][29] = 10; tiles[6][34] = 10;

  // --- SOUTH-WEST WING: Crypt of Stone (Grol-Makh) ---
  fillRect(9, 15, 12, 16, 1); // connecting corridor
  fillRect(2, 15, 10, 24, 6);
  fillRect(4, 17, 8, 22, 1);
  tiles[16][3] = 3; tiles[23][3] = 3; tiles[23][9] = 3;
  tiles[25][6] = 10; tiles[19][1] = 10;

  // --- SOUTH-EAST WING: Spire of Gales (Vael-Zeph) ---
  fillRect(23, 15, 26, 16, 1); // connecting corridor
  fillRect(25, 15, 33, 24, 7);
  fillRect(27, 17, 31, 22, 2);
  tiles[16][32] = 3; tiles[23][26] = 3; tiles[23][32] = 3;
  tiles[25][29] = 10; tiles[19][34] = 10;

  // Northern reliquary alcove (bonus treasure room above Central Sanctum)
  fillRect(16, 4, 19, 9, 2);
  fillRect(14, 2, 21, 5, 2);
  tiles[2][15] = 3; tiles[2][20] = 3;
  tiles[1][17] = 10; tiles[1][18] = 10;

  return {
    version: 1,
    id: 'temple_of_four_elements',
    name: 'The Temple of the Four Elements',
    description:
      'Four elemental demons have seized the Sanctum of the Fourfold Light and driven out its worshippers. Free the temple for High Priest Aldric, pledge allegiance to a single elemental, or deceive all four to claim the temple as your own.',
    isTempleCampaign: true,
    templeTheme: 'corrupted', // corrupted | light | fire | water | earth | air | master
    width,
    height,
    spawn: { x: 17.5 * TILE_SIZE, y: 24.5 * TILE_SIZE },
    tiles,
    npcs: [
      {
        id: 'priest_aldric',
        name: 'High Priest Aldric',
        role: 'priest',
        x: 17.5 * TILE_SIZE,
        y: 22.3 * TILE_SIZE,
        color: '#f8fafc',
        accent: '#facc15',
        dialogue:
          'Champion! Four elemental demons have desecrated our sacred temple and driven out our flock. Venture into the four wings and banish them—return victorious and I shall ordain you a Disciple of the Light and teach you Exorcism.',
        quest: {
          title: 'Free the Fourfold Temple',
          objectiveType: 'temple_campaign',
          targetCount: 4,
          rewardGold: 250,
          rewardSpell: 'exorcism',
          rewardTitle: 'Disciple of the Fourfold Light',
        },
      },
      {
        id: 'worshipper_1',
        name: 'Sister Elara',
        role: 'villager',
        x: 14.5 * TILE_SIZE,
        y: 23.8 * TILE_SIZE,
        color: '#cbd5e1',
        accent: '#93c5fd',
        dialogue:
          'The demons whisper tempting pacts if you speak to them before striking. Be careful—allying with one will make you the Priest\'s enemy, and trying to trick all four is pure madness!',
      },
      {
        id: 'worshipper_2',
        name: 'Brother Tomas',
        role: 'villager',
        x: 20.5 * TILE_SIZE,
        y: 23.8 * TILE_SIZE,
        color: '#cbd5e1',
        accent: '#fde68a',
        dialogue:
          'Flame lies northwest, Tide northeast, Stone southwest, and Gale southeast. Treasure chests in the north reliquary hold potions and scrolls if you need aid!',
      },
      // The 4 Elemental Demons start as talkable-or-attackable Bosses!
      {
        id: 'elem_fire',
        name: 'Ignis-Kael, Demon of Flame',
        role: 'elemental_fire',
        element: 'fire',
        pactSpell: 'inferno_pact',
        x: 6 * TILE_SIZE,
        y: 5.5 * TILE_SIZE,
        color: '#ff5722',
        accent: '#ffd166',
        maxHp: 320,
        damage: 20,
        dialogue:
          'Mortal! Why serve that meek Priest when you could wield eternal flame? Pledge yourself to me, take my Inferno Pact, and burn my three rivals and the Priest to ash!',
      },
      {
        id: 'elem_water',
        name: 'Nerai-Vex, Demon of the Abyss',
        role: 'elemental_water',
        element: 'water',
        pactSpell: 'tidal_pact',
        x: 29.5 * TILE_SIZE,
        y: 5.5 * TILE_SIZE,
        color: '#00b4d8',
        accent: '#caf0f8',
        maxHp: 320,
        damage: 19,
        dialogue:
          'How delightfully dry your soul is. Swear allegiance to the Abyss, claim my Tidal Pact, and drown the other elementals and their whining Priest!',
      },
      {
        id: 'elem_earth',
        name: 'Grol-Makh, Demon of Stone',
        role: 'elemental_earth',
        element: 'earth',
        pactSpell: 'terra_pact',
        x: 6 * TILE_SIZE,
        y: 20 * TILE_SIZE,
        color: '#2ecc71',
        accent: '#a3e635',
        maxHp: 380,
        damage: 22,
        dialogue:
          'Flesh fades; stone endures. Ally with the Mountain, receive my Terra Pact, and crush the other three usurpers and the Priest beneath bedrock!',
      },
      {
        id: 'elem_air',
        name: 'Vael-Zeph, Demon of Gales',
        role: 'elemental_air',
        element: 'air',
        pactSpell: 'tempest_pact',
        x: 29.5 * TILE_SIZE,
        y: 20 * TILE_SIZE,
        color: '#a29bfe',
        accent: '#74b9ff',
        maxHp: 300,
        damage: 18,
        dialogue:
          'Swift one! Chains of dogma weigh you down. Join the Tempest, claim my Tempest Pact, and scatter the other demons and the Priest to the winds!',
      },
    ],
    enemies: [
      // Central Sanctum guards
      { id: 'e_s1', kind: 'cultist', name: 'Corrupted Acolyte', x: 14.5 * TILE_SIZE, y: 14.5 * TILE_SIZE, hp: 70, damage: 11 },
      { id: 'e_s2', kind: 'cultist', name: 'Corrupted Acolyte', x: 20.5 * TILE_SIZE, y: 14.5 * TILE_SIZE, hp: 70, damage: 11 },
      // Fire wing minions
      { id: 'e_f1', kind: 'flame_imp', name: 'Cinder Imp', x: 8.5 * TILE_SIZE, y: 8.5 * TILE_SIZE, hp: 65, damage: 12 },
      { id: 'e_f2', kind: 'flame_imp', name: 'Ember Fiend', x: 4.5 * TILE_SIZE, y: 8.5 * TILE_SIZE, hp: 75, damage: 13 },
      // Water wing minions
      { id: 'e_w1', kind: 'frost_wraith', name: 'Tide Wraith', x: 27 * TILE_SIZE, y: 8.5 * TILE_SIZE, hp: 70, damage: 12 },
      { id: 'e_w2', kind: 'frost_wraith', name: 'Abyss Shade', x: 31 * TILE_SIZE, y: 8.5 * TILE_SIZE, hp: 75, damage: 13 },
      // Earth wing minions
      { id: 'e_e1', kind: 'stone_sentinel', name: 'Basalt Guard', x: 8.5 * TILE_SIZE, y: 17.5 * TILE_SIZE, hp: 95, damage: 14 },
      { id: 'e_e2', kind: 'stone_sentinel', name: 'Crag Stalker', x: 4.5 * TILE_SIZE, y: 17.5 * TILE_SIZE, hp: 90, damage: 14 },
      // Air wing minions
      { id: 'e_a1', kind: 'storm_harpy', name: 'Gale Harpy', x: 27 * TILE_SIZE, y: 17.5 * TILE_SIZE, hp: 65, damage: 12 },
      { id: 'e_a2', kind: 'storm_harpy', name: 'Tempest Sprite', x: 31 * TILE_SIZE, y: 17.5 * TILE_SIZE, hp: 70, damage: 13 },
    ],
    traps: [
      { id: 't1', kind: 'fire_jet', x: 10.5 * TILE_SIZE, y: 11 * TILE_SIZE, interval: 2.6, damage: 14 },
      { id: 't2', kind: 'spikes', x: 24.5 * TILE_SIZE, y: 11 * TILE_SIZE, interval: 2.4, damage: 14 },
      { id: 't3', kind: 'spikes', x: 10.5 * TILE_SIZE, y: 15.5 * TILE_SIZE, interval: 2.8, damage: 15 },
      { id: 't4', kind: 'arcane_rune', x: 24.5 * TILE_SIZE, y: 15.5 * TILE_SIZE, interval: 3.0, damage: 16 },
      { id: 't5', kind: 'fire_jet', x: 17.5 * TILE_SIZE, y: 7.5 * TILE_SIZE, interval: 2.5, damage: 14 },
    ],
    chests: [
      { id: 'c_north', tier: 'gold', x: 17.5 * TILE_SIZE, y: 3.2 * TILE_SIZE, lootType: 'spell', lootValue: 'arcane_bolt', gold: 80, potions: 2 },
      { id: 'c_fire', tier: 'iron', x: 3.2 * TILE_SIZE, y: 4.5 * TILE_SIZE, lootType: 'potion', gold: 50, potions: 2 },
      { id: 'c_water', tier: 'iron', x: 32 * TILE_SIZE, y: 4.5 * TILE_SIZE, lootType: 'potion', gold: 50, potions: 2 },
      { id: 'c_earth', tier: 'iron', x: 3.2 * TILE_SIZE, y: 21.5 * TILE_SIZE, lootType: 'gold', gold: 100, potions: 1 },
      { id: 'c_air', tier: 'iron', x: 32 * TILE_SIZE, y: 21.5 * TILE_SIZE, lootType: 'gold', gold: 100, potions: 1 },
    ],
  };
}

export function createBlankCustomLevel(name = 'My Custom Dungeon', width = 28, height = 22) {
  const tiles = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) =>
      x === 0 || y === 0 || x === width - 1 || y === height - 1 ? 0 : 1
    )
  );
  return {
    version: 1,
    id: `custom_${Date.now()}`,
    name,
    description: 'A custom dungeon built in the Aetherbound Level Builder.',
    isTempleCampaign: false,
    templeTheme: 'corrupted',
    width,
    height,
    spawn: { x: 4.5 * TILE_SIZE, y: 4.5 * TILE_SIZE },
    tiles,
    npcs: [
      {
        id: 'npc_guide',
        name: 'Dungeon Warden',
        role: 'priest',
        x: 7.5 * TILE_SIZE,
        y: 4.5 * TILE_SIZE,
        color: '#e2e8f0',
        accent: '#facc15',
        dialogue: 'Clear the monsters in this dungeon and return to me for your reward!',
        quest: {
          title: 'Clear the Dungeon',
          objectiveType: 'defeat_enemies',
          targetCount: 3,
          rewardGold: 150,
          rewardSpell: 'exorcism',
          rewardTitle: 'Dungeon Conqueror',
        },
      },
    ],
    enemies: [
      { id: 'e1', kind: 'skeleton', name: 'Skeleton Guard', x: 14.5 * TILE_SIZE, y: 9.5 * TILE_SIZE, hp: 75, damage: 11 },
      { id: 'e2', kind: 'goblin', name: 'Goblin Raider', x: 18.5 * TILE_SIZE, y: 12.5 * TILE_SIZE, hp: 65, damage: 10 },
      { id: 'e3', kind: 'flame_imp', name: 'Flame Imp', x: 20.5 * TILE_SIZE, y: 7.5 * TILE_SIZE, hp: 80, damage: 13 },
    ],
    traps: [
      { id: 't1', kind: 'spikes', x: 11.5 * TILE_SIZE, y: 10.5 * TILE_SIZE, interval: 2.5, damage: 12 },
    ],
    chests: [
      { id: 'c1', tier: 'gold', x: 22.5 * TILE_SIZE, y: 16.5 * TILE_SIZE, lootType: 'potion', gold: 90, potions: 2 },
    ],
  };
}
