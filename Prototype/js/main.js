import { createPlayer, updatePlayer, tryBerserker, tickStackDecay } from './player.js';
import { updateAutoFire, updatePlayerProjectiles } from './weapons.js';
import { updateEnemies, updateEnemyProjectiles } from './enemies.js';
import { startWave, updateSpawning, updateWaveTimer, continueToNextWave } from './waves.js';
import { updateParticles } from './particles.js';
import { updatePickups } from './pickups.js';
import { updateHUD } from './ui.js';
import { render } from './render.js';
import { initEventHandlers, emit, tickTickHandlers } from './events.js';

// ============================================================================
// RAID OR DIE - Prototype
// ============================================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const gameFrame = document.querySelector('.game-frame');

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
  keys: {},
  touchInput: { dx: 0, dy: 0, active: false }
};
initEventHandlers(game);

// --- Input ---
window.addEventListener('keydown', e => {
  game.keys[e.key.toLowerCase()] = true;
  if (e.key === ' ') { e.preventDefault(); tryBerserker(game); }
});
window.addEventListener('keyup', e => game.keys[e.key.toLowerCase()] = false);

// --- Touch input (joystick + berserk button) ---
const joystickEl = document.getElementById('touchJoystick');
const joystickThumb = document.getElementById('touchJoystickThumb');
const berserkBtn = document.getElementById('berserkBtn');

if (joystickEl && joystickThumb) {
  const DRAG_RADIUS = 40; // px from joystick center
  let activeTouchId = null;
  let baseX = 0, baseY = 0;

  function startTouch(t) {
    if (activeTouchId !== null) return;
    const rect = joystickEl.getBoundingClientRect();
    baseX = rect.left + rect.width / 2;
    baseY = rect.top + rect.height / 2;
    activeTouchId = t.identifier;
    updateThumb(t.clientX, t.clientY);
  }
  function moveTouch(touchList) {
    for (const t of touchList) {
      if (t.identifier === activeTouchId) {
        updateThumb(t.clientX, t.clientY);
      }
    }
  }
  function endTouch(touchList) {
    for (const t of touchList) {
      if (t.identifier === activeTouchId) {
        activeTouchId = null;
        game.touchInput.dx = 0;
        game.touchInput.dy = 0;
        game.touchInput.active = false;
        joystickThumb.style.transform = 'translate(0px, 0px)';
      }
    }
  }
  function updateThumb(clientX, clientY) {
    let dx = clientX - baseX;
    let dy = clientY - baseY;
    const d = Math.hypot(dx, dy);
    if (d > DRAG_RADIUS) {
      dx = (dx / d) * DRAG_RADIUS;
      dy = (dy / d) * DRAG_RADIUS;
    }
    joystickThumb.style.transform = `translate(${dx}px, ${dy}px)`;
    game.touchInput.dx = dx / DRAG_RADIUS;
    game.touchInput.dy = dy / DRAG_RADIUS;
    game.touchInput.active = true;
  }

  joystickEl.addEventListener('touchstart', e => { e.preventDefault(); startTouch(e.changedTouches[0]); }, { passive: false });
  joystickEl.addEventListener('touchmove',  e => { e.preventDefault(); moveTouch(e.changedTouches); },     { passive: false });
  joystickEl.addEventListener('touchend',   e => { e.preventDefault(); endTouch(e.changedTouches); },      { passive: false });
  joystickEl.addEventListener('touchcancel',e => { e.preventDefault(); endTouch(e.changedTouches); },      { passive: false });
}

if (berserkBtn) {
  const fire = e => { e.preventDefault(); tryBerserker(game); };
  berserkBtn.addEventListener('touchstart', fire, { passive: false });
  berserkBtn.addEventListener('click', fire);
}

// (Canvas sizing handled by CSS aspect-ratio on .game-frame; no JS resize needed.)

function updateBerserkBtnState() {
  if (!berserkBtn) return;
  const p = game.player;
  const ready = p.rage >= p.maxRage && p.berserker <= 0;
  berserkBtn.classList.toggle('ready', ready);
}

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
  // Reset the event hub for a fresh run (items from prior runs go away)
  initEventHandlers(game);
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

  // Item-system ticks: on_tick handlers, stack-decay timers, low-HP crossing
  tickTickHandlers(game, dt);
  tickStackDecay(game, dt);
  checkLowHpCrossing(game);

  game.shake *= 0.85;
}

// One-shot onLowHp event with hysteresis (enter < 30%, leave >= 40%) to
// prevent flapping near the threshold.
function checkLowHpCrossing(game) {
  const player = game.player;
  const ratio = player.hp / player.maxHp;
  if (!player.lowHpFlag && ratio < 0.3) {
    player.lowHpFlag = true;
    emit(game, 'onLowHp', { ratio });
  } else if (player.lowHpFlag && ratio >= 0.4) {
    player.lowHpFlag = false;
  }
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
  updateBerserkBtnState();
  requestAnimationFrame(loop);
}

// ============================================================================
// Button Wiring
// ============================================================================
const bgMusic = document.getElementById('bgMusic');
if (bgMusic) bgMusic.volume = 0.4;

// Fullscreen toggle. Works on Chrome/Edge/Firefox/Safari-desktop.
// iOS Safari has no Fullscreen API for non-video elements — for iOS,
// the apple-mobile-web-app-capable meta lets users get true fullscreen
// via "Share -> Add to Home Screen".
const fullscreenBtn = document.getElementById('fullscreenBtn');
if (fullscreenBtn) {
  const docEl = document.documentElement;
  const fsSupported =
    docEl.requestFullscreen ||
    docEl.webkitRequestFullscreen ||
    docEl.msRequestFullscreen;

  if (!fsSupported) {
    fullscreenBtn.style.display = 'none';
  } else {
    fullscreenBtn.addEventListener('click', () => {
      const inFs =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement;
      if (inFs) {
        (document.exitFullscreen ||
          document.webkitExitFullscreen ||
          document.msExitFullscreen).call(document);
      } else {
        (docEl.requestFullscreen ||
          docEl.webkitRequestFullscreen ||
          docEl.msRequestFullscreen).call(docEl);
      }
    });
  }
}

function startGame() {
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('gameover').classList.add('hidden');
  document.getElementById('victory').classList.add('hidden');
  document.getElementById('shop').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  // Begin music on the first user-initiated start (browser autoplay
  // policy blocks unsolicited audio). Catches the promise so a refusal
  // doesn't throw.
  if (bgMusic && bgMusic.paused) {
    bgMusic.play().catch(() => { /* user can retap; ignore */ });
  }
  newGame();
  game.state = 'playing';
}

document.getElementById('startBtn').onclick = startGame;
document.getElementById('restartBtn').onclick = startGame;
document.getElementById('victoryBtn').onclick = startGame;
document.getElementById('continueBtn').onclick = () => continueToNextWave(game);

requestAnimationFrame(loop);
