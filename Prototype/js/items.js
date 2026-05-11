export const SHOP_ITEMS = [
  { name: 'Boar Heart', effect: '+20 max vita, full heal', cost: 75, apply: (player) => { player.maxHp += 20; player.hp = player.maxHp; } },
  { name: 'Whetstone', effect: '+4 weapon damage', cost: 75, apply: (player) => { player.damageBonus += 4; } },
  { name: 'Wolf Sinew', effect: '+20% attack speed', cost: 90, apply: (player) => { player.fireRateMult *= 0.83; } },
  { name: 'Swift Boots', effect: '+30 move speed', cost: 60, apply: (player) => { player.speed += 30; } },
  { name: 'Mead of Mimir', effect: 'Heal 60 vita', cost: 55, apply: (player) => { player.hp = Math.min(player.maxHp, player.hp + 60); } },
  { name: 'Raven Charm', effect: '+8 damage, -10 vita', cost: 65, apply: (player) => { player.damageBonus += 8; player.maxHp -= 10; player.hp = Math.min(player.hp, player.maxHp); } }
];
