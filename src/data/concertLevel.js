// Built-in Campaign Level (11/19/2026): "Concert Hall Invasion: Ballad of the Star Queen"
// Two zones in one map:
//   Left/Main (x: 1..21): Grand Concert Hall (Stage, Seating, Lobby, Alien Breach)
//   Right (x: 24..36): Planet Xylos — Queen Vexara's Amphitheater (Teleported to on Path 3!)

import { TILE_SIZE } from './templeLevel.js';

export function createConcertHallInvasionLevel() {
  const width = 38;
  const height = 28;
  const tiles = Array.from({ length: height }, () => Array(width).fill(0));

  const fillRect = (x1, y1, x2, y2, tile) => {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        if (y >= 0 && y < height && x >= 0 && x < width) tiles[y][x] = tile;
      }
    }
  };

  // === ZONE 1: THE GRAND CONCERT HALL (x: 2..20, y: 2..25) ===
  // Main auditorium marble floor
  fillRect(2, 8, 20, 24, 2);
  // Red velvet center aisle & seating aisles
  fillRect(9, 10, 13, 24, 8);
  fillRect(4, 13, 7, 21, 1);
  fillRect(15, 13, 18, 21, 1);

  // Auditorium pillars (create great cover against alien laser pistols!)
  tiles[12][5] = 3; tiles[12][17] = 3;
  tiles[17][5] = 3; tiles[17][17] = 3;
  tiles[22][5] = 3; tiles[22][17] = 3;

  // Grand Concert Stage (North end: x: 4..18, y: 2..8)
  fillRect(4, 2, 18, 8, 9); // gilded stage wood/altar floor
  fillRect(5, 3, 17, 7, 8); // stage velvet center
  fillRect(10, 4, 12, 5, 9); // Bard's spotlight dais
  // Stage torches / spotlights
  tiles[1][7] = 10; tiles[1][11] = 10; tiles[1][15] = 10;
  tiles[8][3] = 10; tiles[8][19] = 10;
  tiles[25][8] = 10; tiles[25][14] = 10;

  // Backstage alcoves (left & right of stage, holding chests)
  fillRect(2, 2, 4, 6, 1);
  fillRect(18, 2, 20, 6, 1);

  // Alien Breach Crater at South Entrance (glowing cosmic floor)
  fillRect(8, 21, 14, 25, 7);

  // === ZONE 2: PLANET XYLOS — QUEEN VEXARA'S AMPHITHEATER (x: 24..36, y: 4..23) ===
  // Completely walled off from Concert Hall — reached via Alien Abduction Teleport on Path 3!
  fillRect(24, 4, 36, 23, 7); // Alien cosmic floor
  fillRect(26, 6, 34, 21, 5); // Luminous alien crystal court
  fillRect(28, 10, 32, 17, 7); // Central drum battle pit
  fillRect(29, 5, 31, 7, 9); // Queen Vexara's Royal Throne dais
  // Alien Amphitheater pillars & plasma torches
  tiles[9][26] = 3; tiles[9][34] = 3;
  tiles[18][26] = 3; tiles[18][34] = 3;
  tiles[3][28] = 10; tiles[3][32] = 10;
  tiles[24][28] = 10; tiles[24][32] = 10;

  return {
    version: 1,
    id: 'concert_hall_invasion',
    name: 'Concert Hall Invasion: Ballad of the Star Queen',
    description:
      'Aliens have crashed a royal concert to abduct Lyricus the Virtuoso and force him to play for their Queen forever. Capture the Bard for the aliens, defend him from jetpack laser troopers, or take his place and duel the Queen\'s earthquake-drumming alien bard on Planet Xylos!',
    isTempleCampaign: false,
    isConcertCampaign: true,
    templeTheme: 'corrupted',
    width,
    height,
    spawn: { x: 11.5 * TILE_SIZE, y: 18.5 * TILE_SIZE },
    alienArenaSpawn: { x: 30.5 * TILE_SIZE, y: 20.5 * TILE_SIZE },
    tiles,
    npcs: [
      {
        id: 'bard_lyricus',
        name: 'Lyricus, Master Bard',
        role: 'bard',
        x: 11.5 * TILE_SIZE,
        y: 5.5 * TILE_SIZE,
        color: '#831843',
        accent: '#f472b6',
        maxHp: 360,
        damage: 18,
        dialogue:
          'These star-born tyrants crashed my encore! They mean to chain me in their Queen\'s palace forever! Stand as my bodyguard against their jetpack troopers—or are you here to hand me over?',
      },
      {
        id: 'alien_commander',
        name: 'Commander Xylar',
        role: 'alien_commander',
        x: 11.5 * TILE_SIZE,
        y: 22.8 * TILE_SIZE,
        color: '#10b981',
        accent: '#38bdf8',
        maxHp: 340,
        damage: 19,
        dialogue:
          'Greetings, primitive warrior! Queen Vexara demands this concert hall\'s finest musician for eternal service. Help us subdue the Bard, step aside, or volunteer to take his place on Planet Xylos!',
      },
      {
        id: 'stagehand_mira',
        name: 'Stagehand Mira',
        role: 'villager',
        x: 6.5 * TILE_SIZE,
        y: 10.5 * TILE_SIZE,
        color: '#cbd5e1',
        accent: '#f472b6',
        dialogue:
          'Talk to Lyricus on stage or Commander Xylar at the breach! Lyricus\'s magic lute can summon musical phantoms, while those aliens have laser pistols and jet packs!',
      },
      {
        id: 'queen_vexara',
        name: 'Star Queen Vexara',
        role: 'alien_queen',
        x: 30.5 * TILE_SIZE,
        y: 6.2 * TILE_SIZE,
        color: '#7c3aed',
        accent: '#38bdf8',
        dialogue:
          'So you volunteered to replace the Earthling bard! Amusing. If you want the royal stage, defeat my current Royal Percussionist, Zor-Krak, and survive his earthquake drums!',
      },
      {
        id: 'alien_drummer',
        name: 'Zor-Krak, Royal Alien Drummer',
        role: 'alien_drummer',
        x: 30.5 * TILE_SIZE,
        y: 13.5 * TILE_SIZE,
        color: '#06b6d4',
        accent: '#f43f5e',
        maxHp: 420,
        damage: 21,
        dialogue:
          'HAHAHA! You dare challenge my cosmic war drums?! Feel the seismic beat of Planet Xylos—every strike splits the earth!',
      },
    ],
    // Initial minor alien scouts patrolling the lobby so the hall feels invaded right away
    enemies: [
      {
        id: 'scout_1',
        kind: 'alien_jetpack',
        name: 'Xylosian Scout',
        x: 6.5 * TILE_SIZE,
        y: 19.5 * TILE_SIZE,
        hp: 75,
        damage: 12,
      },
      {
        id: 'scout_2',
        kind: 'alien_jetpack',
        name: 'Xylosian Scout',
        x: 16.5 * TILE_SIZE,
        y: 19.5 * TILE_SIZE,
        hp: 75,
        damage: 12,
      },
    ],
    traps: [
      { id: 'ct_1', kind: 'arcane_rune', x: 7.5 * TILE_SIZE, y: 14.5 * TILE_SIZE, interval: 2.8, damage: 13 },
      { id: 'ct_2', kind: 'arcane_rune', x: 15.5 * TILE_SIZE, y: 14.5 * TILE_SIZE, interval: 2.8, damage: 13 },
      { id: 'ct_3', kind: 'fire_jet', x: 27.5 * TILE_SIZE, y: 14 * TILE_SIZE, interval: 2.6, damage: 14 },
      { id: 'ct_4', kind: 'fire_jet', x: 33.5 * TILE_SIZE, y: 14 * TILE_SIZE, interval: 2.6, damage: 14 },
    ],
    chests: [
      { id: 'cc_left', tier: 'iron', x: 3.2 * TILE_SIZE, y: 3.5 * TILE_SIZE, lootType: 'potion', gold: 60, potions: 1 },
      { id: 'cc_right', tier: 'gold', x: 19.2 * TILE_SIZE, y: 3.5 * TILE_SIZE, lootType: 'spell', lootValue: 'arcane_bolt', gold: 90, potions: 1 },
      { id: 'cc_alien', tier: 'gold', x: 25.5 * TILE_SIZE, y: 21.5 * TILE_SIZE, lootType: 'potion', gold: 100, potions: 2 },
    ],
  };
}
