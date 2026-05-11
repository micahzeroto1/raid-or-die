import { dist } from './utils.js';
import { flashScreen } from './ui.js';
import { playSound } from './sounds.js';

export function updatePickups(game, dt) {
  const pickups = game.pickups;
  const player = game.player;
  for (let i = pickups.length - 1; i >= 0; i--) {
    const pk = pickups[i];
    const d = dist(pk, player);
    // Magnetism
    if (d < 80) {
      const ang = Math.atan2(player.y - pk.y, player.x - pk.x);
      pk.x += Math.cos(ang) * 300 * dt;
      pk.y += Math.sin(ang) * 300 * dt;
    }
    // Collection
    if (d < player.r + pk.r + 6) {
      if (pk.type === 'mead_flask') {
        player.hp = Math.min(player.maxHp, player.hp + pk.heal);
        flashScreen('green', 0.08);
        playSound('mead', { volume: 0.3 });
      } else {
        // silver (default)
        game.totalSilver += pk.value;
        flashScreen('gold', 0.06);
        // Throttled so a magnet-pickup burst doesn't fire 20 sounds
        playSound('hacksilver', { volume: 0.18, minInterval: 60 });
      }
      pickups.splice(i, 1);
    }
  }
}
