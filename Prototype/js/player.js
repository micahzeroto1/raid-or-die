import { clamp, rand } from './utils.js';
import { MONASTERY_HEIGHT } from './config.js';
import { flashScreen } from './ui.js';

export function createPlayer(W, H) {
  return {
    x: W / 2, y: H - 120,
    r: 14,
    hp: 120, maxHp: 120,
    speed: 200,
    damageBonus: 0,        // additive bonus applied to every weapon's damage
    fireRateMult: 1.0,     // multiplier on weapon cooldown (lower = faster)
    rage: 0, maxRage: 100,
    berserker: 0,          // remaining seconds
    facing: 0,
    invuln: 0,
    weapons: [
      { weaponId: 'throwing_axe', cooldown: 0 },
      null,
      null,
      null
    ],
    upgrades: { hp: 0, dmg: 0, spd: 0, rate: 0 }
  };
}

export function updatePlayer(game, dt) {
  const { keys, player, W, H } = game;

  // --- Player Movement ---
  let vx = 0, vy = 0;
  if (keys['w'] || keys['arrowup']) vy -= 1;
  if (keys['s'] || keys['arrowdown']) vy += 1;
  if (keys['a'] || keys['arrowleft']) vx -= 1;
  if (keys['d'] || keys['arrowright']) vx += 1;
  const mag = Math.hypot(vx, vy);
  if (mag > 0) { vx /= mag; vy /= mag; }

  const speedBonus = player.berserker > 0 ? 1.5 : 1;
  player.x += vx * player.speed * speedBonus * dt;
  player.y += vy * player.speed * speedBonus * dt;
  player.x = clamp(player.x, player.r, W - player.r);
  player.y = clamp(player.y, MONASTERY_HEIGHT + player.r + 8, H - player.r);

  if (player.invuln > 0) player.invuln -= dt;
  if (player.berserker > 0) player.berserker -= dt;
}

export function tryBerserker(game) {
  if (game.state !== 'playing') return;
  const player = game.player;
  if (player.rage >= player.maxRage && player.berserker <= 0) {
    player.berserker = 8;
    player.rage = 0;
    game.shake = 12;
    flashScreen('gold', 0.15);
    // burst particles
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2;
      game.particles.push({
        x: player.x, y: player.y,
        vx: Math.cos(a) * 200, vy: Math.sin(a) * 200,
        life: 0.6, maxLife: 0.6,
        color: '#e8b85a', r: rand(2, 4)
      });
    }
  }
}
