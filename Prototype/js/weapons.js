import { dist, rand } from './utils.js';
import { applyDamage } from './enemies.js';

export const WEAPONS = {
  throwing_axe: {
    id: 'throwing_axe',
    name: 'Throwing Axe',
    type: 'thrown',
    executionType: 'projectile',
    slotIcon: 'A',
    damage: 12,
    fireRate: 0.55,
    projectileSpeed: 450,
    projectileLifetime: 1.2,
    range: 500,
    pierce: 0,
    projectiles: 1,
    spread: 0,
    color: '#c89c5f',
    edgeColor: '#8a6938',
    projectileSize: 5,
    projectileShape: 'blade',
    spins: true,
    cost: 90
  },
  throwing_knife: {
    id: 'throwing_knife',
    name: 'Throwing Knife',
    type: 'thrown',
    executionType: 'projectile',
    slotIcon: 'K',
    damage: 5,
    fireRate: 0.25,
    projectileSpeed: 600,
    projectileLifetime: 0.9,
    range: 400,
    pierce: 0,
    projectiles: 3,
    spread: 0.35,
    color: '#b8b8b8',
    edgeColor: '#666666',
    projectileSize: 3,
    projectileShape: 'blade',
    spins: true,
    rageGain: 0.3,
    cost: 75
  },
  warhammer: {
    id: 'warhammer',
    name: 'Warhammer',
    type: 'melee',
    executionType: 'arc',
    slotIcon: 'W',
    damage: 25,
    fireRate: 1.2,
    arcRange: 80,
    color: '#c89c5f',
    cost: 120
  },
  longbow: {
    id: 'longbow',
    name: 'Longbow',
    type: 'ranged',
    executionType: 'projectile',
    slotIcon: 'L',
    damage: 40,
    fireRate: 1.4,
    projectileSpeed: 700,
    projectileLifetime: 1.2,
    range: 700,
    pierce: 0,
    projectiles: 1,
    spread: 0,
    color: '#f0e4c8',
    edgeColor: '#3a2a1a',
    projectileSize: 4,
    projectileShape: 'arrow',
    spins: false,
    fireFlashDuration: 0.1,
    cost: 130
  }
};

// --- Fire patterns ---------------------------------------------------------

function firePattern_projectile(game, slot, weapon) {
  const player = game.player;
  const berserkerDmgMult = player.berserker > 0 ? 2 : 1;

  // Nearest enemy within weapon.range
  let nearest = null, nd = Infinity;
  for (const e of game.enemies) {
    const d = dist(player, e);
    if (d < nd && d < weapon.range) { nd = d; nearest = e; }
  }
  if (!nearest) return false;

  const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
  player.facing = baseAngle;

  const dmg = (weapon.damage + player.damageBonus) * berserkerDmgMult;
  const n = weapon.projectiles;
  const spread = weapon.spread;

  for (let i = 0; i < n; i++) {
    const offset = n === 1 ? 0 : (-spread / 2) + (spread * i / (n - 1));
    const a = baseAngle + offset;
    game.projectiles.push({
      x: player.x, y: player.y,
      vx: Math.cos(a) * weapon.projectileSpeed,
      vy: Math.sin(a) * weapon.projectileSpeed,
      r: weapon.projectileSize,
      damage: dmg,
      life: weapon.projectileLifetime,
      // Arrows fly fixed at fire angle; blades start at 0 and spin
      rotation: weapon.spins === false ? a : 0,
      color: weapon.color,
      edgeColor: weapon.edgeColor,
      pierce: weapon.pierce,
      hitEnemies: null,
      shape: weapon.projectileShape || 'blade',
      spins: weapon.spins !== false,
      rageGain: weapon.rageGain ?? 1
    });
  }

  if (weapon.fireFlashDuration) slot.fireFlashTimer = weapon.fireFlashDuration;
  return true;
}

function firePattern_arc(game, slot, weapon) {
  const player = game.player;
  const enemies = game.enemies;
  const berserkerDmgMult = player.berserker > 0 ? 2 : 1;
  const dmg = (weapon.damage + player.damageBonus) * berserkerDmgMult;
  const reach = weapon.arcRange;

  let nearest = null, nd = Infinity;
  let hit = false;

  // Iterate in reverse so killEnemy splices don't disturb iteration
  for (let j = enemies.length - 1; j >= 0; j--) {
    const e = enemies[j];
    const d = dist(player, e);
    if (d < nd) { nd = d; nearest = e; }
    if (d > reach + e.r) continue;

    hit = true;
    applyDamage(game, e, j, dmg, {
      hitX: e.x, hitY: e.y,
      color: weapon.color,
      particleCount: 3,
      rageGain: weapon.rageGain ?? 1
    });
  }

  if (!hit) return false;

  if (nearest) {
    player.facing = Math.atan2(nearest.y - player.y, nearest.x - player.x);
  }
  slot.swingTimer = 0.2;
  game.shake = Math.max(game.shake, 4);
  return true;
}

const FIRE_PATTERNS = {
  projectile: firePattern_projectile,
  arc: firePattern_arc
};

// --- Public ---------------------------------------------------------------

export function updateAutoFire(game, dt) {
  const player = game.player;
  const berserkerFireMult = player.berserker > 0 ? 1.5 : 1;

  for (const slot of player.weapons) {
    if (!slot) continue;
    slot.cooldown -= dt;
    if (slot.swingTimer > 0) slot.swingTimer -= dt;
    if (slot.fireFlashTimer > 0) slot.fireFlashTimer -= dt;
    if (slot.cooldown > 0) continue;
    if (game.enemies.length === 0) continue;

    const weapon = WEAPONS[slot.weaponId];
    const pattern = FIRE_PATTERNS[weapon.executionType] || firePattern_projectile;
    const fired = pattern(game, slot, weapon);
    if (fired) {
      slot.cooldown = (weapon.fireRate * player.fireRateMult) / berserkerFireMult;
    }
  }
}

export function updatePlayerProjectiles(game, dt) {
  const { projectiles, enemies, player, W, H } = game;
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.life -= dt;
    if (p.spins) p.rotation += dt * (100 / p.r);
    if (p.life <= 0 || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
      projectiles.splice(i, 1);
      continue;
    }
    // Arrow trail (bright cream comet tail for visibility)
    if (p.shape === 'arrow') {
      game.particles.push({
        x: p.x, y: p.y,
        vx: 0, vy: 0,
        life: 0.2, maxLife: 0.2,
        color: '#fff5d0', r: 2
      });
    }
    let removed = false;
    for (let j = enemies.length - 1; j >= 0 && !removed; j--) {
      const e = enemies[j];
      if (p.hitEnemies && p.hitEnemies.includes(e)) continue;
      if (dist(p, e) < p.r + e.r) {
        applyDamage(game, e, j, p.damage, {
          hitX: p.x, hitY: p.y,
          color: p.color,
          rageGain: p.rageGain ?? 1
        });
        if (p.pierce > 0) {
          p.pierce--;
          if (!p.hitEnemies) p.hitEnemies = [];
          p.hitEnemies.push(e);
        } else {
          projectiles.splice(i, 1);
          removed = true;
        }
      }
    }
  }
}
