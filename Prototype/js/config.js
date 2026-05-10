export const MONASTERY_HEIGHT = 170;
export const GATE_X = 480;
export const GATE_Y = MONASTERY_HEIGHT - 8;

export const WAVES = [
  { duration: 30, spawnInterval: 0.6, types: ['peasant'], spawnCount: 2, label: 'Lindisfarne Beach' },
  { duration: 35, spawnInterval: 0.5, types: ['peasant', 'peasant', 'militia'], spawnCount: 2, label: 'Outer Cloister' },
  { duration: 45, spawnInterval: 0.55, types: ['peasant', 'militia', 'militia', 'knight'], spawnCount: 2, label: 'The Abbey', boss: 'abbot' }
];

export const ENEMY_DEFS = {
  peasant:  { r: 14, hp: 22, speed: 70, damage: 8,  silver: 4,  color: '#7a7264', accent: '#a89f8c' },
  militia:  { r: 17, hp: 55, speed: 80, damage: 12, silver: 9,  color: '#5e6a52', accent: '#8aa07a' },
  knight:   { r: 22, hp: 140, speed: 55, damage: 22, silver: 22, color: '#454d55', accent: '#7d8993' },
  abbot:    { r: 38, hp: 600, speed: 50, damage: 35, silver: 200, color: '#3a2a4a', accent: '#c89c5f', boss: true }
};
