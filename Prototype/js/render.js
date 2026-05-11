import { MONASTERY_HEIGHT } from './config.js';
import { rand } from './utils.js';
import { WEAPONS } from './weapons.js';

export function render(game) {
  const ctx = game.ctx;
  const W = game.W, H = game.H;
  const { enemies, projectiles, enemyProjectiles, particles, pickups, player, gameTime, shake } = game;

  ctx.save();

  // Screen shake
  if (shake > 0.5) {
    ctx.translate(rand(-shake, shake), rand(-shake, shake));
  }

  // Sky / void above monastery
  ctx.fillStyle = '#0a0a10';
  ctx.fillRect(0, 0, W, MONASTERY_HEIGHT);

  // Battlefield ground
  ctx.fillStyle = '#1a1812';
  ctx.fillRect(0, MONASTERY_HEIGHT, W, H - MONASTERY_HEIGHT);

  // Cobblestone-ish texture (subtle pattern)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 1;
  const gs = 32;
  for (let y = MONASTERY_HEIGHT; y < H; y += gs) {
    const offset = ((y - MONASTERY_HEIGHT) / gs) % 2 === 0 ? 0 : gs / 2;
    for (let x = offset; x < W; x += gs) {
      ctx.strokeRect(x, y, gs, gs);
    }
  }
  // Warm highlight scattered
  ctx.fillStyle = 'rgba(200, 156, 95, 0.025)';
  ctx.fillRect(0, MONASTERY_HEIGHT, W, H - MONASTERY_HEIGHT);

  // Draw monastery facade
  drawMonastery(ctx, W, gameTime);

  // (Vignette moved to a CSS pseudo-element on .game-frame so it stays
  // viewport-centered when the camera pans on mobile.)

  // --- Pickups ---
  for (const pk of pickups) {
    pk.bob += 0.1;
    const yOff = Math.sin(pk.bob) * 2;
    if (pk.type === 'mead_flask') drawMeadFlask(ctx, pk, yOff);
    else drawHacksilver(ctx, pk, yOff);
  }

  // --- Enemies ---
  for (const e of enemies) {
    drawEnemy(ctx, e);
  }

  // --- Player ---
  drawPlayer(ctx, player, gameTime);

  // --- Projectiles ---
  for (const p of projectiles) drawProjectile(ctx, p);
  for (const p of enemyProjectiles) drawEnemyProjectile(ctx, p);

  // --- Particles ---
  for (const p of particles) {
    if (p.kind === 'dmg_num') drawDamageNumber(ctx, p);
    else drawSpark(ctx, p);
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawMonastery(ctx, W, gameTime) {
  // Main wall body
  ctx.fillStyle = '#3d3830';
  ctx.fillRect(0, 24, W, MONASTERY_HEIGHT - 24);

  // Lighter wall stones (texture variation)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let y = 30; y < MONASTERY_HEIGHT - 6; y += 14) {
    const offset = ((y - 30) / 14) % 2 === 0 ? 0 : 28;
    for (let x = offset; x < W; x += 56) {
      ctx.fillRect(x + 2, y + 2, 24, 10);
    }
  }

  // Block joint lines
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 1;
  for (let y = 30; y < MONASTERY_HEIGHT; y += 14) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    const offset = ((y - 30) / 14) % 2 === 0 ? 0 : 28;
    for (let x = offset; x < W; x += 56) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 14); ctx.stroke();
    }
  }

  // Crenellations along top
  ctx.fillStyle = '#2a2620';
  for (let x = 0; x < W; x += 32) {
    ctx.fillRect(x, 8, 18, 18);
  }

  // Left tower
  ctx.fillStyle = '#332e28';
  ctx.fillRect(60, 0, 72, MONASTERY_HEIGHT);
  // Right tower
  ctx.fillRect(W - 132, 0, 72, MONASTERY_HEIGHT);

  // Tower crenellations
  ctx.fillStyle = '#1a1612';
  [60, 90, 120].forEach(x => ctx.fillRect(x, 0, 14, 14));
  [W-132, W-102, W-72].forEach(x => ctx.fillRect(x, 0, 14, 14));

  // Tower arrow slits
  ctx.fillStyle = '#000000';
  ctx.fillRect(92, 50, 6, 18);
  ctx.fillRect(92, 90, 6, 18);
  ctx.fillRect(92, 130, 6, 18);
  ctx.fillRect(W - 100, 50, 6, 18);
  ctx.fillRect(W - 100, 90, 6, 18);
  ctx.fillRect(W - 100, 130, 6, 18);

  // Cross above gate (Christian monastery)
  ctx.strokeStyle = '#c89c5f';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(W/2, 2); ctx.lineTo(W/2, 32);
  ctx.moveTo(W/2 - 9, 14); ctx.lineTo(W/2 + 9, 14);
  ctx.stroke();
  ctx.lineCap = 'butt';

  // Gate - arched dark opening
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(W/2 - 42, MONASTERY_HEIGHT);
  ctx.lineTo(W/2 - 42, 90);
  ctx.arc(W/2, 90, 42, Math.PI, 0);
  ctx.lineTo(W/2 + 42, MONASTERY_HEIGHT);
  ctx.closePath();
  ctx.fill();

  // Gate arch stones (lighter trim)
  ctx.strokeStyle = '#8a7a5a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W/2 - 42, MONASTERY_HEIGHT);
  ctx.lineTo(W/2 - 42, 90);
  ctx.arc(W/2, 90, 42, Math.PI, 0);
  ctx.lineTo(W/2 + 42, MONASTERY_HEIGHT);
  ctx.stroke();

  // Inner glow in gate (ominous red)
  const gateGrad = ctx.createRadialGradient(W/2, MONASTERY_HEIGHT - 20, 5, W/2, MONASTERY_HEIGHT - 20, 50);
  gateGrad.addColorStop(0, 'rgba(163, 36, 36, 0.4)');
  gateGrad.addColorStop(1, 'rgba(163, 36, 36, 0)');
  ctx.fillStyle = gateGrad;
  ctx.fillRect(W/2 - 50, 90, 100, MONASTERY_HEIGHT - 90);

  // Torch flames flanking the gate
  drawTorch(ctx, W/2 - 62, 130, gameTime);
  drawTorch(ctx, W/2 + 62, 130, gameTime);

  // Banners on towers (blood red, hanging)
  ctx.fillStyle = '#8b1e1e';
  ctx.fillRect(82, 70, 28, 60);
  ctx.fillRect(W - 110, 70, 28, 60);
  // Banner trim
  ctx.strokeStyle = '#c89c5f';
  ctx.lineWidth = 1;
  ctx.strokeRect(82, 70, 28, 60);
  ctx.strokeRect(W - 110, 70, 28, 60);
  // Cross on banner
  ctx.strokeStyle = '#ede2c8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(96, 80); ctx.lineTo(96, 110);
  ctx.moveTo(89, 90); ctx.lineTo(103, 90);
  ctx.moveTo(W - 96, 80); ctx.lineTo(W - 96, 110);
  ctx.moveTo(W - 103, 90); ctx.lineTo(W - 89, 90);
  ctx.stroke();

  // Shadow gradient cast onto battlefield from monastery
  const shadowGrad = ctx.createLinearGradient(0, MONASTERY_HEIGHT, 0, MONASTERY_HEIGHT + 60);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(0, MONASTERY_HEIGHT, W, 60);
}

function drawTorch(ctx, x, y, gameTime) {
  const flicker = Math.sin(gameTime * 11 + x) * 1.5;
  const flicker2 = Math.sin(gameTime * 7 + x) * 0.8;
  // Torch holder
  ctx.fillStyle = '#2a1a0e';
  ctx.fillRect(x - 2, y, 4, 12);
  // Outer flame
  ctx.fillStyle = '#f7a040';
  ctx.beginPath();
  ctx.ellipse(x, y - 3 + flicker2, 5, 9 + flicker, 0, 0, Math.PI * 2);
  ctx.fill();
  // Inner flame
  ctx.fillStyle = '#ffd966';
  ctx.beginPath();
  ctx.ellipse(x, y - 4 + flicker2, 2.5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Glow
  const tg = ctx.createRadialGradient(x, y - 3, 0, x, y - 3, 30);
  tg.addColorStop(0, 'rgba(247, 160, 64, 0.3)');
  tg.addColorStop(1, 'rgba(247, 160, 64, 0)');
  ctx.fillStyle = tg;
  ctx.fillRect(x - 30, y - 30, 60, 60);
}

function drawPlayer(ctx, player, gameTime) {
  const p = player;
  const flicker = p.invuln > 0 && Math.floor(p.invuln * 20) % 2 === 0;
  if (flicker) return;

  ctx.save();
  ctx.translate(p.x, p.y);

  // Shadow on ground
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, p.r + 2, p.r - 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Berserker aura
  if (p.berserker > 0) {
    const pulse = Math.sin(gameTime * 14) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(212, 75, 31, ${0.3 * pulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, p.r + 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(247, 200, 74, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.r + 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Cape (drawn behind, opposite of facing direction)
  ctx.save();
  ctx.rotate(p.facing + Math.PI / 2);
  ctx.fillStyle = '#8b1e1e';
  ctx.beginPath();
  ctx.moveTo(-9, 2);
  ctx.bezierCurveTo(-14, 10, -8, 18, 0, 16);
  ctx.bezierCurveTo(8, 18, 14, 10, 9, 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4a0e0e';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Cape clasp
  ctx.fillStyle = '#c89c5f';
  ctx.beginPath();
  ctx.arc(0, 2, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Body / leather chest
  ctx.fillStyle = p.berserker > 0 ? '#a85020' : '#4a3520';
  ctx.beginPath();
  ctx.arc(0, 2, p.r - 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a0e08';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Chest strap (diagonal leather)
  ctx.strokeStyle = '#2a1808';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-p.r + 2, 0); ctx.lineTo(p.r - 2, 5);
  ctx.stroke();

  // Belt
  ctx.fillStyle = '#2a1a0e';
  ctx.fillRect(-p.r + 1, 6, p.r * 2 - 2, 3);
  ctx.fillStyle = '#c89c5f';
  ctx.fillRect(-2, 6, 4, 3);

  // Beard (front of face)
  ctx.fillStyle = '#2e1f10';
  ctx.beginPath();
  ctx.moveTo(-5, -1);
  ctx.quadraticCurveTo(0, 5, 5, -1);
  ctx.lineTo(4, -3);
  ctx.lineTo(-4, -3);
  ctx.closePath();
  ctx.fill();

  // Helmet (bronze dome covering top of head)
  ctx.fillStyle = p.berserker > 0 ? '#e8b85a' : '#9c7c4a';
  ctx.beginPath();
  ctx.arc(0, -3, 7, Math.PI, 0);
  ctx.lineTo(7, -2);
  ctx.lineTo(-7, -2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Nose guard
  ctx.fillStyle = p.berserker > 0 ? '#c89640' : '#7a5c30';
  ctx.fillRect(-1.5, -4, 3, 5);
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 1;
  ctx.strokeRect(-1.5, -4, 3, 5);

  // Horns
  ctx.strokeStyle = p.berserker > 0 ? '#fff5cc' : '#ede2c8';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-5, -7);
  ctx.quadraticCurveTo(-12, -10, -10, -14);
  ctx.moveTo(5, -7);
  ctx.quadraticCurveTo(12, -10, 10, -14);
  ctx.stroke();
  ctx.lineCap = 'butt';

  // Eye glow indicating facing direction (small bright dot)
  ctx.save();
  ctx.rotate(p.facing);
  ctx.fillStyle = p.berserker > 0 ? '#ffd966' : '#4a8db5';
  ctx.beginPath();
  ctx.arc(p.r - 2, -1, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Glow halo
  ctx.fillStyle = p.berserker > 0 ? 'rgba(255, 217, 102, 0.4)' : 'rgba(74, 141, 181, 0.4)';
  ctx.beginPath();
  ctx.arc(p.r - 2, -1, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Hammer swing visuals (any slot with an arc weapon mid-swing)
  for (const slot of p.weapons) {
    if (!slot || !slot.swingTimer || slot.swingTimer <= 0) continue;
    const weapon = WEAPONS[slot.weaponId];
    if (!weapon || weapon.executionType !== 'arc') continue;
    drawHammerSwing(ctx, slot, weapon);
  }

  // Fire-flash visuals (bow at release)
  for (const slot of p.weapons) {
    if (!slot || !slot.fireFlashTimer || slot.fireFlashTimer <= 0) continue;
    const weapon = WEAPONS[slot.weaponId];
    if (!weapon || !weapon.fireFlashDuration) continue;
    drawBowstringFlash(ctx, slot, weapon, p.facing);
  }

  ctx.restore();
}

function drawHammerSwing(ctx, slot, weapon) {
  const SWING_DURATION = 0.2;
  const t = Math.max(0, slot.swingTimer / SWING_DURATION); // 1 at peak, 0 at end
  const radius = weapon.arcRange * (1.0 - (1.0 - t) * 0.12);
  // Outer bright ring
  ctx.strokeStyle = `rgba(229, 184, 99, ${t * 0.9})`;
  ctx.lineWidth = 3 + t * 3;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  // Inner soft glow
  ctx.strokeStyle = `rgba(247, 200, 74, ${t * 0.35})`;
  ctx.lineWidth = 7 + t * 6;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawEnemy(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);

  const flash = e.hitFlash > 0;
  e.bob = (e.bob || 0) + 0.08;
  const walkBob = Math.sin(e.bob) * 0.8;

  // Shadow on ground
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, e.r + 2, e.r - 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, walkBob);

  if (e.boss) {
    // The Abbot: tall robed figure with cross staff
    // Robe body
    ctx.fillStyle = flash ? '#ffffff' : '#2a1f3a';
    ctx.beginPath();
    ctx.moveTo(-e.r, e.r);
    ctx.quadraticCurveTo(-e.r * 0.8, -e.r * 0.4, 0, -e.r * 0.6);
    ctx.quadraticCurveTo(e.r * 0.8, -e.r * 0.4, e.r, e.r);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0a0512';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Robe trim
    ctx.strokeStyle = e.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-e.r * 0.6, 0); ctx.lineTo(e.r * 0.6, 0);
    ctx.stroke();

    // Hood / head
    ctx.fillStyle = flash ? '#ffffff' : '#1a0e2a';
    ctx.beginPath();
    ctx.arc(0, -e.r * 0.5, e.r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0a0512';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glowing eyes inside hood
    ctx.fillStyle = '#d44b1f';
    ctx.beginPath();
    ctx.arc(-3, -e.r * 0.5, 1.5, 0, Math.PI * 2);
    ctx.arc(3, -e.r * 0.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Staff with cross (held diagonally)
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(e.r * 0.7, -e.r * 0.2); ctx.lineTo(e.r * 1.2, -e.r * 1.3);
    ctx.stroke();
    // Cross on staff
    ctx.strokeStyle = e.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(e.r * 1.05, -e.r * 1.0); ctx.lineTo(e.r * 1.35, -e.r * 1.6);
    ctx.moveTo(e.r * 1.0, -e.r * 1.4); ctx.lineTo(e.r * 1.4, -e.r * 1.2);
    ctx.stroke();

    // HP bar (boss only)
    const bw = 140, bh = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(-bw/2, -e.r - 28, bw, bh);
    ctx.fillStyle = '#a32424';
    ctx.fillRect(-bw/2, -e.r - 28, bw * (e.hp / e.maxHp), bh);
    ctx.strokeStyle = '#c89c5f';
    ctx.lineWidth = 1;
    ctx.strokeRect(-bw/2, -e.r - 28, bw, bh);

    // Boss name
    ctx.fillStyle = '#c89c5f';
    ctx.font = '700 11px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE ABBOT', 0, -e.r - 36);
  } else if (e.type === 'peasant') {
    // Ragged peasant: body + head + simple pitchfork
    // Body (tattered tunic)
    ctx.fillStyle = flash ? '#ffffff' : '#7a6a52';
    ctx.beginPath();
    ctx.arc(0, 2, e.r - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a2018';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Belt / rope
    ctx.strokeStyle = '#3a2a18';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-e.r + 2, 5); ctx.lineTo(e.r - 2, 5);
    ctx.stroke();
    // Head
    ctx.fillStyle = flash ? '#ffffff' : '#c8a880';
    ctx.beginPath();
    ctx.arc(0, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a2018';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Red bandana wrapped around forehead — peasant's distinguishing mark
    ctx.fillStyle = '#a32424';
    ctx.fillRect(-4, -6, 8, 2);
    // Tied knot on the side
    ctx.beginPath();
    ctx.moveTo(3, -6);
    ctx.lineTo(6, -5);
    ctx.lineTo(4, -4);
    ctx.closePath();
    ctx.fill();
    // Pitchfork tines
    ctx.strokeStyle = '#a89a78';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(e.r - 1, -3); ctx.lineTo(e.r + 6, -10);
    ctx.moveTo(e.r - 1, -3); ctx.lineTo(e.r + 8, -8);
    ctx.moveTo(e.r - 1, -3); ctx.lineTo(e.r + 7, -5);
    ctx.stroke();
  } else if (e.type === 'militia') {
    // Saxon militia: shield + sword
    // Body (tunic with belt)
    ctx.fillStyle = flash ? '#ffffff' : '#5e6a52';
    ctx.beginPath();
    ctx.arc(0, 2, e.r - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a2010';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Head
    ctx.fillStyle = flash ? '#ffffff' : '#c8a880';
    ctx.beginPath();
    ctx.arc(0, -6, 5, 0, Math.PI * 2);
    ctx.fill();
    // Simple iron cap
    ctx.fillStyle = '#5a5448';
    ctx.beginPath();
    ctx.arc(0, -6, 5, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1a1a14';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Round shield on left side
    ctx.fillStyle = '#6a4a2a';
    ctx.beginPath();
    ctx.arc(-e.r + 1, 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a2a18';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Shield boss (center metal)
    ctx.fillStyle = '#8aa07a';
    ctx.beginPath();
    ctx.arc(-e.r + 1, 2, 2, 0, Math.PI * 2);
    ctx.fill();
    // White cross painted on shield — militia kit emblem
    ctx.strokeStyle = '#ede2c8';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-e.r + 1, -2.5); ctx.lineTo(-e.r + 1, 6.5);
    ctx.moveTo(-e.r - 3, 2);    ctx.lineTo(-e.r + 5, 2);
    ctx.stroke();
    // Sword on right side
    ctx.strokeStyle = '#b8b8b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(e.r - 1, 4); ctx.lineTo(e.r + 5, -6);
    ctx.stroke();
  } else if (e.type === 'knight') {
    // Saxon knight: heavy armor, full helm
    // Body (chainmail dark)
    ctx.fillStyle = flash ? '#ffffff' : '#454d55';
    ctx.beginPath();
    ctx.arc(0, 2, e.r - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#15181c';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Chainmail texture (subtle dots)
    ctx.fillStyle = '#5a6470';
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 2; j++) {
        ctx.beginPath();
        ctx.arc(i * 4, 2 + j * 4, 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Shoulder pauldrons — steel plates on each shoulder, distinguishing
    // mark for "heavily armored." Drawn above body, below surcoat/tabard.
    ctx.fillStyle = flash ? '#ffffff' : '#9ba8b4';
    ctx.beginPath();
    ctx.arc(-e.r + 2, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(e.r - 2, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#15181c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(-e.r + 2, -2, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(e.r - 2, -2, 4, 0, Math.PI * 2);
    ctx.stroke();
    // Surcoat / tabard (red with cross)
    ctx.fillStyle = '#7a2020';
    ctx.fillRect(-4, -3, 8, 13);
    ctx.fillStyle = '#ede2c8';
    ctx.fillRect(-1, -3, 2, 13);
    ctx.fillRect(-4, 2, 8, 2);
    // Helmet (full helm with visor slit)
    ctx.fillStyle = flash ? '#ffffff' : '#7d8993';
    ctx.beginPath();
    ctx.arc(0, -8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#15181c';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Visor slit (horizontal black line)
    ctx.fillStyle = '#000000';
    ctx.fillRect(-4, -9, 8, 2);
    // Plume on top
    ctx.strokeStyle = '#8b1e1e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -14); ctx.quadraticCurveTo(4, -18, 6, -16);
    ctx.stroke();
    // Sword raised
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(e.r - 2, 5); ctx.lineTo(e.r + 4, -10);
    ctx.stroke();
  } else if (e.type === 'archer') {
    // Saxon archer: leather scout, hood, bow held in front, quiver on back
    // Quiver behind body (drawn first so it sits behind)
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(-e.r + 1, -5, 4, 11);
    ctx.strokeStyle = '#a89058';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-e.r + 2, -5); ctx.lineTo(-e.r + 2, -9);
    ctx.moveTo(-e.r + 3, -5); ctx.lineTo(-e.r + 3, -10);
    ctx.moveTo(-e.r + 4, -5); ctx.lineTo(-e.r + 4, -8);
    ctx.stroke();

    // Body (leather tunic)
    ctx.fillStyle = flash ? '#ffffff' : e.color;
    ctx.beginPath();
    ctx.arc(0, 2, e.r - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a1f10';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Belt
    ctx.strokeStyle = '#2a1808';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-e.r + 3, 6); ctx.lineTo(e.r - 3, 6);
    ctx.stroke();

    // Head (skin)
    ctx.fillStyle = flash ? '#ffffff' : '#c8a880';
    ctx.beginPath();
    ctx.arc(0, -5, 4, 0, Math.PI * 2);
    ctx.fill();
    // Hood (forest-green cloth over top of head — archer's signature)
    ctx.fillStyle = '#3a5a2a';
    ctx.beginPath();
    ctx.arc(0, -5, 4, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#1f2e16';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Bow (C-curve opening toward enemy, held to player-facing side)
    ctx.strokeStyle = '#a89058';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(e.r - 1, -6);
    ctx.quadraticCurveTo(e.r + 7, 0, e.r - 1, 6);
    ctx.stroke();
    // Bowstring
    ctx.strokeStyle = 'rgba(237, 226, 200, 0.7)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(e.r - 1, -6); ctx.lineTo(e.r - 1, 6);
    ctx.stroke();
  } else {
    // Fallback - generic enemy
    ctx.fillStyle = flash ? '#ffffff' : e.color;
    ctx.beginPath();
    ctx.arc(0, 0, e.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a1a20';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Frost overlay (translucent blue circle, distinct from white hit flash)
  if (e.statuses && e.statuses.frost && e.statuses.frost.timer > 0) {
    ctx.fillStyle = 'rgba(158, 212, 238, 0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, e.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // HP bar if damaged (non-boss)
  if (!e.boss && e.hp < e.maxHp) {
    const bw = e.r * 2, bh = 3;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-bw/2, -e.r - 8, bw, bh);
    ctx.fillStyle = '#a32424';
    ctx.fillRect(-bw/2, -e.r - 8, bw * (e.hp / e.maxHp), bh);
  }

  ctx.restore();
}

function drawProjectile(ctx, p) {
  switch (p.shape) {
    case 'arrow':  drawPlayerArrow(ctx, p); break;
    case 'rune':   drawRune(ctx, p); break;
    case 'hammer': drawMjolnir(ctx, p); break;
    default:       drawBladeProjectile(ctx, p);
  }
}

function drawBladeProjectile(ctx, p) {
  const s = p.r;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  // Handle (scales with size; matches original axe exactly at s=5)
  ctx.fillStyle = '#4a3a26';
  ctx.fillRect(-s * 1.6, -s * 0.2, s * 3.2, s * 0.4);
  // Blade
  ctx.fillStyle = p.color || '#c89c5f';
  ctx.beginPath();
  ctx.moveTo(s * 0.4, -s * 1.2);
  ctx.lineTo(s * 1.6, -s * 0.6);
  ctx.lineTo(s * 1.6, s * 0.6);
  ctx.lineTo(s * 0.4, s * 1.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = p.edgeColor || '#8a6938';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawRune(ctx, p) {
  const s = p.r;
  ctx.save();
  ctx.translate(p.x, p.y);
  // Outer ice glow (drawn before rotation so halo stays still)
  ctx.fillStyle = 'rgba(126, 192, 232, 0.32)';
  ctx.beginPath();
  ctx.arc(0, 0, s * 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(180, 220, 240, 0.25)';
  ctx.beginPath();
  ctx.arc(0, 0, s * 1.2, 0, Math.PI * 2);
  ctx.fill();
  // Glyph: six-armed star (three crossed line segments through center)
  ctx.rotate(p.rotation);
  ctx.strokeStyle = p.color || '#7ec0e8';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * -s, Math.sin(a) * -s);
    ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
    ctx.stroke();
  }
  // Bright cyan-white core
  ctx.fillStyle = '#e8f4fc';
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineCap = 'butt';
  ctx.restore();
}

function drawMjolnir(ctx, p) {
  const s = p.r;
  ctx.save();
  ctx.translate(p.x, p.y);
  // Warm bronze glow halo
  ctx.fillStyle = 'rgba(229, 184, 99, 0.3)';
  ctx.beginPath();
  ctx.arc(0, 0, s * 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Tumble
  ctx.rotate(p.rotation);
  // Wooden handle (extends below the head)
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(-s * 0.2, -s * 0.2, s * 0.4, s * 1.5);
  // Hammer head (trapezoid, bronze)
  ctx.fillStyle = p.color || '#c89c5f';
  ctx.beginPath();
  ctx.moveTo(-s * 1.1, -s * 0.7);
  ctx.lineTo(s * 1.1, -s * 0.7);
  ctx.lineTo(s * 0.9, -s * 0.2);
  ctx.lineTo(-s * 0.9, -s * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = p.edgeColor || '#7a6238';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Gold highlight stripe
  ctx.strokeStyle = 'rgba(247, 200, 74, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-s * 0.8, -s * 0.55); ctx.lineTo(s * 0.8, -s * 0.55);
  ctx.stroke();
  ctx.restore();
}

function drawPlayerArrow(ctx, p) {
  const s = p.r;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  // Soft warm glow halo (pops against dark battlefield)
  ctx.fillStyle = 'rgba(255, 240, 200, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 4, s * 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wooden shaft
  ctx.fillStyle = p.color || '#f0e4c8';
  ctx.fillRect(-s * 2.5, -s * 0.25, s * 5, s * 0.5);
  // Iron tip (triangle pointing forward)
  ctx.fillStyle = p.edgeColor || '#3a2a1a';
  ctx.beginPath();
  ctx.moveTo(s * 2.5, -s * 0.8);
  ctx.lineTo(s * 4.2, 0);
  ctx.lineTo(s * 2.5, s * 0.8);
  ctx.closePath();
  ctx.fill();
  // Fletching marks at the tail
  ctx.strokeStyle = '#ede2c8';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-s * 2.5, -s * 0.3); ctx.lineTo(-s * 1.6, -s * 1.0);
  ctx.moveTo(-s * 2.5, s * 0.3); ctx.lineTo(-s * 1.6, s * 1.0);
  ctx.stroke();
  ctx.restore();
}

function drawEnemyProjectile(ctx, p) {
  if (p.type === 'arrow') drawArrow(ctx, p);
  else drawPrayerBead(ctx, p);
}

function drawArrow(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  // Shaft (wood)
  ctx.fillStyle = '#6e5a3a';
  ctx.fillRect(-7, -1, 13, 2);
  // Tip (dark iron, triangular)
  ctx.fillStyle = '#1a1208';
  ctx.beginPath();
  ctx.moveTo(6, -2);
  ctx.lineTo(10, 0);
  ctx.lineTo(6, 2);
  ctx.closePath();
  ctx.fill();
  // Fletching (two small marks at the back)
  ctx.strokeStyle = '#d8c8a4';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-7, -1); ctx.lineTo(-5, -3);
  ctx.moveTo(-7, 1); ctx.lineTo(-5, 3);
  ctx.stroke();
  ctx.restore();
}

function drawPrayerBead(ctx, p) {
  // Red prayer beads / curse bolt (Abbot)
  ctx.fillStyle = '#a32424';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff8888';
  ctx.beginPath();
  ctx.arc(p.x - 1, p.y - 1, p.r * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawHacksilver(ctx, pk, yOff) {
  // Soft bone-white glow
  ctx.fillStyle = 'rgba(237, 226, 200, 0.2)';
  ctx.beginPath();
  ctx.arc(pk.x, pk.y + yOff, pk.r + 6, 0, Math.PI * 2);
  ctx.fill();
  // Coin core
  ctx.fillStyle = '#ede2c8';
  ctx.beginPath();
  ctx.arc(pk.x, pk.y + yOff, pk.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a6938';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawMeadFlask(ctx, pk, yOff) {
  // Amber glow on the ground
  ctx.fillStyle = 'rgba(229, 184, 99, 0.28)';
  ctx.beginPath();
  ctx.arc(pk.x, pk.y + yOff, pk.r + 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(pk.x, pk.y + yOff);

  // Drinking horn: narrow tip on left, wide rim on right
  ctx.fillStyle = '#5a3a1f';
  ctx.beginPath();
  ctx.moveTo(-7, 1);                              // tip
  ctx.bezierCurveTo(-3, -3, 3, -4, 7, -3);        // top arc
  ctx.lineTo(7, 3);                                // rim outer
  ctx.bezierCurveTo(3, 4, -2, 3, -7, 1);          // bottom arc back to tip
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2a1a0e';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Iron rim band at the wide end
  ctx.strokeStyle = '#7a6238';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(5, -3); ctx.lineTo(5, 3);
  ctx.stroke();

  // Amber mead glinting at the opening
  ctx.fillStyle = '#e5b863';
  ctx.beginPath();
  ctx.ellipse(6, 0, 1, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Faint highlight along the top edge
  ctx.strokeStyle = 'rgba(255, 220, 150, 0.5)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-4, -2); ctx.lineTo(3, -3);
  ctx.stroke();

  ctx.restore();
}

function drawSpark(ctx, p) {
  const a = p.life / p.maxLife;
  ctx.globalAlpha = a;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();
}

function drawDamageNumber(ctx, p) {
  const t = p.life / p.maxLife;
  // Fade out only in the final third of life
  const a = t < 0.33 ? t * 3 : 1;
  ctx.globalAlpha = a;
  ctx.font = '700 14px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.strokeText(p.text, p.x, p.y);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(p.text, p.x, p.y);
}

function drawBowstringFlash(ctx, slot, weapon, facing) {
  const t = slot.fireFlashTimer / weapon.fireFlashDuration;
  ctx.save();
  ctx.rotate(facing);
  ctx.strokeStyle = `rgba(229, 184, 99, ${t * 0.9})`;
  ctx.lineWidth = 1.5;
  const r0 = 8, r1 = 18 - t * 6;
  ctx.beginPath();
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
    ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
  }
  ctx.stroke();
  ctx.restore();
}
