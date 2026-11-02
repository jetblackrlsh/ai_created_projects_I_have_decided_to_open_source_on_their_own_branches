// Original Lumenweave setting and presentation. Mechanical values preserved.
window.LUMEN_DATA = {
  "logo": "assets/cover.png",
  "fairies": [
    {
      "id": "tavra",
      "name": "Tavra",
      "title": "Custodian of Dragon Fire",
      "homeworld": "Emberkiln",
      "element": "Dragon Fire",
      "color": "#dca241",
      "maxHp": 90,
      "portrait": "assets/tavra.png",
      "passiveName": "Banked Embers",
      "passiveDesc": "Whenever Tavra plays an Attack spell, she inflicts +2 Burn (damage over time each turn) and gains +5% Accord (charges Ultimate at 100%).",
      "ultimateName": "Heart of the Fire Dragon",
      "ultimateDesc": "Channel the fire dragon: Deal 28 Damage, apply 6 Burn (6 DMG/turn, -1 each turn) to the villain, and heal all Waykeeper allies for 12 HP.",
      "deck": [
        {
          "id": "tavra_1",
          "name": "Dragon Spark",
          "upgradedName": "Dragon Spark+",
          "type": "Attack",
          "art": "assets/tavra-spell-1.png",
          "base": {
            "cost": 1,
            "dmg": 10,
            "burn": 2,
            "desc": "Deal 10 Fire damage and inflict 2 Burn (deals 2 DMG at start of villain's turn, then -1)."
          },
          "upgraded": {
            "cost": 1,
            "dmg": 15,
            "burn": 4,
            "desc": "Deal 15 Fire damage and inflict 4 Burn (deals 4 DMG at start of villain's turn, then -1)."
          }
        },
        {
          "id": "tavra_2",
          "name": "Ember Rampart",
          "upgradedName": "Ember Rampart+",
          "type": "Defense",
          "art": "assets/tavra-spell-2.png",
          "base": {
            "cost": 1,
            "shield": 11,
            "burn": 2,
            "desc": "Gain 11 Shield (blocks 11 incoming DMG this round) and inflict 2 Burn (2 DMG/turn, then -1)."
          },
          "upgraded": {
            "cost": 1,
            "shield": 16,
            "burn": 4,
            "desc": "Gain 16 Shield (blocks 16 incoming DMG this round) and inflict 4 Burn (4 DMG/turn, then -1)."
          }
        },
        {
          "id": "tavra_3",
          "name": "Flame Embrace",
          "upgradedName": "Flame Embrace+",
          "type": "Attack",
          "art": "assets/tavra-spell-3.png",
          "base": {
            "cost": 2,
            "dmg": 16,
            "burn": 4,
            "desc": "Deal 16 Fire damage and inflict 4 Burn (deals 4 DMG at start of villain's turn, then -1)."
          },
          "upgraded": {
            "cost": 2,
            "dmg": 23,
            "burn": 6,
            "desc": "Deal 23 Fire damage and inflict 6 Burn (deals 6 DMG at start of villain's turn, then -1)."
          }
        },
        {
          "id": "tavra_4",
          "name": "Blazing Rush",
          "upgradedName": "Blazing Rush+",
          "type": "Attack",
          "art": "assets/tavra-spell-4.png",
          "base": {
            "cost": 2,
            "dmg": 14,
            "inspire": 3,
            "desc": "Deal 14 damage and gain +3 Inspire (adds +3 bonus DMG to all your Attack spells)."
          },
          "upgraded": {
            "cost": 2,
            "dmg": 20,
            "inspire": 5,
            "desc": "Deal 20 damage and gain +5 Inspire (adds +5 bonus DMG to all your Attack spells)."
          }
        },
        {
          "id": "tavra_5",
          "name": "Heartfire",
          "upgradedName": "Heartfire+",
          "type": "Support",
          "art": "assets/tavra-spell-5.png",
          "base": {
            "cost": 0,
            "energy": 1,
            "draw": 1,
            "desc": "Gain +1 Mana (to play more cards this turn), draw 1 card, and charge +12% Accord (towards 100% Ultimate).",
            "accord": 12
          },
          "upgraded": {
            "cost": 0,
            "energy": 2,
            "draw": 1,
            "desc": "Gain +2 Mana (to play more cards this turn), draw 1 card, and charge +20% Accord (towards 100% Ultimate).",
            "accord": 20
          }
        },
        {
          "id": "tavra_6",
          "name": "Restorative Flame",
          "upgradedName": "Restorative Flame+",
          "type": "Support",
          "art": "assets/tavra-spell-6.png",
          "base": {
            "cost": 1,
            "heal": 12,
            "cleanse": true,
            "targetAllAllies": true,
            "desc": "Restore 12 HP and Cleanse (remove all Weaken debuffs) on all Waykeeper allies."
          },
          "upgraded": {
            "cost": 1,
            "heal": 18,
            "shield": 6,
            "cleanse": true,
            "targetAllAllies": true,
            "desc": "Restore 18 HP, grant 6 Shield (blocks 6 DMG), and Cleanse (remove all Weaken debuffs) on all Waykeeper allies."
          }
        },
        {
          "id": "tavra_7",
          "name": "Shared Embers",
          "upgradedName": "Shared Embers+",
          "type": "Support",
          "art": "assets/tavra-spell-7.png",
          "base": {
            "cost": 1,
            "shield": 9,
            "inspire": 3,
            "targetAllAllies": true,
            "desc": "Grant 9 Shield (blocks 9 incoming DMG) and +3 Inspire (+3 bonus Attack DMG) to all Waykeeper allies."
          },
          "upgraded": {
            "cost": 1,
            "shield": 14,
            "inspire": 5,
            "targetAllAllies": true,
            "desc": "Grant 14 Shield (blocks 14 incoming DMG) and +5 Inspire (+5 bonus Attack DMG) to all Waykeeper allies."
          }
        },
        {
          "id": "tavra_8",
          "name": "Dragonfire Breakthrough",
          "upgradedName": "Dragonfire Breakthrough+",
          "type": "Attack",
          "art": "assets/tavra-spell-8.png",
          "base": {
            "cost": 3,
            "dmg": 25,
            "burn": 6,
            "desc": "Deal 25 Fire damage, inflict 6 Burn (6 DMG/turn, then -1), and charge +15% Accord (towards Ultimate).",
            "accord": 15
          },
          "upgraded": {
            "cost": 2,
            "dmg": 32,
            "burn": 8,
            "desc": "Costs 2 Mana! Deal 32 Fire damage, inflict 8 Burn (8 DMG/turn, then -1), and +25% Accord (towards Ultimate).",
            "accord": 25
          }
        }
      ]
    },
    {
      "id": "oru",
      "name": "Oru",
      "title": "Custodian of Sun & Moon Light",
      "homeworld": "Parallax Arcade",
      "element": "Sun & Moon Light",
      "color": "#597ef7",
      "maxHp": 86,
      "portrait": "assets/oru.png",
      "passiveName": "Returning Light",
      "passiveDesc": "At the start of their turn, if Oru had Shield (damage block), they gain +1 bonus Mana and +10% Accord (charges Ultimate).",
      "ultimateName": "Sun and Moon in Accord",
      "ultimateDesc": "Deal 24 Damage, inflict 3 Weaken (-6 villain attack DMG) on the villain, and grant 16 Shield (blocks 16 DMG) to all allies.",
      "deck": [
        {
          "id": "oru_1",
          "name": "Solar Edge",
          "upgradedName": "Solar Edge+",
          "type": "Attack",
          "art": "assets/oru-spell-1.png",
          "base": {
            "cost": 1,
            "dmg": 11,
            "weaken": 1,
            "desc": "Deal 11 Light damage and inflict 1 Weaken (reduces villain's attack DMG by 2)."
          },
          "upgraded": {
            "cost": 1,
            "dmg": 16,
            "weaken": 2,
            "desc": "Deal 16 Light damage and inflict 2 Weaken (reduces villain's attack DMG by 4)."
          }
        },
        {
          "id": "oru_2",
          "name": "Moonbeam Rebound",
          "upgradedName": "Moonbeam Rebound+",
          "type": "Attack",
          "art": "assets/oru-spell-2.png",
          "base": {
            "cost": 1,
            "dmg": 9,
            "draw": 1,
            "desc": "Deal 9 Light damage and Draw 1 card (from your Draw Pile into your hand)."
          },
          "upgraded": {
            "cost": 1,
            "dmg": 14,
            "draw": 2,
            "desc": "Deal 14 Light damage and Draw 2 cards (from your Draw Pile into your hand)."
          }
        },
        {
          "id": "oru_3",
          "name": "Celestial Radiance",
          "upgradedName": "Celestial Radiance+",
          "type": "Support",
          "art": "assets/oru-spell-3.png",
          "base": {
            "cost": 1,
            "energy": 2,
            "inspire": 2,
            "desc": "Gain +2 Mana (to play more spells this turn) and +2 Inspire (+2 bonus DMG on all Attack spells)."
          },
          "upgraded": {
            "cost": 0,
            "energy": 2,
            "inspire": 4,
            "desc": "Costs 0 Mana! Gain +2 Mana (this turn) and +4 Inspire (+4 bonus DMG on all Attack spells)."
          }
        },
        {
          "id": "oru_4",
          "name": "Lunar Shelter",
          "upgradedName": "Lunar Shelter+",
          "type": "Defense",
          "art": "assets/oru-spell-4.png",
          "base": {
            "cost": 1,
            "shield": 12,
            "heal": 4,
            "targetAllAllies": true,
            "desc": "Grant 12 Shield (blocks 12 incoming DMG) and restore 4 HP to all Waykeeper allies."
          },
          "upgraded": {
            "cost": 1,
            "shield": 18,
            "heal": 8,
            "targetAllAllies": true,
            "desc": "Grant 18 Shield (blocks 18 incoming DMG) and restore 8 HP to all Waykeeper allies."
          }
        },
        {
          "id": "oru_5",
          "name": "Sunburst",
          "upgradedName": "Sunburst+",
          "type": "Attack",
          "art": "assets/oru-spell-5.png",
          "base": {
            "cost": 2,
            "dmg": 17,
            "weaken": 2,
            "desc": "Deal 17 Light damage and inflict 2 Weaken (reduces villain's attack DMG by 4)."
          },
          "upgraded": {
            "cost": 2,
            "dmg": 24,
            "weaken": 3,
            "desc": "Deal 24 Light damage and inflict 3 Weaken (reduces villain's attack DMG by 6)."
          }
        },
        {
          "id": "oru_6",
          "name": "Dawn Renewal",
          "upgradedName": "Dawn Renewal+",
          "type": "Support",
          "art": "assets/oru-spell-6.png",
          "base": {
            "cost": 1,
            "heal": 10,
            "draw": 1,
            "cleanse": true,
            "desc": "Heal 10 HP, Cleanse (remove all Weaken debuffs), and Draw 1 card."
          },
          "upgraded": {
            "cost": 1,
            "heal": 16,
            "draw": 2,
            "cleanse": true,
            "desc": "Heal 16 HP, Cleanse (remove all Weaken debuffs), and Draw 2 cards."
          }
        },
        {
          "id": "oru_7",
          "name": "Answering Ray",
          "upgradedName": "Answering Ray+",
          "type": "Defense",
          "art": "assets/oru-spell-7.png",
          "base": {
            "cost": 2,
            "shield": 15,
            "reflect": 8,
            "desc": "Gain 15 Shield (blocks 15 DMG) and 8 Reflect (bounces 8 DMG back at the villain when hit)."
          },
          "upgraded": {
            "cost": 2,
            "shield": 22,
            "reflect": 14,
            "desc": "Gain 22 Shield (blocks 22 DMG) and 14 Reflect (bounces 14 DMG back at the villain when hit)."
          }
        },
        {
          "id": "oru_8",
          "name": "Eclipse Flash",
          "upgradedName": "Eclipse Flash+",
          "type": "Attack",
          "art": "assets/oru-spell-8.png",
          "base": {
            "cost": 3,
            "dmg": 24,
            "shield": 10,
            "weaken": 2,
            "desc": "Deal 24 Light damage, gain 10 Shield (blocks 10 DMG), and inflict 2 Weaken (-4 enemy attack DMG)."
          },
          "upgraded": {
            "cost": 2,
            "dmg": 31,
            "shield": 14,
            "weaken": 3,
            "desc": "Costs 2 Mana! Deal 31 Light damage, gain 14 Shield (blocks 14 DMG), and 3 Weaken (-6 enemy attack DMG)."
          }
        }
      ]
    },
    {
      "id": "veska",
      "name": "Veska",
      "title": "Custodian of Nature & Flora",
      "homeworld": "The Undergarden",
      "element": "Nature & Flora",
      "color": "#b978cd",
      "maxHp": 94,
      "portrait": "assets/veska.png",
      "passiveName": "Evergreen Care",
      "passiveDesc": "At the end of her turn, Veska automatically restores 4 HP to all living Waykeeper allies.",
      "ultimateName": "Wildwood Renewal",
      "ultimateDesc": "Deal 22 Damage, inflict 1 Entangle (-35% villain attack DMG), and grant 18 HP + 6 Regen (heals 6 HP/turn) to all allies.",
      "deck": [
        {
          "id": "veska_1",
          "name": "Briar Snare",
          "upgradedName": "Briar Snare+",
          "type": "Attack",
          "art": "assets/veska-spell-1.png",
          "base": {
            "cost": 1,
            "dmg": 9,
            "weaken": 2,
            "desc": "Lash with vines for 9 damage and apply 2 Weaken (reduces villain's attack DMG by 4)."
          },
          "upgraded": {
            "cost": 1,
            "dmg": 14,
            "weaken": 3,
            "desc": "Lash with vines for 14 damage and apply 3 Weaken (reduces villain's attack DMG by 6)."
          }
        },
        {
          "id": "veska_2",
          "name": "Rooted Network",
          "upgradedName": "Rooted Network+",
          "type": "Attack",
          "art": "assets/veska-spell-2.png",
          "base": {
            "cost": 2,
            "dmg": 13,
            "entangle": 1,
            "desc": "Deal 13 Nature damage and inflict 1 Entangle (reduces villain's attack DMG by 35% for 1 turn)."
          },
          "upgraded": {
            "cost": 2,
            "dmg": 19,
            "entangle": 2,
            "desc": "Deal 19 Nature damage and inflict 2 Entangle (reduces villain's attack DMG by 35% for 2 turns)."
          }
        },
        {
          "id": "veska_3",
          "name": "Petal Current",
          "upgradedName": "Petal Current+",
          "type": "Support",
          "art": "assets/veska-spell-3.png",
          "base": {
            "cost": 1,
            "heal": 11,
            "regen": 4,
            "targetAllAllies": true,
            "desc": "Restore 11 HP and grant 4 Regen (heals 4 HP at end of turn, then -1) to all Waykeeper allies."
          },
          "upgraded": {
            "cost": 1,
            "heal": 16,
            "regen": 7,
            "targetAllAllies": true,
            "desc": "Restore 16 HP and grant 7 Regen (heals 7 HP at end of turn, then -1) to all Waykeeper allies."
          }
        },
        {
          "id": "veska_4",
          "name": "Living Pollen",
          "upgradedName": "Living Pollen+",
          "type": "Support",
          "art": "assets/veska-spell-4.png",
          "base": {
            "cost": 1,
            "burn": 5,
            "heal": 8,
            "desc": "Inflict 5 Nature Toxin / Burn (deals 5 DMG at start of villain's turn, then -1) and heal 8 HP."
          },
          "upgraded": {
            "cost": 1,
            "burn": 8,
            "heal": 13,
            "desc": "Inflict 8 Nature Toxin / Burn (deals 8 DMG at start of villain's turn, then -1) and heal 13 HP."
          }
        },
        {
          "id": "veska_5",
          "name": "Canopy Shelter",
          "upgradedName": "Canopy Shelter+",
          "type": "Defense",
          "art": "assets/veska-spell-5.png",
          "base": {
            "cost": 1,
            "shield": 13,
            "cleanse": true,
            "desc": "Gain 13 Shield (blocks 13 incoming DMG) and Cleanse (remove all Weaken debuffs)."
          },
          "upgraded": {
            "cost": 1,
            "shield": 19,
            "regen": 4,
            "cleanse": true,
            "desc": "Gain 19 Shield (blocks 19 DMG), 4 Regen (heals 4 HP at turn end), and Cleanse (remove Weaken)."
          }
        },
        {
          "id": "veska_6",
          "name": "Vine Spiral",
          "upgradedName": "Vine Spiral+",
          "type": "Attack",
          "art": "assets/veska-spell-6.png",
          "base": {
            "cost": 2,
            "dmg": 16,
            "burn": 4,
            "draw": 1,
            "desc": "Deal 16 damage, inflict 4 Toxin / Burn (4 DMG/turn, then -1), and Draw 1 card."
          },
          "upgraded": {
            "cost": 2,
            "dmg": 22,
            "burn": 6,
            "draw": 2,
            "desc": "Deal 22 damage, inflict 6 Toxin / Burn (6 DMG/turn, then -1), and Draw 2 cards."
          }
        },
        {
          "id": "veska_7",
          "name": "Dew of Renewal",
          "upgradedName": "Dew of Renewal+",
          "type": "Support",
          "art": "assets/veska-spell-7.png",
          "base": {
            "cost": 0,
            "energy": 1,
            "regen": 5,
            "desc": "Gain +1 Mana, 5 Regen (heals 5 HP at turn end, then -1), and +12% Accord (towards Ultimate).",
            "accord": 12
          },
          "upgraded": {
            "cost": 0,
            "energy": 2,
            "regen": 8,
            "desc": "Gain +2 Mana, 8 Regen (heals 8 HP at turn end, then -1), and +20% Accord (towards Ultimate).",
            "accord": 20
          }
        },
        {
          "id": "veska_8",
          "name": "Wildwood Awakening",
          "upgradedName": "Wildwood Awakening+",
          "type": "Attack",
          "art": "assets/veska-spell-8.png",
          "base": {
            "cost": 3,
            "dmg": 22,
            "shield": 12,
            "entangle": 1,
            "desc": "Deal 22 damage, gain 12 Shield (blocks 12 DMG), and inflict 1 Entangle (-35% enemy attack DMG)."
          },
          "upgraded": {
            "cost": 2,
            "dmg": 29,
            "shield": 16,
            "entangle": 2,
            "desc": "Costs 2 Mana! Deal 29 damage, gain 16 Shield (blocks 16 DMG), and 2 Entangle (-35% enemy DMG for 2 turns)."
          }
        }
      ]
    },
    {
      "id": "pella",
      "name": "Pella",
      "title": "Custodian of Soundwaves & Harmony",
      "homeworld": "The Resonant Steps",
      "element": "Soundwaves & Harmony",
      "color": "#dbb346",
      "maxHp": 85,
      "portrait": "assets/pella.png",
      "passiveName": "Resonant Echo",
      "passiveDesc": "Every 2nd spell Pella casts in a single turn echoes for +5 bonus Sonic damage to the villain.",
      "ultimateName": "The Song We Share",
      "ultimateDesc": "Deal 26 Damage, grant +5 Inspire (+5 bonus Attack DMG) to all Waykeeper allies, and Draw 2 cards.",
      "deck": [
        {
          "id": "pella_1",
          "name": "Soundburst",
          "upgradedName": "Soundburst+",
          "type": "Attack",
          "art": "assets/pella-spell-1.png",
          "base": {
            "cost": 1,
            "dmg": 12,
            "desc": "Strike the villain with a focused 12-damage Sonic wave (counts toward Pella's 2-spell Echo passive)."
          },
          "upgraded": {
            "cost": 1,
            "dmg": 18,
            "desc": "Strike the villain with a focused 18-damage Sonic wave (counts toward Pella's 2-spell Echo passive)."
          }
        },
        {
          "id": "pella_2",
          "name": "Echo Return",
          "upgradedName": "Echo Return+",
          "type": "Attack",
          "art": "assets/pella-spell-2.png",
          "base": {
            "cost": 1,
            "dmg": 9,
            "inspire": 2,
            "draw": 1,
            "desc": "Deal 9 Sonic damage, gain +2 Inspire (+2 bonus DMG on Attack spells), and Draw 1 card."
          },
          "upgraded": {
            "cost": 1,
            "dmg": 14,
            "inspire": 4,
            "draw": 1,
            "desc": "Deal 14 Sonic damage, gain +4 Inspire (+4 bonus DMG on Attack spells), and Draw 1 card."
          }
        },
        {
          "id": "pella_3",
          "name": "Crescendo",
          "upgradedName": "Crescendo+",
          "type": "Attack",
          "art": "assets/pella-spell-3.png",
          "base": {
            "cost": 2,
            "dmg": 17,
            "weaken": 2,
            "desc": "Deal 17 Sonic damage and apply 2 Weaken (reduces villain's attack DMG by 4)."
          },
          "upgraded": {
            "cost": 2,
            "dmg": 24,
            "weaken": 3,
            "desc": "Deal 24 Sonic damage and apply 3 Weaken (reduces villain's attack DMG by 6)."
          }
        },
        {
          "id": "pella_4",
          "name": "Resonant Bind",
          "upgradedName": "Resonant Bind+",
          "type": "Defense",
          "art": "assets/pella-spell-4.png",
          "base": {
            "cost": 1,
            "shield": 11,
            "entangle": 1,
            "desc": "Gain 11 Shield (blocks 11 incoming DMG) and inflict 1 Entangle (-35% villain attack DMG for 1 turn)."
          },
          "upgraded": {
            "cost": 1,
            "shield": 16,
            "entangle": 1,
            "weaken": 2,
            "desc": "Gain 16 Shield (blocks 16 DMG), 1 Entangle (-35% enemy DMG), and 2 Weaken (-4 enemy DMG)."
          }
        },
        {
          "id": "pella_5",
          "name": "Healing Harmony",
          "upgradedName": "Healing Harmony+",
          "type": "Support",
          "art": "assets/pella-spell-5.png",
          "base": {
            "cost": 1,
            "heal": 10,
            "inspire": 3,
            "targetAllAllies": true,
            "desc": "Heal all Waykeeper allies for 10 HP and grant +3 Inspire (+3 bonus DMG on Attack spells)."
          },
          "upgraded": {
            "cost": 1,
            "heal": 15,
            "inspire": 5,
            "targetAllAllies": true,
            "desc": "Heal all Waykeeper allies for 15 HP and grant +5 Inspire (+5 bonus DMG on Attack spells)."
          }
        },
        {
          "id": "pella_6",
          "name": "Chorus Call",
          "upgradedName": "Chorus Call+",
          "type": "Support",
          "art": "assets/pella-spell-6.png",
          "base": {
            "cost": 0,
            "energy": 1,
            "draw": 2,
            "desc": "Gain +1 Mana (to play more spells this turn) and Draw 2 cards."
          },
          "upgraded": {
            "cost": 0,
            "energy": 2,
            "draw": 2,
            "desc": "Gain +2 Mana (this turn), Draw 2 cards, and charge +15% Accord (towards 100% Ultimate).",
            "accord": 15
          }
        },
        {
          "id": "pella_7",
          "name": "Anthem of Shelter",
          "upgradedName": "Anthem of Shelter+",
          "type": "Defense",
          "art": "assets/pella-spell-7.png",
          "base": {
            "cost": 2,
            "shield": 14,
            "heal": 6,
            "targetAllAllies": true,
            "desc": "Grant 14 Shield (blocks 14 incoming DMG) and restore 6 HP to all Waykeeper allies."
          },
          "upgraded": {
            "cost": 1,
            "shield": 18,
            "heal": 9,
            "targetAllAllies": true,
            "desc": "Costs 1 Mana! Grant 18 Shield (blocks 18 incoming DMG) and restore 9 HP to all Waykeeper allies."
          }
        },
        {
          "id": "pella_8",
          "name": "Symphonic Surge",
          "upgradedName": "Symphonic Surge+",
          "type": "Attack",
          "art": "assets/pella-spell-8.png",
          "base": {
            "cost": 3,
            "dmg": 26,
            "inspire": 4,
            "desc": "Deal 26 Sonic damage, gain +4 Inspire (+4 bonus Attack DMG), and +15% Accord (towards Ultimate).",
            "accord": 15
          },
          "upgraded": {
            "cost": 2,
            "dmg": 34,
            "inspire": 6,
            "desc": "Costs 2 Mana! Deal 34 Sonic damage, gain +6 Inspire (+6 Attack DMG), and +25% Accord.",
            "accord": 25
          }
        }
      ]
    },
    {
      "id": "iman",
      "name": "Iman",
      "title": "Custodian of Techno-Magic",
      "homeworld": "Creasehaven",
      "element": "Techno-Magic",
      "color": "#ed7f73",
      "maxHp": 92,
      "portrait": "assets/iman.png",
      "passiveName": "Persistent Firewall",
      "passiveDesc": "Iman retains up to 10 unused Shield (damage block) between turns instead of losing all Shield at turn start.",
      "ultimateName": "Sanctuary Network",
      "ultimateDesc": "Grant 22 Shield (blocks 22 DMG) to all allies, deal 24 Laser damage, and Draw 2 cards.",
      "deck": [
        {
          "id": "iman_1",
          "name": "Circuit Ray",
          "upgradedName": "Circuit Ray+",
          "type": "Attack",
          "art": "assets/iman-spell-1.png",
          "base": {
            "cost": 1,
            "dmg": 11,
            "shield": 4,
            "desc": "Fire a precision beam for 11 damage and gain 4 Shield (blocks 4 incoming DMG)."
          },
          "upgraded": {
            "cost": 1,
            "dmg": 16,
            "shield": 7,
            "desc": "Fire a precision beam for 16 damage and gain 7 Shield (blocks 7 incoming DMG)."
          }
        },
        {
          "id": "iman_2",
          "name": "Digital Bastion",
          "upgradedName": "Digital Bastion+",
          "type": "Defense",
          "art": "assets/iman-spell-2.png",
          "base": {
            "cost": 1,
            "shield": 14,
            "desc": "Project a digital wall for 14 Shield (blocks 14 incoming DMG; Iman keeps up to 10 next turn)."
          },
          "upgraded": {
            "cost": 1,
            "shield": 21,
            "draw": 1,
            "desc": "Project a digital wall for 21 Shield (blocks 21 incoming DMG) and Draw 1 card."
          }
        },
        {
          "id": "iman_3",
          "name": "Data Prism",
          "upgradedName": "Data Prism+",
          "type": "Defense",
          "art": "assets/iman-spell-3.png",
          "base": {
            "cost": 1,
            "shield": 10,
            "entangle": 1,
            "targetAllAllies": true,
            "desc": "Grant 10 Shield (blocks 10 DMG) to all allies and inflict 1 Entangle (-35% villain attack DMG)."
          },
          "upgraded": {
            "cost": 1,
            "shield": 15,
            "entangle": 2,
            "targetAllAllies": true,
            "desc": "Grant 15 Shield (blocks 15 DMG) to all allies and inflict 2 Entangle (-35% villain DMG for 2 turns)."
          }
        },
        {
          "id": "iman_4",
          "name": "System Reset",
          "upgradedName": "System Reset+",
          "type": "Support",
          "art": "assets/iman-spell-4.png",
          "base": {
            "cost": 0,
            "energy": 1,
            "draw": 1,
            "cleanse": true,
            "desc": "Gain +1 Mana (this turn), Draw 1 card, and Cleanse (remove all Weaken debuffs)."
          },
          "upgraded": {
            "cost": 0,
            "energy": 2,
            "draw": 2,
            "cleanse": true,
            "desc": "Gain +2 Mana (this turn), Draw 2 cards, and Cleanse (remove all Weaken debuffs)."
          }
        },
        {
          "id": "iman_5",
          "name": "Pixel Storm",
          "upgradedName": "Pixel Storm+",
          "type": "Attack",
          "art": "assets/iman-spell-5.png",
          "base": {
            "cost": 2,
            "dmg": 17,
            "weaken": 2,
            "desc": "Discharge 17 Electro-Techno damage and apply 2 Weaken (reduces villain's attack DMG by 4)."
          },
          "upgraded": {
            "cost": 2,
            "dmg": 24,
            "weaken": 3,
            "desc": "Discharge 24 Electro-Techno damage and apply 3 Weaken (reduces villain's attack DMG by 6)."
          }
        },
        {
          "id": "iman_6",
          "name": "Logic Pulse",
          "upgradedName": "Logic Pulse+",
          "type": "Defense",
          "art": "assets/iman-spell-6.png",
          "base": {
            "cost": 2,
            "shield": 15,
            "reflect": 9,
            "desc": "Gain 15 Shield (blocks 15 DMG) and 9 Reflect (bounces 9 DMG back at the villain when hit)."
          },
          "upgraded": {
            "cost": 2,
            "shield": 22,
            "reflect": 15,
            "desc": "Gain 22 Shield (blocks 22 DMG) and 15 Reflect (bounces 15 DMG back at the villain when hit)."
          }
        },
        {
          "id": "iman_7",
          "name": "Guardian Protocol",
          "upgradedName": "Guardian Protocol+",
          "type": "Support",
          "art": "assets/iman-spell-7.png",
          "base": {
            "cost": 1,
            "heal": 10,
            "inspire": 3,
            "desc": "Restore 10 HP, gain +3 Inspire (+3 bonus Attack DMG), and +15% Accord (towards Ultimate).",
            "accord": 15
          },
          "upgraded": {
            "cost": 1,
            "heal": 15,
            "inspire": 5,
            "desc": "Restore 15 HP, gain +5 Inspire (+5 bonus Attack DMG), and +25% Accord (towards Ultimate).",
            "accord": 25
          }
        },
        {
          "id": "iman_8",
          "name": "Harmony Engine",
          "upgradedName": "Harmony Engine+",
          "type": "Attack",
          "art": "assets/iman-spell-8.png",
          "base": {
            "cost": 3,
            "dmg": 25,
            "shield": 10,
            "draw": 1,
            "desc": "Deal 25 Techno damage, gain 10 Shield (blocks 10 DMG), and Draw 1 card."
          },
          "upgraded": {
            "cost": 2,
            "dmg": 32,
            "shield": 15,
            "draw": 2,
            "desc": "Costs 2 Mana! Deal 32 Techno damage, gain 15 Shield (blocks 15 DMG), and Draw 2 cards."
          }
        }
      ]
    },
    {
      "id": "sile",
      "name": "Sile",
      "title": "Custodian of Water & Shapeflow",
      "homeworld": "The Glassmere",
      "element": "Water & Shapeflow",
      "color": "#ae426d",
      "maxHp": 92,
      "portrait": "assets/sile.png",
      "passiveName": "Tidal Recoil",
      "passiveDesc": "Whenever Sile gains Shield (damage block) or heals HP, she splashes the villain for 4 bonus Shapeflow damage.",
      "ultimateName": "The Unbroken Tide",
      "ultimateDesc": "Deal 26 Damage, inflict 1 Entangle (-35% enemy DMG), and grant 14 Shield (blocks 14 DMG) + 10 HP to all allies.",
      "deck": [
        {
          "id": "sile_1",
          "name": "Waterneedle",
          "upgradedName": "Waterneedle+",
          "type": "Attack",
          "art": "assets/sile-spell-1.png",
          "base": {
            "cost": 1,
            "dmg": 11,
            "shield": 3,
            "desc": "Deal 11 damage and gain 3 Shield (blocks 3 DMG & triggers Sile's +4 DMG splash passive)."
          },
          "upgraded": {
            "cost": 1,
            "dmg": 16,
            "shield": 6,
            "desc": "Deal 16 damage and gain 6 Shield (blocks 6 DMG & triggers Sile's +4 DMG splash passive)."
          }
        },
        {
          "id": "sile_2",
          "name": "Shapeflow Barrier",
          "upgradedName": "Shapeflow Barrier+",
          "type": "Defense",
          "art": "assets/sile-spell-2.png",
          "base": {
            "cost": 1,
            "shield": 12,
            "reflect": 5,
            "desc": "Gain 12 Shield (blocks 12 DMG) and 5 Reflect (bounces 5 DMG back when hit by villain)."
          },
          "upgraded": {
            "cost": 1,
            "shield": 18,
            "reflect": 9,
            "desc": "Gain 18 Shield (blocks 18 DMG) and 9 Reflect (bounces 9 DMG back when hit by villain)."
          }
        },
        {
          "id": "sile_3",
          "name": "Tidal Arc",
          "upgradedName": "Tidal Arc+",
          "type": "Attack",
          "art": "assets/sile-spell-3.png",
          "base": {
            "cost": 2,
            "dmg": 16,
            "weaken": 2,
            "desc": "Crash a Shapeflow crest for 16 damage and apply 2 Weaken (reduces villain's attack DMG by 4)."
          },
          "upgraded": {
            "cost": 2,
            "dmg": 23,
            "weaken": 3,
            "desc": "Crash a Shapeflow crest for 23 damage and apply 3 Weaken (reduces villain's attack DMG by 6)."
          }
        },
        {
          "id": "sile_4",
          "name": "Whirlpool",
          "upgradedName": "Whirlpool+",
          "type": "Attack",
          "art": "assets/sile-spell-4.png",
          "base": {
            "cost": 2,
            "dmg": 14,
            "entangle": 1,
            "draw": 1,
            "desc": "Deal 14 damage, inflict 1 Entangle (-35% villain attack DMG for 1 turn), and Draw 1 card."
          },
          "upgraded": {
            "cost": 2,
            "dmg": 20,
            "entangle": 2,
            "draw": 1,
            "desc": "Deal 20 damage, inflict 2 Entangle (-35% villain attack DMG for 2 turns), and Draw 1 card."
          }
        },
        {
          "id": "sile_5",
          "name": "Cooling Salve",
          "upgradedName": "Cooling Salve+",
          "type": "Support",
          "art": "assets/sile-spell-5.png",
          "base": {
            "cost": 1,
            "heal": 12,
            "regen": 3,
            "targetAllAllies": true,
            "desc": "Heal all Waykeeper allies for 12 HP and grant 3 Regen (heals 3 HP at end of turn, then -1)."
          },
          "upgraded": {
            "cost": 1,
            "heal": 18,
            "regen": 5,
            "cleanse": true,
            "targetAllAllies": true,
            "desc": "Heal all allies for 18 HP, grant 5 Regen (heals 5 HP at turn end), and Cleanse (remove Weaken)."
          }
        },
        {
          "id": "sile_6",
          "name": "Unbroken Current",
          "upgradedName": "Unbroken Current+",
          "type": "Support",
          "art": "assets/sile-spell-6.png",
          "base": {
            "cost": 0,
            "energy": 1,
            "inspire": 3,
            "desc": "Gain +1 Mana (this turn), +3 Inspire (+3 bonus Attack DMG), and +10% Accord (towards Ultimate).",
            "accord": 10
          },
          "upgraded": {
            "cost": 0,
            "energy": 2,
            "inspire": 5,
            "desc": "Gain +2 Mana (this turn), +5 Inspire (+5 bonus Attack DMG), and +18% Accord (towards Ultimate).",
            "accord": 18
          }
        },
        {
          "id": "sile_7",
          "name": "Shapeflow Surge",
          "upgradedName": "Shapeflow Surge+",
          "type": "Attack",
          "art": "assets/sile-spell-7.png",
          "base": {
            "cost": 2,
            "dmg": 18,
            "heal": 6,
            "desc": "Deal 18 Tidal damage and restore 6 HP (also triggers Sile's +4 DMG splash passive)."
          },
          "upgraded": {
            "cost": 2,
            "dmg": 25,
            "heal": 10,
            "desc": "Deal 25 Tidal damage and restore 10 HP (also triggers Sile's +4 DMG splash passive)."
          }
        },
        {
          "id": "sile_8",
          "name": "Rebounding Wave",
          "upgradedName": "Rebounding Wave+",
          "type": "Attack",
          "art": "assets/sile-spell-8.png",
          "base": {
            "cost": 3,
            "dmg": 24,
            "shield": 12,
            "reflect": 8,
            "desc": "Deal 24 damage, gain 12 Shield (blocks 12 DMG), and 8 Reflect (bounces 8 DMG back when hit)."
          },
          "upgraded": {
            "cost": 2,
            "dmg": 31,
            "shield": 16,
            "reflect": 12,
            "desc": "Costs 2 Mana! Deal 31 damage, gain 16 Shield (blocks 16 DMG), and 12 Reflect (bounces 12 DMG back)."
          }
        }
      ]
    },
    {
      "id": "nemi",
      "name": "Nemi",
      "title": "Custodian of Wild Animal Magic",
      "homeworld": "The Lantern Orchard",
      "element": "Wild Animal Magic",
      "color": "#57bbb1",
      "maxHp": 88,
      "portrait": "assets/nemi.png",
      "passiveName": "Wild Kinship",
      "passiveDesc": "At the end of Nemi's turn, animal companions strike the villain for 5 DMG and grant Nemi 3 Shield (blocks 3 DMG).",
      "ultimateName": "Lanterns of the Wild",
      "ultimateDesc": "Deal 25 Damage, grant +4 Inspire (+4 Attack DMG) and 12 Shield (blocks 12 DMG) to all allies, and heal 10 HP.",
      "deck": [
        {
          "id": "nemi_1",
          "name": "Wild Talon",
          "upgradedName": "Wild Talon+",
          "type": "Attack",
          "art": "assets/nemi-spell-1.png",
          "base": {
            "cost": 1,
            "dmg": 11,
            "inspire": 2,
            "desc": "Pounce for 11 Wild damage and gain +2 Inspire (adds +2 bonus DMG to all your Attack spells)."
          },
          "upgraded": {
            "cost": 1,
            "dmg": 16,
            "inspire": 4,
            "desc": "Pounce for 16 Wild damage and gain +4 Inspire (adds +4 bonus DMG to all your Attack spells)."
          }
        },
        {
          "id": "nemi_2",
          "name": "Owl Sight",
          "upgradedName": "Owl Sight+",
          "type": "Support",
          "art": "assets/nemi-spell-2.png",
          "base": {
            "cost": 0,
            "energy": 1,
            "draw": 2,
            "desc": "Scout the battlefield: Gain +1 Mana (this turn) and Draw 2 cards."
          },
          "upgraded": {
            "cost": 0,
            "energy": 2,
            "draw": 2,
            "inspire": 2,
            "desc": "Gain +2 Mana (this turn), Draw 2 cards, and gain +2 Inspire (+2 bonus Attack DMG)."
          }
        },
        {
          "id": "nemi_3",
          "name": "Pack Vigil",
          "upgradedName": "Pack Vigil+",
          "type": "Defense",
          "art": "assets/nemi-spell-3.png",
          "base": {
            "cost": 1,
            "shield": 12,
            "heal": 5,
            "targetAllAllies": true,
            "desc": "Grant 12 Shield (blocks 12 incoming DMG) and restore 5 HP to all Waykeeper allies."
          },
          "upgraded": {
            "cost": 1,
            "shield": 17,
            "heal": 9,
            "targetAllAllies": true,
            "desc": "Grant 17 Shield (blocks 17 incoming DMG) and restore 9 HP to all Waykeeper allies."
          }
        },
        {
          "id": "nemi_4",
          "name": "Scorpion Sting",
          "upgradedName": "Scorpion Sting+",
          "type": "Attack",
          "art": "assets/nemi-spell-4.png",
          "base": {
            "cost": 1,
            "dmg": 9,
            "burn": 4,
            "weaken": 1,
            "desc": "Deal 9 damage, inflict 4 Venom / Burn (4 DMG/turn, then -1), and 1 Weaken (-2 enemy attack DMG)."
          },
          "upgraded": {
            "cost": 1,
            "dmg": 14,
            "burn": 7,
            "weaken": 2,
            "desc": "Deal 14 damage, inflict 7 Venom / Burn (7 DMG/turn, then -1), and 2 Weaken (-4 enemy attack DMG)."
          }
        },
        {
          "id": "nemi_5",
          "name": "Swift Passage",
          "upgradedName": "Swift Passage+",
          "type": "Defense",
          "art": "assets/nemi-spell-5.png",
          "base": {
            "cost": 2,
            "shield": 12,
            "entangle": 1,
            "weaken": 2,
            "desc": "Gain 12 Shield (blocks 12 DMG), 1 Entangle (-35% enemy DMG), and 2 Weaken (-4 enemy DMG)."
          },
          "upgraded": {
            "cost": 1,
            "shield": 16,
            "entangle": 2,
            "weaken": 2,
            "desc": "Costs 1 Mana! Gain 16 Shield (blocks 16 DMG), 2 Entangle (-35% enemy DMG for 2 turns), and 2 Weaken."
          }
        },
        {
          "id": "nemi_6",
          "name": "Kinship Light",
          "upgradedName": "Kinship Light+",
          "type": "Support",
          "art": "assets/nemi-spell-6.png",
          "base": {
            "cost": 1,
            "heal": 12,
            "regen": 4,
            "cleanse": true,
            "desc": "Heal 12 HP, gain 4 Regen (heals 4 HP at turn end, then -1), and Cleanse (remove Weaken)."
          },
          "upgraded": {
            "cost": 1,
            "heal": 18,
            "regen": 6,
            "cleanse": true,
            "targetAllAllies": true,
            "desc": "Heal ALL allies for 18 HP, grant 6 Regen (heals 6 HP at turn end), and Cleanse (remove Weaken)."
          }
        },
        {
          "id": "nemi_7",
          "name": "Beastward",
          "upgradedName": "Beastward+",
          "type": "Attack",
          "art": "assets/nemi-spell-7.png",
          "base": {
            "cost": 2,
            "dmg": 18,
            "inspire": 3,
            "desc": "Stampede for 18 damage and gain +3 Inspire (adds +3 bonus DMG to all your Attack spells)."
          },
          "upgraded": {
            "cost": 2,
            "dmg": 25,
            "inspire": 5,
            "desc": "Stampede for 25 damage and gain +5 Inspire (adds +5 bonus DMG to all your Attack spells)."
          }
        },
        {
          "id": "nemi_8",
          "name": "Wild Chorus",
          "upgradedName": "Wild Chorus+",
          "type": "Attack",
          "art": "assets/nemi-spell-8.png",
          "base": {
            "cost": 3,
            "dmg": 24,
            "shield": 10,
            "desc": "Deal 24 damage, gain 10 Shield (blocks 10 DMG), and charge +20% Accord (towards 100% Ultimate).",
            "accord": 20
          },
          "upgraded": {
            "cost": 2,
            "dmg": 32,
            "shield": 15,
            "desc": "Costs 2 Mana! Deal 32 damage, gain 15 Shield (blocks 15 DMG), and +30% Accord (towards Ultimate).",
            "accord": 30
          }
        }
      ]
    }
  ],
  "villains": [
    {
      "id": "tollweaver",
      "level": 1,
      "name": "The Tollweaver",
      "title": "Usurper of Passage",
      "season": "Chapter 1 • Passage",
      "location": "Gate of Hanging Roads",
      "bg": "assets/tollweaver-realm.png",
      "portrait": "assets/tollweaver.png",
      "altPortrait": "assets/tollweaver.png",
      "baseHp": 115,
      "desc": "Bind every route to a toll paid in years of life.",
      "moves": [
        {
          "name": "Chain Levy",
          "dmg": 12,
          "weaken": 1,
          "desc": "Deals 12 damage; inflicts 1 Weaken (-2 Attack damage)."
        },
        {
          "name": "Sealed Crossing",
          "dmg": 10,
          "shield": 8,
          "entangle": 1,
          "desc": "Deals 10 damage; reduces fairy Inspire by 1; gains 8 Shield."
        },
        {
          "name": "Hinge Storm",
          "dmg": 15,
          "targetAll": true,
          "desc": "Deals 15 damage to all fairies."
        },
        {
          "name": "Years Collected",
          "dmg": 18,
          "burn": 3,
          "targetAll": true,
          "desc": "Deals 18 damage to all fairies; adds 3 extra damage."
        }
      ],
      "preCutscene": [
        {
          "speaker": "The Tollweaver",
          "side": "right",
          "portrait": "assets/tollweaver.png",
          "bg": "assets/tollweaver-realm.png",
          "text": "The roads belong to whoever can hold them. A year of your life buys one crossing. A decade buys a homeward journey."
        },
        {
          "speaker": "{HERO_2_OR_1}",
          "side": "left",
          "portrait": "{HERO_2_OR_1_PORTRAIT}",
          "bg": "assets/tollweaver-realm.png",
          "text": "Those gates carried food yesterday. Now whole neighborhoods are stranded. Open them, and stop charging people for their own lives."
        },
        {
          "speaker": "The Tollweaver",
          "side": "right",
          "portrait": "assets/tollweaver.png",
          "bg": "assets/tollweaver-realm.png",
          "text": "A charming request. Unfortunately, the chains recognize my seal, not your sympathy."
        },
        {
          "speaker": "{HERO_2_OR_1}",
          "side": "left",
          "portrait": "{HERO_2_OR_1_PORTRAIT}",
          "bg": "assets/tollweaver-realm.png",
          "text": "Then we break the seal. Watch the anchor chains; every gate must still be standing when this is over."
        }
      ],
      "postCutscene": [
        {
          "speaker": "Wayfarers’ Chronicle",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/tollweaver-realm.png",
          "text": "The seals crack. The gates settle onto their own hinges, and the stolen years stream back to the waiting travelers."
        },
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/tollweaver-realm.png",
          "text": "The roads are open, but some travelers cannot remember where home is. A paper trail runs from these chains to a vault beyond the next junction."
        },
        {
          "speaker": "{HERO_2_OR_1}",
          "side": "left",
          "portrait": "{HERO_2_OR_1_PORTRAIT}",
          "bg": "assets/tollweaver-realm.png",
          "text": "At Wayfarers' Hearth, we strengthen one spell before following that trail. A rescued road should lead somewhere worth returning to."
        }
      ]
    },
    {
      "id": "hush",
      "level": 2,
      "name": "Archivist Hush",
      "title": "Usurper of Memory",
      "season": "Chapter 2 • Memory",
      "location": "The Unremembered Vault",
      "bg": "assets/hush-realm.png",
      "portrait": "assets/hush.png",
      "baseHp": 135,
      "desc": "Erase histories so all dimensions believe they have always belonged to the archive.",
      "moves": [
        {
          "name": "Unwritten Wound",
          "dmg": 14,
          "burn": 3,
          "desc": "Deals 14 damage; adds 3 extra damage."
        },
        {
          "name": "Confiscated Recollection",
          "dmg": 11,
          "heal": 10,
          "shield": 10,
          "desc": "Deals 11 damage; gains 10 Shield; heals 10 HP."
        },
        {
          "name": "Blank Census",
          "dmg": 13,
          "weaken": 2,
          "targetAll": true,
          "desc": "Deals 13 damage to all fairies; inflicts 2 Weaken (-4 Attack damage)."
        },
        {
          "name": "Final Redaction",
          "dmg": 21,
          "burn": 4,
          "targetAll": true,
          "desc": "Deals 21 damage to all fairies; adds 4 extra damage."
        }
      ],
      "preCutscene": [
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/hush-realm.png",
          "text": "The freed roads lead to a silent vault. Shelves carry the names of towns whose citizens no longer remember founding them."
        },
        {
          "speaker": "Archivist Hush",
          "side": "right",
          "portrait": "assets/hush.png",
          "bg": "assets/hush-realm.png",
          "text": "A history full of mistakes is a burden. I have spared them. Soon every world will remember only serving this archive."
        },
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/hush-realm.png",
          "text": "You have not spared anyone. You have stolen the evidence that their lives were their own."
        },
        {
          "speaker": "{HERO_2_OR_1}",
          "side": "left",
          "portrait": "{HERO_2_OR_1_PORTRAIT}",
          "bg": "assets/hush-realm.png",
          "text": "Stand together. We will keep speaking the names on those shelves until their owners can answer."
        }
      ],
      "postCutscene": [
        {
          "speaker": "Wayfarers’ Chronicle",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/hush-realm.png",
          "text": "Memory jars open without breaking. Names, songs, and the records of ordinary lives return to the communities that made them."
        },
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/hush-realm.png",
          "text": "One record ends in the middle of a sentence. Its final timestamp repeats across a thousand worlds. Someone has pinned an hour in place."
        },
        {
          "speaker": "{HERO_2_OR_1}",
          "side": "left",
          "portrait": "{HERO_2_OR_1_PORTRAIT}",
          "bg": "assets/hush-realm.png",
          "text": "We carry the missing hour toward the Unmoving Foundry. First, back at the Hearth, we attune one spell for the work ahead."
        }
      ]
    },
    {
      "id": "caldrum",
      "level": 3,
      "name": "Caldrum the Still",
      "title": "Usurper of Time",
      "season": "Chapter 3 • Time",
      "location": "The Unmoving Foundry",
      "bg": "assets/caldrum-realm.png",
      "portrait": "assets/caldrum.png",
      "baseHp": 155,
      "desc": "Freeze every world's future at the moment of his coronation.",
      "moves": [
        {
          "name": "Pendulum Blow",
          "dmg": 15,
          "weaken": 2,
          "desc": "Deals 15 damage; inflicts 2 Weaken (-4 Attack damage)."
        },
        {
          "name": "Moment Held",
          "dmg": 12,
          "shield": 14,
          "desc": "Deals 12 damage; gains 14 Shield."
        },
        {
          "name": "Furnace of Lost Hours",
          "dmg": 18,
          "burn": 4,
          "targetAll": true,
          "desc": "Deals 18 damage to all fairies; adds 4 extra damage."
        },
        {
          "name": "The Eternal Coronation",
          "dmg": 24,
          "entangle": 1,
          "targetAll": true,
          "desc": "Deals 24 damage to all fairies; reduces fairy Inspire by 1."
        }
      ],
      "preCutscene": [
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/caldrum-realm.png",
          "text": "The recovered histories reveal a missing hour. We follow it to a foundry where a hammer hangs motionless above its anvil."
        },
        {
          "speaker": "Caldrum the Still",
          "side": "right",
          "portrait": "assets/caldrum.png",
          "bg": "assets/caldrum-realm.png",
          "text": "A future is merely an opportunity for disobedience. My coronation shall last forever; your worlds will never outgrow their king."
        },
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/caldrum-realm.png",
          "text": "Your workers cannot even finish a breath. That is not a reign. It is a cage."
        },
        {
          "speaker": "{HERO_2_OR_1}",
          "side": "left",
          "portrait": "{HERO_2_OR_1_PORTRAIT}",
          "bg": "assets/caldrum-realm.png",
          "text": "His pendulum drives the stillness. Draw its force into our shields, then strike between the beats."
        }
      ],
      "postCutscene": [
        {
          "speaker": "Wayfarers’ Chronicle",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/caldrum-realm.png",
          "text": "The pendulum slows to an honest rhythm. The hammer lands; its maker exhales. Beyond the foundry, a thousand clocks begin to disagree again."
        },
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/caldrum-realm.png",
          "text": "Let them disagree. Different worlds deserve different tomorrows. But these eviction notices are dated before any of them were born."
        },
        {
          "speaker": "{HERO_2_OR_1}",
          "side": "left",
          "portrait": "{HERO_2_OR_1_PORTRAIT}",
          "bg": "assets/caldrum-realm.png",
          "text": "The signatures point toward the Contract Bazaar. At the Hearth we attune a spell, then go to ask what was actually agreed."
        }
      ]
    },
    {
      "id": "velis",
      "level": 4,
      "name": "Broker Velis",
      "title": "Usurper of Consent",
      "season": "Chapter 4 • Consent",
      "location": "The Contract Bazaar",
      "bg": "assets/velis-realm.png",
      "portrait": "assets/velis.png",
      "altPortrait": "assets/velis.png",
      "baseHp": 175,
      "desc": "Purchase the names of dimensions through deceptive contracts and own their inhabitants.",
      "moves": [
        {
          "name": "Hidden Fee",
          "dmg": 16,
          "shield": 14,
          "desc": "Deals 16 damage; gains 14 Shield."
        },
        {
          "name": "Compulsory Transfer",
          "dmg": 17,
          "entangle": 1,
          "targetAll": true,
          "desc": "Deals 17 damage to all fairies; reduces fairy Inspire by 1."
        },
        {
          "name": "Poisoned Clause",
          "dmg": 15,
          "burn": 5,
          "weaken": 2,
          "desc": "Deals 15 damage; adds 5 extra damage; inflicts 2 Weaken (-4 Attack damage)."
        },
        {
          "name": "Foreclosure of Worlds",
          "dmg": 25,
          "targetAll": true,
          "desc": "Deals 25 damage to all fairies."
        }
      ],
      "preCutscene": [
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/velis-realm.png",
          "text": "The foundry wakes, but its supply roads carry eviction notices. Every notice bears a signature from the Contract Bazaar."
        },
        {
          "speaker": "Broker Velis",
          "side": "right",
          "portrait": "assets/velis.png",
          "bg": "assets/velis-realm.png",
          "text": "Their delegates signed quite willingly. The small print transfers each dimension's name to me. Its inhabitants are included, naturally."
        },
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/velis-realm.png",
          "text": "A signature obtained by hiding the price is not consent. Let them read the full contract and choose again."
        },
        {
          "speaker": "{HERO_2_OR_1}",
          "side": "left",
          "portrait": "{HERO_2_OR_1_PORTRAIT}",
          "bg": "assets/velis-realm.png",
          "text": "Keep her seals away from the gates. We are here to return a choice, not sign a better prison."
        }
      ],
      "postCutscene": [
        {
          "speaker": "Wayfarers’ Chronicle",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/velis-realm.png",
          "text": "The hidden clauses shine across the bazaar. Delegates withdraw their signatures, and their dimensions' names return to their own keeping."
        },
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/velis-realm.png",
          "text": "Velis sold the futures she claimed to own. Follow that emerald pipe; the stolen possibilities are still flowing."
        },
        {
          "speaker": "{HERO_2_OR_1}",
          "side": "left",
          "portrait": "{HERO_2_OR_1_PORTRAIT}",
          "bg": "assets/velis-realm.png",
          "text": "The Borrowed Dawn waits at its other end. One spell attunement at the Hearth will help us bring those futures home intact."
        }
      ]
    },
    {
      "id": "morrow",
      "level": 5,
      "name": "The Morrow Engine",
      "title": "Usurper of Possibility",
      "season": "Chapter 5 • Possibility",
      "location": "The Borrowed Dawn",
      "bg": "assets/morrow-realm.png",
      "portrait": "assets/morrow.png",
      "baseHp": 195,
      "desc": "Consume every possible tomorrow to fuel one endless imperial present.",
      "moves": [
        {
          "name": "Future Consumed",
          "dmg": 18,
          "burn": 5,
          "desc": "Deals 18 damage; adds 5 extra damage."
        },
        {
          "name": "Petal Turbine",
          "dmg": 17,
          "entangle": 1,
          "targetAll": true,
          "desc": "Deals 17 damage to all fairies; reduces fairy Inspire by 1."
        },
        {
          "name": "Reserved Sunrise",
          "dmg": 15,
          "shield": 16,
          "heal": 10,
          "desc": "Deals 15 damage; gains 16 Shield; heals 10 HP."
        },
        {
          "name": "Imperial Present",
          "dmg": 27,
          "weaken": 2,
          "targetAll": true,
          "desc": "Deals 27 damage to all fairies; inflicts 2 Weaken (-4 Attack damage)."
        }
      ],
      "preCutscene": [
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/morrow-realm.png",
          "text": "With the contracts opened, their payment trail becomes visible: unborn possibilities flow through a pipe into a captive sunrise."
        },
        {
          "speaker": "The Morrow Engine",
          "side": "right",
          "portrait": "assets/morrow.png",
          "bg": "assets/morrow-realm.png",
          "text": "All alternate outcomes are inefficient. Surrender your tomorrows. One enduring empire will relieve you of uncertainty."
        },
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/morrow-realm.png",
          "text": "You are burning the chances people have not had yet. Even the dawn must be allowed to become a different day."
        },
        {
          "speaker": "{HERO_2_OR_1}",
          "side": "left",
          "portrait": "{HERO_2_OR_1_PORTRAIT}",
          "bg": "assets/morrow-realm.png",
          "text": "Disconnect the feeder petals. If we simply shatter the core, every borrowed morning dies with it."
        }
      ],
      "postCutscene": [
        {
          "speaker": "Wayfarers’ Chronicle",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/morrow-realm.png",
          "text": "The petals open outward. Hundreds of possible sunrises drift back to their worlds. The engine settles into a harmless, empty seed."
        },
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/morrow-realm.png",
          "text": "In the new light, those silhouettes should have different faces. They do not. Aurex has been replacing people while everyone watched the sky."
        },
        {
          "speaker": "{HERO_2_OR_1}",
          "side": "left",
          "portrait": "{HERO_2_OR_1_PORTRAIT}",
          "bg": "assets/morrow-realm.png",
          "text": "We return to the Hearth to attune a spell, then cross to the Hall of One Face. Every missing voice matters."
        }
      ]
    },
    {
      "id": "aurex",
      "level": 6,
      "name": "Chancellor Aurex",
      "title": "Usurper of Identity",
      "season": "Chapter 6 • Identity",
      "location": "The Hall of One Face",
      "bg": "assets/aurex-realm.png",
      "portrait": "assets/aurex.png",
      "altPortrait": "assets/aurex.png",
      "baseHp": 215,
      "desc": "Replace each world's people with obedient reflections of a single approved identity.",
      "moves": [
        {
          "name": "Approved Double",
          "dmg": 19,
          "shield": 15,
          "desc": "Deals 19 damage; gains 15 Shield."
        },
        {
          "name": "Common Face",
          "dmg": 20,
          "weaken": 2,
          "targetAll": true,
          "desc": "Deals 20 damage to all fairies; inflicts 2 Weaken (-4 Attack damage)."
        },
        {
          "name": "Name Erasure",
          "dmg": 18,
          "entangle": 1,
          "burn": 5,
          "desc": "Deals 18 damage; adds 5 extra damage; reduces fairy Inspire by 1."
        },
        {
          "name": "Perfect Uniformity",
          "dmg": 29,
          "burn": 5,
          "targetAll": true,
          "desc": "Deals 29 damage to all fairies; adds 5 extra damage."
        }
      ],
      "preCutscene": [
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/aurex-realm.png",
          "text": "The released dawn reveals streets full of identical faces. Their shadows still show the people they used to be."
        },
        {
          "speaker": "Chancellor Aurex",
          "side": "right",
          "portrait": "assets/aurex.png",
          "bg": "assets/aurex-realm.png",
          "text": "Difference leads to conflict. My approved reflection is peaceful, useful, and identical everywhere. Soon all dimensions will share it."
        },
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/aurex-realm.png",
          "text": "Peace does not require everyone to disappear. We can disagree and still look after one another."
        },
        {
          "speaker": "{HERO_2_OR_1}",
          "side": "left",
          "portrait": "{HERO_2_OR_1_PORTRAIT}",
          "bg": "assets/aurex-realm.png",
          "text": "The masks hold their names. Break the command ring, not the reflections; there are people inside them."
        }
      ],
      "postCutscene": [
        {
          "speaker": "Wayfarers’ Chronicle",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/aurex-realm.png",
          "text": "The command ring breaks. Reflections become windows, and the people behind them step back into their own shapes and names."
        },
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/aurex-realm.png",
          "text": "All six stolen powers were routed through one place. The conquerors thought they were rivals. Something has been collecting their claims."
        },
        {
          "speaker": "{HERO_2_OR_1}",
          "side": "left",
          "portrait": "{HERO_2_OR_1_PORTRAIT}",
          "bg": "assets/aurex-realm.png",
          "text": "The Loomheart is calling. We attune our next spell at the Hearth and go together, with no oath except the one we freely renew."
        }
      ]
    },
    {
      "id": "covenant",
      "level": 7,
      "name": "The Crowned Covenant",
      "title": "Usurper of Freedom",
      "season": "Chapter 7 • Freedom",
      "location": "The Loomheart",
      "bg": "assets/covenant-realm.png",
      "portrait": "assets/covenant.png",
      "baseHp": 240,
      "desc": "Fuse the stolen powers into a living law that prevents disagreement by abolishing free choice.",
      "moves": [
        {
          "name": "Binding Edict",
          "dmg": 21,
          "weaken": 2,
          "desc": "Deals 21 damage; inflicts 2 Weaken (-4 Attack damage)."
        },
        {
          "name": "Crown of Clauses",
          "dmg": 18,
          "shield": 18,
          "entangle": 1,
          "desc": "Deals 18 damage; reduces fairy Inspire by 1; gains 18 Shield."
        },
        {
          "name": "Compulsory Harmony",
          "dmg": 22,
          "burn": 5,
          "targetAll": true,
          "desc": "Deals 22 damage to all fairies; adds 5 extra damage."
        },
        {
          "name": "Law Without Appeal",
          "dmg": 32,
          "weaken": 3,
          "targetAll": true,
          "desc": "Deals 32 damage to all fairies; inflicts 3 Weaken (-6 Attack damage)."
        }
      ],
      "preCutscene": [
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/covenant-realm.png",
          "text": "Every freed junction sends a thread toward the Loomheart. There, a crown has woven the conquerors' discarded claims into a single living law."
        },
        {
          "speaker": "The Crowned Covenant",
          "side": "right",
          "portrait": "assets/covenant.png",
          "bg": "assets/covenant-realm.png",
          "text": "Passage, memory, time, consent, possibility, identity: all produce conflict. Accept my perfect order. Freedom shall be unnecessary."
        },
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/covenant-realm.png",
          "text": "You gathered their claims, but not the people they claimed. No one here has given you the right to decide their lives."
        },
        {
          "speaker": "{HERO_2_OR_1}",
          "side": "left",
          "portrait": "{HERO_2_OR_1_PORTRAIT}",
          "bg": "assets/covenant-realm.png",
          "text": "We cannot destroy the Loomways. Hold the connections steady. We will unravel the command and leave the roads."
        }
      ],
      "postCutscene": [
        {
          "speaker": "Wayfarers’ Chronicle",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/covenant-realm.png",
          "text": "The crown comes apart clause by clause. Its light does not go out; it flows into roads that no longer demand obedience from those who walk them."
        },
        {
          "speaker": "{HERO_1}",
          "side": "left",
          "portrait": "{HERO_1_PORTRAIT}",
          "bg": "assets/covenant-realm.png",
          "text": "We have not made a perfect universe. We have given its people room to make their own imperfect choices, and ways to help one another."
        },
        {
          "speaker": "{HERO_2_OR_1}",
          "side": "left",
          "portrait": "{HERO_2_OR_1_PORTRAIT}",
          "bg": "assets/covenant-realm.png",
          "text": "At Wayfarers' Hearth, seven lanterns remain lit. The Accord is not a throne or a law. It is a promise that can be offered again tomorrow."
        }
      ]
    }
  ],
  "groupAttuned": "assets/cover.png",
  "groupWayfarer": "assets/cover.png",
  "accordArt": "assets/cover.png"
};
