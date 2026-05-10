import { SHOP_ITEMS } from './items.js';
import { WEAPONS } from './weapons.js';
import { choice } from './utils.js';

export function updateHUD(game) {
  const player = game.player;
  document.getElementById('waveNum').textContent = game.wave + 1;
  document.getElementById('timer').textContent = Math.max(0, Math.ceil(game.waveTimer));
  document.getElementById('timer').classList.toggle('warning', game.waveTimer < 10 && game.waveTimer > 0);
  document.getElementById('killCount').textContent = `${game.killCount} slain`;
  document.getElementById('hpFill').style.width = `${(player.hp / player.maxHp) * 100}%`;
  document.getElementById('hpText').textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
  document.getElementById('rageFill').style.width = `${(player.rage / player.maxRage) * 100}%`;
  document.getElementById('rageText').textContent = `${Math.floor(player.rage)} / 100`;
  document.getElementById('silverNum').textContent = game.totalSilver;
  const rl = document.getElementById('rageLabel');
  if (player.berserker > 0) {
    rl.textContent = `BERSERKR ${player.berserker.toFixed(1)}s`;
    rl.classList.add('rage-ready');
  } else if (player.rage >= player.maxRage) {
    rl.textContent = 'RAGE [SPACE]';
    rl.classList.add('rage-ready');
  } else {
    rl.textContent = 'RAGE';
    rl.classList.remove('rage-ready');
  }

  // Weapon slots
  const slotsEl = document.getElementById('weaponSlots');
  if (slotsEl) {
    slotsEl.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const slot = player.weapons[i];
      const box = document.createElement('div');
      if (slot) {
        const weapon = WEAPONS[slot.weaponId];
        box.className = 'weapon-slot filled';
        box.textContent = weapon.name.charAt(0);
        box.title = weapon.name;
      } else {
        box.className = 'weapon-slot empty';
      }
      slotsEl.appendChild(box);
    }
  }
}

export function showShop(game) {
  const grid = document.getElementById('shopGrid');
  grid.innerHTML = '';

  const ownedWeaponIds = game.player.weapons.filter(s => s !== null).map(s => s.weaponId);
  const emptySlotCount = game.player.weapons.filter(s => s === null).length;
  const availableWeapons = Object.values(WEAPONS).filter(w => !ownedWeaponIds.includes(w.id));

  const weaponCount = Math.min(2, availableWeapons.length, emptySlotCount);
  const itemCount = 4 - weaponCount;

  const weaponPicks = [...availableWeapons].sort(() => Math.random() - 0.5).slice(0, weaponCount);
  const itemPicks = [...SHOP_ITEMS].sort(() => Math.random() - 0.5).slice(0, itemCount);

  weaponPicks.forEach(w => addWeaponCard(grid, game, w));
  itemPicks.forEach(u => addItemCard(grid, game, u));

  document.getElementById('shop').classList.remove('hidden');
}

function addWeaponCard(grid, game, w) {
  const card = document.createElement('div');
  card.className = 'shop-card' + (game.totalSilver < w.cost ? ' disabled' : '');
  const shotsPerSec = (1 / w.fireRate).toFixed(1);
  const projLabel = w.projectiles > 1 ? ` &times;${w.projectiles}` : '';
  card.innerHTML = `
    <div class="name">${w.name}</div>
    <div class="effect">${w.type} &middot; ${w.damage} dmg${projLabel} &middot; ${shotsPerSec}/s</div>
    <div class="cost">${w.cost} hacksilver</div>
  `;
  card.onclick = () => {
    if (game.totalSilver < w.cost) return;
    const slotIdx = game.player.weapons.findIndex(s => s === null);
    if (slotIdx === -1) return;
    game.totalSilver -= w.cost;
    game.player.weapons[slotIdx] = { weaponId: w.id, cooldown: 0 };
    card.style.opacity = '0.4';
    card.style.pointerEvents = 'none';
    refreshShopDisabled(game);
  };
  grid.appendChild(card);
}

function addItemCard(grid, game, u) {
  const card = document.createElement('div');
  card.className = 'shop-card' + (game.totalSilver < u.cost ? ' disabled' : '');
  card.innerHTML = `
    <div class="name">${u.name}</div>
    <div class="effect">${u.effect}</div>
    <div class="cost">${u.cost} hacksilver</div>
  `;
  card.onclick = () => {
    if (game.totalSilver < u.cost) return;
    game.totalSilver -= u.cost;
    u.apply(game.player);
    card.style.opacity = '0.4';
    card.style.pointerEvents = 'none';
    refreshShopDisabled(game);
  };
  grid.appendChild(card);
}

function refreshShopDisabled(game) {
  document.querySelectorAll('.shop-card').forEach(c => {
    if (c.style.opacity !== '0.4') {
      const costEl = c.querySelector('.cost');
      const cost = parseInt(costEl.textContent);
      c.classList.toggle('disabled', game.totalSilver < cost);
    }
  });
}

export function showGameOver(game) {
  document.getElementById('finalWave').textContent = game.wave + 1;
  document.getElementById('finalKills').textContent = game.totalKills;
  document.getElementById('finalSilver').textContent = game.totalSilver;
  const flavors = [
    'The valkyries carry you back to Valhalla. Drink. Heal. Raid again.',
    'You die well. The skalds will sing of this. Briefly.',
    'Odin watches. He is amused, not displeased. There will be more raids.',
    'Your seat at the long table is warm. The mead is poured. Tomorrow you fight again.'
  ];
  document.getElementById('deathFlavor').textContent = choice(flavors);
  document.getElementById('gameover').classList.remove('hidden');
}

export function showVictory(game) {
  document.getElementById('vKills').textContent = game.totalKills;
  document.getElementById('vSilver').textContent = game.totalSilver;
  const mins = Math.floor(game.gameTime / 60);
  const secs = Math.floor(game.gameTime % 60);
  document.getElementById('vTime').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  document.getElementById('victory').classList.remove('hidden');
}

export function flashScreen(type = 'red', duration = 0.08) {
  const f = document.getElementById('flash');
  f.classList.remove('gold');
  if (type === 'gold') f.classList.add('gold');
  f.classList.add('active');
  setTimeout(() => f.classList.remove('active'), duration * 1000);
}
