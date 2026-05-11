# RAID OR DIE
**Game Design Document v1.2**

*"The last raid is never the last raid."*

---

## Identity

| | |
|---|---|
| **Genre** | Roguelite arena survivor |
| **Platforms** | iOS, Android, Steam, Web (parallel) |
| **Engine** | HTML5 + Canvas/WebGL (vanilla prototype, PixiJS or Phaser for production) |
| **Run length** | 15-20 minutes |
| **Player count** | Solo at v1, co-op post-launch |
| **References** | Brotato (mechanics), Hades (meta), Mewgenics (tone) |

## The fantasy

You are an einherjar, a chosen warrior of Valhalla. You died in battle. Now you fight every day, train forever, and prepare for Ragnarok, the final unwinnable battle. Each raid is a memory replay or a Ragnarok prep mission. You will die. You will rise. You will raid again.

## Core loop (60-second moment-to-moment)

- Move with virtual joystick (mobile) or WASD (desktop)
- Weapons auto-fire by their own rules (melee when enemies close, ranged at distance)
- Tap god-power button to trigger god-mode when rage bar is full
- Avoid damage, kill enemies, collect hacksilver and XP
- Survive until wave end, enter shop, repeat

## Run structure

- 15-20 waves per run, scales by Danger level
- Each wave: timed survival, enemies spawn from arena edges
- Between waves: shop opens (buy items, level weapons, reroll)
- Final wave: arena boss (mini-boss representing the location's defender)
- Death returns you to Valhalla with Glory earned, no in-run progression carries over

## Classes: 4 Norse gods

Each god has a starter loadout, a passive that defines their build identity, and three god-power variants (1 unlocked at start, 2 locked behind Runes).

| God | Identity | Passive | Starter Weapons |
|---|---|---|---|
| **Odin** | Berserker | Scales with kills | Spear, throwing axes |
| **Thor** | Defender | Scales with armor | Hammer, shield |
| **Freya** | Magic | Scales with magic stacks | Bow, runes |
| **Loki** | Trickster | Scales with luck and crit | Throwing knives, daggers |

All four classes available at launch.

## God-mode (universal mechanic)

Rage bar fills as you take and deal damage. Tap to trigger. Manifests differently per god:

- **Odin (Berserker Rage):** no defense, massive damage, lifesteal on kill
- **Thor (Thunder Form):** lightning damage on hits, area stun, brief invulnerability
- **Freya (Valkyrie Surge):** auto-cast magic, summons two valkyries
- **Loki (Trickster):** untargetable, max crit, double drops

## Weapons system

- 4 weapon slots (mobile-friendly, forces specialization)
- 25 weapons in v1 pool (15 unlocked at start, 10 via Forge)
- Types: melee, thrown, ranged, magic
- Each weapon has tags for archetype-scoped item interactions (thrown, ranged, melee, magic)
- Auto-fire by their own rules, no in-combat switching
- 4 upgrade tiers per weapon
- Swap weapons at shop between waves only

**Execution patterns** (validated in Stage 2 prototype):

| Pattern | Used by | Mechanic |
|---|---|---|
| Projectile | Axe, Knife, Bow, Rune | Spawns projectile that travels until impact or lifetime expires |
| Arc | Warhammer | Instant damage to all enemies in a radius around the player on the swing frame |
| Boomerang | Mjolnir | Projectile travels outward, returns to player's current position, deals damage on both legs |

Bow is non-piercing (precision/executioner identity). Pierce identity reserved for Spear and other weapons.

## Items and synergies

- 50 items in v1 pool (25 unlocked at start, 25 via Forge)
- Item data shape: id, name, cost, rarity, archetype tag, description, effects array
- Effect types: stat_boost (additive or multiplicative, optionally scoped to weapon tag), on_kill, on_hit, on_take_damage, on_low_hp, on_tick, gain_stack, per_stack_modifier, apply_status, instant_heal
- Rarities: common, uncommon, rare, legendary (shop rolls weighted 50/30/15/5)
- 10-15 of 50 have class affinity (extra effect for aligned god, still useful universally)
- No slot limit, stack freely

**8 build archetypes the item pool must support:**
1. Berserker Rage (Odin-coded) — anchored on kill stacks, low-HP triggers
2. Shield Wall (Thor-coded) — anchored on armor, damage reduction procs
3. Skald Magic (Freya-coded) — mechanics TBD (needs design pass)
4. Trickster (Loki-coded) — anchored on crit/luck (needs crit system implementation)
5. Raven Storm — mechanics TBD (needs design pass)
6. Frost — anchored on Rune weapon's Frost status, slow stacking, frost duration items
7. Thrown Weapons — anchored on weapon tag system, scoped damage and fire-rate boosts
8. Lightning Chain — needs chain damage system (target selection, propagation, falloff)

Berserker, Shield Wall, Frost, and Thrown archetypes have mechanical anchors validated in the Stage 2 prototype. Skald Magic, Trickster, Lightning Chain, and Raven Storm require additional system implementation in production.

## Stats (13 total)

Max HP, Armor, HP Regen, Damage, Attack Speed, Range, Crit Chance, Dodge, Move Speed, Pickup Range, Luck, God-Power Charge Rate, Gold Find.

Armor uses flat-subtract with a floor of 1 (prevents invincibility builds).

## Currencies

| Currency | Scope | Earned by | Spent on |
|---|---|---|---|
| **Hacksilver** | In-run, lost on death | Kills, objectives | Wave-break shop |
| **Glory** | Meta, permanent | Waves, bosses, Danger clears | Norns, Forge |
| **Runes** | Keys (not currency) | First-time Danger clears | Throne god-power unlocks only |

## Meta-progression: Valhalla hub

Fixed illustrated scene, tap NPCs to access menus. No walking.

**1. The Norns (spend Glory):** 8 paired stat upgrade tracks, 5 tiers each. Pick one of two effects per track, swap freely between runs.

| Track | Option A | Option B |
|---|---|---|
| HP | +25 max HP | +5% lifesteal on kill |
| Damage | +10% damage | +5% crit chance |
| Armor | +5 armor | +20% armor effectiveness |
| Speed | +10% move speed | +10% pickup range |
| Luck | +5% luck | +10% legendary drop chance |
| Wealth | +50 starting hacksilver | +20% gold find |
| Power | +10% god-power charge rate | -10% god-power cost |
| Resilience | +1 HP regen | 25% chance to survive lethal at 1 HP |

**2. The Forge (spend Glory):** Unlock new weapons and items into the run pool.

**3. The Throne (spend Runes):** Unlock additional god-power variants per class.

**4. Bifrost / Heimdall:** Run launcher. Pick class, god-power variant, Danger level.

## Difficulty structure

**Danger levels 1-5:** Campaign progression. Each tuned. Clearing Danger 5 with all 4 classes is "beating the game." First-time clear of each Danger earns 1 Rune.

**Ragnarok Mode:** Unlocks after first Danger 5 clear. Endless single run. Waves scale infinitely. You will die. The point is how long you last.

## Leaderboards (3 for v1)

1. **Ragnarok Global:** highest wave reached, all-time, per class
2. **Weekly Reset:** Ragnarok score, resets Sunday
3. **Speedrun:** fastest Danger 5 clear, per class

Apple Game Center + Google Play Games integration. Friend leaderboards deferred to v2.

## Enemies (14 types for v1)

| Tier | Enemies |
|---|---|
| **Trash** | Saxon Peasant, Frost Sprite |
| **Standard** | Saxon Militia, Monk, Hellhound |
| **Heavy** | Saxon Knight, Frost Troll |
| **Ranged** | Saxon Archer, Rune-Caster |
| **Elite** | Enemy Berserker |
| **Bosses** | The Abbot, Bridge Troll, The Jarl, The Wall-Captain |

Enemy AI uses a behavior dispatch system (chase, ranged) validated in Stage 2 prototype, extensible to kite/flank/ambush in production without architectural rework.

Lore framing: Saxon-themed enemies are Earth raid memories. Frost and supernatural enemies are Ragnarok prep. Justifies the visual mix.

## Status effects on enemies

Each enemy can carry status effects via a generic status system:
- **Frost:** slow multiplier applied to movement, timer counts down, visible blue tint, refreshes on rehit
- Future: burn, shock, poison (architected to slot in without refactor)

Player has modifier stats that affect all applications of a status (frostDurationBonus, frostStrengthBonus) so items that boost Frost work uniformly across every Frost source.

## Arenas (5 for v1)

| Arena | Tier | Mechanical Hook |
|---|---|---|
| **Monastery (Lindisfarne)** | Starter | Pillars create line-of-sight breaks |
| **Village** | Mid | Destroyable barrels (loot or explode) |
| **Bridge** | Mid-hard | Narrow space, positioning critical |
| **The Wall** | Hard | Linear arena, one-direction pressure |
| **Frozen Wastes (Jotunheim)** | Ragnarok-coded | Open space, big enemies, ice |

## Art direction

**Style:** stylized pixel art with Norse motifs. Higher resolution than Brotato (more detail per sprite). Reference: Octopath Traveler, Sea of Stars, Eastward for sprite density. Not 8-bit retro.

**Tooling:** Aseprite for final sprites. Nano Banana, Midjourney, PixelLab, Stable Diffusion with pixel LoRAs for concept and reference. Hand-clean AI output in Aseprite into game-ready assets.

**Palette by zone:**

| Zone | Palette |
|---|---|
| Monastery | Warm stone, gold accents, candle orange |
| Village | Muted earth, weathered wood, dirt brown |
| Bridge | Gray stone, deep teal water, mossy greens |
| Wall | Cold gray stone, blood red banners |
| Frozen Wastes | Icy blue, white, dark gray, bright blood accents |

**Mobile readability rules (non-negotiable):**
- Player accent color always distinct (red cape, glowing rune)
- Enemy projectiles red/orange, player projectiles blue/white or weapon-branded
- Pickups glow unique color
- High contrast against ground always
- Each enemy type has unique silhouette (silhouette test in grayscale)
- Dynamic tactical stats (Berserker stacks, armor) get visible HUD elements

**Effects:** stylized pixel violence. Pixel particles for impacts in weapon brand color. Cartoon-y death animations (poof of dust, comic crumple). No realistic gore.

**Hit feedback baseline** (validated in Stage 2):
- Impact particles in weapon brand color at hit point
- Brief enemy hit flash (white tint, ~0.06s)
- Floating damage number popup, fades over 0.5s
- Weapons whose projectile alone doesn't read at fire time get supplementary feedback (e.g., bow gets bowstring flash plus arrow trail)

## Audio direction (rough)

- **Music:** Norse folk instrumentation (drums, throat singing, lyra), shifts to driving combat during waves. References: Wardruna, Heilung.
- **SFX:** punchy weapon impacts, distinct death sounds per enemy. Generated via ElevenLabs and edited.
- **VO:** minimal. NPC barks in Old Norse-flavored gibberish or terse English. No long dialogue.

## Production scope

**Solo developer plus AI tooling.** Realistic timeline: 12-18 months to playable beta, 18-24 months to launch.

**v1 content checklist:**
- 4 classes (all available at launch)
- 12 god-power variants (3 per class)
- 25 weapons
- 50 items
- 14 enemy types (10 standard + 4 bosses)
- 5 arenas
- Danger levels 1-5 plus Ragnarok Mode
- Valhalla hub (4 stations)
- 3 leaderboards

**Stage 2 prototype validation status (in progress):**
- 6 weapons designed (Throwing Axe, Throwing Knife, Warhammer, Longbow, Rune of Frost, Mjolnir)
- 14 items designed (6 baseline + 8 archetype)
- 4 of 8 archetypes anchored mechanically (Berserker, Shield Wall, Frost, Thrown)
- Architecture validated: FIRE_PATTERNS dispatch supports 3 execution patterns, EFFECT_HANDLERS supports 9 effect types, event emitter for hooks, weapon tag system, status effects on enemies, scoped stat overlays
- Remaining Stage 2: Step 8 polish (rarity colors + stack HUD), Step 9 full tuning playtest as the gate to Stage 3

**Post-launch roadmap:**
- 5th and 6th gods (Tyr, Heimdall)
- Keepsakes / equipped passives
- Daily challenges
- Cosmetic skins (monetization)
- Additional arenas, enemies, weapons, items
- Co-op multiplayer

**Explicitly out of scope for v1:**
- Walkable hub
- Story dialogue beyond NPC barks
- Friend leaderboards
- Cosmetic shop
- Co-op

## Tech stack

| Layer | Tool |
|---|---|
| Engine (prototype) | Vanilla HTML5 + Canvas + JavaScript, ES6 modules |
| Engine (production) | PixiJS or Phaser (decided end of Stage 4) |
| Code | JavaScript with ES6 modules, paired with Claude Code |
| Art | Aseprite + AI generation (Nano Banana, Midjourney, PixelLab, SD pixel LoRAs) |
| Audio | Howler.js for in-game, ElevenLabs (SFX generation), Suno/Udio (music drafts) |
| Mobile wrapping | Capacitor for iOS/Android native packaging |
| Steam wrapping | Electron or NW.js |
| Backend | Apple Game Center + Google Play Games via Capacitor plugins |
| Distribution | itch.io (web), Steam (Electron), App Store + Google Play (Capacitor) |

## Open TBDs

- Final palette lock-in (during prototype)
- Production framework choice: PixiJS vs Phaser (decide end of Stage 4)
- Rune drop rate beyond first-time clears
- Co-op design specifics (deferred to v2)
- Monetization model (premium upfront, freemium, or free + cosmetics)
- Remaining 19 weapons to design (6 of 25 complete in Stage 2 prototype)
- Remaining 36 items to design (14 of 50 complete in Stage 2 prototype)
- Skald Magic mechanical definition (needed before Freya class implementation)
- Raven Storm mechanical definition
- Lightning Chain system (target selection, propagation, falloff math)
- Crit system implementation (needed before Trickster archetype can land)
- Music budget decision (custom composer vs AI-only)

## North star

> Every design decision serves a tight, mobile-friendly, brutally addictive run loop where the player feels like an einherjar fighting an unwinnable but glorious war forever.

If a feature doesn't serve that, cut it.
