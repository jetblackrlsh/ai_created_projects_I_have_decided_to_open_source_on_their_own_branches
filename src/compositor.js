import { MATERIALS_META, getDurabilityRatio, getConditionLabel, computeCraftCost, getRepairCost } from './gear.js';

function roundRect(ctx, x, y, w, h, r = 10) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawPanel(ctx, x, y, w, h, fill = 'rgba(13, 17, 26, 0.82)', stroke = 'rgba(148, 163, 184, 0.28)') {
  ctx.save();
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = stroke;
  ctx.stroke();
  ctx.restore();
}

function drawBar(ctx, x, y, w, h, pct, color) {
  ctx.save();
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fill();
  const fw = Math.max(0, Math.min(1, pct)) * w;
  if (fw > 0) {
    roundRect(ctx, x, y, fw, h, h / 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();
}

export function drawReplayFrame(ctx, w, h, game) {
  // 1. Base 3D WebGL canvas
  ctx.drawImage(game.canvas, 0, 0, w, h);

  const pad = 16;

  // 2. Top-Left Vitals Panel
  drawPanel(ctx, pad, pad, 290, 142);
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('IRONBOUND WILDS', pad + 12, pad + 24);

  ctx.fillStyle = game.input.padConnected ? '#86efac' : '#94a3b8';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(game.input.padConnected ? '● Xbox Pad' : '● KB/M', pad + 205, pad + 24);

  // HP
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText('HEALTH', pad + 12, pad + 45);
  ctx.fillText(`${Math.ceil(game.player.hp)} / ${game.player.maxHp}`, pad + 225, pad + 45);
  drawBar(ctx, pad + 12, pad + 51, 266, 9, game.player.hp / game.player.maxHp, '#ef4444');

  // Stamina
  const stamPct = game.player.stamina / game.player.maxStamina;
  ctx.fillStyle = stamPct < 0.25 ? '#fb7185' : '#cbd5e1';
  ctx.fillText(stamPct < 0.25 ? 'STAMINA (REST NEEDED!)' : 'STAMINA', pad + 12, pad + 77);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`${Math.ceil(game.player.stamina)} / ${game.player.maxStamina}`, pad + 225, pad + 77);
  drawBar(ctx, pad + 12, pad + 83, 266, 9, stamPct, stamPct < 0.25 ? '#f59e0b' : '#22c55e');

  // Biome, Time, Weather, Slain
  const biomeLabel = game.world.getBiomeLabel(game.currentBiome);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(`${biomeLabel} • Day ${game.stats.day} • ${game._getTimeLabel()} • ${game.weather}`, pad + 12, pad + 111);
  ctx.fillText(`Slain: ${game.stats.slain}   Mined: ${game.stats.mined}`, pad + 12, pad + 129);

  // 3. Top-Right Minimap
  drawPanel(ctx, w - 166 - pad, pad, 166, 174);
  ctx.save();
  ctx.beginPath();
  ctx.arc(w - pad - 83, pad + 83, 72, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(game.minimapCanvas, w - pad - 155, pad + 11, 144, 144);
  ctx.restore();
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText('Camp (Gold)  Mine (Blue)  Foe (Red)', w - pad - 156, pad + 166);

  // 4. Bottom-Left Equipped Gear Cards
  const gearY = h - pad - 196;
  drawPanel(ctx, pad, gearY, 310, 196);
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('EQUIPPED GEAR  (Y: Swap Weapon)', pad + 12, gearY + 20);

  const slots = ['blade', 'wand', 'armor'];
  slots.forEach((key, idx) => {
    const sy = gearY + 30 + idx * 54;
    const item = game.gear[key];
    const isAct = game.gear.activeWeapon === key;
    drawPanel(
      ctx,
      pad + 10,
      sy,
      290,
      48,
      isAct ? 'rgba(245, 158, 11, 0.14)' : 'rgba(15, 23, 42, 0.72)',
      isAct ? 'rgba(245, 158, 11, 0.8)' : 'rgba(255, 255, 255, 0.1)'
    );
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(`[${key.toUpperCase()}] ${item ? item.name : 'BROKEN / NONE'}`, pad + 18, sy + 17);
    const pct = item ? Math.round(getDurabilityRatio(item) * 100) : 0;
    ctx.fillText(`${pct}%`, pad + 266, sy + 17);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px system-ui, sans-serif';
    const desc = (item?.effectDesc || 'Forge a replacement at a Campsite.').slice(0, 48);
    ctx.fillText(desc, pad + 18, sy + 31);
    drawBar(ctx, pad + 18, sy + 37, 272, 5, pct / 100, pct < 25 ? '#ef4444' : pct < 60 ? '#f59e0b' : '#38bdf8');
  });

  // 5. Bottom-Right Materials
  const matW = 290;
  const matH = 128;
  drawPanel(ctx, w - matW - pad, h - matH - pad, matW, matH);
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('MATERIALS', w - matW - pad + 12, h - matH - pad + 20);
  const matEntries = Object.entries(MATERIALS_META);
  matEntries.forEach(([k, meta], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const mx = w - matW - pad + 12 + col * 90;
    const my = h - matH - pad + 32 + row * 28;
    drawPanel(ctx, mx, my, 84, 22, 'rgba(15, 23, 42, 0.78)', 'rgba(255, 255, 255, 0.08)');
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(meta.short, mx + 6, my + 15);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(String(game.materials[k] || 0), mx + 62, my + 15);
  });

  // 6. Context Prompt
  const promptEl = document.getElementById('context-prompt');
  if (promptEl && !promptEl.classList.contains('hidden')) {
    const txt = document.getElementById('context-text')?.textContent || '';
    drawPanel(ctx, w / 2 - 140, h - 108, 280, 34, 'rgba(15, 23, 42, 0.92)', 'rgba(59, 130, 246, 0.7)');
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`[X] ${txt}`, w / 2, h - 86);
    ctx.textAlign = 'left';
  }

  // 7. Active Toasts
  const toasts = [...document.querySelectorAll('#toast-container .toast')];
  toasts.slice(-3).forEach((t, i) => {
    const ty = 18 + i * 32;
    const isDanger = t.classList.contains('danger');
    drawPanel(ctx, w / 2 - 190, ty, 380, 26, 'rgba(15, 23, 42, 0.92)', isDanger ? '#f43f5e' : '#f59e0b');
    ctx.fillStyle = isDanger ? '#fecdd3' : '#fef3c7';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t.textContent.slice(0, 56), w / 2, ty + 17);
    ctx.textAlign = 'left';
  });

  // 8. Campsite & Field Forge Modal Overlay (shows player's choices!)
  if (game.forgeDialog.open) {
    ctx.fillStyle = 'rgba(5, 8, 15, 0.68)';
    ctx.fillRect(0, 0, w, h);
    const mw = 680;
    const mh = 430;
    const mx = (w - mw) / 2;
    const my = (h - mh) / 2;
    drawPanel(ctx, mx, my, mw, mh, '#111827', 'rgba(148, 163, 184, 0.4)');

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('CAMPSITE & FIELD FORGE', mx + 22, my + 34);

    // Active tab indicator
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'rest';
    const tabs = [
      { id: 'rest', label: 'Camp & Repair' },
      { id: 'craft', label: 'Forge Custom Gear' },
      { id: 'satchel', label: 'Satchel & Loadout' },
    ];
    tabs.forEach((tb, idx) => {
      const tx = mx + 22 + idx * 175;
      const act = tb.id === activeTab;
      drawPanel(ctx, tx, my + 48, 165, 28, act ? '#f59e0b' : 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.15)');
      ctx.fillStyle = act ? '#111827' : '#e2e8f0';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(tb.label, tx + 14, my + 66);
    });

    if (activeTab === 'rest') {
      drawPanel(ctx, mx + 22, my + 90, 305, 140, 'rgba(15, 23, 42, 0.85)');
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText('Rest by the Fire', mx + 36, my + 116);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('Restores 100% HP & Stamina until Dawn.', mx + 36, my + 140);

      drawPanel(ctx, mx + 342, my + 90, 316, 230, 'rgba(15, 23, 42, 0.85)');
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText('Repair Equipped Gear', mx + 356, my + 116);
      ['blade', 'armor', 'wand'].forEach((k, i) => {
        const it = game.gear[k];
        const ry = my + 132 + i * 54;
        drawPanel(ctx, mx + 356, ry, 288, 44, 'rgba(255,255,255,0.05)');
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '12px system-ui, sans-serif';
        if (it) {
          const pct = Math.round(getDurabilityRatio(it) * 100);
          const rc = Object.entries(getRepairCost(it)).map(([mk, mv]) => `${mv} ${MATERIALS_META[mk].short}`).join(', ') || 'Full';
          ctx.fillText(`${it.name} (${pct}% - ${getConditionLabel(it)})`, mx + 366, ry + 18);
          ctx.fillStyle = '#f59e0b';
          ctx.fillText(`Repair: ${rc}`, mx + 366, ry + 35);
        } else {
          ctx.fillText(`${k.toUpperCase()}: None equipped`, mx + 366, ry + 26);
        }
      });
    } else if (activeTab === 'craft') {
      const cat = document.getElementById('craft-category').value;
      const a = document.getElementById('craft-part-a').value;
      const b = document.getElementById('craft-part-b').value;
      const c = document.getElementById('craft-part-c').value;
      const pName = document.getElementById('craft-preview-name').textContent;
      const pEff = document.getElementById('craft-preview-effect').textContent;
      const cost = computeCraftCost(cat, a, b, c);

      drawPanel(ctx, mx + 22, my + 90, 290, 230, 'rgba(15, 23, 42, 0.85)');
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(`Category: ${cat.toUpperCase()}`, mx + 36, my + 120);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`Primary: ${a}`, mx + 36, my + 152);
      ctx.fillText(`Style / Secondary: ${b}`, mx + 36, my + 184);
      if (cat === 'blade') ctx.fillText(`Enchantment: ${c}`, mx + 36, my + 216);

      drawPanel(ctx, mx + 328, my + 90, 330, 230, 'rgba(15, 23, 42, 0.85)');
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText(pName, mx + 342, my + 118);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillText(pEff.slice(0, 52), mx + 342, my + 144);
      ctx.fillText(pEff.slice(52, 104), mx + 342, my + 160);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px system-ui, sans-serif';
      const costLine = Object.entries(cost).map(([k, v]) => `${MATERIALS_META[k].short}: ${game.materials[k] || 0}/${v}`).join('  ');
      ctx.fillText(costLine || 'No materials needed', mx + 342, my + 205);
    } else {
      drawPanel(ctx, mx + 22, my + 90, 636, 230, 'rgba(15, 23, 42, 0.85)');
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText('Equipped & Satchel Loadout', mx + 36, my + 116);
      const allItems = [
        ...['blade', 'armor', 'wand'].map((k) => game.gear[k] && { item: game.gear[k], eq: true }).filter(Boolean),
        ...game.gear.satchel.map((item) => ({ item, eq: false })),
      ];
      allItems.slice(0, 5).forEach((entry, i) => {
        const iy = my + 130 + i * 34;
        ctx.fillStyle = entry.eq ? '#86efac' : '#cbd5e1';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText(
          `[${entry.item.category.toUpperCase()}] ${entry.item.name} (${Math.round(getDurabilityRatio(entry.item) * 100)}%)${entry.eq ? ' — EQUIPPED' : ''}`,
          mx + 36,
          iy + 16
        );
      });
    }

    // Highlight player's most recent campsite choice!
    if (game.lastForgeAction && game.lastForgeActionTimer > 0) {
      drawPanel(ctx, mx + 22, my + mh - 58, mw - 44, 38, 'rgba(34, 197, 94, 0.22)', '#22c55e');
      ctx.fillStyle = '#dcfce7';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`PLAYER ACTION: ${game.lastForgeAction}`, mx + mw / 2, my + mh - 34);
      ctx.textAlign = 'left';
    }
  }

  // 9. Cinematic Day Transition Screen
  if (game.dayTransitionTimer > 0) {
    const alpha = Math.min(1, game.dayTransitionTimer / 0.6, (3.2 - game.dayTransitionTimer) / 0.5 + 0.2);
    ctx.save();
    ctx.fillStyle = `rgba(6, 10, 20, ${0.78 * alpha})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 54px Georgia, serif';
    ctx.fillText(`DAY ${game.stats.day}`, w / 2, h / 2 - 14);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 20px system-ui, sans-serif';
    ctx.fillText(`Weather: ${game.weather}  •  ${game.world.getBiomeLabel(game.currentBiome)}`, w / 2, h / 2 + 28);
    ctx.restore();
  }

  // 10. Game Over Overlay
  if (game.gameoverDialog.open) {
    ctx.fillStyle = 'rgba(5, 8, 15, 0.78)';
    ctx.fillRect(0, 0, w, h);
    drawPanel(ctx, w / 2 - 260, h / 2 - 130, 520, 260, '#111827', '#f43f5e');
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText('FALLEN IN THE WILDS', w / 2, h / 2 - 74);
    ctx.fillStyle = '#fecdd3';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(document.getElementById('gameover-reason').textContent.slice(0, 68), w / 2, h / 2 - 34);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(
      `Days: ${game.stats.day}  |  Slain: ${game.stats.slain}  |  Mined: ${game.stats.mined}  |  Forged: ${game.stats.crafted}`,
      w / 2,
      h / 2 + 18
    );
    ctx.textAlign = 'left';
  }
}
