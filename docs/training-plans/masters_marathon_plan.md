# Masters Marathon Training Plan

## Overview

- **Distance:** Marathon
- **Category:** Masters (age-based, for 40+ runners)
- **Duration:** 20 weeks
- **Weekly Volume:** Ranges from approximately 4 runs / 25.6 km (Week 1) to 5 runs / 75.2 km (peak weeks)
- **Description:** A Marathon plan specifically structured for Masters runners (age 40+). Lower running volume than the standard Marathon plans, with regular X-Train days as recovery-supportive aerobic work. Maintains the same race-specific stimuli (threshold, marathon-pace runs, hard long runs) but spaced for greater recovery.

## Plan Family

Masters plans are an alternative to the standard race-distance plans, designed around the recovery needs and adaptation patterns of runners 40 and older. There are two Masters plans:

| Race | Plan | Duration | This file |
|---|---|---|---|
| 10K | `masters_10k_plan.md` | 16 weeks | |
| Marathon | `masters_marathon_plan.md` | 20 weeks | ← |

Unlike the regular race-distance plans (which come in 3 levels per distance for 5 runner profiles), Masters plans are **age-based, not competitiveness-based** — they apply to any 40+ runner regardless of competitive level.

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
| `xtrain` | Specific cross-training session prescribed (e.g. "X-Train 30 min"). Masters plans use these regularly on Saturdays. |
| `xtrain_or_rest` | Cross-training **or** rest — runner's choice |
| `rest` | Full rest day |
| `fartlek` | Easy run with embedded faster surges. Has 4 sub-formats. |
| `hill_repetitions` | Uphill repetitions at hard effort. **Masters plans use the term "Anaerobic Hill Intervals"** for fixed-distance reps at 3K effort with timed active recoveries — same workout type, source's name preserved in the description. |
| `threshold_run` | Run with a sustained segment at a threshold pace (T1, T2, or T3). Has 4 sub-formats. |
| `marathon_pace_run` | Sustained block(s) at marathon pace. Marathon-specific specific-endurance work. In this plan, some marathon-pace runs use an **on/off alternating structure** (e.g. `5 × (1.6 km @ MP - 9 sec/km, 1.6 km @ MP + 38 sec/km)`) — preserved as a single `marathon_pace_run` rather than a separate type. |
| `hard_long_run` | Long run at marathon pace or sustained hard effort. |
| `specific_endurance_intervals` | Repetition intervals at race-distance pace (e.g. 10K, HM) |
| `ladder_intervals` | Intervals of varying distance/duration run consecutively. **Source calls these "Ladder Workout"** — same concept, different name. |
| `speed_intervals` | Short, fast repetition intervals targeting neuromuscular speed |
| `tune_up_race` | A race or time trial mid-cycle as a fitness check. This plan includes a **10K tune-up race** (Week 12) and a **Half-Marathon tune-up race** (Week 16). |
| `goal_race` | The target race the plan is built around |

> **Note on Core Strength:** The source plans include "Core Strength" notation on most days (1, 2, or 3 sets depending on week). These are **omitted from this schema** — only the running portions are captured.

## Threshold Pace Reference

For marathon runners, marathon pace itself sits at the T1 threshold tier. The source treats sustained marathon-pace runs as **specific-endurance work**, not threshold work — see the Specific-Endurance Reference below.

| Pace ID | Sustainable for... | Elite proxy | Sub-elite proxy |
|---|---|---|---|
| **T1** | ~2.5 hours | A bit slower than marathon pace | Marathon pace or slightly faster |
| **T2** | ~90 minutes | A bit faster than marathon pace | Half-marathon pace |
| **T3** | ~60 minutes | Half-marathon pace or a bit faster | A bit slower than 10K pace |

In this Masters Marathon plan:

| Source description | Threshold tier |
|---|---|
| "marathon pace" | **T1** |
| "half-marathon pace" | **T2** |
| "10K pace" | **T3** |
| "goal 10K pace" | **T3** |

```json
{
  "threshold_paces": {
    "T1": { "sustainable_minutes": 150, "elite_proxy": "slightly slower than marathon pace", "sub_elite_proxy": "marathon pace or slightly faster" },
    "T2": { "sustainable_minutes": 90,  "elite_proxy": "slightly faster than marathon pace", "sub_elite_proxy": "half-marathon pace" },
    "T3": { "sustainable_minutes": 60,  "elite_proxy": "half-marathon pace or slightly faster", "sub_elite_proxy": "slightly slower than 10K pace" }
  },
  "source_pace_to_threshold_tier": {
    "marathon pace":      "T1",
    "half-marathon pace": "T2",
    "10K pace":           "T3",
    "goal 10K pace":      "T3"
  }
}
```

## Diagnostic Checkpoints

This plan includes **two explicit diagnostic checkpoints**, spaced roughly to match the source's "every 5–6 weeks" guideline:

| Week | Day | Workout | Type |
|---|---|---|---|
| 12 | Saturday | 10K Tune-Up Race | `tune_up_race` |
| 16 | Saturday | Half-Marathon Tune-Up Race | `tune_up_race` |

The Week 16 half-marathon serves as a dress rehearsal at substantial race-pace effort — the closest available approximation of marathon fitness.

## Training Phases

In this Masters Marathon plan: **Weeks 1–6 = `fundamental`, Weeks 7–19 = `sharpening`, Week 20 = `taper`**. The 13-week sharpening phase mirrors the standard Marathon Level 2 plan.

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
| `moderate` | `14.4 km, last mile moderate (uphill if possible)` | Throughout cycle |
| `moderate_uphill` | `14.4 km, last mile moderate (uphill if possible)` | Aerobic + strength |
| `hard` | `6.4 km easy + 3.2 km hard (uphill if possible)` | Late fundamental |
| `hard_uphill` | `6.4 km easy + 3.2 km hard (uphill if possible)` | Fundamental |
| `long_run_progression` | `27.2 km, last 4.8 km progressing moderate to hard` | Throughout cycle |
| `fartlek_progression` | (not used) | Late fundamental |
| `marathon_pace_progression` | (not used in this plan — replaced by marathon_pace_run workouts) | Race-pace stimulus |

```json
{
  "progression_run_formats": {
    "moderate":                  { "example": "14.4 km, last mile moderate", "best_use": "Introductory; later, adds extra hard work to schedule" },
    "moderate_uphill":           { "example": "14.4 km, last mile moderate (uphill if possible)", "best_use": "Introductory; aerobic + strength simultaneously" },
    "hard":                      { "example": "17.6 km, last 4.8 km hard", "best_use": "Late fundamental; coax aerobic support toward peak" },
    "hard_uphill":               { "example": "6.4 km easy + 3.2 km hard (uphill if possible)", "best_use": "Fundamental; aerobic + strength after foundation built" },
    "long_run_progression":      { "example": "27.2 km, last 4.8 km progressing moderate to hard", "best_use": "Throughout cycle; transform race endurance into race-specific endurance" },
    "fartlek_progression":       { "example": "3.2 km easy + 6.4 km intervals + 3.2 km hard", "best_use": "Late fundamental; integrate two types of specific-endurance training" },
    "marathon_pace_progression": { "example": "11.2 km easy + 20 min @ marathon pace", "best_use": "Race-pace training stimulus inside a longer run (HM/marathon plans)" }
  }
}
```

---

## Threshold Run Format Reference

| Format | Example | Best Use |
|---|---|---|
| `one_interval` | `1.6 km easy + 6.4 km @ HM pace + 1.6 km easy` | Shorter early, longer late |
| `two_intervals` | `1.6 km easy + 3.2 km @ HM pace + 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy` | More total threshold time with recovery |
| `three_intervals` | (not used in this plan) | All three threshold tiers |
| `multi_interval` | Continuous chain of alternating-pace blocks | Late-cycle race-pace work |

The Masters Marathon plan uses an unusual **multi-interval continuous-chain** pattern in Weeks 17–19 (`3.2 km @ MP + 0.8 km easy + 3.2 km @ HM pace + 0.8 km easy + 3.2 km @ MP + 0.8 km easy + 1.6 km @ 10K pace`) — four threshold blocks at three different paces in a single sustained workout. I tagged these as `multi_interval` since the structure has 4+ blocks; the alternating-tier pattern echoes the threshold sequence used in the Masters 10K plan.

```json
{
  "threshold_run_formats": {
    "one_interval":    { "example": "1.6 km easy + 6.4 km @ half-marathon pace + 1.6 km easy", "best_use": "Build aerobic support (shorter early, longer late)" },
    "two_intervals":   { "example": "1.6 km easy + 3.2 km @ HM pace + 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy", "best_use": "More total threshold time with mid-workout recovery" },
    "three_intervals": { "example": "1.6 km easy + 10 min @ marathon pace + 1 min easy + 10 min @ HM pace + 1 min easy + 10 min @ 10K pace + 1.6 km easy", "best_use": "Hit all three threshold tiers (T1, T2, T3) in one workout" },
    "multi_interval":  { "example": "1.6 km easy + 3.2 km @ MP + 0.8 km easy + 3.2 km @ HM pace + 0.8 km easy + 3.2 km @ MP + 0.8 km easy + 1.6 km @ 10K pace + 1.6 km easy", "best_use": "Continuous chain of 4+ threshold blocks; alternating-pace patterns" }
  }
}
```

---

## Specific-Endurance Reference

For marathon runners, specific-endurance training happens primarily through **sustained marathon-pace efforts over long distances**. This plan uses:

1. **`marathon_pace_run`** — including peak workouts with on/off alternating structure (e.g. Week 15: `5 × (1.6 km @ MP - 9 sec/km, 1.6 km @ MP + 38 sec/km)`). The on/off pattern with progressively narrowing pace gap echoes the `specific_endurance_long_run` pattern from Marathon Level 3, though the source labels these `Marathon-Pace Run` here.
2. **`hard_long_run`** — long runs at marathon pace (Weeks 14, 16)
3. Standard **`specific_endurance_intervals`** at goal 10K pace and half-marathon pace

### The ±10% Pace Range

| Phase | Pace range vs. goal pace |
|---|---|
| `fundamental` | **±10%** |
| `sharpening`  | **±3–4%** |
| `taper`       | **±3–4%** |

### How specific-endurance training progresses across the cycle

The peak workout **Week 19** (`16 km easy + 16 km @ marathon pace`) precisely matches the source's Table 5.1 peak workout for Competitive marathon runners.

### Peak-level specific-endurance workouts by distance and runner profile

| Race | Runner profile | Peak workout |
|---|---|---|
| Marathon | Low-Key Competitive (`low_key`) | 32–35.2 km easy |
| Marathon | Competitive (`competitive`) | 16 km easy + 16 km @ marathon pace |
| Marathon | Highly Competitive (`highly_competitive`) | 45 min easy + 20K: 1K on/1K off |

The Masters Marathon plan reaches the "Competitive" peak workout in Week 19.

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
    "primary_vehicles_note": "For marathon runners, specific-endurance work happens through sustained efforts at or near marathon pace over long distances.",
    "marathon_diagnostic_note": "Source generally states no effective marathon SE test exists, but this Masters plan includes 10K (W12) and HM (W16) tune-up races as approximate fitness checks."
  }
}
```

---

## Interval Format Reference

| Format | Description | Example |
|---|---|---|
| `repetition` | Uniform-distance, uniform-pace intervals | `5 × 1.6 km @ goal 10K pace` |
| `ladder` | Varying-distance intervals (the source's "Ladder Workout") | `2 × (6 min, 5 min, 4 min, 3 min, 2 min, 1 min @ 10K-1500m pace)` |
| `add_on` | Small set of speed intervals appended to a slower workout | (used in Week 17 Thursday) |

Week 17 Thursday combines a threshold workout with appended speed intervals (`4 × 400m hills @ 3K effort`) — the `add_on` pattern.

---

## Weekly Schedule

### Week 1

| Day | Workout |
|---|---|
| Sunday | Long Run — 9.6 km easy |
| Monday | Rest (Core Strength 1 set in source) |
| Tuesday | Easy Run — 6.4 km + 1 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 1 set in source) |
| Thursday | Fartlek Run — 8 km easy w/ 6 × 30 sec. intervals @ 10K–3K pace |
| Friday | Rest (Core Strength 1 set in source) |
| Saturday | X-Train — 20 min. |

### Week 2

| Day | Workout |
|---|---|
| Sunday | Long Run — 11.2 km easy |
| Monday | Rest (Core Strength 1 set in source) |
| Tuesday | Easy Run — 8 km + 2 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 1 set in source) |
| Thursday | Fartlek Run — 9.6 km easy w/ 6 × 40 sec. intervals @ 10K–3K pace |
| Friday | Rest (Core Strength 1 set in source) |
| Saturday | X-Train — 25 min. |

### Week 3

| Day | Workout |
|---|---|
| Sunday | Long Run — 12.8 km easy |
| Monday | Rest (Core Strength 1 set in source) |
| Tuesday | Easy Run — 8 km + 3 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 1 set in source) |
| Thursday | Fartlek Run — 11.2 km easy w/ 6 × 40 sec. intervals @ 10K–3K pace |
| Friday | Rest (Core Strength 1 set in source) |
| Saturday | X-Train — 30 min. |

### Week 4

| Day | Workout |
|---|---|
| Sunday | Long Run — 9.6 km easy |
| Monday | Rest (Core Strength 1 set in source) |
| Tuesday | Easy Run — 6.4 km + 4 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 1 set in source) |
| Thursday | Fartlek Run — 8 km easy w/ 6 × 30 sec. intervals @ 10K–3K pace |
| Friday | Rest (Core Strength 1 set in source) |
| Saturday | X-Train — 20 min. |

### Week 5

| Day | Workout |
|---|---|
| Sunday | Progression Run — 14.4 km, last mile moderate (uphill, if possible) |
| Monday | Rest (Core Strength 2 sets in source) |
| Tuesday | Anaerobic Hill Intervals — 1.6 km easy + 4 × 400m uphill @ 3K effort w/ 2-min. active recoveries + 1.6 km easy + 5 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 2 sets in source) |
| Thursday | Progression Run — 6.4 km easy + 3.2 km hard (uphill, if possible) |
| Friday | Rest (Core Strength 2 sets in source) |
| Saturday | X-Train — 30 min. |

### Week 6

| Day | Workout |
|---|---|
| Sunday | Progression Run — 17.6 km, last mile moderate (uphill, if possible) |
| Monday | Rest (Core Strength 2 sets in source) |
| Tuesday | Anaerobic Hill Intervals — 1.6 km easy + 4 × 600m uphill @ 3K effort w/ 2-min. active recoveries + 1.6 km easy + 6 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 2 sets in source) |
| Thursday | Ladder Workout — 1.6 km easy + 2 × (6 min, 5 min, 4 min, 3 min, 2 min, 1 min @ 10K–1,500m pace w/ 2-min. active recoveries) + 1.6 km easy |
| Friday | Rest (Core Strength 2 sets in source) |
| Saturday | X-Train — 35 min. |

### Week 7

| Day | Workout |
|---|---|
| Sunday | Progression Run — 20.8 km, last 3.2 km moderate (uphill, if possible) |
| Monday | Rest (Core Strength 2 sets in source) |
| Tuesday | Ladder Workout — 1.6 km easy + 1.6 km, 1K, 800m, 400m, 200m w/ 400m jog recoveries @ 10K–1,500m pace + 7 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 2 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 3.2 km @ half-marathon pace + 1.6 km easy + 3.2 km @ half-marathon pace + 1.6 km easy |
| Friday | Rest (Core Strength 2 sets in source) |
| Saturday | X-Train — 40 min. |

### Week 8

| Day | Workout |
|---|---|
| Sunday | Long Run — 12.8 km easy |
| Monday | Rest (Core Strength 2 sets in source) |
| Tuesday | Speed Intervals — 1.6 km easy + 6 × 400m @ 3K pace w/ 2-min. active recoveries + 1.6 km easy + 8 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 2 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 3.2 km @ half-marathon pace + 1.6 km easy + 1.6 km @ 10K pace + 1.6 km easy |
| Friday | Rest (Core Strength 2 sets in source) |
| Saturday | X-Train — 30 min. |

### Week 9

| Day | Workout |
|---|---|
| Sunday | Progression Run — 22.4 km, last 3.2 km moderate |
| Monday | Rest (Core Strength 2 sets in source) |
| Tuesday | Anaerobic Hill Intervals — 1.6 km easy + 5 × 600m uphill @ 3K effort w/ 2-min. active recoveries + 1.6 km easy + 9 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 2 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 4 km @ half-marathon pace + 1.6 km easy + 4 km @ half-marathon pace + 1.6 km easy |
| Friday | Rest (Core Strength 2 sets in source) |
| Saturday | X-Train — 40 min. |

### Week 10

| Day | Workout |
|---|---|
| Sunday | Progression Run — 24 km, last 4.8 km moderate |
| Monday | Rest (Core Strength 3 sets in source) |
| Tuesday | Speed Intervals — 1.6 km easy + 8 × 400m @ 3K pace w/ 2-min. active recoveries + 1.6 km easy + 10 × 8-sec. hill sprint |
| Wednesday | Rest (Core Strength 3 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 6.4 km @ half-marathon pace + 1.6 km easy |
| Friday | Rest (Core Strength 3 sets in source) |
| Saturday | X-Train — 45 min. |

### Week 11

| Day | Workout |
|---|---|
| Sunday | Progression Run — 25.6 km, last 4.8 km moderate |
| Monday | Rest (Core Strength 3 sets in source) |
| Tuesday | Ladder Workout — 1.6 km easy + 2 × (1.6 km, 1K, 800m, 400m w/ 400m jog recoveries @ 10K–1,500m pace) + 8 × 10-sec. hill sprint |
| Wednesday | Rest (Core Strength 3 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 4.8 km @ half-marathon pace + 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy |
| Friday | Rest (Core Strength 3 sets in source) |
| Saturday | X-Train — 50 min. |

### Week 12

| Day | Workout |
|---|---|
| Sunday | Progression Run — 27.2 km, last 4.8 km progressing moderate to hard |
| Monday | Rest (Core Strength 3 sets in source) |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 4 × 1.6 km @ goal 10K pace w/ 2-min. active recoveries + 1.6 km easy + 8 × 10-sec. hill sprint |
| Wednesday | Rest (Core Strength 3 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 3.2 km @ half-marathon pace + 1.6 km easy + 1.6 km @ 10K pace + 1.6 km easy |
| Friday | Rest (Core Strength 1 set in source) |
| Saturday | Tune-Up Race — 10K |

### Week 13

| Day | Workout |
|---|---|
| Sunday | Long Run — 12.8 km easy |
| Monday | Rest (Core Strength 3 sets in source) |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 5 × 1.6 km @ goal 10K pace w/ 2-min. active recoveries + 1.6 km easy + 9 × 10-sec. hill sprint |
| Wednesday | Rest (Core Strength 3 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 4.8 km @ half-marathon pace + 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy |
| Friday | Rest (Core Strength 3 sets in source) |
| Saturday | X-Train — 50 min. |

### Week 14

| Day | Workout |
|---|---|
| Sunday | Hard Long Run — 22.4 km + 6.4 km @ marathon pace |
| Monday | Rest (Core Strength 3 sets in source) |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 5 × 1.6 km @ goal 10K pace w/ 2-min. active recoveries + 1.6 km easy + 9 × 10-sec. hill sprint |
| Wednesday | Rest (Core Strength 3 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 5.6 km @ half-marathon pace + 1.6 km easy + 4 km @ 10K pace + 1.6 km easy |
| Friday | Rest (Core Strength 3 sets in source) |
| Saturday | X-Train — 55 min. |

### Week 15

| Day | Workout |
|---|---|
| Sunday | Marathon-Pace Run — 9.6 km easy + 5 × (1.6 km @ marathon pace − 9 sec/km, 1.6 km @ marathon pace + 38 sec/km) |
| Monday | Rest (Core Strength 2 sets in source) |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 5 × 1.6 km @ goal 10K pace w/ 2-min. active recoveries + 1.6 km easy + 9 × 10-sec. hill sprint |
| Wednesday | Rest (Core Strength 2 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy |
| Friday | Rest (Core Strength 2 sets in source) |
| Saturday | X-Train — 1 hour |

### Week 16

| Day | Workout |
|---|---|
| Sunday | Hard Long Run — 25.6 km easy + 6.4 km @ marathon pace |
| Monday | Rest (Core Strength 3 sets in source) |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 2 × 3.2 km @ half-marathon pace w/ 2-min. active recovery + 1.6 km easy + 4 × 10-sec. hill sprint |
| Wednesday | Rest (Core Strength 3 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy |
| Friday | Rest (Core Strength 3 sets in source) |
| Saturday | Tune-Up Race — Half-Marathon |

### Week 17

| Day | Workout |
|---|---|
| Sunday | Long Run — 12.8 km easy |
| Monday | Rest (Core Strength 3 sets in source) |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 2 × 3.2 km @ half-marathon pace w/ 2-min. active recovery + 1.6 km easy + 4 × 400m hills @ 3K effort |
| Wednesday | Rest (Core Strength 3 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 3.2 km @ marathon pace + 0.8 km easy + 3.2 km @ half-marathon pace + 0.8 km easy + 3.2 km @ marathon pace + 0.8 km easy + 1.6 km @ 10K pace + 1.6 km easy |
| Friday | Rest (Core Strength 3 sets in source) |
| Saturday | X-Train — 1 hour |

### Week 18

| Day | Workout |
|---|---|
| Sunday | Marathon-Pace Run — 9.6 km easy + 4 × (3.2 km @ marathon pace − 3 sec/km, 1.6 km @ marathon pace + 19 sec/km) |
| Monday | Rest (Core Strength 3 sets in source) |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 5 × 2K @ half-marathon pace w/ 90-sec. active recoveries + 1.6 km easy + 10 × 10-sec. hill sprint |
| Wednesday | Rest (Core Strength 3 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 4.8 km @ half-marathon pace + 0.8 km easy + 3.2 km @ half-marathon pace + 0.8 km easy + 1.6 km @ 10K pace + 1.6 km easy |
| Friday | Rest (Core Strength 3 sets in source) |
| Saturday | X-Train — 1 hour |

### Week 19

| Day | Workout |
|---|---|
| Sunday | Marathon-Pace Run — 16 km easy + 16 km @ marathon pace |
| Monday | Rest (Core Strength 3 sets in source) |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 6 × 2K @ half-marathon pace w/ 90-sec. active recoveries + 1.6 km easy + 6 × 10-sec. hill sprint |
| Wednesday | Rest (Core Strength 3 sets in source) |
| Thursday | Threshold Run — 1.6 km easy + 3.2 km @ marathon pace + 0.8 km easy + 4.8 km @ half-marathon pace + 0.8 km easy + 1.6 km @ 10K pace + 1.6 km easy |
| Friday | Rest (Core Strength 3 sets in source) |
| Saturday | X-Train — 1 hour |

### Week 20

| Day | Workout |
|---|---|
| Sunday | Long Run — 19.2 km easy |
| Monday | Rest (Core Strength 2 sets in source) |
| Tuesday | Specific-Endurance Intervals — 1.6 km easy + 2 × 3.2 km @ half-marathon pace w/ 2-min. active recovery + 1.6 km easy + 4 × 10-sec. hill sprint |
| Wednesday | Rest (Core Strength 1 set in source) |
| Thursday | Threshold Run — 1.6 km easy + 3.2 km @ marathon pace + 1.6 km easy |
| Friday | Rest (Core Strength 1 set in source) |
| Saturday | **Goal Race — Marathon** |

> **Race day note:** The source's printed plan ends Week 20 Saturday with `Easy Run 3.2 km + 4 × 100m strides` as a pre-race shakeout, with the marathon presumably the following day (Sunday). For schema consistency with all other marathon plans, this file places the `goal_race` on Saturday of Week 20. If the runner's actual race is on Sunday, they should run the source's Saturday shakeout on Saturday and the race on Sunday.

---

## Structured Data (JSON)

```json
{
  "plan": {
    "plan_category": "masters",
    "distance": "Marathon",
    "duration_weeks": 20,
    "applies_to_runner_profiles": ["masters"],
    "weekly_volume": {
      "min_runs": 4,
      "max_runs": 5,
      "min_miles": 16,
      "max_miles": 47
    },
    "race_day_of_week": "weekend",
    "race_day_note": "The source plan ends Week 20 Saturday with a pre-race shakeout (Easy Run 3.2 km + 4 x 100m strides) and the marathon on Sunday. For schema consistency with other plans, this file places the goal_race on Saturday Week 20.",
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
      "marathon_diagnostic_note": "Source generally states no effective marathon SE test exists, but this Masters plan includes 10K (W12) and HM (W16) tune-up races as approximate fitness checks."
    },
    "weeks": [
      {
        "week": 1,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "long_run", "description": "9.6 km easy" },
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
          "sunday":    { "type": "long_run", "description": "11.2 km easy" },
          "monday":    { "type": "rest",     "description": "Rest (Core Strength 1 set in source)" },
          "tuesday":   { "type": "easy_run", "description": "8 km + 2 x 8-sec hill sprint" },
          "wednesday": { "type": "rest",     "description": "Rest (Core Strength 1 set in source)" },
          "thursday":  { "type": "fartlek",  "description": "9.6 km easy w/ 6 x 40 sec intervals @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "friday":    { "type": "rest",     "description": "Rest (Core Strength 1 set in source)" },
          "saturday":  { "type": "xtrain",   "description": "X-Train 25 min" }
        }
      },
      {
        "week": 3,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "long_run", "description": "12.8 km easy" },
          "monday":    { "type": "rest",     "description": "Rest (Core Strength 1 set in source)" },
          "tuesday":   { "type": "easy_run", "description": "8 km + 3 x 8-sec hill sprint" },
          "wednesday": { "type": "rest",     "description": "Rest (Core Strength 1 set in source)" },
          "thursday":  { "type": "fartlek",  "description": "11.2 km easy w/ 6 x 40 sec intervals @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "friday":    { "type": "rest",     "description": "Rest (Core Strength 1 set in source)" },
          "saturday":  { "type": "xtrain",   "description": "X-Train 30 min" }
        }
      },
      {
        "week": 4,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "long_run", "description": "9.6 km easy" },
          "monday":    { "type": "rest",     "description": "Rest (Core Strength 1 set in source)" },
          "tuesday":   { "type": "easy_run", "description": "6.4 km + 4 x 8-sec hill sprint" },
          "wednesday": { "type": "rest",     "description": "Rest (Core Strength 1 set in source)" },
          "thursday":  { "type": "fartlek",  "description": "8 km easy w/ 6 x 30 sec intervals @ 10K-3K pace", "fartlek_format": "speed_fartlek" },
          "friday":    { "type": "rest",     "description": "Rest (Core Strength 1 set in source)" },
          "saturday":  { "type": "xtrain",   "description": "X-Train 20 min" }
        }
      },
      {
        "week": 5,
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "14.4 km, last mile moderate (uphill if possible)", "progression_format": "moderate_uphill" },
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
        "training_phase": "fundamental",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "17.6 km, last mile moderate (uphill if possible)", "progression_format": "moderate_uphill" },
          "monday":    { "type": "rest",             "description": "Rest (Core Strength 2 sets in source)" },
          "tuesday":   { "type": "hill_repetitions", "description": "Anaerobic Hill Intervals: 1.6 km easy + 4 x 600m uphill @ 3K effort w/ 2-min active recoveries + 1.6 km easy + 6 x 8-sec hill sprint" },
          "wednesday": { "type": "rest",             "description": "Rest (Core Strength 2 sets in source)" },
          "thursday":  { "type": "ladder_intervals", "description": "Ladder Workout: 1.6 km easy + 2 x (6 min, 5 min, 4 min, 3 min, 2 min, 1 min @ 10K-1500m pace w/ 2-min active recoveries) + 1.6 km easy", "interval_format": "ladder" },
          "friday":    { "type": "rest",             "description": "Rest (Core Strength 2 sets in source)" },
          "saturday":  { "type": "xtrain",           "description": "X-Train 35 min" }
        }
      },
      {
        "week": 7,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "20.8 km, last 3.2 km moderate (uphill if possible)", "progression_format": "long_run_progression" },
          "monday":    { "type": "rest",             "description": "Rest (Core Strength 2 sets in source)" },
          "tuesday":   { "type": "ladder_intervals", "description": "Ladder Workout: 1.6 km easy + 1.6 km, 1K, 800m, 400m, 200m w/ 400m jog recoveries @ 10K-1500m pace + 7 x 8-sec hill sprint", "interval_format": "ladder" },
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
          "sunday":    { "type": "long_run",        "description": "12.8 km easy" },
          "monday":    { "type": "rest",            "description": "Rest (Core Strength 2 sets in source)" },
          "tuesday":   { "type": "speed_intervals", "description": "1.6 km easy + 6 x 400m @ 3K pace w/ 2-min active recoveries + 1.6 km easy + 8 x 8-sec hill sprint", "interval_format": "repetition" },
          "wednesday": { "type": "rest",            "description": "Rest (Core Strength 2 sets in source)" },
          "thursday":  { "type": "threshold_run",   "description": "1.6 km easy + 3.2 km @ half-marathon pace + 1.6 km easy + 1.6 km @ 10K pace + 1.6 km easy", "threshold_tier": "T2-T3", "threshold_format": "two_intervals" },
          "friday":    { "type": "rest",            "description": "Rest (Core Strength 2 sets in source)" },
          "saturday":  { "type": "xtrain",          "description": "X-Train 30 min" }
        }
      },
      {
        "week": 9,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "22.4 km, last 3.2 km moderate", "progression_format": "long_run_progression" },
          "monday":    { "type": "rest",             "description": "Rest (Core Strength 2 sets in source)" },
          "tuesday":   { "type": "hill_repetitions", "description": "Anaerobic Hill Intervals: 1.6 km easy + 5 x 600m uphill @ 3K effort w/ 2-min active recoveries + 1.6 km easy + 9 x 8-sec hill sprint" },
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
          "sunday":    { "type": "progression_run", "description": "24 km, last 4.8 km moderate", "progression_format": "long_run_progression" },
          "monday":    { "type": "rest",            "description": "Rest (Core Strength 3 sets in source)" },
          "tuesday":   { "type": "speed_intervals", "description": "1.6 km easy + 8 x 400m @ 3K pace w/ 2-min active recoveries + 1.6 km easy + 10 x 8-sec hill sprint", "interval_format": "repetition" },
          "wednesday": { "type": "rest",            "description": "Rest (Core Strength 3 sets in source)" },
          "thursday":  { "type": "threshold_run",   "description": "1.6 km easy + 6.4 km @ half-marathon pace + 1.6 km easy", "threshold_tier": "T2", "threshold_format": "one_interval" },
          "friday":    { "type": "rest",            "description": "Rest (Core Strength 3 sets in source)" },
          "saturday":  { "type": "xtrain",          "description": "X-Train 45 min" }
        }
      },
      {
        "week": 11,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",  "description": "25.6 km, last 4.8 km moderate", "progression_format": "long_run_progression" },
          "monday":    { "type": "rest",             "description": "Rest (Core Strength 3 sets in source)" },
          "tuesday":   { "type": "ladder_intervals", "description": "Ladder Workout: 1.6 km easy + 2 x (1.6 km, 1K, 800m, 400m w/ 400m jog recoveries @ 10K-1500m pace) + 8 x 10-sec hill sprint", "interval_format": "ladder" },
          "wednesday": { "type": "rest",             "description": "Rest (Core Strength 3 sets in source)" },
          "thursday":  { "type": "threshold_run",    "description": "1.6 km easy + 4.8 km @ half-marathon pace + 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy", "threshold_tier": "T2-T3", "threshold_format": "two_intervals" },
          "friday":    { "type": "rest",             "description": "Rest (Core Strength 3 sets in source)" },
          "saturday":  { "type": "xtrain",           "description": "X-Train 50 min" }
        }
      },
      {
        "week": 12,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "progression_run",            "description": "27.2 km, last 4.8 km progressing moderate to hard", "progression_format": "long_run_progression" },
          "monday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "1.6 km easy + 4 x 1.6 km @ goal 10K pace w/ 2-min active recoveries + 1.6 km easy + 8 x 10-sec hill sprint", "interval_format": "repetition" },
          "wednesday": { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "thursday":  { "type": "threshold_run",              "description": "1.6 km easy + 3.2 km @ half-marathon pace + 1.6 km easy + 1.6 km @ 10K pace + 1.6 km easy", "threshold_tier": "T2-T3", "threshold_format": "two_intervals" },
          "friday":    { "type": "rest",                       "description": "Rest (Core Strength 1 set in source)" },
          "saturday":  { "type": "tune_up_race",               "description": "10K Tune-Up Race", "purpose": "mid-cycle fitness check" }
        }
      },
      {
        "week": 13,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "long_run",                   "description": "12.8 km easy" },
          "monday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "1.6 km easy + 5 x 1.6 km @ goal 10K pace w/ 2-min active recoveries + 1.6 km easy + 9 x 10-sec hill sprint", "interval_format": "repetition" },
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
          "sunday":    { "type": "hard_long_run",              "description": "22.4 km + 6.4 km @ marathon pace" },
          "monday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "1.6 km easy + 5 x 1.6 km @ goal 10K pace w/ 2-min active recoveries + 1.6 km easy + 9 x 10-sec hill sprint", "interval_format": "repetition" },
          "wednesday": { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "thursday":  { "type": "threshold_run",              "description": "1.6 km easy + 5.6 km @ half-marathon pace + 1.6 km easy + 4 km @ 10K pace + 1.6 km easy", "threshold_tier": "T2-T3", "threshold_format": "two_intervals" },
          "friday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "saturday":  { "type": "xtrain",                     "description": "X-Train 55 min" }
        }
      },
      {
        "week": 15,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "marathon_pace_run",          "description": "9.6 km easy + 5 x (1.6 km @ marathon pace - 9 sec/km, 1.6 km @ marathon pace + 38 sec/km)" },
          "monday":    { "type": "rest",                       "description": "Rest (Core Strength 2 sets in source)" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "1.6 km easy + 5 x 1.6 km @ goal 10K pace w/ 2-min active recoveries + 1.6 km easy + 9 x 10-sec hill sprint", "interval_format": "repetition" },
          "wednesday": { "type": "rest",                       "description": "Rest (Core Strength 2 sets in source)" },
          "thursday":  { "type": "threshold_run",              "description": "1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy", "threshold_tier": "T3", "threshold_format": "two_intervals" },
          "friday":    { "type": "rest",                       "description": "Rest (Core Strength 2 sets in source)" },
          "saturday":  { "type": "xtrain",                     "description": "X-Train 1 hour" }
        }
      },
      {
        "week": 16,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "hard_long_run",              "description": "25.6 km easy + 6.4 km @ marathon pace" },
          "monday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "1.6 km easy + 2 x 3.2 km @ half-marathon pace w/ 2-min active recovery + 1.6 km easy + 4 x 10-sec hill sprint", "interval_format": "repetition" },
          "wednesday": { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "thursday":  { "type": "threshold_run",              "description": "1.6 km easy + 3.2 km @ 10K pace + 1.6 km easy", "threshold_tier": "T3", "threshold_format": "one_interval" },
          "friday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "saturday":  { "type": "tune_up_race",               "description": "Half-Marathon Tune-Up Race", "purpose": "late-cycle fitness check / dress rehearsal" }
        }
      },
      {
        "week": 17,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "long_run",                   "description": "12.8 km easy" },
          "monday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "1.6 km easy + 2 x 3.2 km @ half-marathon pace w/ 2-min active recovery + 1.6 km easy + 4 x 400m hills @ 3K effort", "interval_format": "add_on" },
          "wednesday": { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "thursday":  { "type": "threshold_run",              "description": "1.6 km easy + 3.2 km @ marathon pace + 0.8 km easy + 3.2 km @ half-marathon pace + 0.8 km easy + 3.2 km @ marathon pace + 0.8 km easy + 1.6 km @ 10K pace + 1.6 km easy", "threshold_tier": "T1-T3", "threshold_format": "multi_interval" },
          "friday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "saturday":  { "type": "xtrain",                     "description": "X-Train 1 hour" }
        }
      },
      {
        "week": 18,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "marathon_pace_run",          "description": "9.6 km easy + 4 x (3.2 km @ marathon pace - 3 sec/km, 1.6 km @ marathon pace + 19 sec/km)" },
          "monday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "1.6 km easy + 5 x 2K @ half-marathon pace w/ 90-sec active recoveries + 1.6 km easy + 10 x 10-sec hill sprint", "interval_format": "repetition" },
          "wednesday": { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "thursday":  { "type": "threshold_run",              "description": "1.6 km easy + 4.8 km @ half-marathon pace + 0.8 km easy + 3.2 km @ half-marathon pace + 0.8 km easy + 1.6 km @ 10K pace + 1.6 km easy", "threshold_tier": "T2-T3", "threshold_format": "multi_interval" },
          "friday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "saturday":  { "type": "xtrain",                     "description": "X-Train 1 hour" }
        }
      },
      {
        "week": 19,
        "training_phase": "sharpening",
        "days": {
          "sunday":    { "type": "marathon_pace_run",          "description": "16 km easy + 16 km @ marathon pace" },
          "monday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "1.6 km easy + 6 x 2K @ half-marathon pace w/ 90-sec active recoveries + 1.6 km easy + 6 x 10-sec hill sprint", "interval_format": "repetition" },
          "wednesday": { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "thursday":  { "type": "threshold_run",              "description": "1.6 km easy + 3.2 km @ marathon pace + 0.8 km easy + 4.8 km @ half-marathon pace + 0.8 km easy + 1.6 km @ 10K pace + 1.6 km easy", "threshold_tier": "T1-T3", "threshold_format": "multi_interval" },
          "friday":    { "type": "rest",                       "description": "Rest (Core Strength 3 sets in source)" },
          "saturday":  { "type": "xtrain",                     "description": "X-Train 1 hour" }
        }
      },
      {
        "week": 20,
        "training_phase": "taper",
        "days": {
          "sunday":    { "type": "long_run",                   "description": "19.2 km easy" },
          "monday":    { "type": "rest",                       "description": "Rest (Core Strength 2 sets in source)" },
          "tuesday":   { "type": "specific_endurance_intervals","description": "1.6 km easy + 2 x 3.2 km @ half-marathon pace w/ 2-min active recovery + 1.6 km easy + 4 x 10-sec hill sprint", "interval_format": "repetition" },
          "wednesday": { "type": "rest",                       "description": "Rest (Core Strength 1 set in source)" },
          "thursday":  { "type": "threshold_run",              "description": "1.6 km easy + 3.2 km @ marathon pace + 1.6 km easy", "threshold_tier": "T1", "threshold_format": "one_interval" },
          "friday":    { "type": "rest",                       "description": "Rest (Core Strength 1 set in source)" },
          "saturday":  { "type": "goal_race",                  "description": "Marathon Goal Race" }
        }
      }
    ]
  }
}
```
