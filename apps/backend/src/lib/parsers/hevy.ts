
export interface ParsedSet {
  reps: number;
  weight: number;
  duration?: number;
}

export interface ParsedExercise {
  name: string;
  muscleGroups: string[];
  sets: ParsedSet[];
}

export interface HevyParseResult {
  exercises: ParsedExercise[];
  volume: {
    legs: number;
    upper: number;
    core: number;
  };
}

/**
 * Section 14: Muscular Stress Load (MSL) Calculation.
 */
export function calculateSessionMSL(
  exercises: Array<{ name: string; sets: Array<{ reps: number; weight: number; rpe?: number }> }>,
  durationMin: number
) {
  let sessionMSL = 0;
  let legStress = 0;
  let systemicStress = 0;

  for (const ex of exercises) {
    const coeff = getMuscleCoefficient(ex.name);
    const legCoeff = getLegCoefficient(ex.name);
    const systemicCoeff = getSystemicCoefficient(ex.name);

    for (const set of ex.sets) {
      const weightBonus = 1 + (set.weight / 60);
      const rpeFactor = (set.rpe || 7) / 5.0;

      const volumeFactor = set.reps * weightBonus * rpeFactor;

      sessionMSL += volumeFactor * coeff;
      legStress += volumeFactor * legCoeff;
      systemicStress += set.reps * (set.rpe || 7) * systemicCoeff;
    }
  }

  // Apply duration factor (Section 14.3)
  const durationFactor = Math.min(2.0, durationMin / 45);
  return {
    msl: Math.round(sessionMSL * durationFactor),
    legStress: Math.round(legStress * durationFactor),
    systemicStress: Math.round(systemicStress * durationFactor)
  };
}

function getMuscleCoefficient(name: string): number {
  const lower = name.toLowerCase();
  if (lower.includes('squat') || lower.includes('deadlift') || lower.includes('lunge')) return 2.8;
  if (lower.includes('pushup') || lower.includes('press')) return 1.5;
  if (lower.includes('pull up') || lower.includes('row')) return 1.3;
  if (lower.includes('burpee')) return 2.6;
  return 1.0;
}

function getLegCoefficient(name: string): number {
  const lower = name.toLowerCase();
  if (lower.includes('squat')) return 2.85;
  if (lower.includes('deadlift')) return 2.70;
  if (lower.includes('lunge') || lower.includes('bulgarian')) return 2.45;
  if (lower.includes('leg press')) return 2.30;
  if (lower.includes('step-up')) return 1.90;
  if (lower.includes('burpee')) return 2.10;
  return 0.1; // Minimal leg impact for upper body
}

function getSystemicCoefficient(name: string): number {
  const lower = name.toLowerCase();
  if (lower.includes('deadlift')) return 1.5;
  if (lower.includes('squat')) return 1.2;
  if (lower.includes('burpee')) return 1.4;
  return 0.8;
}

export function parseHevyLog(
description: string): HevyParseResult | null {
  if (!description || !description.includes('Logged with Hevy')) return null;

  const lines = description.split('\n');
  const exercises: ParsedExercise[] = [];
  let currentExercise: ParsedExercise | null = null;

  const muscleMap: Record<string, string[]> = {
    legs: [
      'calf', 'toe', 'jump', 'squat', 'leg', 'lunges', 'deadlift', 'glute', 'hamstring', 'quad',
      'hip', 'thigh', 'front_raise', 'step_up', 'box_jump', 'lunge', 'single_leg', 'hip_thrust',
      'goblet', 'bulgarian', 'hack', 'good_morning', 'rdl', 'romanian', 'calf_raise', 'leg_press',
      'leg_extension', 'leg_curl', 'hip_adductor', 'hip_abductor', 'glute_bridge', 'step_up',
      'pistol', 'shrimp', 'back_squat', 'front_squat', 'pause_squat', 'overhead_squat'
    ],
    upper: [
      'pull up', 'pullup', 'pull-up', 'dip', 'dips', 'press', 'push press', 'overhead press',
      'row', 'rowing', 'curl', 'curls', 'bench', 'pull', 'shoulder', 'farmer', 'tricep', 'triceps',
      'bicep', 'biceps', 'chest', 'back', 'lat', 'handstand', 'pushup', 'push-up', 'push up',
      'pullover', 'fly', 'raise', 'shrug', 'cg', '吊', '拉', '推', '弯举', '划船', '卧推',
      'incline', 'decline', 'flat', 'dumbbell', 'barbell', 'cable', 'machine', 'smith',
      'upright_row', 'face_pull', 'rear_delt', 'lateral_raise', 'front_raise', 'arnold',
      'skull_crusher', 'extension', 'hammer', 'reverse_curl', 'wrist_curl'
    ],
    core: [
      'abs', 'plank', 'crunch', 'core', 'oblique', 'hollow rock', 'hollow', 'twist', 'sit-up',
      'situp', 'sit-up', 'mountain_climber', 'leg_raise', 'flutter_kick', 'bicycle',
      'dead_bug', 'bird_dog', 'russian_twist', 'side_plank', 'deadlift', 'v-up', 'toes_to_bar',
      'ab_wheel', 'pallof_press', 'cable_crunch', 'hanging_leg_raise', 'reverse_crunch',
      'captain', 'tuck', 'pike', 'hollow_hold', 'l-sit', 'dragon_flag', 'burpee', 'pike_pushup'
    ]
  };

  const getMuscleGroups = (name: string): string[] => {
    const lowerName = name.toLowerCase();
    const groups: string[] = [];
    
    // Check each muscle group
    for (const [group, keywords] of Object.entries(muscleMap)) {
      if (keywords.some(k => lowerName.includes(k))) {
        groups.push(group);
      }
    }
    
    // Special cases for compound movements
    if (lowerName.includes('deadlift') || lowerName.includes('rdl') || lowerName.includes('romanian')) {
      if (!groups.includes('legs')) groups.push('legs');
      if (!groups.includes('upper')) groups.push('upper');
      if (!groups.includes('core')) groups.push('core');
    }
    if (lowerName.includes('squat') || lowerName.includes('front_squat') || lowerName.includes('back_squat')) {
      if (!groups.includes('legs')) groups.push('legs');
      if (!groups.includes('core')) groups.push('core');
    }
    if (lowerName.includes('pushup') || lowerName.includes('push-up') || lowerName.includes('dip')) {
      if (!groups.includes('upper')) groups.push('upper');
    }
    if (lowerName.includes('pullup') || lowerName.includes('pull-up') || lowerName.includes('row')) {
      if (!groups.includes('upper')) groups.push('upper');
    }
    if (lowerName.includes('plank') || lowerName.includes('hollow') || lowerName.includes('crunch')) {
      if (!groups.includes('core')) groups.push('core');
    }
    
    return groups.length > 0 ? groups : ['systemic'];
  };

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.includes('Logged with Hevy')) continue;

    // 1. Detect Exercise Name (Lines that don't start with "Set")
    if (!cleanLine.toLowerCase().startsWith('set ')) {
      if (currentExercise) {
        exercises.push(currentExercise);
      }
      currentExercise = {
        name: cleanLine,
        muscleGroups: getMuscleGroups(cleanLine),
        sets: []
      };
      continue;
    }

    // 2. Parse Sets within current exercise
    if (currentExercise) {
      // a) Weight-based: "Set 1: 15 kg x 10"
      const weightMatch = cleanLine.match(/Set \d+: (\d+(\.\d+)?) kg x (\d+)/i);
      if (weightMatch) {
        currentExercise.sets.push({
          weight: parseFloat(weightMatch[1]),
          reps: parseInt(weightMatch[3])
        });
        continue;
      }

      // b) Time-based (min/sec): "Set 1: 3min 15s" or "Set 1: 45s"
      const minSecMatch = cleanLine.match(/Set \d+: (?:(\d+)min\s*)?(\d+)s/i);
      if (minSecMatch) {
        const mins = parseInt(minSecMatch[1] || '0');
        const secs = parseInt(minSecMatch[2]);
        const totalSecs = mins * 60 + secs;
        currentExercise.sets.push({
          weight: 0,
          reps: 0,
          duration: totalSecs
        });
        continue;
      }

      // c) Reps-only: "Set 1: 15 reps" or just "Set 1: 15"
      const repsMatch = cleanLine.match(/Set \d+: (\d+)\s*(reps)?/i);
      if (repsMatch) {
        currentExercise.sets.push({
          weight: 0,
          reps: parseInt(repsMatch[1])
        });
        continue;
      }
    }
  }

  // Push the last exercise
  if (currentExercise) {
    exercises.push(currentExercise);
  }

  // Calculate Volumes for Load Engine
  let legsVol = 0;
  let upperVol = 0;
  let coreVol = 0;

  for (const ex of exercises) {
    let exerciseVol = 0;
    let hasWeight = false;
    let hasReps = false;
    let hasDuration = false;
    
    for (const s of ex.sets) {
      if (s.weight > 0 && s.reps > 0) {
        exerciseVol += s.weight * s.reps;
        hasWeight = true;
        hasReps = true;
      } else if (s.reps > 0) {
        // Bodyweight rep equivalent - more realistic multiplier
        exerciseVol += s.reps * 4; // 4kg avg bodyweight equivalent per rep
        hasReps = true;
      } else if (s.duration) {
        // Time equivalent (e.g. 1s = 1kg volume for isometric/core work)
        exerciseVol += s.duration * 1;
        hasDuration = true;
      }
    }

    const mgs = ex.muscleGroups;
    
    // Core exercises need systemic too
    if (mgs.includes('core')) {
      coreVol += exerciseVol;
      if (hasReps || hasDuration) coreVol += exerciseVol * 0.3; // Add systemic for core
    }
    if (mgs.includes('upper')) {
      upperVol += exerciseVol;
      if (hasReps || hasDuration) upperVol += exerciseVol * 0.2; // Systemic component
    }
    if (mgs.includes('legs')) {
      legsVol += exerciseVol;
    }
    
    // If no muscle group detected, treat as systemic
    if (mgs.length === 0 || mgs.includes('systemic')) {
      legsVol += exerciseVol * 0.5;
      upperVol += exerciseVol * 0.3;
      coreVol += exerciseVol * 0.2;
    }
  }

  return {
    exercises,
    volume: { legs: legsVol, upper: upperVol, core: coreVol }
  };
}
