// One-shot SFX helper. Earlier version used a preload + cloneNode pool,
// but cloned audio elements don't reliably load their media on mobile —
// many .play() calls silently rejected. Fresh `new Audio()` per call is
// simpler and the browser HTTP cache handles repeated loads.
//
// Browser autoplay note: like the bg music, sounds only play after a user
// gesture. Since combat sounds fire mid-gameplay (started after the
// "Begin the Raid" tap), they're always inside the gesture activation
// period and work.

const SOUND_PATHS = {
  axe:     'Assets/axe%20sound.mp3',
  knives:  'Assets/throwing%20knife%20sound.mp3',
  arrow:   'Assets/arrow%20sound.mp3',
  rune:    'Assets/rune%20sound.mp3',
  hammer:  'Assets/Hammer%20sound.mp3',
  impact:  'Assets/enemy%20impact%20sound.mp3',
  berserk: 'Assets/Berserk%20sound.mp3',
  damage:  'Assets/viking%20damage%20sound.mp3',
  dying:   'Assets/viking%20dying%20sound.mp3'
};

const lastPlayedAt = {};

export function playSound(name, opts = {}) {
  const path = SOUND_PATHS[name];
  if (!path) return;

  const minInterval = opts.minInterval ?? 0;
  if (minInterval > 0) {
    const now = performance.now();
    if ((lastPlayedAt[name] || 0) > now - minInterval) return;
    lastPlayedAt[name] = now;
  }

  const audio = new Audio(path);
  audio.volume = opts.volume ?? 1.0;
  audio.play().catch(err => {
    // Log so failures surface (autoplay block, format issue, etc).
    console.warn('[sound]', name, err && err.name, err && err.message);
  });
}
