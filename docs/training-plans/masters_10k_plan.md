# Masters 10K Training Plan

## Overview

- **Distance:** 10K
- **Category:** Masters (age-based, for 40+ runners)
- **Duration:** 16 weeks
- **Weekly Volume:** Ranges from approximately 4 runs / 22.4 km (Week 1) to 5 runs / 48 km (peak weeks)
- **Description:** A 10K plan specifically structured for Masters runners (age 40+). Lower running volume than the standard 10K plans, with regular X-Train days and less frequent high-impact workouts. Maintains the same race-specific stimuli (threshold, specific-endurance intervals, hill work) but spaced for greater recovery.

## Plan Family

Masters plans are an alternative to the standard race-distance plans, designed around the recovery needs and adaptation patterns of runners 40 and older. There are two Masters plans:

| Race | Plan | Duration | This file |
|---|---|---|---|
| 10K | `masters_10k_plan.md` | 16 weeks | ← |
| Marathon | `masters_marathon_plan.md` | 20 weeks | |

Unlike the regular race-distance plans (which come in 3 levels per distance for 5 runner profiles), Masters plans are **age-based, not competitiveness-based** — they apply to any 40+ runner regardless of competitive level.

> **Note on Masters 10K duration:** This plan is **16 weeks**, not the 14-week duration used by the standard 10K plans. The extra two weeks accommodate the more gradual buildup recommended for Masters runners.

### Quick lookup (for code)

```json
{
  "masters_plans": {
    "10K":      "masters_10k_plan.md",
    "Marathon": "masters_marathon_plan.md"
  },
  "masters_runner_profile_note": "The 'masters' runner_profile is age-based (40+), not competitiveness-based. It is independent of the 5 standard profiles (beginner, low_key, competitive, highly_competitive, elite)."
}
```

## Workout Type Glossary

| Code | Description |
|---|---|
| `long_run` | Long, easy-paced run |
| `easy_run` | Easy-paced run |
| `progression_run` | Easy run that finishes with a moderate, hard, or marathon-pace segment. Has 7 sub-formats. |
| `xtrain` | Specific cross-training session prescribed (e.g. "X-Train 30 min"). Masters plans use these regularly on Saturdays as recovery-supportive aerobic work. |
| `xtrain_or_rest` | Cross-training **or** rest — runner's choice |
| `rest` | Full rest day |
| `fartlek` | Easy run with embedded faster surges. Has 4 sub-formats. |
| `hill_repetitions` | Uphill repetitions at hard effort. **In Masters plans the source uses two terms** that both map to this type: `hill_repetitions` proper (time-based with jog-back recoveries) and "Anaerobic Hill Intervals" (fixed-distance reps at 3K effort with timed active recoveries). The source's "Anaerobic Hill Intervals" naming is preserved in the description string. |
| `threshold_run` | Run with a sustained segment at a threshold pace (T1, T2, or T3). Has 4 sub-formats. |
| `specific_endurance_intervals` | Repetition intervals at goal race pace (10K) |
| `ladder_intervals` | Intervals of varying distance/duration run consecutively. **Source calls these "Ladder Workout"** — same concept, different name; the description string preserves the source's terminology. |
| `speed_intervals` | Short, fast repetition intervals targeting neuromuscular speed (e.g. `6 × 400m @ 3K pace`) |
| `hard_long_run` | Long run at half-marathon pace or sustained hard effort. Used in late sharpening as race-specific endurance. |
| `goal_race` | The target race the plan is built around |

> **Note on Core Strength:** The source plans include "Core Strength" notation on most days (1, 2, or 3 sets depending on week). These are **omitted from this schema** — only the running portions are captured. The source recommends pairing the running workouts with regular core/strength work; the set count progresses across the cycle (1 set in Weeks 1–4, 2 sets in Weeks 5–9, 3 sets in Weeks 10–14, tapering back at the end).

## Threshold Pace Reference

| Pace ID | Sustainable for... | Elite proxy | Sub-elite proxy |
|---|---|---|---|
| **T1** | ~2.5 hours | A bit slower than marathon pace | Marathon pace or slightly faster |
| **T2** | ~90 minutes | A bit faster than marathon pace | Half-marathon pace |
| **T3** | ~60 minutes | Half-marathon pace or a bit faster | A bit slower than 10K pace |

In this Masters 10K plan:

| Source description | Threshold tier |
|---|---|
| "half-marathon pace" | **T2** |
| "10K pace" | **T3** |
| "current 10K pace" | **T3** (early-cycle reference) |
| "goal 10K pace" | **T3** (late-cycle race-specific) |

```json
{
  "threshold_paces": {
    "T1": { "sustainable_minutes": 150, "elite_proxy": "slightly slower than marathon pace", "sub_elite_proxy": "marathon pace or slightly faster" },
    "T2": { "sustainable_minutes": 90,  "elite_proxy": "slightly faster than marathon pace", "sub_elite_proxy": "half-marathon pace" },
    "T3": { "sustainable_minutes": 60,  "elite_proxy": "half-marathon pace or slightly faster", "sub_elite_proxy": "slightly slower than 10K pace" }
  },
  "source_pace_to_threshold_tier": {
    "half-marathon pace": "T2",
    "10K pace":           "T3",
    "current 10K pace":   "T3",
    "goal 10K pace":      "T3"
  }
}
```

## Diagnostic Checkpoints

This plan does not include explicit diagnostic checkpoints (no `tune_up_race`, `time_trial`, or `aerobic_test` workouts). Fitness is gauged through:
- The progression of "current 10K pace" → "goal 10K pace" in specific-endurance interval workouts (Week 6 uses "current", Weeks 10–16 use "goal")
- Improvements in threshold-run pacing across the cycle
- The Hard Long Run progression in Weeks 13–16

## Training Phases

In this Masters 10K plan: **Weeks 1–5 = `fundamental`, Weeks 6–15 = `sharpening`, Week 16 = `taper`**. The sharpening phase begins at Week 6 with the first specific-endurance intervals workout.

---

## Fartlek Format Reference

| Format | Example | Best Use |
|---|---|---|
| `speed_fartlek` | `8 km easy w/ 6 × 30 sec @ 10K-3K pace` | Introductory & early fundamental |
| `race_pace_fartlek` | `8 × 3 min @ 10K pace w/ 2-min recoveries` | Late fundamental & sharpening |
| `single_block_fartlek` | `6.4 km w/ 1.6 km @ 5K pace / 1 min easy` | One sustained surge in an easy run |
| `mixed_pace_fartlek` | `6 min @ 10K pace + 4 min easy + 4 × 1 min @ 5K pace` | Sharpening |

This plan uses only `speed_fartlek` (Weeks 1–4 Thursdays).

---

## Progression Run Format Reference

| Format | Example | Best Use |
|---|---|---|
| `moderate` | `11.2 km, last 3.2 km moderate` | Throughout cycle |
| `moderate_uphill` | `9.6 km easy, last mile moderate (uphill if possible)` | Aerobic + strength build |
| `hard` | `11.2 km, last mile hard` | Late fundamental; coaxes aerobic support toward peak |
| `hard_uphill` | `6.4 km easy + 3.2 km hard (uphill if possible)` | Fundamental |
| `long_run_progression` | Multi-segment moderate-progression long runs | Throughout cycle |
| `fartlek_progression` | (not used in this plan) | Late fundamental |
| `marathon_pace_progression` | (not used in this plan) | Race-pace stimulus |

```json
{
  "progression_run_formats": {
    "moderate":                  { "example": "11.2 km, last 3.2 km moderate", "best_use": "Introductory; later, adds extra hard work to schedule" },
    "moderate_uphill":           { "example": "9.6 km easy, last mile moderate (uphill if possible)", "best_use": "Introductory; aerobic + strength simultaneously" },
    "hard":                      { "example": "11.2 km, last mile hard", "best_use": "Late fundamental; coax aerobic support toward peak" },
    "hard_uphill":               { "example": "6.4 km easy + 3.2 km hard (uphill if possible)", "best_use": "Fundamental; aerobic + strength after foundation built" },
    "long_run_progression":      { "example": "12.8 km, last 4.8 km progressing moderate to hard", "best_use": "Throughout cycle; transform race endurance into race-specific endurance" },
    "fartlek_progression":       { "example": "3.2 km easy + 6.4 km intervals + 3.2 km hard", "best_use": "Late fundamental; integrate two types of specific-endurance training" },
    "marathon_pace_progression": { "example": "11.2 km easy + 20 min @ marathon pace", "best_use": "Race-pace training stimulus inside a longer run (HM/marathon plans)" }
  }
}
```

---

## Threshold Run Format Reference

| Format | Example | Best Use |
|---|---|---|
| `one_interval` | `1.6 km easy + 3.2 km @ HM pace + 1.6 km easy` | Shorter early, longer late |
| `two_intervals` | `1.6 km easy + 3.2 km @ HM pace + 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy` | More total threshold time with recovery |
| `three_intervals` | (not used in this plan) | All three threshold tiers in one workout |
| `multi_interval` | `1.6 km easy + 1.6 km @ HM pace + 1.6 km @ 10K pace + 1.6 km @ HM pace + 1.6 km @ 10K pace + 1.6 km easy` | More than three blocks; alternating-tier patterns common in Masters plans |

The Masters 10K plan uses an **alternating-tier `multi_interval`** pattern in Weeks 7–9 (`HM/10K/HM/10K`) — four threshold blocks at two alternating paces, which is structurally distinct from a typical multi-interval (same pace) but fits the format better than two_intervals.

```json
{
  "threshold_run_formats": {
    "one_interval":    { "example": "1.6 km easy + 3.2 km @ HM pace + 1.6 km easy", "best_use": "Build aerobic support (shorter early, longer late)" },
    "two_intervals":   { "example": "1.6 km easy + 3.2 km @ HM pace + 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy", "best_use": "More total threshold time with mid-workout recovery" },
    "three_intervals": { "example": "1.6 km easy + 10 min @ marathon pace + 1 min easy + 10 min @ HM pace + 1 min easy + 10 min @ 10K pace + 1.6 km easy", "best_use": "Hit all three threshold tiers (T1, T2, T3) in one workout" },
    "multi_interval":  { "example": "1.6 km easy + 1.6 km @ HM pace + 1.6 km @ 10K pace + 1.6 km @ HM pace + 1.6 km @ 10K pace + 1.6 km easy", "best_use": "Four+ blocks; alternating-tier patterns common in Masters plans" }
  }
}
```

---

## Specific-Endurance Reference

For 10K runners, specific-endurance training happens primarily through track-style intervals at goal 10K pace.

### The ±10% Pace Range

| Phase | Pace range vs. goal pace |
|---|---|
| `fundamental` | **±10%** |
| `sharpening`  | **±3–4%** |
| `taper`       | **±3–4%** |

### How specific-endurance training progresses across the cycle

This plan transitions from "current 10K pace" (Week 6) to "goal 10K pace" (Weeks 10–16) — the explicit pace-progression marker the source uses to signal that fitness is converging toward race-day expectations.

### Peak-level specific-endurance workouts by distance and runner profile

For reference (the standard race-distance plans use these as peak workouts):

| Race | Runner profile | Peak workout |
|---|---|---|
| 10K | Low-Key Competitive (`low_key`) | 4 × 2K @ 10K pace w/ 1-min jog recoveries |
| 10K | Competitive (`competitive`) | 4 × 2K @ 10K pace + 1K @ maximum effort, w/ 1-min jog recoveries |
| 10K | Highly Competitive (`highly_competitive`) | 4 × 2K @ 10K pace + 1K @ maximum effort, w/ 1-min jog recoveries |

The Masters 10K plan reaches that target in Week 14 (`4 × 2K @ goal 10K pace w/ 2-min active recoveries`) and Week 15 (`4 × 2K @ goal 10K pace + 1K max effort`).

```json
{
  "specific_endurance": {
    "definition": "Ability to sustain goal race pace long enough to finish without slowing down",
    "pace_range_pct_offset_from_goal": {
      "fundamental": { "slower_pct": 10, "faster_pct": 10 },
      "sharpening":  { "slower_pct": 4,  "faster_pct": 4 },
      "taper":       { "slower_pct": 4,  "faster_pct": 4 }
    },
    "progression_dimensions": [
      "Pace moves from current 10K pace toward goal 10K pace (explicit source marker)",
      "Volume of race-pace work per session increases",
      "Race-pace efforts become longer",
      "Recoveries shorten or pace closes in on goal pace"
    ],
    "peak_workouts_by_profile": {
      "low_key":            "4 × 2K @ 10K pace w/ 1-min jog recoveries",
      "competitive":        "4 × 2K @ 10K pace + 1K @ maximum effort, w/ 1-min jog recoveries",
      "highly_competitive": "4 × 2K @ 10K pace + 1K @ maximum effort, w/ 1-min jog recoveries"
    },
    "primary_vehicle": "specific_endurance_intervals",
    "primary_vehicle_note": "For 10K runners, track-style intervals at goal 10K pace are the primary vehicle for specific-endurance training."
  }
}
```

---

## Interval Format Reference

| Format | Description | Example |
|---|---|---|
| `repetition` | Uniform-distance, uniform-pace intervals | `5 × 1.6 km @ 10K pace` |
| `ladder` | Varying-distance intervals run consecutively (the source's "Ladder Workout") | `2 × (6 min, 5 min, 4 min, 3 min, 2 min, 1 min @ 10K-1500m pace)` |
| `add_on` | Small set of speed intervals appended to a slower workout | (not used in this plan) |

This plan uses both `repetition` and `ladder` formats.

---

## Weekly Schedule

### Week 1

| Day | Workout |
|---|---|
| Sunday | Long Run — 8 km easy |
| Monday | Rest (Core Strength 1 set in source) |
| Tuesday | Easy Run — 6.4 km + 1 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 1 set in source) |
| Thursday | Fartlek Run — 8 km easy w/ 6 × 30 sec. intervals @ 10K–3K pace |
| Friday | Rest (Core Strength 1 set in source) |
| Saturday | X-Train — 20 min. |

### Week 2

| Day | Workout |
|---|---|
| Sunday | Progression Run — 9.6 km easy, last mile moderate (uphill, if possible) |
| Monday | Rest (Core Strength 1 set in source) |
| Tuesday | Easy Run — 8 km + 2 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 1 set in source) |
| Thursday | Fartlek Run — 9.6 km easy w/ 6 × 40 sec. intervals @ 10K–3K pace |
| Friday | Rest (Core Strength 1 set in source) |
| Saturday | X-Train — 25 min. |

### Week 3

| Day | Workout |
|---|---|
| Sunday | Progression Run — 11.2 km easy, last 2.4 km moderate (uphill, if possible) |
| Monday | Rest (Core Strength 1 set in source) |
| Tuesday | Easy Run — 8 km + 3 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 1 set in source) |
| Thursday | Fartlek Run — 11.2 km easy w/ 6 × 40 sec. intervals @ 10K–3K pace |
| Friday | Rest (Core Strength 1 set in source) |
| Saturday | X-Train — 30 min. |

### Week 4

| Day | Workout |
|---|---|
| Sunday | Progression Run — 8.8 km easy, last 2.4 km moderate (uphill, if possible) |
| Monday | Rest (Core Strength 1 set in source) |
| Tuesday | Easy Run — 6.4 km + 4 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 1 set in source) |
| Thursday | Fartlek Run — 8 km easy w/ 6 × 30 sec. intervals @ 10K–3K pace |
| Friday | Rest (Core Strength 1 set in source) |
| Saturday | X-Train — 20 min. |

### Week 5

| Day | Workout |
|---|---|
| Sunday | Progression Run — 11.2 km, last 3.2 km moderate |
| Monday | Rest (Core Strength 2 sets in source) |
| Tuesday | Anaerobic Hill Intervals — 1.6 km easy + 4 × 400m uphill @ 3K effort w/ 2-min. active recoveries + 1.6 km easy + 5 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 2 sets in source) |
| Thursday | Progression Run — 6.4 km easy + 3.2 km hard (uphill, if possible) |
| Friday | Rest (Core Strength 2 sets in source) |
| Saturday | X-Train — 30 min. |

### Week 6

| Day | Workout |
|---|---|
| Sunday | Progression Run — 12 km, last 4 km moderate |
| Monday | Rest (Core Strength 2 sets in source) |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 5 × 1.6 km @ current 10K pace w/ 2-min. active recoveries + 1.6 km easy + 6 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 2 sets in source) |
| Thursday | Ladder Workout — 1.6 km easy + 2 × (6 min, 5 min, 4 min, 3 min, 2 min, 1 min @ 10K–1,500m pace w/ 2-min. active recoveries) + 1.6 km easy |
| Friday | Rest (Core Strength 2 sets in source) |
| Saturday | X-Train — 35 min. |

### Week 7

| Day | Workout |
|---|---|
| Sunday | Progression Run — 11.2 km, last mile hard |
| Monday | Rest (Core Strength 2 sets in source) |
| Tuesday | Anaerobic Hill Intervals — 1.6 km easy + 4 × 600m uphill @ 3K effort w/ 2-min. active recoveries + 1.6 km easy + 7 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 2 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 3.2 km @ half-marathon pace + 1.6 km easy + 3.2 km @ half-marathon pace + 1.6 km easy |
| Friday | Rest (Core Strength 2 sets in source) |
| Saturday | X-Train — 40 min. |

### Week 8

| Day | Workout |
|---|---|
| Sunday | Progression Run — 8 km, last 3.2 km moderate |
| Monday | Rest (Core Strength 2 sets in source) |
| Tuesday | Speed Intervals — 1.6 km easy + 6 × 400m @ 3K pace w/ 2-min. active recoveries + 1.6 km easy + 8 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 2 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 1.6 km @ half-marathon pace + 1.6 km easy + 1.6 km @ 10K pace + 1.6 km easy |
| Friday | Rest (Core Strength 2 sets in source) |
| Saturday | X-Train — 30 min. |

### Week 9

| Day | Workout |
|---|---|
| Sunday | Progression Run — 11.2 km, last 3.2 km hard |
| Monday | Rest (Core Strength 2 sets in source) |
| Tuesday | Ladder Workout — 1.6 km easy + 2 × (6 min, 5 min, 4 min, 3 min, 2 min, 1 min @ 10K–1,500m pace w/ 2-min. active recoveries) + 1.6 km easy + 9 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 2 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 4 km @ half-marathon pace + 1.6 km easy + 4 km @ half-marathon pace + 1.6 km easy |
| Friday | Rest (Core Strength 2 sets in source) |
| Saturday | X-Train — 40 min. |

### Week 10

| Day | Workout |
|---|---|
| Sunday | Progression Run — 12.8 km, last 4.8 km progressing moderate to hard |
| Monday | Rest (Core Strength 3 sets in source) |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 8 × 1K @ goal 10K pace w/ 2-min. active recoveries + 1.6 km easy + 10 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 3 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 6.4 km @ half-marathon pace + 1.6 km easy |
| Friday | Rest (Core Strength 3 sets in source) |
| Saturday | X-Train — 45 min. |

### Week 11

| Day | Workout |
|---|---|
| Sunday | Progression Run — 13.6 km, last 5.6 km progressing moderate to hard |
| Monday | Rest (Core Strength 3 sets in source) |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 10 × 1K @ goal 10K pace w/ 2-min. active recoveries + 1.6 km easy + 8 × 10-sec. hill sprint |
| Wednesday | Rest (Core Strength 3 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 4.8 km @ half-marathon pace + 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy |
| Friday | Rest (Core Strength 3 sets in source) |
| Saturday | X-Train — 50 min. |

### Week 12

| Day | Workout |
|---|---|
| Sunday | Progression Run — 9.6 km, last 3.2 km progressing moderate to hard |
| Monday | Rest (Core Strength 3 sets in source) |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 4 × 1.6 km @ goal 10K pace w/ 2-min. active recoveries + 1.6 km easy + 8 × 10-sec. hill sprint |
| Wednesday | Rest (Core Strength 3 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 3.2 km @ half-marathon pace + 1.6 km easy + 1.6 km @ 10K pace + 1.6 km easy |
| Friday | Rest (Core Strength 3 sets in source) |
| Saturday | X-Train — 40 min. |

### Week 13

| Day | Workout |
|---|---|
| Sunday | Hard Long Run — 3.2 km easy + 3.2 km @ half-marathon pace + 1.6 km easy + 3.2 km @ half-marathon pace + 3.2 km easy |
| Monday | Rest (Core Strength 3 sets in source) |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 6 × 1K @ goal 10K pace w/ 2-min. active recoveries + 1.6 km easy + 8 × 10-sec. hill sprint |
| Wednesday | Rest (Core Strength 3 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 4.8 km @ half-marathon pace + 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy |
| Friday | Rest (Core Strength 3 sets in source) |
| Saturday | X-Train — 50 min. |

### Week 14

| Day | Workout |
|---|---|
| Sunday | Hard Long Run — 3.2 km easy + 4 km @ half-marathon pace + 1.6 km easy + 4 km @ half-marathon pace + 1.6 km easy |
| Monday | Rest (Core Strength 2 sets in source) |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 4 × 2K @ goal 10K pace w/ 2-min. active recoveries + 1.6 km easy + 10 × 10-sec. hill sprint |
| Wednesday | Rest (Core Strength 2 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 5.6 km @ half-marathon pace + 1.6 km easy + 1.6 km @ 10K pace + 1.6 km easy |
| Friday | Rest (Core Strength 2 sets in source) |
| Saturday | X-Train — 55 min. |

### Week 15

| Day | Workout |
|---|---|
| Sunday | Hard Long Run — 1.6 km easy + 4.8 km @ half-marathon pace + 1.6 km easy + 4.8 km @ half-marathon pace + 1.6 km easy |
| Monday | Rest (Core Strength 2 sets in source) |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 4 × 2K @ goal 10K pace w/ 90-sec. active recoveries + 1K max effort + 1.6 km easy + 10 × 10-sec. hill sprint |
| Wednesday | Rest (Core Strength 2 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy |
| Friday | Rest (Core Strength 2 sets in source) |
| Saturday | X-Train — 1 hour |

### Week 16

| Day | Workout |
|---|---|
| Sunday | Hard Long Run — 3.2 km easy + 6.4 km @ half-marathon pace + 3.2 km easy |
| Monday | Rest (Core Strength 1 set in source) |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 2 × 2K @ goal 10K pace w/ 2-min. active recoveries + 1.6 km easy + 4 × 10-sec. hill sprint |
| Wednesday | Rest (Core Strength 1 set in source) |
| Thursday | Threshold Run — 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy |
| Friday | Rest (Core Strength 1 set in source) |
| Saturday | **Goal Race — 10K** |

> **Race day note:** The source's printed plan shows Week 16 Saturday as "Off" and the 10K race on Sunday. For schema consistency with all other plans, this file places the `goal_race` on Saturday of Week 16. If the runner's actual race is on Sunday, they should treat Saturday as a rest day and run the race the following day.

---

## Structured Data (JSON)

```json
{
  "plan": {
    "plan_category": "masters",
    "distance": "10K",
    "duration_weeks": 16,
    "applies_to_runner_profiles": ["masters"],
    "weekly_volume": {
      "min_runs": 4,
      "max_runs": 5,
      "min_miles": 14,
      "max_miles": 30
    },
    "race_day_of_week": "weekend",
    "race_day_note": "The source plan shows Week 16 Saturday as 'Off' and the 10K race on Sunday. For schema consistency with other plans, this file places the goal_race on Saturday Week 16.",
    "specific_endurance": {
      "definition": "Ability to sustain goal race pace long enough to finish without slowing down",
      "pace_range_pct_offset_from_goal": {
        "fundamental": { "slower_pct": 10, "faster_pct": 10 },
        "sharpening":  { "slower_pct": 4,  "faster_pct": 4 },
        "taper":       { "slower_pct": 4,  "faster_pct": 4 }
      },
      "progression_dimensions": [
        "Pace moves from current 10K pace toward goal 10K pace (explicit source marker)",
        "Volume of race-pace work per session increases",
        "Race-pace efforts become longer",
        "Recoveries shorten or pace closes in on goal pace"
      ],
      "peak_workouts_by_profile": {
        "low_key":            "4 × 2K @ 10K pace w/ 1-min jog recoveries",
        "competitive":        "4 × 2K @ 10K pace + 1K @ maximum effort, w/ 1-min jog recoveries",
        "highly_competitive": "4 × 2K @ 10K pace + 1K @ maximum effort, w/ 1-min jog recoveries"
      },
      "primary_vehicle": "specific_endurance_intervals",
      "primary_vehicle_note": "For 10K runners, track-style intervals at goal 10K pace are the primary vehicle."
    },
    "weeks": [
      {
        "week": 1,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "long_run", "description": "8 km easy" },
          "monday":    { "type": "rest",     "description": "Rest (Core Strength 1 set in source)" },
          "tuesday":   { "type": "easy_run", "description": "6.4 km + 1 x 8-sec hill sprint" },
          "wednesday": { "type": "rest",     "description": "Rest (Core Strength 1 set in source)" },
          "thursday":  { "type": "fartlek",  "description": "8 km easy w/ 6 x 30 sec intervals @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "friday":    { "type": "rest",     "description": "Rest (Core Strength 1 set in source)" },
          "saturday":  { "type": "xtrain",   "description": "X-Train 20 min" }
        }
      },
      {
        "week": 2,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "9.6 km easy, last mile moderate (uphill if possible)", "progression_format": "moderate_uphill" },
          "monday":    { "type": "rest",            "description": "Rest (Core Strength 1 set in source)" },
          "tuesday":   { "type": "easy_run",        "description": "8 km + 2 x 8-sec hill sprint" },
          "wednesday": { "type": "rest",            "description": "Rest (Core Strength 1 set in source)" },
          "thursday":  { "type": "fartlek",         "description": "9.6 km easy w/ 6 x 40 sec intervals @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "friday":    { "type": "rest",            "description": "Rest (Core Strength 1 set in source)" },
          "saturday":  { "type": "xtrain",          "description": "X-Train 25 min" }
        }
      },
      {
        "week": 3,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "11.2 km easy, last 2.4 km moderate (uphill if possible)", "progression_format": "moderate_uphill" },
          "monday":    { "type": "rest",            "description": "Rest (Core Strength 1 set in source)" },
          "tuesday":   { "type": "easy_run",        "description": "8 km + 3 x 8-sec hill sprint" },
          "wednesday": { "type": "rest",            "description": "Rest (Core Strength 1 set in source)" },
          "thursday":  { "type": "fartlek",         "description": "11.2 km easy w/ 6 x 40 sec intervals @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "friday":    { "type": "rest",            "description": "Rest (Core Strength 1 set in source)" },
          "saturday":  { "type": "xtrain",          "description": "X-Train 30 min" }
        }
      },
      {
        "week": 4,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "8.8 km easy, last 2.4 km moderate (uphill if possible)", "progression_format": "moderate_uphill" },
          "monday":    { "type": "rest",            "description": "Rest (Core Strength 1 set in source)" },
          "tuesday":   { "type": "easy_run",        "description": "6.4 km + 4 x 8-sec hill sprint" },
          "wednesday": { "type": "rest",            "description": "Rest (Core Strength 1 set in source)" },
          "thursday":  { "type": "fartlek",         "description": "8 km easy w/ 6 x 30 sec intervals @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "friday":    { "type": "rest",            "description": "Rest (Core Strength 1 set in source)" },
          "saturday":  { "type": "xtrain",          "description": "X-Train 20 min" }
        }
      },
      {
        "week": 5,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "11.2 km, last 3.2 km moderate", "progression_format": "moderate" },
          "monday":    { "type": "rest",             "description": "Rest (Core Strength 2 sets in source)" },
          "tuesday":   { "type": "hill_repetitions", "description": "Anaerobic Hill Intervals: 1.6 km easy + 4 x 400m uphill @ 3K effort w/ 2-min active recoveries + 1.6 km easy + 5 x 8-sec hill sprint" },
          "wednesday": { "type": "rest",             "description": "Rest (Core Strength 2 sets in source)" },
          "thursday":  { "type": "progression_run",  "description": "6.4 km easy + 3.2 km hard (uphill if possible)", "progression_format": "hard_uphill" },
          "friday":    { "type": "rest",             "description": "Rest (Core Strength 2 sets in source)" },
          "saturday":  { "type": "xtrain",           "description": "X-Train 30 min" }
        }
      },
      {
        "week": 6,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",            "description": "12 km, last 4 km moderate", "progression_format": "moderate" },
          "monday":    { "type": "rest",                       "description": "Rest (Core Strength 2 sets in source)" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "1.6 km easy + 5 x 1.6 km @ current 10K pace w/ 2-min active recoveries + 1.6 km easy + 6 x 8-sec hill sprint", "interval_format": "repetition" },
          "wednesday": { "type": "rest",                       "description": "Rest (Core Strength 2 sets in source)" },
          "thursday":  { "type": "ladder_intervals",           "description": "Ladder Workout: 1.6 km easy + 2 x (6 min, 5 min, 4 min, 3 min, 2 min, 1 min @ 10K-1500m pace w/ 2-min active recoveries) + 1.6 km easy", "interval_format": "ladder" },
          "friday":    { "type": "rest",                       "description": "Rest (Core Strength 2 sets in source)" },
          "saturday":  { "type": "xtrain",                     "description": "X-Train 35 min" }
        }
      },
      {
        "week": 7,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "11.2 km, last mile hard", "progression_format": "hard" },
          "monday":    { "type": "rest",             "description": "Rest (Core Strength 2 sets in source)" },
          "tuesday":   { "type": "hill_repetitions", "description": "Anaerobic Hill Intervals: 1.6 km easy + 4 x 600m uphill @ 3K effort w/ 2-min active recoveries + 1.6 km easy + 7 x 8-sec hill sprint" },
          "wednesday": { "type": "rest",             "description": "Rest (Core Strength 2 sets in source)" },
          "thursday":  { "type": "threshold_run",    "description": "1.6 km easy + 3.2 km @ half-marathon pace + 1.6 km easy + 3.2 km @ half-marathon pace + 1.6 km easy", "threshold_tier": "T2", "threshold_format": "two_intervals" },
          "friday":    { "type": "rest",             "description": "Rest (Core Strength 2 sets in source)" },
          "saturday":  { "type": "xtrain",           "description": "X-Train 40 min" }
        }
      },
      {
        "week": 8,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run", "description": "8 km, last 3.2 km moderate", "progression_format": "moderate" },
          "monday":    { "type": "rest",            "description": "Rest (Core Strength 2 sets in source)" },
          "tuesday":   { "type": "speed_intervals", "description": "1.6 km easy + 6 x 400m @ 3K pace w/ 2-min active recoveries + 1.6 km easy + 8 x 8-sec hill sprint", "interval_format": "repetition" },
          "wednesday": { "type": "rest",            "description": "Rest (Core Strength 2 sets in source)" },
          "thursday":  { "type": "threshold_run",   "description": "1.6 km easy + 1.6 km @ half-marathon pace + 1.6 km easy + 1.6 km @ 10K pace + 1.6 km easy", "threshold_tier": "T2-T3", "threshold_format": "two_intervals" },
          "friday":    { "type": "rest",            "description": "Rest (Core Strength 2 sets in source)" },
          "saturday":  { "type": "xtrain",          "description": "X-Train 30 min" }
        }
      },
      {
        "week": 9,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "11.2 km, last 3.2 km hard", "progression_format": "hard" },
          "monday":    { "type": "rest",             "description": "Rest (Core Strength 2 sets in source)" },
          "tuesday":   { "type": "ladder_intervals", "description": "Ladder Workout: 1.6 km easy + 2 x (6 min, 5 min, 4 min, 3 min, 2 min, 1 min @ 10K-1500m pace w/ 2-min active recoveries) + 1.6 km easy + 9 x 8-sec hill sprint", "interval_format": "ladder" },
          "wednesday": { "type": "rest",             "description": "Rest (Core Strength 2 sets in source)" },
          "thursday":  { "type": "threshold_run",    "description": "1.6 km easy + 4 km @ half-marathon pace + 1.6 km easy + 4 km @ half-marathon pace + 1.6 km easy", "threshold_tier": "T2", "threshold_format": "two_intervals" },
          "friday":    { "type": "rest",             "description": "Rest (Core Strength 2 sets in source)" },
          "saturday":  { "type": "xtrain",           "description": "X-Train 40 min" }
        }
      },
      {
        "week": 10,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",            "description": "12.8 km, last 4.8 km progressing moderate to hard", "progression_format": "long_run_progression" },
          "monday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "1.6 km easy + 8 x 1K @ goal 10K pace w/ 2-min active recoveries + 1.6 km easy + 10 x 8-sec hill sprint", "interval_format": "repetition" },
          "wednesday": { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "thursday":  { "type": "threshold_run",              "description": "1.6 km easy + 6.4 km @ half-marathon pace + 1.6 km easy", "threshold_tier": "T2", "threshold_format": "one_interval" },
          "friday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "saturday":  { "type": "xtrain",                     "description": "X-Train 45 min" }
        }
      },
      {
        "week": 11,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",            "description": "13.6 km, last 5.6 km progressing moderate to hard", "progression_format": "long_run_progression" },
          "monday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "1.6 km easy + 10 x 1K @ goal 10K pace w/ 2-min active recoveries + 1.6 km easy + 8 x 10-sec hill sprint", "interval_format": "repetition" },
          "wednesday": { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "thursday":  { "type": "threshold_run",              "description": "1.6 km easy + 4.8 km @ half-marathon pace + 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy", "threshold_tier": "T2-T3", "threshold_format": "two_intervals" },
          "friday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "saturday":  { "type": "xtrain",                     "description": "X-Train 50 min" }
        }
      },
      {
        "week": 12,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",            "description": "9.6 km, last 3.2 km progressing moderate to hard", "progression_format": "long_run_progression" },
          "monday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "1.6 km easy + 4 x 1.6 km @ goal 10K pace w/ 2-min active recoveries + 1.6 km easy + 8 x 10-sec hill sprint", "interval_format": "repetition" },
          "wednesday": { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "thursday":  { "type": "threshold_run",              "description": "1.6 km easy + 3.2 km @ half-marathon pace + 1.6 km easy + 1.6 km @ 10K pace + 1.6 km easy", "threshold_tier": "T2-T3", "threshold_format": "two_intervals" },
          "friday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "saturday":  { "type": "xtrain",                     "description": "X-Train 40 min" }
        }
      },
      {
        "week": 13,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "hard_long_run",              "description": "3.2 km easy + 3.2 km @ half-marathon pace + 1.6 km easy + 3.2 km @ half-marathon pace + 3.2 km easy" },
          "monday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "1.6 km easy + 6 x 1K @ goal 10K pace w/ 2-min active recoveries + 1.6 km easy + 8 x 10-sec hill sprint", "interval_format": "repetition" },
          "wednesday": { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "thursday":  { "type": "threshold_run",              "description": "1.6 km easy + 4.8 km @ half-marathon pace + 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy", "threshold_tier": "T2-T3", "threshold_format": "two_intervals" },
          "friday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "saturday":  { "type": "xtrain",                     "description": "X-Train 50 min" }
        }
      },
      {
        "week": 14,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "hard_long_run",              "description": "3.2 km easy + 4 km @ half-marathon pace + 1.6 km easy + 4 km @ half-marathon pace + 1.6 km easy" },
          "monday":    { "type": "rest",                       "description": "Rest (Core Strength 2 sets in source)" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "1.6 km easy + 4 x 2K @ goal 10K pace w/ 2-min active recoveries + 1.6 km easy + 10 x 10-sec hill sprint", "interval_format": "repetition" },
          "wednesday": { "type": "rest",                       "description": "Rest (Core Strength 2 sets in source)" },
          "thursday":  { "type": "threshold_run",              "description": "1.6 km easy + 5.6 km @ half-marathon pace + 1.6 km easy + 1.6 km @ 10K pace + 1.6 km easy", "threshold_tier": "T2-T3", "threshold_format": "two_intervals" },
          "friday":    { "type": "rest",                       "description": "Rest (Core Strength 2 sets in source)" },
          "saturday":  { "type": "xtrain",                     "description": "X-Train 55 min" }
        }
      },
      {
        "week": 15,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "hard_long_run",              "description": "1.6 km easy + 4.8 km @ half-marathon pace + 1.6 km easy + 4.8 km @ half-marathon pace + 1.6 km easy" },
          "monday":    { "type": "rest",                       "description": "Rest (Core Strength 2 sets in source)" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "1.6 km easy + 4 x 2K @ goal 10K pace w/ 90-sec active recoveries + 1K max effort + 1.6 km easy + 10 x 10-sec hill sprint", "interval_format": "repetition" },
          "wednesday": { "type": "rest",                       "description": "Rest (Core Strength 2 sets in source)" },
          "thursday":  { "type": "threshold_run",              "description": "1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy", "threshold_tier": "T3", "threshold_format": "two_intervals" },
          "friday":    { "type": "rest",                       "description": "Rest (Core Strength 2 sets in source)" },
          "saturday":  { "type": "xtrain",                     "description": "X-Train 1 hour" }
        }
      },
      {
        "week": 16,
        "training_phase": "taper",
        "days": {
          "sunday":    { "type": "hard_long_run",              "description": "3.2 km easy + 6.4 km @ half-marathon pace + 3.2 km easy" },
          "monday":    { "type": "rest",                       "description": "Rest (Core Strength 1 set in source)" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "1.6 km easy + 2 x 2K @ goal 10K pace w/ 2-min active recoveries + 1.6 km easy + 4 x 10-sec hill sprint", "interval_format": "repetition" },
          "wednesday": { "type": "rest",                       "description": "Rest (Core Strength 1 set in source)" },
          "thursday":  { "type": "threshold_run",              "description": "1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy", "threshold_tier": "T3", "threshold_format": "one_interval" },
          "friday":    { "type": "rest",                       "description": "Rest (Core Strength 1 set in source)" },
          "saturday":  { "type": "goal_race",                  "description": "10K Goal Race" }
        }
      }
    ]
  }
}
```
