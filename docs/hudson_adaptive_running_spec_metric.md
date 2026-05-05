# Hudson Adaptive Running — Implementation Spec (Metric)

**Source:** *Run Faster from the 5K to the Marathon — How to Be Your Own Best Coach* by Brad Hudson & Matt Fitzgerald (Broadway Books, 2008)

**Note on units:** The book is written in miles and miles/week. This spec converts everything to kilometres and km/week. Conversions use 1 mi = 1.609 km, rounded to runner-friendly values (whole or half kilometres, multiples of 5 for weekly mileage). Where the book gives a pace offset like "+ 20 sec/mile", this is converted to "+ ~12 sec/km" (offset_per_km ≈ offset_per_mile ÷ 1.609).

**Architecture rule for the app:**
> Hudson's "Adaptive Running" methodology drives everything — runner profiling, level assignment, plan selection, plan structure, and workout types. **Daniels' VDOT formula is used ONLY as the pace calculator** that converts a recent race result into the concrete paces that Hudson workouts reference (easy, marathon, half-marathon, 10K, 5K, 3K, 1500m, hill-sprint effort).

The mental model is: *Hudson tells you WHAT to do and on WHICH DAY. Daniels tells you HOW FAST to run it.*

---

## 1. Where VDOT plugs in (and where it must NOT)

Hudson workouts are written in **race-pace tokens**, never in physiological zones:
- "Easy run" — comfortable conversational pace
- "Progression run, last 20 min. moderate" / "last 20 min. hard"
- "5 × 1 km @ 5K pace w/400 m jog recoveries"
- "4 × 2 km @ 10K pace w/400 m jog"
- "2 × 15 min. @ half-marathon pace w/3-min. active recovery"
- "20 min. @ marathon pace + 20 min. @ marathon pace + 12 sec/km"
- "8 × 40 sec. @ 10K–3K pace"
- "Strides @ 1500 m pace"
- "Hill sprints — 8 sec. maximal effort up steep hill"

**VDOT's job in the app:** given the user's most recent race result (or self-test), output the numeric pace (in min/km) for every token above. Persist these as the runner's pace table and re-derive each time the user logs a new race or spec test. **Do not use Daniels for plan structure, plan length, weekly volume, periodization, or workout selection** — every one of those comes from Hudson.

Required pace tokens the calculator must emit (all in min/km):

| Hudson token | Daniels equivalent |
|---|---|
| Easy | E pace |
| Marathon pace (M) | M pace |
| Half-marathon pace | between M and T (Hudson's "second threshold") |
| Threshold / 10K pace | T pace, slightly slower than I |
| 5K pace | I pace (or close) |
| 3K pace | between I and R |
| 1500 m pace | R pace |
| Hill sprints | not a pace — maximal effort, time-based |

Keep a small offset table for "easy" splits Hudson uses inside on/off intervals. The book's mile offsets convert as follows:

| Book offset (per mile) | Metric offset (per km, rounded) |
|---|---|
| + 5 sec/mi | + 3 sec/km |
| + 10 sec/mi | + 6 sec/km |
| + 15 sec/mi | + 9 sec/km |
| + 20 sec/mi | + 12 sec/km |
| + 30 sec/mi | + 19 sec/km |
| + 45 sec/mi | + 28 sec/km |
| + 60 sec/mi (1 min) | + 37 sec/km |
| − 5 sec/mi | − 3 sec/km |
| − 10 sec/mi | − 6 sec/km |

Store these offsets with the workout, not with the pace table.

---

## 2. The 12 adaptive running methods (training principles the engine must respect)

These are the design constraints any auto-generated or auto-modified plan must obey. From chapter 2.

1. **Consistent, moderately high running volume** — split the difference between high-volume and high-intensity systems; don't let weekly mileage swing wildly.
2. **Nonlinear periodization** — every fitness type (aerobic, neuromuscular, specific-endurance) is present in *every* week; emphasis shifts; nothing phased out except in sharpening when race-pace work dominates.
3. **Progression from general to specific training** — workouts move from generic aerobic/neuromuscular toward goal-race-pace-specific work as weeks advance.
4. **Three-period training cycles** — every plan has Introductory → Fundamental → Sharpening (§5).
5. **Lots of hill running** — short maximal hill sprints (8/10/12 sec) on Mondays after an easy run; longer hill repetitions and uphill progressions in fundamental period.
6. **Extreme intensity and workload modulation** — easy days are truly easy, hard days are truly hard, with deliberately moderate days in between (progression runs).
7. **Multi-pace workouts** — single workouts often combine two or more paces (e.g., threshold + speed intervals; long run with marathon-pace finish).
8. **Nonweekly workout cycles** — don't rigidly repeat the same workout types every 7 days; some workouts cycle every 10–14 days.
9. **Multiple threshold paces** — three distinct "thresholds" used: ~marathon pace, half-marathon pace, ~10K pace.
10. **Constant variation** — the same workout is rarely repeated identically; volume, pace, or terrain shifts each time.
11. **One rest day per week** — typical scheduling, though X-Train days can substitute.
12. **Selective cross-training** — non-impact aerobic work (bike, elliptical, pool) mainly for masters runners, low-volume runners, and injury management.

---

## 3. Runner profiling — the 10 self-assessment factors

From chapter 6, in order of weighting (factor 1 has the largest impact on plan design, factor 10 the smallest). The profiling wizard must collect all 10 before producing a plan.

| # | Factor | What to capture in the app |
|---|---|---|
| 1 | **Recent training** | Avg weekly km over last 4–8 weeks; longest recent run; days/week running |
| 2 | **Running experience** | Years of consistent training; events done before |
| 3 | **Age** | Numeric age — branches into youth (<20), adult (20–39), masters (40+) |
| 4 | **Past race performances** | Best recent race(s) per distance + date — feeds VDOT |
| 5 | **Short-term goal** | Peak race distance + goal time + race date |
| 6 | **Injury history** | Recent injuries, recurring problem areas, current niggles |
| 7 | **Event-specific strength/weakness** | Speed-biased vs endurance-biased (compared to own results across distances) |
| 8 | **Recovery profile** | Self-reported: needs rest day after hard workout, tolerates back-to-back hard, etc. |
| 9 | **Long-term goal** | 1+ year aspiration (e.g., sub-3 marathon); influences which long-runs/threshold work to add today |
| 10 | **Motivational profile** | Tendency to overdo workouts vs. undertraining; needs frequent tune-up races vs. doesn't |

The first three (recent training, experience, age) are enough to assign a runner level. The rest are used to *modify* the chosen plan.

---

## 4. Runner categories (Hudson's 5-tier classification)

From table 3.1 plus chapter 6 self-assessment guidelines.

| Category | Definition | Maps to plan level |
|---|---|---|
| **Beginner** | < 1 year of consistent running | Level 1 |
| **Low-Key Competitive** | Cares about race times but unable/unwilling to invest much time | Level 1 (or low Level 2) |
| **Competitive** | ≥ 2 years of hard training, determined to improve, capped at 6–7 runs/week | Level 2 |
| **Highly Competitive** | Wishes to train like an elite but can't quite | Level 3 |
| **Elite** | "They know who they are" | Level 3+ (out of scope for most apps) |

### Optimal weekly running volume by category and distance — km/week (Table 3.1, converted)

| | Beginner | Low-Key | Competitive | Highly Comp. | Elite |
|---|---|---|---|---|---|
| 5K | 32–48 | 40–56 | 64–80 | 80–96 | 145–177 |
| 10K | 40–56 | 48–64 | 72–88 | 96–113 | 153–185 |
| Half-Marathon | 56–64 | 56–72 | 80–96 | 113–129 | 161–193 |
| Marathon | 64–80 | 80–96 | 96–113 | 129–145 | 177–209 |

Or in cleaner runner-friendly bands (rounded to multiples of 5):

| | Beginner | Low-Key | Competitive | Highly Comp. | Elite |
|---|---|---|---|---|---|
| 5K | 30–50 | 40–55 | 65–80 | 80–95 | 145–175 |
| 10K | 40–55 | 50–65 | 70–90 | 95–115 | 150–185 |
| Half-Marathon | 55–65 | 55–70 | 80–95 | 110–130 | 160–195 |
| Marathon | 65–80 | 80–95 | 95–115 | 130–145 | 175–210 |

**Rules around this table:**
- Above ~110 km/week, the runner must double (run 2× on at least one day).
- Never raise peak weekly volume by more than **+50%** vs. the runner's last completed cycle.
- During the introductory period, ramp by **10% per week** (max), never exceeding 6 weeks of buildup.
- If the user can't reach their target volume within 6 weeks, the target is too high.

---

## 5. The three-period training cycle (the engine's core state machine)

Every plan is a sequence of weeks split into three named periods.

| Period | Purpose | Typical contents |
|---|---|---|
| **Introductory** | Build aerobic + neuromuscular base; ramp volume | Easy runs, long runs (just easy), hill sprints, progression runs (moderate finish), strides, fartlek runs at 3K–1500 m pace |
| **Fundamental** | Add race-specificity progressively | Threshold runs, hill repetitions, longer fartleks at 5K–3K pace, marathon-pace inserts in long runs, early specific-endurance intervals |
| **Sharpening** | Peak race-specific fitness, then taper | Specific-endurance intervals at goal pace, race-pace threshold runs, recovery week + 1–2 week taper |

### Period-length defaults (chapter 7 — used by the chapter-12 plans)

| Peak race | Total | Introductory | Fundamental | Sharpening |
|---|---|---|---|---|
| 5K | 12 weeks | 3 | 6 | 3 |
| 10K | 14 weeks | 4 | 6 | 4 |
| Half-Marathon | 16 weeks | 6 | 6 | 4 |
| Marathon | 20 weeks | 6 | 10 | 4 |

### Optimal training-plan duration ranges

| Peak race | Range |
|---|---|
| 5K | 12–16 weeks |
| 10K | 14–18 weeks |
| Half-Marathon | 16–20 weeks |
| Marathon | 18–24 weeks |

### Universal sharpening-period rule
The sharpening period is **always 4 weeks**: 2–3 weeks of peak-level race-specific work, then 1–2 weeks of taper. Never longer.

### Recovery-week rule
Insert a recovery week (reduced volume, fewer hard days) **every 3–4 weeks** through fundamental and sharpening. Reduce by ~20–30% volume and drop one hard workout.

---

## 6. Weekly templates (Step 3 of plan construction)

Hudson gives explicit weekly skeletons keyed off run-frequency. The engine should pick the skeleton matching the runner's target volume, then fill each slot per the period.

### Standard weekly distribution
- **Sunday:** long run (always — even if "long" is only 6–8 km)
- **Monday:** easy run + hill sprints
- **Tuesday:** hard workout #1 (threshold or specific-endurance intervals)
- **Friday:** hard workout #2 (the other of threshold / specific-endurance)
- Other days: easy, moderate, X-Train, or rest depending on volume and the runner's recovery profile

### Templates per frequency (from chapter 7, volumes converted)

**5 runs/week (~30–80 km/week):**
| Sun | Mon | Tue | Wed | Thu | Fri | Sat |
|---|---|---|---|---|---|---|
| Long | Easy + Hills | Hard | Easy/Mod | Off / X-Train | Hard | Off / X-Train |

**6 runs/week (~50–100 km/week):**
| Sun | Mon | Tue | Wed | Thu | Fri | Sat |
|---|---|---|---|---|---|---|
| Long | Easy + Hills | Hard | Moderate | Easy | Hard | Off / X-Train |

**7 runs/week (~70–115 km/week):**
| Sun | Mon | Tue | Wed | Thu | Fri | Sat |
|---|---|---|---|---|---|---|
| Long | Easy + Hills | Hard | Moderate | Easy | Hard | Easy |

**10 runs/week (~95–160 km/week):** — adds AM/PM doubles on Mon/Wed/Sat
**12 runs/week (~130–195 km/week):** — doubles on most days

Most app users will land in 5–7 runs/week.

---

## 7. The ready-made training plans (chapter 12)

The book ships **12 plans**: 4 distances × 3 levels.

| Distance | Duration | Level 1 (low vol) | Level 2 (moderate) | Level 3 (high vol) |
|---|---|---|---|---|
| 5K | 12 weeks | beginner / low-mileage | competitive | highly competitive |
| 10K | 14 weeks | beginner / low-mileage | competitive | highly competitive |
| Half-Marathon | 16 weeks | beginner / low-mileage | competitive | highly competitive |
| Marathon | 20 weeks | beginner / low-mileage | competitive | highly competitive |

**Level definitions (from chapter 12 directly):**
- **Level 1** — low training volume, for beginners or anyone who needs/prefers low mileage.
- **Level 2** — moderate volume, for more experienced and competitive runners.
- **Level 3** — high mileage, for highly competitive runners.

### Plan-level → weekly volume bands (km/week, converted from §4)

| | Level 1 peak | Level 2 peak | Level 3 peak |
|---|---|---|---|
| 5K | ~40 km/wk | ~65–80 km/wk | ~80–95 km/wk |
| 10K | ~50 km/wk | ~70–90 km/wk | ~95–115 km/wk |
| Half-Marathon | ~55 km/wk | ~80–95 km/wk | ~115–130 km/wk |
| Marathon | ~65 km/wk | ~95–115 km/wk | ~130–145 km/wk |

### Concrete example — 5K Level 1 plan (full 12 weeks, transcribed and converted)

The format teaches the engine the workout vocabulary. *All paces are tokens; the VDOT layer fills in actual min:sec/km.*

| Wk | Sun | Mon | Tue | Wed | Thu | Fri | Sat |
|---|---|---|---|---|---|---|---|
| 1 | Long Run 6 km easy | Easy 5 km + 1×8-sec hill sprint | X-Train or Rest | Easy 5 km | X-Train or Rest | Rest | Easy 3 km + 1×8-sec hill sprint |
| 2 | Long 8 km easy | Easy 5 km + 2×8-sec hills | X-Train/Rest | Easy 6 km | X-Train/Rest | Rest | Easy 5 km + 2×8-sec hills |
| 3 | Long 10 km easy | Easy 5 km + 3×8-sec hills | X-Train/Rest | Easy 6 km | X-Train/Rest | Rest | Easy 5 km + 3×8-sec hills |
| 4 | Progression 10 km, last 10 min moderate | X-Train/Rest | Fartlek 6 km easy w/ 8×20 sec @ 3K–1500 m pace | Easy 6 km | X-Train/Rest | Rest | Easy 5 km + 5×8-sec hills |
| 5 | Progression 10 km, last 15 min mod | X-Train/Rest | Fartlek 6 km easy w/ 8×30 sec @ 3K–1500 m | X-Train/Rest | Easy 6 km + 6×8-sec hills | Rest | Easy 6 km |
| 6 | Progression 10 km, last 20 min mod | X-Train/Rest | Fartlek 8 km easy w/ 8×40 sec @ 5K–3K | X-Train/Rest | Easy 6 km | Rest | Easy 6 km + 7×8-sec hills |
| 7 | Progression 10 km, last 30 min mod | X-Train/Rest | Hill Reps: 1.5 km easy + 6×300 m uphill @ 3K effort + 1.5 km easy | X-Train/Rest | Easy 6 km | Rest | Easy 5 km + 8×8-sec hills |
| 8 | Progression 10 km, last 15 min hard | X-Train/Rest | Spec-End: 1.5 km easy + 12×400 m @ 5K–3K pace w/200 m jog + 1.5 km easy | X-Train/Rest | Easy 6 km | Rest | Easy 5 km + 9×8-sec hills |
| 9 | Progression 10 km, last 20 min hard | Rest | Hill Reps: 1.5 km easy + 8×300 m uphill @ 3K + 1.5 km easy | X-Train/Rest | Easy 8 km + 10×8-sec hills | X-Train/Rest | **5K race or time trial** (1.5 km easy WU/CD) |
| 10 (recovery) | Long 10 km easy | Easy 6 km + 6×10-sec hills | Spec-End: 1.5 km easy + 6×800 m @ 5K pace w/2-min recoveries + 1.5 km easy | Rest | Easy 10 km + 8×8-sec hills | X-Train/Rest | Easy 8 km |
| 11 | Progression 10 km, last 20 min hard | Rest | Spec-End: 1.5 km easy + 5×1 km @ 5K pace w/400 m jog + 1.5 km easy | Rest | Easy 8 km + 8×8-sec hills | X-Train/Rest | Easy 6 km |
| 12 (taper) | Progression 10 km, last 20 min hard | Rest | Spec-End: 1.5 km + 1 km @ 5K–3K + 5 min easy + 8×400 m @ 5K w/1-min recoveries + 1.5 km | Rest | Easy 5 km | Easy 3 km + 3×100 m strides | **5K RACE** |

Things to notice in this plan that the engine needs to encode:
- Hill-sprint count progresses linearly across the introductory period.
- Fartlek distance/duration scales week to week.
- Hill repetitions (longer reps) replace fartleks once into the fundamental period.
- Specific-endurance intervals appear only in the last ~5 weeks.
- A tune-up 5K race appears in week 9 (sharpening-period diagnostic).
- Week 10 is a recovery week (lower-stress key workout, more easy running).
- Final week is taper: cuts volume, keeps a short race-pace stimulus, ends in race.

The other 11 plans follow the same DNA — same workout vocabulary, scaled volumes and longer durations.

---

## 8. The 8-step plan-construction algorithm (chapter 7)

The procedure the app should implement when generating a custom plan.

```
Step 1. Choose peak race + race goal time   -> input from user / VDOT-suggested
Step 2. Pick start date + plan duration     -> from §5 ranges + race date
Step 3. Decide peak weekly volume + run frequency + weekly skeleton
                                            -> from §4 table + §6 templates
Step 4. Divide plan into Intro/Fund/Sharp   -> from §5 defaults
Step 5. Plan the peak week
        (the hardest race-specific week, immediately before the taper)
Step 6. Schedule tune-up races + recovery weeks
        (recovery week every 3-4 weeks; tune-up races for 5K/10K runners
         every ~5-6 weeks)
Step 7. Schedule progressions for interval workouts, threshold workouts,
        and long runs working backward from the peak week
Step 8. Fill in remaining easy/moderate days using the chosen weekly skeleton
```

### Peak training week — required structure (Step 5)
Three race-specific key workouts plus the standard Mon hill sprints:
- **Sunday:** race-specific aerobic-support workout (long threshold or fast long run)
- **Monday:** easy + hill sprints
- **Tuesday:** specific-endurance intervals OR race-pace threshold
- **Friday:** the other of those two
- Rest of week: easy/moderate fillers per skeleton

### Step 7 – progression principle
Plan the peak workouts first, then walk *backward*: each previous occurrence of the same workout type is shorter / easier / slower-paced than the next. This produces gradually increasing race-specificity without manual week-by-week design.

### Step 6 detail — tune-up races and spec tests
Hudson uses **specific-endurance tests** (spec tests) every 5–6 weeks during fundamental and sharpening periods to gauge progress.

| Distance | Spec test |
|---|---|
| 5K | 5×1 km @ 5K pace w/2-min jog recoveries (or actual 5K tune-up race) |
| 10K | 4×2 km @ 10K pace + 1 km maximal w/3-min recoveries (or 10K tune-up) |
| Half-Marathon | 20–30 min @ HM heart rate, OR ~6.5 km at HM perceived effort |
| Marathon | (no reliable spec test — track marathon-pace workout performance instead) |

When spec test results disappoint, the engine should flag the user and prompt to swap in extra fundamental work before resuming sharpening progression.

---

## 9. Workout-type taxonomy (vocabulary for the workout engine)

These are the building blocks every plan is composed from. Each must be a typed entity in the app's domain model.

### Aerobic-support workouts
- **Easy run** — natural, comfortable pace, conversational.
- **Long run** — Sunday default; even short Sundays are tagged "long" because Sunday is the endurance slot.
- **Progression run** — easy start, last segment moderate or hard. Common variants: "last 10/15/20/30 min moderate" or "last 20 min hard". Uphill progressions preferred when terrain allows.
- **Threshold run** — moderately extended hard running at marathon pace, half-marathon pace, or 10K pace. Multiple thresholds may appear in the same workout.

### Muscle-training workouts
- **Hill sprints (short)** — 8/10/12-second maximal-intensity sprints up steepest available hill, walk-down recovery. Always immediately after an easy run. Count progresses across cycle (book starts at 1, goes to 10+).
- **Hill repetitions (long)** — 200 m–1 km uphill repeats at race-pace effort, jog-back recoveries.
- **Uphill progressions** — the moderate/hard finish of a progression run done on an extended incline (10+ min).
- **Strides** — short ~100 m bursts at 1500 m pace after an easy run, jog back to recover.
- **Fartlek runs** — easy run with embedded short hard segments at 5K–1500 m pace (e.g., 8×30 sec @ 3K–1500 m).

### Specific-endurance workouts
- **Specific-endurance intervals** — the signature peak-period workout. Pattern: [warm-up easy] + [N × distance @ race pace w/ jog recovery] + [cool-down easy]. Examples by distance:
  - 5K peak: 5×1 km @ 5K pace w/1-min jog
  - 10K peak: 4×2 km @ 10K + 1 km @ 5K-3K pace
  - HM peak: 2×15 min @ HM pace w/3-min active recovery
  - Marathon peak: 20 min @ M pace + 20 min @ M + 12 sec/km (or "on/off" cuts, e.g. 10×1 km on/1 km off)

### Cross-training and rest
- **X-Train** — non-impact aerobic (bike/elliptical/pool) at easy-run intensity.
- **Core / Strength** — 5–6 exercises for hips, glutes, abs, lower back, upper torso.
- **Rest** — full off day.

---

## 10. Domain model — minimal sketch for the app

Names are illustrative; adapt to your stack.

```
RunnerProfile {
  id, age, sex,
  recentTraining: { avgWeeklyKm, longestRecentRunKm, daysPerWeek, weeksConsistent },
  experienceYears,
  bestRaces: [ { distance, time, date } ],     // feeds VDOT
  shortTermGoal: { distance, goalTime, raceDate },
  longTermGoal: optional { distance, goalTime, targetYear },
  injuryHistory: [ { area, severity, recurrent: bool } ],
  strengthBias: enum { speedBiased, enduranceBiased, balanced },
  recoveryProfile: enum { needsFullRest, easyDayHelps, fastAdapter },
  motivationProfile: enum { tendsToOverdo, tendsToUnderdo, needsTuneUpRaces },
}

RunnerLevel = derive(profile)                  // beginner | lowKey | competitive | highlyComp | elite
PaceTable = vdotCalculate(profile.bestRaces)
            // -> { easy, M, HM, T, 5K, 3K, R, hillEffort }   all in sec/km

PlanTemplate {
  id, distance, level, totalWeeks,
  introWeeks, fundWeeks, sharpWeeks,
  weeks: [ Week ]                              // 12 ready-made templates from chapter 12
}

Week {
  index, period: enum { intro, fund, sharp },
  isRecoveryWeek: bool,
  isTaperWeek: bool,
  days: [ Day ]
}

Day {
  dayOfWeek,                                    // Sun..Sat
  workout: Workout | RestDay | XTrainDay
}

Workout {
  type: enum { easy, long, progression, threshold,
              hillSprint, hillReps, uphillProg, strides, fartlek,
              specEndIntervals, race, timeTrial },
  segments: [ Segment ]                         // multi-pace workouts have multiple segments
  notes
}

Segment {
  description,                                  // "1.5 km easy", "5×1 km @ 5K pace w/400 m jog"
  distanceMeters | durationSeconds,
  paceToken: enum { easy, M, HM, T, 5K, 3K, R, hillMax },
  paceOffsetSecPerKm: optional int,             // e.g. +12 for "M pace + 12 sec/km"
  reps: optional int,
  recoveryDistanceMeters | recoveryDurationSeconds | recoveryPaceToken
}
```

`paceToken` + `vdotPaceTable[paceToken]` (sec/km) + `paceOffsetSecPerKm` produces the rendered pace shown to the user. That single indirection is the entire seam between Hudson's plan and Daniels' calculator.

---

## 11. Adaptive-execution loop (chapter 8 — runtime behavior)

Plans are **planned in pencil**. Hudson explicitly says ~90% of next-workout decisions should be driven by how the runner felt after today's, only ~10% by the original plan. The app needs a daily check-in mechanism:

After each workout, ask the user:
- How did this workout feel? (way too easy / right / hard / brutal)
- Any new niggles / pain? (free-text + body-area picker)
- Sleep, soreness, motivation rating

Use the response to:
- Auto-suggest an easier substitute when fatigue is high (e.g., turn tomorrow's threshold into an easy run + strides).
- Flag the user when 2 consecutive hard workouts feel "brutal" — recommend pulling a recovery week forward.
- Recommend re-running the spec test (§8) if multiple key workouts feel disproportionately hard.
- Auto-promote the runner's volume target by ~10% for the next cycle if all workouts ran well.

This is what makes the system "adaptive" — the static plan is a starting point, never a contract.

---

## 12. Year-over-year improvement (chapter 9)

For an app retaining users across multiple cycles, persist:
- Cycle outcome: peak-race result vs goal
- Subjective rating of volume tolerance (could've handled more / about right / too much)
- Injury occurrences during cycle
- Spec-test progressions

Use these to bias the next cycle:
- **Race goal achieved + volume felt fine** → next cycle: +10–15% peak volume, possibly bump a level.
- **Race goal missed + volume felt too much** → next cycle: same level, hold volume, more recovery weeks.
- **Race goal missed + volume felt fine** → next cycle: rebalance toward weakness identified by spec tests (more threshold work, or more speed, or more long runs).
- **Injury during cycle** → next cycle: more X-Train days, slower volume ramp, more strength/core work.

---

## 13. Special populations (chapter 11)

The book provides separate plan archetypes for two cohorts. The app should branch on `age`:

### Youth runners (under 20)
- Almost all running at easy pace (mileage building over intensity).
- Hill sprints + core/cross-sport strength work for neuromuscular development.
- 4 plans in book, 12 weeks each — peak weekly volumes ~42 / ~63 / ~87 / ~113 km (Freshman/Sophomore/Junior/Senior).
- These are summer base-training plans, not race-specific peak plans.

### Masters runners (40+)
- **Cross-training-based:** only 3 running workouts/week, supplemented by non-impact cardio + strength + mobility.
- Most or all runs are quality (harder workouts) — no junk km.
- 2 plans in book: 16-week 10K and 20-week marathon.
- The engine should bias toward this template once `age >= 40`, especially for `age >= 50`.

---

## 14. Hard rules (must-not-violate constraints for the planner)

1. Never increase peak weekly volume by more than +50% vs. previous cycle.
2. Never exceed ~110 km/week without doubling.
3. Introductory period never longer than 6 weeks.
4. Sharpening period always 4 weeks (incl. taper).
5. At least one rest day per week unless runner is at elite-level frequency.
6. Hill sprints never on legs already fatigued from a hard workout the day before.
7. Two hard workouts never on consecutive days for non-elite runners (Tuesday/Friday spacing is the canonical pattern).
8. Recovery week every 3–4 weeks of building.
9. No specific-endurance intervals in the introductory period.
10. No marathon-pace work crammed against the race for marathon runners (sharpening narrows from HM-pace toward M-pace; peak workouts are 4–6 weeks out).

---

## 15. Suggested implementation order

1. **Profiling wizard** (10 factors) → **Runner level** classification.
2. **VDOT calculator** → produce `PaceTable` (sec/km) from race result.
3. **Plan picker** — choose ready-made plan from chapter 12 by (distance × level), apply pace tokens, produce concrete week-by-week schedule.
4. **Daily workout renderer** — turn `Workout` + `PaceTable` into clear "do this today" UI.
5. **Adaptive feedback loop** — post-workout check-ins, plan modifications.
6. **Custom plan generator** — implement the 8-step algorithm for users who want a non-canned plan.
7. **Year-over-year layer** — multi-cycle progression and bias adjustment.
8. **Youth + masters branches** — special-case planners.

Ship in roughly this order. Steps 1–4 give a complete usable v1; the rest are progressive enhancements.
