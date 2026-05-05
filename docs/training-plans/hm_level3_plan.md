# Half-Marathon Level 3 Training Plan

## Overview

- **Distance:** Half-Marathon
- **Level:** 3 (High Mileage)
- **Duration:** 16 weeks
- **Weekly Volume:** Ranges from 6 runs / 51.2 km (Week 1) to 7 runs / 102.4 km (Week 14)
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

Runners are grouped into five experience/competitiveness profiles. Each profile maps to a recommended plan level. **This Half-Marathon Level 3 plan applies to the `highly_competitive` and `elite` profiles.**

| Runner Profile | Code | Recommended Plan Level | Description |
|---|---|---|---|
| Beginner | `beginner` | Level 1 | New to running or returning after a long break |
| Low-Key | `low_key` | Level 1 | Runs regularly but prefers low mileage; not focused on racing performance |
| Competitive | `competitive` | Level 2 | More experienced, races regularly, willing to handle moderate volume |
| Highly Competitive | `highly_competitive` | **Level 3** | Trains seriously, prioritizes performance, can handle high mileage |
| Elite | `elite` | **Level 3** | Top-tier competitor; high mileage with the most demanding workouts |

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

> This file contains **only the Half-Marathon Level 3 plan**. A runner whose profile maps to Level 1 or Level 2 should use the corresponding Half-Marathon Level 1 or Level 2 plan file.

## Workout Type Glossary

| Code | Description |
|---|---|
| `long_run` | Long, easy-paced run |
| `easy_run` | Easy-paced run |
| `progression_run` | Easy run that finishes with a moderate, hard, or marathon-pace segment. Has 7 sub-formats (see Progression Run Format Reference below). |
| `xtrain_or_rest` | Cross-training **or** rest — runner's choice |
| `xtrain` | Specific cross-training session prescribed |
| `rest` | Full rest day |
| `fartlek` | Easy run with embedded faster surges. Has 4 sub-formats (see Fartlek Format Reference below). |
| `hill_repetitions` | Uphill repetitions at hard effort with jog-back recoveries |
| `threshold_run` | Run with a sustained segment at a threshold pace (T1, T2, or T3 — see Threshold Pace Reference below). For half-marathon runners, threshold runs are the **primary** vehicle for specific-endurance training. |
| `specific_endurance_intervals` | Repetition intervals at goal race pace |
| `ladder_intervals` | Intervals of varying distance/duration run consecutively (ascending, descending, or pyramid) |
| `time_trial` | Maximum-effort timed run over a fixed distance (e.g. `6.4 km @ maximum effort`). A diagnostic workout — distinct from `tune_up_race` (no actual race), `aerobic_test` (HR-controlled, sub-max), and `perceived_effort_test` (HM-effort, sub-max). |
| `aerobic_test` | HR-controlled diagnostic. Run a fixed distance or duration at your half-marathon heart rate. Calculate pace from time and distance. Repeat every 5–6 weeks; pace should move toward goal HM pace as fitness improves. |
| `perceived_effort_test` | HR-monitor-free alternative to the aerobic test. Run exactly 6.4 km (16 laps + 40 yards) on a track at fastest sustainable HM effort. **Take no split times.** Calculate pace from total time. |
| `tune_up_race` | A race or time trial run mid-cycle as a fitness check, **not** the goal race |
| `goal_race` | The target race the plan is built around |

## Threshold Pace Reference

For half-marathon runners, threshold work is **especially central**: the source notes that "the lion's share of specific-endurance training for half-marathon runners should occur within the context of threshold runs in the fundamental and sharpening periods." Half-marathon goal pace falls into the T2 tier.

| Pace ID | Sustainable for... | Elite proxy | Sub-elite proxy |
|---|---|---|---|
| **T1** | ~2.5 hours | A bit slower than marathon pace | Marathon pace or slightly faster |
| **T2** | ~90 minutes | A bit faster than marathon pace | Half-marathon pace |
| **T3** | ~60 minutes | Half-marathon pace or a bit faster | A bit slower than 10K pace |

Source-pace-to-tier mapping used in this plan:

| Source description | Threshold tier |
|---|---|
| "half-marathon pace" / "goal half-marathon pace" | **T2** |
| "half-marathon/10K pace" | **T2–T3** |
| "10K pace" | **T3** |

```json
{
  "threshold_paces": {
    "T1": { "sustainable_minutes": 150, "elite_proxy": "slightly slower than marathon pace", "sub_elite_proxy": "marathon pace or slightly faster" },
    "T2": { "sustainable_minutes": 90,  "elite_proxy": "slightly faster than marathon pace", "sub_elite_proxy": "half-marathon pace" },
    "T3": { "sustainable_minutes": 60,  "elite_proxy": "half-marathon pace or slightly faster", "sub_elite_proxy": "slightly slower than 10K pace" }
  },
  "source_pace_to_threshold_tier": {
    "goal half-marathon pace":     "T2",
    "half-marathon pace":          "T2",
    "half-marathon/10K pace":      "T2-T3",
    "10K pace":                    "T3"
  }
}
```

## Diagnostic Checkpoints

This plan includes **three diagnostic checkpoints** spaced across the cycle — the most of any plan we've built:

| Week | Day | Workout | Type |
|---|---|---|---|
| 6 | Friday | Time Trial — 6.4 km @ maximum effort | `time_trial` |
| 11 | Friday | Time Trial — 6.4 km @ maximum effort | `time_trial` |
| 14 | Friday | Aerobic Test — 6.4 km @ HM heart rate | `aerobic_test` |

The two time trials are spaced 5 weeks apart (matching the source's "every 5–6 weeks" guidance) and let the runner track max-effort 6.4-km time as fitness builds. The Week 14 aerobic test, three weeks before the goal race, switches to HR-controlled testing so the runner can verify that HM pace at HM heart rate is converging on goal pace — the source's definition of peak fitness.

> **Marathon note:** the source explicitly states there is no effective specific-endurance test for the marathon. This is preserved in the plan-context JSON for when marathon plans get added.

## Training Phases

Each week in the JSON carries a `training_phase` field:

| Phase | Code | Description |
|---|---|---|
| Fundamental | `fundamental` | Builds general fitness and gradually specializes. |
| Sharpening | `sharpening` | Race-specific phase — threshold runs at HM pace become the central workout. |
| Taper | `taper` | Volume drops sharply leading into the goal race. |

In this Half-Marathon Level 3 plan: **Weeks 1–6 = `fundamental`, Weeks 7–15 = `sharpening`, Week 16 = `taper`**. Sharpening starts in Week 7 when threshold runs first appear (race-pace work for HM runners).

---

## Fartlek Format Reference

Fartleks ("speed play" in Swedish) are runs with embedded faster surges.

| Format | Example | Best Use |
|---|---|---|
| `speed_fartlek` | `11.2 km easy w/ 8 × 30 sec @ 10K-3K pace` | Introductory & early fundamental — low-pressure speed introduction. |
| `race_pace_fartlek` | `8 × 3 min @ 10K pace w/ 2-min active recoveries` | Late fundamental & sharpening — bridges speed work toward specific endurance. Surges at race-distance pace (5K, 10K, or HM) with structured recoveries. |
| `single_block_fartlek` | `6.4 km w/ 1.6 km @ 5K pace / 1 min easy` | One sustained surge embedded in an easy run. |
| `mixed_pace_fartlek` | `6 min @ 10K pace + 4 min easy + 4 × 1 min @ 5K pace` | Sharpening — integrate two race-pace zones in one workout. |

This Half-Marathon Level 3 plan uses `speed_fartlek` heavily in early weeks and `race_pace_fartlek` from Week 8 onward.

---

## Progression Run Format Reference

Progression runs come in **seven distinct formats**. Half-marathon runners use them liberally — moderate-pace segments overlap with race pace.

| Format | Example | Best Use |
|---|---|---|
| `moderate` | `9.6 km easy + 20 min moderate` | Introductory; later, adds extra hard work without overdoing it |
| `moderate_uphill` | `9.6 km easy + 20 min moderate (uphill if possible)` | Introductory; aerobic + strength simultaneously |
| `hard` | `9.6 km easy + 20 min hard` | Late fundamental; coaxes aerobic support toward peak |
| `hard_uphill` | `9.6 km easy + 20 min hard (uphill if possible)` | Fundamental; aerobic + strength after foundation built |
| `long_run_progression` | `19.2 km easy + 30 min moderate` | Throughout cycle; transforms general endurance into race-specific endurance |
| `fartlek_progression` | `3.2 km easy + 6.4 km intervals + 3.2 km hard` | Late fundamental; integrates two specific-endurance training types |
| `marathon_pace_progression` | `11.2 km easy + 20 min @ marathon pace` | Race-pace stimulus inside a longer run |

Notable in this plan: **Week 9 Sunday** is a `fartlek_progression` matching the source's Table 3.2 example exactly.

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

Threshold runs come in **four distinct formats** (Table 3.3 in source). For half-marathon training, threshold runs are the centerpiece.

| Format | Example | Best Use |
|---|---|---|
| `one_interval` | `3.2 km easy + 6.4 km @ half-marathon pace + 3.2 km easy` | Shorter early in fundamental; longer late to finish the job. |
| `two_intervals` | `3.2 km easy + 15 min @ HM pace + 3.2 km easy + 15 min @ 10K pace + 3.2 km easy` | More total threshold time with a recovery break. |
| `three_intervals` | `3.2 km easy + 10 min @ marathon pace + 1 min easy + 10 min @ HM pace + 1 min easy + 10 min @ 10K pace + 3.2 km easy` | Hits all three threshold-pace levels (T1, T2, T3) in one workout. |
| `multi_interval` | `3.2 km easy + 4 × 6 min @ HM pace w/ 1-min active recoveries + 3.2 km easy` | More than three blocks at a single threshold pace. |

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

For half-marathon runners specifically, specific-endurance training happens primarily through **threshold runs at half-marathon pace**, not through track-style intervals at goal pace.

### The ±10% Pace Range

| Phase | Pace range vs. goal pace |
|---|---|
| `fundamental` | **±10%** |
| `sharpening`  | **±3–4%** |
| `taper`       | **±3–4%** |

For HM runners, any threshold run at "marathon pace" through "10K pace" falls within ±10% of goal HM pace, so all threshold runs in this plan count as specific-endurance work.

### How specific-endurance training progresses across the cycle

1. **Pace moves toward goal pace** — early threshold runs at HM/10K pace; later ones at exact HM pace.
2. **Volume of race-pace work per session increases**.
3. **Race-pace efforts become more extended**.
4. **Recoveries shorten or pace closes in on goal pace**.

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
| Half-Marathon | Highly Competitive (`highly_competitive`) | 3 × 5K @ half-marathon pace w/ 90-sec jog recoveries | ←|
| Marathon | Low-Key Competitive (`low_key`) | 32–35.2 km easy | |
| Marathon | Competitive (`competitive`) | 16 km easy + 16 km @ marathon pace | |
| Marathon | Highly Competitive (`highly_competitive`) | 45 min easy + 20K: 1K on/1K off (on = marathon goal pace, off = marathon pace + 3–6 sec/km) | |

The arrow (←) marks the row applicable to **this plan** (Half-Marathon Highly Competitive / Elite). Note: this plan reaches that peak through long threshold runs at HM pace rather than the precise interval form shown — both express the same training intent.

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
      "Recoveries shorten"
    ],
    "peak_workouts_by_profile": {
      "low_key":            "6 × 1.6 km @ half-marathon pace w/ 2-min jog recoveries",
      "competitive":        "4 × 3K @ half-marathon pace w/ 90-sec jog recoveries",
      "highly_competitive": "3 × 5K @ half-marathon pace w/ 90-sec jog recoveries"
    },
    "primary_vehicle": "threshold_run",
    "primary_vehicle_note": "For half-marathon runners, the lion's share of specific-endurance training happens within threshold runs at half-marathon pace, not separate track intervals."
  }
}
```

---

## Interval Format Reference

Workouts containing intervals also carry an `interval_format` field:

| Format | Description | Example |
|---|---|---|
| `repetition` | Uniform-distance, uniform-pace intervals | `5 × 1K @ 5K pace` |
| `ladder` | Varying-distance intervals run consecutively | `1 min, 2 min, 3 min, 2 min, 1 min, 2 min, 3 min @ 5K-1500m pace` |
| `add_on` | Small set of speed intervals appended to a slower workout | `20-min threshold run + 4 × 300m @ 3K pace` |

This plan uses `repetition` (most weeks) and `ladder` (Week 10).

---

## Weekly Schedule

### Week 1

| Day | Workout |
|---|---|
| Sunday | Long Run — 9.6 km easy |
| Monday | Easy Run — 8 km + 1 × 8-sec. hill sprint |
| Tuesday | Easy Run — 8 km |
| Wednesday | Easy Run — 9.6 km |
| Thursday | Easy Run — 8 km + 1 × 8-sec. hill sprint |
| Friday | Rest |
| Saturday | Easy Run — 8 km |

### Week 2

| Day | Workout |
|---|---|
| Sunday | Progression Run — 9.6 km, last 20 min. moderate |
| Monday | Easy Run — 9.6 km + 2 × 8-sec. hill sprint |
| Tuesday | Easy Run — 9.6 km |
| Wednesday | Easy Run — 11.2 km |
| Thursday | Easy Run — 9.6 km + 2 × 8-sec. hill sprint |
| Friday | Easy Run — 9.6 km |
| Saturday | Easy Run — 8 km |

### Week 3

| Day | Workout |
|---|---|
| Sunday | Progression Run — 14.4 km, last 20 min. moderate (uphill, if possible) |
| Monday | Easy Run — 9.6 km + 3 × 8-sec. hill sprint |
| Tuesday | Fartlek Run — 11.2 km easy w/ 8 × 20 sec. @ 10K–3K pace |
| Wednesday | Easy Run — 12.8 km |
| Thursday | Easy Run — 9.6 km + 3 × 8-sec. hill sprint |
| Friday | Easy Run — 11.2 km |
| Saturday | Rest |

### Week 4

| Day | Workout |
|---|---|
| Sunday | Progression Run — 16 km, last 20 min. moderate (uphill, if possible) |
| Monday | Easy Run — 9.6 km + 5 × 8-sec. hill sprint |
| Tuesday | Fartlek Run — 11.2 km easy w/ 8 × 30 sec. @ 10K–3K pace |
| Wednesday | Easy Run — 14.4 km |
| Thursday | Easy Run — 9.6 km + 5 × 8-sec. hill sprint |
| Friday | Progression Run — 12.8 km, last 15 min. moderate |
| Saturday | Rest |

### Week 5

| Day | Workout |
|---|---|
| Sunday | Progression Run — 19.2 km, last 30 min. moderate (uphill, if possible) |
| Monday | Easy Run — 9.6 km + 6 × 8-sec. hill sprint |
| Tuesday | Fartlek Run — 11.2 km easy w/ 8 × 45 sec. @ 10K–3K pace |
| Wednesday | Easy Run — 16 km |
| Thursday | Easy Run — 9.6 km |
| Friday | Progression Run — 12.8 km, last 20 min. moderate |
| Saturday | Rest |

### Week 6

| Day | Workout |
|---|---|
| Sunday | Fartlek Run — 16 km easy w/ 10 × 45 sec. @ 10K–3K pace |
| Monday | Easy Run — 9.6 km + 8 × 8-sec. hill sprint |
| Tuesday | Fartlek Run — 12.8 km easy w/ 8 × 1 min. @ 10K–3K pace |
| Wednesday | Easy Run — 16 km |
| Thursday | Easy Run — 9.6 km |
| Friday | Time Trial — 4.8 km easy + 6.4 km @ maximum effort + 3.2 km easy |
| Saturday | Easy Run — 6.4 km |

### Week 7

| Day | Workout |
|---|---|
| Sunday | Progression Run — 14.4 km, last 15 min. hard (uphill, if possible) |
| Monday | Easy Run — 9.6 km + 9 × 8-sec. hill sprint |
| Tuesday | Hill Repetitions — 3.2 km easy + 8 × 1 min. uphill @ 5K effort w/ jog-back recoveries + 3.2 km easy |
| Wednesday | Easy Run — 19.2 km |
| Thursday | Easy Run — 9.6 km |
| Friday | Threshold Run — 3.2 km easy + 2 × 15 min. @ half-marathon/10K pace w/ 1-min. active recovery + 3.2 km easy |
| Saturday | Easy Run — 9.6 km |

### Week 8

| Day | Workout |
|---|---|
| Sunday | Progression Run — 16 km, last 20 min. hard (uphill, if possible) |
| Monday | Easy Run — 9.6 km + 10 × 8-sec. hill sprint |
| Tuesday | Fartlek — 12.8 km + 5 × 1 min. @ 5K pace / 1 min. easy + 4.8 km easy |
| Wednesday | Easy Run — 16 km |
| Thursday | Easy Run — 9.6 km |
| Friday | Threshold Run — 3.2 km easy + 9.6 km @ half-marathon pace + 3.2 km easy |
| Saturday | Easy Run — 6.4 km |

### Week 9

| Day | Workout |
|---|---|
| Sunday | Fartlek Run + Progression — 6.4 km easy + 15 × 1 min. @ 5K pace / 1 min. easy + 3.2 km easy + 3.2 km hard |
| Monday | Easy Run — 9.6 km + 10 × 10-sec. hill sprint |
| Tuesday | Hill Repetitions — 4.8 km easy + 8 × 1 min. uphill @ 5K effort w/ jog-back recoveries + 4.8 km easy |
| Wednesday | Easy Run — 16 km |
| Thursday | Easy Run — 9.6 km |
| Friday | Threshold Run — 3.2 km easy + 2 × 15 min. @ half-marathon/10K pace w/ 5-min. active recovery + 3.2 km easy |
| Saturday | Easy Run — 9.6 km |

### Week 10

| Day | Workout |
|---|---|
| Sunday | Progression Run — 19.2 km, last 20 min. moderate |
| Monday | Easy Run — 12.8 km + 8 × 10-sec. hill sprint |
| Tuesday | Ladder Intervals — 4.8 km easy + 1 min, 2 min, 3 min, 2 min, 1 min, 2 min, 3 min @ 5K–1,500m pace w/ 400m jog recoveries + 4.8 km easy |
| Wednesday | Easy Run — 19.2 km |
| Thursday | Easy Run — 12.8 km |
| Friday | Threshold Run — 3.2 km easy + 8 km @ goal half-marathon pace + 3.2 km easy |
| Saturday | Easy Run — 11.2 km |

### Week 11

| Day | Workout |
|---|---|
| Sunday | Progression Run — 20.8 km, last 20 min. hard |
| Monday | Easy Run — 12.8 km + 10 × 10-sec. hill sprint |
| Tuesday | Hill Repetitions — 3.2 km easy + 6 × 2 min. uphill @ 5K effort w/ jog-back recoveries + 3.2 km easy |
| Wednesday | Easy Run — 16 km |
| Thursday | Easy Run — 9.6 km |
| Friday | Time Trial — 4.8 km easy + 6.4 km @ maximum effort + 3.2 km easy |
| Saturday | Easy Run — 9.6 km |

### Week 12

| Day | Workout |
|---|---|
| Sunday | Fartlek Intervals — 6.4 km easy + 15 × 90 sec. @ 10K pace / 90 sec. easy + 6.4 km easy |
| Monday | Easy Run — 12.8 km + 10 × 10-sec. hill sprint |
| Tuesday | Fartlek Run — 3.2 km easy + 8 × 3 min. @ 10K pace w/ 2-min. active recoveries + 3.2 km easy |
| Wednesday | Easy Run — 19.2 km |
| Thursday | Easy Run — 9.6 km |
| Friday | Threshold Run — 3.2 km easy + 9.6 km @ half-marathon pace + 3.2 km easy |
| Saturday | Easy Run — 12.8 km |

### Week 13

| Day | Workout |
|---|---|
| Sunday | Long Run — 19.2 km easy |
| Monday | Easy Run — 9.6 km + 10 × 10-sec. hill sprint |
| Tuesday | Specific-Endurance Intervals — 3.2 km easy + 4 × 1.6 km @ 10K pace w/ 3-min. active recoveries + 3.2 km easy |
| Wednesday | Easy Run — 19.2 km |
| Thursday | Easy Run — 9.6 km |
| Friday | Threshold Run — 3.2 km easy + 3 × 10 min. @ half-marathon/10K pace w/ 2-min. active recoveries + 3.2 km easy |
| Saturday | Easy Run — 6.4 km |

### Week 14

| Day | Workout |
|---|---|
| Sunday | Progression Run — 24 km, last 15 min. hard |
| Monday | Easy Run — 9.6 km + 10 × 10-sec. hill sprint |
| Tuesday | Specific-Endurance Intervals — 3.2 km easy + 5 × 1K @ 5K pace w/ 90-sec. active recoveries + 1.6 km easy |
| Wednesday | Easy Run — 19.2 km |
| Thursday | Easy Run — 9.6 km |
| Friday | Aerobic Test — 4.8 km easy + 6.4 km @ half-marathon heart rate + 4.8 km easy |
| Saturday | Easy Run — 9.6 km |

### Week 15

| Day | Workout |
|---|---|
| Sunday | Progression Run — 20.8 km, last 15–20 min. hard |
| Monday | Easy Run — 9.6 km + 8 × 10-sec. hill sprint |
| Tuesday | Specific-Endurance Intervals — 3.2 km easy + 5 × 2K @ 10K pace w/ 3-min. active recoveries + 3.2 km easy |
| Wednesday | Easy Run — 16 km |
| Thursday | Easy Run — 9.6 km |
| Friday | Threshold Run — 3.2 km easy + 2 × 15 min. @ half-marathon/10K pace w/ 1-min. active recovery + 3.2 km easy |
| Saturday | Easy Run — 6.4 km |

### Week 16

| Day | Workout |
|---|---|
| Sunday | Long Run — 19.2 km easy |
| Monday | Easy Run — 9.6 km + 6 × 10-sec. hill sprint |
| Tuesday | Specific-Endurance Intervals — 4.8 km easy + 3 × 1.6 km @ 10K pace w/ 3-min. active recoveries + 4.8 km easy |
| Wednesday | Easy Run — 9.6 km |
| Thursday | Rest |
| Friday | Easy Run — 6.4 km + 4 × 100m strides |
| Saturday | **Goal Race — Half-Marathon** |

> **Race day note:** The source's printed plan shows Week 16 Saturday as "Rest" and the goal race on the following day (Sunday). For schema consistency with all other plans, this file places the `goal_race` on Saturday of Week 16. If the runner's actual race is on Sunday, they should treat Saturday as a rest day and run the race the following day.

---

## Structured Data (JSON)

The following JSON block contains the same plan in a machine-readable format suitable for parsing in code.

```json
{
  "plan": {
    "distance": "Half-Marathon",
    "level": 3,
    "level_name": "High Mileage",
    "duration_weeks": 16,
    "applies_to_runner_profiles": ["highly_competitive", "elite"],
    "weekly_volume": {
      "min_runs": 6,
      "max_runs": 7,
      "min_miles": 32,
      "max_miles": 64
    },
    "race_day_of_week": "weekend",
    "race_day_note": "The source plan shows Week 16 Saturday as 'Rest' and the half-marathon race on the following Sunday. For schema consistency with other plans, this file places goal_race on Saturday Week 16. Runners racing on Sunday should treat Saturday as a rest day and run the race on the following day.",
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
        "Recoveries shorten"
      ],
      "peak_workouts_by_profile": {
        "low_key":            "6 × 1.6 km @ half-marathon pace w/ 2-min jog recoveries",
        "competitive":        "4 × 3K @ half-marathon pace w/ 90-sec jog recoveries",
        "highly_competitive": "3 × 5K @ half-marathon pace w/ 90-sec jog recoveries"
      },
      "primary_vehicle": "threshold_run",
      "primary_vehicle_note": "For half-marathon runners, the lion's share of specific-endurance training happens within threshold runs at half-marathon pace, not separate track intervals."
    },
    "weeks": [
      {
        "week": 1,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "long_run", "description": "9.6 km easy" },
          "monday":    { "type": "easy_run", "description": "8 km + 1 x 8-sec hill sprint" },
          "tuesday":   { "type": "easy_run", "description": "8 km" },
          "wednesday": { "type": "easy_run", "description": "9.6 km" },
          "thursday":  { "type": "easy_run", "description": "8 km + 1 x 8-sec hill sprint" },
          "friday":    { "type": "rest",     "description": "Rest" },
          "saturday":  { "type": "easy_run", "description": "8 km" }
        }
      },
      {
        "week": 2,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "9.6 km, last 20 min moderate", "progression_format": "moderate" },
          "monday":    { "type": "easy_run",        "description": "9.6 km + 2 x 8-sec hill sprint" },
          "tuesday":   { "type": "easy_run",        "description": "9.6 km" },
          "wednesday": { "type": "easy_run",        "description": "11.2 km" },
          "thursday":  { "type": "easy_run",        "description": "9.6 km + 2 x 8-sec hill sprint" },
          "friday":    { "type": "easy_run",        "description": "9.6 km" },
          "saturday":  { "type": "easy_run",        "description": "8 km" }
        }
      },
      {
        "week": 3,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "14.4 km, last 20 min moderate (uphill if possible)", "progression_format": "moderate_uphill" },
          "monday":    { "type": "easy_run",        "description": "9.6 km + 3 x 8-sec hill sprint" },
          "tuesday":   { "type": "fartlek",         "description": "11.2 km easy w/ 8 x 20 sec @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "wednesday": { "type": "easy_run",        "description": "12.8 km" },
          "thursday":  { "type": "easy_run",        "description": "9.6 km + 3 x 8-sec hill sprint" },
          "friday":    { "type": "easy_run",        "description": "11.2 km" },
          "saturday":  { "type": "rest",            "description": "Rest" }
        }
      },
      {
        "week": 4,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "16 km, last 20 min moderate (uphill if possible)", "progression_format": "long_run_progression" },
          "monday":    { "type": "easy_run",        "description": "9.6 km + 5 x 8-sec hill sprint" },
          "tuesday":   { "type": "fartlek",         "description": "11.2 km easy w/ 8 x 30 sec @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "wednesday": { "type": "easy_run",        "description": "14.4 km" },
          "thursday":  { "type": "easy_run",        "description": "9.6 km + 5 x 8-sec hill sprint" },
          "friday":    { "type": "progression_run", "description": "12.8 km, last 15 min moderate", "progression_format": "moderate" },
          "saturday":  { "type": "rest",            "description": "Rest" }
        }
      },
      {
        "week": 5,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "19.2 km, last 30 min moderate (uphill if possible)", "progression_format": "long_run_progression" },
          "monday":    { "type": "easy_run",        "description": "9.6 km + 6 x 8-sec hill sprint" },
          "tuesday":   { "type": "fartlek",         "description": "11.2 km easy w/ 8 x 45 sec @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "wednesday": { "type": "easy_run",        "description": "16 km" },
          "thursday":  { "type": "easy_run",        "description": "9.6 km" },
          "friday":    { "type": "progression_run", "description": "12.8 km, last 20 min moderate", "progression_format": "moderate" },
          "saturday":  { "type": "rest",            "description": "Rest" }
        }
      },
      {
        "week": 6,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "fartlek",     "description": "16 km easy w/ 10 x 45 sec @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "monday":    { "type": "easy_run",    "description": "9.6 km + 8 x 8-sec hill sprint" },
          "tuesday":   { "type": "fartlek",     "description": "12.8 km easy w/ 8 x 1 min @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "wednesday": { "type": "easy_run",    "description": "16 km" },
          "thursday":  { "type": "easy_run",    "description": "9.6 km" },
          "friday":    { "type": "time_trial",  "description": "4.8 km easy + 6.4 km @ maximum effort + 3.2 km easy", "purpose": "fitness check #1 of 2 (max-effort 6.4-km time trial)" },
          "saturday":  { "type": "easy_run",    "description": "6.4 km" }
        }
      },
      {
        "week": 7,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "14.4 km, last 15 min hard (uphill if possible)", "progression_format": "hard_uphill" },
          "monday":    { "type": "easy_run",         "description": "9.6 km + 9 x 8-sec hill sprint" },
          "tuesday":   { "type": "hill_repetitions", "description": "3.2 km easy + 8 x 1 min uphill @ 5K effort w/ jog-back recoveries + 3.2 km easy" },
          "wednesday": { "type": "easy_run",         "description": "19.2 km" },
          "thursday":  { "type": "easy_run",         "description": "9.6 km" },
          "friday":    { "type": "threshold_run",    "description": "3.2 km easy + 2 x 15 min @ half-marathon/10K pace w/ 1-min active recovery + 3.2 km easy", "threshold_tier": "T2-T3", "threshold_format": "two_intervals" },
          "saturday":  { "type": "easy_run",         "description": "9.6 km" }
        }
      },
      {
        "week": 8,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run", "description": "16 km, last 20 min hard (uphill if possible)", "progression_format": "hard_uphill" },
          "monday":    { "type": "easy_run",        "description": "9.6 km + 10 x 8-sec hill sprint" },
          "tuesday":   { "type": "fartlek",         "description": "12.8 km + 5 x 1 min @ 5K pace / 1 min easy + 4.8 km easy", "fartlek_format": "race_pace_fartlek" },
          "wednesday": { "type": "easy_run",        "description": "16 km" },
          "thursday":  { "type": "easy_run",        "description": "9.6 km" },
          "friday":    { "type": "threshold_run",   "description": "3.2 km easy + 9.6 km @ half-marathon pace + 3.2 km easy", "threshold_tier": "T2", "threshold_format": "one_interval" },
          "saturday":  { "type": "easy_run",        "description": "6.4 km" }
        }
      },
      {
        "week": 9,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "6.4 km easy + 15 x 1 min @ 5K pace / 1 min easy + 3.2 km easy + 3.2 km hard", "progression_format": "fartlek_progression" },
          "monday":    { "type": "easy_run",         "description": "9.6 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "hill_repetitions", "description": "4.8 km easy + 8 x 1 min uphill @ 5K effort w/ jog-back recoveries + 4.8 km easy" },
          "wednesday": { "type": "easy_run",         "description": "16 km" },
          "thursday":  { "type": "easy_run",         "description": "9.6 km" },
          "friday":    { "type": "threshold_run",    "description": "3.2 km easy + 2 x 15 min @ half-marathon/10K pace w/ 5-min active recovery + 3.2 km easy", "threshold_tier": "T2-T3", "threshold_format": "two_intervals" },
          "saturday":  { "type": "easy_run",         "description": "9.6 km" }
        }
      },
      {
        "week": 10,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "19.2 km, last 20 min moderate", "progression_format": "long_run_progression" },
          "monday":    { "type": "easy_run",         "description": "12.8 km + 8 x 10-sec hill sprint" },
          "tuesday":   { "type": "ladder_intervals", "description": "4.8 km easy + 1 min, 2 min, 3 min, 2 min, 1 min, 2 min, 3 min @ 5K-1500m pace w/ 400m jog recoveries + 4.8 km easy", "interval_format": "ladder" },
          "wednesday": { "type": "easy_run",         "description": "19.2 km" },
          "thursday":  { "type": "easy_run",         "description": "12.8 km" },
          "friday":    { "type": "threshold_run",    "description": "3.2 km easy + 8 km @ goal half-marathon pace + 3.2 km easy", "threshold_tier": "T2", "threshold_format": "one_interval" },
          "saturday":  { "type": "easy_run",         "description": "11.2 km" }
        }
      },
      {
        "week": 11,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "20.8 km, last 20 min hard", "progression_format": "hard" },
          "monday":    { "type": "easy_run",         "description": "12.8 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "hill_repetitions", "description": "3.2 km easy + 6 x 2 min uphill @ 5K effort w/ jog-back recoveries + 3.2 km easy" },
          "wednesday": { "type": "easy_run",         "description": "16 km" },
          "thursday":  { "type": "easy_run",         "description": "9.6 km" },
          "friday":    { "type": "time_trial",       "description": "4.8 km easy + 6.4 km @ maximum effort + 3.2 km easy", "purpose": "fitness check #2 of 2 (max-effort 6.4-km time trial)" },
          "saturday":  { "type": "easy_run",         "description": "9.6 km" }
        }
      },
      {
        "week": 12,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "fartlek",         "description": "6.4 km easy + 15 x 90 sec @ 10K pace / 90 sec easy + 6.4 km easy", "fartlek_format": "race_pace_fartlek" },
          "monday":    { "type": "easy_run",        "description": "12.8 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "fartlek",         "description": "3.2 km easy + 8 x 3 min @ 10K pace w/ 2-min active recoveries + 3.2 km easy", "fartlek_format": "race_pace_fartlek" },
          "wednesday": { "type": "easy_run",        "description": "19.2 km" },
          "thursday":  { "type": "easy_run",        "description": "9.6 km" },
          "friday":    { "type": "threshold_run",   "description": "3.2 km easy + 9.6 km @ half-marathon pace + 3.2 km easy", "threshold_tier": "T2", "threshold_format": "one_interval" },
          "saturday":  { "type": "easy_run",        "description": "12.8 km" }
        }
      },
      {
        "week": 13,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "long_run",                   "description": "19.2 km easy" },
          "monday":    { "type": "easy_run",                   "description": "9.6 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "3.2 km easy + 4 x 1.6 km @ 10K pace w/ 3-min active recoveries + 3.2 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "easy_run",                   "description": "19.2 km" },
          "thursday":  { "type": "easy_run",                   "description": "9.6 km" },
          "friday":    { "type": "threshold_run",              "description": "3.2 km easy + 3 x 10 min @ half-marathon/10K pace w/ 2-min active recoveries + 3.2 km easy", "threshold_tier": "T2-T3", "threshold_format": "multi_interval" },
          "saturday":  { "type": "easy_run",                   "description": "6.4 km" }
        }
      },
      {
        "week": 14,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",            "description": "24 km, last 15 min hard", "progression_format": "hard" },
          "monday":    { "type": "easy_run",                   "description": "9.6 km + 10 x 10-sec hill sprint" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "3.2 km easy + 5 x 1K @ 5K pace w/ 90-sec active recoveries + 1.6 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "easy_run",                   "description": "19.2 km" },
          "thursday":  { "type": "easy_run",                   "description": "9.6 km" },
          "friday":    { "type": "aerobic_test",               "description": "4.8 km easy + 6.4 km @ half-marathon heart rate + 4.8 km easy", "purpose": "aerobic fitness check (HR-controlled)" },
          "saturday":  { "type": "easy_run",                   "description": "9.6 km" }
        }
      },
      {
        "week": 15,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",            "description": "20.8 km, last 15-20 min hard", "progression_format": "hard" },
          "monday":    { "type": "easy_run",                   "description": "9.6 km + 8 x 10-sec hill sprint" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "3.2 km easy + 5 x 2K @ 10K pace w/ 3-min active recoveries + 3.2 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "easy_run",                   "description": "16 km" },
          "thursday":  { "type": "easy_run",                   "description": "9.6 km" },
          "friday":    { "type": "threshold_run",              "description": "3.2 km easy + 2 x 15 min @ half-marathon/10K pace w/ 1-min active recovery + 3.2 km easy", "threshold_tier": "T2-T3", "threshold_format": "two_intervals" },
          "saturday":  { "type": "easy_run",                   "description": "6.4 km" }
        }
      },
      {
        "week": 16,
        "training_phase": "taper",
        "days": {
          "sunday":    { "type": "long_run",                   "description": "19.2 km easy" },
          "monday":    { "type": "easy_run",                   "description": "9.6 km + 6 x 10-sec hill sprint" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "4.8 km easy + 3 x 1.6 km @ 10K pace w/ 3-min active recoveries + 4.8 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "easy_run",                   "description": "9.6 km" },
          "thursday":  { "type": "rest",                       "description": "Rest" },
          "friday":    { "type": "easy_run",                   "description": "6.4 km + 4 x 100m strides" },
          "saturday":  { "type": "goal_race",                  "description": "Half-Marathon Goal Race (source shows 'Sa REST / Su 1/2 MARATHON' — race on this weekend; tagged Saturday for schema consistency)" }
        }
      }
    ]
  }
}
```
