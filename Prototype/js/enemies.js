import { rand, randInt, dist, clamp } from './utils.js';
import { ENEMY_DEFS, GATE_X, GATE_Y, MONASTERY_HEIGHT } from './config.js';
import { flashScreen, showGameOver } from './ui.js';
import { emit } from './events.js';
import { playSound } from './sounds.js';

export function spawnEnemy(game, type) {
  const def = ENEMY_DEFS[type];
  const W = game.W, H = game.H;
  let x, y;
  const gateChance = def.gateChance ?? 0.75;
  if (Math.random() < gateChance) {
    // Through the monastery gate
    x = GATE_X + rand(-32, 32);
    y = GATE_Y - rand(0, 20);
  } else {
    // Flank from arena edges (left, right, or bottom)
    const side = randInt(0, 2);
    const margin = 40;
    if (side === 0) { x = W + margin; y = rand(MONASTERY_HEIGHT + 30, H - 20); }
    else if (side === 1) { x = -margin; y = rand(MONASTERY_HEIGHT + 30, H - 20); }
    else { x = rand(40, W - 40); y = H + margin; }
  }

  // Per-enemy variance + occasional "elite" variants:
  //  - ±25% speed variance (the usual herd-spread)
  //  - 20% chance VANGUARD: extra ×1.30 speed (sprints ahead of pack)
  //  - 10% chance ELITE: ×1.50 HP (visibly tankier on inspection)
  // Variants can stack: 1-in-50 fast tank. Boss bypasses this (spawnBoss).
  let speedMult = 0.75 + Math.random() * 0.50;
  if (Math.random() < 0.15) speedMult *= 1.30;
  const eliteHpMult = Math.random() < 0.10 ? 1.50 : 1.0;

  // Militia flanking: each spawns into a lane so the mob splits into
  // converging streams (left flank / right flank / direct) instead of
  // arriving as one rolling wall. Offset decays inside 80px so melee
  // still lands. 40/40/20 distribution biases toward flank pressure.
  let lateralOffset;
  if (type === 'militia') {
    const r = Math.random();
    lateralOffset = r < 0.40 ? -85 : r < 0.80 ? 85 : 0;
  }

  game.enemies.push({
    type, x, y, r: def.r,
    hp: def.hp * eliteHpMult, maxHp: def.hp * eliteHpMult,
    speed: def.speed * speedMult,
    damage: def.damage,
    silver: def.silver,
    color: def.color, accent: def.accent,
    hitFlash: 0,
    fireCooldown: rand(2, 4),
    bob: rand(0, 6.28),
    behavior: def.behavior,
    // ±30% variance per ranged enemy so archers occupy different ring
    // distances instead of stacking on the same 250px arc.
    preferredDistance: def.preferredDistance != null
      ? def.preferredDistance * (0.7 + Math.random() * 0.6)
      : undefined,
    fireRange: def.fireRange,
    fireRate: def.fireRate,
    arrowSpeed: def.arrowSpeed,
    arrowDamage: def.arrowDamage,
    lateralOffset
  });
}

export function spawnBoss(game, type) {
  const def = ENEMY_DEFS[type];
  game.enemies.push({
    type, x: GATE_X, y: GATE_Y - 20, r: def.r,
    hp: def.hp, maxHp: def.hp,
    speed: def.speed,
    damage: def.damage,
    silver: def.silver,
    color: def.color, accent: def.accent,
    hitFlash: 0,
    fireCooldown: 1.5,
    boss: true,
    bob: 0
  });
  game.shake = 30;
  for (let i = 0; i < 60; i++) {
    game.particles.push({
      x: GATE_X + rand(-40, 40), y: GATE_Y,
      vx: rand(-200, 200), vy: rand(-50, 200),
      life: rand(0.6, 1.2), maxLife: 1.2,
      color: i % 3 === 0 ? '#c89c5f' : '#5a3a2a', r: rand(2, 5)
    });
  }
}

// --- Behavior dispatch (non-boss enemies) -----------------------------------

// Boids-style separation: accumulate a repulsion vector from neighbors
// within the given radius. Strength scales with closeness so tightly-
// packed enemies push apart strongly while distant ones barely contribute.
// Chase passes a tight radius (~1.6× e.r) — separation only prevents
// physical overlap. Ranged passes a much larger radius (~4× e.r) so
// archers fan out into a scattered ring instead of clumping along an arc.
function separationForce(e, enemies, radius) {
  let sx = 0, sy = 0;
  for (const other of enemies) {
    if (other === e) continue;
    const dx = e.x - other.x;
    const dy = e.y - other.y;
    const d = Math.hypot(dx, dy);
    if (d > 0 && d < radius) {
      const strength = (radius - d) / radius;
      sx += (dx / d) * strength;
      sy += (dy / d) * strength;
    }
  }
  return { x: sx, y: sy };
}

function updateChaseBehavior(game, e, dt) {
  const player = game.player;
  // Lateral flanking target (militia only — see spawnEnemy). Aim point
  // shifts perpendicular to the player-vector, with falloff so the offset
  // is 0 within 80px (melee converges) and full at ≥300px.
  let tx = player.x, ty = player.y;
  if (e.lateralOffset) {
    const ddx = player.x - e.x, ddy = player.y - e.y;
    const dd = Math.hypot(ddx, ddy);
    if (dd > 0.1) {
      const perpX = -ddy / dd, perpY = ddx / dd;
      const falloff = Math.max(0, Math.min(1, (dd - 80) / 220));
      tx = player.x + perpX * e.lateralOffset * falloff;
      ty = player.y + perpY * e.lateralOffset * falloff;
    }
  }
  const dx = tx - e.x, dy = ty - e.y;
  const d = Math.hypot(dx, dy);
  if (d <= 0.1) return;
  // Chase unit vector + separation push (separation weighted higher so
  // enemies actually space out instead of clumping). Combined vector is
  // re-normalized before applying speed so total movement never exceeds
  // e.speed * slowMult — wave difficulty preserved.
  const slowMult = e.statuses?.frost?.slowMult ?? 1;
  // Chase: tight radius (~1.6× r) — separation just prevents overlap.
  const sep = separationForce(e, game.enemies, e.r * 1.6);
  const vx = (dx / d) + sep.x * 0.6;
  const vy = (dy / d) + sep.y * 0.6;
  const vmag = Math.hypot(vx, vy);
  if (vmag > 0.0001) {
    e.x += (vx / vmag) * e.speed * slowMult * dt;
    e.y += (vy / vmag) * e.speed * slowMult * dt;
  }
}

function updateRangedBehavior(game, e, dt) {
  const player = game.player;
  const dx = player.x - e.x, dy = player.y - e.y;
  const d = Math.hypot(dx, dy);
  if (d > 0.1) {
    const ux = dx / d, uy = dy / d;
    const slowMult = e.statuses?.frost?.slowMult ?? 1;
    // Approach (+1), retreat (-1), or hold (0). Separation force is added
    // regardless of band so even "holding" archers spread apart laterally.
    let sign = 0;
    if (d > e.preferredDistance + 30) sign = 1;
    else if (d < e.preferredDistance - 30) sign = -1;
    // Ranged: wide separation radius (~4× r) so archers scatter laterally
    // along the ring instead of clumping in arcs from the same spawn edge.
    const sep = separationForce(e, game.enemies, e.r * 4);
    const vx = sign * ux + sep.x * 0.6;
    const vy = sign * uy + sep.y * 0.6;
    const vmag = Math.hypot(vx, vy);
    if (vmag > 0.0001) {
      e.x += (vx / vmag) * e.speed * slowMult * dt;
      e.y += (vy / vmag) * e.speed * slowMult * dt;
    }
  }

  e.fireCooldown -= dt;
  if (d <= e.fireRange && e.fireCooldown <= 0) {
    const angle = Math.atan2(player.y - e.y, player.x - e.x);
    game.enemyProjectiles.push({
      x: e.x, y: e.y,
      vx: Math.cos(angle) * e.arrowSpeed,
      vy: Math.sin(angle) * e.arrowSpeed,
      r: 4,
      damage: e.arrowDamage,
      life: 2.0,
      rotation: angle,
      type: 'arrow'
    });
    e.fireCooldown = e.fireRate;
  }
}

const BEHAVIORS = {
  chase: updateChaseBehavior,
  ranged: updateRangedBehavior
};

function updateBoss(game, e, dt) {
  const player = game.player;
  // Movement: chase (frost-slowed if applicable)
  const dx = player.x - e.x, dy = player.y - e.y;
  const d = Math.hypot(dx, dy);
  if (d > 0.1) {
    const slowMult = e.statuses?.frost?.slowMult ?? 1;
    e.x += (dx / d) * e.speed * slowMult * dt;
    e.y += (dy / d) * e.speed * slowMult * dt;
  }
  // Phase 2 trigger: <50% HP. Faster + tighter bead barrage so scaled
  // player damage doesn't trivialize the second half of the fight.
  // One-shot telegraph (shake + dark-purple particles) sells the shift.
  if (!e.phase2 && e.hp < e.maxHp * 0.5) {
    e.phase2 = true;
    game.shake = 20;
    for (let i = 0; i < 20; i++) {
      game.particles.push({
        x: e.x + rand(-30, 30), y: e.y + rand(-30, 30),
        vx: rand(-150, 150), vy: rand(-150, 150),
        life: rand(0.5, 1.0), maxLife: 1.0,
        color: '#3a2a4a', r: rand(2, 4)
      });
    }
  }
  const beadStep = e.phase2 ? 0.10 : 0.15;
  const beadCooldown = e.phase2 ? 0.85 : 1.3;

  // Fire 5-bead spread (denser barrage, faster cooldown, harder beads)
  e.fireCooldown -= dt;
  if (e.fireCooldown <= 0) {
    const angle = Math.atan2(player.y - e.y, player.x - e.x);
    for (let j = -2; j <= 2; j++) {
      game.enemyProjectiles.push({
        x: e.x, y: e.y,
        vx: Math.cos(angle + j * beadStep) * 220,
        vy: Math.sin(angle + j * beadStep) * 220,
        r: 8, damage: 15, life: 3, rotation: 0,
        type: 'prayer_bead'
      });
    }
    e.fireCooldown = beadCooldown;
  }
}

function clampEnemyPosition(game, e) {
  e.x = clamp(e.x, e.r, game.W - e.r);
  e.y = clamp(e.y, MONASTERY_HEIGHT + e.r + 8, game.H - e.r);
}

function applyTouchDamage(game, e) {
  const player = game.player;
  const d = Math.hypot(player.x - e.x, player.y - e.y);
  if (d < e.r + player.r && player.invuln <= 0) {
    applyPlayerDamage(game, e.damage, {
      source: 'touch',
      invulnDuration: 0.5,
      shake: 8,
      rageMultiplier: 1.2
    });
  }
}

// Single hook for enemy → player damage. Handles hp, invuln, rage, screen
// flash, game-over transition, and fires the onTakeDamage event.
export function applyPlayerDamage(game, damage, opts = {}) {
  const player = game.player;
  if (player.invuln > 0) return;
  // Armor reduces incoming damage by a flat amount, floored at 1 so a
  // sufficiently-armored player still takes a chip rather than going
  // invincible.
  const effectiveDamage = Math.max(1, damage - (player.armor ?? 0));
  player.hp -= effectiveDamage;
  player.invuln = opts.invulnDuration ?? 0.5;
  player.rage = Math.min(player.maxRage, player.rage + effectiveDamage * (opts.rageMultiplier ?? 1.2));
  game.shake = Math.max(game.shake, opts.shake ?? 8);
  flashScreen();
  emit(game, 'onTakeDamage', { source: opts.source, damage: effectiveDamage });
  if (player.hp <= 0) {
    player.hp = 0;
    game.state = 'gameover';
    // Death plays its own sound; skip the per-hit damage sound on the
    // fatal hit so we don't stack "damage" + "dying" on the same frame.
    playSound('dying', { volume: 0.8 });
    setTimeout(() => showGameOver(game), 600);
  } else {
    playSound('damage', { volume: 0.5 });
  }
}

export function updateEnemies(game, dt) {
  const enemies = game.enemies;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.hitFlash > 0) e.hitFlash -= dt;
    if (e.statuses) tickEnemyStatuses(e, dt);

    if (e.boss) {
      updateBoss(game, e, dt);
    } else {
      const fn = BEHAVIORS[e.behavior] || updateChaseBehavior;
      fn(game, e, dt);
    }

    clampEnemyPosition(game, e);
    applyTouchDamage(game, e);
  }
}

export function updateEnemyProjectiles(game, dt) {
  const { enemyProjectiles, player, W, H } = game;
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    const p = enemyProjectiles[i];
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0 || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
      enemyProjectiles.splice(i, 1);
      continue;
    }
    if (dist(p, player) < p.r + player.r && player.invuln <= 0) {
      const dmg = p.damage;
      enemyProjectiles.splice(i, 1);
      applyPlayerDamage(game, dmg, {
        source: 'projectile',
        invulnDuration: 0.3,
        shake: 6,
        rageMultiplier: 1.0
      });
    }
  }
}

// Generic status helpers — extensible to burn/shock/poison without refactor.
// enemy.statuses is a dict keyed by status type: { frost: { timer, slowMult }, ... }
//
// Signature takes `game` so per-player bonuses (frostDurationBonus,
// frostStrengthBonus, ...) can be applied uniformly to every status source.
export function applyStatus(game, enemy, type, params) {
  if (!enemy.statuses) enemy.statuses = {};
  const effective = computeStatusParams(game.player, type, params);
  enemy.statuses[type] = { ...effective };
}

// Apply per-player bonuses to status params at apply-time. Lives here so
// items don't need to know about per-status formulas — they just write
// to player.frostDurationBonus / .frostStrengthBonus / etc.
function computeStatusParams(player, type, baseParams) {
  if (type === 'frost') {
    const baseSlowAmount = 1 - (baseParams.slowMult ?? 0.6);
    const totalSlowAmount = Math.min(0.95, baseSlowAmount + (player.frostStrengthBonus ?? 0));
    return {
      timer: (baseParams.timer ?? 0) + (player.frostDurationBonus ?? 0),
      slowMult: 1 - totalSlowAmount
    };
  }
  return baseParams;
}

function tickEnemyStatuses(enemy, dt) {
  for (const key in enemy.statuses) {
    const s = enemy.statuses[key];
    s.timer -= dt;
    if (s.timer <= 0) delete enemy.statuses[key];
  }
}

// Single hook for player → enemy damage. Handles hp, hit flash, impact
// particles, damage-number popup, rage gain, status effects, kill dispatch.
export function applyDamage(game, enemy, j, damage, opts = {}) {
  enemy.hp -= damage;
  enemy.hitFlash = 0.08;

  const color = opts.color || '#c89c5f';
  const hitX = opts.hitX ?? enemy.x;
  const hitY = opts.hitY ?? enemy.y;
  const count = opts.particleCount ?? 4;

  // Impact sparks (brand-colored, scatter outward)
  for (let k = 0; k < count; k++) {
    game.particles.push({
      x: hitX, y: hitY,
      vx: rand(-80, 80), vy: rand(-80, 80),
      life: 0.3, maxLife: 0.3,
      color, r: rand(1, 2.5)
    });
  }

  // Damage number popup (drifts upward, fades in final third)
  game.particles.push({
    kind: 'dmg_num',
    x: enemy.x + rand(-6, 6), y: enemy.y - enemy.r,
    vx: 0, vy: -70,
    life: 0.5, maxLife: 0.5,
    text: String(Math.ceil(damage))
  });

  // Rage
  const rageGain = opts.rageGain ?? 1;
  game.player.rage = Math.min(game.player.maxRage, game.player.rage + rageGain);

  // Status effect (frost, future burn/shock/poison)
  if (opts.statusEffect) {
    applyStatus(game, enemy, opts.statusEffect.type, opts.statusEffect.params);
  }

  // Notify item / status listeners
  emit(game, 'onHit', { enemy, damage, color: opts.color });

  // Impact thud (throttled so knife volleys + warhammer multi-hits don't
  // pile into an audio wall).
  playSound('impact', { volume: 0.04, minInterval: 60 });

  // Lethal hit
  if (enemy.hp <= 0) killEnemy(game, j);
}

export function killEnemy(game, j) {
  const e = game.enemies[j];
  // Death particles
  const count = e.boss ? 60 : 12;
  for (let k = 0; k < count; k++) {
    game.particles.push({
      x: e.x, y: e.y,
      vx: rand(-200, 200), vy: rand(-200, 200),
      life: rand(0.4, 0.9), maxLife: 0.9,
      color: e.accent, r: rand(2, 5)
    });
  }
  // Hacksilver drop
  game.pickups.push({
    type: 'silver',
    x: e.x, y: e.y,
    r: 6,
    value: e.silver,
    bob: rand(0, 6.28)
  });
  // Mead flask drop (8% chance, non-boss only)
  if (!e.boss && Math.random() < 0.08) {
    game.pickups.push({
      type: 'mead_flask',
      x: e.x + rand(-8, 8), y: e.y + rand(-8, 8),
      r: 7,
      heal: 18,
      bob: rand(0, 6.28)
    });
  }
  if (e.boss) game.shake = 40;
  else game.shake = Math.max(game.shake, 3);
  game.killCount++;
  game.totalKills++;
  game.enemies.splice(j, 1);
  // Notify item listeners (after splice so listener sees post-kill state)
  emit(game, 'onKill', { enemy: e });
}
