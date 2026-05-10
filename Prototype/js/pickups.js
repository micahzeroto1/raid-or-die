import { dist } from './utils.js';
import { flashScreen } from './ui.js';

export function updatePickups(game, dt) {
  const pickups = game.pickups;
  const player = game.player;
  for (let i = pickups.length - 1; i >= 0; i--) {
    const pk = pickups[i];
    const d = dist(pk, player);
    // Pickup range
    if (d < 80) {
      const ang = Math.atan2(player.y - pk.y, player.x - pk.x);
      pk.x += Math.cos(ang) * 300 * dt;
      pk.y += Math.sin(ang) * 300 * dt;
    }
    if (d < player.r + pk.r + 6) {
      game.totalSilver += pk.value;
      pickups.splice(i, 1);
      flashScreen('gold', 0.06);
    }
  }
}
