# Half-Marathon Level 1 Training Plan

## Overview

- **Distance:** Half-Marathon
- **Level:** 1 (Beginner / Low Mileage)
- **Duration:** 16 weeks
- **Weekly Volume:** Ranges from 5 runs / 44.8 km (Week 1) to 5 runs / 60.8 km (Week 14)
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

Runners are grouped into five experience/competitiveness profiles. Each profile maps to a recommended plan level. **This Half-Marathon Level 1 plan applies to the `beginner` and `low_key` profiles.**

| Runner Profile | Code | Recommended Plan Level | Description |
|---|---|---|---|
| Beginner | `beginner` | **Level 1** | New to running or returning after a long break |
| Low-Key | `low_key` | **Level 1** | Runs regularly but prefers low mileage; not focused on racing performance |
| Competitive | `competitive` | Level 2 | More experienced, races regularly, willing to handle moderate volume |
| Highly Competitive | `highly_competitive` | Level 3 | Trains seriously, prioritizes performance, can handle high mileage |
| Elite | `elite` | Level 3 | Top-tier competitor; high mileage with the most demanding workouts |

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

> This file contains **only the Half-Marathon Level 1 plan**. A runner whose profile maps to Level 2 or Level 3 should use the corresponding Half-Marathon Level 2 or Level 3 plan file.

## Workout Type Glossary

| Code | Description |
|---|---|
| `long_run` | Long, easy-paced run |
| `easy_run` | Easy-paced run |
| `progression_run` | Easy run that finishes with a moderate, hard, or marathon-pace segment. Has 7 sub-formats (see Progression Run Format Reference below). |
| `xtrain_or_rest` | Cross-training **or** rest — runner's choice |
| `xtrain` | Specific cross-training session prescribed (e.g. "X-Train 30 min") |
| `rest` | Full rest day |
| `fartlek` | Easy run with embedded faster surges. Has 4 sub-formats (see Fartlek Format Reference below). |
| `hill_repetitions` | Uphill repetitions at hard effort with jog-back recoveries |
| `threshold_run` | Run with a sustained segment at a threshold pace (T1, T2, or T3 — see Threshold Pace Reference below). For half-marathon runners, threshold runs are the **primary** vehicle for specific-endurance training. |
| `specific_endurance_intervals` | Repetition intervals at goal race pace (5K or 10K pace, depending on phase) |
| `ladder_intervals` | Intervals of varying distance/duration run consecutively (ascending, descending, or pyramid) |
| `aerobic_test` | HR-controlled diagnostic. Run a fixed distance (typically 6.4 km, as prescribed in this plan) **or** a fixed duration (20–30 min, the source's general protocol) at your half-marathon heart rate. Calculate pace from time and distance. Repeat every 5–6 weeks; pace should move toward goal HM pace as fitness improves. |
| `perceived_effort_test` | HR-monitor-free alternative to the half-marathon aerobic test. Procedure: warm up, run exactly 6.4 km (16 laps + 40 yards) on a track at the fastest pace you feel you could sustain through a full half-marathon. **Take no split times** (they'd affect pacing). Calculate pace from total time. Repeat every 5–6 weeks. |
| `tune_up_race` | A race or time trial run mid-cycle as a fitness check, **not** the goal race |
| `goal_race` | The target race the plan is built around (final Saturday) |

## Threshold Pace Reference

For half-marathon runners, threshold work is **especially central**: the source notes that "the lion's share of specific-endurance training for half-marathon runners should occur within the context of threshold runs in the fundamental and sharpening periods." Half-marathon goal pace falls into the T2 tier, so threshold runs at HM pace double as specific-endurance work.

| Pace ID | Sustainable for... | Elite proxy | Sub-elite proxy |
|---|---|---|---|
| **T1** | ~2.5 hours | A bit slower than marathon pace | Marathon pace or slightly faster |
| **T2** | ~90 minutes | A bit faster than marathon pace | Half-marathon pace |
| **T3** | ~60 minutes | Half-marathon pace or a bit faster | A bit slower than 10K pace |

In this Half-Marathon Level 1 plan:

| Source description | Threshold tier | Notes |
|---|---|---|
| "goal half-marathon pace" | **T2** | Exact race-pace work |
| "current half-marathon pace" | **T2** | Same tier, current rather than goal pace |
| "half-marathon pace" | T2 | |
| "10K pace" | T3 | |
| "half-marathon/10K pace" | T2–T3 | Between half-marathon and 10K pace |

```json
{
  "threshold_paces": {
    "T1": { "sustainable_minutes": 150, "elite_proxy": "slightly slower than marathon pace", "sub_elite_proxy": "marathon pace or slightly faster" },
    "T2": { "sustainable_minutes": 90,  "elite_proxy": "slightly faster than marathon pace", "sub_elite_proxy": "half-marathon pace" },
    "T3": { "sustainable_minutes": 60,  "elite_proxy": "half-marathon pace or slightly faster", "sub_elite_proxy": "slightly slower than 10K pace" }
  },
  "source_pace_to_threshold_tier": {
    "goal half-marathon pace":     "T2",
    "current half-marathon pace":  "T2",
    "half-marathon pace":          "T2",
    "half-marathon/10K pace":      "T2-T3",
    "10K pace":                    "T3"
  }
}
```

## Diagnostic Checkpoints

This plan does not include explicit diagnostic checkpoints in any week (no `aerobic_test`, `perceived_effort_test`, or `tune_up_race`). However, the source describes **two half-marathon-specific spec tests** that runners can substitute for a Friday workout every 5–6 weeks if they want a concrete fitness check. Both methods exist because not all runners use heart rate monitors.

### Option A — Aerobic Test (`aerobic_test`)
Requires a heart rate monitor.

1. From your current race-pace workouts, identify the heart rate associated with your **current** half-marathon pace. This is your half-marathon HR. It won't change much between now and the goal race.
2. Warm up thoroughly on a local track.
3. Run 20–30 minutes at your half-marathon HR.
4. Stop, note distance covered, calculate pace.
5. Repeat every 5–6 weeks. As fitness improves, the pace you can sustain at this HR moves toward your goal HM pace. **Peak fitness = your HM HR and your goal HM pace match up.**

### Option B — Perceived-Effort Spec Test (`perceived_effort_test`)
HR-monitor-free alternative — slightly more objective for some runners.

1. Warm up thoroughly on a local track.
2. Run exactly **6.4 km (16 laps + 40 yards)** at the fastest pace you feel you could sustain through a full half-marathon.
3. **Do not take split times** during the test — checking splits would affect your pacing.
4. Stop at 6.4 km, calculate pace from total time.
5. Repeat every 5–6 weeks. Pace should move toward goal HM pace each time.

### Option C — Tune-up race
A 5K race or 5K time trial, also acceptable. Practical because 5K can be raced without significant recovery cost. Slot it in around Week 8 or Week 12 if desired.

> **Note on marathon plans:** the source explicitly states that **there is no effective specific-endurance test for the marathon** — racing the full distance mid-cycle is too taxing, and shorter-distance proxies don't reliably predict marathon-pace fitness. Marathon runners rely on long-run pacing and threshold-run trends instead.

```json
{
  "diagnostic_options_for_half_marathon": {
    "aerobic_test":          { "requires_hr_monitor": true,  "duration": "20-30 min", "what_to_track": "distance covered at HM heart rate" },
    "perceived_effort_test": { "requires_hr_monitor": false, "distance": "6.4 km (track, 16 laps + 40 yards)", "what_to_track": "total time at perceived HM effort, no splits" },
    "tune_up_race":          { "requires_hr_monitor": false, "distance": "5K", "what_to_track": "race time or time trial result" }
  },
  "marathon_diagnostic_note": "The source states there is no effective specific-endurance test for the marathon."
}
```

## Training Phases

Each week in the JSON carries a `training_phase` field:

| Phase | Code | Description |
|---|---|---|
| Fundamental | `fundamental` | Builds general fitness and gradually specializes. |
| Sharpening | `sharpening` | Race-specific phase — threshold runs at HM pace become the central workout. |
| Taper | `taper` | Volume drops sharply leading into the goal race. |

In this Half-Marathon Level 1 plan: **Weeks 1–8 = `fundamental`, Weeks 9–15 = `sharpening`, Week 16 = `taper`**. Sharpening starts in Week 9 when threshold runs first appear (race-pace work for HM runners).

---

## Fartlek Format Reference

Fartleks ("speed play" in Swedish) are runs with embedded faster surges. The source uses fartleks heavily early in the training cycle as a low-pressure way to introduce speed work.

| Format | Example | Best Use |
|---|---|---|
| `speed_fartlek` | `11.2 km easy w/ 6 × 30 sec @ 10K-3K pace` | Introductory & early fundamental period — gentle introduction to speed work. |
| `race_pace_fartlek` | `12 × 1 min @ 5K pace / 1 min easy` | Late fundamental & sharpening — bridges speed work toward specific endurance. |
| `single_block_fartlek` | `6.4 km w/ 1.6 km @ 5K pace / 1 min easy` | One sustained surge embedded in an easy run. |
| `mixed_pace_fartlek` | `6 min @ 10K pace + 4 min easy + 4 × 1 min @ 5K pace` | Sharpening — integrate two race-pace zones in one workout. |

This Half-Marathon Level 1 plan uses only the `speed_fartlek` format (Weeks 3–5).

---

## Progression Run Format Reference

Progression runs come in **seven distinct formats**. Each progression run carries a `progression_format` field in its JSON entry. Half-marathon runners use progression runs liberally — the moderate-pace segments overlap with race pace.

| Format | Example | Best Use |
|---|---|---|
| `moderate` | `9.6 km easy + 20 min moderate` | Introductory; later, adds a touch more hard work without overdoing it |
| `moderate_uphill` | `9.6 km easy + 20 min moderate (uphill if possible)` | Introductory; aerobic + strength simultaneously |
| `hard` | `9.6 km easy + 20 min hard` | Late fundamental period; coaxes aerobic support toward peak |
| `hard_uphill` | `9.6 km easy + 20 min hard (uphill if possible)` | Fundamental; aerobic + strength after foundation built |
| `long_run_progression` | `19.2 km easy + 30 min moderate` | Throughout cycle; transforms general endurance into race-specific endurance |
| `fartlek_progression` | `3.2 km easy + 6.4 km intervals + 3.2 km hard` | Late fundamental; integrates two types of specific-endurance training |
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

Threshold runs come in **four distinct formats** (Table 3.3 in source). Each threshold run carries a `threshold_format` field in its JSON entry. For half-marathon training, threshold runs are the centerpiece — the format used grows from short single intervals to long sustained efforts at goal HM pace.

| Format | Example | Best Use |
|---|---|---|
| `one_interval` | `3.2 km easy + 6.4 km @ half-marathon pace + 3.2 km easy` | Shorter versions early in fundamental period; longer versions late to finish the job. |
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

**Specific endurance** is the organizing principle of every workout in this plan. For half-marathon runners specifically, specific-endurance training happens primarily through **threshold runs at half-marathon pace**, not through track-style intervals at goal pace.

### The ±10% Pace Range

For a workout to count as specific-endurance training, the running effort must fall within a pace range of **10% slower to 10% faster than goal race pace**. The range narrows as the cycle progresses:

| Phase | Pace range vs. goal pace |
|---|---|
| `fundamental` | **±10%** |
| `sharpening`  | **±3–4%** |
| `taper`       | **±3–4%** |

For HM runners, a useful framing: any threshold run at "marathon pace" through "10K pace" falls within ±10% of goal HM pace, so all threshold runs in this plan count as specific-endurance work.

### How specific-endurance training progresses across the cycle

1. **Pace moves toward goal pace** — early threshold runs at HM/10K pace; later ones at exact HM goal pace.
2. **Volume of race-pace work per session increases** — early: 1.6 km @ HM pace; late: 12.8 km @ HM pace (Weeks 13–14).
3. **Race-pace efforts become more extended** — single sustained blocks grow from ~10 minutes to ~6+ miles.
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
| Half-Marathon | Low-Key Competitive (`low_key`) | 6 × 1.6 km @ half-marathon pace w/ 2-min jog recoveries | ←|
| Half-Marathon | Competitive (`competitive`) | 4 × 3K @ half-marathon pace w/ 90-sec jog recoveries | |
| Half-Marathon | Highly Competitive (`highly_competitive`) | 3 × 5K @ half-marathon pace w/ 90-sec jog recoveries | |
| Marathon | Low-Key Competitive (`low_key`) | 32–35.2 km easy | |
| Marathon | Competitive (`competitive`) | 16 km easy + 16 km @ marathon pace | |
| Marathon | Highly Competitive (`highly_competitive`) | 45 min easy + 20K: 1K on/1K off (on = marathon goal pace, off = marathon pace + 3–6 sec/km) | |

The arrow (←) marks the row applicable to **this plan** (Half-Marathon Low-Key/Beginner). Note: this plan reaches that peak through threshold runs (e.g. Week 14 Friday's `12.8 km @ current half-marathon pace`) rather than the precise interval form shown — both express the same training intent.

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
| `repetition` | Uniform-distance, uniform-pace intervals | `6 × 800m @ 5K pace` |
| `ladder` | Varying-distance intervals run consecutively | `1 min, 2 min, 3 min, 2 min, 1 min @ 5K-1500m pace` |
| `add_on` | Small set of speed intervals appended to a slower workout | `20-min threshold run + 4 × 300m @ 3K pace` |

This Half-Marathon Level 1 plan uses `repetition` (Weeks 13–16 SE intervals) and `ladder` (Weeks 7 and 9).

---

## Weekly Schedule

### Week 1

| Day | Workout |
|---|---|
| Sunday | Long Run — 8 km easy |
| Monday | Easy Run — 4.8 km + 3 × 8-sec. hill sprint |
| Tuesday | Easy Run — 8 km |
| Wednesday | Easy Run — 9.6 km |
| Thursday | X-Train or Rest |
| Friday | Easy Run — 4.8 km + 3 × 8-sec. hill sprint |
| Saturday | X-Train or Rest |

### Week 2

| Day | Workout |
|---|---|
| Sunday | Long Run — 9.6 km easy |
| Monday | Easy Run — 4.8 km + 4 × 8-sec. hill sprint |
| Tuesday | Easy Run — 8 km |
| Wednesday | Easy Run — 9.6 km |
| Thursday | X-Train or Rest |
| Friday | Easy Run — 8 km + 4 × 8-sec. hill sprint |
| Saturday | X-Train or Rest |

### Week 3

| Day | Workout |
|---|---|
| Sunday | Long Run — 11.2 km easy |
| Monday | Easy Run — 9.6 km + 5 × 8-sec. hill sprint |
| Tuesday | Fartlek Run — 11.2 km easy w/ 6 × 30 sec. @ 10K–3K pace |
| Wednesday | Rest |
| Thursday | Easy Run — 6.4 km + 5 × 8-sec. hill sprint |
| Friday | Progression Run — 9.6 km, last 5 min. moderate |
| Saturday | Rest |

### Week 4

| Day | Workout |
|---|---|
| Sunday | Long Run — 12.8 km easy |
| Monday | Easy Run — 9.6 km + 6 × 8-sec. hill sprint |
| Tuesday | Fartlek Run — 12.8 km easy w/ 6 × 35 sec. @ 10K–3K pace |
| Wednesday | Rest |
| Thursday | Easy Run — 6.4 km + 6 × 8-sec. hill sprint |
| Friday | Progression Run — 11.2 km, last 10 min. moderate |
| Saturday | Rest |

### Week 5

| Day | Workout |
|---|---|
| Sunday | Progression Run — 14.4 km, last 15 min. moderate (uphill, if possible) |
| Monday | Easy Run — 9.6 km |
| Tuesday | Fartlek Run — 12.8 km easy w/ 6 × 40 sec. @ 10K–3K pace |
| Wednesday | Rest |
| Thursday | Easy Run — 6.4 km + 8 × 8-sec. hill sprint |
| Friday | Progression Run — 9.6 km, last 10 min. moderate |
| Saturday | Rest |

### Week 6

| Day | Workout |
|---|---|
| Sunday | Progression Run — 16 km, last 20 min. moderate (uphill, if possible) |
| Monday | X-Train — 30 min. |
| Tuesday | Hill Repetitions — 3.2 km easy + 6 × 45 sec. uphill @ 3K effort w/ jog-back recoveries + 3.2 km easy |
| Wednesday | Rest |
| Thursday | Easy Run — 9.6 km + 8 × 8-sec. hill sprint |
| Friday | Progression Run — 4.8 km + 3.2 km moderate |
| Saturday | Easy Run — 6.4 km |

### Week 7

| Day | Workout |
|---|---|
| Sunday | Long Run — 17.6 km easy |
| Monday | X-Train — 30 min. |
| Tuesday | Ladder Intervals — 3.2 km easy + 1 min, 2 min, 3 min, 2 min, 1 min @ 5K–1,500m pace w/ 400m jog recoveries + 3.2 km easy |
| Wednesday | Rest |
| Thursday | Easy Run — 9.6 km + 6 × 8-sec. hill sprint |
| Friday | Progression Run — 9.6 km, last 4 min. moderate |
| Saturday | Easy Run — 6.4 km |

### Week 8

| Day | Workout |
|---|---|
| Sunday | Progression Run — 19.2 km, last 5 min. hard (uphill, if possible) |
| Monday | X-Train — 30 min. |
| Tuesday | Hill Repetitions — 3.2 km easy + 8 × 1 min. uphill @ 5K effort w/ jog-back recoveries + 3.2 km easy |
| Wednesday | Rest |
| Thursday | Easy Run — 9.6 km + 8 × 10-sec. hill sprint |
| Friday | Progression Run — 3.2 km easy + 6.4 km moderate |
| Saturday | Easy Run — 6.4 km |

### Week 9

| Day | Workout |
|---|---|
| Sunday | Progression Run — 19.2 km, last 10 min. hard |
| Monday | Rest |
| Tuesday | Ladder Intervals — 3.2 km easy + 1 min, 2 min, 3 min, 2 min, 1 min, 2 min, 3 min, 1 min @ 5K–1,500m pace w/ 400m jog recoveries + 3.2 km easy |
| Wednesday | Easy Run — 8 km |
| Thursday | Easy Run — 6.4 km + 6 × 10-sec. hill sprint |
| Friday | Threshold Run — 3.2 km easy + 2 × 3.2 km @ half-marathon/10K pace w/ 4-min. active recovery + 3.2 km easy |
| Saturday | Rest |

### Week 10

| Day | Workout |
|---|---|
| Sunday | Long Run — 22.4 km easy |
| Monday | Rest |
| Tuesday | Hill Repetitions — 3.2 km easy + 8 × 90 sec. uphill @ 5K effort w/ jog-back recoveries + 3.2 km easy |
| Wednesday | Easy Run — 6.4 km |
| Thursday | Easy Run — 6.4 km + 8 × 10-sec. hill sprint |
| Friday | Threshold Run — 3.2 km easy + 8 km @ goal half-marathon pace + 3.2 km easy |
| Saturday | Easy Run — 6.4 km |

### Week 11

| Day | Workout |
|---|---|
| Sunday | Progression Run — 19.2 km, last 10 min. hard |
| Monday | Rest |
| Tuesday | Hill Repetitions — 3.2 km easy + 8 × 1.6 km uphill @ 5K effort w/ jog-back recoveries + 3.2 km easy |
| Wednesday | Easy Run — 9.6 km |
| Thursday | Easy Run — 6.4 km + 6 × 10-sec. hill sprint |
| Friday | Threshold Run — 1.6 km easy + 4 × 1.6 km @ 10K pace w/ 1-min. active recoveries + 1.6 km easy |
| Saturday | Easy Run — 6.4 km |

### Week 12

| Day | Workout |
|---|---|
| Sunday | Progression Run — 22.4 km, last 15 min. moderate |
| Monday | Rest |
| Tuesday | Hill Repetitions — 1.6 km easy + 4 × 3 min (1st 90 sec. flat, 2nd 90 sec. uphill) @ 5K effort w/ jog-back recoveries + 1.6 km easy |
| Wednesday | Easy Run — 6.4 km |
| Thursday | Easy Run — 4.8 km + 6 × 10-sec. hill sprint |
| Friday | Threshold Run — 3.2 km easy + 9.6 km @ current half-marathon pace + 1.6 km easy |
| Saturday | Rest |

### Week 13

| Day | Workout |
|---|---|
| Sunday | Progression Run — 20.8 km, last 10 min. moderate |
| Monday | Rest |
| Tuesday | Specific-Endurance Intervals — 3.2 km easy + 6 × 800m @ 5K pace w/ 2-min. active recoveries + 1.6 km easy |
| Wednesday | Easy Run — 8 km |
| Thursday | Easy Run — 4.8 km + 6 × 10-sec. hill sprint |
| Friday | Threshold Run — 3.2 km easy + 12.8 km @ half-marathon/10K pace w/ 30-sec. active recovery + 1.6 km easy |
| Saturday | Rest |

### Week 14

| Day | Workout |
|---|---|
| Sunday | Progression Run — 22.4 km, last 20 min. moderate |
| Monday | Rest |
| Tuesday | Specific-Endurance Intervals — 3.2 km easy + 5 × 1K @ 5K pace w/ 90-sec. active recoveries + 1.6 km easy |
| Wednesday | Easy Run — 4.8 km |
| Thursday | Easy Run — 12.8 km + 8 × 10-sec. hill sprint |
| Friday | Threshold Run — 3.2 km easy + 12.8 km @ current half-marathon pace + 1.6 km easy |
| Saturday | Rest |

### Week 15

| Day | Workout |
|---|---|
| Sunday | Progression Run — 19.2 km, last 15 min. moderate |
| Monday | X-Train — 30 min. |
| Tuesday | Specific-Endurance Intervals — 3.2 km easy + 2 × 6 min. @ 5K pace w/ 3-min. active recovery + 1.6 km easy |
| Wednesday | Rest |
| Thursday | Easy Run — 6.4 km + 4 × 10-sec. hill sprint |
| Friday | Threshold Run — 1.6 km easy + 2 × 4.8 km @ half-marathon/10K pace w/ 4-min. active recovery + 1.6 km easy |
| Saturday | Easy Run — 6.4 km |

### Week 16

| Day | Workout |
|---|---|
| Sunday | Progression Run — 16 km, last 10 min. moderate |
| Monday | X-Train — 30 min. |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 2 × 1.6 km @ 10K pace w/ 3-min. active recovery + 1.6 km easy |
| Wednesday | Easy Run — 6.4 km |
| Thursday | Easy Run — 6.4 km + 2 × 10-sec. hill sprint |
| Friday | Easy Run — 6.4 km |
| Saturday | **Goal Race — Half-Marathon** |

---

## Structured Data (JSON)

The following JSON block contains the same plan in a machine-readable format suitable for parsing in code.

```json
{
  "plan": {
    "distance": "Half-Marathon",
    "level": 1,
    "level_name": "Low Volume / Beginner",
    "duration_weeks": 16,
    "applies_to_runner_profiles": ["beginner", "low_key"],
    "weekly_volume": {
      "min_runs": 5,
      "max_runs": 5,
      "min_miles": 28,
      "max_miles": 38
    },
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
          "sunday":    { "type": "long_run",       "description": "8 km easy" },
          "monday":    { "type": "easy_run",       "description": "4.8 km + 3 x 8-sec hill sprint" },
          "tuesday":   { "type": "easy_run",       "description": "8 km" },
          "wednesday": { "type": "easy_run",       "description": "9.6 km" },
          "thursday":  { "type": "xtrain_or_rest", "description": "X-Train or Rest" },
          "friday":    { "type": "easy_run",       "description": "4.8 km + 3 x 8-sec hill sprint" },
          "saturday":  { "type": "xtrain_or_rest", "description": "X-Train or Rest" }
        }
      },
      {
        "week": 2,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "long_run",       "description": "9.6 km easy" },
          "monday":    { "type": "easy_run",       "description": "4.8 km + 4 x 8-sec hill sprint" },
          "tuesday":   { "type": "easy_run",       "description": "8 km" },
          "wednesday": { "type": "easy_run",       "description": "9.6 km" },
          "thursday":  { "type": "xtrain_or_rest", "description": "X-Train or Rest" },
          "friday":    { "type": "easy_run",       "description": "8 km + 4 x 8-sec hill sprint" },
          "saturday":  { "type": "xtrain_or_rest", "description": "X-Train or Rest" }
        }
      },
      {
        "week": 3,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "long_run",        "description": "11.2 km easy" },
          "monday":    { "type": "easy_run",        "description": "9.6 km + 5 x 8-sec hill sprint" },
          "tuesday":   { "type": "fartlek",         "description": "11.2 km easy w/ 6 x 30 sec @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "wednesday": { "type": "rest",            "description": "Rest" },
          "thursday":  { "type": "easy_run",        "description": "6.4 km + 5 x 8-sec hill sprint" },
          "friday":    { "type": "progression_run", "description": "9.6 km, last 5 min moderate", "progression_format": "moderate" },
          "saturday":  { "type": "rest",            "description": "Rest" }
        }
      },
      {
        "week": 4,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "long_run",        "description": "12.8 km easy" },
          "monday":    { "type": "easy_run",        "description": "9.6 km + 6 x 8-sec hill sprint" },
          "tuesday":   { "type": "fartlek",         "description": "12.8 km easy w/ 6 x 35 sec @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "wednesday": { "type": "rest",            "description": "Rest" },
          "thursday":  { "type": "easy_run",        "description": "6.4 km + 6 x 8-sec hill sprint" },
          "friday":    { "type": "progression_run", "description": "11.2 km, last 10 min moderate", "progression_format": "moderate" },
          "saturday":  { "type": "rest",            "description": "Rest" }
        }
      },
      {
        "week": 5,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run", "description": "14.4 km, last 15 min moderate (uphill if possible)", "progression_format": "moderate_uphill" },
          "monday":    { "type": "easy_run",        "description": "9.6 km" },
          "tuesday":   { "type": "fartlek",         "description": "12.8 km easy w/ 6 x 40 sec @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "wednesday": { "type": "rest",            "description": "Rest" },
          "thursday":  { "type": "easy_run",        "description": "6.4 km + 8 x 8-sec hill sprint" },
          "friday":    { "type": "progression_run", "description": "9.6 km, last 10 min moderate", "progression_format": "moderate" },
          "saturday":  { "type": "rest",            "description": "Rest" }
        }
      },
      {
        "week": 6,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "16 km, last 20 min moderate (uphill if possible)", "progression_format": "long_run_progression" },
          "monday":    { "type": "xtrain",           "description": "X-Train 30 min" },
          "tuesday":   { "type": "hill_repetitions", "description": "3.2 km easy + 6 x 45 sec uphill @ 3K effort w/ jog-back recoveries + 3.2 km easy" },
          "wednesday": { "type": "rest",             "description": "Rest" },
          "thursday":  { "type": "easy_run",         "description": "9.6 km + 8 x 8-sec hill sprint" },
          "friday":    { "type": "progression_run",  "description": "4.8 km + 3.2 km moderate", "progression_format": "moderate" },
          "saturday":  { "type": "easy_run",         "description": "6.4 km" }
        }
      },
      {
        "week": 7,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "long_run",         "description": "17.6 km easy" },
          "monday":    { "type": "xtrain",           "description": "X-Train 30 min" },
          "tuesday":   { "type": "ladder_intervals", "description": "3.2 km easy + 1 min, 2 min, 3 min, 2 min, 1 min @ 5K-1500m pace w/ 400m jog recoveries + 3.2 km easy", "interval_format": "ladder" },
          "wednesday": { "type": "rest",             "description": "Rest" },
          "thursday":  { "type": "easy_run",         "description": "9.6 km + 6 x 8-sec hill sprint" },
          "friday":    { "type": "progression_run",  "description": "9.6 km, last 4 min moderate", "progression_format": "moderate" },
          "saturday":  { "type": "easy_run",         "description": "6.4 km" }
        }
      },
      {
        "week": 8,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "19.2 km, last 5 min hard (uphill if possible)", "progression_format": "hard_uphill" },
          "monday":    { "type": "xtrain",           "description": "X-Train 30 min" },
          "tuesday":   { "type": "hill_repetitions", "description": "3.2 km easy + 8 x 1 min uphill @ 5K effort w/ jog-back recoveries + 3.2 km easy" },
          "wednesday": { "type": "rest",             "description": "Rest" },
          "thursday":  { "type": "easy_run",         "description": "9.6 km + 8 x 10-sec hill sprint" },
          "friday":    { "type": "progression_run",  "description": "3.2 km easy + 6.4 km moderate", "progression_format": "moderate" },
          "saturday":  { "type": "easy_run",         "description": "6.4 km" }
        }
      },
      {
        "week": 9,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "19.2 km, last 10 min hard", "progression_format": "hard" },
          "monday":    { "type": "rest",             "description": "Rest" },
          "tuesday":   { "type": "ladder_intervals", "description": "3.2 km easy + 1 min, 2 min, 3 min, 2 min, 1 min, 2 min, 3 min, 1 min @ 5K-1500m pace w/ 400m jog recoveries + 3.2 km easy", "interval_format": "ladder" },
          "wednesday": { "type": "easy_run",         "description": "8 km" },
          "thursday":  { "type": "easy_run",         "description": "6.4 km + 6 x 10-sec hill sprint" },
          "friday":    { "type": "threshold_run",    "description": "3.2 km easy + 2 x 3.2 km @ half-marathon/10K pace w/ 4-min active recovery + 3.2 km easy", "threshold_tier": "T2-T3", "threshold_format": "two_intervals" },
          "saturday":  { "type": "rest",             "description": "Rest" }
        }
      },
      {
        "week": 10,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "long_run",         "description": "22.4 km easy" },
          "monday":    { "type": "rest",             "description": "Rest" },
          "tuesday":   { "type": "hill_repetitions", "description": "3.2 km easy + 8 x 90 sec uphill @ 5K effort w/ jog-back recoveries + 3.2 km easy" },
          "wednesday": { "type": "easy_run",         "description": "6.4 km" },
          "thursday":  { "type": "easy_run",         "description": "6.4 km + 8 x 10-sec hill sprint" },
          "friday":    { "type": "threshold_run",    "description": "3.2 km easy + 8 km @ goal half-marathon pace + 3.2 km easy", "threshold_tier": "T2", "threshold_format": "one_interval" },
          "saturday":  { "type": "easy_run",         "description": "6.4 km" }
        }
      },
      {
        "week": 11,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "19.2 km, last 10 min hard", "progression_format": "hard" },
          "monday":    { "type": "rest",             "description": "Rest" },
          "tuesday":   { "type": "hill_repetitions", "description": "3.2 km easy + 8 x 1.6 km uphill @ 5K effort w/ jog-back recoveries + 3.2 km easy" },
          "wednesday": { "type": "easy_run",         "description": "9.6 km" },
          "thursday":  { "type": "easy_run",         "description": "6.4 km + 6 x 10-sec hill sprint" },
          "friday":    { "type": "threshold_run",    "description": "1.6 km easy + 4 x 1.6 km @ 10K pace w/ 1-min active recoveries + 1.6 km easy", "threshold_tier": "T3", "threshold_format": "multi_interval" },
          "saturday":  { "type": "easy_run",         "description": "6.4 km" }
        }
      },
      {
        "week": 12,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "22.4 km, last 15 min moderate", "progression_format": "long_run_progression" },
          "monday":    { "type": "rest",             "description": "Rest" },
          "tuesday":   { "type": "hill_repetitions", "description": "1.6 km easy + 4 x 3 min (1st 90 sec flat, 2nd 90 sec uphill) @ 5K effort w/ jog-back recoveries + 1.6 km easy" },
          "wednesday": { "type": "easy_run",         "description": "6.4 km" },
          "thursday":  { "type": "easy_run",         "description": "4.8 km + 6 x 10-sec hill sprint" },
          "friday":    { "type": "threshold_run",    "description": "3.2 km easy + 9.6 km @ current half-marathon pace + 1.6 km easy", "threshold_tier": "T2", "threshold_format": "one_interval" },
          "saturday":  { "type": "rest",             "description": "Rest" }
        }
      },
      {
        "week": 13,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",            "description": "20.8 km, last 10 min moderate", "progression_format": "long_run_progression" },
          "monday":    { "type": "rest",                       "description": "Rest" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "3.2 km easy + 6 x 800m @ 5K pace w/ 2-min active recoveries + 1.6 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "easy_run",                   "description": "8 km" },
          "thursday":  { "type": "easy_run",                   "description": "4.8 km + 6 x 10-sec hill sprint" },
          "friday":    { "type": "threshold_run",              "description": "3.2 km easy + 12.8 km @ half-marathon/10K pace w/ 30-sec active recovery + 1.6 km easy", "threshold_tier": "T2-T3", "threshold_format": "one_interval" },
          "saturday":  { "type": "rest",                       "description": "Rest" }
        }
      },
      {
        "week": 14,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",            "description": "22.4 km, last 20 min moderate", "progression_format": "long_run_progression" },
          "monday":    { "type": "rest",                       "description": "Rest" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "3.2 km easy + 5 x 1K @ 5K pace w/ 90-sec active recoveries + 1.6 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "easy_run",                   "description": "4.8 km" },
          "thursday":  { "type": "easy_run",                   "description": "12.8 km + 8 x 10-sec hill sprint" },
          "friday":    { "type": "threshold_run",              "description": "3.2 km easy + 12.8 km @ current half-marathon pace + 1.6 km easy", "threshold_tier": "T2", "threshold_format": "one_interval" },
          "saturday":  { "type": "rest",                       "description": "Rest" }
        }
      },
      {
        "week": 15,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",            "description": "19.2 km, last 15 min moderate", "progression_format": "long_run_progression" },
          "monday":    { "type": "xtrain",                     "description": "X-Train 30 min" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "3.2 km easy + 2 x 6 min @ 5K pace w/ 3-min active recovery + 1.6 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "rest",                       "description": "Rest" },
          "thursday":  { "type": "easy_run",                   "description": "6.4 km + 4 x 10-sec hill sprint" },
          "friday":    { "type": "threshold_run",              "description": "1.6 km easy + 2 x 4.8 km @ half-marathon/10K pace w/ 4-min active recovery + 1.6 km easy", "threshold_tier": "T2-T3", "threshold_format": "two_intervals" },
          "saturday":  { "type": "easy_run",                   "description": "6.4 km" }
        }
      },
      {
        "week": 16,
        "training_phase": "taper",
        "days": {
          "sunday":    { "type": "progression_run",            "description": "16 km, last 10 min moderate", "progression_format": "long_run_progression" },
          "monday":    { "type": "xtrain",                     "description": "X-Train 30 min" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "1.6 km easy + 2 x 1.6 km @ 10K pace w/ 3-min active recovery + 1.6 km easy", "interval_format": "repetition" },
          "wednesday": { "type": "easy_run",                   "description": "6.4 km" },
          "thursday":  { "type": "easy_run",                   "description": "6.4 km + 2 x 10-sec hill sprint" },
          "friday":    { "type": "easy_run",                   "description": "6.4 km" },
          "saturday":  { "type": "goal_race",                  "description": "Half-Marathon Goal Race" }
        }
      }
    ]
  }
}
```
