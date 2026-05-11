# Raid or Die: Stage 2 Chat Handoff v2

The previous chat got long. Starting fresh here. The design doc, build plan, and project instructions are in the project files (latest versions). This handoff covers current in-flight state plus decisions made since handoff v1.

## Current status

In Stage 2 of the build plan. Through Step 8 in flight.

- Step 1 (module refactor into ES6 files): COMPLETE
- Step 2 (weapon architecture + Throwing Knife): COMPLETE
- Step 3 (enemy AI + Saxon Archer ranged behavior): COMPLETE
- Step 3.5 (balance + boar heart healing + reroll + Berserker isolation): COMPLETE
- Step 3.6 (wallet UI + economy rebalance): COMPLETE
- Step 4 (Warhammer + Longbow + FIRE_PATTERNS architecture): COMPLETE
- Step 4.5 (unified hit feedback system + bow fire feedback): COMPLETE
- Step 5 (Rune of Frost + Mjolnir + boomerang pattern + Frost status system): COMPLETE
- Step 6 (item system refactor: EFFECT_HANDLERS + events + stacks + applyPlayerDamage): COMPLETE
- Step 7 (8 archetype items + weapon tags + scoped boosts + armor mechanic + rarity-weighted shop): COMPLETE
- Step 8 (rarity colors on cards + Berserker stack HUD + armor HUD verification): PROMPT SENT, awaiting concerns bundle
- Step 9 (full Stage 2 tuning playtest, the gate to Stage 3): PENDING

## What Step 8 covers (in flight)

Two scoped visibility additions plus one verification before the Stage 2 gate:

1. Rarity colors on shop cards (border/accent treatment by rarity: white/gray common, green uncommon, blue rare, gold legendary placeholder)
2. Berserker stack HUD display under HP/rage bars (visible count "BERSERKER xN" plus decay bar, fades in/out, generic enough to handle future stacks via lookup map)
3. Verify Step 7's armor HUD row actually shipped and renders correctly when player has armor > 0

Workflow: standard pattern. Concerns bundle from Claude Code first. Then approval, file-by-file writes, localhost verification.

## Architecture systems shipped in Stage 2

- BEHAVIORS dispatch in enemies.js (chase, ranged)
- FIRE_PATTERNS dispatch in weapons.js (projectile, arc, boomerang)
- EFFECT_HANDLERS dispatch in items.js (9 effect types: stat_boost, on_kill, on_hit, on_take_damage, on_low_hp, on_tick, gain_stack, per_stack_modifier, apply_status, plus instant_heal for purchase-time effects)
- Event emitter in events.js (registry-of-arrays pattern, zero-allocation emit, five events plumbed)
- Player stack system (player.stacks keyed by name, decay modes: permanent / timer / reset_on)
- Per-stack modifier system (delta-on-change recompute on gain/decay/reset, not per-frame)
- Centralized applyDamage (enemy damage hook, fires onHit; from Step 4.5)
- Centralized applyPlayerDamage (player damage hook, fires onTakeDamage, applies armor reduction; from Step 6)
- Weapon tag system (weapon.tags array)
- Scoped stat boosts (player.weaponTagBoosts overlay, getEffectiveDamageBonus + getEffectiveFireRateMult helpers)
- Frost status on enemies (Step 5: timer + slow multiplier, visible blue tint)
- Frost bonuses on player (frostDurationBonus, frostStrengthBonus from Step 7)
- computeStatusParams helper (applies player bonuses uniformly to all frost sources)
- Armor mechanic (player.armor, flat-subtract with floor of 1, prevents invincibility builds)
- Hit feedback system (impact particles in weapon brand color, enemy hit flash, damage number popups)
- Bow fire feedback (bowstring flash at player on fire, arrow motion trail)
- Rarity-weighted shop selection with replacement (50/30/15/5 weights, duplicates allowed)
- Reroll system (5→10→20→40 cost scaling, resets per shop)
- Wallet UI (visible balance, grayed unaffordable cards)
- Boar heart drops (4% drop chance from non-boss kills, heals 15 HP, green flash feedback)

## Items in pool (14 total in Stage 2)

**Existing 6 (from Step 1, prices set in 3.6):**

| Name | Cost | Rarity | Effect |
|---|---|---|---|
| Boar Heart | 75 | common | +20 maxHp + heal to full on purchase |
| Whetstone | 75 | common | +4 damageBonus |
| Wolf Sinew | 90 | common | fireRateMult ×0.83 (20% faster) |
| Swift Boots | 60 | common | +30 move speed |
| Mead of Mimir | 55 | common | Heal 60 HP on purchase |
| Raven Charm | 65 | common | +8 damageBonus, -10 maxHp |

**Step 7 archetype 8:**

| Name | Cost | Rarity | Archetype | Effect |
|---|---|---|---|---|
| Battle Frenzy | 140 | rare | Berserker | Gain stack on kill (max 5, 4s decay), +2 dmg per stack |
| Bloodlust | 65 | common | Berserker | Heal 1 HP on kill |
| Whetstone Belt | 100 | uncommon | Thrown | +5 damage to thrown weapons only |
| Eager Hand | 100 | uncommon | Thrown | Thrown weapons fire 20% faster (mult 0.83) |
| Frostbite | 95 | uncommon | Frost | +1.5s Frost slow duration |
| Glacier's Edge | 150 | rare | Frost | All weapons apply Frost on hit |
| Iron Skin | 70 | common | Shield Wall | +5 armor |
| Tortoise Shell | 145 | rare | Shield Wall | 25% chance to heal 50% of damage taken |

## Weapons in pool (6 total)

| Name | Slot | Tags | Damage | Fire Rate | Notes |
|---|---|---|---|---|---|
| Throwing Axe | starter | thrown | baseline | baseline | Brotato-baseline spray |
| Throwing Knife | shop | thrown | low/multi | fast | Multi-shot spread |
| Warhammer | shop, 120 silver | melee | 25 | 1.2s | Instant 360° arc, 80px radius, swarm answer |
| Longbow | shop, 130 silver | ranged | 40 | 1.4s | Fast non-piercing projectile, precision answer |
| Rune of Frost | shop, 150 silver | magic, ranged | 60 | 2.0s | Slow magic projectile, applies Frost |
| Mjolnir | shop, 170 silver | thrown | 22 per leg | 1.8s | Boomerang, hits on outbound + return |

## Locked decisions in this chat (carry forward)

1. **Bow is non-piercing.** Spear retains pierce identity for future weapons. Bow is single-target executioner, precision over crowd control.

2. **Frost is Rune's mechanical identity.** Slow + Frost status anchors the Frost archetype that Step 7 items lean on. Single-status refresh in Stage 2; stacking depth deferred unless items demand it.

3. **Mjolnir is the boomerang execution pattern.** Returns to player's current position regardless of player movement. Third execution pattern in FIRE_PATTERNS.

4. **Hit feedback is a unified system, not per-weapon.** All player hits get particles in weapon brand color, enemy hit flash, and damage numbers. Bow has additional fire feedback (bowstring flash, arrow trail) because its projectile alone didn't read.

5. **Stage 2 tests 4 archetypes, not 8.** Berserker, Thrown, Frost, Shield Wall. Confirmed deferrals: Lightning Chain (needs chain damage system, production scope), Trickster (needs crit system, production scope), Skald Magic (mechanically undefined, needs design), Raven Storm (mechanically undefined). All 8 archetypes remain v1 final scope.

6. **applyPlayerDamage centralized.** Mirrors applyDamage from Step 4.5. Single firing point for onTakeDamage event. Armor reduction lives here.

7. **Armor is flat-subtract with floor of 1.** Prevents invincibility builds. Tunable later.

8. **on_low_hp is one-shot on crossing with hysteresis** (30% enter, 40% leave). Continuous "while low HP" effects model via stacks the handler maintains.

9. **Shared timer per stack type, not per-individual-stack.** Brotato/Vampire Survivors model. Each new stack resets the decay clock.

10. **per_stack_modifier uses delta-on-change recompute**, not per-frame. Player stats stay live without churn.

11. **Shop selection is rarity-weighted with replacement.** Same item can appear twice in one shop visit. Weights: common 50, uncommon 30, rare 15, legendary 5.

12. **HUD visibility for dynamic stats.** Player must see their build working. Armor row added in Step 7. Berserker stack counter added in Step 8. Pattern: any tactically relevant dynamic stat needs visible feedback.

13. **instant_heal as a dedicated effect type.** Separate from stat_boost. Used by Mead of Mimir, Boar Heart's heal-to-full leg.

14. **Multi-effect items: stat_boost ordered before instant_heal.** So maxHp increases apply before heals target the new max.

## Working setup

- Local folder, ES6 modules: config, utils, player, enemies, weapons, items, waves, particles, pickups, ui, render, events (new in Step 6)
- Running locally: `python3 -m http.server 8080` from Prototype/
- Claude Code as pair-programming partner in terminal
- Git commits at each step completion with clear messages

## Workflow pattern that works

1. Send step prompt to Claude Code with explicit "raise concerns bundle BEFORE writing" instruction
2. CC reports concerns and recommendations as a bundle in chat
3. Review the bundle, approve or push back
4. CC writes file by file with notes on what each one changes
5. CC walks through verification checklist on localhost
6. Commit on success, return to plan next step

## Step 9 framing (next after Step 8 lands)

Step 9 is the Stage 2 gate. Different shape than the other steps: not a code prompt to Claude Code, but a structured playtest by Micah.

The hypothesis being validated: **build variety creates replayability**.

Rough test shape (to be detailed in next chat):
- Complete 2-3 consecutive runs with deliberately different builds (Berserker, Thrown, Frost, Shield Wall focus per run)
- Track which builds felt distinct, which felt dominant, which felt like traps
- Track whether the shop economy creates real choice or converges to optimal patterns
- Track whether Bow/Rune/Mjolnir feel like meaningfully different weapon shapes
- Track whether the Step 8 stack counter usefully communicates Berserker state

Pass criteria: two consecutive runs feel meaningfully different AND the urge to play again is real.

Pass → Stage 3 (Thor as second class).
Fail → debug item or weapon balance before adding classes.

A structured Step 9 playtest framework gets written when Step 8 lands.

## What to do first in the new chat

1. Tell me the status of Step 8 (whether Claude Code completed it, what was committed, whether rarity colors and Berserker stack HUD are working).
2. If 8 is committed and tested: I'll draft the Step 9 playtest framework.
3. If 8 has issues: troubleshoot.

## Stage 2 remaining

- Step 8 in flight
- Step 9 pending (playtest gate)

## After Stage 2

- Stage 3: Thor as second class. Thunder Form god-power, armor-scaling passive, shield + hammer starter loadout. Shield Wall items from Stage 2 become Thor-coded synergies without rework.
- Stage 4: basic Valhalla meta-progression. Norns (stat upgrade tracks) + Forge (weapon unlocks) only. Glory currency, run launcher. Throne and Bifrost defer.
- Stage 5: production migration. PixiJS or Phaser decision. Real art via Aseprite + AI generation (Nano Banana primary). Audio via Howler.js + ElevenLabs SFX + Suno/Udio music. Capacitor for mobile, Electron for Steam.

Realistically 12-18 months from Stage 2 completion to v1 launch.

## Recent design decisions worth surfacing for new chat

**Art direction confirmed via Nano Banana reference generation.** Style hit is on target: Octopath/Sea of Stars/Eastward sprite density with painterly polish, red cape as the only saturated color matching the mobile readability rule. Tension flagged on character age: the "wise old Odin" look conflicts with the Berserker archetype's "young scarred warrior" feel. Iteration toward younger einherjar recommended for the Odin class reference. Save the elder version for potential Throne meta-scene art in Stage 4.

**The conversation pattern that works.** When facing a content/scope decision (e.g., "build all 8 archetypes"), default to no, name the system cost, recommend the tightest version that tests the hypothesis. The four-archetype Stage 2 scope held because of this pattern.
