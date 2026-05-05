# 5K Level 1 Training Plan

## Overview

- **Distance:** 5K
- **Level:** 1 (Beginner / Low Mileage)
- **Duration:** 12 weeks
- **Weekly Volume:** Ranges from 4 runs / 19.2 km (Week 1) to 6 runs / 41.6 km (Week 10)
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

Runners are grouped into five experience/competitiveness profiles. Each profile maps to a recommended plan level. **This 5K Level 1 plan applies to the `beginner` and `low_key` profiles.**

| Runner Profile | Code | Recommended Plan Level | Description |
|---|---|---|---|
| Beginner | `beginner` | **Level 1** | New to running or returning after a long break |
| Low-Key | `low_key` | **Level 1** | Runs regularly but prefers low mileage; not focused on racing performance |
| Competitive | `competitive` | **Level 2** | More experienced, races regularly, willing to handle moderate volume |
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

> This file contains **only the Level 1 plan**. A runner whose profile maps to Level 2 or Level 3 should use the corresponding Level 2 or Level 3 plan file, not this one.

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
| `specific_endurance_intervals` | Track/road intervals at 5K–3K pace |
| `spec_test` | Specific-endurance fitness test: `5 × 1K @ 5K pace w/ 2-min recoveries`. A diagnostic workout — compare splits to goal pace to gauge training progress. |
| `tune_up_race` | A 5K race or time trial run mid-cycle as a fitness check, **not** the goal race |
| `goal_race` | The target race the plan is built around (final Saturday) |

## Tune-Up & Spec Tests

For 5K and 10K plans, runners check on their specific-endurance fitness every **5–6 weeks** by doing one of the following:

1. **Tune-up race** (`tune_up_race`) — race a 5K or run a hard time trial, then resume training. Practical because 5K/10K distances can be raced frequently without major recovery cost.
2. **Spec test** (`spec_test`) — run the workout `5 × 1K @ 5K goal pace w/ 2-min recoveries`. This is identical to the peak-level specific-endurance workout *except* the recoveries are 2 min instead of 1 min. Try to sustain goal race pace across all five intervals. How close you come (and how hard it feels) indicates the current state of your specific endurance.

Either option works — the tune-up race is a real race, the spec test is a controlled workout that gives equivalent diagnostic information. There's no formula for what splits "should" be; compare them to goal pace, factor in how many weeks of training remain, and adjust accordingly.

| Field | Value |
|---|---|
| Cadence | Every 5–6 weeks |
| Spec test workout | `5 × 1K @ 5K goal pace w/ 2-min recoveries` |
| Substitutable with | A 5K tune-up race or time trial |

## Training Phases

Each week in the JSON carries a `training_phase` field describing where it sits in the macrocycle:

| Phase | Code | Description |
|---|---|---|
| Fundamental | `fundamental` | Builds general fitness and gradually specializes. Emphasis on aerobic base, hill sprints, and general fartlek work. |
| Sharpening | `sharpening` | Race-specific phase — specific-endurance intervals approach goal pace. |
| Taper | `taper` | Volume drops sharply leading into the goal race (race week). |

In this Level 1 plan: **Weeks 1–7 = `fundamental`, Weeks 8–11 = `sharpening`, Week 12 = `taper`**.

## Interval Format Reference

Workouts containing intervals also carry an `interval_format` field. The three formats are:

| Format | Description | Example |
|---|---|---|
| `repetition` | Uniform-distance, uniform-pace intervals | `6 × 800m @ 5K pace` |
| `ladder` | Varying-distance intervals run consecutively (ascending/descending/pyramid) | `6 min, 5 min, 4 min, 3 min, 2 min, 1 min @ 10K–1,500m pace` |
| `add_on` | Small set of speed intervals appended to a slower workout | `20-min threshold run + 4 × 300m @ 3K pace` |

This Level 1 plan uses only the `repetition` format (Weeks 8, 10, 11, 12).

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

## Progression Run Format Reference

Progression runs come in **seven distinct formats**, each suited to a different phase or purpose. The primary purpose of any progression run is to provide a **moderate stimulus** for aerobic development — stronger than an easy run but weaker than most threshold runs. They let runners squeeze a little more beneficial work into a week without overtaxing recovery.

Each progression run carries a `progression_format` field in its JSON entry.

| Format | Example | Best Use |
|---|---|---|
| `moderate` | `9.6 km easy + 20 min moderate` | Introductory period (prepare for threshold work); later, to add a touch more hard work without overdoing it |
| `moderate_uphill` | `9.6 km easy + 20 min moderate (uphill if possible)` | Introductory period; builds aerobic support **and** strength simultaneously |
| `hard` | `9.6 km easy + 20 min hard` | Late fundamental period; coaxes aerobic support toward peak level |
| `hard_uphill` | `9.6 km easy + 20 min hard (uphill if possible)` | Fundamental period; aerobic + strength after foundation built with moderate uphill progressions |
| `long_run_progression` | `19.2 km easy + 30 min moderate` | Throughout the cycle; transforms general race endurance into race-specific endurance |
| `fartlek_progression` | `3.2 km easy + 6.4 km: 1 min @ 10K pace / 1 min easy + 3.2 km easy + 3.2 km hard` | Late fundamental period; integrates two types of specific-endurance training in one run |
| `marathon_pace_progression` | `11.2 km easy + 20 min @ marathon pace` | Provides a 10K-pace or marathon-pace training stimulus inside a longer run |

### General guidance from the source

- Most useful in the **introductory period** when fitness is still building and threshold workouts aren't yet appropriate.
- In **fundamental and sharpening periods**, threshold workouts take primary responsibility for aerobic development — but one or two progression runs per week still earn their keep.
- **Longer-distance runners use more progression runs** than shorter-distance runners. Half-marathon and marathon plans use them liberally because the moderate paces overlap with race pace.
- **5K and 10K runners** lean more heavily on faster intensities (specific-endurance intervals, threshold runs) and use progression runs as supporting workouts.

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

## Specific-Endurance Reference

**Specific endurance** is the organizing principle of every workout in this plan. It's defined as the ability to sustain goal race pace long enough to reach the finish line without slowing down. Every workout — even easy runs and hill sprints — exists to support specific-endurance development for the goal race.

### The ±10% Pace Range

For a workout to count as specific-endurance training, the running effort must fall within a pace range of **10% slower to 10% faster than goal race pace**. Outside this range, work is still beneficial (aerobic base, neuromuscular speed) but isn't close enough to race pace to drive race-specific adaptation.

The range narrows as the cycle progresses:

| Phase | Pace range vs. goal pace | What it means |
|---|---|---|
| `fundamental` | **±10%** | Wide range — workouts from 10% slower to 10% faster than goal pace |
| `sharpening`  | **±3–4%** | Narrowed — most race-specific work clusters very close to goal pace |
| `taper`       | **±3–4%** | Pace specificity preserved; volume drops sharply |

Worked example from the source: if goal pace is **5:58/mile** (sub-37 10K), then ±10% = **6:34/mile to 5:22/mile**. In late sharpening this would narrow to roughly **6:12/mile to 5:44/mile** (±4%).

### How specific-endurance training progresses across the cycle

The plan progresses race-specific work along four dimensions:

1. **Pace moves toward goal pace** — early intervals may be at *current* fitness pace; later intervals are at *goal* pace.
2. **Volume of race-pace work per session increases** — more total time at race pace as the race nears.
3. **Race-pace efforts become more extended** — e.g., 1K intervals → 2K intervals at 10K pace.
4. **Recoveries shorten** (or, for marathon, become faster) — making the workout more race-like.

### Peak-level specific-endurance workouts by distance and runner profile

By the final weeks of training, the specific-endurance workout at each runner's peak should look like one of these (Table 5.1 in source):

| Race | Runner profile | Peak workout | |
|---|---|---|---|
| 5K | Low-Key Competitive (`low_key`) | 5 × 1K @ goal pace w/ 2-min jog recoveries | ←
| 5K | Competitive (`competitive`) | 5 × 1K @ goal pace w/ 90-sec jog recoveries | ←
| 5K | Highly Competitive (`highly_competitive`) | 5 × 1K @ 5K pace w/ 1-min jog recoveries | ←
| 10K | Low-Key Competitive (`low_key`) | 4 × 2K @ 10K pace w/ 1-min jog recoveries |
| 10K | Competitive (`competitive`) | 4 × 2K @ 10K pace + 1K @ maximum effort, w/ 1-min jog recoveries |
| 10K | Highly Competitive (`highly_competitive`) | 4 × 2K @ 10K pace + 1K @ maximum effort, w/ 1-min jog recoveries |
| Half-Marathon | Low-Key Competitive (`low_key`) | 6 × 1.6 km @ half-marathon pace w/ 2-min jog recoveries |
| Half-Marathon | Competitive (`competitive`) | 4 × 3K @ half-marathon pace w/ 90-sec jog recoveries |
| Half-Marathon | Highly Competitive (`highly_competitive`) | 3 × 5K @ half-marathon pace w/ 90-sec jog recoveries |
| Marathon | Low-Key Competitive (`low_key`) | 32–35.2 km easy |
| Marathon | Competitive (`competitive`) | 16 km easy + 16 km @ marathon pace |
| Marathon | Highly Competitive (`highly_competitive`) | 45 min easy + 20K: 1K on/1K off (on = marathon goal pace, off = marathon pace + 3–6 sec/km) |

The arrow (←) marks the row applicable to **this plan** (5K).

> Note on overlap: some workouts serve double duty. A 5K runner doing intervals at 3K pace is doing both *speed* and *specific-endurance* work (3K pace ≈ 4–5% faster than 5K pace, well inside the ±10% range). A half-marathon runner doing a threshold run at half-marathon pace is also doing specific-endurance training.

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
      "low_key":            "5 \u00d7 1K @ goal pace w/ 2-min jog recoveries",
      "competitive":        "5 \u00d7 1K @ goal pace w/ 90-sec jog recoveries",
      "highly_competitive": "5 \u00d7 1K @ 5K pace w/ 1-min jog recoveries"
    }
  }
}
```

---

## Weekly Schedule

### Week 1

| Day | Workout |
|---|---|
| Sunday | Long Run — 6.4 km easy |
| Monday | Easy Run — 4.8 km + 1 × 8-sec. hill sprint |
| Tuesday | X-Train or Rest |
| Wednesday | Easy Run — 4.8 km |
| Thursday | X-Train or Rest |
| Friday | Rest |
| Saturday | Easy Run — 3.2 km + 1 × 8-sec. hill sprint |

### Week 2

| Day | Workout |
|---|---|
| Sunday | Long Run — 8 km easy |
| Monday | Easy Run — 4.8 km + 2 × 8-sec. hill sprint |
| Tuesday | X-Train or Rest |
| Wednesday | Easy Run — 6.4 km |
| Thursday | X-Train or Rest |
| Friday | Rest |
| Saturday | Easy Run — 4.8 km + 2 × 8-sec. hill sprint |

### Week 3

| Day | Workout |
|---|---|
| Sunday | Long Run — 9.6 km easy |
| Monday | Easy Run — 4.8 km + 3 × 8-sec. hill sprint |
| Tuesday | X-Train or Rest |
| Wednesday | Easy Run — 6.4 km |
| Thursday | X-Train or Rest |
| Friday | Rest |
| Saturday | Easy Run — 4.8 km + 3 × 8-sec. hill sprint |

### Week 4

| Day | Workout |
|---|---|
| Sunday | Progression Run — 9.6 km, last 10 min. moderate |
| Monday | X-Train or Rest |
| Tuesday | Fartlek Run — 6.4 km easy w/ 8 × 20 sec. @ 3K–1,500m pace |
| Wednesday | Easy Run — 6.4 km |
| Thursday | X-Train or Rest |
| Friday | Rest |
| Saturday | Easy Run — 4.8 km + 5 × 8-sec. hill sprint |

### Week 5

| Day | Workout |
|---|---|
| Sunday | Progression Run — 9.6 km, last 15 min. moderate |
| Monday | X-Train or Rest |
| Tuesday | Fartlek Run — 6.4 km easy w/ 8 × 30 sec. @ 3K–1,500m pace |
| Wednesday | X-Train or Rest |
| Thursday | Easy Run — 6.4 km + 6 × 8-sec. hill sprint |
| Friday | Rest |
| Saturday | Easy Run — 6.4 km |

### Week 6

| Day | Workout |
|---|---|
| Sunday | Progression Run — 9.6 km, last 20 min. moderate |
| Monday | X-Train or Rest |
| Tuesday | Fartlek Run — 8 km easy w/ 8 × 40 sec. @ 5K–3K pace |
| Wednesday | X-Train or Rest |
| Thursday | Easy Run — 6.4 km |
| Friday | Rest |
| Saturday | Easy Run — 6.4 km + 7 × 8-sec. hill sprint |

### Week 7

| Day | Workout |
|---|---|
| Sunday | Progression Run — 9.6 km, last 30 min. moderate |
| Monday | X-Train or Rest |
| Tuesday | Hill Repetitions — 1.6 km easy + 6 × 300m uphill @ 3K effort w/ jog-back recoveries + 1.6 km easy |
| Wednesday | X-Train or Rest |
| Thursday | Easy Run — 6.4 km |
| Friday | Rest |
| Saturday | Easy Run — 4.8 km + 8 × 8-sec. hill sprint |

### Week 8

| Day | Workout |
|---|---|
| Sunday | Progression Run — 9.6 km, last 15 min. hard |
| Monday | X-Train or Rest |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 12 × 400m @ 5K–3K pace w/ 200m jog recoveries + 1.6 km easy |
| Wednesday | X-Train or Rest |
| Thursday | Easy Run — 6.4 km |
| Friday | Rest |
| Saturday | Easy Run — 4.8 km + 9 × 8-sec. hill sprint |

### Week 9

| Day | Workout |
|---|---|
| Sunday | Progression Run — 9.6 km, last 20 min. hard |
| Monday | Rest |
| Tuesday | Hill Repetitions — 1.6 km easy + 8 × 300m uphill @ 3K effort w/ jog-back recoveries + 1.6 km easy |
| Wednesday | X-Train or Rest |
| Thursday | Easy Run — 8 km + 10 × 8-sec. hill sprint |
| Friday | X-Train or Rest |
| Saturday | Tune-Up Race — 1.6 km easy + 5K race or time trial + 1.6 km easy *(mid-cycle fitness check, not the goal race)* |

### Week 10

| Day | Workout |
|---|---|
| Sunday | Long Run — 9.6 km easy |
| Monday | Easy Run — 6.4 km + 6 × 10-sec. hill sprint |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 6 × 800m @ 5K pace w/ 2-min. active recoveries + 1.6 km easy |
| Wednesday | Rest |
| Thursday | Easy Run — 9.6 km + 8 × 8-sec. hill sprint |
| Friday | X-Train or Rest |
| Saturday | Easy Run — 8 km |

### Week 11

| Day | Workout |
|---|---|
| Sunday | Progression Run — 9.6 km, last 20 min. hard |
| Monday | Rest |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 5 × 1K @ 5K pace w/ 400m jog recoveries + 1.6 km easy |
| Wednesday | Rest |
| Thursday | Easy Run — 8 km + 8 × 8-sec. hill sprint |
| Friday | X-Train or Rest |
| Saturday | Easy Run — 6.4 km |

### Week 12

| Day | Workout |
|---|---|
| Sunday | Progression Run — 9.6 km, last 20 min. hard |
| Monday | Rest |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 1.6 km @ 5K–3K pace + 5 min. easy + 8 × 400m @ 5K pace w/ 1-min. active recoveries + 1.6 km easy |
| Wednesday | Rest |
| Thursday | Easy Run — 4.8 km |
| Friday | Easy Run — 3.2 km + 3 × 100m strides |
| Saturday | **Goal Race — 5K** |

---

## Structured Data (JSON)

The following JSON block contains the same plan in a machine-readable format suitable for parsing in code.

```json
{
  "plan": {
    "distance": "5K",
    "level": 1,
    "level_name": "Low Volume / Beginner",
    "duration_weeks": 12,
    "applies_to_runner_profiles": [
      "beginner",
      "low_key"
    ],
    "weekly_volume": {
      "min_runs": 4,
      "max_runs": 6,
      "min_miles": 12,
      "max_miles": 26
    },
    "weeks": [
      {
        "week": 1,
        "days": {
          "sunday": {
            "type": "long_run",
            "description": "6.4 km easy"
          },
          "monday": {
            "type": "easy_run",
            "description": "4.8 km + 1 x 8-sec hill sprint"
          },
          "tuesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "wednesday": {
            "type": "easy_run",
            "description": "4.8 km"
          },
          "thursday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "friday": {
            "type": "rest",
            "description": "Rest"
          },
          "saturday": {
            "type": "easy_run",
            "description": "3.2 km + 1 x 8-sec hill sprint"
          }
        },
        "training_phase": "fundamental"
      },
      {
        "week": 2,
        "days": {
          "sunday": {
            "type": "long_run",
            "description": "8 km easy"
          },
          "monday": {
            "type": "easy_run",
            "description": "4.8 km + 2 x 8-sec hill sprint"
          },
          "tuesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "wednesday": {
            "type": "easy_run",
            "description": "6.4 km"
          },
          "thursday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "friday": {
            "type": "rest",
            "description": "Rest"
          },
          "saturday": {
            "type": "easy_run",
            "description": "4.8 km + 2 x 8-sec hill sprint"
          }
        },
        "training_phase": "fundamental"
      },
      {
        "week": 3,
        "days": {
          "sunday": {
            "type": "long_run",
            "description": "9.6 km easy"
          },
          "monday": {
            "type": "easy_run",
            "description": "4.8 km + 3 x 8-sec hill sprint"
          },
          "tuesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "wednesday": {
            "type": "easy_run",
            "description": "6.4 km"
          },
          "thursday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "friday": {
            "type": "rest",
            "description": "Rest"
          },
          "saturday": {
            "type": "easy_run",
            "description": "4.8 km + 3 x 8-sec hill sprint"
          }
        },
        "training_phase": "fundamental"
      },
      {
        "week": 4,
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "9.6 km, last 10 min moderate",
            "progression_format": "moderate"
          },
          "monday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "tuesday": {
            "type": "fartlek",
            "description": "6.4 km easy w/ 8 x 20 sec @ 3K-1500m pace",
            "fartlek_format": "speed_fartlek"
          },
          "wednesday": {
            "type": "easy_run",
            "description": "6.4 km"
          },
          "thursday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "friday": {
            "type": "rest",
            "description": "Rest"
          },
          "saturday": {
            "type": "easy_run",
            "description": "4.8 km + 5 x 8-sec hill sprint"
          }
        },
        "training_phase": "fundamental"
      },
      {
        "week": 5,
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "9.6 km, last 15 min moderate",
            "progression_format": "moderate"
          },
          "monday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "tuesday": {
            "type": "fartlek",
            "description": "6.4 km easy w/ 8 x 30 sec @ 3K-1500m pace",
            "fartlek_format": "speed_fartlek"
          },
          "wednesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "thursday": {
            "type": "easy_run",
            "description": "6.4 km + 6 x 8-sec hill sprint"
          },
          "friday": {
            "type": "rest",
            "description": "Rest"
          },
          "saturday": {
            "type": "easy_run",
            "description": "6.4 km"
          }
        },
        "training_phase": "fundamental"
      },
      {
        "week": 6,
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "9.6 km, last 20 min moderate",
            "progression_format": "moderate"
          },
          "monday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "tuesday": {
            "type": "fartlek",
            "description": "8 km easy w/ 8 x 40 sec @ 5K-3K pace",
            "fartlek_format": "speed_fartlek"
          },
          "wednesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "thursday": {
            "type": "easy_run",
            "description": "6.4 km"
          },
          "friday": {
            "type": "rest",
            "description": "Rest"
          },
          "saturday": {
            "type": "easy_run",
            "description": "6.4 km + 7 x 8-sec hill sprint"
          }
        },
        "training_phase": "fundamental"
      },
      {
        "week": 7,
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "9.6 km, last 30 min moderate",
            "progression_format": "moderate"
          },
          "monday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "tuesday": {
            "type": "hill_repetitions",
            "description": "1.6 km easy + 6 x 300m uphill @ 3K effort w/ jog-back recoveries + 1.6 km easy"
          },
          "wednesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "thursday": {
            "type": "easy_run",
            "description": "6.4 km"
          },
          "friday": {
            "type": "rest",
            "description": "Rest"
          },
          "saturday": {
            "type": "easy_run",
            "description": "4.8 km + 8 x 8-sec hill sprint"
          }
        },
        "training_phase": "fundamental"
      },
      {
        "week": 8,
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "9.6 km, last 15 min hard",
            "progression_format": "hard"
          },
          "monday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "tuesday": {
            "type": "specific_endurance_intervals",
            "description": "1.6 km easy + 12 x 400m @ 5K-3K pace w/ 200m jog recoveries + 1.6 km easy",
            "interval_format": "repetition"
          },
          "wednesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "thursday": {
            "type": "easy_run",
            "description": "6.4 km"
          },
          "friday": {
            "type": "rest",
            "description": "Rest"
          },
          "saturday": {
            "type": "easy_run",
            "description": "4.8 km + 9 x 8-sec hill sprint"
          }
        },
        "training_phase": "sharpening"
      },
      {
        "week": 9,
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "9.6 km, last 20 min hard",
            "progression_format": "hard"
          },
          "monday": {
            "type": "rest",
            "description": "Rest"
          },
          "tuesday": {
            "type": "hill_repetitions",
            "description": "1.6 km easy + 8 x 300m uphill @ 3K effort w/ jog-back recoveries + 1.6 km easy"
          },
          "wednesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "thursday": {
            "type": "easy_run",
            "description": "8 km + 10 x 8-sec hill sprint"
          },
          "friday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "saturday": {
            "type": "tune_up_race",
            "description": "1.6 km easy + 5K race or time trial + 1.6 km easy",
            "purpose": "mid-cycle fitness check"
          }
        },
        "training_phase": "sharpening"
      },
      {
        "week": 10,
        "days": {
          "sunday": {
            "type": "long_run",
            "description": "9.6 km easy"
          },
          "monday": {
            "type": "easy_run",
            "description": "6.4 km + 6 x 10-sec hill sprint"
          },
          "tuesday": {
            "type": "specific_endurance_intervals",
            "description": "1.6 km easy + 6 x 800m @ 5K pace w/ 2-min active recoveries + 1.6 km easy",
            "interval_format": "repetition"
          },
          "wednesday": {
            "type": "rest",
            "description": "Rest"
          },
          "thursday": {
            "type": "easy_run",
            "description": "9.6 km + 8 x 8-sec hill sprint"
          },
          "friday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "saturday": {
            "type": "easy_run",
            "description": "8 km"
          }
        },
        "training_phase": "sharpening"
      },
      {
        "week": 11,
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "9.6 km, last 20 min hard",
            "progression_format": "hard"
          },
          "monday": {
            "type": "rest",
            "description": "Rest"
          },
          "tuesday": {
            "type": "specific_endurance_intervals",
            "description": "1.6 km easy + 5 x 1K @ 5K pace w/ 400m jog recoveries + 1.6 km easy",
            "interval_format": "repetition"
          },
          "wednesday": {
            "type": "rest",
            "description": "Rest"
          },
          "thursday": {
            "type": "easy_run",
            "description": "8 km + 8 x 8-sec hill sprint"
          },
          "friday": {
            "type": "xtrain_or_rest",
            "description": "X-Train or Rest"
          },
          "saturday": {
            "type": "easy_run",
            "description": "6.4 km"
          }
        },
        "training_phase": "sharpening"
      },
      {
        "week": 12,
        "days": {
          "sunday": {
            "type": "progression_run",
            "description": "9.6 km, last 20 min hard",
            "progression_format": "hard"
          },
          "monday": {
            "type": "rest",
            "description": "Rest"
          },
          "tuesday": {
            "type": "specific_endurance_intervals",
            "description": "1.6 km easy + 1.6 km @ 5K-3K pace + 5 min easy + 8 x 400m @ 5K pace w/ 1-min active recoveries + 1.6 km easy",
            "interval_format": "repetition"
          },
          "wednesday": {
            "type": "rest",
            "description": "Rest"
          },
          "thursday": {
            "type": "easy_run",
            "description": "4.8 km"
          },
          "friday": {
            "type": "easy_run",
            "description": "3.2 km + 3 x 100m strides"
          },
          "saturday": {
            "type": "goal_race",
            "description": "5K Goal Race"
          }
        },
        "training_phase": "taper"
      }
    ],
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
        "low_key": "5 \u00d7 1K @ goal pace w/ 2-min jog recoveries",
        "competitive": "5 \u00d7 1K @ goal pace w/ 90-sec jog recoveries",
        "highly_competitive": "5 \u00d7 1K @ 5K pace w/ 1-min jog recoveries"
      }
    }
  }
}
```
