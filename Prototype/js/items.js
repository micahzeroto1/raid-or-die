import { on } from './events.js';
import { gainStack, registerStack } from './player.js';
import { applyStatus } from './enemies.js';
import { flashScreen } from './ui.js';

// ============================================================================
// Effect handlers
// ============================================================================
// Each handler runs at item-purchase time. Stat-modifying handlers mutate the
// player directly; event-driven handlers register listeners with the event hub.

function handler_statBoost(game, ef, drMult = 1) {
  const player = game.player;
  // Diminishing returns: additive gets scaled directly; multiply gets its
  // "deviation from 1.0" scaled so a 20% boost at DR=0.7 becomes 14%.
  const addAmount = ef.amount * drMult;
  const mulAmount = 1 + (ef.amount - 1) * drMult;
  // Scoped boost: writes into player.weaponTagBoosts[tag][stat] so the
  // weapons module can merge it in at fire time only for matching weapons.
  if (ef.scope?.weaponTag) {
    const tag = ef.scope.weaponTag;
    if (!player.weaponTagBoosts) player.weaponTagBoosts = {};
    if (!player.weaponTagBoosts[tag]) player.weaponTagBoosts[tag] = {};
    const overlay = player.weaponTagBoosts[tag];
    if (ef.mode === 'multiply') {
      overlay[ef.stat] = (overlay[ef.stat] ?? 1) * mulAmount;
    } else {
      overlay[ef.stat] = (overlay[ef.stat] ?? 0) + addAmount;
    }
    return;
  }
  // Unscoped: existing behavior — direct mutation on the player.
  if (ef.mode === 'multiply') {
    player[ef.stat] *= mulAmount;
  } else {
    player[ef.stat] = (player[ef.stat] ?? 0) + addAmount;
  }
}

function handler_instantHeal(game, ef) {
  const player = game.player;
  if (ef.toFull) {
    player.hp = player.maxHp;
  } else {
    player.hp = Math.min(player.maxHp, player.hp + (ef.amount ?? 0));
  }
}

function handler_clampHp(game) {
  game.player.hp = Math.min(game.player.hp, game.player.maxHp);
}

function handler_onKill(game, ef) {
  on(game, 'onKill', (g, data) => ef.handler(g, data));
}

function handler_onHit(game, ef) {
  on(game, 'onHit', (g, data) => ef.handler(g, data));
}

function handler_onTakeDamage(game, ef) {
  on(game, 'onTakeDamage', (g, data) => ef.handler(g, data));
}

function handler_onLowHp(game, ef) {
  on(game, 'onLowHp', (g, data) => ef.handler(g, data));
}

function handler_onTick(game, ef) {
  game.tickHandlers.push({
    interval: ef.interval,
    remaining: ef.interval,
    handler: ef.handler
  });
}

function handler_gainStack(game, ef, drMult = 1) {
  registerStack(game.player, ef.stackName, {
    max: ef.max ?? Infinity,
    decayMode: ef.decayMode ?? 'permanent',
    decayDuration: ef.decayDuration ?? 0,
    resetOn: ef.resetOn ?? null
  });
  // Hook the trigger event so kills (or whatever) feed the stack.
  // DR scales the per-trigger amount — second same-archetype stacker
  // gains 0.7× per kill, slowing the ramp toward max.
  const stackAmount = (ef.amount ?? 1) * drMult;
  on(game, ef.trigger, () => gainStack(game, ef.stackName, stackAmount));
  // Reset-on event subscription
  if (ef.decayMode === 'reset_on' && ef.resetOn) {
    on(game, ef.resetOn, () => {
      const stk = game.player.stacks[ef.stackName];
      if (stk && stk.count > 0) {
        stk.count = 0;
      }
    });
  }
}

function handler_perStackModifier(game, ef, drMult = 1) {
  game.perStackHandlers.push({
    stackName: ef.stackName,
    stat: ef.stat,
    perStackAmount: ef.perStackAmount * drMult,
    lastCount: 0
  });
}

function handler_applyStatus(game, ef) {
  on(game, ef.trigger ?? 'onHit', (g, data) => {
    if (data && data.enemy) {
      applyStatus(g, data.enemy, ef.statusType, ef.params);
    }
  });
}

const EFFECT_HANDLERS = {
  stat_boost: handler_statBoost,
  instant_heal: handler_instantHeal,
  clamp_hp: handler_clampHp,
  on_kill: handler_onKill,
  on_hit: handler_onHit,
  on_take_damage: handler_onTakeDamage,
  on_low_hp: handler_onLowHp,
  on_tick: handler_onTick,
  gain_stack: handler_gainStack,
  per_stack_modifier: handler_perStackModifier,
  apply_status: handler_applyStatus
};

export function applyItemEffects(game, item) {
  const player = game.player;
  if (!player.archetypeOwned) player.archetypeOwned = {};
  // Diminishing returns on stacking same archetype: 0.7^N where N is
  // the count of previously-purchased same-archetype items. First buy
  // of a given archetype = 0.7^0 = 1.0 (full effect). Baseline items
  // (archetype: null) pass through at full value — they're the safe
  // progression path. Only scales numeric scalars in stat/stack
  // handlers; event-driven effects (on_kill, apply_status, etc.) fire
  // at full strength regardless.
  const arch = item.archetype;
  const drMult = arch ? Math.pow(0.7, player.archetypeOwned[arch] ?? 0) : 1;
  for (const ef of item.effects) {
    const fn = EFFECT_HANDLERS[ef.type];
    if (fn) fn(game, ef, drMult);
  }
  if (arch) {
    player.archetypeOwned[arch] = (player.archetypeOwned[arch] ?? 0) + 1;
  }
}

// ============================================================================
// SHOP_ITEMS — production pool (6 items, migrated from prior shape)
// ============================================================================

export const SHOP_ITEMS = [
  {
    id: 'boar_heart',
    name: 'Boar Heart',
    cost: 75,
    rarity: 'common',
    archetype: null,
    description: '+20 max vita, full heal',
    effects: [
      { type: 'stat_boost', stat: 'maxHp', amount: 20, mode: 'add' },
      { type: 'instant_heal', toFull: true }
    ]
  },
  {
    id: 'whetstone',
    name: 'Whetstone',
    cost: 75,
    rarity: 'common',
    archetype: null,
    description: '+4 weapon damage',
    effects: [
      { type: 'stat_boost', stat: 'damageBonus', amount: 4, mode: 'add' }
    ]
  },
  {
    id: 'wolf_sinew',
    name: 'Wolf Sinew',
    cost: 90,
    rarity: 'common',
    archetype: null,
    description: '+20% attack speed',
    effects: [
      { type: 'stat_boost', stat: 'fireRateMult', amount: 0.83, mode: 'multiply' }
    ]
  },
  {
    id: 'swift_boots',
    name: 'Swift Boots',
    cost: 60,
    rarity: 'common',
    archetype: null,
    description: '+30 move speed',
    effects: [
      { type: 'stat_boost', stat: 'speed', amount: 30, mode: 'add' }
    ]
  },
  {
    id: 'mead_of_mimir',
    name: 'Mead of Mimir',
    cost: 55,
    rarity: 'common',
    archetype: null,
    description: 'Heal 60 vita',
    effects: [
      { type: 'instant_heal', amount: 60 }
    ]
  },
  {
    id: 'raven_charm',
    name: 'Raven Charm',
    cost: 65,
    rarity: 'common',
    archetype: null,
    description: '+8 damage, -10 vita',
    effects: [
      { type: 'stat_boost', stat: 'damageBonus', amount: 8, mode: 'add' },
      { type: 'stat_boost', stat: 'maxHp', amount: -10, mode: 'add' },
      { type: 'clamp_hp' }
    ]
  },

  // ==========================================================================
  // Step 7 — Archetype items (Berserker / Thrown / Frost / Shield Wall)
  // ==========================================================================

  // --- Berserker -----------------------------------------------------------
  {
    id: 'battle_frenzy',
    name: 'Battle Frenzy',
    cost: 140,
    rarity: 'rare',
    archetype: 'berserker',
    description: '+2 dmg per Berserker stack on kill (max 5, 4s decay)',
    effects: [
      { type: 'gain_stack', stackName: 'berserker', max: 5,
        decayMode: 'timer', decayDuration: 4.0,
        trigger: 'onKill', amount: 1 },
      { type: 'per_stack_modifier', stackName: 'berserker',
        stat: 'damageBonus', perStackAmount: 2 }
    ]
  },
  {
    id: 'bloodlust',
    name: 'Bloodlust',
    cost: 65,
    rarity: 'common',
    archetype: 'berserker',
    description: 'Heal 1 HP on kill',
    effects: [
      {
        type: 'on_kill',
        handler: (game) => {
          game.player.hp = Math.min(game.player.maxHp, game.player.hp + 1);
        }
      }
    ]
  },

  // --- Thrown --------------------------------------------------------------
  {
    id: 'whetstone_belt',
    name: 'Whetstone Belt',
    cost: 100,
    rarity: 'uncommon',
    archetype: 'thrown',
    description: 'Thrown weapons +5 damage',
    effects: [
      { type: 'stat_boost', stat: 'damageBonus', amount: 5, mode: 'add',
        scope: { weaponTag: 'thrown' } }
    ]
  },
  {
    id: 'eager_hand',
    name: 'Eager Hand',
    cost: 100,
    rarity: 'uncommon',
    archetype: 'thrown',
    description: 'Thrown weapons fire 20% faster',
    effects: [
      // 0.83 mirrors Wolf Sinew's "+20% attack speed" (1/1.2)
      { type: 'stat_boost', stat: 'fireRateMult', amount: 0.83, mode: 'multiply',
        scope: { weaponTag: 'thrown' } }
    ]
  },

  // --- Frost ---------------------------------------------------------------
  {
    id: 'frostbite',
    name: 'Frostbite',
    cost: 95,
    rarity: 'uncommon',
    archetype: 'frost',
    description: 'Frost slow lasts +1.5 seconds longer',
    effects: [
      { type: 'stat_boost', stat: 'frostDurationBonus', amount: 1.5, mode: 'add' }
    ]
  },
  {
    id: 'glaciers_edge',
    name: "Glacier's Edge",
    cost: 150,
    rarity: 'rare',
    archetype: 'frost',
    description: 'All weapons apply Frost on hit',
    effects: [
      // Base params; player.frostDurationBonus / frostStrengthBonus apply at
      // apply-time inside enemies.js computeStatusParams.
      { type: 'apply_status', trigger: 'onHit', statusType: 'frost',
        params: { timer: 2.0, slowMult: 0.6 } }
    ]
  },

  // --- Shield Wall ---------------------------------------------------------
  {
    id: 'iron_skin',
    name: 'Iron Skin',
    cost: 70,
    rarity: 'common',
    archetype: 'shield_wall',
    description: '+5 armor',
    effects: [
      { type: 'stat_boost', stat: 'armor', amount: 5, mode: 'add' }
    ]
  },
  {
    id: 'tortoise_shell',
    name: 'Tortoise Shell',
    cost: 145,
    rarity: 'rare',
    archetype: 'shield_wall',
    description: 'On hit: 25% chance to heal for half damage taken',
    effects: [
      {
        type: 'on_take_damage',
        handler: (game, data) => {
          if (Math.random() < 0.25) {
            const heal = Math.ceil((data.damage ?? 0) * 0.5);
            game.player.hp = Math.min(game.player.maxHp, game.player.hp + heal);
            flashScreen('green', 0.08);
          }
        }
      }
    ]
  }
];

