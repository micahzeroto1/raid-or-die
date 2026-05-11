// Lightweight sound effects pool. Preloads each clip once; play creates
// a cloned audio node so playbacks can overlap (e.g. multiple impacts
// landing in the same frame).
//
// Browser autoplay note: like the bg music, these can only play after
// a user gesture. Since combat sounds fire mid-gameplay (which started
// after the "Begin the Raid" click), they're always inside the gesture
// activation period and work fine.

const SOUND_PATHS = {
  axe:     'Assets/axe%20sound.mp3',
  knives:  'Assets/knives%20sound.mp3',
  arrow:   'Assets/arrow%20sound.mp3',
  rune:    'Assets/rune%20sound.mp3',
  hammer:  'Assets/Hammer%20sound.mp3',
  impact:  'Assets/impact%20sound.mp3',
  berserk: 'Assets/Berserk%20sound.mp3'
};

const SOUNDS = {};
for (const key in SOUND_PATHS) {
  const a = new Audio(SOUND_PATHS[key]);
  a.preload = 'auto';
  SOUNDS[key] = a;
}

const lastPlayedAt = {}; // ms timestamp per sound name, for throttling

export function playSound(name, opts = {}) {
  const proto = SOUNDS[name];
  if (!proto) return;

  const minInterval = opts.minInterval ?? 0;
  if (minInterval > 0) {
    const now = performance.now();
    if ((lastPlayedAt[name] || 0) > now - minInterval) return;
    lastPlayedAt[name] = now;
  }

  const instance = proto.cloneNode();
  instance.volume = opts.volume ?? 1.0;
  instance.play().catch(() => {});
}
