import * as THREE from 'three';

export function createPlayerRig() {
  const root = new THREE.Group();

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe2b89b, roughness: 0.7 });
  const tunicMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
  const armorMat = new THREE.MeshStandardMaterial({ color: 0x854d27, roughness: 0.5, metalness: 0.35 });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.9, 0.45), tunicMat);
  torso.position.y = 1.25;
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Armor Chestplate + Pauldrons + Helm Crest (toggled/colored dynamically)
  const armorGroup = new THREE.Group();
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.72, 0.52), armorMat);
  chestPlate.position.y = 1.3;
  chestPlate.castShadow = true;
  armorGroup.add(chestPlate);

  const pauldronL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.42), armorMat);
  pauldronL.position.set(-0.52, 1.56, 0);
  pauldronL.castShadow = true;
  armorGroup.add(pauldronL);

  const pauldronR = pauldronL.clone();
  pauldronR.position.x = 0.52;
  armorGroup.add(pauldronR);

  const helmCrest = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.24, 0.56), armorMat);
  helmCrest.position.y = 2.15;
  helmCrest.castShadow = true;
  armorGroup.add(helmCrest);
  bodyGroup.add(armorGroup);

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
  head.position.y = 1.98;
  head.castShadow = true;
  bodyGroup.add(head);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.28, 0.75, 0.32);
  const legL = new THREE.Mesh(legGeo, tunicMat);
  legL.position.set(-0.2, 0.42, 0);
  legL.castShadow = true;
  bodyGroup.add(legL);

  const legR = new THREE.Mesh(legGeo, tunicMat);
  legR.position.set(0.2, 0.42, 0);
  legR.castShadow = true;
  bodyGroup.add(legR);

  // Right Arm Pivot (holds Blade or Wand)
  const armRPivot = new THREE.Group();
  armRPivot.position.set(0.54, 1.55, 0);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.24), skinMat);
  armR.position.y = -0.28;
  armR.castShadow = true;
  armRPivot.add(armR);

  const weaponAnchor = new THREE.Group();
  weaponAnchor.position.set(0, -0.58, 0.14);
  weaponAnchor.rotation.x = Math.PI / 2.2;
  armRPivot.add(weaponAnchor);
  bodyGroup.add(armRPivot);

  // Left Arm Pivot (Guard Shield)
  const armLPivot = new THREE.Group();
  armLPivot.position.set(-0.54, 1.55, 0);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.24), skinMat);
  armL.position.y = -0.28;
  armL.castShadow = true;
  armLPivot.add(armL);

  const shieldMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.52, 0.08, 6),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.65,
    })
  );
  shieldMesh.rotation.x = Math.PI / 2;
  shieldMesh.position.set(0, -0.3, 0.45);
  shieldMesh.visible = false;
  armLPivot.add(shieldMesh);
  bodyGroup.add(armLPivot);

  return {
    root,
    bodyGroup,
    armorGroup,
    armorMat,
    legL,
    legR,
    armRPivot,
    armLPivot,
    weaponAnchor,
    shieldMesh,
  };
}

export function updatePlayerGearVisuals(rig, gearState) {
  // Armor visibility & tint
  const armor = gearState.armor;
  if (armor && armor.durability > 0) {
    rig.armorGroup.visible = true;
    rig.armorMat.color.setHex(armor.color);
    rig.armorMat.emissive.setHex(armor.glow || 0x000000);
    rig.armorMat.emissiveIntensity = armor.glow ? 0.35 : 0;
  } else {
    rig.armorGroup.visible = false;
  }

  // Clear weapon anchor
  while (rig.weaponAnchor.children.length > 0) {
    rig.weaponAnchor.remove(rig.weaponAnchor.children[0]);
  }

  const activeKey = gearState.activeWeapon; // 'blade' | 'wand'
  const item = gearState[activeKey];
  if (!item || item.durability <= 0) return;

  if (item.category === 'blade') {
    const hilt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0x451a03 })
    );
    rig.weaponAnchor.add(hilt);

    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.07, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.3 })
    );
    guard.position.y = 0.18;
    rig.weaponAnchor.add(guard);

    let bladeGeo;
    if (item.partB === 'katana') {
      bladeGeo = new THREE.BoxGeometry(0.07, 1.35, 0.04);
    } else if (item.partB === 'cleaver') {
      bladeGeo = new THREE.BoxGeometry(0.28, 1.15, 0.06);
    } else {
      bladeGeo = new THREE.BoxGeometry(0.14, 1.2, 0.05);
    }

    const bladeMat = new THREE.MeshStandardMaterial({
      color: item.color,
      metalness: 0.65,
      roughness: 0.25,
      emissive: item.glow || 0x000000,
      emissiveIntensity: item.glow ? 0.45 : 0,
    });
    const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
    bladeMesh.position.y = 0.85;
    bladeMesh.castShadow = true;
    rig.weaponAnchor.add(bladeMesh);
  } else if (item.category === 'wand') {
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.055, 1.05, 8),
      new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.6 })
    );
    shaft.position.y = 0.35;
    shaft.castShadow = true;
    rig.weaponAnchor.add(shaft);

    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      new THREE.MeshStandardMaterial({
        color: item.glow,
        emissive: item.glow,
        emissiveIntensity: 0.9,
        roughness: 0.15,
      })
    );
    orb.position.y = 0.98;
    rig.weaponAnchor.add(orb);
  }
}

export function createMonsterRig(type, tier = 1) {
  const group = new THREE.Group();
  const scale = type === 'brute' ? 1.45 : type === 'knight' ? 1.3 : type === 'wolf' ? 0.9 : 1.0;

  let bodyColor = 0x4d7c0f;
  let eyeColor = 0xfef08a;
  if (type === 'brute') {
    bodyColor = 0x57534e;
    eyeColor = 0xf97316;
  } else if (type === 'mage') {
    bodyColor = 0x581c87;
    eyeColor = 0x38bdf8;
  } else if (type === 'knight') {
    bodyColor = 0x1e1b4b;
    eyeColor = 0xf43f5e;
  } else if (type === 'wolf') {
    bodyColor = 0x475569;
    eyeColor = 0xf59e0b;
  } else if (type === 'scorpion') {
    bodyColor = 0x9a3412;
    eyeColor = 0xfacc15;
  } else if (type === 'wraith') {
    bodyColor = 0x0e7490;
    eyeColor = 0x67e8f9;
  }

  const mat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: type === 'wraith' ? 0.3 : 0.75,
    emissive: type === 'wraith' ? 0x0891b2 : 0x000000,
    emissiveIntensity: type === 'wraith' ? 0.45 : 0,
  });

  let body;
  if (type === 'wolf') {
    body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 1.35), mat);
    body.position.y = 0.6;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 0.55), mat);
    head.position.set(0, 0.92, 0.72);
    head.castShadow = true;
    group.add(head);

    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.05), eyeMat);
    eyeL.position.set(-0.11, 0.98, 1.0);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.11;
    group.add(eyeL, eyeR);
  } else if (type === 'scorpion') {
    body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.42, 1.15), mat);
    body.position.y = 0.42;
    body.castShadow = true;
    group.add(body);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.85, 0.24), mat);
    tail.position.set(0, 1.0, -0.55);
    tail.rotation.x = 0.35;
    group.add(tail);

    const stinger = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.35, 5),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    stinger.position.set(0, 1.45, -0.35);
    stinger.rotation.x = Math.PI / 2;
    group.add(stinger);

    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.05), eyeMat);
    eyeL.position.set(-0.16, 0.54, 0.58);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.16;
    group.add(eyeL, eyeR);
  } else {
    body = new THREE.Mesh(
      type === 'wraith'
        ? new THREE.ConeGeometry(0.55, 1.65, 6)
        : new THREE.BoxGeometry(0.8 * scale, 1.1 * scale, 0.55 * scale),
      mat
    );
    body.position.y = type === 'wraith' ? 1.05 : 0.9 * scale;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.55 * scale, 0.52 * scale, 0.52 * scale), mat);
    head.position.y = 1.72 * scale;
    head.castShadow = true;
    group.add(head);

    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1 * scale, 0.08 * scale, 0.05 * scale), eyeMat);
    eyeL.position.set(-0.13 * scale, 1.76 * scale, 0.27 * scale);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.13 * scale;
    group.add(eyeL, eyeR);
  }

  if (type === 'knight' || type === 'brute') {
    const club = new THREE.Mesh(
      new THREE.BoxGeometry(0.22 * scale, 1.15 * scale, 0.22 * scale),
      new THREE.MeshStandardMaterial({ color: type === 'knight' ? 0x38bdf8 : 0x78350f, emissive: type === 'knight' ? 0x0284c7 : 0x000000, emissiveIntensity: 0.5 })
    );
    club.position.set(0.58 * scale, 1.0 * scale, 0.3 * scale);
    club.rotation.x = Math.PI / 4;
    group.add(club);
  }

  // Floating HP bar
  const hpBg = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1 * scale, 0.12),
    new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.DoubleSide })
  );
  hpBg.position.y = (type === 'wolf' || type === 'scorpion' ? 1.65 : 2.35) * scale;
  group.add(hpBg);

  const hpFill = new THREE.Mesh(
    new THREE.PlaneGeometry(1.04 * scale, 0.08),
    new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
  );
  hpFill.position.set(0, hpBg.position.y, 0.01);
  group.add(hpFill);

  return { group, body, hpBg, hpFill, scale, tier };
}

export function createCampsiteMesh() {
  const group = new THREE.Group();

  // Stone ring
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), stoneMat);
    stone.position.set(Math.cos(a) * 1.05, 0.18, Math.sin(a) * 1.05);
    stone.castShadow = true;
    group.add(stone);
  }

  // Logs
  const logMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.4, 6), logMat);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = (i * Math.PI) / 3;
    log.position.y = 0.18;
    group.add(log);
  }

  // Flame
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 1.05, 6),
    new THREE.MeshBasicMaterial({ color: 0xf97316 })
  );
  flame.position.y = 0.65;
  group.add(flame);

  const innerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.7, 5),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  innerFlame.position.y = 0.55;
  group.add(innerFlame);

  const light = new THREE.PointLight(0xf97316, 2.4, 24);
  light.position.y = 1.4;
  group.add(light);

  // Subtle vertical beacon so player can spot campsites from afar
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.25, 16, 8, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
  );
  beacon.position.y = 8;
  group.add(beacon);

  // Field Forge Anvil next to campfire
  const anvil = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.65, 0.55),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 })
  );
  anvil.position.set(2.4, 0.35, 0.6);
  anvil.castShadow = true;
  group.add(anvil);

  // Bedroll
  const bedroll = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.18, 2.0),
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.9 })
  );
  bedroll.position.set(-2.3, 0.1, -0.5);
  bedroll.rotation.y = 0.4;
  group.add(bedroll);

  return { group, flame, innerFlame, light };
}

export function createMineEntranceMesh() {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95, flatShading: true });

  // Quarry rock mound
  const mound = new THREE.Mesh(new THREE.DodecahedronGeometry(3.2, 0), rockMat);
  mound.position.set(0, 1.4, -2.5);
  mound.scale.set(1.4, 0.9, 1.0);
  mound.castShadow = true;
  group.add(mound);

  // Timber Archway
  const postL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.0, 0.35), woodMat);
  postL.position.set(-1.5, 1.5, 0.6);
  postL.castShadow = true;
  const postR = postL.clone();
  postR.position.x = 1.5;
  const beam = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.38, 0.45), woodMat);
  beam.position.set(0, 3.0, 0.6);
  group.add(postL, postR, beam);

  // Lantern
  const lantern = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.35, 0.28),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  lantern.position.set(0, 2.65, 0.85);
  group.add(lantern);

  return group;
}

export function createOreMesh(kind) {
  const group = new THREE.Group();
  if (kind === 'wood') {
    const logMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    for (let i = 0; i < 3; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 1.3, 6), logMat);
      log.rotation.z = Math.PI / 2;
      log.position.set(0, 0.2 + (i === 2 ? 0.26 : 0), i === 0 ? -0.2 : i === 1 ? 0.2 : 0);
      log.castShadow = true;
      group.add(log);
    }
    return group;
  }

  let rockColor = 0x475569;
  let veinColor = 0x94a3b8;
  let emissive = 0x000000;
  if (kind === 'obsidian') {
    rockColor = 0x1e1b2e;
    veinColor = 0x9333ea;
    emissive = 0x581c87;
  } else if (kind === 'sunstone') {
    rockColor = 0x57534e;
    veinColor = 0xf59e0b;
    emissive = 0xd97706;
  } else if (kind === 'crystal') {
    rockColor = 0x334155;
    veinColor = 0x38bdf8;
    emissive = 0x0284c7;
  } else if (kind === 'frostquartz') {
    rockColor = 0x64748b;
    veinColor = 0xa5f3fc;
    emissive = 0x0891b2;
  } else if (kind === 'brimstone') {
    rockColor = 0x292524;
    veinColor = 0xf97316;
    emissive = 0xea580c;
  } else if (kind === 'voidshard') {
    rockColor = 0x1e1b4b;
    veinColor = 0xc084fc;
    emissive = 0x7e22ce;
  }

  const base = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.78, 0),
    new THREE.MeshStandardMaterial({ color: rockColor, roughness: 0.9, flatShading: true })
  );
  base.position.y = 0.55;
  base.castShadow = true;
  group.add(base);

  const veinMat = new THREE.MeshStandardMaterial({
    color: veinColor,
    emissive,
    emissiveIntensity: 0.7,
    roughness: 0.25,
  });
  for (let i = 0; i < 3; i++) {
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), veinMat);
    shard.position.set((i - 1) * 0.35, 0.95 + (i % 2) * 0.2, (i === 1 ? 0.28 : -0.18));
    shard.scale.set(0.7, 1.4, 0.7);
    group.add(shard);
  }
  return group;
}
