# Marathon Level 1 Training Plan

## Overview

- **Distance:** Marathon
- **Level:** 1 (Beginner / Low Mileage)
- **Duration:** 20 weeks
- **Weekly Volume:** Ranges from 4 runs / 24 km (Week 1) to 5 runs / 80 km (Week 17)
- **Description:** Low-volume plan for beginners and anyone who prefers a low running mileage program.

## Plan Context

There are three plans for each of the four popular road race distances:

- **5K plans:** 12 weeks long
- **10K plans:** 14 weeks long
- **Half-marathon plans:** 16 weeks long
- **Marathon plans:** 20 weeks long

At each distance there are three levels:

- **Level 1:** Low training volume — for beginners and runners who prefer low mileage
- **Level 2:** Moderate volume — for more experienced and competitive runners
- **Level 3:** High mileage — for highly competitive runners

## Runner Profile → Plan Level Mapping

**This Marathon Level 1 plan applies to the `beginner` and `low_key` profiles.**

| Runner Profile | Code | Recommended Plan Level | Description |
|---|---|---|---|
| Beginner | `beginner` | **Level 1** | New to running or returning after a long break |
| Low-Key | `low_key` | **Level 1** | Runs regularly but prefers low mileage |
| Competitive | `competitive` | Level 2 | More experienced, races regularly |
| Highly Competitive | `highly_competitive` | Level 3 | Trains seriously, prioritizes performance |
| Elite | `elite` | Level 3 | Top-tier competitor |

### Quick lookup (for code)

```json
{
  "runner_profile_to_plan_level": {
    "beginner":           1,
    "low_key":            1,
    "competitive":        2,
    "highly_competitive": 3,
    "elite":              3
  },
  "plan_level_to_runner_profiles": {
    "1": ["beginner", "low_key"],
    "2": ["competitive"],
    "3": ["highly_competitive", "elite"]
  }
}
```

> This file contains **only the Marathon Level 1 plan**. A runner whose profile maps to Level 2 or Level 3 should use the corresponding Marathon Level 2 or Level 3 plan file.

## Workout Type Glossary

| Code | Description |
|---|---|
| `long_run` | Long, easy-paced run |
| `easy_run` | Easy-paced run |
| `moderate_run` | Sustained moderate-pace run (faster than easy, slower than threshold). Used in Marathon Level 2/3 plans; not used in this Level 1 plan but listed here for schema consistency across marathon plan files. |
| `progression_run` | Easy run that finishes with a moderate, hard, or marathon-pace segment. Has 7 sub-formats (see Progression Run Format Reference below). |
| `xtrain_or_rest` | Cross-training **or** rest — runner's choice |
| `xtrain` | Specific cross-training session prescribed |
| `rest` | Full rest day |
| `fartlek` | Easy run with embedded faster surges. Has 4 sub-formats (see Fartlek Format Reference below). |
| `hill_repetitions` | Uphill repetitions at hard effort with jog-back recoveries |
| `threshold_run` | Run with a sustained segment at a threshold pace (T1, T2, or T3 — see Threshold Pace Reference below). |
| `marathon_pace_run` | **Marathon-specific.** Sustained block at marathon pace (or slightly slower), framed as the marathon runner's primary specific-endurance workout. Distinct from `threshold_run` because the source treats marathon-pace work as specific-endurance training, not threshold work — even though marathon pace is in the T1 tier. |
| `hard_long_run` | **Marathon-specific.** Long run (10–14+ miles) at marathon pace or slightly slower (e.g. `+12 sec/km`). The marathon runner's signature peak-cycle workout — not a "long easy run" and not a progression. Race-pace endurance over a long distance. |
| `specific_endurance_intervals` | Repetition intervals at race-distance pace (5K, 10K, etc.) |
| `ladder_intervals` | Intervals of varying distance/duration run consecutively |
| `goal_race` | The target race the plan is built around |

> **No diagnostic checkpoints in this plan.** Per the source: **there is no effective specific-endurance test for the marathon.** Racing the full distance mid-cycle is too taxing, and shorter-distance proxies don't reliably predict marathon-pace fitness. Marathon runners rely on long-run pacing trends and threshold-run progression to gauge fitness.

## Threshold Pace Reference

For marathon runners, marathon pace itself sits at the T1 threshold tier. But the source treats sustained marathon-pace runs as **specific-endurance work**, not threshold work — see the Specific-Endurance Reference below for the framing.

| Pace ID | Sustainable for... | Elite proxy | Sub-elite proxy |
|---|---|---|---|
| **T1** | ~2.5 hours | A bit slower than marathon pace | Marathon pace or slightly faster |
| **T2** | ~90 minutes | A bit faster than marathon pace | Half-marathon pace |
| **T3** | ~60 minutes | Half-marathon pace or a bit faster | A bit slower than 10K pace |

In this Marathon Level 1 plan:

| Source description | Threshold tier |
|---|---|
| "marathon pace" | **T1** |
| "marathon/half-marathon pace" | T1–T2 |
| "half-marathon pace" | **T2** |
| "half-marathon/10K pace" | T2–T3 |

```json
{
  "threshold_paces": {
    "T1": { "sustainable_minutes": 150, "elite_proxy": "slightly slower than marathon pace", "sub_elite_proxy": "marathon pace or slightly faster" },
    "T2": { "sustainable_minutes": 90,  "elite_proxy": "slightly faster than marathon pace", "sub_elite_proxy": "half-marathon pace" },
    "T3": { "sustainable_minutes": 60,  "elite_proxy": "half-marathon pace or slightly faster", "sub_elite_proxy": "slightly slower than 10K pace" }
  },
  "source_pace_to_threshold_tier": {
    "marathon pace":              "T1",
    "marathon/half-marathon pace":"T1-T2",
    "half-marathon pace":         "T2",
    "half-marathon/10K pace":     "T2-T3"
  }
}
```

## Training Phases

In this Marathon Level 1 plan: **Weeks 1–8 = `fundamental`, Weeks 9–19 = `sharpening`, Week 20 = `taper`**. Sharpening starts in Week 9 when the first threshold run appears.

---

## Fartlek Format Reference

| Format | Example | Best Use |
|---|---|---|
| `speed_fartlek` | `11.2 km easy w/ 6 × 30 sec @ 10K-3K pace` | Introductory & early fundamental |
| `race_pace_fartlek` | `8 × 3 min @ 10K pace w/ 2-min recoveries` | Late fundamental & sharpening |
| `single_block_fartlek` | `6.4 km w/ 1.6 km @ 5K pace / 1 min easy` | One sustained surge in an easy run |
| `mixed_pace_fartlek` | `6 min @ 10K pace + 4 min easy + 4 × 1 min @ 5K pace` | Sharpening |

This Marathon Level 1 plan uses only `speed_fartlek` (Weeks 4–8).

---

## Progression Run Format Reference

| Format | Example | Best Use |
|---|---|---|
| `moderate` | `9.6 km easy + 20 min moderate` | Introductory; later, adds extra hard work |
| `moderate_uphill` | `9.6 km easy + 20 min moderate (uphill if possible)` | Introductory; aerobic + strength |
| `hard` | `9.6 km easy + 20 min hard` | Late fundamental |
| `hard_uphill` | `9.6 km easy + 20 min hard (uphill if possible)` | Fundamental; aerobic + strength after foundation |
| `long_run_progression` | `19.2 km easy + 30 min moderate` | Throughout cycle; transforms general into race-specific endurance |
| `fartlek_progression` | `3.2 km easy + 6.4 km intervals + 3.2 km hard` | Late fundamental |
| `marathon_pace_progression` | `11.2 km easy + 20 min @ marathon pace` | Race-pace stimulus inside a longer run |

This plan uses progression runs heavily — particularly `moderate`, `hard`, `long_run_progression`, and `marathon_pace_progression` formats.

```json
{
  "progression_run_formats": {
    "moderate":                  { "example": "9.6 km easy + 20 min moderate", "best_use": "Introductory; later, adds extra hard work to schedule" },
    "moderate_uphill":           { "example": "9.6 km easy + 20 min moderate (uphill if possible)", "best_use": "Introductory; aerobic + strength simultaneously" },
    "hard":                      { "example": "9.6 km easy + 20 min hard", "best_use": "Late fundamental; coax aerobic support toward peak" },
    "hard_uphill":               { "example": "9.6 km easy + 20 min hard (uphill if possible)", "best_use": "Fundamental; aerobic + strength after foundation built" },
    "long_run_progression":      { "example": "19.2 km easy + 30 min moderate", "best_use": "Throughout cycle; transform race endurance into race-specific endurance" },
    "fartlek_progression":       { "example": "3.2 km easy + 6.4 km intervals + 3.2 km hard", "best_use": "Late fundamental; integrate two types of specific-endurance training" },
    "marathon_pace_progression": { "example": "11.2 km easy + 20 min @ marathon pace", "best_use": "Race-pace training stimulus inside a longer run (HM/marathon plans)" }
  }
}
```

---

## Threshold Run Format Reference

| Format | Example | Best Use |
|---|---|---|
| `one_interval` | `3.2 km easy + 6.4 km @ half-marathon pace + 3.2 km easy` | Shorter early, longer late to finish the job |
| `two_intervals` | `3.2 km easy + 15 min @ HM pace + 3.2 km easy + 15 min @ 10K pace + 3.2 km easy` | More total threshold time with recovery |
| `three_intervals` | `... + 10 min @ marathon pace + 1 min easy + 10 min @ HM pace + 1 min easy + 10 min @ 10K pace + ...` | Hits all three threshold tiers in one workout |
| `multi_interval` | `3.2 km easy + 4 × 6 min @ HM pace w/ 1-min active recoveries + 3.2 km easy` | More than three blocks at a single pace |

This Marathon Level 1 plan uses `one_interval` and `two_intervals`. **Week 18 Wednesday** is a threshold workout with appended specific-endurance intervals (`add_on` interval format) — the first time we've seen this combination in any plan.

```json
{
  "threshold_run_formats": {
    "one_interval":    { "example": "3.2 km easy + 6.4 km @ half-marathon pace + 3.2 km easy", "best_use": "Build aerobic support (shorter early, longer late)" },
    "two_intervals":   { "example": "3.2 km easy + 15 min @ HM pace + 3.2 km easy + 15 min @ 10K pace + 3.2 km easy", "best_use": "More total threshold time with mid-workout recovery" },
    "three_intervals": { "example": "3.2 km easy + 10 min @ marathon pace + 1 min easy + 10 min @ HM pace + 1 min easy + 10 min @ 10K pace + 3.2 km easy", "best_use": "Hit all three threshold tiers (T1, T2, T3) in one workout" },
    "multi_interval":  { "example": "3.2 km easy + 4 x 6 min @ HM pace w/ 1-min active recoveries + 3.2 km easy", "best_use": "High threshold volume at a single pace, with recovery between blocks" }
  }
}
```

---

## Specific-Endurance Reference

For marathon runners, specific-endurance training takes a fundamentally different shape than for shorter distances:

- **5K/10K runners:** track-style intervals at goal race pace are the primary vehicle.
- **Half-marathon runners:** threshold runs at HM pace are the primary vehicle.
- **Marathon runners:** **sustained marathon-pace runs and `hard_long_run` workouts** are the primary vehicle. The race itself takes 3–5 hours; the relevant stimulus is sustained moderate effort over distance, not short fast intervals.

This is why two new workout types appear in this plan: `marathon_pace_run` and `hard_long_run`.

### The ±10% Pace Range

| Phase | Pace range vs. goal pace |
|---|---|
| `fundamental` | **±10%** |
| `sharpening`  | **±3–4%** |
| `taper`       | **±3–4%** |

For marathon runners, the ±10% range from goal marathon pace overlaps with marathon pace, half-marathon pace, and the slow end of 10K pace — so threshold runs at HM pace and long runs at marathon pace both count as specific-endurance work.

### How specific-endurance training progresses across the cycle

For marathons specifically:

1. **Pace moves toward goal pace** — early sustained efforts at marathon pace + 12 sec/km; later at exact marathon pace.
2. **Volume of race-pace work per session increases** — the `hard_long_run` grows from a few miles to 14+ miles at goal pace.
3. **Recoveries shorten or pace closes in on goal pace** — for marathon, "off" segments in alternating workouts get faster (closer to MP).

### Peak-level specific-endurance workouts by distance and runner profile

| Race | Runner profile | Peak workout | |
|---|---|---|---|
| 5K | Low-Key Competitive (`low_key`) | 5 × 1K @ goal pace w/ 2-min jog recoveries | |
| 5K | Competitive (`competitive`) | 5 × 1K @ goal pace w/ 90-sec jog recoveries | |
| 5K | Highly Competitive (`highly_competitive`) | 5 × 1K @ 5K pace w/ 1-min jog recoveries | |
| 10K | Low-Key Competitive (`low_key`) | 4 × 2K @ 10K pace w/ 1-min jog recoveries | |
| 10K | Competitive (`competitive`) | 4 × 2K @ 10K pace + 1K @ maximum effort, w/ 1-min jog recoveries | |
| 10K | Highly Competitive (`highly_competitive`) | 4 × 2K @ 10K pace + 1K @ maximum effort, w/ 1-min jog recoveries | |
| Half-Marathon | Low-Key Competitive (`low_key`) | 6 × 1.6 km @ half-marathon pace w/ 2-min jog recoveries | |
| Half-Marathon | Competitive (`competitive`) | 4 × 3K @ half-marathon pace w/ 90-sec jog recoveries | |
| Half-Marathon | Highly Competitive (`highly_competitive`) | 3 × 5K @ half-marathon pace w/ 90-sec jog recoveries | |
| Marathon | Low-Key Competitive (`low_key`) | 32–35.2 km easy | ←|
| Marathon | Competitive (`competitive`) | 16 km easy + 16 km @ marathon pace | |
| Marathon | Highly Competitive (`highly_competitive`) | 45 min easy + 20K: 1K on/1K off (on = marathon goal pace, off = marathon pace + 3–6 sec/km) | |

The arrow (←) marks the row applicable to **this plan** (Marathon Low-Key/Beginner). Note: for the Low-Key marathon profile, the peak workout is simply `32–35.2 km easy` — surviving the distance is the primary specific-endurance test. This plan reaches that target with the Week 18 Sunday long run (`36.8 km easy`).

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
      "Pace moves from current fitness pace toward goal pace",
      "Volume of race-pace work per session increases",
      "Race-pace efforts become longer",
      "For marathon: 'off' segments in alternating workouts get faster (closer to MP)"
    ],
    "peak_workouts_by_profile": {
      "low_key":            "32-35.2 km easy",
      "competitive":        "16 km easy + 16 km @ marathon pace",
      "highly_competitive": "45 min easy + 20K: 1K on/1K off (on = marathon goal pace, off = marathon pace + 3-6 sec/km)"
    },
    "primary_vehicles": ["long_run", "marathon_pace_run", "hard_long_run"],
    "primary_vehicles_note": "For marathon runners, specific-endurance work happens through sustained efforts at or near marathon pace over long distances — not through short fast intervals. Long runs, marathon-pace runs, and hard long runs (long runs at MP+12 sec/km) are the central workouts.",
    "marathon_diagnostic_note": "There is no effective specific-endurance test for the marathon. Marathon runners gauge fitness through long-run pacing trends and threshold-run progression."
  }
}
```

---

## Interval Format Reference

| Format | Description | Example |
|---|---|---|
| `repetition` | Uniform-distance, uniform-pace intervals | `8 × 800m @ 10K pace` |
| `ladder` | Varying-distance intervals run consecutively | `1 min, 2 min, 3 min, 2 min, 1 min @ 5K-1500m pace` |
| `add_on` | Small set of speed intervals appended to a slower workout | `6.4 km @ HM pace + 4 × 1.6 km @ HM/10K pace` |

This Marathon Level 1 plan uses all three formats — including the **first appearance of `add_on` in a non-10K-Level-3 plan** (Week 18 Wednesday combines a threshold block with appended specific-endurance intervals).

---

## Weekly Schedule

### Week 1

| Day | Workout |
|---|---|
| Sunday | Long Run — 4.8 km easy |
| Monday | X-Train or Rest |
| Tuesday | Easy Run — 4.8 km + 1 × 8-sec. hill sprint |
| Wednesday | Easy Run — 9.6 km |
| Thursday | X-Train or Rest |
| Friday | Easy Run — 4.8 km + 1 × 8-sec. hill sprint |
| Saturday | Rest |

### Week 2

| Day | Workout |
|---|---|
| Sunday | Long Run — 6.4 km easy |
| Monday | X-Train or Rest |
| Tuesday | Easy Run — 6.4 km + 2 × 8-sec. hill sprint |
| Wednesday | Easy Run — 9.6 km |
| Thursday | X-Train or Rest |
| Friday | Easy Run — 6.4 km + 1 × 8-sec. hill sprint |
| Saturday | Rest |

### Week 3

| Day | Workout |
|---|---|
| Sunday | Progression Run — 8 km, last 10 min. moderate |
| Monday | X-Train or Rest |
| Tuesday | Easy Run — 6.4 km + 2 × 8-sec. hill sprint |
| Wednesday | Easy Run — 9.6 km |
| Thursday | X-Train or Rest |
| Friday | Easy Run — 8 km + 2 × 8-sec. hill sprint |
| Saturday | Rest |

### Week 4

| Day | Workout |
|---|---|
| Sunday | Progression Run — 9.6 km, last 10 min. moderate (uphill, if possible) |
| Monday | X-Train or Rest |
| Tuesday | Easy Run — 8 km + 3 × 8-sec. hill sprint |
| Wednesday | Fartlek Run — 11.2 km easy w/ 6 × 30 sec. @ 10K–3K pace |
| Thursday | X-Train or Rest |
| Friday | Easy Run — 8 km + 3 × 8-sec. hill sprint |
| Saturday | Rest |

### Week 5

| Day | Workout |
|---|---|
| Sunday | Progression Run — 11.2 km, last 20 min. moderate (uphill, if possible) |
| Monday | X-Train or Rest |
| Tuesday | Easy Run — 8 km + 4 × 8-sec. hill sprint |
| Wednesday | Fartlek Run — 12.8 km easy w/ 6 × 40 sec. @ 10K–3K pace |
| Thursday | X-Train or Rest |
| Friday | Easy Run — 11.2 km + 4 × 8-sec. hill sprint |
| Saturday | Rest |

### Week 6

| Day | Workout |
|---|---|
| Sunday | Progression Run — 11.2 km, last 20 min. moderate (uphill, if possible) |
| Monday | Rest |
| Tuesday | Easy Run — 4.8 km + 4 × 8-sec. hill sprint |
| Wednesday | Fartlek Run — 11.2 km easy w/ 6 × 50 sec. @ 10K–3K pace |
| Thursday | Easy Run — 9.6 km |
| Friday | Progression Run — 12.8 km, last 10 min. moderate |
| Saturday | Easy Run — 6.4 km |

### Week 7

| Day | Workout |
|---|---|
| Sunday | Progression Run — 12.8 km, last 20 min. moderate (uphill, if possible) |
| Monday | Rest |
| Tuesday | Easy Run — 4.8 km + 5 × 8-sec. hill sprint |
| Wednesday | Easy Run — 9.6 km |
| Thursday | Easy Run — 9.6 km |
| Friday | Progression Run — 12.8 km, last 15 min. moderate |
| Saturday | Easy Run — 6.4 km |

### Week 8

| Day | Workout |
|---|---|
| Sunday | Progression Run — 14.4 km, last 20 min. moderate (uphill, if possible) |
| Monday | Rest |
| Tuesday | Easy Run — 4.8 km + 4 × 8-sec. hill sprint |
| Wednesday | Fartlek Run — 12.8 km easy w/ 8 × 50 sec. @ 10K–3K pace |
| Thursday | Easy Run — 9.6 km |
| Friday | Progression Run — 12.8 km, last 20 min. moderate |
| Saturday | Easy Run — 6.4 km |

### Week 9

| Day | Workout |
|---|---|
| Sunday | Fartlek Run + Progression — 3.2 km easy + 4.8 km: 1 min @ 10K pace / 1 min easy + 3.2 km easy + 3.2 km hard |
| Monday | Rest |
| Tuesday | Threshold Run — 3.2 km easy + 2 × 10 min. @ half-marathon pace w/ 2-min. active recovery + 4.8 km easy |
| Wednesday | Easy Run — 14.4 km |
| Thursday | Easy Run — 6.4 km + 8 × 8-sec. hill sprint |
| Friday | Progression Run — 16 km, last 20 min. moderate |
| Saturday | Easy Run — 6.4 km |

### Week 10

| Day | Workout |
|---|---|
| Sunday | Progression Run — 17.6 km, last 20 min. hard |
| Monday | Rest |
| Tuesday | Specific-Endurance Intervals — 4.8 km easy + 15 × 1 min. @ 10K pace / 1 min. easy + 4.8 km easy |
| Wednesday | Easy Run — 16 km |
| Thursday | Easy Run — 8 km |
| Friday | Threshold Run — 3.2 km easy + 2 × 15 min. @ half-marathon/10K pace w/ 3-min. active recovery + 3.2 km easy |
| Saturday | Rest |

### Week 11

| Day | Workout |
|---|---|
| Sunday | Progression Run — 19.2 km, last 30 min. hard |
| Monday | Rest |
| Tuesday | Hill Repetitions — 3.2 km easy + 6 × 1 min. uphill @ 3K effort w/ jog-back recoveries + 3.2 km easy |
| Wednesday | Easy Run — 16 km |
| Thursday | Easy Run — 8 km |
| Friday | Threshold Run — 3.2 km easy + 9.6 km @ half-marathon pace + 3.2 km easy |
| Saturday | Rest |

### Week 12

| Day | Workout |
|---|---|
| Sunday | Long Run — 22.4 km easy |
| Monday | Rest |
| Tuesday | Specific-Endurance Intervals — 3.2 km easy + 8 × 800m @ 10K pace w/ 2-min. active recoveries + 3.2 km easy |
| Wednesday | Easy Run — 12.8 km |
| Thursday | Easy Run — 8 km + 8 × 8-sec. hill sprint |
| Friday | Threshold Run — 3.2 km easy + 2 × 15 min. @ half-marathon/10K pace w/ 3-min. active recovery + 3.2 km easy |
| Saturday | Rest |

### Week 13

| Day | Workout |
|---|---|
| Sunday | Long Run — 25.6 km easy |
| Monday | Rest |
| Tuesday | Hill Repetitions — 3.2 km easy + 6 × 2 min. uphill @ 5K effort w/ jog-back recoveries + 3.2 km easy |
| Wednesday | Easy Run — 14.4 km |
| Thursday | Easy Run — 6.4 km |
| Friday | Progression Run — 3.2 km easy + 30 min. moderate + 3.2 km easy |
| Saturday | Rest |

### Week 14

| Day | Workout |
|---|---|
| Sunday | Long Run — 22.4 km easy |
| Monday | Rest |
| Tuesday | Specific-Endurance Intervals — 3.2 km easy + 4 × 1.6 km @ 10K pace w/ 3-min. active recoveries + 3.2 km easy |
| Wednesday | Easy Run — 16 km |
| Thursday | Easy Run — 9.6 km + 8 × 8-sec. hill sprint |
| Friday | Easy Run — 6.4 km |
| Saturday | Rest |

### Week 15

| Day | Workout |
|---|---|
| Sunday | Progression Run — 28.8 km, last 20 min. hard |
| Monday | Rest |
| Tuesday | Threshold Run — 3.2 km easy + 9.6 km @ marathon/half-marathon pace + 3.2 km easy |
| Wednesday | Easy Run — 9.6 km |
| Thursday | Easy Run — 6.4 km + 8 × 8-sec. hill sprint |
| Friday | Progression Run — 11.2 km w/ 18 min. @ marathon pace |
| Saturday | Rest |

### Week 16

| Day | Workout |
|---|---|
| Sunday | Hard Long Run — 22.4 km @ marathon pace + 12 sec/km |
| Monday | Rest |
| Tuesday | Ladder Intervals — 3.2 km easy + 1 min, 2 min, 3 min, 2 min, 1 min, 2 min, 3 min @ 3K–10K pace w/ equal-duration active recoveries + 3.2 km easy |
| Wednesday | Easy Run — 12.8 km |
| Thursday | Easy Run — 6.4 km + 8 × 10-sec. hill sprint |
| Friday | Progression Run — 12.8 km, last 15 min. @ marathon pace |
| Saturday | Rest |

### Week 17

| Day | Workout |
|---|---|
| Sunday | Progression Run — 35.2 km, last 20 min. hard |
| Monday | Rest |
| Tuesday | Threshold Run — 3.2 km easy + 2 × 15 min. @ half-marathon/10K pace w/ 1-min. active recovery + 3.2 km easy |
| Wednesday | Easy Run — 9.6 km |
| Thursday | Easy Run — 6.4 km + 8 × 10-sec. hill sprint |
| Friday | Threshold Run — 3.2 km easy + 9.6 km @ marathon/half-marathon pace + 3.2 km easy |
| Saturday | Rest |

### Week 18

| Day | Workout |
|---|---|
| Sunday | Long Run — 36.8 km easy |
| Monday | Rest |
| Tuesday | Easy Run — 6.4 km |
| Wednesday | Threshold Run + Specific-Endurance Intervals — 3.2 km easy + 6.4 km @ half-marathon pace + 3 min. easy + 4 × 1.6 km @ half-marathon/10K pace w/ 3-min. active recoveries + 3.2 km easy |
| Thursday | Easy Run — 6.4 km + 8 × 10-sec. hill sprint |
| Friday | Progression Run — 16 km, last 6.4 km moderate |
| Saturday | Rest |

### Week 19

| Day | Workout |
|---|---|
| Sunday | Hard Long Run — 3.2 km easy + 22.4 km @ marathon pace + 12 sec/km + 3.2 km easy |
| Monday | Easy Run — 8 km |
| Tuesday | Threshold Run — 3.2 km easy + 2 × 10 min. @ half-marathon pace w/ 2-min. active recovery + 4.8 km easy |
| Wednesday | Rest |
| Thursday | Easy Run — 6.4 km + 10 × 10-sec. hill sprint |
| Friday | Marathon-Pace Run — 3.2 km easy + 12.8 km @ marathon pace + 3 sec/km + 1.6 km easy |
| Saturday | Rest |

### Week 20

| Day | Workout |
|---|---|
| Sunday | Hard Long Run — 16 km @ marathon pace + 12 sec/km |
| Monday | Rest |
| Tuesday | Marathon-Pace Run — 3.2 km easy + 6.4 km @ marathon pace + 1.6 km easy |
| Wednesday | Rest |
| Thursday | Easy Run — 6.4 km |
| Friday | Easy Run — 6.4 km |
| Saturday | **Goal Race — Marathon** |

> **Race day note:** The source's printed plan shows Week 20 Saturday as "Rest" and the marathon on the following day (Sunday). For schema consistency with all other plans, this file places the `goal_race` on Saturday of Week 20. If the runner's actual race is on Sunday, they should treat Saturday as a rest day and run the race the following day.

---

## Structured Data (JSON)

```json
{
  "plan": {
    "distance": "Marathon",
    "level": 1,
    "level_name": "Low Volume / Beginner",
    "duration_weeks": 20,
    "applies_to_runner_profiles": ["beginner", "low_key"],
    "weekly_volume": {
      "min_runs": 4,
      "max_runs": 5,
      "min_miles": 15,
      "max_miles": 50
    },
    "race_day_of_week": "weekend",
    "race_day_note": "The source plan shows Week 20 Saturday as 'Rest' and the marathon on the following Sunday. For schema consistency with other plans (where the race lands on Saturday), this file places the goal_race on Saturday Week 20. Runners racing on Sunday should treat Saturday as a rest day and run the race on the following day.",
    "specific_endurance": {
      "definition": "Ability to sustain goal race pace long enough to finish without slowing down",
      "pace_range_pct_offset_from_goal": {
        "fundamental": { "slower_pct": 10, "faster_pct": 10 },
        "sharpening":  { "slower_pct": 4,  "faster_pct": 4 },
        "taper":       { "slower_pct": 4,  "faster_pct": 4 }
      },
      "progression_dimensions": [
        "Pace moves from current fitness pace toward goal pace",
        "Volume of race-pace work per session increases",
        "Race-pace efforts become longer",
        "For marathon: 'off' segments in alternating workouts get faster (closer to MP)"
      ],
      "peak_workouts_by_profile": {
        "low_key":            "32-35.2 km easy",
        "competitive":        "16 km easy + 16 km @ marathon pace",
        "highly_competitive": "45 min easy + 20K: 1K on/1K off (on = marathon goal pace, off = marathon pace + 3-6 sec/km)"
      },
      "primary_vehicles": ["long_run", "marathon_pace_run", "hard_long_run"],
      "primary_vehicles_note": "For marathon runners, specific-endurance work happens through sustained efforts at or near marathon pace over long distances.",
      "marathon_diagnostic_note": "There is no effective specific-endurance test for the marathon. Marathon runners gauge fitness through long-run pacing trends and threshold-run progression."
    },
    "weeks": [
      {
        "week": 1,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "long_run",       "description": "4.8 km easy" },
          "monday":    { "type": "xtrain_or_rest", "description": "X-Train or Rest" },
          "tuesday":   { "type": "easy_run",       "description": "4.8 km + 1 x 8-sec hill sprint" },
          "wednesday": { "type": "easy_run",       "description": "9.6 km" },
          "thursday":  { "type": "xtrain_or_rest", "description": "X-Train or Rest" },
          "friday":    { "type": "easy_run",       "description": "4.8 km + 1 x 8-sec hill sprint" },
          "saturday":  { "type": "rest",           "description": "Rest" }
        }
      },
      {
        "week": 2,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "long_run",       "description": "6.4 km easy" },
          "monday":    { "type": "xtrain_or_rest", "description": "X-Train or Rest" },
          "tuesday":   { "type": "easy_run",       "description": "6.4 km + 2 x 8-sec hill sprint" },
          "wednesday": { "type": "easy_run",       "description": "9.6 km" },
          "thursday":  { "type": "xtrain_or_rest", "description": "X-Train or Rest" },
          "friday":    { "type": "easy_run",       "description": "6.4 km + 1 x 8-sec hill sprint" },
          "saturday":  { "type": "rest",           "description": "Rest" }
        }
      },
      {
        "week": 3,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "8 km, last 10 min moderate", "progression_format": "moderate" },
          "monday":    { "type": "xtrain_or_rest",  "description": "X-Train or Rest" },
          "tuesday":   { "type": "easy_run",        "description": "6.4 km + 2 x 8-sec hill sprint" },
          "wednesday": { "type": "easy_run",        "description": "9.6 km" },
          "thursday":  { "type": "xtrain_or_rest",  "description": "X-Train or Rest" },
          "friday":    { "type": "easy_run",        "description": "8 km + 2 x 8-sec hill sprint" },
          "saturday":  { "type": "rest",            "description": "Rest" }
        }
      },
      {
        "week": 4,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "9.6 km, last 10 min moderate (uphill if possible)", "progression_format": "moderate_uphill" },
          "monday":    { "type": "xtrain_or_rest",  "description": "X-Train or Rest" },
          "tuesday":   { "type": "easy_run",        "description": "8 km + 3 x 8-sec hill sprint" },
          "wednesday": { "type": "fartlek",         "description": "11.2 km easy w/ 6 x 30 sec @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "thursday":  { "type": "xtrain_or_rest",  "description": "X-Train or Rest" },
          "friday":    { "type": "easy_run",        "description": "8 km + 3 x 8-sec hill sprint" },
          "saturday":  { "type": "rest",            "description": "Rest" }
        }
      },
      {
        "week": 5,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "11.2 km, last 20 min moderate (uphill if possible)", "progression_format": "moderate_uphill" },
          "monday":    { "type": "xtrain_or_rest",  "description": "X-Train or Rest" },
          "tuesday":   { "type": "easy_run",        "description": "8 km + 4 x 8-sec hill sprint" },
          "wednesday": { "type": "fartlek",         "description": "12.8 km easy w/ 6 x 40 sec @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "thursday":  { "type": "xtrain_or_rest",  "description": "X-Train or Rest" },
          "friday":    { "type": "easy_run",        "description": "11.2 km + 4 x 8-sec hill sprint" },
          "saturday":  { "type": "rest",            "description": "Rest" }
        }
      },
      {
        "week": 6,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "11.2 km, last 20 min moderate (uphill if possible)", "progression_format": "moderate_uphill" },
          "monday":    { "type": "rest",            "description": "Rest" },
          "tuesday":   { "type": "easy_run",        "description": "4.8 km + 4 x 8-sec hill sprint" },
          "wednesday": { "type": "fartlek",         "description": "11.2 km easy w/ 6 x 50 sec @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "thursday":  { "type": "easy_run",        "description": "9.6 km" },
          "friday":    { "type": "progression_run", "description": "12.8 km, last 10 min moderate", "progression_format": "moderate" },
          "saturday":  { "type": "easy_run",        "description": "6.4 km" }
        }
      },
      {
        "week": 7,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "12.8 km, last 20 min moderate (uphill if possible)", "progression_format": "moderate_uphill" },
          "monday":    { "type": "rest",            "description": "Rest" },
          "tuesday":   { "type": "easy_run",        "description": "4.8 km + 5 x 8-sec hill sprint" },
          "wednesday": { "type": "easy_run",        "description": "9.6 km" },
          "thursday":  { "type": "easy_run",        "description": "9.6 km" },
          "friday":    { "type": "progression_run", "description": "12.8 km, last 15 min moderate", "progression_format": "moderate" },
          "saturday":  { "type": "easy_run",        "description": "6.4 km" }
        }
      },
      {
        "week": 8,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "14.4 km, last 20 min moderate (uphill if possible)", "progression_format": "moderate_uphill" },
          "monday":    { "type": "rest",            "description": "Rest" },
          "tuesday":   { "type": "easy_run",        "description": "4.8 km + 4 x 8-sec hill sprint" },
          "wednesday": { "type": "fartlek",         "description": "12.8 km easy w/ 8 x 50 sec @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "thursday":  { "type": "easy_run",        "description": "9.6 km" },
          "friday":    { "type": "progression_run", "description": "12.8 km, last 20 min moderate", "progression_format": "moderate" },
          "saturday":  { "type": "easy_run",        "description": "6.4 km" }
        }
      },
      {
        "week": 9,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run", "description": "3.2 km easy + 4.8 km: 1 min @ 10K pace / 1 min easy + 3.2 km easy + 3.2 km hard", "progression_format": "fartlek_progression" },
          "monday":    { "type": "rest",            "description": "Rest" },
          "tuesday":   { "type": "threshold_run",   "description": "3.2 km easy + 2 x 10 min @ half-marathon pace w/ 2-min active recovery + 4.8 km easy", "threshold_tier": "T2", "threshold_format": "two_intervals" },
          "wednesday": { "type": "easy_run",        "description": "14.4 km" },
          "thursday":  { "type": "easy_run",        "description": "6.4 km + 8 x 8-sec hill sprint" },
          "friday":    { "type": "progression_run", "description": "16 km, last 20 min moderate", "progression_format": "long_run_progression" },
          "saturday":  { "type": "easy_run",        "description": "6.4 km" }
        }
      },
      {
        "week": 10,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",            "description": "17.6 km, last 20 min hard", "progression_format": "hard" },
          "monday":    { "type": "rest",                       "description": "Rest" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "4.8 km easy + 15 x 1 min @ 10K pace / 1 min easy + 4.8 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "easy_run",                   "description": "16 km" },
          "thursday":  { "type": "easy_run",                   "description": "8 km" },
          "friday":    { "type": "threshold_run",              "description": "3.2 km easy + 2 x 15 min @ half-marathon/10K pace w/ 3-min active recovery + 3.2 km easy", "threshold_tier": "T2-T3", "threshold_format": "two_intervals" },
          "saturday":  { "type": "rest",                       "description": "Rest" }
        }
      },
      {
        "week": 11,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "19.2 km, last 30 min hard", "progression_format": "hard" },
          "monday":    { "type": "rest",             "description": "Rest" },
          "tuesday":   { "type": "hill_repetitions", "description": "3.2 km easy + 6 x 1 min uphill @ 3K effort w/ jog-back recoveries + 3.2 km easy" },
          "wednesday": { "type": "easy_run",         "description": "16 km" },
          "thursday":  { "type": "easy_run",         "description": "8 km" },
          "friday":    { "type": "threshold_run",    "description": "3.2 km easy + 9.6 km @ half-marathon pace + 3.2 km easy", "threshold_tier": "T2", "threshold_format": "one_interval" },
          "saturday":  { "type": "rest",             "description": "Rest" }
        }
      },
      {
        "week": 12,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "long_run",                   "description": "22.4 km easy" },
          "monday":    { "type": "rest",                       "description": "Rest" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "3.2 km easy + 8 x 800m @ 10K pace w/ 2-min active recoveries + 3.2 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "easy_run",                   "description": "12.8 km" },
          "thursday":  { "type": "easy_run",                   "description": "8 km + 8 x 8-sec hill sprint" },
          "friday":    { "type": "threshold_run",              "description": "3.2 km easy + 2 x 15 min @ half-marathon/10K pace w/ 3-min active recovery + 3.2 km easy", "threshold_tier": "T2-T3", "threshold_format": "two_intervals" },
          "saturday":  { "type": "rest",                       "description": "Rest" }
        }
      },
      {
        "week": 13,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "long_run",         "description": "25.6 km easy" },
          "monday":    { "type": "rest",             "description": "Rest" },
          "tuesday":   { "type": "hill_repetitions", "description": "3.2 km easy + 6 x 2 min uphill @ 5K effort w/ jog-back recoveries + 3.2 km easy" },
          "wednesday": { "type": "easy_run",         "description": "14.4 km" },
          "thursday":  { "type": "easy_run",         "description": "6.4 km" },
          "friday":    { "type": "progression_run",  "description": "3.2 km easy + 30 min moderate + 3.2 km easy", "progression_format": "moderate" },
          "saturday":  { "type": "rest",             "description": "Rest" }
        }
      },
      {
        "week": 14,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "long_run",                   "description": "22.4 km easy" },
          "monday":    { "type": "rest",                       "description": "Rest" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "3.2 km easy + 4 x 1.6 km @ 10K pace w/ 3-min active recoveries + 3.2 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "easy_run",                   "description": "16 km" },
          "thursday":  { "type": "easy_run",                   "description": "9.6 km + 8 x 8-sec hill sprint" },
          "friday":    { "type": "easy_run",                   "description": "6.4 km" },
          "saturday":  { "type": "rest",                       "description": "Rest" }
        }
      },
      {
        "week": 15,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run", "description": "28.8 km, last 20 min hard", "progression_format": "hard" },
          "monday":    { "type": "rest",            "description": "Rest" },
          "tuesday":   { "type": "threshold_run",   "description": "3.2 km easy + 9.6 km @ marathon/half-marathon pace + 3.2 km easy", "threshold_tier": "T1-T2", "threshold_format": "one_interval" },
          "wednesday": { "type": "easy_run",        "description": "9.6 km" },
          "thursday":  { "type": "easy_run",        "description": "6.4 km + 8 x 8-sec hill sprint" },
          "friday":    { "type": "progression_run", "description": "11.2 km w/ 18 min @ marathon pace", "progression_format": "marathon_pace_progression" },
          "saturday":  { "type": "rest",            "description": "Rest" }
        }
      },
      {
        "week": 16,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "hard_long_run",    "description": "22.4 km @ marathon pace + 12 sec/km" },
          "monday":    { "type": "rest",             "description": "Rest" },
          "tuesday":   { "type": "ladder_intervals", "description": "3.2 km easy + 1 min, 2 min, 3 min, 2 min, 1 min, 2 min, 3 min @ 3K-10K pace w/ equal-duration active recoveries + 3.2 km easy", "interval_format": "ladder" },
          "wednesday": { "type": "easy_run",         "description": "12.8 km" },
          "thursday":  { "type": "easy_run",         "description": "6.4 km + 8 x 10-sec hill sprint" },
          "friday":    { "type": "progression_run",  "description": "12.8 km, last 15 min @ marathon pace", "progression_format": "marathon_pace_progression" },
          "saturday":  { "type": "rest",             "description": "Rest" }
        }
      },
      {
        "week": 17,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run", "description": "35.2 km, last 20 min hard", "progression_format": "hard" },
          "monday":    { "type": "rest",            "description": "Rest" },
          "tuesday":   { "type": "threshold_run",   "description": "3.2 km easy + 2 x 15 min @ half-marathon/10K pace w/ 1-min active recovery + 3.2 km easy", "threshold_tier": "T2-T3", "threshold_format": "two_intervals" },
          "wednesday": { "type": "easy_run",        "description": "9.6 km" },
          "thursday":  { "type": "easy_run",        "description": "6.4 km + 8 x 10-sec hill sprint" },
          "friday":    { "type": "threshold_run",   "description": "3.2 km easy + 9.6 km @ marathon/half-marathon pace + 3.2 km easy", "threshold_tier": "T1-T2", "threshold_format": "one_interval" },
          "saturday":  { "type": "rest",            "description": "Rest" }
        }
      },
      {
        "week": 18,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "long_run",        "description": "36.8 km easy" },
          "monday":    { "type": "rest",            "description": "Rest" },
          "tuesday":   { "type": "easy_run",        "description": "6.4 km" },
          "wednesday": { "type": "threshold_run",   "description": "3.2 km easy + 6.4 km @ half-marathon pace + 3 min easy + 4 x 1.6 km @ half-marathon/10K pace w/ 3-min active recoveries + 3.2 km easy", "threshold_tier": "T2", "threshold_format": "one_interval", "interval_format": "add_on" },
          "thursday":  { "type": "easy_run",        "description": "6.4 km + 8 x 10-sec hill sprint" },
          "friday":    { "type": "progression_run", "description": "16 km, last 6.4 km moderate", "progression_format": "long_run_progression" },
          "saturday":  { "type": "rest",            "description": "Rest" }
        }
      },
      {
        "week": 19,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "hard_long_run",      "description": "3.2 km easy + 22.4 km @ marathon pace + 12 sec/km + 3.2 km easy" },
          "monday":    { "type": "easy_run",           "description": "8 km" },
          "tuesday":   { "type": "threshold_run",      "description": "3.2 km easy + 2 x 10 min @ half-marathon pace w/ 2-min active recovery + 4.8 km easy", "threshold_tier": "T2", "threshold_format": "two_intervals" },
          "wednesday": { "type": "rest",               "description": "Rest" },
          "thursday":  { "type": "easy_run",           "description": "6.4 km + 10 x 10-sec hill sprint" },
          "friday":    { "type": "marathon_pace_run",  "description": "3.2 km easy + 12.8 km @ marathon pace + 3 sec/km + 1.6 km easy" },
          "saturday":  { "type": "rest",               "description": "Rest" }
        }
      },
      {
        "week": 20,
        "training_phase": "taper",
        "days": {
          "sunday":    { "type": "hard_long_run",      "description": "16 km @ marathon pace + 12 sec/km" },
          "monday":    { "type": "rest",               "description": "Rest" },
          "tuesday":   { "type": "marathon_pace_run",  "description": "3.2 km easy + 6.4 km @ marathon pace + 1.6 km easy" },
          "wednesday": { "type": "rest",               "description": "Rest" },
          "thursday":  { "type": "easy_run",           "description": "6.4 km" },
          "friday":    { "type": "easy_run",           "description": "6.4 km" },
          "saturday":  { "type": "goal_race",          "description": "Marathon Goal Race" }
        }
      }
    ]
  }
}
```
