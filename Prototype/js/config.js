export const MONASTERY_HEIGHT = 170;
export const GATE_X = 480;
export const GATE_Y = MONASTERY_HEIGHT - 8;

export const WAVES = [
  // Wave 1: constant spawn rate — tutorial wave, no ramp.
  { duration: 30, spawnInterval: 0.6, types: ['peasant', 'peasant', 'peasant', 'archer'], spawnCount: 2, label: 'Lindisfarne Beach' },
  // Wave 2 + 3: spawnIntervalEnd shrinks the interval across wave duration.
  // Linear interp from spawnInterval -> spawnIntervalEnd. Last seconds = flurry.
  { duration: 35, spawnInterval: 0.5, spawnIntervalEnd: 0.42, types: ['peasant', 'militia', 'militia', 'archer', 'archer'], spawnCount: 2, label: 'Outer Cloister' },
  { duration: 45, spawnInterval: 0.55, spawnIntervalEnd: 0.40, types: ['peasant', 'militia', 'militia', 'knight', 'archer', 'archer'], spawnCount: 2, label: 'The Abbey', boss: 'abbot' }
];

export const ENEMY_DEFS = {
  peasant:  { r: 14, hp: 22,  speed: 80, damage: 8,  silver: 2,  color: '#7a7264', accent: '#a89f8c', behavior: 'chase',  gateChance: 0.75 },
  militia:  { r: 17, hp: 75,  speed: 100, damage: 14, silver: 2,  color: '#5e6a52', accent: '#8aa07a', behavior: 'chase',  gateChance: 0.75 },
  knight:   { r: 22, hp: 180, speed: 75, damage: 28, silver: 5,  color: '#454d55', accent: '#7d8993', behavior: 'chase',  gateChance: 0.75 },
  archer:   { r: 14, hp: 32,  speed: 90, damage: 8,  silver: 2,  color: '#6e5a3a', accent: '#a89058', behavior: 'ranged', gateChance: 0.20,
              preferredDistance: 250, fireRange: 350, fireRate: 2.4, arrowSpeed: 280, arrowDamage: 7 },
  abbot:    { r: 38, hp: 3600, speed: 50, damage: 35, silver: 40, color: '#3a2a4a', accent: '#c89c5f', boss: true }
};
