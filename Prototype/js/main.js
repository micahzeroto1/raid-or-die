import { createPlayer, updatePlayer, tryBerserker } from './player.js';
import { updateAutoFire, updatePlayerProjectiles } from './weapons.js';
import { updateEnemies, updateEnemyProjectiles } from './enemies.js';
import { startWave, updateSpawning, updateWaveTimer, continueToNextWave } from './waves.js';
import { updateParticles } from './particles.js';
import { updatePickups } from './pickups.js';
import { updateHUD } from './ui.js';
import { render } from './render.js';

// ============================================================================
// RAID OR DIE - Prototype
// ============================================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// --- Game State (initialized so render() works before newGame()) ---
const game = {
  ctx, W, H,
  state: 'menu', // menu | playing | shop | gameover | victory
  player: createPlayer(W, H),
  enemies: [],
  projectiles: [],
  particles: [],
  pickups: [],
  enemyProjectiles: [],
  wave: 0, waveTimer: 30, spawnTimer: 1, killCount: 0, gameTime: 0, totalKills: 0, totalSilver: 0,
  shake: 0, lastTime: 0, bossSpawned: false,
  keys: {}
};

// --- Input ---
window.addEventListener('keydown', e => {
  game.keys[e.key.toLowerCase()] = true;
  if (e.key === ' ') { e.preventDefault(); tryBerserker(game); }
});
window.addEventListener('keyup', e => game.keys[e.key.toLowerCase()] = false);

// ============================================================================
// Game Initialization
// ============================================================================
function newGame() {
  game.player = createPlayer(W, H);
  game.enemies = [];
  game.projectiles = [];
  game.enemyProjectiles = [];
  game.particles = [];
  game.pickups = [];
  game.wave = 0;
  game.killCount = 0;
  game.totalKills = 0;
  game.totalSilver = 0;
  game.gameTime = 0;
  startWave(game);
}

// ============================================================================
// Update
// ============================================================================
function update(dt) {
  if (game.state !== 'playing') return;

  game.gameTime += dt;

  updatePlayer(game, dt);
  updateAutoFire(game, dt);
  updateSpawning(game, dt);
  updateWaveTimer(game, dt);
  updateEnemies(game, dt);
  updatePlayerProjectiles(game, dt);
  updateEnemyProjectiles(game, dt);
  updateParticles(game, dt);
  updatePickups(game, dt);

  game.shake *= 0.85;
}

// ============================================================================
// Main Loop
// ============================================================================
function loop(t) {
  const dt = Math.min(0.05, (t - game.lastTime) / 1000);
  game.lastTime = t;
  update(dt);
  render(game);
  if (game.state === 'playing' || game.state === 'shop' || game.state === 'gameover' || game.state === 'victory') {
    updateHUD(game);
  }
  requestAnimationFrame(loop);
}

// ============================================================================
// Button Wiring
// ============================================================================
function startGame() {
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('gameover').classList.add('hidden');
  document.getElementById('victory').classList.add('hidden');
  document.getElementById('shop').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  newGame();
  game.state = 'playing';
}

document.getElementById('startBtn').onclick = startGame;
document.getElementById('restartBtn').onclick = startGame;
document.getElementById('victoryBtn').onclick = startGame;
document.getElementById('continueBtn').onclick = () => continueToNextWave(game);

requestAnimationFrame(loop);
