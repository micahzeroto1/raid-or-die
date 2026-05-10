# RAID OR DIE
## Prototype Build Plan

*From validated core loop to ready-for-production prototype.*

---

## Where we are

Stage 1 complete. We have:

- Playable core loop validated as fun (move, auto-fire axes, dodge, kill, collect)
- 1 class (Odin) with Berserker god-power
- 1 arena (Monastery) with directional "overtaking" spawn
- 3 enemy types (Peasant, Militia, Knight) + Abbot boss
- 3-wave structure with between-wave shop (6 stat upgrades)
- Procedural art readable enough to test gameplay

This was Stage 1. The core loop is fun. We can build on it.

## Where we're going

Not all of v1. The prototype's job is to validate design hypotheses, not ship the game. By end of prototype phase, we want to have answered every "is this fun?" question. Then we port to Godot for production.

**Out of scope for prototype:**
- 25 weapons / 50 items (use a smaller set that proves variety works)
- All 4 classes (use 2 that prove the class system works)
- All 5 arenas (use 1-2 that prove arena variation works)
- All 5 Danger levels (use a difficulty curve that proves scaling works)
- Real art (procedural only, port to pixel art in Godot)
- Audio (skip entirely)
- Leaderboards / Game Center / Play Games
- Multi-platform (stay web for prototype, port to mobile in Godot)

## The four prototype stages

Each stage answers a specific design question. If a stage fails (not fun), we redesign before moving on. Each stage is roughly 2-3 weeks of part-time work.

### Stage 1: Core loop ✓
**Question:** Does the second-to-second combat feel good?
**Status:** Validated.

### Stage 2: Build variety
**Question:** Does choosing items between waves create meaningful replayability?

**Scope:**
- Expand weapons from 1 to 6-8 with distinct fire patterns:
  - Throwing axe (current, baseline)
  - Throwing knife (faster, weaker, multi-shot)
  - Hammer (melee, AoE on swing)
  - Bow (long range, single target, high damage)
  - Rune (magic projectile, slow, big damage)
  - Spear (piercing, hits multiple enemies in line)
  - Maybe Mjolnir (boomerang behavior)
- Expand items from 6 stat boosts to 15-20 with synergies:
  - Some stat boosts (current)
  - Some conditional procs (on-kill, low-HP, every-X-seconds)
  - Some synergy enablers (Berserker stack: more attack speed when low HP; Frost stack: enemies slowed)
  - 2-3 legendary items (build-defining)
- Build archetypes to support: Berserker rage, Thrown stacking, Frost, basic Lightning
- Shop offers 4 items instead of 3, plus reroll button (costs hacksilver)

**Milestone:** Can you complete two consecutive runs with meaningfully different builds? Do you WANT to?

**If yes:** advance to Stage 3.
**If no:** debug item design before adding classes.

### Stage 3: Multi-class
**Question:** Do classes feel distinct enough to drive replay?

**Scope:**
- Add Thor as second class
- Thor's god-power: Thunder Form (lightning damage on hits, area stun)
- Thor's passive: scales with armor stat
- Thor's starter loadout: hammer + shield (instead of Odin's spear + throwing axes)
- Class select screen
- Tune items so some clearly favor one class over the other (without locking)

**Milestone:** Are Odin and Thor distinct enough that you'd play both for different reasons?

### Stage 4: Meta-progression
**Question:** Does between-run progression compound the loop's hook?

**Scope:**
- Add Glory currency (earned per run, persistent)
- Add Valhalla hub screen (fixed scene, two stations only)
- The Norns: 4 stat upgrade tracks (HP, Damage, Speed, Luck) with 3 tiers each
- The Forge: unlock new weapons into the pool (start with 4, unlock the rest with Glory)
- Run launcher: pick class, start raid

**Milestone:** Does "one more run" feel like meaningful progression?

After Stage 4 completes successfully, the prototype's job is done. Every major design hypothesis is validated. Time to build for real.

## Tooling progression

**Stage 1 (done):** Single-file HTML artifact for fast iteration.

**Stage 2-4:** Local development with Claude Code. Single project folder, version control with git, vanilla HTML5 + Canvas + JS split into ES6 modules (player.js, enemies.js, weapons.js, items.js, ui.js, etc.).

**Stage 5 (production, post-prototype):** Migrate to production-grade web framework (PixiJS or Phaser, decided at end of Stage 4 based on performance and feature needs). Add real art via Aseprite + AI generation (Nano Banana primarily). Add audio via Howler.js. Add mobile touch controls. Wrap with Capacitor for iOS/Android packaging, Electron or NW.js for Steam. Realistically 12+ months of work.

## First steps with Claude Code

1. **Install Cursor or Claude Code CLI.** Cursor wraps an IDE around AI; Claude Code is terminal-based. Both work. Cursor is friendlier for someone newer to local dev.

2. **Create the project folder.** Name it `raid-or-die`. Initialize git: `git init`. Commit early and often.

3. **Move the prototype in.** Copy the current HTML artifact into `prototype/index.html`. This is your starting point.

4. **Open Cursor (or Claude Code) and start a chat.** The first message should be something like:

> I'm continuing development of Raid or Die, a roguelite arena survivor. The current prototype is in `prototype/index.html`. I want to expand it for Stage 2 of the build plan: add 6 new weapons and 15 new items that support distinct build archetypes (Berserker, Thrown, Frost, Lightning). Start by suggesting how to refactor the single file into modules (player, enemies, weapons, items, ui, game-state) so we can add content cleanly. Don't write the refactor yet, just propose the structure.

5. **Refactor first, then add content.** The single-file prototype was fine for one-shot validation. For ongoing development, split it. Cursor/Claude Code will handle this well.

6. **Add content one weapon / one item at a time.** Resist batches. One change, test it, commit. This is how you keep complexity controlled.

## What NOT to do in the prototype phase

- Don't add real art. The temptation will be strong. Resist it. Every hour spent on art now is an hour not spent validating design.
- Don't add audio. Same logic.
- Don't add the other two classes (Freya, Loki) during the prototype. Two classes is enough to validate the class system.
- Don't add mobile-specific touch controls yet. Prototype on keyboard/mouse, add touch in Stage 5 when wrapping with Capacitor.
- Don't add leaderboards or any networked features.
- Don't try to balance Danger 5. Balance Danger 1-2 well; the rest comes after.
- Don't write tooling for designing items in a UI. Write items as code data. Tools come later if needed.
- Don't migrate to PixiJS or Phaser mid-prototype. Stay vanilla until Stage 5.

## What to do every session

1. Start the session by reading the design doc to anchor vision.
2. Pick one specific scope item from the current stage.
3. Implement it.
4. Playtest for 5-10 minutes.
5. Commit to git with a clear message.
6. Note any design observations in a `notes.md` file.

## Timeline (honest)

- Stage 2: 2-4 weeks of part-time work
- Stage 3: 2-3 weeks
- Stage 4: 2-3 weeks
- Total prototype: 8-12 weeks of consistent effort

Then production build (migrate to PixiJS or Phaser, add art, audio, polish, mobile wrapping): 12-18 months for v1 launch.

## The one rule

If a stage doesn't deliver fun, stop and redesign before continuing. The prototype's job is to expose problems while they're cheap to fix. If Stage 2 doesn't make you want to play again with a different build, no amount of weapons in Stage 5 will save it. Trust the prototype.
