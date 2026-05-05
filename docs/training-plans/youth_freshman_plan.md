# Freshman Plan (Youth Base-Training)

## Overview

- **Category:** Youth base training (not race-prep)
- **Duration:** 12 weeks
- **Weekly Volume:** Ranges from 4 runs / 19.2 km (Week 1) to 6 runs / 41.6 km (peak week)
- **Description:** Summer base-training plan for youth runners. **No goal race** — this plan builds aerobic foundation and neuromuscular fitness in preparation for the upcoming cross-country / track season.
- **Maps to runner profile:** `beginner` — Newer runners or returning runners — corresponds to the **beginner** profile (race-distance Level 1).

## Plan Family

There are four 12-week summer base-training plans for youth runners, each adapted to a different competitive level. They mirror four of the five runner profiles used in the race-distance plans (Freshman/Sophomore/Junior/Senior — no `elite`-tier youth plan):

| Runner profile | Youth plan | |
|---|---|---|
| `beginner` | Freshman Plan | ←
| `low_key` | Sophomore Plan |
| `competitive` | Junior Plan |
| `highly_competitive` | Senior Plan |

The arrow (←) marks **this plan**.

> **Difference from race-distance plans:** Youth plans have no `goal_race`, no `taper`, no `sharpening` phase, and no `specific_endurance` reference. They sit entirely in a single training phase: `base`. They focus on building aerobic capacity, hill strength, and (for higher-level plans) introducing fartleks and progression runs as a foundation for the in-season race-prep work that would follow.

### Quick lookup (for code)

```json
{
  "youth_to_runner_profile": {
    "freshman":  "beginner",
    "sophomore": "low_key",
    "junior":    "competitive",
    "senior":    "highly_competitive"
  },
  "runner_profile_to_youth_plan": {
    "beginner":           "freshman",
    "low_key":            "sophomore",
    "competitive":        "junior",
    "highly_competitive": "senior",
    "elite":              null
  }
}
```

## Workout Type Glossary

| Code | Description |
|---|---|
| `long_run` | Long, easy-paced run |
| `easy_run` | Easy-paced run. May include "+ drills (N sets)" — drills are dynamic-mobility movements like high-knees, butt-kicks, A/B-skips done before or after the easy run. Treated as informational text on the easy_run, not a separate workout. |
| `progression_run` | Easy run that finishes with a moderate or hard segment. Used in Junior and Senior plans. |
| `xtrain_or_rest` | Cross-training **or** rest — runner's choice (e.g. "X-Train 30 minutes or Rest") |
| `rest` | Full rest day |
| `fartlek` | Easy run with embedded faster surges (typically at 5K pace) |
| `tune_up_race` | A race or time trial run mid-cycle as a fitness check. Only the Freshman plan includes one (Week 10 — 5K time trial). |

> **Note on Core Workouts:** The source plans include a "Core Workout" notation on most days (strength/core training alongside the run). These are intentionally **omitted from this schema** — only the running portion of each day is captured. If you're following the plan in practice, the source recommends pairing the running workouts with regular core/strength work.

## Workout Types Used in This Plan

This plan uses the following workout types: `easy_run`, `fartlek`, `rest`, `tune_up_race`, `xtrain_or_rest`.

## Training Phase

All weeks of all four youth plans sit in a single phase: `base`. There is no `fundamental` → `sharpening` → `taper` arc because there's no goal race to peak for. The phase progression seen in race-distance plans is replaced here with a steady aerobic build, with optional progression runs and fartleks added in the higher-volume plans.

---

## Fartlek Format Reference

| Format | Example | Best Use |
|---|---|---|
| `speed_fartlek` | `9.6 km easy w/ 6-8 x 30 sec @ 5K pace` | Standard youth-base fartlek format — short surges at 5K race pace embedded in an easy run. |

This plan uses only the `speed_fartlek` format. Surges are typically at "5K pace" or "5K race pace" rather than the wider `10K-3K pace` zone common in race-distance plans — the goal is racing-effort exposure rather than systematic speed development.

---

## Progression Run Format Reference

(Used in Junior and Senior plans only — Freshman and Sophomore plans don't include progression runs.)

| Format | Example | Best Use |
|---|---|---|
| `moderate` | `12.8 km, last 15 min moderate` | Late base; adds aerobic stimulus |
| `moderate_uphill` | `12.8 km, last 15 min moderate (uphill if possible)` | Aerobic + strength build |
| `hard` | `16 km, last 15-20 min hard` | Peak base period; coaxes aerobic support toward higher fitness |
| `hard_uphill` | `14.4 km, last 10 min hard (uphill if possible)` | Aerobic + strength at high intensity |
| `long_run_progression` | `14.4 km (7.2 km easy, 7.2 km moderate)` | Multi-segment runs that transition from easy to moderate over a longer distance |

```json
{
  "progression_run_formats": {
    "moderate":             { "example": "12.8 km, last 15 min moderate", "best_use": "Late base; adds aerobic stimulus" },
    "moderate_uphill":      { "example": "12.8 km, last 15 min moderate (uphill if possible)", "best_use": "Aerobic + strength build" },
    "hard":                 { "example": "16 km, last 15-20 min hard", "best_use": "Peak base; coax aerobic support toward higher fitness" },
    "hard_uphill":          { "example": "14.4 km, last 10 min hard (uphill if possible)", "best_use": "Aerobic + strength at high intensity" },
    "long_run_progression": { "example": "14.4 km (4.5 easy, 4.5 moderate)", "best_use": "Multi-segment easy-to-moderate transition over longer distance" }
  }
}
```

---

## Weekly Schedule

### Week 1

| Day | Workout |
|---|---|
| Sunday | Rest |
| Monday | Easy Run — 4.8 km |
| Tuesday | Easy Run — 4.8 km + 1 x 8-sec hill sprint |
| Wednesday | X-Train 20 minutes or Rest |
| Thursday | Easy Run — 4.8 km |
| Friday | Easy Run — 4.8 km + 1 x 8-sec hill sprint |
| Saturday | X-Train 20 minutes or Rest |

### Week 2

| Day | Workout |
|---|---|
| Sunday | Rest |
| Monday | Easy Run — 6.4 km |
| Tuesday | Easy Run — 4.8 km + 2 x 8-sec hill sprint |
| Wednesday | X-Train 20 minutes or Rest |
| Thursday | Easy Run — 4.8 km |
| Friday | Easy Run — 6.4 km + 2 x 8-sec hill sprint |
| Saturday | X-Train 20 minutes or Rest |

### Week 3

| Day | Workout |
|---|---|
| Sunday | Rest |
| Monday | Easy Run — 8 km |
| Tuesday | Easy Run — 4.8 km + 3 x 8-sec hill sprint |
| Wednesday | X-Train 25 minutes or Rest |
| Thursday | Easy Run — 4.8 km |
| Friday | Easy Run — 8 km + 3 x 8-sec hill sprint |
| Saturday | X-Train 25 minutes or Rest |

### Week 4

| Day | Workout |
|---|---|
| Sunday | Rest |
| Monday | Easy Run — 8 km |
| Tuesday | Easy Run — 6.4 km + 5 x 8-sec hill sprint |
| Wednesday | X-Train 25 minutes or Rest |
| Thursday | Easy Run — 4.8 km |
| Friday | Easy Run — 8 km + 5 x 8-sec hill sprint |
| Saturday | X-Train 25 minutes or Rest |

### Week 5

| Day | Workout |
|---|---|
| Sunday | Rest |
| Monday | Easy Run — 9.6 km |
| Tuesday | Easy Run — 6.4 km + 5 x 8-sec hill sprint |
| Wednesday | X-Train 30 minutes or Rest |
| Thursday | Easy Run — 6.4 km |
| Friday | Easy Run — 9.6 km + 5 x 8-sec hill sprint |
| Saturday | X-Train 30 minutes or Rest |

### Week 6

| Day | Workout |
|---|---|
| Sunday | Rest |
| Monday | Easy Run — 9.6 km |
| Tuesday | Easy Run — 8 km + 6 x 8-sec hill sprint |
| Wednesday | X-Train 30 minutes or Rest |
| Thursday | Easy Run — 6.4 km |
| Friday | Easy Run — 9.6 km + 6 x 8-sec hill sprint |
| Saturday | X-Train 30 minutes or Rest |

### Week 7

| Day | Workout |
|---|---|
| Sunday | Rest |
| Monday | Easy Run — 11.2 km |
| Tuesday | Easy Run — 8 km + 7 x 8-sec hill sprint |
| Wednesday | X-Train 35 minutes or Rest |
| Thursday | Fartlek Run — 9.6 km easy w/ 4-6 x 30 sec @ 5K pace |
| Friday | Easy Run — 8 km + 7 x 8-sec hill sprint |
| Saturday | X-Train 35 minutes or Rest |

### Week 8

| Day | Workout |
|---|---|
| Sunday | Rest |
| Monday | Easy Run — 11.2 km |
| Tuesday | Easy Run — 8 km + 8 x 8-sec hill sprint |
| Wednesday | X-Train 35 minutes or Rest |
| Thursday | Fartlek Run — 9.6 km easy w/ 6-8 x 30 sec @ 5K pace |
| Friday | Easy Run — 9.6 km + drills (1 set) |
| Saturday | X-Train 35 minutes or Rest |

### Week 9

| Day | Workout |
|---|---|
| Sunday | Rest |
| Monday | Easy Run — 11.2 km |
| Tuesday | Easy Run — 8 km + 10 x 8-sec hill sprint |
| Wednesday | X-Train 40 minutes or Rest |
| Thursday | Fartlek Run — 9.6 km easy w/ 6-8 x 35 sec @ 5K pace |
| Friday | Easy Run — 9.6 km + drills (2 sets) |
| Saturday | X-Train 40 minutes or Rest |

### Week 10

| Day | Workout |
|---|---|
| Sunday | Rest |
| Monday | Easy Run — 11.2 km |
| Tuesday | Easy Run — 8 km + 10 x 8-sec hill sprint |
| Wednesday | X-Train 40 minutes or Rest |
| Thursday | Fartlek Run — 9.6 km easy w/ 4-6 x 40 sec @ 5K pace |
| Friday | Easy Run — 9.6 km + drills (3 sets) |
| Saturday | Tune-Up Race — 1.6 km easy + 3 x 100m strides + 5K time trial + 1.6 km easy |

### Week 11

| Day | Workout |
|---|---|
| Sunday | Rest |
| Monday | Easy Run — 11.2 km |
| Tuesday | Easy Run — 8 km + 10 x 8-sec hill sprint |
| Wednesday | X-Train 40 minutes or Rest |
| Thursday | Fartlek Run — 9.6 km easy w/ 6-8 x 40 sec @ 5K pace |
| Friday | Easy Run — 6.4 km + drills (3 sets) |
| Saturday | Easy Run — 4.8 km |

### Week 12

| Day | Workout |
|---|---|
| Sunday | Rest |
| Monday | Easy Run — 11.2 km |
| Tuesday | Easy Run — 8 km + 10 x 8-sec hill sprint |
| Wednesday | X-Train 40 minutes or Rest |
| Thursday | Fartlek Run — 9.6 km easy w/ 6-8 x 45 sec @ 5K pace |
| Friday | Easy Run — 6.4 km + drills (3 sets) |
| Saturday | Easy Run — 6.4 km |

---

## Structured Data (JSON)

```json
{
  "plan": {
    "plan_category": "youth_base_training",
    "plan_label": "Freshman Plan",
    "youth_level": "freshman",
    "duration_weeks": 12,
    "applies_to_runner_profiles": [
      "beginner"
    ],
    "weekly_volume": {
      "min_runs": 4,
      "max_runs": 6,
      "min_miles": 12,
      "max_miles": 26
    },
    "has_goal_race": false,
    "purpose": "12-week summer base-training plan for youth runners. Builds aerobic foundation and neuromuscular fitness in preparation for the cross-country / track season. No goal race at the end.",
    "weeks": [
      {
        "week": 1,
        "training_phase": "base",
        "days": {
          "sunday": {
            "type": "rest",
            "description": "Rest"
          },
          "monday": {
            "type": "easy_run",
            "description": "4.8 km"
          },
          "tuesday": {
            "type": "easy_run",
            "description": "4.8 km + 1 x 8-sec hill sprint"
          },
          "wednesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 20 minutes or Rest"
          },
          "thursday": {
            "type": "easy_run",
            "description": "4.8 km"
          },
          "friday": {
            "type": "easy_run",
            "description": "4.8 km + 1 x 8-sec hill sprint"
          },
          "saturday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 20 minutes or Rest"
          }
        }
      },
      {
        "week": 2,
        "training_phase": "base",
        "days": {
          "sunday": {
            "type": "rest",
            "description": "Rest"
          },
          "monday": {
            "type": "easy_run",
            "description": "6.4 km"
          },
          "tuesday": {
            "type": "easy_run",
            "description": "4.8 km + 2 x 8-sec hill sprint"
          },
          "wednesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 20 minutes or Rest"
          },
          "thursday": {
            "type": "easy_run",
            "description": "4.8 km"
          },
          "friday": {
            "type": "easy_run",
            "description": "6.4 km + 2 x 8-sec hill sprint"
          },
          "saturday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 20 minutes or Rest"
          }
        }
      },
      {
        "week": 3,
        "training_phase": "base",
        "days": {
          "sunday": {
            "type": "rest",
            "description": "Rest"
          },
          "monday": {
            "type": "easy_run",
            "description": "8 km"
          },
          "tuesday": {
            "type": "easy_run",
            "description": "4.8 km + 3 x 8-sec hill sprint"
          },
          "wednesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 25 minutes or Rest"
          },
          "thursday": {
            "type": "easy_run",
            "description": "4.8 km"
          },
          "friday": {
            "type": "easy_run",
            "description": "8 km + 3 x 8-sec hill sprint"
          },
          "saturday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 25 minutes or Rest"
          }
        }
      },
      {
        "week": 4,
        "training_phase": "base",
        "days": {
          "sunday": {
            "type": "rest",
            "description": "Rest"
          },
          "monday": {
            "type": "easy_run",
            "description": "8 km"
          },
          "tuesday": {
            "type": "easy_run",
            "description": "6.4 km + 5 x 8-sec hill sprint"
          },
          "wednesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 25 minutes or Rest"
          },
          "thursday": {
            "type": "easy_run",
            "description": "4.8 km"
          },
          "friday": {
            "type": "easy_run",
            "description": "8 km + 5 x 8-sec hill sprint"
          },
          "saturday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 25 minutes or Rest"
          }
        }
      },
      {
        "week": 5,
        "training_phase": "base",
        "days": {
          "sunday": {
            "type": "rest",
            "description": "Rest"
          },
          "monday": {
            "type": "easy_run",
            "description": "9.6 km"
          },
          "tuesday": {
            "type": "easy_run",
            "description": "6.4 km + 5 x 8-sec hill sprint"
          },
          "wednesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 30 minutes or Rest"
          },
          "thursday": {
            "type": "easy_run",
            "description": "6.4 km"
          },
          "friday": {
            "type": "easy_run",
            "description": "9.6 km + 5 x 8-sec hill sprint"
          },
          "saturday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 30 minutes or Rest"
          }
        }
      },
      {
        "week": 6,
        "training_phase": "base",
        "days": {
          "sunday": {
            "type": "rest",
            "description": "Rest"
          },
          "monday": {
            "type": "easy_run",
            "description": "9.6 km"
          },
          "tuesday": {
            "type": "easy_run",
            "description": "8 km + 6 x 8-sec hill sprint"
          },
          "wednesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 30 minutes or Rest"
          },
          "thursday": {
            "type": "easy_run",
            "description": "6.4 km"
          },
          "friday": {
            "type": "easy_run",
            "description": "9.6 km + 6 x 8-sec hill sprint"
          },
          "saturday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 30 minutes or Rest"
          }
        }
      },
      {
        "week": 7,
        "training_phase": "base",
        "days": {
          "sunday": {
            "type": "rest",
            "description": "Rest"
          },
          "monday": {
            "type": "easy_run",
            "description": "11.2 km"
          },
          "tuesday": {
            "type": "easy_run",
            "description": "8 km + 7 x 8-sec hill sprint"
          },
          "wednesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 35 minutes or Rest"
          },
          "thursday": {
            "type": "fartlek",
            "description": "9.6 km easy w/ 4-6 x 30 sec @ 5K pace",
            "fartlek_format": "speed_fartlek"
          },
          "friday": {
            "type": "easy_run",
            "description": "8 km + 7 x 8-sec hill sprint"
          },
          "saturday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 35 minutes or Rest"
          }
        }
      },
      {
        "week": 8,
        "training_phase": "base",
        "days": {
          "sunday": {
            "type": "rest",
            "description": "Rest"
          },
          "monday": {
            "type": "easy_run",
            "description": "11.2 km"
          },
          "tuesday": {
            "type": "easy_run",
            "description": "8 km + 8 x 8-sec hill sprint"
          },
          "wednesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 35 minutes or Rest"
          },
          "thursday": {
            "type": "fartlek",
            "description": "9.6 km easy w/ 6-8 x 30 sec @ 5K pace",
            "fartlek_format": "speed_fartlek"
          },
          "friday": {
            "type": "easy_run",
            "description": "9.6 km + drills (1 set)"
          },
          "saturday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 35 minutes or Rest"
          }
        }
      },
      {
        "week": 9,
        "training_phase": "base",
        "days": {
          "sunday": {
            "type": "rest",
            "description": "Rest"
          },
          "monday": {
            "type": "easy_run",
            "description": "11.2 km"
          },
          "tuesday": {
            "type": "easy_run",
            "description": "8 km + 10 x 8-sec hill sprint"
          },
          "wednesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 40 minutes or Rest"
          },
          "thursday": {
            "type": "fartlek",
            "description": "9.6 km easy w/ 6-8 x 35 sec @ 5K pace",
            "fartlek_format": "speed_fartlek"
          },
          "friday": {
            "type": "easy_run",
            "description": "9.6 km + drills (2 sets)"
          },
          "saturday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 40 minutes or Rest"
          }
        }
      },
      {
        "week": 10,
        "training_phase": "base",
        "days": {
          "sunday": {
            "type": "rest",
            "description": "Rest"
          },
          "monday": {
            "type": "easy_run",
            "description": "11.2 km"
          },
          "tuesday": {
            "type": "easy_run",
            "description": "8 km + 10 x 8-sec hill sprint"
          },
          "wednesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 40 minutes or Rest"
          },
          "thursday": {
            "type": "fartlek",
            "description": "9.6 km easy w/ 4-6 x 40 sec @ 5K pace",
            "fartlek_format": "speed_fartlek"
          },
          "friday": {
            "type": "easy_run",
            "description": "9.6 km + drills (3 sets)"
          },
          "saturday": {
            "type": "tune_up_race",
            "description": "1.6 km easy + 3 x 100m strides + 5K time trial + 1.6 km easy",
            "purpose": "mid-cycle 5K time trial"
          }
        }
      },
      {
        "week": 11,
        "training_phase": "base",
        "days": {
          "sunday": {
            "type": "rest",
            "description": "Rest"
          },
          "monday": {
            "type": "easy_run",
            "description": "11.2 km"
          },
          "tuesday": {
            "type": "easy_run",
            "description": "8 km + 10 x 8-sec hill sprint"
          },
          "wednesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 40 minutes or Rest"
          },
          "thursday": {
            "type": "fartlek",
            "description": "9.6 km easy w/ 6-8 x 40 sec @ 5K pace",
            "fartlek_format": "speed_fartlek"
          },
          "friday": {
            "type": "easy_run",
            "description": "6.4 km + drills (3 sets)"
          },
          "saturday": {
            "type": "easy_run",
            "description": "4.8 km"
          }
        }
      },
      {
        "week": 12,
        "training_phase": "base",
        "days": {
          "sunday": {
            "type": "rest",
            "description": "Rest"
          },
          "monday": {
            "type": "easy_run",
            "description": "11.2 km"
          },
          "tuesday": {
            "type": "easy_run",
            "description": "8 km + 10 x 8-sec hill sprint"
          },
          "wednesday": {
            "type": "xtrain_or_rest",
            "description": "X-Train 40 minutes or Rest"
          },
          "thursday": {
            "type": "fartlek",
            "description": "9.6 km easy w/ 6-8 x 45 sec @ 5K pace",
            "fartlek_format": "speed_fartlek"
          },
          "friday": {
            "type": "easy_run",
            "description": "6.4 km + drills (3 sets)"
          },
          "saturday": {
            "type": "easy_run",
            "description": "6.4 km"
          }
        }
      }
    ]
  }
}
```
