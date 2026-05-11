import { dist, rand } from './utils.js';
import { applyDamage } from './enemies.js';
import { playSound } from './sounds.js';

export const WEAPONS = {
  throwing_axe: {
    id: 'throwing_axe',
    name: 'Throwing Axe',
    type: 'thrown',
    tags: ['thrown'],
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
    fireSound: 'axe',
    cost: 90
  },
  throwing_knife: {
    id: 'throwing_knife',
    name: 'Throwing Knife',
    type: 'thrown',
    tags: ['thrown'],
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
    fireSound: 'knives',
    cost: 75
  },
  warhammer: {
    id: 'warhammer',
    name: 'Warhammer',
    type: 'melee',
    tags: ['melee'],
    executionType: 'arc',
    slotIcon: 'W',
    damage: 25,
    fireRate: 1.2,
    arcRange: 80,
    color: '#c89c5f',
    fireSound: 'hammer',
    cost: 120
  },
  longbow: {
    id: 'longbow',
    name: 'Longbow',
    type: 'ranged',
    tags: ['ranged'],
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
    fireSound: 'arrow',
    cost: 130
  },
  rune: {
    id: 'rune',
    name: 'Rune',
    type: 'magic',
    tags: ['magic', 'ranged'],
    executionType: 'projectile',
    slotIcon: 'R',
    damage: 60,
    fireRate: 2.0,
    projectileSpeed: 350,
    projectileLifetime: 1.7,
    range: 600,
    pierce: 0,
    projectiles: 1,
    spread: 0,
    color: '#7ec0e8',
    edgeColor: '#4a8db5',
    projectileSize: 7,
    projectileShape: 'rune',
    spins: true,
    statusEffect: { type: 'frost', params: { timer: 2.0, slowMult: 0.6 } },
    fireSound: 'rune',
    cost: 150
  },
  mjolnir: {
    id: 'mjolnir',
    name: 'Mjolnir',
    type: 'thrown',
    tags: ['thrown'],
    executionType: 'boomerang',
    slotIcon: 'M',
    damage: 22,
    fireRate: 1.8,
    projectileSpeed: 500,
    projectileLifetime: 5.0,
    maxThrowDistance: 350,
    projectileSize: 10,
    projectileShape: 'hammer',
    spins: true,
    color: '#c89c5f',
    edgeColor: '#7a6238',
    fireSound: 'axe',
    cost: 170
  }
};

// --- Effective stat lookups -----------------------------------------------
// These merge the global player stat with any matching weapon-tag overlay
// from scoped items (Whetstone Belt, Eager Hand, etc).

function getEffectiveDamageBonus(player, weapon) {
  let bonus = player.damageBonus ?? 0;
  if (weapon.tags && player.weaponTagBoosts) {
    for (const tag of weapon.tags) {
      const overlay = player.weaponTagBoosts[tag];
      if (overlay?.damageBonus) bonus += overlay.damageBonus;
    }
  }
  return bonus;
}

function getEffectiveFireRateMult(player, weapon) {
  let mult = player.fireRateMult ?? 1;
  if (weapon.tags && player.weaponTagBoosts) {
    for (const tag of weapon.tags) {
      const overlay = player.weaponTagBoosts[tag];
      if (overlay?.fireRateMult) mult *= overlay.fireRateMult;
    }
  }
  return mult;
}

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

  const dmg = (weapon.damage + getEffectiveDamageBonus(player, weapon)) * berserkerDmgMult;
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
      rageGain: weapon.rageGain ?? 1,
      statusEffect: weapon.statusEffect ?? null
    });
  }

  if (weapon.fireFlashDuration) slot.fireFlashTimer = weapon.fireFlashDuration;
  if (weapon.fireSound) playSound(weapon.fireSound, { volume: 0.25 });
  return true;
}

function firePattern_arc(game, slot, weapon) {
  const player = game.player;
  const enemies = game.enemies;
  const berserkerDmgMult = player.berserker > 0 ? 2 : 1;
  const dmg = (weapon.damage + getEffectiveDamageBonus(player, weapon)) * berserkerDmgMult;
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
  if (weapon.fireSound) playSound(weapon.fireSound, { volume: 0.25 });
  return true;
}

function firePattern_boomerang(game, slot, weapon) {
  const player = game.player;
  const berserkerDmgMult = player.berserker > 0 ? 2 : 1;

  // Pick nearest enemy as throw direction (no range filter — boomerang
  // can reach anything within its maxThrowDistance regardless)
  let nearest = null, nd = Infinity;
  for (const e of game.enemies) {
    const d = dist(player, e);
    if (d < nd) { nd = d; nearest = e; }
  }
  if (!nearest) return false;

  const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
  player.facing = angle;

  const dmg = (weapon.damage + getEffectiveDamageBonus(player, weapon)) * berserkerDmgMult;

  game.projectiles.push({
    x: player.x, y: player.y,
    vx: Math.cos(angle) * weapon.projectileSpeed,
    vy: Math.sin(angle) * weapon.projectileSpeed,
    r: weapon.projectileSize,
    damage: dmg,
    life: weapon.projectileLifetime,
    rotation: 0,
    color: weapon.color,
    edgeColor: weapon.edgeColor,
    shape: weapon.projectileShape || 'hammer',
    spins: weapon.spins !== false,
    pierce: 0,
    hitEnemies: null,
    rageGain: weapon.rageGain ?? 1,
    statusEffect: weapon.statusEffect ?? null,
    // Boomerang-specific state
    boomerangPhase: 'outgoing',
    hitThisLeg: [],
    maxThrowDistance: weapon.maxThrowDistance,
    originX: player.x,
    originY: player.y,
    speed: weapon.projectileSpeed
  });

  if (weapon.fireSound) playSound(weapon.fireSound, { volume: 0.25 });
  return true;
}

const FIRE_PATTERNS = {
  projectile: firePattern_projectile,
  arc: firePattern_arc,
  boomerang: firePattern_boomerang
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
      slot.cooldown = (weapon.fireRate * getEffectiveFireRateMult(player, weapon)) / berserkerFireMult;
    }
  }
}

export function updatePlayerProjectiles(game, dt) {
  const { projectiles, enemies, player, W, H } = game;
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];

    // --- Motion ---
    if (p.boomerangPhase === 'returning') {
      // Home toward current player position at constant speed
      const dx = player.x - p.x, dy = player.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 0.1) {
        p.vx = (dx / d) * p.speed;
        p.vy = (dy / d) * p.speed;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // Caught: despawn when player reaches projectile
      if (d < p.r + player.r + 6) {
        projectiles.splice(i, 1);
        continue;
      }
    } else {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // Boomerang turnaround check (outbound only)
      if (p.boomerangPhase === 'outgoing') {
        const ox = p.x - p.originX, oy = p.y - p.originY;
        if (Math.hypot(ox, oy) >= p.maxThrowDistance) {
          p.boomerangPhase = 'returning';
          p.hitThisLeg.length = 0;
        }
      }
    }

    p.life -= dt;
    if (p.spins) p.rotation += dt * (100 / p.r);

    // Lifetime / out-of-bounds despawn. Boomerangs ignore OOB since they
    // self-bound via maxThrowDistance and home back to the player.
    const oob = p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20;
    if (p.life <= 0 || (oob && !p.boomerangPhase)) {
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

    // --- Hit detection ---
    let removed = false;
    for (let j = enemies.length - 1; j >= 0 && !removed; j--) {
      const e = enemies[j];
      // Dedup by the right set: boomerang uses per-leg, pierce uses
      // permanent hitEnemies
      if (p.boomerangPhase) {
        if (p.hitThisLeg.includes(e)) continue;
      } else if (p.hitEnemies && p.hitEnemies.includes(e)) {
        continue;
      }
      if (dist(p, e) < p.r + e.r) {
        applyDamage(game, e, j, p.damage, {
          hitX: p.x, hitY: p.y,
          color: p.color,
          rageGain: p.rageGain ?? 1,
          statusEffect: p.statusEffect
        });
        if (p.boomerangPhase) {
          p.hitThisLeg.push(e);
          // Boomerang keeps flying — no despawn or pierce decrement
        } else if (p.pierce > 0) {
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
