# 10K Level 3 Training Plan

## Overview

- **Distance:** 10K
- **Level:** 3 (High Mileage)
- **Duration:** 14 weeks
- **Weekly Volume:** Ranges from 6 runs / 64 km (Week 1) to 7 runs / 99.2 km (Week 12)
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

Runners are grouped into five experience/competitiveness profiles. Each profile maps to a recommended plan level. **This 10K Level 3 plan applies to the `highly_competitive` and `elite` profiles.**

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

> This file contains **only the 10K Level 3 plan**. A runner whose profile maps to Level 1 or Level 2 should use the corresponding 10K Level 1 or Level 2 plan file, not this one.

## Workout Type Glossary

| Code | Description |
|---|---|
| `long_run` | Long, easy-paced run |
| `easy_run` | Easy-paced run |
| `progression_run` | Easy run that finishes with a moderate, hard, or marathon-pace segment. Has 7 sub-formats (see Progression Run Format Reference below). |
| `xtrain_or_rest` | Cross-training or rest |
| `rest` | Full rest day |
| `fartlek` | Easy run with embedded faster surges. Has 4 sub-formats (see Fartlek Format Reference below). |
| `hill_repetitions` | Uphill repetitions at hard effort with jog-back recoveries |
| `threshold_run` | Run with a sustained segment at a threshold pace (T1, T2, or T3 — see Threshold Pace Reference below). May include add-on speed intervals at the end. |
| `speed_intervals` | Short, fast repetition intervals at 3K–1,500m pace targeting neuromuscular speed and economy. |
| `specific_endurance_intervals` | Repetition intervals at goal race pace (5K or 10K pace, depending on phase) |
| `ladder_intervals` | Intervals of varying distance/duration run consecutively (ascending, descending, or pyramid) |
| `aerobic_test` | HR-controlled diagnostic. Run a fixed distance (typically 6.4 km, as prescribed in this plan) **or** a fixed duration (20–30 min, the source's general protocol) at your half-marathon heart rate. Calculate pace from time and distance. Repeat every 5–6 weeks; pace should move toward goal HM pace as fitness improves. |
| `spec_test` | Specific-endurance fitness test for 10K: `4 × 2K @ 10K goal pace + 1K @ maximal effort w/ 3-min jog recoveries`. Identical to the peak workout but with longer rests. Run every 5–6 weeks; compare splits to goal pace. |
| `tune_up_race` | A race or time trial run mid-cycle as a fitness check, **not** the goal race |
| `goal_race` | The target race the plan is built around (final Saturday) |

## Tune-Up & Spec Tests

For 5K and 10K plans, runners check on their specific-endurance fitness every **5–6 weeks** by doing one of the following:

1. **Tune-up race** — race a 5K or 10K, or run a hard time trial, then resume training.
2. **Spec test** — run a controlled workout that approximates race pace at a slightly relaxed effort.
3. **Aerobic test** (`aerobic_test`) — warm up, then run a fixed distance (6.4 km in this plan) or duration (20–30 min) on a track at your half-marathon heart rate. Calculate pace from time and distance. As fitness improves, the pace at this HR moves toward goal HM pace. (Tracks aerobic fitness rather than top-end specific endurance — useful inside a 10K cycle as a complementary signal.)

This 10K Level 3 plan uses **two aerobic tests** as its diagnostic checkpoints (no traditional tune-up race), spaced to roughly match the 5–6 week guideline:

| Field | Value |
|---|---|
| Cadence | Every 5–6 weeks |
| Diagnostic format used | Aerobic test (`aerobic_test`) |
| Week 6 Friday | Aerobic test #1 (6.4 km @ HM heart rate) |
| Week 11 Friday | Aerobic test #2 (6.4 km @ HM heart rate) |

Each repeat of the aerobic test should yield a faster 6.4-km time at the same heart rate — that improvement is the diagnostic signal.

## Threshold Pace Reference

Threshold workouts in this plan target one of three distinct paces:

| Pace ID | Sustainable for... | Elite proxy | Sub-elite proxy |
|---|---|---|---|
| **T1** | ~2.5 hours | A bit slower than marathon pace | Marathon pace or slightly faster |
| **T2** | ~90 minutes | A bit faster than marathon pace | Half-marathon pace |
| **T3** | ~60 minutes | Half-marathon pace or a bit faster | A bit slower than 10K pace |

Source-pace-to-tier mapping used in this plan:

| Source description | Threshold tier |
|---|---|
| "marathon pace" | T1 |
| "half-marathon pace" | T2 |
| "marathon/half-marathon pace" | T1–T2 |
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
    "half-marathon/10K pace":     "T2-T3",
    "10K pace":                   "T3"
  }
}
```

## Training Phases

Each week in the JSON carries a `training_phase` field:

| Phase | Code | Description |
|---|---|---|
| Fundamental | `fundamental` | Builds general fitness and gradually specializes. |
| Sharpening | `sharpening` | Race-specific phase — specific-endurance and threshold work approach goal pace. |
| Taper | `taper` | Volume drops sharply leading into the goal race. |

In this 10K Level 3 plan: **Weeks 1–8 = `fundamental`, Weeks 9–13 = `sharpening`, Week 14 = `taper`**. Sharpening starts in Week 9 when specific-endurance interval workouts first appear at goal-race pace.

---

## Progression Run Format Reference

Progression runs come in **seven distinct formats**, each suited to a different phase or purpose. Each progression run carries a `progression_format` field in its JSON entry.

| Format | Example | Best Use |
|---|---|---|
| `moderate` | `9.6 km easy + 20 min moderate` | Introductory period; later, to add a touch more hard work without overdoing it |
| `moderate_uphill` | `9.6 km easy + 20 min moderate (uphill if possible)` | Introductory period; aerobic + strength simultaneously |
| `hard` | `9.6 km easy + 20 min hard` | Late fundamental period; coaxes aerobic support toward peak |
| `hard_uphill` | `9.6 km easy + 20 min hard (uphill if possible)` | Fundamental period; aerobic + strength after foundation built |
| `long_run_progression` | `19.2 km easy + 30 min moderate` | Throughout the cycle; transforms general race endurance into race-specific endurance |
| `fartlek_progression` | `3.2 km easy + 6.4 km: 1 min @ 5K pace / 1 min easy + 1.6 km easy + 4.8 km moderate` | Late fundamental period; integrates two types of specific-endurance training in one run |
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

## Fartlek Format Reference

Fartleks ("speed play" in Swedish) are runs with embedded faster surges. The source uses fartleks heavily early in the training cycle as a low-pressure way to introduce speed work — typically 20-to-60-second efforts at 1,500m to 10K pace, embedded in easy aerobic runs. The total run duration grows from week to week alongside the surge volume.

Each fartlek workout carries a `fartlek_format` field in its JSON entry.

| Format | Example | Best Use |
|---|---|---|
| `speed_fartlek` | `6.4 km easy w/ 8 × 20 sec @ 3K-1500m pace` | Introductory & early fundamental period — gentle introduction to speed work. Short surges (≤60 sec) at 1,500m–3K pace inside an easy aerobic base run. |
| `race_pace_fartlek` | `12 × 1 min @ 5K pace / 1 min easy` | Late fundamental & sharpening — bridges from pure speed work toward specific endurance. Repeated surges at goal race pace with structured short recoveries. |
| `single_block_fartlek` | `6.4 km w/ 1.6 km @ 5K pace / 1 min easy` | One sustained surge embedded in an easy run — a moderate-stimulus alternative to interval workouts. |
| `mixed_pace_fartlek` | `6 min @ 10K pace + 4 min easy + 4 × 1 min @ 5K pace / 1 min easy` | Combines two race-pace zones in one workout (e.g., 10K pace + 5K pace) — used in sharpening to integrate multiple specific-endurance stimuli. |

### Source guidance on fartleks

- **Run them in pleasant environments** (quiet roads, smooth trails) to forestall any tendency to get too "serious" about them.
- **Progress them by lengthening surges** (20 sec → 25 sec → 30 sec…) and by **adding more surges**, not by speeding up.
- **Total run duration also grows week to week** since fartleks happen inside easy aerobic runs and aerobic base building is a parallel goal.
- The "precise duration and pace do not matter particularly" — fartleks are the workout type where runners can be most relaxed about hitting exact targets.

```json
{
  "fartlek_formats": {
    "speed_fartlek":        { "example": "6.4 km easy w/ 8 x 20 sec @ 3K-1500m pace", "best_use": "Introductory & early fundamental — low-pressure speed introduction" },
    "race_pace_fartlek":    { "example": "12 x 1 min @ 5K pace / 1 min easy", "best_use": "Late fundamental & sharpening — bridge from speed work to specific endurance" },
    "single_block_fartlek": { "example": "6.4 km w/ 1.6 km @ 5K pace / 1 min easy", "best_use": "One sustained surge embedded in an easy run" },
    "mixed_pace_fartlek":   { "example": "6 min @ 10K pace + 4 min easy + 4 x 1 min @ 5K pace / 1 min easy", "best_use": "Sharpening — integrate multiple race-pace zones in one workout" }
  }
}
```

## Threshold Run Format Reference

Threshold runs come in **four distinct formats** (Table 3.3 in source). Each threshold run carries a `threshold_format` field in its JSON entry.

| Format | Example | Best Use |
|---|---|---|
| `one_interval` | `3.2 km easy + 6.4 km @ half-marathon pace + 3.2 km easy` | Shorter versions early in fundamental period; longer versions late to finish the job. |
| `two_intervals` | `3.2 km easy + 15 min @ HM pace + 3.2 km easy + 15 min @ 10K pace + 3.2 km easy` | More total threshold time with a recovery break. |
| `three_intervals` | `3.2 km easy + 10 min @ marathon pace + 1 min easy + 10 min @ HM pace + 1 min easy + 10 min @ 10K pace + 3.2 km easy` | Hits all three threshold-pace levels (T1, T2, T3) in one workout. |
| `multi_interval` | `3.2 km easy + 4 × 6 min @ HM pace w/ 1-min active recoveries + 3.2 km easy` | More than three blocks at a single threshold pace. |

This 10K Level 3 plan is the first to use the **`three_intervals`** format (Week 9 Friday hits T1, T2, and T2–T3 in one workout).

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

**Specific endurance** is the organizing principle of every workout in this plan. It's defined as the ability to sustain goal race pace long enough to reach the finish line without slowing down.

### The ±10% Pace Range

For a workout to count as specific-endurance training, the running effort must fall within a pace range of **10% slower to 10% faster than goal race pace**. The range narrows as the cycle progresses:

| Phase | Pace range vs. goal pace |
|---|---|
| `fundamental` | **±10%** |
| `sharpening`  | **±3–4%** |
| `taper`       | **±3–4%** |

Worked example from the source: if goal pace is **5:58/mile** (sub-37 10K), then ±10% = **6:34/mile to 5:22/mile**. In late sharpening this would narrow to roughly **6:12/mile to 5:44/mile** (±4%).

### How specific-endurance training progresses across the cycle

1. **Pace moves toward goal pace** — early intervals at *current* fitness pace; later intervals at *goal* pace.
2. **Volume of race-pace work per session increases**.
3. **Race-pace efforts become more extended** — e.g., 1K intervals → 2K intervals at 10K pace.
4. **Recoveries shorten** (or for marathon, become faster).

### Peak-level specific-endurance workouts by distance and runner profile

| Race | Runner profile | Peak workout | |
|---|---|---|---|
| 5K | Low-Key Competitive (`low_key`) | 5 × 1K @ goal pace w/ 2-min jog recoveries | |
| 5K | Competitive (`competitive`) | 5 × 1K @ goal pace w/ 90-sec jog recoveries | |
| 5K | Highly Competitive (`highly_competitive`) | 5 × 1K @ 5K pace w/ 1-min jog recoveries | |
| 10K | Low-Key Competitive (`low_key`) | 4 × 2K @ 10K pace w/ 1-min jog recoveries | |
| 10K | Competitive (`competitive`) | 4 × 2K @ 10K pace + 1K @ maximum effort, w/ 1-min jog recoveries | |
| 10K | Highly Competitive (`highly_competitive`) | 4 × 2K @ 10K pace + 1K @ maximum effort, w/ 1-min jog recoveries | ←|
| Half-Marathon | Low-Key Competitive (`low_key`) | 6 × 1.6 km @ half-marathon pace w/ 2-min jog recoveries | |
| Half-Marathon | Competitive (`competitive`) | 4 × 3K @ half-marathon pace w/ 90-sec jog recoveries | |
| Half-Marathon | Highly Competitive (`highly_competitive`) | 3 × 5K @ half-marathon pace w/ 90-sec jog recoveries | |
| Marathon | Low-Key Competitive (`low_key`) | 32–35.2 km easy | |
| Marathon | Competitive (`competitive`) | 16 km easy + 16 km @ marathon pace | |
| Marathon | Highly Competitive (`highly_competitive`) | 45 min easy + 20K: 1K on/1K off (on = marathon goal pace, off = marathon pace + 3–6 sec/km) | |

The arrow (←) marks the row applicable to **this plan** (10K Highly Competitive / Elite). The peak workout `4 × 2K @ 10K pace` appears in **Week 13 Tuesday** of this plan (the last hard SE workout before taper).

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
      "Race-pace efforts become longer (e.g., 1K intervals to 2K intervals)",
      "Recoveries shorten (or for marathon, become faster)"
    ],
    "peak_workouts_by_profile": {
      "low_key":            "4 × 2K @ 10K pace w/ 1-min jog recoveries",
      "competitive":        "4 × 2K @ 10K pace + 1K @ maximum effort, w/ 1-min jog recoveries",
      "highly_competitive": "4 × 2K @ 10K pace + 1K @ maximum effort, w/ 1-min jog recoveries"
    }
  }
}
```

---

## Interval Format Reference

Workouts containing intervals also carry an `interval_format` field:

| Format | Description | Example |
|---|---|---|
| `repetition` | Uniform-distance, uniform-pace intervals | `6 × 800m @ 5K pace` |
| `ladder` | Varying-distance intervals run consecutively | `1 min, 2 min, 3 min, 2 min, 1 min, 2 min, 3 min @ 5K-1500m pace` |
| `add_on` | Small set of speed intervals appended to a slower workout | `2 × 10 min @ HM/10K pace + 8 × 200m @ 3K pace` |

This 10K Level 3 plan uses all three formats: `repetition` (most weeks), `ladder` (Week 7 Tuesday), and `add_on` (Week 13 Friday — the first time any plan uses this format, where speed reps are appended to a threshold run).

---

## Weekly Schedule

### Week 1

| Day | Workout |
|---|---|
| Sunday | Long Run — 9.6 km easy |
| Monday | Easy Run — 8 km + 1 × 8-sec. hill sprint |
| Tuesday | Easy Run — 9.6 km |
| Wednesday | Easy Run — 12.8 km |
| Thursday | Easy Run — 8 km + 2 × 100m strides |
| Friday | Easy Run — 12.8 km |
| Saturday | Rest |

### Week 2

| Day | Workout |
|---|---|
| Sunday | Progression Run — 12.8 km, last 10 min. moderate (uphill, if possible) |
| Monday | Easy Run — 9.6 km + 2 × 8-sec. hill sprint |
| Tuesday | Easy Run — 11.2 km |
| Wednesday | Easy Run — 12.8 km |
| Thursday | Easy Run — 9.6 km + 3 × 8-sec. hill sprint |
| Friday | Easy Run — 14.4 km |
| Saturday | Rest |

### Week 3

| Day | Workout |
|---|---|
| Sunday | Progression Run — 14.4 km, last 15 min. moderate (uphill, if possible) |
| Monday | Easy Run — 8 km + 3 × 8-sec. hill sprint |
| Tuesday | Easy Run — 12.8 km |
| Wednesday | Easy Run — 14.4 km |
| Thursday | Easy Run — 11.2 km + 3 × 8-sec. hill sprint |
| Friday | Progression Run — 14.4 km, last 10 min. moderate |
| Saturday | Rest |

### Week 4

| Day | Workout |
|---|---|
| Sunday | Progression Run — 16 km, last 15 min. moderate |
| Monday | Easy Run — 8 km + 5 × 8-sec. hill sprint |
| Tuesday | Fartlek Run — 3.2 km easy + 8 km easy w/ 20 sec. @ 1,500m pace every 3 min. + 1.6 km easy |
| Wednesday | Easy Run — 14.4 km |
| Thursday | Easy Run — 11.2 km |
| Friday | Progression Run — 14.4 km, last 15 min. moderate |
| Saturday | Rest |

### Week 5

| Day | Workout |
|---|---|
| Sunday | Progression Run — 19.2 km, last 20 min. moderate (uphill, if possible) |
| Monday | Easy Run — 11.2 km + 6 × 100m strides |
| Tuesday | Fartlek Run — 3.2 km easy + 8 km easy w/ 30 sec. @ 1,500m pace every 3 min. + 1.6 km easy |
| Wednesday | Easy Run — 16 km |
| Thursday | Easy Run — 11.2 km + 6 × 8-sec. hill sprint |
| Friday | Progression Run — 14.4 km, last 20 min. moderate |
| Saturday | Rest |

### Week 6

| Day | Workout |
|---|---|
| Sunday | Fartlek Run + Progression — 3.2 km easy + 6.4 km: 1 min. @ 5K pace / 1 min. easy + 1.6 km easy + 4.8 km moderate |
| Monday | Easy Run — 9.6 km |
| Tuesday | Hill Repetitions — 3.2 km easy + 8 × 1.6 km uphill @ 3K effort w/ jog-back recoveries + 3.2 km easy |
| Wednesday | Easy Run — 14.4 km |
| Thursday | Easy Run — 9.6 km + 8 × 8-sec. hill sprint |
| Friday | Aerobic Test — 3.2 km easy + 6.4 km @ half-marathon heart rate + 4.8 km easy |
| Saturday | Rest |

### Week 7

| Day | Workout |
|---|---|
| Sunday | Progression Run — 19.2 km, last 25 min. moderate |
| Monday | Easy Run — 9.6 km |
| Tuesday | Ladder Intervals — 3.2 km easy + 1 min, 2 min, 3 min, 2 min, 1 min, 2 min, 3 min @ 5K–1,500m pace w/ equal-duration active recoveries + 3.2 km easy |
| Wednesday | Easy Run — 14.4 km |
| Thursday | Easy Run — 9.6 km + 6 × 8-sec. hill sprint |
| Friday | Threshold Run — 3.2 km easy + 2 × 10 min. @ marathon/half-marathon pace w/ 2-min. active recovery + 3.2 km easy |
| Saturday | Easy Run — 6.4 km |

### Week 8

| Day | Workout |
|---|---|
| Sunday | Progression Run — 22.4 km, last 15 min. hard |
| Monday | Easy Run — 9.6 km + 6 × 100m strides |
| Tuesday | Hill Repetitions — 3.2 km easy + 5 × 3.2 km uphill @ 5K–3K effort w/ jog-back recoveries + 3.2 km easy |
| Wednesday | Easy Run — 14.4 km |
| Thursday | Easy Run — 9.6 km + 8 × 8-sec. hill sprint |
| Friday | Threshold Run — 3.2 km easy + 2 × 15 min. @ marathon/half-marathon pace w/ 2-min. active recovery + 3.2 km easy |
| Saturday | Easy Run — 8 km |

### Week 9

| Day | Workout |
|---|---|
| Sunday | Progression Run — 19.2 km, last 15 min. hard |
| Monday | Easy Run — 11.2 km |
| Tuesday | Specific-Endurance Intervals — 3.2 km easy + 2 × (10 × 400m @ 5K pace w/ 1-min. active recoveries), full recovery between sets + 3.2 km easy |
| Wednesday | Easy Run — 16 km |
| Thursday | Easy Run — 11.2 km + 8 × 8-sec. hill sprint |
| Friday | Threshold Run — 3.2 km easy + 10 min. @ marathon pace + 10 min. @ half-marathon pace + 10 min. @ half-marathon/10K pace + 3.2 km easy |
| Saturday | Rest |

### Week 10

| Day | Workout |
|---|---|
| Sunday | Progression Run — 22.4 km, last 20 min. hard |
| Monday | Easy Run — 11.2 km |
| Tuesday | Specific-Endurance Intervals — 3.2 km easy + 8 × 800m @ 10K–5K pace w/ 2-min. active recoveries + 3.2 km easy |
| Wednesday | Easy Run — 16 km |
| Thursday | Easy Run — 11.2 km + 8 × 8-sec. hill sprint |
| Friday | Threshold Run — 3.2 km easy + 2 × 15 min. @ half-marathon pace w/ 1-min. active recovery + 3.2 km easy |
| Saturday | Easy Run — 9.6 km |

### Week 11

| Day | Workout |
|---|---|
| Sunday | Progression Run — 19.2 km, last 20 min. moderate |
| Monday | Easy Run — 8 km |
| Tuesday | Specific-Endurance Intervals — 3.2 km easy + 8 × 1K @ 10K pace + 3–6 sec/km w/ 80-sec. active recoveries + 3.2 km easy |
| Wednesday | Easy Run — 16 km |
| Thursday | Easy Run — 9.6 km + 6 × 8-sec. hill sprint |
| Friday | Aerobic Test — 3.2 km easy + 6.4 km @ half-marathon heart rate + 3.2 km easy |
| Saturday | Rest |

### Week 12

| Day | Workout |
|---|---|
| Sunday | Progression Run — 22.4 km, last 15 min. hard |
| Monday | Easy Run — 11.2 km |
| Tuesday | Specific-Endurance Intervals — 3.2 km easy + 3 × (2K @ 10K pace / 1K easy) + 3.2 km easy |
| Wednesday | Easy Run — 19.2 km |
| Thursday | Easy Run — 12.8 km + 6 × 8-sec. hill sprint |
| Friday | Threshold Run — 3.2 km easy + 2 × 15 min. @ half-marathon pace w/ 1-min. active recovery + 3.2 km easy |
| Saturday | Easy Run — 8 km |

### Week 13

| Day | Workout |
|---|---|
| Sunday | Progression Run — 16 km, last 20 min. moderate |
| Monday | Easy Run — 8 km |
| Tuesday | Specific-Endurance Intervals — 3.2 km easy + 4 × 2K @ 10K pace w/ 3-min. active recoveries + 3.2 km easy |
| Wednesday | Easy Run — 16 km |
| Thursday | Easy Run — 12.8 km + 6 × 8-sec. hill sprint |
| Friday | Threshold Run + Speed Intervals — 3.2 km easy + 2 × 10 min. @ half-marathon/10K pace w/ 2-min. active recovery + 8 × 200m @ 3K pace w/ 200m jog recoveries + 1.6 km easy |
| Saturday | Rest |

### Week 14

| Day | Workout |
|---|---|
| Sunday | Progression Run — 16 km, last 20 min. moderate |
| Monday | Easy Run — 9.6 km |
| Tuesday | Specific-Endurance Intervals — 3.2 km easy + 1.6 km @ 5K pace + 4 min. easy + 8 × 400m @ 3K pace w/ 1-min. active recoveries + 3.2 km easy |
| Wednesday | Easy Run — 9.6 km |
| Thursday | Easy Run — 6.4 km |
| Friday | Easy Run — 6.4 km + 3 × 100m strides |
| Saturday | **Goal Race — 10K** |

---

## Structured Data (JSON)

The following JSON block contains the same plan in a machine-readable format suitable for parsing in code.

```json
{
  "plan": {
    "distance": "10K",
    "level": 3,
    "level_name": "High Mileage",
    "duration_weeks": 14,
    "applies_to_runner_profiles": [
      "highly_competitive",
      "elite"
    ],
    "weekly_volume": {
      "min_runs": 6,
      "max_runs": 7,
      "min_miles": 40,
      "max_miles": 62
    },
    "specific_endurance": {
      "definition": "Ability to sustain goal race pace long enough to finish without slowing down",
      "pace_range_pct_offset_from_goal": {
        "fundamental": {
          "slower_pct": 10,
          "faster_pct": 10
        },
        "sharpening": {
          "slower_pct": 4,
          "faster_pct": 4
        },
        "taper": {
          "slower_pct": 4,
          "faster_pct": 4
        }
      },
      "progression_dimensions": [
        "Pace moves from current fitness pace toward goal pace",
        "Volume of race-pace work per session increases",
        "Race-pace efforts become longer (e.g., 1K intervals to 2K intervals)",
        "Recoveries shorten (or for marathon, become faster)"
      ],
      "peak_workouts_by_profile": {
        "low_key": "4 \u00d7 2K @ 10K pace w/ 1-min jog recoveries",
        "competitive": "4 \u00d7 2K @ 10K pace + 1K @ maximum effort, w/ 1-min jog recoveries",
        "highly_competitive": "4 \u00d7 2K @ 10K pace + 1K @ maximum effort, w/ 1-min jog recoveries"
      }
    },
    "weeks": [
      {
        "week": 1,
        "training_phase": "fundamental",
        "days": {
          "sunday": {
            "type": "long_run",
            "description": "9.6 km easy"
          },
          "monday": {
            "type": "easy_run",
            "description": "8 km + 1 x 8-sec hill sprint"
          },
          "tuesday": {
            "type": "easy_run",
            "description": "9.6 km"
          },
          "wednesday": {
            "type": "easy_run",
            "description": "12.8 km"
          },
          "thursday": {
            "type": "easy_run",
            "description": "8 km + 2 x 100m strides"
          },
          "friday": {
            "type": "easy_run",
            "description": "12.8 km"
          },
          "saturday": {
            "type": "rest",
            "description": "Rest"
          }
        }
      },
      {
        "week": 2,
        "training_phase": "fundamental",
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "12.8 km, last 10 min moderate (uphill if possible)",
            "progression_format": "moderate_uphill"
          },
          "monday": {
            "type": "easy_run",
            "description": "9.6 km + 2 x 8-sec hill sprint"
          },
          "tuesday": {
            "type": "easy_run",
            "description": "11.2 km"
          },
          "wednesday": {
            "type": "easy_run",
            "description": "12.8 km"
          },
          "thursday": {
            "type": "easy_run",
            "description": "9.6 km + 3 x 8-sec hill sprint"
          },
          "friday": {
            "type": "easy_run",
            "description": "14.4 km"
          },
          "saturday": {
            "type": "rest",
            "description": "Rest"
          }
        }
      },
      {
        "week": 3,
        "training_phase": "fundamental",
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "14.4 km, last 15 min moderate (uphill if possible)",
            "progression_format": "moderate_uphill"
          },
          "monday": {
            "type": "easy_run",
            "description": "8 km + 3 x 8-sec hill sprint"
          },
          "tuesday": {
            "type": "easy_run",
            "description": "12.8 km"
          },
          "wednesday": {
            "type": "easy_run",
            "description": "14.4 km"
          },
          "thursday": {
            "type": "easy_run",
            "description": "11.2 km + 3 x 8-sec hill sprint"
          },
          "friday": {
            "type": "progression_run",
            "description": "14.4 km, last 10 min moderate",
            "progression_format": "moderate"
          },
          "saturday": {
            "type": "rest",
            "description": "Rest"
          }
        }
      },
      {
        "week": 4,
        "training_phase": "fundamental",
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "16 km, last 15 min moderate",
            "progression_format": "long_run_progression"
          },
          "monday": {
            "type": "easy_run",
            "description": "8 km + 5 x 8-sec hill sprint"
          },
          "tuesday": {
            "type": "fartlek",
            "description": "3.2 km easy + 8 km easy w/ 20 sec @ 1500m pace every 3 min + 1.6 km easy",
            "fartlek_format": "speed_fartlek"
          },
          "wednesday": {
            "type": "easy_run",
            "description": "14.4 km"
          },
          "thursday": {
            "type": "easy_run",
            "description": "11.2 km"
          },
          "friday": {
            "type": "progression_run",
            "description": "14.4 km, last 15 min moderate",
            "progression_format": "moderate"
          },
          "saturday": {
            "type": "rest",
            "description": "Rest"
          }
        }
      },
      {
        "week": 5,
        "training_phase": "fundamental",
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "19.2 km, last 20 min moderate (uphill if possible)",
            "progression_format": "long_run_progression"
          },
          "monday": {
            "type": "easy_run",
            "description": "11.2 km + 6 x 100m strides"
          },
          "tuesday": {
            "type": "fartlek",
            "description": "3.2 km easy + 8 km easy w/ 30 sec @ 1500m pace every 3 min + 1.6 km easy",
            "fartlek_format": "speed_fartlek"
          },
          "wednesday": {
            "type": "easy_run",
            "description": "16 km"
          },
          "thursday": {
            "type": "easy_run",
            "description": "11.2 km + 6 x 8-sec hill sprint"
          },
          "friday": {
            "type": "progression_run",
            "description": "14.4 km, last 20 min moderate",
            "progression_format": "moderate"
          },
          "saturday": {
            "type": "rest",
            "description": "Rest"
          }
        }
      },
      {
        "week": 6,
        "training_phase": "fundamental",
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "3.2 km easy + 6.4 km: 1 min @ 5K pace / 1 min easy + 1.6 km easy + 4.8 km moderate",
            "progression_format": "fartlek_progression"
          },
          "monday": {
            "type": "easy_run",
            "description": "9.6 km"
          },
          "tuesday": {
            "type": "hill_repetitions",
            "description": "3.2 km easy + 8 x 1.6 km uphill @ 3K effort w/ jog-back recoveries + 3.2 km easy"
          },
          "wednesday": {
            "type": "easy_run",
            "description": "14.4 km"
          },
          "thursday": {
            "type": "easy_run",
            "description": "9.6 km + 8 x 8-sec hill sprint"
          },
          "friday": {
            "type": "aerobic_test",
            "description": "3.2 km easy + 6.4 km @ half-marathon heart rate + 4.8 km easy",
            "purpose": "aerobic fitness check (#1 of 2)"
          },
          "saturday": {
            "type": "rest",
            "description": "Rest"
          }
        }
      },
      {
        "week": 7,
        "training_phase": "fundamental",
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "19.2 km, last 25 min moderate",
            "progression_format": "long_run_progression"
          },
          "monday": {
            "type": "easy_run",
            "description": "9.6 km"
          },
          "tuesday": {
            "type": "ladder_intervals",
            "description": "3.2 km easy + 1 min, 2 min, 3 min, 2 min, 1 min, 2 min, 3 min @ 5K-1500m pace w/ equal-duration active recoveries + 3.2 km easy",
            "interval_format": "ladder"
          },
          "wednesday": {
            "type": "easy_run",
            "description": "14.4 km"
          },
          "thursday": {
            "type": "easy_run",
            "description": "9.6 km + 6 x 8-sec hill sprint"
          },
          "friday": {
            "type": "threshold_run",
            "description": "3.2 km easy + 2 x 10 min @ marathon/half-marathon pace w/ 2-min active recovery + 3.2 km easy",
            "threshold_tier": "T1-T2",
            "threshold_format": "two_intervals"
          },
          "saturday": {
            "type": "easy_run",
            "description": "6.4 km"
          }
        }
      },
      {
        "week": 8,
        "training_phase": "fundamental",
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "22.4 km, last 15 min hard",
            "progression_format": "hard"
          },
          "monday": {
            "type": "easy_run",
            "description": "9.6 km + 6 x 100m strides"
          },
          "tuesday": {
            "type": "hill_repetitions",
            "description": "3.2 km easy + 5 x 3.2 km uphill @ 5K-3K effort w/ jog-back recoveries + 3.2 km easy"
          },
          "wednesday": {
            "type": "easy_run",
            "description": "14.4 km"
          },
          "thursday": {
            "type": "easy_run",
            "description": "9.6 km + 8 x 8-sec hill sprint"
          },
          "friday": {
            "type": "threshold_run",
            "description": "3.2 km easy + 2 x 15 min @ marathon/half-marathon pace w/ 2-min active recovery + 3.2 km easy",
            "threshold_tier": "T1-T2",
            "threshold_format": "two_intervals"
          },
          "saturday": {
            "type": "easy_run",
            "description": "8 km"
          }
        }
      },
      {
        "week": 9,
        "training_phase": "sharpening",
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "19.2 km, last 15 min hard",
            "progression_format": "hard"
          },
          "monday": {
            "type": "easy_run",
            "description": "11.2 km"
          },
          "tuesday": {
            "type": "specific_endurance_intervals",
            "description": "3.2 km easy + 2 x (10 x 400m @ 5K pace w/ 1-min active recoveries), full recovery between sets + 3.2 km easy",
            "interval_format": "repetition"
          },
          "wednesday": {
            "type": "easy_run",
            "description": "16 km"
          },
          "thursday": {
            "type": "easy_run",
            "description": "11.2 km + 8 x 8-sec hill sprint"
          },
          "friday": {
            "type": "threshold_run",
            "description": "3.2 km easy + 10 min @ marathon pace + 10 min @ half-marathon pace + 10 min @ half-marathon/10K pace + 3.2 km easy",
            "threshold_tier": "T1-T3",
            "threshold_format": "three_intervals"
          },
          "saturday": {
            "type": "rest",
            "description": "Rest"
          }
        }
      },
      {
        "week": 10,
        "training_phase": "sharpening",
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "22.4 km, last 20 min hard",
            "progression_format": "hard"
          },
          "monday": {
            "type": "easy_run",
            "description": "11.2 km"
          },
          "tuesday": {
            "type": "specific_endurance_intervals",
            "description": "3.2 km easy + 8 x 800m @ 10K-5K pace w/ 2-min active recoveries + 3.2 km easy",
            "interval_format": "repetition"
          },
          "wednesday": {
            "type": "easy_run",
            "description": "16 km"
          },
          "thursday": {
            "type": "easy_run",
            "description": "11.2 km + 8 x 8-sec hill sprint"
          },
          "friday": {
            "type": "threshold_run",
            "description": "3.2 km easy + 2 x 15 min @ half-marathon pace w/ 1-min active recovery + 3.2 km easy",
            "threshold_tier": "T2",
            "threshold_format": "two_intervals"
          },
          "saturday": {
            "type": "easy_run",
            "description": "9.6 km"
          }
        }
      },
      {
        "week": 11,
        "training_phase": "sharpening",
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "19.2 km, last 20 min moderate",
            "progression_format": "long_run_progression"
          },
          "monday": {
            "type": "easy_run",
            "description": "8 km"
          },
          "tuesday": {
            "type": "specific_endurance_intervals",
            "description": "3.2 km easy + 8 x 1K @ 10K pace + 3-6 sec/km w/ 80-sec active recoveries + 3.2 km easy",
            "interval_format": "repetition"
          },
          "wednesday": {
            "type": "easy_run",
            "description": "16 km"
          },
          "thursday": {
            "type": "easy_run",
            "description": "9.6 km + 6 x 8-sec hill sprint"
          },
          "friday": {
            "type": "aerobic_test",
            "description": "3.2 km easy + 6.4 km @ half-marathon heart rate + 3.2 km easy",
            "purpose": "aerobic fitness check (#2 of 2)"
          },
          "saturday": {
            "type": "rest",
            "description": "Rest"
          }
        }
      },
      {
        "week": 12,
        "training_phase": "sharpening",
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "22.4 km, last 15 min hard",
            "progression_format": "hard"
          },
          "monday": {
            "type": "easy_run",
            "description": "11.2 km"
          },
          "tuesday": {
            "type": "specific_endurance_intervals",
            "description": "3.2 km easy + 3 x (2K @ 10K pace / 1K easy) + 3.2 km easy",
            "interval_format": "repetition"
          },
          "wednesday": {
            "type": "easy_run",
            "description": "19.2 km"
          },
          "thursday": {
            "type": "easy_run",
            "description": "12.8 km + 6 x 8-sec hill sprint"
          },
          "friday": {
            "type": "threshold_run",
            "description": "3.2 km easy + 2 x 15 min @ half-marathon pace w/ 1-min active recovery + 3.2 km easy",
            "threshold_tier": "T2",
            "threshold_format": "two_intervals"
          },
          "saturday": {
            "type": "easy_run",
            "description": "8 km"
          }
        }
      },
      {
        "week": 13,
        "training_phase": "sharpening",
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "16 km, last 20 min moderate",
            "progression_format": "long_run_progression"
          },
          "monday": {
            "type": "easy_run",
            "description": "8 km"
          },
          "tuesday": {
            "type": "specific_endurance_intervals",
            "description": "3.2 km easy + 4 x 2K @ 10K pace w/ 3-min active recoveries + 3.2 km easy",
            "interval_format": "repetition"
          },
          "wednesday": {
            "type": "easy_run",
            "description": "16 km"
          },
          "thursday": {
            "type": "easy_run",
            "description": "12.8 km + 6 x 8-sec hill sprint"
          },
          "friday": {
            "type": "threshold_run",
            "description": "3.2 km easy + 2 x 10 min @ half-marathon/10K pace w/ 2-min active recovery + 8 x 200m @ 3K pace w/ 200m jog recoveries + 1.6 km easy",
            "threshold_tier": "T2-T3",
            "threshold_format": "two_intervals",
            "interval_format": "add_on"
          },
          "saturday": {
            "type": "rest",
            "description": "Rest"
          }
        }
      },
      {
        "week": 14,
        "training_phase": "taper",
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "16 km, last 20 min moderate",
            "progression_format": "long_run_progression"
          },
          "monday": {
            "type": "easy_run",
            "description": "9.6 km"
          },
          "tuesday": {
            "type": "specific_endurance_intervals",
            "description": "3.2 km easy + 1.6 km @ 5K pace + 4 min easy + 8 x 400m @ 3K pace w/ 1-min active recoveries + 3.2 km easy",
            "interval_format": "repetition"
          },
          "wednesday": {
            "type": "easy_run",
            "description": "9.6 km"
          },
          "thursday": {
            "type": "easy_run",
            "description": "6.4 km"
          },
          "friday": {
            "type": "easy_run",
            "description": "6.4 km + 3 x 100m strides"
          },
          "saturday": {
            "type": "goal_race",
            "description": "10K Goal Race"
          }
        }
      }
    ]
  }
}
```
