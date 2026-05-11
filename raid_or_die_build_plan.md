# RAID OR DIE
## Prototype Build Plan

*From validated core loop to ready-for-production prototype.*

---

## Where we are

Stage 1 complete. Stage 2 through Step 7 complete, Step 8 in flight, Step 9 pending.

Current capabilities:

- Playable core loop with 6 weapons, 14 items, 4 archetype anchors
- Hit feedback system, fire feedback, status effects on enemies
- Event-driven item architecture supporting conditional procs, stacks, scoped stat boosts
- Rarity-weighted shop with reroll economy and wallet UI
- Centralized damage application (player and enemy) with armor mechanic
- Frost status system with player-side bonuses applied uniformly to all frost sources

Stage 1 validated: core loop is fun. Stage 2 in progress validating: build variety creates replayability.

## Where we're going

Not all of v1. The prototype's job is to validate design hypotheses, not ship the game. By end of prototype phase, we want to have answered every "is this fun?" question. Then we port to a production framework (PixiJS or Phaser, decided at end of Stage 4).

**Out of scope for prototype:**
- All 25 weapons / 50 items in v1 (use a smaller set that proves variety works)
- All 4 classes (use 2 that prove the class system works)
- All 5 arenas (use 1-2 that prove arena variation works)
- All 5 Danger levels (use a difficulty curve that proves scaling works)
- Real art (procedural only, port to pixel art in production)
- Audio (skip entirely in prototype)
- Leaderboards / Game Center / Play Games
- Multi-platform (stay web for prototype, wrap with Capacitor and Electron in production)

## The four prototype stages

Each stage answers a specific design question. If a stage fails (not fun), redesign before moving on.

### Stage 1: Core loop COMPLETE
**Question:** Does the second-to-second combat feel good?
**Status:** Validated.

### Stage 2: Build variety IN PROGRESS
**Question:** Does choosing items between waves create meaningful replayability?

Detailed step progression below.

### Stage 3: Multi-class
**Question:** Do classes feel distinct enough to drive replay?

**Scope:**
- Add Thor as second class
- Thor's god-power: Thunder Form (lightning damage on hits, area stun)
- Thor's passive: scales with armor stat (already implemented in Stage 2)
- Thor's starter loadout: hammer + shield (instead of Odin's spear + throwing axes)
- Class select screen
- Tune items so some clearly favor one class over the other (without locking)
- Note: Shield Wall items from Stage 2 become Thor-coded synergies without rework

**Milestone:** Are Odin and Thor distinct enough to play both for different reasons?

### Stage 4: Meta-progression
**Question:** Does between-run progression compound the loop's hook?

**Scope:**
- Glory currency (earned per run, persistent)
- Valhalla hub screen (fixed scene, two stations only)
- The Norns: 4 stat upgrade tracks (HP, Damage, Speed, Luck) with 3 tiers each
- The Forge: unlock new weapons into the pool (start with 4, unlock the rest with Glory)
- Run launcher: pick class, start raid

**Milestone:** Does "one more run" feel like meaningful progression?

After Stage 4, the prototype's job is done. Time to build for real.

## Stage 2 step-by-step (actual progression)

| Step | Scope | Status |
|---|---|---|
| 1 | Module refactor from single-file artifact into ES6 modules | COMPLETE |
| 2 | Weapon architecture + Throwing Knife (multi-shot spread) | COMPLETE |
| 3 | Enemy behavior system (chase + ranged) + Saxon Archer | COMPLETE |
| 3.5 | Balance pass + boar heart healing + reroll button + Berserker isolation bug fix | COMPLETE |
| 3.6 | Wallet UI + economy rebalance (1-2 items affordable per shop) | COMPLETE |
| 4 | Warhammer (instant arc) + Longbow (precision projectile) + FIRE_PATTERNS dispatch | COMPLETE |
| 4.5 | Unified hit feedback (particles, enemy flash, damage numbers) + bow fire feedback (bowstring flash, arrow trail) | COMPLETE |
| 5 | Rune of Frost (slow magic projectile + Frost status) + Mjolnir (boomerang, third execution pattern) | COMPLETE |
| 6 | Item system refactor: EFFECT_HANDLERS dispatch, event emitter, stack system, applyPlayerDamage centralization | COMPLETE |
| 7 | 8 archetype items + weapon tag system + scoped stat overlays + armor mechanic + rarity-weighted shop | COMPLETE |
| 8 | Rarity colors on shop cards + Berserker stack HUD + armor HUD verification | IN FLIGHT |
| 9 | Full Stage 2 tuning playtest (the gate to Stage 3) | PENDING |

Interstitial steps (3.5, 3.6, 4.5) were inserted in response to playtest signals or scope refinements rather than originally planned. The pattern: build, playtest, fix what's broken before adding more content. Has worked well.

### Step 9 framing

Different shape than the other steps. Not a code prompt to Claude Code, but a structured playtest by Micah.

The hypothesis being validated: build variety creates replayability.

Rough test shape:
- Complete 2-3 consecutive runs with deliberately different builds (Berserker focus, Thrown focus, Frost focus, Shield Wall focus)
- Track which builds felt distinct, which felt dominant, which felt like traps
- Track whether the shop economy creates real choice or converges to optimal patterns
- Track whether Warhammer, Longbow, Rune, and Mjolnir feel like meaningfully different weapon shapes
- Track whether the Berserker stack counter usefully communicates build state

Pass criteria: two consecutive runs feel meaningfully different AND the urge to play again is real.

Pass → Stage 3 (Thor as second class).
Fail → debug item or weapon balance before adding classes.

A structured Step 9 playtest framework is written when Step 8 lands.

## Tooling progression

**Stage 1 (done):** Single-file HTML artifact for fast iteration.

**Stage 2 (in progress):** Local development with Claude Code. Single project folder, version control with git, vanilla HTML5 + Canvas + JS split into ES6 modules.

Current module set:
- config.js (constants, tunables)
- utils.js (helpers)
- main.js (game loop, state machine)
- player.js (player object, movement, stats, stacks)
- enemies.js (enemy types, behaviors, status effects, damage application)
- weapons.js (weapon defs, FIRE_PATTERNS dispatch, fire timing, scoped stat reads)
- items.js (item defs, EFFECT_HANDLERS dispatch, event registration)
- events.js (event emitter, on/emit/initEventHandlers)
- waves.js (wave structure, spawn logic)
- particles.js (visual effects, hit feedback)
- pickups.js (hacksilver, boar hearts, magnetic collection)
- ui.js (shop, HUD, wallet, reroll, rarity colors)
- render.js (canvas rendering, sprite drawing, HUD draw)

**Stage 5 (production, post-prototype):** Migrate to production-grade web framework (PixiJS or Phaser, decided at end of Stage 4 based on performance and feature needs). Add real art via Aseprite + AI generation (Nano Banana primarily). Add audio via Howler.js. Add mobile touch controls. Wrap with Capacitor for iOS/Android packaging, Electron or NW.js for Steam. Realistically 12+ months of work.

## Architecture systems built in Stage 2

- **BEHAVIORS dispatch** (enemies.js): chase, ranged. Extensible to kite/flank/ambush.
- **FIRE_PATTERNS dispatch** (weapons.js): projectile, arc, boomerang.
- **EFFECT_HANDLERS dispatch** (items.js): 9 effect types.
- **Event emitter** (events.js): registry-of-arrays pattern, zero-allocation emit.
- **Player stack system** (player.stacks): named stacks with decay modes (permanent/timer/reset_on).
- **Per-stack modifier system**: delta-on-change recompute, not per-frame.
- **Centralized damage application**: applyDamage (enemy hook), applyPlayerDamage (player hook with armor reduction).
- **Weapon tag system**: scoped stat overlays via player.weaponTagBoosts.
- **Status effects on enemies**: Frost slow with player-side bonuses applied uniformly.
- **Hit feedback system**: impact particles, enemy hit flash, damage numbers.
- **Per-weapon fire feedback**: extensible pattern, applied to Bow's bowstring flash + arrow trail.
- **Rarity-weighted shop**: 50/30/15/5 weights, with replacement.
- **Reroll economy**: geometric cost scaling, per-shop reset.
- **Wallet UI**: visible balance, unaffordable cards grayed.
- **HUD visibility pattern**: dynamic tactical stats (armor, stack counters) get visible elements.

## What NOT to do in the prototype phase

- Don't add real art. Resist the temptation. Every hour spent on art now is an hour not spent validating design.
- Don't add audio. Same logic.
- Don't add the other two classes (Freya, Loki) during the prototype. Two classes (Odin in Stage 2, Thor in Stage 3) is enough to validate the class system.
- Don't add mobile-specific touch controls yet. Prototype on keyboard/mouse, add touch in Stage 5 when wrapping with Capacitor.
- Don't add leaderboards or any networked features.
- Don't try to balance Danger 5. Balance Danger 1-2 well; the rest comes after.
- Don't write tooling for designing items in a UI. Write items as code data. Tools come later if needed.
- Don't migrate to PixiJS or Phaser mid-prototype. Stay vanilla until Stage 5.
- Don't expand archetype coverage beyond the four validated (Berserker, Thrown, Frost, Shield Wall). Lightning Chain, Trickster, Skald Magic, and Raven Storm need their systems built properly in production, not bolted on for the prototype hypothesis test.

## What to do every session

1. Start the session by reading the design doc to anchor vision.
2. Pick one specific scope item from the current stage.
3. Implement it (with Claude Code, raise-concerns-first workflow).
4. Playtest for 5-10 minutes.
5. Commit to git with a clear message.
6. Note any design observations in a notes.md file (or back into the design doc if substantive).

## Workflow pattern

Validated through Stages 1 and 2:

1. Send step prompt to Claude Code with explicit "raise concerns bundle BEFORE writing code" instruction.
2. Claude Code reports concerns and recommendations as a bundle in chat.
3. Review bundle in design chat, approve or push back.
4. Claude Code writes file by file with notes on what each changes.
5. Claude Code walks through verification checklist on localhost.
6. Commit on success.
7. Return to plan next step.

## Timeline (honest, updated)

- Stage 2: in progress, 10+ steps shipped, 2 remaining. Original estimate 2-4 weeks. Actual elapsed time exceeds estimate due to interstitial polish steps (3.5, 3.6, 4.5) and architectural expansions (item system refactor was larger than scoped). Trade-off accepted: tighter foundation, slower visible progress.
- Stage 3: 2-3 weeks of part-time work
- Stage 4: 2-3 weeks
- Total prototype completion: realistic estimate post-Stage-2: 6-10 weeks more.

Then production build (migrate to PixiJS or Phaser, add art, audio, polish, mobile wrapping): 12-18 months for v1 launch.

## The one rule

If a stage doesn't deliver fun, stop and redesign before continuing. The prototype's job is to expose problems while they're cheap to fix. If Stage 2 doesn't make you want to play again with a different build, no amount of weapons in Stage 5 will save it. Trust the prototype.

## The Stage 2 gate

Step 9 is the actual gate. If it passes, Stage 3 starts immediately. If it doesn't pass, the diagnosis matters:

- If one archetype dominates: tune that archetype down or buff the others.
- If all archetypes feel the same: the items don't create enough mechanical separation; revisit the archetype anchors.
- If the shop economy is the problem (always-buy patterns, no real choice): retune costs and rarity weights.
- If weapons feel samey despite different patterns: revisit weapon stats so each weapon's role is clearer.
- If runs feel like a slog rather than addictive: tune wave pacing, enemy density, or shop reward timing.

The cheapest fix happens here. Don't proceed to Thor with unresolved Stage 2 issues.
