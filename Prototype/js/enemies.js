import { rand, randInt, dist } from './utils.js';
import { ENEMY_DEFS, GATE_X, GATE_Y, MONASTERY_HEIGHT } from './config.js';
import { flashScreen, showGameOver } from './ui.js';

export function spawnEnemy(game, type) {
  const def = ENEMY_DEFS[type];
  const W = game.W, H = game.H;
  let x, y;
  // 75% emerge from the gate, 25% flank from sides/bottom (reinforcements / scouts)
  if (Math.random() < 0.75) {
    x = GATE_X + rand(-32, 32);
    y = GATE_Y - rand(0, 20);
  } else {
    const side = randInt(0, 2);
    const margin = 40;
    if (side === 0) { x = W + margin; y = rand(MONASTERY_HEIGHT + 30, H - 20); }
    else if (side === 1) { x = -margin; y = rand(MONASTERY_HEIGHT + 30, H - 20); }
    else { x = rand(40, W - 40); y = H + margin; }
  }

  game.enemies.push({
    type, x, y, r: def.r,
    hp: def.hp, maxHp: def.hp,
    speed: def.speed,
    damage: def.damage,
    silver: def.silver,
    color: def.color, accent: def.accent,
    hitFlash: 0,
    fireCooldown: rand(2, 4),
    bob: rand(0, 6.28)
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
    fireCooldown: 2,
    boss: true,
    bob: 0
  });
  // Big visual flash on boss spawn
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

export function updateEnemies(game, dt) {
  const { enemies, enemyProjectiles, player } = game;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.hitFlash > 0) e.hitFlash -= dt;
    const dx = player.x - e.x, dy = player.y - e.y;
    const d = Math.hypot(dx, dy);
    if (d > 0.1) {
      e.x += (dx / d) * e.speed * dt;
      e.y += (dy / d) * e.speed * dt;
    }

    // Boss shoots
    if (e.boss) {
      e.fireCooldown -= dt;
      if (e.fireCooldown <= 0) {
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        for (let j = -1; j <= 1; j++) {
          enemyProjectiles.push({
            x: e.x, y: e.y,
            vx: Math.cos(angle + j * 0.25) * 220,
            vy: Math.sin(angle + j * 0.25) * 220,
            r: 8, damage: 15, life: 3, rotation: 0
          });
        }
        e.fireCooldown = 2.2;
      }
    }

    // Touch damage
    if (d < e.r + player.r && player.invuln <= 0) {
      player.hp -= e.damage;
      player.invuln = 0.5;
      player.rage = Math.min(player.maxRage, player.rage + e.damage * 1.2);
      game.shake = Math.max(game.shake, 8);
      flashScreen();
      if (player.hp <= 0) {
        player.hp = 0;
        game.state = 'gameover';
        setTimeout(() => showGameOver(game), 600);
      }
    }
  }
}

export function updateEnemyProjectiles(game, dt) {
  const { enemyProjectiles, player, W, H } = game;
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    const p = enemyProjectiles[i];
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.life -= dt;
    p.rotation += dt * 10;
    if (p.life <= 0 || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
      enemyProjectiles.splice(i, 1);
      continue;
    }
    if (dist(p, player) < p.r + player.r && player.invuln <= 0) {
      player.hp -= p.damage;
      player.invuln = 0.3;
      player.rage = Math.min(player.maxRage, player.rage + p.damage);
      game.shake = Math.max(game.shake, 6);
      flashScreen();
      enemyProjectiles.splice(i, 1);
      if (player.hp <= 0) {
        player.hp = 0;
        game.state = 'gameover';
        setTimeout(() => showGameOver(game), 600);
      }
    }
  }
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
    x: e.x, y: e.y,
    r: 6,
    value: e.silver,
    bob: rand(0, 6.28)
  });
  if (e.boss) game.shake = 40;
  else game.shake = Math.max(game.shake, 3);
  game.killCount++;
  game.totalKills++;
  game.enemies.splice(j, 1);
}
