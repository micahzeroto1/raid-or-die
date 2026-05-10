import { WAVES } from './config.js';
import { choice } from './utils.js';
import { spawnEnemy, spawnBoss } from './enemies.js';
import { showShop, showVictory } from './ui.js';

export function startWave(game) {
  game.waveTimer = WAVES[game.wave].duration;
  game.spawnTimer = 0.5;
  game.bossSpawned = false;
}

export function updateSpawning(game, dt) {
  game.spawnTimer -= dt;
  if (game.waveTimer > 0 && game.spawnTimer <= 0) {
    const def = WAVES[game.wave];
    for (let i = 0; i < def.spawnCount; i++) {
      spawnEnemy(game, choice(def.types));
    }
    game.spawnTimer = def.spawnInterval;
  }
}

export function updateWaveTimer(game, dt) {
  // Boss spawn at 8s remaining for boss waves (only once per wave)
  if (WAVES[game.wave].boss && game.waveTimer < 8 && !game.bossSpawned) {
    spawnBoss(game, WAVES[game.wave].boss);
    game.bossSpawned = true;
  }

  // --- Wave timer ---
  game.waveTimer -= dt;
  if (game.waveTimer <= 0 && game.enemies.length === 0) {
    // Wave complete
    if (game.wave === WAVES.length - 1) {
      // Final wave: only end on boss kill (handled in kill logic)
    } else {
      endWave(game);
    }
  }
  // Special: end final wave when no enemies and timer 0 and boss is dead
  if (game.waveTimer <= 0 && game.wave === WAVES.length - 1 && game.enemies.length === 0 && game.state === 'playing') {
    game.state = 'victory';
    showVictory(game);
  }
}

export function endWave(game) {
  game.state = 'shop';
  game.killCount = 0;
  // clear pickups - collect remaining silver automatically
  for (const pk of game.pickups) game.totalSilver += pk.value;
  game.pickups = [];
  game.enemyProjectiles = [];
  setTimeout(() => showShop(game), 300);
}

export function continueToNextWave(game) {
  document.getElementById('shop').classList.add('hidden');
  game.wave++;
  game.state = 'playing';
  startWave(game);
}
