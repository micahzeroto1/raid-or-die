import { dist, rand } from './utils.js';
import { killEnemy } from './enemies.js';

export const WEAPONS = {
  throwing_axe: {
    id: 'throwing_axe',
    name: 'Throwing Axe',
    type: 'thrown',
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
    cost: 30
  },
  throwing_knife: {
    id: 'throwing_knife',
    name: 'Throwing Knife',
    type: 'thrown',
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
    cost: 25
  }
};

export function updateAutoFire(game, dt) {
  const { player, enemies, projectiles } = game;
  const berserkerDmgMult = player.berserker > 0 ? 2 : 1;
  const berserkerFireMult = player.berserker > 0 ? 1.5 : 1;

  for (const slot of player.weapons) {
    if (!slot) continue;
    slot.cooldown -= dt;
    if (slot.cooldown > 0) continue;
    if (enemies.length === 0) continue;

    const weapon = WEAPONS[slot.weaponId];

    // Find nearest enemy within weapon.range
    let nearest = null, nd = Infinity;
    for (const e of enemies) {
      const d = dist(player, e);
      if (d < nd && d < weapon.range) { nd = d; nearest = e; }
    }
    if (!nearest) continue;

    const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    player.facing = baseAngle;

    const dmg = (weapon.damage + player.damageBonus) * berserkerDmgMult;
    const n = weapon.projectiles;
    const spread = weapon.spread;

    for (let i = 0; i < n; i++) {
      const offset = n === 1 ? 0 : (-spread / 2) + (spread * i / (n - 1));
      const a = baseAngle + offset;
      projectiles.push({
        x: player.x, y: player.y,
        vx: Math.cos(a) * weapon.projectileSpeed,
        vy: Math.sin(a) * weapon.projectileSpeed,
        r: weapon.projectileSize,
        damage: dmg,
        life: weapon.projectileLifetime,
        rotation: 0,
        color: weapon.color,
        edgeColor: weapon.edgeColor,
        pierce: weapon.pierce,
        hitEnemies: null
      });
    }

    slot.cooldown = (weapon.fireRate * player.fireRateMult) / berserkerFireMult;
  }
}

export function updatePlayerProjectiles(game, dt) {
  const { projectiles, enemies, player, W, H } = game;
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.life -= dt;
    p.rotation += dt * (100 / p.r);
    if (p.life <= 0 || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
      projectiles.splice(i, 1);
      continue;
    }
    let removed = false;
    for (let j = enemies.length - 1; j >= 0 && !removed; j--) {
      const e = enemies[j];
      if (p.hitEnemies && p.hitEnemies.includes(e)) continue;
      if (dist(p, e) < p.r + e.r) {
        e.hp -= p.damage;
        e.hitFlash = 0.1;
        player.rage = Math.min(player.maxRage, player.rage + 1);
        // hit particles
        for (let k = 0; k < 4; k++) {
          game.particles.push({
            x: p.x, y: p.y,
            vx: rand(-80, 80), vy: rand(-80, 80),
            life: 0.3, maxLife: 0.3,
            color: '#c89c5f', r: rand(1, 2)
          });
        }
        if (e.hp <= 0) {
          killEnemy(game, j);
        }
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
