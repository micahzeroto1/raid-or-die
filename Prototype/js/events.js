// Lightweight event hub used by the item system. Handlers are registered
// at item-purchase time; events fire from gameplay code (kills, hits, etc.).
// Set DEBUG_EVENTS = true to console-log every emit (for verification during
// Step 6 development; flip off before commit).

const DEBUG_EVENTS = false;

export function initEventHandlers(game) {
  game.eventHandlers = {
    onKill: [],
    onHit: [],
    onTakeDamage: [],
    onLowHp: [],
    onTick: []
  };
  game.tickHandlers = [];      // [{ interval, remaining, handler }]
  game.perStackHandlers = [];  // [{ stackName, stat, perStackAmount, lastCount }]
}

export function on(game, event, handler) {
  game.eventHandlers[event].push(handler);
}

export function emit(game, event, data) {
  if (DEBUG_EVENTS) console.log('[event]', event, data);
  const arr = game.eventHandlers[event];
  for (let i = 0; i < arr.length; i++) arr[i](game, data);
}

// Walks tickHandlers, decrements each remaining timer, fires the handler
// when it reaches zero and resets back to interval. Called once per frame
// from main.js update().
export function tickTickHandlers(game, dt) {
  for (const t of game.tickHandlers) {
    t.remaining -= dt;
    if (t.remaining <= 0) {
      t.handler(game);
      t.remaining += t.interval;
    }
  }
}

// Delta-based recompute: any per-stack-modifier handlers matching the named
// stack apply (current - lastCount) * perStackAmount to player[stat]. Keeps
// stats live without per-frame iteration. Called from gainStack / decay /
// resetStack.
export function recomputePerStackModifiers(game, stackName) {
  const player = game.player;
  for (const h of game.perStackHandlers) {
    if (h.stackName !== stackName) continue;
    const current = player.stacks[h.stackName]?.count ?? 0;
    const delta = (current - h.lastCount) * h.perStackAmount;
    player[h.stat] = (player[h.stat] ?? 0) + delta;
    h.lastCount = current;
  }
}
