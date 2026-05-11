# Raid or Die — Patch Log

Reverse-chronological log of changes to the prototype.
Newest entry at top. Each entry has a short tag in `[brackets]` for index lookup.

Tag conventions:
- `[stage-N step-M]` — work tied to the build plan's stage / step structure
- `[mobile]` — phone / tablet specific work
- `[deploy]` — repo / hosting / GitHub Pages
- `[audio]` — music + SFX
- `[fix]` — bug fix follow-ups (the parent entry usually identifies what was broken)
- `[chore]` — meta / docs / non-gameplay

---

## Index (jump-by-tag)

- **Stage 1 → 2 work**: `[stage-2 step-1]` through `[stage-2 step-8]`
- **Mobile playability pass**: `[mobile-controls]`, `[mobile-fit]`, `[mobile-fullscreen]`, `[mobile-layout]`, `[mobile-pause]`
- **Deploy / hosting**: `[deploy-init]`, `[deploy-pages]`
- **Audio**: `[audio-music]`, `[audio-sfx]`, `[audio-fix-clone]`, `[audio-replace]`
- **Process / meta**: `[chore-changelog]`

---

## 2026-05-11 — `[silver-bump]`

User wants 3+ items purchasable after wave 1, with a stronger payout on wave 3. After a first +50% pass felt undertuned, going harder on all common enemies and giving knight (wave-3-only) a bigger drop so wave 3 scales naturally without needing wave-level multipliers.

- **Peasant silver** 2 → **5** (+150%). Wave 1 + 2 + 3 baseline.
- **Militia silver** 2 → **5** (+150%). Wave 2 + 3.
- **Archer silver** 2 → **5** (+150%). All waves.
- **Knight silver** 5 → **14** (+180%). Wave 3 only — extra scale-up over the base bump.
- Abbot silver 40 unchanged (final-wave flourish; no shop after wave 3 anyway).

Expected outcome: a typical wave 1 clear should comfortably afford 3+ items (70–90 silver each). Wave 3 income compounds since knights themselves drop more *and* the base bump applies to everything else they share a wave with.

Index: `[silver-bump]`.

---

## 2026-05-11 — `[damage-revert]`

Wave 2 still too hard after the spawn-ramp softening. User diagnosis: "we walked up their damage too much." Reverting only the damage axis from the recent difficulty pass — keeping all toughness/aggression bumps. Damage spikes single-hit punishment; HP/speed shape fight cadence.

- **Militia damage** 14 → **12** (revert). Wave 2 touch damage back to pre-difficulty-pass value. Player takes ~10 hits before death instead of ~8.
- **Knight damage** 28 → **22** (revert). Wave 3 touch hits sting but don't catastrophize a single mistake.
- **Abbot bead damage** 20 → **15** (revert). The 5-bead spread keeps its barrage feel; the per-bead chip is gentler.

**Untouched on purpose** (toughness/aggression axis):
- Militia hp 75, speed 100 — they're still tougher and faster than v1.
- Knight hp 180, speed 75 — still a charging brick.
- Abbot hp 3600 — boss still doubled.
- Bead barrage cadence: 5 beads, 0.15 rad step, 1.3s cooldown.
- Variants: vanguard 15%, elite 10%.
- Spawn ramps: wave 2 0.5→0.42, wave 3 0.55→0.40.

Next dial if still too hard: toughness (HP/speed), not damage. Index: `[damage-revert]`.

---

## 2026-05-11 — `[wave2-ease]`

Wave 2 was too hard after stacking militia stat bumps + variance widen + vanguard + elite + spawn ramp. Surgical dial-back, not full revert:

- **Wave 2 `spawnIntervalEnd`** 0.35 → **0.42**. Late-wave flurry softens from "30% denser end" to "16% denser end."
- **Vanguard rate** 20% → **15%**. Fast variants still exist, just less frequent.

Keeping militia stats, elite rate (10%), base spawn rate, and the speed-variance band. Wave 2 enemy count drops ~5-8%; the climactic swarm at wave end is gentler.

**Files**: `Prototype/js/config.js`, `Prototype/js/enemies.js`.

---

## 2026-05-11 — `[rune-buff]`

Rune felt underwhelming for a 150-silver exotic. Three buffs:

- **Pierce 0 → 3** — glyph now passes through up to 4 enemies (initial + 3 pierces). At 60 damage per hit, a single Rune can clear a line.
- **projectileSize 7 → 12** — bigger glyph visually AND a larger collision radius for the "sweep" feel.
- **fireVolume 0.10 → 0.45** — heavy ritual magic, between Berserker (0.25) and Hammer (0.50). The cast now lands as an event.

Frost status (timer 2.0s, slowMult 0.6) and frost-bonus stats from items still apply on every pierce hit — line-clears + line-slows.

**Files**: `Prototype/js/weapons.js`.

---

## 2026-05-11 — `[difficulty-ramp]` + `[abbot-barrage]` + `[enemy-variants]`

### Spawn rate ramps within a wave
New optional `spawnIntervalEnd` field per wave. `updateSpawning` linear-interpolates from `spawnInterval` to `spawnIntervalEnd` based on elapsed wave time.

- Wave 2: 0.5s → 0.35s (last 10s noticeably busier than first 10s)
- Wave 3: 0.55s → 0.40s
- Wave 1: omitted, stays constant — tutorial

Net enemy count per wave goes up ~16% from the ramp.

### Abbot bead barrage upgraded
- 3 beads → **5 beads** per volley
- Angle step 0.25 rad → **0.15 rad** (denser cone)
- Damage per bead 15 → **20**
- Fire cooldown 1.7s → **1.3s**

Boss now feels like a bullet-hell encounter instead of a sparse shotgun.

### Asymmetric variants in `spawnEnemy`
On each spawn (excluding boss):
- 20% **Vanguard**: extra ×1.30 speed multiplier on top of existing ±25% variance. Sprints ahead of pack.
- 10% **Elite**: ×1.50 HP. Noticeably tankier.
- Variants can stack (1-in-50 fast tank).

No visual distinction yet — player learns from behavior. Add a tint / radius bump in a follow-up if it feels random.

**Files**: `Prototype/js/config.js`, `Prototype/js/waves.js`, `Prototype/js/enemies.js`.

---

## 2026-05-11 — `[difficulty-bump-w2w3]`

Difficulty bumps requested for waves 2-3:

- **Militia** (wave 2's new threat): hp 55→75, speed 90→100 (now faster than archer), damage 12→14.
- **Knight** (wave 3's new threat): hp 140→180, speed 55→75 (no longer slow crawl — heavy charger), damage 22→28.
- **Abbot**: hp 1800→3600 (doubled per request). Now requires multiple Berserker windows + sustained pressure.

Speed variance ±25% still applies — top-end fast militia can hit ~125, fast knights ~94. Faster than archer base for both new variants.

**Files**: `Prototype/js/config.js`.

---

## 2026-05-11 — `[econ-bump-wave1]`

### Peasant drop 1 → 2
Shop 1 felt stingy — only one item affordable on average. Bumping peasant drop directly raises wave 1 income (~75% peasants by pool weight) without dramatically inflating later waves where peasants are a smaller share.

Income deltas:
- Wave 1: 125 → 200 silver (+60%, ~2-3 cheap items now affordable)
- Wave 2: 252 → 280 silver (+11%)
- Wave 3: 422 → 449 silver (+6%)

**Files**: `Prototype/js/config.js`.

---

## 2026-05-11 — `[audio-pickups]` + `[enemy-visual-distinguish]`

### Pickup sounds added
Two new SFX wired into `pickups.js` collection logic:
- `hacksilver sound.mp3` — plays on silver coin pickup. Throttled `minInterval: 60` so magnet-burst pickups don't fire a wall of clinks.
- `mead sound.mp3` — plays on mead flask pickup.

Both compressed to mono 96 kbps (`ffmpeg -ac 1 -b:a 96k`) like the other SFX. ~6.4 KB each.

Volumes: hacksilver 0.18, mead 0.3.

### Enemies visually distinguished
At small mobile sizes the enemies all read as "round body with stuff on top." Added one strong distinguishing feature per type:

- **Peasant** — red bandana wrapped around the forehead (only enemy with red headwear).
- **Militia** — white cross painted across the shield (military emblem). Reinforces "soldier with kit."
- **Knight** — steel pauldrons (shoulder plates) — silhouette is now visibly broader. Reads as "heavily armored."
- **Archer** — hood changed from dark brown → forest green. Visually decouples archer from peasant's earth-tone tunic.

**Files**: `Prototype/Assets/hacksilver sound.mp3`, `Prototype/Assets/mead sound.mp3`, `Prototype/js/sounds.js`, `Prototype/js/pickups.js`, `Prototype/js/render.js`.

---

## 2026-05-11 — `[mead-bump]` + `[ai-melee-faster]`

### Mead Flask drop rate 4% → 6%
50% bump. Drops visible more often without being spammy.

### Soldiers faster + wider variance
- **Peasant** base speed 70 → 80
- **Militia** base speed 80 → 90 (matches archer base)
- **Knight** unchanged at 55 — heavy unit, intentionally slow
- **Per-enemy speed variance** ±15% → ±25%

Effective speed ranges after both changes: peasant 60-100, militia 67-112, knight 41-69, archer 67-112. Fast variants in each type can now sprint at archer-tier speeds; slow stragglers fill in behind. Combined with the existing separation behavior, crowds feel like individuals arriving in waves instead of a coordinated unit.

**Files**: `Prototype/js/enemies.js`, `Prototype/js/config.js`.

---

## 2026-05-11 — `[audio-longbow-louder]`

Longbow `fireVolume: 0.35` override (was using default 0.10). Bow release now clearly audible — between Berserker (0.25) and Hammer (0.5) in the loudness hierarchy.

**Files**: `Prototype/js/weapons.js`.

---

## 2026-05-11 — `[ai-ranged-scatter]`

### Ranged enemies scatter instead of cluster
Archers were converging to the same 250px ring (their `preferredDistance`) and clumping along whatever arc their spawn-edge deposited them on. With the prior tight separation radius (~22px), repulsion only kicked in when they were nearly touching — most archers ended up shoulder-to-shoulder on the ring's perimeter.

Three changes:
- `separationForce` refactored to take a `radius` parameter. Chase keeps `e.r * 1.6` (~22px, just prevents overlap). Ranged passes `e.r * 4` (~56px), so archers feel each other from much further out and fan out laterally.
- **Per-archer `preferredDistance` ±30%** at spawn — instead of every archer sitting at exactly 250, they spread between 175-325. Creates depth: some archers right on top of the player, others further back.
- Together: archers form a **scattered ring with depth** instead of a tight perimeter arc.

**Files**: `Prototype/js/enemies.js`.

---

## 2026-05-11 — `[ai-separation-tune]`

### Herd-effect fix

First pass on separation (1.5× weight, 2.2× radius) prevented stacking but created a synchronized herd: enemies orbited the player instead of closing, and the player could circle the pack and pick them off. Three follow-up tweaks:

- **Separation weight 1.5 → 0.6** at both call sites. Chase pull (magnitude 1.0) now always dominates the separation push — enemies close on the player, separation only prevents physical overlap.
- **Separation radius `e.r * 2.2` → `e.r * 1.6`** so repulsion kicks in only when enemies are nearly touching, not at a wide buffer.
- **Per-enemy speed variance ±15%** in `spawnEnemy`. Some peasants emerge as fast vanguards, others as slow stragglers, breaking the single-blob look.

**Files**: `Prototype/js/enemies.js`.

---

## 2026-05-11 — `[audio-hammer-louder]` + `[ai-separation]`

### Hammer fire volume bumped
- Warhammer `fireVolume: 0.5` (overrides the default 0.10). 2× the Berserker activation sound. Heavy thud, audible against music + impact stack.

### Enemy separation steering
Enemies were clumping into a single stacked blob since `updateChaseBehavior` and `updateRangedBehavior` only steered toward the player.

Added `separationForce(e, enemies)` — boids-style repulsion vector from neighbors within `e.r * 2.2`, strength scales with closeness.

Integrated into both behaviors:
- **Chase**: combine `(chase unit vector) + 1.5 × separation`, normalize, apply at `e.speed * slowMult * dt`.
- **Ranged**: combine `(sign × approach unit vector) + 1.5 × separation`, normalize, apply at base speed. `sign` is +1 (approach), -1 (retreat), or 0 (hold) per the existing preferred-distance band logic. Even "holding" archers now drift laterally apart from neighbors.

**Speed budget preserved** — separation only redirects, doesn't accelerate. Wave difficulty unchanged.

Boss left alone (only one Abbot at a time, no clumping to fix).

Cost: O(N²) per frame. At ~50 enemies = 2,500 distance ops/frame, trivial for modern JS. Will revisit with a spatial grid if waves exceed ~100 entities.

**Files**: `Prototype/js/weapons.js`, `Prototype/js/enemies.js`.

---

## 2026-05-11 — `[audio-music-compress]`

### Einherjar March: 191 kbps → 128 kbps stereo
File was at near-CD quality, overkill for a web prototype.

- 9,051,817 bytes → 6,214,563 bytes (31% reduction).
- Still stereo so the drum + throat-singing spatial image is preserved.
- No audible quality difference on phone speakers / typical desktop setups.

### `preload="auto"` → `preload="metadata"`
Browser now fetches only the audio metadata (duration etc) on page load, defers the actual file fetch until `.play()` is called on the "Begin the Raid" tap. First paint is no longer blocked by the 6 MB music download.

**Files**: `Prototype/Assets/Einherjar March.mp3`, `Prototype/index.html`.

---

## 2026-05-11 — `[audio-compress]` + `[audio-volume]` (round 3)

### SFX compressed: stereo 192 kbps → mono 96 kbps
Re-encoded all 9 SFX MP3s via `ffmpeg -ac 1 -b:a 96k`. Sizes ~halved across the board:
- Berserk / Hammer / Rune: 49 KB → 25 KB
- Most fire sounds + viking damage/dying + throwing knife: 25 KB → 13 KB
- Enemy impact: 13 KB → 6 KB
- Total SFX payload: ~288 KB → ~144 KB

No audible quality difference for short SFX. Music untouched (already 64 kbps stereo, kept for music quality).

### Volume bumps (diagnostic)
While debugging "I don't hear damage/dying on desktop", bumped:
- damage: 0.10 → 0.5
- dying: 0.35 → 0.8

User confirmed they could hear on mobile at these levels. Diagnostic `console.log` statements removed.

**Files**: `Prototype/Assets/*.mp3` (re-encoded), `Prototype/js/enemies.js`.

---

## 2026-05-11 — `[audio-replace]` (round 3) + `[audio-volume]`

### New sounds matched
- `viking damage sound.mp3` (new) → renamed `hurt` key to `damage` in sounds.js; plays on player taking non-lethal damage in `applyPlayerDamage`.
- `viking dying sound.mp3` (new) → new `dying` key; plays once on player death (HP ≤ 0). The per-hit damage sound is suppressed on the fatal hit so it doesn't stack with dying.
- `enemy impact sound.mp3` (replaced file, same key) → already wired as `impact`. No code change for this one.
- `viking hurt sound.mp3` removed from repo (orphaned after the rename).

### Volume cut, round 2
Across-the-board reduction so SFX don't fight the music:
- All weapon fires default 0.25 → 0.10. Knife override 0.12 → 0.07.
- Impact (per player → enemy hit) 0.08 → 0.04.
- Damage (player hit) 0.20 → 0.10.
- Berserker activation 0.50 → 0.25.
- Dying (new) 0.35.

**Files**: `Prototype/js/sounds.js`, `Prototype/js/enemies.js`, `Prototype/js/weapons.js`, `Prototype/js/player.js`, `Prototype/Assets/` (file replace + add + delete).

---

## 2026-05-11 — `[chore-changelog]` + `[mobile-pause]`

### Changelog file added (this file)
First entry in the patch log. From here forward, every code-affecting commit should add a dated entry here so future sessions and future-Micah can reference what changed and why.

### Click-to-pause + music pause
- Canvas click toggles a new `'paused'` game state. Update loop already short-circuits when state isn't `'playing'`, so this freezes all gameplay (cooldowns, enemies, projectiles, particles, ticks, stack decay).
- Music pauses on entry to `paused`, resumes on exit.
- Pause overlay (`#pause`) is semi-transparent (0.45 black) so the frozen game is still visible behind. Overlay has `pointer-events: none` so any click during pause passes through to the canvas underneath to resume.
- Click listener attached to canvas only — shop / menu / gameover / victory overlays cover the canvas with their own click handlers, so this never fires while those screens are up. No conflict with "Begin the Raid", shop card taps, "Raid Again", or the fullscreen button.

**Files**: `Prototype/index.html` (pause overlay HTML + CSS), `Prototype/js/main.js` (togglePause + listener).

---

## 2026-05-10 → 2026-05-11 — `[audio-replace]`

### Sound replacements + viking hurt + volume tuning
- Replaced `impact sound.mp3` with `enemy impact sound.mp3` (on player → enemy hits).
- Replaced `knives sound.mp3` with `throwing knife sound.mp3`.
- Added `viking hurt sound.mp3` — fires in `applyPlayerDamage` (enemies.js) when the player takes a hit. Gated by the existing invuln window so it can't spam.
- Volume tuning: impact 0.15 → 0.08, knife fire 0.25 → 0.12 (via new `weapon.fireVolume` override field), viking hurt at 0.20.

**Files**: `Prototype/Assets/` (3 file swaps), `Prototype/js/sounds.js`, `Prototype/js/enemies.js`, `Prototype/js/weapons.js`.

---

## 2026-05-10 — `[audio-fix-clone]`

### SFX silently failing on mobile — fixed
Earlier `sounds.js` used a preload-once + `cloneNode()` pool. Cloned audio elements don't reliably trigger media load on mobile Safari/Chrome, and the `.catch(() => {})` in `play()` swallowed all the rejection errors so nothing surfaced.

Rewrote `playSound` to use `new Audio(path)` fresh per call (browser HTTP cache handles repeats) and added `console.warn` on rejection so future audio failures are diagnosable.

**Files**: `Prototype/js/sounds.js`.

---

## 2026-05-10 — `[audio-sfx]`

### Sound effects pool + per-weapon fire sounds + impact + berserker
- New module `Prototype/js/sounds.js` — preloaded audio dict, `playSound(name, opts)` helper with throttle support.
- Wired each weapon to a `fireSound` (`axe`, `knives`, `arrow`, `rune`, `hammer`, mjolnir reuses axe).
- Impact sound (`enemy impact`) fires per player → enemy hit, throttled 60ms to avoid sound walls during knife volleys.
- Berserker activation plays `berserk` sound.

**Files**: `Prototype/js/sounds.js` (new), `Prototype/js/weapons.js`, `Prototype/js/enemies.js`, `Prototype/js/player.js`, `Prototype/Assets/*.mp3`.

---

## 2026-05-10 — `[audio-music]`

### Background music: Einherjar March
- `<audio loop preload="auto">` element near end of body. Volume 0.4.
- Plays on the "Begin the Raid" click (browser autoplay policy blocks unsolicited audio).
- Loops continuously through all game states.

**Files**: `Prototype/index.html`, `Prototype/js/main.js`, `Prototype/Assets/Einherjar March.mp3`.

---

## 2026-05-10 — `[mobile-layout]`

### Touch controls moved off the map to dedicated screen real estate
- Joystick + Berserk button were absolutely positioned inside game-frame (overlaying canvas). Restructured to be siblings of game-frame inside a new `.play-layout` grid container.
- Portrait: frame spans both columns on row 1; joystick + Berserk side-by-side on row 2 below.
- Landscape: joystick LEFT, frame CENTER, Berserk RIGHT.
- Desktop: just the frame, controls hidden.

**Files**: `Prototype/index.html`.

---

## 2026-05-10 — `[mobile-fullscreen]`

### Fullscreen button + viewport fitting on iPad / mobile
- `<button class="fullscreen-btn">⛶</button>` top-right of game-frame; cross-browser fullscreen toggle (`requestFullscreen` / webkit / ms). iOS Safari: button auto-hides since the Fullscreen API isn't supported for non-video elements.
- Added `apple-mobile-web-app-capable` + status-bar-style + `mobile-web-app-capable` meta tags so iOS users can "Share → Add to Home Screen" for true fullscreen.
- Switched `100vh` → `100dvh` (dynamic viewport height) so layout responds to Safari's URL bar showing / hiding.
- Bumped frame width-derived height from 90vh → 95dvh for max real estate.

**Files**: `Prototype/index.html`, `Prototype/js/main.js`.

---

## 2026-05-10 — `[mobile-fit]`

### Letterbox-fit camera → aspect-ratio approach (v2 fix)
- v1 of the camera worked with CSS transform on the canvas to pan it; on phones, HUD anchored to game-frame corners floated over empty letterbox bars instead of next to the canvas. "Wonky" feel.
- v2 fix: use CSS `aspect-ratio: 3/2` on `.game-frame` with width clamped to `min(95vw, 960px, 90vh*1.5)`. Game-frame always preserves world aspect. Canvas fills frame normally. HUD overlays + touch controls anchored to frame corners now sit at canvas corners as intended.
- Dropped JS `updateCameraScroll` + resize listeners — CSS handles all sizing now.

**Files**: `Prototype/index.html`, `Prototype/js/main.js`.

---

## 2026-05-10 — `[mobile-controls]`

### Initial mobile pass: virtual joystick + Berserk button + CSS-transform camera (deprecated)
- Joystick (110px ring + 44px thumb) and Berserk button (88px) added to game-frame; touch event listeners track one finger, compute analog dx/dy in [-1, 1].
- `game.touchInput.dx/dy` added; `updatePlayer` reads it additively with WASD; normalize threshold changed from `> 0` to `> 1` to preserve analog joystick magnitude.
- Canvas CSS transform was used to pan world (camera follows player); this was later replaced by the aspect-ratio approach (`[mobile-fit]`).
- Vignette moved from canvas-rendered to CSS pseudo-element overlay so it stays viewport-centered.

**Files**: `Prototype/index.html`, `Prototype/js/main.js`, `Prototype/js/player.js`, `Prototype/js/render.js`.

---

## 2026-05-10 — `[deploy-pages]`

### GitHub Pages deployment
- Created `_config.yml` with Jekyll `exclude` so strategy docs aren't served at the Pages URL.
- Made the repo public (free-tier Pages requires public repos).
- Enabled Pages on `main` branch root via `gh api`.
- **Live URL**: https://micahzeroto1.github.io/raid-or-die/Prototype/

**Files**: `_config.yml` (new).

---

## 2026-05-10 — `[deploy-init]`

### Git init + GitHub remote + initial commit
- Initialized git on `main`, added `.gitignore` (excludes `.DS_Store`, `.claude/settings.local.json`, editor cruft).
- Set user identity to `Micah Whitehead <micah@zeroto1.co>` (one-time global config).
- Created private repo `micahzeroto1/raid-or-die` via `gh repo create`.
- First commit covered Stage 1 refactor + Stage 2 step 1 (weapon system + Throwing Knife).

**Files**: `.gitignore` (new), all of `Prototype/`.

---

## 2026-05-10 — `[stage-2 step-8]`

### Shop rarity colors + Berserker stack HUD
- Shop cards get `rarity-{common|uncommon|rare|legendary}` CSS class: border-color + cost-text color shift. Disabled state still overrides cost to blood-red.
- New stack-row HUD element below rage bar shows "BERSERKER ×N" + decay bar per active stack. Generic loop over `player.stacks` driven by `STACK_DISPLAY_CONFIG` map in ui.js — adding stacks is one new entry.

**Files**: `Prototype/index.html`, `Prototype/js/ui.js`.

---

## 2026-05-10 — `[stage-2 step-7]`

### 8 archetype items + supporting infrastructure
- Items: Battle Frenzy, Bloodlust (Berserker); Whetstone Belt, Eager Hand (Thrown); Frostbite, Glacier's Edge (Frost); Iron Skin, Tortoise Shell (Shield Wall).
- Weapon tag system (`weapon.tags = ['thrown'/'melee'/'ranged'/'magic']`) for scoped stat boosts like "thrown weapons +5 damage".
- Scoped `stat_boost` routes to `player.weaponTagBoosts[tag][stat]` overlay; `getEffectiveDamageBonus` / `getEffectiveFireRateMult` helpers merge global + tag overlays at fire time.
- Frost-bonus stats: `player.frostDurationBonus`, `player.frostStrengthBonus` (capped 0.95). `applyStatus(game, enemy, type, params)` reads them via new `computeStatusParams`.
- Armor mechanic: `player.armor` reduces damage flat with floor of 1 in `applyPlayerDamage`. HUD armor row visible only when armor > 0.
- Rarity-weighted shop picks (common 50 / uncommon 30 / rare 15 / legendary 5), with replacement.

**Files**: `Prototype/js/items.js`, `Prototype/js/weapons.js`, `Prototype/js/player.js`, `Prototype/js/enemies.js`, `Prototype/js/ui.js`, `Prototype/index.html`.

---

## 2026-05-10 — `[stage-2 step-6]`

### Item system structural refactor
- New `Prototype/js/events.js`: registry of event handlers (`onKill`, `onHit`, `onTakeDamage`, `onLowHp`, `onTick`); `tickTickHandlers`, `recomputePerStackModifiers`.
- New item data shape: `{ id, name, cost, rarity, archetype, description, effects[] }` replacing the old `apply` closures.
- `EFFECT_HANDLERS` dispatch map for 10+ effect types (`stat_boost`, `instant_heal`, `clamp_hp`, `on_kill`, `on_hit`, `on_take_damage`, `on_low_hp`, `on_tick`, `gain_stack`, `per_stack_modifier`, `apply_status`).
- Player gains `stacks: {}` + `lowHpFlag`; stack helpers `registerStack`, `gainStack`, `tickStackDecay`, `resetStack`.
- New `applyPlayerDamage(game, damage, opts)` helper centralizes player damage at two sites; fires `onTakeDamage`.
- Emit `onKill` in `killEnemy`; `onHit` in `applyDamage`.
- Existing 6 items migrated; behavior unchanged.

**Files**: `Prototype/js/events.js` (new), `Prototype/js/items.js`, `Prototype/js/player.js`, `Prototype/js/enemies.js`, `Prototype/js/main.js`, `Prototype/js/ui.js`.

---

## 2026-05-10 — `[stage-2 step-5]`

### Rune + Mjolnir + Frost status system
- Rune (magic projectile, 60 dmg, slow ice-blue glyph, applies Frost).
- Mjolnir (boomerang, 22 dmg/leg, returns to current player position, per-leg dedup via `hitThisLeg`).
- New `'boomerang'` entry in `FIRE_PATTERNS` (now 3 patterns: projectile, arc, boomerang).
- Frost status: `enemy.statuses` dict keyed by type. `applyStatus` registers; `tickEnemyStatuses` decays; movement reads `slowMult`.
- `endWave` clears `game.projectiles` so in-flight Mjolnirs don't survive the shop pause.

**Files**: `Prototype/js/weapons.js`, `Prototype/js/enemies.js`, `Prototype/js/render.js`, `Prototype/js/waves.js`.

---

## 2026-05-10 — `[stage-2 step-4.5]`

### Unified hit feedback + bow fire feedback
- Centralized damage application via new `applyDamage(game, enemy, j, damage, opts)` in enemies.js. Both inline damage blocks (arc and projectile) collapse to one call each.
- Damage numbers as a particle subtype (`kind: 'dmg_num'`). x-jitter on spawn to prevent stacked overlap.
- Brand-colored impact sparks via `opts.color`.
- Hit flash duration 0.1 → 0.08s, moved into applyDamage so all damage sources inherit.
- Longbow: `fireFlashDuration: 0.1` → renders bowstring flash on fire (6 radiating sparks from player, rotated to facing). Arrow shape spawns trail particles per frame.
- Brighter arrow color, glow halo on arrow projectile, bigger/brighter trail particles for visibility.

**Files**: `Prototype/js/enemies.js`, `Prototype/js/weapons.js`, `Prototype/js/particles.js`, `Prototype/js/render.js`.

---

## 2026-05-10 — `[stage-2 step-4]`

### Warhammer (arc) + Longbow (precision)
- `FIRE_PATTERNS` dispatch map: `projectile` (axe/knife) + new `arc` (warhammer).
- Warhammer: 360° instant arc, 80px radius, 25 dmg, full damage to all in arc; `slot.swingTimer` drives fading ring visual in drawPlayer.
- Longbow: 40 dmg, 1.4s rate, fast arrow projectile (700 speed, range 700), arrow shape (not spinning blade).
- Projectile shape dispatch (`drawBladeProjectile` / `drawPlayerArrow`); `spins` flag controls rotation tick (arrows don't tumble).
- HUD slot icons disambiguated (A/K/W/L instead of all weapons starting with T).
- Knife `rageGain: 0.3` so it doesn't spam Berserker (was building rage 6× faster than axe).

**Files**: `Prototype/js/weapons.js`, `Prototype/js/render.js`, `Prototype/js/ui.js`.

---

## 2026-05-10 — `[stage-2 step-3.6]`

### Wallet UI + economy rebalance
- Shop wallet display at top of overlay, syncs every frame via `updateHUD` reading `game.totalSilver`.
- Disabled card styling: opacity 0.5, cursor default, red cost text.
- Enemy silver drops reduced ~75% (peasant 4→1, militia 9→2, knight 22→5, archer 8→2, abbot 200→40).
- Item costs tripled (18-30 → 55-90). Knife 25→75, axe (placeholder if offered) 30→90.
- Reweave start cost 5 → 15.
- Abbot HP 600 → 900 → 1800 (two rounds of tuning). Abbot fire cooldown 2.2 → 1.7s; spawn delay 2.0 → 1.5s.
- Net target: shop 1 affords 1-2 items typical, 3 with luck. Reweaves bite into budget meaningfully.

**Files**: `Prototype/js/config.js`, `Prototype/js/items.js`, `Prototype/js/weapons.js`, `Prototype/js/ui.js`, `Prototype/js/enemies.js`, `Prototype/index.html`.

---

## 2026-05-10 — `[stage-2 step-3.5/3.5b]`

### Mead Flask healing pickup + Reweave button + thematic renames
- Mead Flask pickup (drinking-horn visual, 4% drop from non-bosses, heals 15 HP, green flash on collect, magnetic).
- Pickup type discriminator (`type: 'silver' | 'mead_flask'`); collection + rendering dispatch by type.
- Reweave button in shop (cost starts 15, doubles per use; resets per shop visit).
- "Reroll" → "Reweave" rename (Norns weaving fate flavor).
- "Boar Heart" → "Mead Flask" rename (narratively fits Saxon enemies; Boar Heart shop item is unrelated and kept).
- Light tuning: archer arrowDamage 10→7, fireRate 1.8→2.4, player starting HP 100→120.

**Files**: `Prototype/index.html`, `Prototype/js/config.js`, `Prototype/js/items.js`, `Prototype/js/enemies.js`, `Prototype/js/pickups.js`, `Prototype/js/render.js`, `Prototype/js/ui.js`, `Prototype/js/waves.js`, `Prototype/js/player.js`.

---

## 2026-05-10 — `[stage-2 step-3]`

### Enemy behavior system + Saxon Archer
- Behavior dispatch in enemies.js: `BEHAVIORS = { chase, ranged }`.
- Saxon Archer (ranged behavior): preferred-distance band 250±30 with arrows on fireRate cycle.
- Universal enemy clamp so ranged enemies can't back off-screen.
- Enemy projectile rotation no longer ticks (arrows hold fire-angle; beads are circles).
- Wave compositions updated to include archers.

**Files**: `Prototype/js/enemies.js`, `Prototype/js/config.js`, `Prototype/js/render.js`.

---

## 2026-05-10 — `[stage-2 step-2]`

### Weapon system + Throwing Knife
- Refactored throwing axe into data-driven `WEAPONS` dict in weapons.js.
- 4 weapon slots on player; per-slot cooldown.
- Throwing Knife: 3-shot spread, fast fire rate, low single-target damage.
- Shop offers mix of weapons + items (rotates).
- Player loses `damage` / `fireRate`; gains `damageBonus` (additive) / `fireRateMult` (multiplier).

**Files**: `Prototype/js/weapons.js`, `Prototype/js/player.js`, `Prototype/js/main.js`, `Prototype/js/ui.js`, `Prototype/js/items.js`, `Prototype/js/render.js`, `Prototype/index.html`.

---

## 2026-05-10 — `[stage-2 step-1]`

### ES6 module refactor of the single-file prototype
- Split `Prototype/index.html`'s inline `<script>` (1175 lines) into 12 ES6 modules under `Prototype/js/`:
  `main.js` (entry + loop + state), `config.js`, `utils.js`, `player.js`, `enemies.js`, `weapons.js`, `items.js`, `waves.js`, `particles.js`, `pickups.js`, `ui.js`, `render.js`.
- Zero behavioral changes. Game played identically post-refactor.
- `index.html` reduced to HTML+CSS+`<script type="module" src="js/main.js">`.

**Files**: `Prototype/index.html`, all of `Prototype/js/` (new).
