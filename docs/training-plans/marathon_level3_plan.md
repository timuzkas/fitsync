# Marathon Level 3 Training Plan

## Overview

- **Distance:** Marathon
- **Level:** 3 (High Mileage)
- **Duration:** 20 weeks
- **Weekly Volume:** Ranges from 7 runs / 89.6 km (Week 1) to 7 runs / roughly 139.2 km (Week 17)
- **Description:** High-mileage plan for highly competitive runners.

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

**This Marathon Level 3 plan applies to the `highly_competitive` and `elite` profiles.**

| Runner Profile | Code | Recommended Plan Level | Description |
|---|---|---|---|
| Beginner | `beginner` | Level 1 | New to running or returning after a long break |
| Low-Key | `low_key` | Level 1 | Runs regularly but prefers low mileage |
| Competitive | `competitive` | Level 2 | More experienced, races regularly |
| Highly Competitive | `highly_competitive` | **Level 3** | Trains seriously, prioritizes performance |
| Elite | `elite` | **Level 3** | Top-tier competitor |

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

> This file contains **only the Marathon Level 3 plan**. A runner whose profile maps to Level 1 or Level 2 should use the corresponding Marathon Level 1 or Level 2 plan file.

## Workout Type Glossary

| Code | Description |
|---|---|
| `long_run` | Long, easy-paced run |
| `easy_run` | Easy-paced run. May contain AM and PM sessions on the same day (see Week 18 Saturday). |
| `moderate_run` | Sustained moderate-pace run (faster than easy, slower than threshold). |
| `progression_run` | Easy run that finishes with a moderate, hard, or marathon-pace segment. Has 7 sub-formats. |
| `xtrain_or_rest` | Cross-training **or** rest — runner's choice |
| `xtrain` | Specific cross-training session prescribed |
| `rest` | Full rest day |
| `fartlek` | Easy run with embedded faster surges. Has 4 sub-formats. |
| `hill_repetitions` | Uphill repetitions at hard effort with jog-back recoveries |
| `threshold_run` | Run with a sustained segment at a threshold pace (T1, T2, or T3) |
| `marathon_pace_run` | Sustained block(s) at marathon pace, the marathon runner's primary specific-endurance workout. |
| `hard_long_run` | Long run at marathon pace or slightly slower (e.g. `+12 sec/km` or "10% off MP"). Race-pace endurance over a long distance. |
| `specific_endurance_long_run` | **New for marathon plans.** Long run structured as a 45–60 min easy "warmup" followed by repeated **on/off cycles** of faster and slower running. The signature peak-cycle workout for high-mileage marathon runners. See "Specific-Endurance Long Run Reference" below. |
| `speed_intervals` | Short, fast repetition intervals targeting neuromuscular speed. |
| `specific_endurance_intervals` | Repetition intervals at race-distance pace (5K, 10K) |
| `ladder_intervals` | Intervals of varying distance/duration run consecutively |
| `time_trial` | Maximum-effort timed run over a fixed distance |
| `spec_test` | Diagnostic spec test workout |
| `tune_up_race` | A race or time trial run mid-cycle as a fitness check, **not** the goal race. This plan uses both a 10K/15K race (Week 8) and a half-marathon race (Week 16). |
| `goal_race` | The target race the plan is built around |

## Threshold Pace Reference

For marathon runners, marathon pace itself sits at the T1 threshold tier. The source treats sustained marathon-pace runs as **specific-endurance work**, not threshold work.

| Pace ID | Sustainable for... | Elite proxy | Sub-elite proxy |
|---|---|---|---|
| **T1** | ~2.5 hours | A bit slower than marathon pace | Marathon pace or slightly faster |
| **T2** | ~90 minutes | A bit faster than marathon pace | Half-marathon pace |
| **T3** | ~60 minutes | Half-marathon pace or a bit faster | A bit slower than 10K pace |

In this Marathon Level 3 plan:

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

This plan includes **three diagnostic checkpoints** — the densest of any marathon plan:

| Week | Day | Workout | Type |
|---|---|---|---|
| 4 | Friday | Time Trial — 3.2 km easy + 6.4 km @ maximum effort + 3.2 km easy | `time_trial` |
| 8 | Sunday | Race — 10K or 15K | `tune_up_race` |
| 16 | Sunday | Half-Marathon Race or Time Trial | `tune_up_race` |

Spaced roughly every 4–8 weeks, providing fitness data points throughout the cycle.

## Training Phases

In this Marathon Level 3 plan: **Weeks 1–5 = `fundamental`, Weeks 6–19 = `sharpening`, Week 20 = `taper`**. Sharpening starts in Week 6 with the first threshold run. The 14-week sharpening period is the longest in any plan — high-mileage marathon training requires sustained accumulation of race-specific work.

---

## Specific-Endurance Long Run Reference

The **`specific_endurance_long_run`** is the signature workout of high-mileage marathon training. The format follows a specific pattern:

> Very long "warmup" of 45 minutes to an hour, followed by **repeated on/off cycles** of faster and slower running. In your first such workout, run the "on" segments faster than marathon goal pace and the "off" segments quite a bit slower. **Progress by slightly slowing down the "on" pace and significantly increasing the "off" pace** — closing the gap between work and recovery as fitness builds.

The endpoint is a workout where the "off" segments are barely slower than goal MP, simulating the metabolic and mental challenge of holding race pace deep into the marathon distance.

### Source progression of SE long-run workouts (representative examples)

| Stage | Example workout |
|---|---|
| Early | `1-hour easy run + 10 min uphill @ goal MP` |
| Mid-fundamental | `30 min easy + (10 min @ goal MP / 1 min easy) × 4 + 10 min @ HM/10K pace` |
| Late fundamental | `90 min easy + 20 min @ goal MP` |
| Sharpening | `30 min easy + 15 min @ HM pace + 3 min easy + 15 min @ HM pace + 10 min easy` |
| Sharpening (long aerobic + finish) | `2 hours easy + 20 min @ goal MP` |
| Sharpening (multi-pace finish) | `30 min easy + 15 min @ MP + 1 min easy + 15 min @ HM pace + 10 min easy` |
| Peak (on/off, wide gap) | `10K easy + 10 × 1K on / 1K off — On = goal MP − 6 sec/km, Off = goal MP + 38 sec/km` |
| Peak (on/off, narrowing gap) | `10K easy + 10 × 1K on / 1K off — On = goal MP − 3 sec/km, Off = goal MP + 28 sec/km` |
| Peak (on/off, longer "on") | `1 hour easy + 5 × 2K on / 1K off — On = goal MP, Off = goal MP + 19 sec/km` |
| Peak (on/off, longest "on", smallest gap) | `1 hour easy + 4 × 3K on / 1K off — On = goal MP, Off = goal MP + 9 sec/km` |

The pattern shows two parallel progressions:
1. **"On" segments get longer** (1 min → 1K → 2K → 3K)
2. **"Off" segments get faster** (38 sec/km slower → 45 sec slower → 30 sec → 15 sec)

```json
{
  "specific_endurance_long_run": {
    "structure": "Long warmup (45 min to 1 hour easy) + repeated on/off cycles",
    "progression_principle": "Slightly slow the 'on' pace; significantly speed up the 'off' pace as cycle progresses",
    "endpoint": "Off segments barely slower than goal MP, simulating late-marathon metabolic state",
    "example_progression": [
      "1-hour easy + 10 min uphill @ goal MP",
      "30 min easy + (10 min @ goal MP / 1 min easy) x 4 + 10 min @ HM/10K pace",
      "10K easy + 10 x 1K on/1K off (on = goal MP - 6 sec/km, off = goal MP + 38 sec/km)",
      "10K easy + 10 x 1K on/1K off (on = goal MP - 3 sec/km, off = goal MP + 28 sec/km)",
      "1 hour easy + 5 x 2K on/1K off (on = goal MP, off = goal MP + 19 sec/km)",
      "1 hour easy + 4 x 3K on/1K off (on = goal MP, off = goal MP + 9 sec/km)"
    ]
  }
}
```

---

## Fartlek Format Reference

| Format | Example | Best Use |
|---|---|---|
| `speed_fartlek` | `11.2 km easy w/ 8 × 30 sec @ 10K-3K pace` | Introductory & early fundamental |
| `race_pace_fartlek` | `8 × 3 min @ 10K pace w/ 2-min recoveries` | Late fundamental & sharpening |
| `single_block_fartlek` | `6.4 km w/ 1.6 km @ 5K pace / 1 min easy` | One sustained surge in an easy run |
| `mixed_pace_fartlek` | `6 min @ 10K pace + 4 min easy + 4 × 1 min @ 5K pace` | Sharpening |

This plan uses `speed_fartlek` (Weeks 2–6, 7) and `race_pace_fartlek` (Weeks 5–6, 8, 12, 18, 19).

---

## Progression Run Format Reference

| Format | Example | Best Use |
|---|---|---|
| `moderate` | `9.6 km easy + 20 min moderate` | Introductory; later, adds extra hard work |
| `moderate_uphill` | `9.6 km easy + 20 min moderate (uphill if possible)` | Introductory; aerobic + strength |
| `hard` | `9.6 km easy + 20 min hard` | Late fundamental |
| `hard_uphill` | `9.6 km easy + 20 min hard (uphill if possible)` | Fundamental |
| `long_run_progression` | `19.2 km easy + 30 min moderate` | Throughout cycle |
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

This plan uses `three_intervals` in **Week 10 Tuesday** — `15 min @ MP + 15 min @ MP/HM pace + 15 min @ HM/10K pace` — hitting all three threshold tiers in a single 45-min sustained workout.

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

For marathon runners, specific-endurance work happens through **sustained marathon-pace efforts over long distances**. This plan uses three vehicles in tandem:

1. **`hard_long_run`** — long runs at MP+12 sec/km or "10% off MP"
2. **`marathon_pace_run`** — sustained MP blocks (12.8 km, 2×6.4 km, etc.)
3. **`specific_endurance_long_run`** — the new on/off long-run format that's the signature high-mileage marathon workout

### The ±10% Pace Range

| Phase | Pace range vs. goal pace |
|---|---|
| `fundamental` | **±10%** |
| `sharpening`  | **±3–4%** |
| `taper`       | **±3–4%** |

For marathon runners, the ±10% range from goal MP includes marathon pace and the slow end of half-marathon pace — so threshold runs at HM pace and long runs at MP both count as specific-endurance work.

### How specific-endurance training progresses across the cycle

For Marathon Level 3 specifically, the on/off SE long run is the central progression vehicle. The **gap between "on" pace and "off" pace narrows** across the cycle — early "off" might be 38 sec/km slower than MP, while late "off" is only 9 sec/km slower.

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
| Marathon | Competitive (`competitive`) | 16 km easy + 16 km @ marathon pace | |
| Marathon | Highly Competitive (`highly_competitive`) | 45 min easy + 20K: 1K on/1K off (on = marathon goal pace, off = marathon pace + 3–6 sec/km) | ←|

The arrow (←) marks the row applicable to **this plan** (Marathon Highly Competitive / Elite). The peak workout is a `specific_endurance_long_run` matching the source's framework: 45 min easy + 20K on/off where the gap between pace zones is just 3–6 sec/km.

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
      "For marathon: 'off' segments in alternating workouts get faster (closer to MP); 'on' segments slow slightly toward exact MP"
    ],
    "peak_workouts_by_profile": {
      "low_key":            "32-35.2 km easy",
      "competitive":        "16 km easy + 16 km @ marathon pace",
      "highly_competitive": "45 min easy + 20K: 1K on/1K off (on = marathon goal pace, off = marathon pace + 3-6 sec/km)"
    },
    "primary_vehicles": ["long_run", "marathon_pace_run", "hard_long_run", "specific_endurance_long_run"],
    "primary_vehicles_note": "For high-mileage marathon training, the specific_endurance_long_run with on/off cycles becomes the central peak-cycle workout.",
    "marathon_diagnostic_note": "Source generally states no effective marathon SE test exists, but plans include race tune-ups (10K/HM) and time trials as approximate fitness checks."
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

This plan uses `repetition` and `ladder`.

---

## Weekly Schedule

### Week 1

| Day | Workout |
|---|---|
| Sunday | Progression Run — 19.2 km, last 5 min. moderate (uphill, if possible) |
| Monday | Easy Run — 9.6 km + 2 × 8-sec. hill sprint |
| Tuesday | Easy Run — 12.8 km |
| Wednesday | Easy Run — 16 km |
| Thursday | Easy Run — 9.6 km + 2 × 8-sec. hill sprint |
| Friday | Progression Run — 12.8 km, last 5 min. moderate |
| Saturday | Easy Run — 9.6 km |

### Week 2

| Day | Workout |
|---|---|
| Sunday | Progression Run — 22.4 km, last 5 min. moderate (uphill, if possible) |
| Monday | Easy Run — 9.6 km + 4 × 8-sec. hill sprint |
| Tuesday | Fartlek Run — 9.6 km easy w/ 8 × 30 sec. @ 10K–3K pace |
| Wednesday | Easy Run — 17.6 km |
| Thursday | Easy Run — 9.6 km + 4 × 8-sec. hill sprint |
| Friday | Progression Run — 16 km, last 10 min. moderate |
| Saturday | Easy Run — 12.8 km |

### Week 3

| Day | Workout |
|---|---|
| Sunday | Progression Run — 24 km, last 15 min. moderate (uphill, if possible) |
| Monday | Easy Run — 12.8 km + 5 × 8-sec. hill sprint |
| Tuesday | Fartlek Run — 14.4 km easy w/ 8 × 40 sec. @ 10K–3K pace |
| Wednesday | Progression Run — 17.6 km, last 8 km moderate |
| Thursday | Easy Run — 12.8 km |
| Friday | Progression Run — 16 km: 8 km easy + 6.4 km moderate + 1.6 km @ marathon pace |
| Saturday | Easy Run — 12.8 km |

### Week 4

| Day | Workout |
|---|---|
| Sunday | Progression Run — 19.2 km, last 20 min. moderate (uphill, if possible) |
| Monday | Easy Run — 12.8 km + 6 × 8-sec. hill sprint |
| Tuesday | Fartlek Run — 14.4 km easy w/ 8 × 1 min. @ 10K–5K pace |
| Wednesday | Progression Run — 17.6 km, last 8 km moderate |
| Thursday | Easy Run — 14.4 km |
| Friday | Time Trial — 3.2 km easy + 6.4 km @ maximum effort + 3.2 km easy |
| Saturday | Easy Run — 8 km |

### Week 5

| Day | Workout |
|---|---|
| Sunday | Progression Run — 22.4 km, last 30 min. moderate (uphill, if possible) |
| Monday | Easy Run — 12.8 km + 8 × 8-sec. hill sprint |
| Tuesday | Fartlek Run — 11.2 km easy w/ 8 × 2 min. @ 10K pace |
| Wednesday | Progression Run — 19.2 km, last 8 km moderate |
| Thursday | Easy Run — 16 km |
| Friday | Progression Run — 4.8 km easy + 4.8 km hard + 4.8 km easy |
| Saturday | Easy Run — 9.6 km |

### Week 6

| Day | Workout |
|---|---|
| Sunday | Progression Run — 25.6 km, last 20 min. hard |
| Monday | Easy Run — 12.8 km + 8 × 8-sec. hill sprint |
| Tuesday | Fartlek Run — 14.4 km easy w/ 4 × 5 min. @ 10K pace |
| Wednesday | Progression Run — 19.2 km, last 9.6 km moderate |
| Thursday | Easy Run — 12.8 km |
| Friday | Threshold Run — 3.2 km easy + 2 × 15 min. @ half-marathon pace w/ 1-min. active recovery + 3.2 km easy |
| Saturday | Easy Run — 9.6 km |

### Week 7

| Day | Workout |
|---|---|
| Sunday | Long Fartlek Run — 28.8 km easy w/ 12 × 30 sec. @ 10K–3K pace |
| Monday | Easy Run — 12.8 km + 10 × 10-sec. hill sprint |
| Tuesday | Specific-Endurance Intervals — 3.2 km easy + 4 × 6 min. @ 10K pace w/ 3-min. active recoveries + 3.2 km easy |
| Wednesday | Easy Run — 24 km |
| Thursday | Easy Run — 16 km |
| Friday | Fartlek Run — 14.4 km easy w/ 8 × 30 sec. @ 10K pace |
| Saturday | Easy Run — 9.6 km |

### Week 8

| Day | Workout |
|---|---|
| Sunday | Tune-Up Race — 10K or 15K |
| Monday | Easy Run — 16 km + 10 × 10-sec. hill sprint |
| Tuesday | Easy Run — 16 km |
| Wednesday | Easy Run — 16 km |
| Thursday | Fartlek Run — 16 km easy w/ 12 × 30 sec. @ 10K–5K pace |
| Friday | Easy Run — 19.2 km |
| Saturday | Easy Run — 12.8 km |

### Week 9

| Day | Workout |
|---|---|
| Sunday | Specific-Endurance Long Run — 1 hour easy + 15 × 1 min. @ marathon pace / 1 min. easy + 30 min. easy |
| Monday | Easy Run — 12.8 km + 10 × 10-sec. hill sprint |
| Tuesday | Hill Repetitions — 6.4 km easy + 5 × 3 min. uphill @ 5K effort w/ jog-back recoveries + 4 km easy |
| Wednesday | Progression Run — 19.2 km, last 9.6 km moderate |
| Thursday | Easy Run — 16 km |
| Friday | Marathon-Pace Run — 4.8 km easy + 12.8 km @ marathon pace + 4.8 km easy |
| Saturday | Easy Run — 8 km |

### Week 10

| Day | Workout |
|---|---|
| Sunday | Hard Long Run — 28.8 km @ 10% off marathon pace |
| Monday | Easy Run — 12.8 km + 10 × 10-sec. hill sprint |
| Tuesday | Threshold Run — 4.8 km easy + 15 min. @ marathon pace w/ 1 min. easy + 15 min. @ marathon/half-marathon pace w/ 1 min. easy + 15 min. @ half-marathon/10K pace + 4.8 km easy |
| Wednesday | Progression Run — 19.2 km, last 9.6 km moderate |
| Thursday | Easy Run — 16 km |
| Friday | Hill Repetitions — 6.4 km easy + 5 × 3 min. uphill @ 5K effort w/ jog-back recoveries + 4 km easy |
| Saturday | Easy Run — 8 km |

### Week 11

| Day | Workout |
|---|---|
| Sunday | Specific-Endurance Long Run — 1 hour steady + 10 × 90 sec. @ marathon pace / 90 sec. easy + 30 min. steady |
| Monday | Easy Run — 12.8 km + 10 × 10-sec. hill sprint |
| Tuesday | Progression Run — 14.4 km: 4.8 km easy + 4.8 km accelerate from marathon pace to 5K pace + 4.8 km easy |
| Wednesday | Easy Run — 22.4 km |
| Thursday | Easy Run — 16 km |
| Friday | Ladder Intervals — 4.8 km easy + 1 min, 2 min, 3 min, 2 min, 1 min, 2 min, 3 min @ 3K–10K pace w/ equal-duration active recoveries + 4.8 km easy |
| Saturday | Easy Run — 8 km |

### Week 12

| Day | Workout |
|---|---|
| Sunday | Progression Run — 32 km, last 30 min. moderate |
| Monday | Easy Run — 12.8 km + 10 × 10-sec. hill sprint |
| Tuesday | Specific-Endurance Intervals — 4.8 km easy + 2 × (10 × 400m @ 10K–5K pace w/ 1-min. active recoveries), full recovery between sets + 4.8 km easy |
| Wednesday | Easy Run — 24 km |
| Thursday | Easy Run — 9.6 km |
| Friday | Threshold Run — 4.8 km easy + 2 × 10 min. @ half-marathon/10K pace w/ 2-min. active recovery + 4.8 km easy |
| Saturday | Easy Run — 9.6 km |

### Week 13

| Day | Workout |
|---|---|
| Sunday | Long Run — 35.2 km easy |
| Monday | Easy Run — 9.6 km + 10 × 10-sec. hill sprint |
| Tuesday | Specific-Endurance Intervals — 4.8 km easy + 6 × 800m @ 5K pace w/ 2-min. active recoveries + 4.8 km easy |
| Wednesday | Easy Run — 19.2 km |
| Thursday | Easy Run — 9.6 km |
| Friday | Threshold Run — 4.8 km easy + 3 × 10 min. @ half-marathon/10K pace w/ 4-min. active recoveries + 4.8 km easy |
| Saturday | Easy Run — 9.6 km |

### Week 14

| Day | Workout |
|---|---|
| Sunday | Specific-Endurance Long Run — 1 hour steady + 5 × 3 min. @ marathon pace / 3 min. easy + 30 min. steady |
| Monday | Easy Run — 9.6 km + 10 × 10-sec. hill sprint |
| Tuesday | Specific-Endurance Intervals — 4.8 km easy + 5 × 1K @ 5K pace w/ 2-min. active recoveries + 4.8 km easy |
| Wednesday | Moderate Run — 16 km |
| Thursday | Easy Run — 12.8 km |
| Friday | Threshold Run — 3.2 km easy + 8 km accelerating from half-marathon pace to 10K pace + 3.2 km easy |
| Saturday | Rest |

### Week 15

| Day | Workout |
|---|---|
| Sunday | Progression Run — 35.2 km, last 17.6 km moderate |
| Monday | Easy Run — 9.6 km + 10 × 10-sec. hill sprint |
| Tuesday | Specific-Endurance Intervals — 4.8 km easy + 6 × 1.6 km @ 10K pace + 3 sec/km w/ 3-min. active recoveries + 4.8 km easy |
| Wednesday | Moderate Run — 16 km |
| Thursday | Easy Run — 16 km |
| Friday | Easy Run — 22.4 km |
| Saturday | Easy Run — 16 km |

### Week 16

| Day | Workout |
|---|---|
| Sunday | Tune-Up Race — Half-Marathon Race or Time Trial |
| Monday | Easy Run — 9.6 km + 10 × 10-sec. hill sprint |
| Tuesday | Easy Run — 12.8 km |
| Wednesday | Easy Run — 12.8 km |
| Thursday | Easy Run — 12.8 km |
| Friday | Easy Run — 19.2 km |
| Saturday | Specific-Endurance Intervals — 4.8 km easy + 10 × 1K @ half-marathon–10K pace w/ 1-min. active recoveries + 4.8 km easy |

### Week 17

| Day | Workout |
|---|---|
| Sunday | Long Run — 38.4 km easy |
| Monday | Easy Run — 12.8 km + 10 × 10-sec. hill sprint |
| Tuesday | Progression Run — 3.2 km easy + 9.6 km accelerating from marathon pace to half-marathon pace |
| Wednesday | Easy Run — 22.4 km |
| Thursday | Easy Run — 16 km |
| Friday | Threshold Run — 4.8 km easy + 4 × 10 min. @ half-marathon/10K pace w/ 4-min. active recoveries + 4.8 km easy |
| Saturday | Easy Run — 11.2 km |

### Week 18

| Day | Workout |
|---|---|
| Sunday | Hard Long Run — 1.6 km easy + 28.8 km @ marathon pace + 12 sec/km + 1.6 km easy |
| Monday | Easy Run — 16 km + 10 × 10-sec. hill sprint |
| Tuesday | Fartlek Run — 19.2 km easy w/ 8 × 2 min. @ half-marathon pace |
| Wednesday | Progression Run — 22.4 km, last 11.2 km moderate |
| Thursday | Progression Run — 16 km, last 8 km moderate |
| Friday | Marathon-Pace Run — 3.2 km easy + 16 km @ marathon pace + 3.2 km easy |
| Saturday | AM: Easy Run — 8 km / PM: Easy Run — 8 km |

### Week 19

| Day | Workout |
|---|---|
| Sunday | Long Run — 32 km steady |
| Monday | Easy Run — 9.6 km + 10 × 10-sec. hill sprint |
| Tuesday | Fartlek Run — 17.6 km easy w/ 8 × 2 min. @ half-marathon pace |
| Wednesday | Progression Run — 19.2 km, last 9.6 km moderate |
| Thursday | Easy Run — 12.8 km |
| Friday | Marathon-Pace Run — 3.2 km easy + 2 × 6.4 km @ marathon pace w/ 5-min. active recovery + 1.6 km easy |
| Saturday | Easy Run — 9.6 km |

### Week 20

| Day | Workout |
|---|---|
| Sunday | Progression Run — 22.4 km, last 20 min. moderate |
| Monday | Easy Run — 12.8 km + 4 × 10-sec. hill sprint |
| Tuesday | Specific-Endurance Intervals — 3.2 km easy + 4 × 2K @ marathon pace to marathon pace − 9 sec/km + 3.2 km easy |
| Wednesday | Easy Run — 9.6 km |
| Thursday | Easy Run — 9.6 km |
| Friday | Marathon-Pace Run — 4.8 km easy + 9.6 km @ marathon pace + 1.6 km easy |
| Saturday | **Goal Race — Marathon** |

> **Race day note:** The source's printed plan shows Week 20 Saturday as "Rest" and the marathon on the following day (Sunday). For schema consistency with all other plans, this file places the `goal_race` on Saturday of Week 20. If the runner's actual race is on Sunday, they should treat Saturday as a rest day and run the race the following day.

> **AM/PM workouts:** Week 18 Saturday is the first time we've encountered a double-day in any plan. The schema represents this in a single `easy_run` entry with the description preserving the `AM: ... / PM: ...` split. If you need to model double sessions structurally, the description string can be parsed for the `AM:` and `PM:` markers.

---

## Structured Data (JSON)

```json
{
  "plan": {
    "distance": "Marathon",
    "level": 3,
    "level_name": "High Mileage",
    "duration_weeks": 20,
    "applies_to_runner_profiles": ["highly_competitive", "elite"],
    "weekly_volume": {
      "min_runs": 7,
      "max_runs": 7,
      "min_miles": 56,
      "max_miles": 87
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
        "For marathon: 'off' segments in alternating workouts get faster (closer to MP); 'on' segments slow slightly toward exact MP"
      ],
      "peak_workouts_by_profile": {
        "low_key":            "32-35.2 km easy",
        "competitive":        "16 km easy + 16 km @ marathon pace",
        "highly_competitive": "45 min easy + 20K: 1K on/1K off (on = marathon goal pace, off = marathon pace + 3-6 sec/km)"
      },
      "primary_vehicles": ["long_run", "marathon_pace_run", "hard_long_run", "specific_endurance_long_run"],
      "primary_vehicles_note": "For high-mileage marathon training, the specific_endurance_long_run with on/off cycles becomes the central peak-cycle workout.",
      "marathon_diagnostic_note": "Source generally states no effective marathon SE test exists, but plans include race tune-ups (10K/HM) and time trials as approximate fitness checks."
    },
    "weeks": [
      {
        "week": 1,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "19.2 km, last 5 min moderate (uphill if possible)", "progression_format": "long_run_progression" },
          "monday":    { "type": "easy_run",        "description": "9.6 km + 2 x 8-sec hill sprint" },
          "tuesday":   { "type": "easy_run",        "description": "12.8 km" },
          "wednesday": { "type": "easy_run",        "description": "16 km" },
          "thursday":  { "type": "easy_run",        "description": "9.6 km + 2 x 8-sec hill sprint" },
          "friday":    { "type": "progression_run", "description": "12.8 km, last 5 min moderate", "progression_format": "moderate" },
          "saturday":  { "type": "easy_run",        "description": "9.6 km" }
        }
      },
      {
        "week": 2,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "22.4 km, last 5 min moderate (uphill if possible)", "progression_format": "long_run_progression" },
          "monday":    { "type": "easy_run",        "description": "9.6 km + 4 x 8-sec hill sprint" },
          "tuesday":   { "type": "fartlek",         "description": "9.6 km easy w/ 8 x 30 sec @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "wednesday": { "type": "easy_run",        "description": "17.6 km" },
          "thursday":  { "type": "easy_run",        "description": "9.6 km + 4 x 8-sec hill sprint" },
          "friday":    { "type": "progression_run", "description": "16 km, last 10 min moderate", "progression_format": "moderate" },
          "saturday":  { "type": "easy_run",        "description": "12.8 km" }
        }
      },
      {
        "week": 3,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "24 km, last 15 min moderate (uphill if possible)", "progression_format": "long_run_progression" },
          "monday":    { "type": "easy_run",        "description": "12.8 km + 5 x 8-sec hill sprint" },
          "tuesday":   { "type": "fartlek",         "description": "14.4 km easy w/ 8 x 40 sec @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "wednesday": { "type": "progression_run", "description": "17.6 km, last 8 km moderate", "progression_format": "long_run_progression" },
          "thursday":  { "type": "easy_run",        "description": "12.8 km" },
          "friday":    { "type": "progression_run", "description": "16 km: 8 km easy + 6.4 km moderate + 1.6 km @ marathon pace", "progression_format": "marathon_pace_progression" },
          "saturday":  { "type": "easy_run",        "description": "12.8 km" }
        }
      },
      {
        "week": 4,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "19.2 km, last 20 min moderate (uphill if possible)", "progression_format": "moderate_uphill" },
          "monday":    { "type": "easy_run",        "description": "12.8 km + 6 x 8-sec hill sprint" },
          "tuesday":   { "type": "fartlek",         "description": "14.4 km easy w/ 8 x 1 min @ 10K-5K pace", "fartlek_format": "speed_fartlek" },
          "wednesday": { "type": "progression_run", "description": "17.6 km, last 8 km moderate", "progression_format": "long_run_progression" },
          "thursday":  { "type": "easy_run",        "description": "14.4 km" },
          "friday":    { "type": "time_trial",      "description": "3.2 km easy + 6.4 km @ maximum effort + 3.2 km easy", "purpose": "fitness check (max-effort 6.4-km time trial)" },
          "saturday":  { "type": "easy_run",        "description": "8 km" }
        }
      },
      {
        "week": 5,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "22.4 km, last 30 min moderate (uphill if possible)", "progression_format": "long_run_progression" },
          "monday":    { "type": "easy_run",        "description": "12.8 km + 8 x 8-sec hill sprint" },
          "tuesday":   { "type": "fartlek",         "description": "11.2 km easy w/ 8 x 2 min @ 10K pace", "fartlek_format": "race_pace_fartlek" },
          "wednesday": { "type": "progression_run", "description": "19.2 km, last 8 km moderate", "progression_format": "long_run_progression" },
          "thursday":  { "type": "easy_run",        "description": "16 km" },
          "friday":    { "type": "progression_run", "description": "4.8 km easy + 4.8 km hard + 4.8 km easy", "progression_format": "hard" },
          "saturday":  { "type": "easy_run",        "description": "9.6 km" }
        }
      },
      {
        "week": 6,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run", "description": "25.6 km, last 20 min hard", "progression_format": "hard" },
          "monday":    { "type": "easy_run",        "description": "12.8 km + 8 x 8-sec hill sprint" },
          "tuesday":   { "type": "fartlek",         "description": "14.4 km easy w/ 4 x 5 min @ 10K pace", "fartlek_format": "race_pace_fartlek" },
          "wednesday": { "type": "progression_run", "description": "19.2 km, last 9.6 km moderate", "progression_format": "long_run_progression" },
          "thursday":  { "type": "easy_run",        "description": "12.8 km" },
          "friday":    { "type": "threshold_run",   "description": "3.2 km easy + 2 x 15 min @ half-marathon pace w/ 1-min active recovery + 3.2 km easy", "threshold_tier": "T2", "threshold_format": "two_intervals" },
          "saturday":  { "type": "easy_run",        "description": "9.6 km" }
        }
      },
      {
        "week": 7,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "fartlek",                    "description": "28.8 km easy w/ 12 x 30 sec @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "monday":    { "type": "easy_run",                   "description": "12.8 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "3.2 km easy + 4 x 6 min @ 10K pace w/ 3-min active recoveries + 3.2 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "easy_run",                   "description": "24 km" },
          "thursday":  { "type": "easy_run",                   "description": "16 km" },
          "friday":    { "type": "fartlek",                    "description": "14.4 km easy w/ 8 x 30 sec @ 10K pace", "fartlek_format": "race_pace_fartlek" },
          "saturday":  { "type": "easy_run",                   "description": "9.6 km" }
        }
      },
      {
        "week": 8,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "tune_up_race", "description": "10K or 15K race", "purpose": "mid-cycle fitness check" },
          "monday":    { "type": "easy_run",     "description": "16 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "easy_run",     "description": "16 km" },
          "wednesday": { "type": "easy_run",     "description": "16 km" },
          "thursday":  { "type": "fartlek",      "description": "16 km easy w/ 12 x 30 sec @ 10K-5K pace", "fartlek_format": "speed_fartlek" },
          "friday":    { "type": "easy_run",     "description": "19.2 km" },
          "saturday":  { "type": "easy_run",     "description": "12.8 km" }
        }
      },
      {
        "week": 9,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "specific_endurance_long_run", "description": "1 hour easy + 15 x 1 min @ marathon pace / 1 min easy + 30 min easy" },
          "monday":    { "type": "easy_run",                    "description": "12.8 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "hill_repetitions",            "description": "6.4 km easy + 5 x 3 min uphill @ 5K effort w/ jog-back recoveries + 4 km easy" },
          "wednesday": { "type": "progression_run",             "description": "19.2 km, last 9.6 km moderate", "progression_format": "long_run_progression" },
          "thursday":  { "type": "easy_run",                    "description": "16 km" },
          "friday":    { "type": "marathon_pace_run",           "description": "4.8 km easy + 12.8 km @ marathon pace + 4.8 km easy" },
          "saturday":  { "type": "easy_run",                    "description": "8 km" }
        }
      },
      {
        "week": 10,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "hard_long_run",     "description": "28.8 km @ 10% off marathon pace" },
          "monday":    { "type": "easy_run",          "description": "12.8 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "threshold_run",     "description": "4.8 km easy + 15 min @ marathon pace + 1 min easy + 15 min @ marathon/half-marathon pace + 1 min easy + 15 min @ half-marathon/10K pace + 4.8 km easy", "threshold_tier": "T1-T3", "threshold_format": "three_intervals" },
          "wednesday": { "type": "progression_run",   "description": "19.2 km, last 9.6 km moderate", "progression_format": "long_run_progression" },
          "thursday":  { "type": "easy_run",          "description": "16 km" },
          "friday":    { "type": "hill_repetitions",  "description": "6.4 km easy + 5 x 3 min uphill @ 5K effort w/ jog-back recoveries + 4 km easy" },
          "saturday":  { "type": "easy_run",          "description": "8 km" }
        }
      },
      {
        "week": 11,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "specific_endurance_long_run", "description": "1 hour steady + 10 x 90 sec @ marathon pace / 90 sec easy + 30 min steady" },
          "monday":    { "type": "easy_run",                    "description": "12.8 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "progression_run",             "description": "14.4 km: 4.8 km easy + 4.8 km accelerate from marathon pace to 5K pace + 4.8 km easy", "progression_format": "marathon_pace_progression" },
          "wednesday": { "type": "easy_run",                    "description": "22.4 km" },
          "thursday":  { "type": "easy_run",                    "description": "16 km" },
          "friday":    { "type": "ladder_intervals",            "description": "4.8 km easy + 1 min, 2 min, 3 min, 2 min, 1 min, 2 min, 3 min @ 3K-10K pace w/ equal-duration active recoveries + 4.8 km easy", "interval_format": "ladder" },
          "saturday":  { "type": "easy_run",                    "description": "8 km" }
        }
      },
      {
        "week": 12,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",            "description": "32 km, last 30 min moderate", "progression_format": "long_run_progression" },
          "monday":    { "type": "easy_run",                   "description": "12.8 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "4.8 km easy + 2 x (10 x 400m @ 10K-5K pace w/ 1-min active recoveries), full recovery between sets + 4.8 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "easy_run",                   "description": "24 km" },
          "thursday":  { "type": "easy_run",                   "description": "9.6 km" },
          "friday":    { "type": "threshold_run",              "description": "4.8 km easy + 2 x 10 min @ half-marathon/10K pace w/ 2-min active recovery + 4.8 km easy", "threshold_tier": "T2-T3", "threshold_format": "two_intervals" },
          "saturday":  { "type": "easy_run",                   "description": "9.6 km" }
        }
      },
      {
        "week": 13,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "long_run",                   "description": "35.2 km easy" },
          "monday":    { "type": "easy_run",                   "description": "9.6 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "4.8 km easy + 6 x 800m @ 5K pace w/ 2-min active recoveries + 4.8 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "easy_run",                   "description": "19.2 km" },
          "thursday":  { "type": "easy_run",                   "description": "9.6 km" },
          "friday":    { "type": "threshold_run",              "description": "4.8 km easy + 3 x 10 min @ half-marathon/10K pace w/ 4-min active recoveries + 4.8 km easy", "threshold_tier": "T2-T3", "threshold_format": "multi_interval" },
          "saturday":  { "type": "easy_run",                   "description": "9.6 km" }
        }
      },
      {
        "week": 14,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "specific_endurance_long_run", "description": "1 hour steady + 5 x 3 min @ marathon pace / 3 min easy + 30 min steady" },
          "monday":    { "type": "easy_run",                    "description": "9.6 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "4.8 km easy + 5 x 1K @ 5K pace w/ 2-min active recoveries + 4.8 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "moderate_run",                "description": "16 km" },
          "thursday":  { "type": "easy_run",                    "description": "12.8 km" },
          "friday":    { "type": "threshold_run",               "description": "3.2 km easy + 8 km accelerating from half-marathon pace to 10K pace + 3.2 km easy", "threshold_tier": "T2-T3", "threshold_format": "one_interval" },
          "saturday":  { "type": "rest",                        "description": "Rest" }
        }
      },
      {
        "week": 15,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",            "description": "35.2 km, last 17.6 km moderate", "progression_format": "long_run_progression" },
          "monday":    { "type": "easy_run",                   "description": "9.6 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "4.8 km easy + 6 x 1.6 km @ 10K pace + 3 sec/km w/ 3-min active recoveries + 4.8 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "moderate_run",               "description": "16 km" },
          "thursday":  { "type": "easy_run",                   "description": "16 km" },
          "friday":    { "type": "easy_run",                   "description": "22.4 km" },
          "saturday":  { "type": "easy_run",                   "description": "16 km" }
        }
      },
      {
        "week": 16,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "tune_up_race",               "description": "Half-Marathon race or time trial", "purpose": "mid-cycle fitness check" },
          "monday":    { "type": "easy_run",                   "description": "9.6 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "easy_run",                   "description": "12.8 km" },
          "wednesday": { "type": "easy_run",                   "description": "12.8 km" },
          "thursday":  { "type": "easy_run",                   "description": "12.8 km" },
          "friday":    { "type": "easy_run",                   "description": "19.2 km" },
          "saturday":  { "type": "specific_endurance_intervals","description": "4.8 km easy + 10 x 1K @ half-marathon-10K pace w/ 1-min active recoveries + 4.8 km easy", "interval_format": "repetition" }
        }
      },
      {
        "week": 17,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "long_run",        "description": "38.4 km easy" },
          "monday":    { "type": "easy_run",        "description": "12.8 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "progression_run", "description": "3.2 km easy + 9.6 km accelerating from marathon pace to half-marathon pace", "progression_format": "marathon_pace_progression" },
          "wednesday": { "type": "easy_run",        "description": "22.4 km" },
          "thursday":  { "type": "easy_run",        "description": "16 km" },
          "friday":    { "type": "threshold_run",   "description": "4.8 km easy + 4 x 10 min @ half-marathon/10K pace w/ 4-min active recoveries + 4.8 km easy", "threshold_tier": "T2-T3", "threshold_format": "multi_interval" },
          "saturday":  { "type": "easy_run",        "description": "11.2 km" }
        }
      },
      {
        "week": 18,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "hard_long_run",     "description": "1.6 km easy + 28.8 km @ marathon pace + 12 sec/km + 1.6 km easy" },
          "monday":    { "type": "easy_run",          "description": "16 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "fartlek",           "description": "19.2 km easy w/ 8 x 2 min @ half-marathon pace", "fartlek_format": "race_pace_fartlek" },
          "wednesday": { "type": "progression_run",   "description": "22.4 km, last 11.2 km moderate", "progression_format": "long_run_progression" },
          "thursday":  { "type": "progression_run",   "description": "16 km, last 8 km moderate", "progression_format": "long_run_progression" },
          "friday":    { "type": "marathon_pace_run", "description": "3.2 km easy + 16 km @ marathon pace + 3.2 km easy" },
          "saturday":  { "type": "easy_run",          "description": "AM: 8 km / PM: 8 km", "sessions": ["AM: 8 km easy", "PM: 8 km easy"] }
        }
      },
      {
        "week": 19,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "long_run",          "description": "32 km steady" },
          "monday":    { "type": "easy_run",          "description": "9.6 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "fartlek",           "description": "17.6 km easy w/ 8 x 2 min @ half-marathon pace", "fartlek_format": "race_pace_fartlek" },
          "wednesday": { "type": "progression_run",   "description": "19.2 km, last 9.6 km moderate", "progression_format": "long_run_progression" },
          "thursday":  { "type": "easy_run",          "description": "12.8 km" },
          "friday":    { "type": "marathon_pace_run", "description": "3.2 km easy + 2 x 6.4 km @ marathon pace w/ 5-min active recovery + 1.6 km easy" },
          "saturday":  { "type": "easy_run",          "description": "9.6 km" }
        }
      },
      {
        "week": 20,
        "training_phase": "taper",
        "days": {
          "sunday":    { "type": "progression_run",            "description": "22.4 km, last 20 min moderate", "progression_format": "long_run_progression" },
          "monday":    { "type": "easy_run",                   "description": "12.8 km + 4 x 10-sec hill sprint" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "3.2 km easy + 4 x 2K @ marathon pace to marathon pace - 9 sec/km + 3.2 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "easy_run",                   "description": "9.6 km" },
          "thursday":  { "type": "easy_run",                   "description": "9.6 km" },
          "friday":    { "type": "marathon_pace_run",          "description": "4.8 km easy + 9.6 km @ marathon pace + 1.6 km easy" },
          "saturday":  { "type": "goal_race",                  "description": "Marathon Goal Race" }
        }
      }
    ]
  }
}
```
