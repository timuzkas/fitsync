# Training Algorithm Spec — Compliance Report

**Last updated:** 2026-04-26 (v2 — revised against Correction Guide)  
**Codebase root:** `fitsync/`  
**Key files audited:**
- `packages/shared/training.ts`
- `packages/shared/planner.ts`
- `apps/mobile/src/lib/dailyPlanner.ts`
- `apps/backend/src/lib/load.ts`
- `apps/backend/src/app/api/load/today/route.ts`

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ COMPLIANT | Implemented per spec |
| ⚠️ PARTIAL | Present but deviates from spec details |
| ❌ MISSING | Not implemented |

---

## ── NEW GAPS (from Correction Guide v2) ──

The following items are additions in the updated spec that were not covered in the first compliance pass.

---

### N1 · Goal VDOT + VDOT Gap Concept

**Spec:** Planning must distinguish between `currentVdot` and `goalVdot`. The gap between them classifies the goal:
- gap ≤ 3 → `short_term_goal`
- gap ≤ 8 → `medium_term_goal`
- gap ≤ 15 → `long_term_goal`
- gap > 15 → `multi_cycle_goal` (system must stage sub-targets, not build one aggressive plan)

**Status: ❌ MISSING**

**Code:** `Athlete` interface (`dailyPlanner.ts:17`) has `vdot?: number` (single value). There is no `goalVdot`, no gap calculation, no goal classification, and no multi-cycle staging logic anywhere in the codebase.

**Impact:** An athlete with VDOT 28 targeting sub-50 10K (gap ≈ 18) gets a single direct plan to the goal — exactly what the spec warns against.

**Fix:** Add `goalVdot: number` to `AthleteState`. Implement `classifyGoal(currentVdot, goalVdot)` before plan generation. If result is `multi_cycle_goal`, split into intermediate VDOT milestones and generate a plan only to the next milestone.

---

### N2 · VDOT Ramp Limiter

**Spec:** When a new VDOT is calculated from a qualifying run, it must be capped at `currentVdot + 1.5` per planning cycle to avoid over-aggressive plan rebuilds.

```
effectiveVdot = min(newlyCalculatedVdot, currentVdot + 1.5)
```

**Status: ❌ MISSING**

**Code:** `training.ts:85` — `qualifiesForVdotUpdate` checks the trigger conditions correctly. But when the update fires (via the API or store), there is no cap on the VDOT delta. The new VDOT is stored directly (`setAthleteProfile`) and the plan rebuilds to the full new value immediately.

**Fix:** When saving a VDOT update, apply `min(newVdot, storedVdot + 1.5)` before persisting to the athlete profile.

---

### N3 · AthleteState — Missing Runtime Fields

**Spec:** The planner must receive a complete `AthleteState` including:
- `currentWeeklyKm` (last completed week's actual km)
- `previousWeeklyKm` (the week before that)
- `availableMinutesPerWeek` (total time budget)
- `acuteLoad`, `chronicLoad`, `acwr` (live load metrics)
- `readinessScore`, `legMuscularRisk`, `totalBodyFatigue` (live readiness)

**Status: ❌ MISSING**

**Code:** `generateSmartPlan` in `dailyPlanner.ts:82` receives `athlete` (has `vdot`, `maxHR`, `weight`) and `config` (has `weeklyTargetKm`, `freeDays`). None of the live runtime metrics above are passed to the planner. The weekly target is a static config value, not a computed state.

**Fix:** Replace `PlanConfig.weeklyTargetKm` with a computed `AthleteState` snapshot that includes all the above fields. Pass this into `calculateNextWeeklyKm` each week.

---

### N4 · `calculateNextWeeklyKm` — Core Planning Function Missing

**Spec:** Weekly km must be a computed output:
```
progressionKm  = previousWeeklyKm × progressionLimit(phase)
                 phase 1 → 1.10, phase 2 → 1.08, phase 3 → 1.05, phase 4 → 1.00
timeBudgetKm   = availableMinutesPerWeek / averageEasyPaceMinPerKm
daysCapacityKm = previousWeeklyKm × daysMultiplier(trainingDaysPerWeek)
                 2 days → 1.00, 3 → 1.05, 4 → 1.10, 5 → 1.15

rawTarget      = min(progressionKm, timeBudgetKm, daysCapacityKm)

readinessMult  = 1.00 (≥85) | 0.95 (≥70) | 0.85 (≥55) | 0.70 (≥40) | 0.50 (<40)
acwrMult       = 1.00 (≤1.3) | 0.90 (≤1.5) | 0.75 (>1.5)

nextWeeklyKm   = rawTarget × readinessMult × acwrMult
```

**Status: ❌ MISSING (expands §9 from v1 report)**

**Code:** `dailyPlanner.ts:138` passes `config.weeklyTargetKm` unchanged into `planWeek` every single week. None of the above multipliers or constraints exist. The v1 report flagged the architectural inversion; this spec now provides the full replacement formula.

**Key new items not in v1 report:**
- Phase-specific progression limits (1.10 → 1.08 → 1.05 → 1.00)
- Days-count capacity multiplier
- Readiness band multipliers (5 tiers: 1.00 down to 0.50)
- ACWR multipliers (3 tiers: 1.00 / 0.90 / 0.75)
- All three limits combined as `min(progression, timeBudget, daysCapacity)` before applying multipliers

**Fix:** Implement `calculateNextWeeklyKm` as a standalone function. Call it at the top of each weekly loop in `generateSmartPlan`, replacing the static `config.weeklyTargetKm` pass-through.

---

### N5 · Layered ACWR Correction — Quality Downgrade Tiers Missing

**Spec:** When projected ACWR > 1.5, apply corrections in this priority order:
1. Trim Easy volume to bring ACWR to 1.3
2. Trim long run by 20%
3. Downgrade I sessions → T
4. Downgrade T sessions → E
5. Emit warning if still unsafe

**Status: ⚠️ PARTIAL (was not captured in v1 report)**

**Code:** `planner.ts:253` — ACWR trim fires when `totalLoad / chronicLoad > 1.5`. `trimWeekVolume` (`planner.ts:289`) trims Easy and Long runs only. Steps 3 and 4 (quality downgrade tiers) are absent.

`dailyPlanner.ts:281` does downgrade Quality → Easy but only for LMR > 68, not for ACWR overflow.

**Fix:** After `trimWeekVolume`, check ACWR again. If still > 1.5, downgrade I → T, then T → E, then emit a `planLimitationFlag`.

---

### N6 · Pre-Placement Fatigue Gate — Architectural Gap

**Spec:** Before placing any quality session during plan generation, check:
```
canPlaceQuality = (max(legMuscularRisk, totalBodyFatigue × 0.7) ≤ 68) AND (readinessScore ≥ 55)
```
If false: replace with Easy, or move to next available day, or mark week as recovery.

**Status: ❌ MISSING (post-hoc only)**

**Code:** `dailyPlanner.ts:247` (`adaptPlanAfterNewWorkout`) applies the LMR > 68 downgrade — but only as a post-processing step after the plan is generated, and only for today's session. The downgrade does not happen inside `planWeek` during initial placement.

Additionally, the code only checks `finalLegRiskLevel > 68` (LMR condition). The spec adds a **second gate: `readinessScore >= 55`**. Both must pass to allow quality placement.

**Fix:** Pass `legMuscularRisk`, `totalBodyFatigue`, and `readinessScore` into `planWeek`. In `findQualityDay`, call `canPlaceQuality` before returning a valid day index. If the check fails, skip quality placement entirely and fall through to Easy.

---

## ── CARRIED FORWARD FROM v1 REPORT ──

Items below were identified in the first pass. Status unchanged.

---

## §1 · VDOT Calculation

**Spec:** Use Jack Daniels' published VDOT lookup tables.

**Status: ⚠️ PARTIAL**

`training.ts:15` uses the continuous Daniels formula rather than a lookup table. Numerically close but diverges at extremes (VDOT < 30 or > 85).

**Fix:** Add the 30-point Daniels table with linear interpolation. Keep formula as out-of-range fallback.

---

## §2 · Training Zones & Paces

**Status: ✅ COMPLIANT**

`training.ts:43` — `VDOT_COEFFS` match Daniels fractions. `getZonePace` via binary search at line 124 is correct.

---

## §3 · Session Load (Foster Session-RPE)

**Status: ✅ COMPLIANT**

`training.ts:137` — `calculateSessionLoad = rpe * durationMin`. Applied throughout.

---

## §4 · ACWR Calculation

**Status: ⚠️ PARTIAL**

Chronic load in `dailyPlanner.ts:228` uses EWA `(prev * 3 + current) / 4` instead of true 4-week rolling average. `calculateACWR` in `training.ts` is unused in the backend route.

---

## §5 · Quality Session Duration Rules

**Status: ❌ MISSING**

T/I minute-range constraints (T=20–40 min, I=12–20 min) absent. Code uses distance-percentage caps only. No rep/rest structure generated.

---

## §6 · Long Run Sizing

**Status: ✅ COMPLIANT**

`planner.ts:217` — 25–30% of weekly km. Minor gap: marathon-specific cap (`longRun ≤ raceKm × 0.80`) not enforced numerically.

---

## §7 · Easy Volume % + Progression

**Status: ⚠️ PARTIAL**

No 10% weekly ramp cap. No 4th-week –20% deload. No enforcement of 75% Easy-volume rule by zone.

---

## §8 · Time Budget Constraint

**Status: ❌ MISSING**

`availableMinutesPerWeek` not in `PlanConfig`. Now formalized in N4 as part of `calculateNextWeeklyKm`.

---

## §9 · Weekly Mileage Architecture

**Status: ❌ ARCHITECTURAL INVERSION**

`weeklyTargetKm` is a static input. Must become the output of `calculateNextWeeklyKm`. Full formula now specified — see N4.

---

## §10 · Adaptive Points Level Logic

**Status: ⚠️ PARTIAL — dead code**

`evaluateAdaptiveLevel` in `planner.ts:33` is correct but never called from `generateSmartPlan`.

---

## §11 · Session Output Object

**Status: ⚠️ PARTIAL**

`DayPlan` missing `reps` and `restSec` fields for interval sessions.

---

## §12 · Phase Allocation & B/C Race Logic

**Status: ✅ COMPLIANT**

`planSeason` compression tiers correct. B/C race week adjustments implemented in `dailyPlanner.ts:159`.

---

## §13 · Athlete Readiness Score

**Status: ✅ COMPLIANT**

`calculateReadinessV2` in `load.ts:172` matches formula exactly. Note: duplicate `calcReadiness` at `load.ts:255` uses a different formula — should be removed or consolidated.

---

## §14 · Hevy MSL Formula

**Status: ⚠️ PARTIAL**

`calculateStrengthLoad` uses a volumetric model. Missing `rpeFactor` per set. `LEG_COEFFICIENTS` table exists but not wired into the function.

---

## §15 · LMR & TBF Decay + Auto-Downgrade

**Status: ✅ COMPLIANT**

`calculateMuscularRisks` in `load.ts:205` — decay rates, normalization, and auto-downgrade threshold all correct.

---

## Full Summary Table

| # | Feature | v1 Status | v2 Status | Change |
|---|---------|-----------|-----------|--------|
| N1 | Goal VDOT + gap classification | — | ❌ MISSING | **NEW** |
| N2 | VDOT ramp limiter (+1.5/cycle) | — | ❌ MISSING | **NEW** |
| N3 | AthleteState runtime fields | — | ❌ MISSING | **NEW** |
| N4 | `calculateNextWeeklyKm` formula | ❌ (§9 inversion) | ❌ MISSING | **EXPANDED** |
| N5 | Layered ACWR correction (5 tiers) | not captured | ⚠️ PARTIAL | **NEW** |
| N6 | Pre-placement fatigue gate | not captured | ❌ MISSING | **NEW** |
| §1 | VDOT table vs formula | ⚠️ | ⚠️ | unchanged |
| §2 | Training zone paces | ✅ | ✅ | unchanged |
| §3 | Foster session load | ✅ | ✅ | unchanged |
| §4 | ACWR chronic load method | ⚠️ | ⚠️ | unchanged |
| §5 | Quality duration minute ranges | ❌ | ❌ | unchanged |
| §6 | Long run sizing | ✅ | ✅ | unchanged |
| §7 | Easy volume % + progression | ⚠️ | ⚠️ | unchanged |
| §8 | Time budget constraint | ❌ | ❌ | subsumed by N4 |
| §9 | Weekly km architecture | ❌ | ❌ | subsumed by N4 |
| §10 | Adaptive logic (dead code) | ⚠️ | ⚠️ | unchanged |
| §11 | Session output completeness | ⚠️ | ⚠️ | unchanged |
| §12 | Phase allocation & B/C races | ✅ | ✅ | unchanged |
| §13 | Readiness score formula | ✅ | ✅ | unchanged |
| §14 | Hevy MSL rpeFactor | ⚠️ | ⚠️ | unchanged |
| §15 | LMR/TBF decay + downgrade | ✅ | ✅ | unchanged |

---

## Revised Priority Fix Order

Priority is ordered by: safety risk × scope of change required.

| P | Fix | Files |
|---|-----|-------|
| 1 | **N4 — `calculateNextWeeklyKm`**: replace static `weeklyTargetKm` with computed adaptive output | `dailyPlanner.ts`, `planner.ts` |
| 2 | **N3 — AthleteState runtime fields**: add `previousWeeklyKm`, `availableMinutesPerWeek`, live load/readiness to planner input | `dailyPlanner.ts`, store |
| 3 | **N6 — Pre-placement fatigue gate**: move LMR + readiness check into `planWeek` before quality placement | `planner.ts`, `dailyPlanner.ts` |
| 4 | **§5 — Quality duration minute ranges**: clamp T/I to spec minute bounds; generate rep/rest structure for I sessions | `planner.ts` |
| 5 | **§7 — Progression + deload**: 10% ramp cap and 4th-week –20% deload | `dailyPlanner.ts` |
| 6 | **N5 — Layered ACWR correction**: add I→T→E downgrade tiers after Easy/Long trimming | `planner.ts` |
| 7 | **N1 — Goal classification + multi-cycle staging**: add `goalVdot` and `classifyGoal` gate | `dailyPlanner.ts`, athlete store |
| 8 | **N2 — VDOT ramp limiter**: cap VDOT update to +1.5 per cycle | VDOT update handler |
| 9 | **§10 — Wire adaptive logic**: call `evaluateAdaptiveLevel` in weekly loop | `dailyPlanner.ts` |
| 10 | **§4 — True 4-week rolling ACWR**: replace EWA with rolling average | `dailyPlanner.ts` |
| 11 | **§1 — VDOT lookup table**: add Daniels table with linear interpolation | `training.ts` |
| 12 | **§14 — Hevy MSL rpeFactor**: add per-set RPE and wire coefficient table | `load.ts` |
