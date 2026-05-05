# Marathon Level 2 Training Plan

## Overview

- **Distance:** Marathon
- **Level:** 2 (Moderate Volume)
- **Duration:** 20 weeks
- **Weekly Volume:** Ranges from 5 runs / 67.2 km (Week 1) to 6 runs / 94.4 km (Week 17)
- **Description:** Moderate-volume plan for more experienced and competitive runners.

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

**This Marathon Level 2 plan applies to the `competitive` profile.**

| Runner Profile | Code | Recommended Plan Level | Description |
|---|---|---|---|
| Beginner | `beginner` | Level 1 | New to running or returning after a long break |
| Low-Key | `low_key` | Level 1 | Runs regularly but prefers low mileage |
| Competitive | `competitive` | **Level 2** | More experienced, races regularly |
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

> This file contains **only the Marathon Level 2 plan**. A runner whose profile maps to Level 1 or Level 3 should use the corresponding Marathon Level 1 or Level 3 plan file.

## Workout Type Glossary

| Code | Description |
|---|---|
| `long_run` | Long, easy-paced run |
| `easy_run` | Easy-paced run |
| `moderate_run` | **New for marathon plans.** Sustained moderate-pace run (faster than easy, slower than threshold). Used liberally in Marathon Level 2/3 to add aerobic stimulus without the recovery cost of a true threshold workout. |
| `progression_run` | Easy run that finishes with a moderate, hard, or marathon-pace segment. Has 7 sub-formats. |
| `xtrain_or_rest` | Cross-training **or** rest — runner's choice |
| `xtrain` | Specific cross-training session prescribed |
| `rest` | Full rest day |
| `fartlek` | Easy run with embedded faster surges. Has 4 sub-formats. |
| `hill_repetitions` | Uphill repetitions at hard effort with jog-back recoveries |
| `threshold_run` | Run with a sustained segment at a threshold pace (T1, T2, or T3) |
| `marathon_pace_run` | **Marathon-specific.** Sustained block(s) at marathon pace, the marathon runner's primary specific-endurance workout. |
| `hard_long_run` | **Marathon-specific.** Long run at marathon pace or slightly slower (e.g. `+12 sec/km`). Race-pace endurance over a long distance. |
| `speed_intervals` | Short, fast repetition intervals (e.g. `15 × 1 min @ 5K pace`) targeting neuromuscular speed and economy. For marathon runners, these are speed-supportive — well outside the ±10% SE pace range from MP. |
| `specific_endurance_intervals` | Repetition intervals at race-distance pace (5K, 10K) |
| `ladder_intervals` | Intervals of varying distance/duration run consecutively |
| `spec_test` | Marathon spec test format used in this plan: `21 km @ marathon goal pace` (a half-marathon at goal pace as a fitness check). See note below — the source generally states marathon spec tests are unreliable, but this plan includes one. |
| `tune_up_race` | A race or time trial run mid-cycle as a fitness check, **not** the goal race. This plan uses a 10K tune-up race in Week 9. |
| `goal_race` | The target race the plan is built around |

> **Note on marathon spec tests.** The source text states "there is really no way to perform an effective specific-endurance test for the marathon." However, this Level 2 plan does include a `spec_test` workout in Week 15 (`21 km @ marathon goal pace`) and a `tune_up_race` in Week 9 (`10K race or time trial`). Treat these as approximate fitness checks, not definitive predictors — and don't expect them in every marathon plan.

## Threshold Pace Reference

For marathon runners, marathon pace itself sits at the T1 threshold tier. The source treats sustained marathon-pace runs as **specific-endurance work** (via `marathon_pace_run` and `hard_long_run`), not threshold work.

| Pace ID | Sustainable for... | Elite proxy | Sub-elite proxy |
|---|---|---|---|
| **T1** | ~2.5 hours | A bit slower than marathon pace | Marathon pace or slightly faster |
| **T2** | ~90 minutes | A bit faster than marathon pace | Half-marathon pace |
| **T3** | ~60 minutes | Half-marathon pace or a bit faster | A bit slower than 10K pace |

In this Marathon Level 2 plan:

| Source description | Threshold tier |
|---|---|
| "marathon pace" | **T1** |
| "marathon/half-marathon pace" | T1–T2 |
| "half-marathon pace" | **T2** |
| "half-marathon/10K pace" | T2–T3 |
| "10K pace" | **T3** |

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
    "half-marathon/10K pace":     "T2-T3",
    "10K pace":                   "T3"
  }
}
```

## Diagnostic Checkpoints

This plan includes **two explicit diagnostic checkpoints**:

| Week | Day | Workout | Type |
|---|---|---|---|
| 9 | Saturday | 10K Race or Time Trial — 3.2 km easy + 10K race or time trial + 3.2 km easy | `tune_up_race` |
| 15 | Sunday | SpecTest — 3.2 km easy + 21 km @ marathon goal pace + 3.2 km easy | `spec_test` |

The Week 15 spec test is essentially a **half-marathon dress rehearsal at marathon goal pace** — it's the closest the source comes to a true marathon fitness test.

## Training Phases

In this Marathon Level 2 plan: **Weeks 1–6 = `fundamental`, Weeks 7–19 = `sharpening`, Week 20 = `taper`**. Sharpening starts in Week 7 when the first threshold run and first `hard_long_run` both appear. The 13-week sharpening period is the longest in any plan we've built — marathons are largely about accumulating race-specific endurance over many weeks.

---

## Fartlek Format Reference

| Format | Example | Best Use |
|---|---|---|
| `speed_fartlek` | `12.8 km easy w/ 8 × 20 sec @ 3K pace` | Introductory & early fundamental |
| `race_pace_fartlek` | `8 × 3 min @ HM pace / 2 min easy` | Late fundamental & sharpening |
| `single_block_fartlek` | `6.4 km w/ 1.6 km @ 5K pace / 1 min easy` | One sustained surge in an easy run |
| `mixed_pace_fartlek` | `6 min @ 10K pace + 4 min easy + 4 × 1 min @ 5K pace` | Sharpening |

This plan uses `speed_fartlek` (Weeks 3–5, 8) and `race_pace_fartlek` (Weeks 12, 14, 16).

---

## Progression Run Format Reference

| Format | Example | Best Use |
|---|---|---|
| `moderate` | `9.6 km easy + 20 min moderate` | Introductory; later, adds extra hard work |
| `moderate_uphill` | `9.6 km easy + 20 min moderate (uphill if possible)` | Introductory; aerobic + strength |
| `hard` | `9.6 km easy + 20 min hard` | Late fundamental |
| `hard_uphill` | `9.6 km easy + 20 min hard (uphill if possible)` | Fundamental |
| `long_run_progression` | `19.2 km easy + 30 min moderate` | Throughout cycle; transforms general into race-specific endurance |
| `fartlek_progression` | `3.2 km easy + 6.4 km intervals + 3.2 km hard` | Late fundamental |
| `marathon_pace_progression` | `11.2 km easy + 20 min @ marathon pace` | Race-pace stimulus inside a longer run |

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
| `one_interval` | `3.2 km easy + 6.4 km @ HM pace + 3.2 km easy` | Shorter early, longer late |
| `two_intervals` | `3.2 km easy + 15 min @ HM pace + 3.2 km easy + 15 min @ 10K pace + 3.2 km easy` | More total threshold time with recovery |
| `three_intervals` | All three threshold tiers in one workout | Hits T1, T2, T3 |
| `multi_interval` | `4 × 6 min @ HM pace w/ 1-min recoveries` | More than three blocks at a single pace |

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

For marathon runners, specific-endurance training takes a different shape than for shorter distances:

- **Marathon runners:** **`hard_long_run` and `marathon_pace_run` workouts** are the primary vehicle. Long runs at MP+12 sec/km and sustained MP blocks make up the bulk of race-specific work.

### The ±10% Pace Range

| Phase | Pace range vs. goal pace |
|---|---|
| `fundamental` | **±10%** |
| `sharpening`  | **±3–4%** |
| `taper`       | **±3–4%** |

For marathon runners, the ±10% range from goal MP includes marathon pace and the slow end of half-marathon pace — so threshold runs at HM pace and long runs at MP both count as specific-endurance work.

### How specific-endurance training progresses across the cycle

1. **Pace moves toward goal pace** — early sustained efforts at MP+12 sec/km; later at exact MP and even slightly faster.
2. **Volume of race-pace work per session increases** — `hard_long_run` grows from 16 km (W7) to 28.8 km (W19) at goal pace.
3. **Recoveries shorten or pace closes in on goal pace** — for marathon, "off" segments get faster (closer to MP).

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
| Marathon | Low-Key Competitive (`low_key`) | 32–35.2 km easy | |
| Marathon | Competitive (`competitive`) | 16 km easy + 16 km @ marathon pace | ←|
| Marathon | Highly Competitive (`highly_competitive`) | 45 min easy + 20K: 1K on/1K off (on = marathon goal pace, off = marathon pace + 3–6 sec/km) | |

The arrow (←) marks the row applicable to **this plan** (Marathon Competitive). This plan reaches that target through Week 19's `hard_long_run` (`28.8 km @ marathon pace + 12-19 sec/km`) and Week 17's `24 km @ marathon pace + 6 sec/km` — both close approximations of the source's "16 km easy + 16 km @ MP" peak workout.

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
    "primary_vehicles_note": "For marathon runners, specific-endurance work happens through sustained efforts at or near marathon pace over long distances — not through short fast intervals.",
    "marathon_diagnostic_note": "The source generally states there is no effective specific-endurance test for the marathon. However, some plans (including this one) include approximate fitness checks like a tune-up 10K race and a half-marathon at goal MP."
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

This plan uses `repetition` (Weeks 7, 9, 11) and `ladder` (Weeks 10, 17, 19).

---

## Weekly Schedule

### Week 1

| Day | Workout |
|---|---|
| Sunday | Long Run — 19.2 km easy |
| Monday | Easy Run — 9.6 km + 1 × 8-sec. hill sprint |
| Tuesday | X-Train or Rest |
| Wednesday | Progression Run — 16 km, last 5 min. moderate |
| Thursday | Easy Run — 9.6 km + 1 × 8-sec. hill sprint |
| Friday | Progression Run — 12.8 km, last 10 min. moderate |
| Saturday | Rest |

### Week 2

| Day | Workout |
|---|---|
| Sunday | Long Run — 22.4 km easy |
| Monday | Easy Run — 9.6 km + 2 × 8-sec. hill sprint |
| Tuesday | X-Train or Rest |
| Wednesday | Progression Run — 19.2 km, last 6 min. moderate |
| Thursday | Easy Run — 9.6 km + 2 × 8-sec. hill sprint |
| Friday | Progression Run — 12.8 km, last 10 min. moderate |
| Saturday | Rest |

### Week 3

| Day | Workout |
|---|---|
| Sunday | Long Run — 25.6 km easy |
| Monday | X-Train or Rest |
| Tuesday | Fartlek Run — 12.8 km easy w/ 8 × 20 sec. @ 3K pace |
| Wednesday | Easy Run — 16 km |
| Thursday | Easy Run — 6.4 km + 6 × 8-sec. hill sprint |
| Friday | Progression Run — 9.6 km, last 15 min. moderate |
| Saturday | Rest |

### Week 4

| Day | Workout |
|---|---|
| Sunday | Progression Run — 22.4 km, last 20 min. moderate (uphill, if possible) |
| Monday | Easy Run — 6.4 km |
| Tuesday | Fartlek Run — 16 km easy w/ 8 × 25 sec. @ 3K pace |
| Wednesday | Easy Run — 17.6 km |
| Thursday | Easy Run — 9.6 km + 8 × 8-sec. hill sprint |
| Friday | Progression Run — 14.4 km, last 15 min. moderate |
| Saturday | Rest |

### Week 5

| Day | Workout |
|---|---|
| Sunday | Progression Run — 24 km, last 30 min. moderate (uphill, if possible) |
| Monday | X-Train or Rest |
| Tuesday | Fartlek Run — 16 km easy w/ 8 × 30 sec. @ 5K–3K pace |
| Wednesday | Easy Run — 16 km |
| Thursday | Easy Run — 9.6 km + 10 × 8-sec. hill sprint |
| Friday | Progression Run — 3.2 km easy + 9.6 km moderate + 3.2 km easy |
| Saturday | Rest |

### Week 6

| Day | Workout |
|---|---|
| Sunday | Long Run — 27.2 km easy |
| Monday | Easy Run — 9.6 km |
| Tuesday | Hill Repetitions — 3.2 km easy + 6 × 1 min. uphill @ 3K effort w/ jog-back recoveries + 3.2 km easy |
| Wednesday | Progression Run — 16 km, last 9.6 km moderate |
| Thursday | Easy Run — 9.6 km + 10 × 8-sec. hill sprint |
| Friday | Easy Run — 12.8 km |
| Saturday | Rest |

### Week 7

| Day | Workout |
|---|---|
| Sunday | Hard Long Run — 1.6 km easy + 16 km @ marathon pace + 6–12 sec/km + 1.6 km easy |
| Monday | Easy Run — 8 km |
| Tuesday | Speed Intervals — 3.2 km easy + 15 × 1 min. @ 5K pace / 1 min. easy + 4.8 km easy |
| Wednesday | Easy Run — 16 km |
| Thursday | Easy Run — 9.6 km + 10 × 8-sec. hill sprint |
| Friday | Threshold Run — 3.2 km easy + 2 × 15 min. @ half-marathon pace w/ 2-min. active recovery + 4.8 km easy |
| Saturday | Rest |

### Week 8

| Day | Workout |
|---|---|
| Sunday | Progression Run — 25.6 km, last 30 min. hard (uphill, if possible) |
| Monday | Easy Run — 6.4 km |
| Tuesday | Hill Repetitions — 3.2 km easy + 6 × 2 min. uphill @ 10K effort w/ jog-back recoveries + 3.2 km easy |
| Wednesday | Progression Run — 16 km, last 12.8 km hard |
| Thursday | Easy Run — 12.8 km + 10 × 8-sec. hill sprint |
| Friday | Threshold Run — 3.2 km easy + 9.6 km @ half-marathon pace + 3.2 km easy |
| Saturday | Rest |

### Week 9

| Day | Workout |
|---|---|
| Sunday | Fartlek Run + Progression — 9.6 km easy + 8 km: 1 min. @ 10K pace / 1 min. easy + 1.6 km easy + 3.2 km hard |
| Monday | Easy Run — 9.6 km |
| Tuesday | Specific-Endurance Intervals — 3.2 km easy + 3 × 1.6 km @ 10K–5K pace w/ 400m jog recoveries + 4.8 km easy |
| Wednesday | Rest |
| Thursday | Easy Run — 16 km |
| Friday | Easy Run — 9.6 km |
| Saturday | Tune-Up Race — 3.2 km easy + 10K race or time trial + 3.2 km easy *(mid-cycle fitness check, not the goal race)* |

### Week 10

| Day | Workout |
|---|---|
| Sunday | Long Run — 12.8 km easy |
| Monday | Easy Run — 11.2 km |
| Tuesday | Easy Run — 16 km |
| Wednesday | Fartlek Run — 16 km easy w/ 30 sec. @ 5K pace every 3 min. |
| Thursday | Easy Run — 12.8 km + 10 × 8-sec. hill sprint |
| Friday | Ladder Intervals — 3.2 km easy + 1 min, 2 min, 3 min, 2 min, 1 min, 2 min, 3 min @ 3K–10K pace w/ equal-duration active recoveries + 3.2 km easy |
| Saturday | Easy Run — 12.8 km |

### Week 11

| Day | Workout |
|---|---|
| Sunday | Fartlek Run + Progression — 9.6 km easy + 8 km: 90 sec. @ 10K pace / 90 sec. easy + 3.2 km easy + 4.8 km hard |
| Monday | Easy Run — 9.6 km |
| Tuesday | Specific-Endurance Intervals — 3.2 km easy + 4 × 1.6 km @ 10K pace w/ 3-min. active recoveries + 3.2 km easy |
| Wednesday | Easy Run — 19.2 km |
| Thursday | Easy Run — 9.6 km + 8 × 8-sec. hill sprint |
| Friday | Progression Run — 16 km, last 15 min. moderate |
| Saturday | Rest |

### Week 12

| Day | Workout |
|---|---|
| Sunday | Long Run — 27.2 km easy |
| Monday | Rest |
| Tuesday | Threshold Run — 3.2 km easy + 9.6 km @ marathon/half-marathon pace + 3.2 km easy |
| Wednesday | Easy Run — 14.4 km |
| Thursday | Easy Run — 6.4 km |
| Friday | Fartlek Run — 16 km easy w/ 2 min. @ 10K pace every 5 min. |
| Saturday | Rest |

### Week 13

| Day | Workout |
|---|---|
| Sunday | Hard Long Run — 3.2 km easy + 22.4 km @ marathon pace + 6–12 sec/km + 3.2 km easy |
| Monday | Easy Run — 6.4 km |
| Tuesday | Easy Run — 12.8 km |
| Wednesday | Easy Run — 19.2 km |
| Thursday | Easy Run — 6.4 km + 10 × 8-sec. hill sprint |
| Friday | Threshold Run — 3.2 km easy + 3 × 10 min. @ half-marathon pace w/ 3-min. active recoveries + 4.8 km easy |
| Saturday | Rest |

### Week 14

| Day | Workout |
|---|---|
| Sunday | Long Run — 32 km easy |
| Monday | Easy Run — 8 km |
| Tuesday | Fartlek Run — 4.8 km easy + 8 × 3 min. @ half-marathon pace / 2 min. easy + 4.8 km easy |
| Wednesday | Easy Run — 19.2 km |
| Thursday | Easy Run — 12.8 km + 4 × 8-sec. hill sprint |
| Friday | Fartlek Run — 6.4 km easy w/ 6 × 30 sec. @ 5K–3K pace |
| Saturday | Rest |

### Week 15

| Day | Workout |
|---|---|
| Sunday | SpecTest — 3.2 km easy + 21 km @ marathon goal pace + 3.2 km easy |
| Monday | Rest |
| Tuesday | Easy Run — 11.2 km |
| Wednesday | Easy Run — 16 km easy w/ 10 × 30 sec. @ 10K–3K pace |
| Thursday | Easy Run — 6.4 km |
| Friday | Progression Run — 4.8 km easy + 9.6 km moderate + 3.2 km easy |
| Saturday | Rest |

### Week 16

| Day | Workout |
|---|---|
| Sunday | Long Run — 35.2 km easy |
| Monday | Easy Run — 8 km + 10 × 10-sec. hill sprint |
| Tuesday | Easy Run — 12.8 km |
| Wednesday | Fartlek Run — 16 km easy w/ 3 min. @ 10K pace every 5 min. |
| Thursday | Easy Run — 6.4 km |
| Friday | Moderate Run — 16 km |
| Saturday | Rest |

### Week 17

| Day | Workout |
|---|---|
| Sunday | Hard Long Run — 3.2 km easy + 24 km @ marathon pace + 6 sec/km + 4.8 km easy |
| Monday | Easy Run — 9.6 km + 10 × 10-sec. hill sprint |
| Tuesday | Ladder Intervals — 3.2 km easy + 1 min, 2 min, 3 min, 2 min, 1 min, 2 min, 3 min @ 3K–10K pace w/ equal-duration jog recoveries + 3.2 km easy |
| Wednesday | Easy Run — 19.2 km |
| Thursday | Easy Run — 6.4 km |
| Friday | Progression Run — 14.4 km, last 9.6 km accelerate from marathon pace + 12 sec/km to marathon pace |
| Saturday | Rest |

### Week 18

| Day | Workout |
|---|---|
| Sunday | Long Run — 36.8 km easy |
| Monday | Rest |
| Tuesday | Threshold Run — 3.2 km easy + 2 × 15 min. @ half-marathon pace w/ 3-min. active recovery + 3.2 km easy |
| Wednesday | Moderate Run — 19.2 km |
| Thursday | Easy Run — 8 km + 8 × 10-sec. hill sprint |
| Friday | Marathon-Pace Run — 1.6 km easy + 12.8 km @ marathon pace + 1.6 km easy |
| Saturday | Easy Run — 6.4 km |

### Week 19

| Day | Workout |
|---|---|
| Sunday | Hard Long Run — 28.8 km @ marathon pace + 12–19 sec/km |
| Monday | Easy Run — 6.4 km + 8 × 10-sec. hill sprint |
| Tuesday | Ladder Intervals — 3.2 km easy + 1 min, 2 min, 3 min, 2 min, 1 min, 2 min, 3 min @ 3K–10K pace w/ equal-duration active recoveries + 3.2 km easy |
| Wednesday | Moderate Run — 9.6 km |
| Thursday | Easy Run — 6.4 km |
| Friday | Marathon-Pace Run — 3.2 km easy + 2 × 6.4 km @ marathon pace w/ 5-min. active recovery + 1.6 km easy |
| Saturday | Rest |

### Week 20

| Day | Workout |
|---|---|
| Sunday | Long Run — 20.8 km easy |
| Monday | Easy Run — 11.2 km + 6 × 10-sec. hill sprint |
| Tuesday | Marathon-Pace Run — 3.2 km easy + 6.4 km @ marathon pace − 6 sec/km + 4.8 km easy |
| Wednesday | Easy Run — 9.6 km |
| Thursday | Easy Run — 8 km |
| Friday | Easy Run — 6.4 km |
| Saturday | **Goal Race — Marathon** |

> **Race day note:** The source's printed plan shows Week 20 Saturday as "Rest" and the marathon on the following day (Sunday). For schema consistency with all other plans, this file places the `goal_race` on Saturday of Week 20. If the runner's actual race is on Sunday, they should treat Saturday as a rest day and run the race the following day.

---

## Structured Data (JSON)

```json
{
  "plan": {
    "distance": "Marathon",
    "level": 2,
    "level_name": "Moderate Volume",
    "duration_weeks": 20,
    "applies_to_runner_profiles": ["competitive"],
    "weekly_volume": {
      "min_runs": 5,
      "max_runs": 6,
      "min_miles": 42,
      "max_miles": 59
    },
    "race_day_of_week": "weekend",
    "race_day_note": "The source plan shows Week 20 Saturday as 'Rest' and the marathon on the following Sunday. For schema consistency with other plans, this file places the goal_race on Saturday Week 20.",
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
      "marathon_diagnostic_note": "Source generally states no effective marathon SE test exists, but this plan includes a 10K tune-up race (W9) and a 21-km-at-MP spec test (W15) as approximate fitness checks."
    },
    "weeks": [
      {
        "week": 1,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "long_run",        "description": "19.2 km easy" },
          "monday":    { "type": "easy_run",        "description": "9.6 km + 1 x 8-sec hill sprint" },
          "tuesday":   { "type": "xtrain_or_rest",  "description": "X-Train or Rest" },
          "wednesday": { "type": "progression_run", "description": "16 km, last 5 min moderate", "progression_format": "moderate" },
          "thursday":  { "type": "easy_run",        "description": "9.6 km + 1 x 8-sec hill sprint" },
          "friday":    { "type": "progression_run", "description": "12.8 km, last 10 min moderate", "progression_format": "moderate" },
          "saturday":  { "type": "rest",            "description": "Rest" }
        }
      },
      {
        "week": 2,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "long_run",        "description": "22.4 km easy" },
          "monday":    { "type": "easy_run",        "description": "9.6 km + 2 x 8-sec hill sprint" },
          "tuesday":   { "type": "xtrain_or_rest",  "description": "X-Train or Rest" },
          "wednesday": { "type": "progression_run", "description": "19.2 km, last 6 min moderate", "progression_format": "moderate" },
          "thursday":  { "type": "easy_run",        "description": "9.6 km + 2 x 8-sec hill sprint" },
          "friday":    { "type": "progression_run", "description": "12.8 km, last 10 min moderate", "progression_format": "moderate" },
          "saturday":  { "type": "rest",            "description": "Rest" }
        }
      },
      {
        "week": 3,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "long_run",        "description": "25.6 km easy" },
          "monday":    { "type": "xtrain_or_rest",  "description": "X-Train or Rest" },
          "tuesday":   { "type": "fartlek",         "description": "12.8 km easy w/ 8 x 20 sec @ 3K pace", "fartlek_format": "speed_fartlek" },
          "wednesday": { "type": "easy_run",        "description": "16 km" },
          "thursday":  { "type": "easy_run",        "description": "6.4 km + 6 x 8-sec hill sprint" },
          "friday":    { "type": "progression_run", "description": "9.6 km, last 15 min moderate", "progression_format": "moderate" },
          "saturday":  { "type": "rest",            "description": "Rest" }
        }
      },
      {
        "week": 4,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "22.4 km, last 20 min moderate (uphill if possible)", "progression_format": "long_run_progression" },
          "monday":    { "type": "easy_run",        "description": "6.4 km" },
          "tuesday":   { "type": "fartlek",         "description": "16 km easy w/ 8 x 25 sec @ 3K pace", "fartlek_format": "speed_fartlek" },
          "wednesday": { "type": "easy_run",        "description": "17.6 km" },
          "thursday":  { "type": "easy_run",        "description": "9.6 km + 8 x 8-sec hill sprint" },
          "friday":    { "type": "progression_run", "description": "14.4 km, last 15 min moderate", "progression_format": "moderate" },
          "saturday":  { "type": "rest",            "description": "Rest" }
        }
      },
      {
        "week": 5,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "24 km, last 30 min moderate (uphill if possible)", "progression_format": "long_run_progression" },
          "monday":    { "type": "xtrain_or_rest",  "description": "X-Train or Rest" },
          "tuesday":   { "type": "fartlek",         "description": "16 km easy w/ 8 x 30 sec @ 5K-3K pace", "fartlek_format": "speed_fartlek" },
          "wednesday": { "type": "easy_run",        "description": "16 km" },
          "thursday":  { "type": "easy_run",        "description": "9.6 km + 10 x 8-sec hill sprint" },
          "friday":    { "type": "progression_run", "description": "3.2 km easy + 9.6 km moderate + 3.2 km easy", "progression_format": "moderate" },
          "saturday":  { "type": "rest",            "description": "Rest" }
        }
      },
      {
        "week": 6,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "long_run",         "description": "27.2 km easy" },
          "monday":    { "type": "easy_run",         "description": "9.6 km" },
          "tuesday":   { "type": "hill_repetitions", "description": "3.2 km easy + 6 x 1 min uphill @ 3K effort w/ jog-back recoveries + 3.2 km easy" },
          "wednesday": { "type": "progression_run",  "description": "16 km, last 9.6 km moderate", "progression_format": "long_run_progression" },
          "thursday":  { "type": "easy_run",         "description": "9.6 km + 10 x 8-sec hill sprint" },
          "friday":    { "type": "easy_run",         "description": "12.8 km" },
          "saturday":  { "type": "rest",             "description": "Rest" }
        }
      },
      {
        "week": 7,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "hard_long_run",   "description": "1.6 km easy + 16 km @ marathon pace + 6-12 sec/km + 1.6 km easy" },
          "monday":    { "type": "easy_run",        "description": "8 km" },
          "tuesday":   { "type": "speed_intervals", "description": "3.2 km easy + 15 x 1 min @ 5K pace / 1 min easy + 4.8 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "easy_run",        "description": "16 km" },
          "thursday":  { "type": "easy_run",        "description": "9.6 km + 10 x 8-sec hill sprint" },
          "friday":    { "type": "threshold_run",   "description": "3.2 km easy + 2 x 15 min @ half-marathon pace w/ 2-min active recovery + 4.8 km easy", "threshold_tier": "T2", "threshold_format": "two_intervals" },
          "saturday":  { "type": "rest",            "description": "Rest" }
        }
      },
      {
        "week": 8,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "25.6 km, last 30 min hard (uphill if possible)", "progression_format": "hard_uphill" },
          "monday":    { "type": "easy_run",         "description": "6.4 km" },
          "tuesday":   { "type": "hill_repetitions", "description": "3.2 km easy + 6 x 2 min uphill @ 10K effort w/ jog-back recoveries + 3.2 km easy" },
          "wednesday": { "type": "progression_run",  "description": "16 km, last 12.8 km hard", "progression_format": "hard" },
          "thursday":  { "type": "easy_run",         "description": "12.8 km + 10 x 8-sec hill sprint" },
          "friday":    { "type": "threshold_run",    "description": "3.2 km easy + 9.6 km @ half-marathon pace + 3.2 km easy", "threshold_tier": "T2", "threshold_format": "one_interval" },
          "saturday":  { "type": "rest",             "description": "Rest" }
        }
      },
      {
        "week": 9,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",            "description": "9.6 km easy + 8 km: 1 min @ 10K pace / 1 min easy + 1.6 km easy + 3.2 km hard", "progression_format": "fartlek_progression" },
          "monday":    { "type": "easy_run",                   "description": "9.6 km" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "3.2 km easy + 3 x 1.6 km @ 10K-5K pace w/ 400m jog recoveries + 4.8 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "rest",                       "description": "Rest" },
          "thursday":  { "type": "easy_run",                   "description": "16 km" },
          "friday":    { "type": "easy_run",                   "description": "9.6 km" },
          "saturday":  { "type": "tune_up_race",               "description": "3.2 km easy + 10K race or time trial + 3.2 km easy", "purpose": "mid-cycle fitness check" }
        }
      },
      {
        "week": 10,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "long_run",         "description": "12.8 km easy" },
          "monday":    { "type": "easy_run",         "description": "11.2 km" },
          "tuesday":   { "type": "easy_run",         "description": "16 km" },
          "wednesday": { "type": "fartlek",          "description": "16 km easy w/ 30 sec @ 5K pace every 3 min", "fartlek_format": "race_pace_fartlek" },
          "thursday":  { "type": "easy_run",         "description": "12.8 km + 10 x 8-sec hill sprint" },
          "friday":    { "type": "ladder_intervals", "description": "3.2 km easy + 1 min, 2 min, 3 min, 2 min, 1 min, 2 min, 3 min @ 3K-10K pace w/ equal-duration active recoveries + 3.2 km easy", "interval_format": "ladder" },
          "saturday":  { "type": "easy_run",         "description": "12.8 km" }
        }
      },
      {
        "week": 11,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",            "description": "9.6 km easy + 8 km: 90 sec @ 10K pace / 90 sec easy + 3.2 km easy + 4.8 km hard", "progression_format": "fartlek_progression" },
          "monday":    { "type": "easy_run",                   "description": "9.6 km" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "3.2 km easy + 4 x 1.6 km @ 10K pace w/ 3-min active recoveries + 3.2 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "easy_run",                   "description": "19.2 km" },
          "thursday":  { "type": "easy_run",                   "description": "9.6 km + 8 x 8-sec hill sprint" },
          "friday":    { "type": "progression_run",            "description": "16 km, last 15 min moderate", "progression_format": "long_run_progression" },
          "saturday":  { "type": "rest",                       "description": "Rest" }
        }
      },
      {
        "week": 12,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "long_run",       "description": "27.2 km easy" },
          "monday":    { "type": "rest",           "description": "Rest" },
          "tuesday":   { "type": "threshold_run",  "description": "3.2 km easy + 9.6 km @ marathon/half-marathon pace + 3.2 km easy", "threshold_tier": "T1-T2", "threshold_format": "one_interval" },
          "wednesday": { "type": "easy_run",       "description": "14.4 km" },
          "thursday":  { "type": "easy_run",       "description": "6.4 km" },
          "friday":    { "type": "fartlek",        "description": "16 km easy w/ 2 min @ 10K pace every 5 min", "fartlek_format": "race_pace_fartlek" },
          "saturday":  { "type": "rest",           "description": "Rest" }
        }
      },
      {
        "week": 13,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "hard_long_run",  "description": "3.2 km easy + 22.4 km @ marathon pace + 6-12 sec/km + 3.2 km easy" },
          "monday":    { "type": "easy_run",       "description": "6.4 km" },
          "tuesday":   { "type": "easy_run",       "description": "12.8 km" },
          "wednesday": { "type": "easy_run",       "description": "19.2 km" },
          "thursday":  { "type": "easy_run",       "description": "6.4 km + 10 x 8-sec hill sprint" },
          "friday":    { "type": "threshold_run",  "description": "3.2 km easy + 3 x 10 min @ half-marathon pace w/ 3-min active recoveries + 4.8 km easy", "threshold_tier": "T2", "threshold_format": "multi_interval" },
          "saturday":  { "type": "rest",           "description": "Rest" }
        }
      },
      {
        "week": 14,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "long_run",       "description": "32 km easy" },
          "monday":    { "type": "easy_run",       "description": "8 km" },
          "tuesday":   { "type": "fartlek",        "description": "4.8 km easy + 8 x 3 min @ half-marathon pace / 2 min easy + 4.8 km easy", "fartlek_format": "race_pace_fartlek" },
          "wednesday": { "type": "easy_run",       "description": "19.2 km" },
          "thursday":  { "type": "easy_run",       "description": "12.8 km + 4 x 8-sec hill sprint" },
          "friday":    { "type": "fartlek",        "description": "6.4 km easy w/ 6 x 30 sec @ 5K-3K pace", "fartlek_format": "speed_fartlek" },
          "saturday":  { "type": "rest",           "description": "Rest" }
        }
      },
      {
        "week": 15,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "spec_test",      "description": "3.2 km easy + 21 km @ marathon goal pace + 3.2 km easy", "purpose": "marathon spec test (HM at goal MP)" },
          "monday":    { "type": "rest",           "description": "Rest" },
          "tuesday":   { "type": "easy_run",       "description": "11.2 km" },
          "wednesday": { "type": "fartlek",        "description": "16 km easy w/ 10 x 30 sec @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "thursday":  { "type": "easy_run",       "description": "6.4 km" },
          "friday":    { "type": "progression_run","description": "4.8 km easy + 9.6 km moderate + 3.2 km easy", "progression_format": "moderate" },
          "saturday":  { "type": "rest",           "description": "Rest" }
        }
      },
      {
        "week": 16,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "long_run",       "description": "35.2 km easy" },
          "monday":    { "type": "easy_run",       "description": "8 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "easy_run",       "description": "12.8 km" },
          "wednesday": { "type": "fartlek",        "description": "16 km easy w/ 3 min @ 10K pace every 5 min", "fartlek_format": "race_pace_fartlek" },
          "thursday":  { "type": "easy_run",       "description": "6.4 km" },
          "friday":    { "type": "moderate_run",   "description": "16 km" },
          "saturday":  { "type": "rest",           "description": "Rest" }
        }
      },
      {
        "week": 17,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "hard_long_run",    "description": "3.2 km easy + 24 km @ marathon pace + 6 sec/km + 4.8 km easy" },
          "monday":    { "type": "easy_run",         "description": "9.6 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "ladder_intervals", "description": "3.2 km easy + 1 min, 2 min, 3 min, 2 min, 1 min, 2 min, 3 min @ 3K-10K pace w/ equal-duration jog recoveries + 3.2 km easy", "interval_format": "ladder" },
          "wednesday": { "type": "easy_run",         "description": "19.2 km" },
          "thursday":  { "type": "easy_run",         "description": "6.4 km" },
          "friday":    { "type": "progression_run",  "description": "14.4 km, last 9.6 km accelerate from marathon pace + 12 sec/km to marathon pace", "progression_format": "marathon_pace_progression" },
          "saturday":  { "type": "rest",             "description": "Rest" }
        }
      },
      {
        "week": 18,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "long_run",          "description": "36.8 km easy" },
          "monday":    { "type": "rest",              "description": "Rest" },
          "tuesday":   { "type": "threshold_run",     "description": "3.2 km easy + 2 x 15 min @ half-marathon pace w/ 3-min active recovery + 3.2 km easy", "threshold_tier": "T2", "threshold_format": "two_intervals" },
          "wednesday": { "type": "moderate_run",      "description": "19.2 km" },
          "thursday":  { "type": "easy_run",          "description": "8 km + 8 x 10-sec hill sprint" },
          "friday":    { "type": "marathon_pace_run", "description": "1.6 km easy + 12.8 km @ marathon pace + 1.6 km easy" },
          "saturday":  { "type": "easy_run",          "description": "6.4 km" }
        }
      },
      {
        "week": 19,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "hard_long_run",     "description": "28.8 km @ marathon pace + 12-19 sec/km" },
          "monday":    { "type": "easy_run",          "description": "6.4 km + 8 x 10-sec hill sprint" },
          "tuesday":   { "type": "ladder_intervals",  "description": "3.2 km easy + 1 min, 2 min, 3 min, 2 min, 1 min, 2 min, 3 min @ 3K-10K pace w/ equal-duration active recoveries + 3.2 km easy", "interval_format": "ladder" },
          "wednesday": { "type": "moderate_run",      "description": "9.6 km" },
          "thursday":  { "type": "easy_run",          "description": "6.4 km" },
          "friday":    { "type": "marathon_pace_run", "description": "3.2 km easy + 2 x 6.4 km @ marathon pace w/ 5-min active recovery + 1.6 km easy" },
          "saturday":  { "type": "rest",              "description": "Rest" }
        }
      },
      {
        "week": 20,
        "training_phase": "taper",
        "days": {
          "sunday":    { "type": "long_run",          "description": "20.8 km easy" },
          "monday":    { "type": "easy_run",          "description": "11.2 km + 6 x 10-sec hill sprint" },
          "tuesday":   { "type": "marathon_pace_run", "description": "3.2 km easy + 6.4 km @ marathon pace - 6 sec/km + 4.8 km easy" },
          "wednesday": { "type": "easy_run",          "description": "9.6 km" },
          "thursday":  { "type": "easy_run",          "description": "8 km" },
          "friday":    { "type": "easy_run",          "description": "6.4 km" },
          "saturday":  { "type": "goal_race",         "description": "Marathon Goal Race" }
        }
      }
    ]
  }
}
```
