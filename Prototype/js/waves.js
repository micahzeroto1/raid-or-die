import { WAVES, tierSpawnIntervalMult } from './config.js';
import { choice } from './utils.js';
import { spawnEnemy, spawnBoss, spawnElite } from './enemies.js';
import { showShop, showVictory } from './ui.js';

export function startWave(game) {
  game.waveTimer = WAVES[game.wave].duration;
  game.spawnTimer = 0.5;
  game.bossSpawned = false;
  game.eliteSpawned = false;
}

export function updateSpawning(game, dt) {
  game.spawnTimer -= dt;
  if (game.waveTimer > 0 && game.spawnTimer <= 0) {
    const def = WAVES[game.wave];
    for (let i = 0; i < def.spawnCount; i++) {
      spawnEnemy(game, choice(def.types));
    }
    // Linear interp from spawnInterval -> spawnIntervalEnd over wave duration.
    // Wave 1 omits spawnIntervalEnd → falls back to constant spawnInterval.
    // Tier density mult collapses the interval at higher tiers (the screen
    // fills faster; survivor-like ramp).
    const intervalMult = tierSpawnIntervalMult(def.tier);
    if (def.spawnIntervalEnd != null) {
      const progress = 1 - (game.waveTimer / def.duration);  // 0 -> 1
      const base = def.spawnInterval + (def.spawnIntervalEnd - def.spawnInterval) * progress;
      game.spawnTimer = base * intervalMult;
    } else {
      game.spawnTimer = def.spawnInterval * intervalMult;
    }
  }
}

export function updateWaveTimer(game, dt) {
  const def = WAVES[game.wave];
  // Boss spawn at 8s remaining for boss waves (only once per wave)
  if (def.boss && game.waveTimer < 8 && !game.bossSpawned) {
    spawnBoss(game, def.boss);
    game.bossSpawned = true;
  }
  // Scheduled elite spawn at 55% of wave duration on non-boss waves.
  // Mirrors the boss-spawn pattern: one-shot trigger via eliteSpawned flag.
  if (def.scheduledElite && game.waveTimer < def.duration * 0.45 && !game.eliteSpawned) {
    spawnElite(game, def.scheduledElite);
    game.eliteSpawned = true;
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
  // Auto-collect remaining pickups: silver → wallet, mead → heal
  for (const pk of game.pickups) {
    if (pk.type === 'mead_flask') {
      game.player.hp = Math.min(game.player.maxHp, game.player.hp + pk.heal);
    } else {
      game.totalSilver += pk.value;
    }
  }
  game.pickups = [];
  game.enemyProjectiles = [];
  game.projectiles = [];
  setTimeout(() => showShop(game), 300);
}

export function continueToNextWave(game) {
  document.getElementById('shop').classList.add('hidden');
  game.wave++;
  game.state = 'playing';
  startWave(game);
}
