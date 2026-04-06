
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

export function parseHevyLog(description: string): HevyParseResult | null {
  if (!description || !description.includes('Logged with Hevy')) return null;

  const lines = description.split('\n');
  const exercises: ParsedExercise[] = [];
  let currentExercise: ParsedExercise | null = null;

  const muscleMap: Record<string, string[]> = {
    legs: ['calf', 'toe', 'jump', 'squat', 'leg', 'lunges', 'deadlift', 'glute', 'hamstring', 'quad'],
    upper: ['pull up', 'dip', 'press', 'row', 'curl', 'bench', 'pull', 'shoulder', 'farmer', 'tricep', 'bicep', 'chest', 'back', 'lat', 'handstand', 'pushup'],
    core: ['abs', 'plank', 'crunch', 'core', 'oblique', 'hollow rock', 'twist']
  };

  const getMuscleGroups = (name: string): string[] => {
    const lowerName = name.toLowerCase();
    const groups: string[] = [];
    if (muscleMap.legs.some(k => lowerName.includes(k))) groups.push('legs');
    if (muscleMap.upper.some(k => lowerName.includes(k))) groups.push('upper');
    if (muscleMap.core.some(k => lowerName.includes(k))) groups.push('core');
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
    for (const s of ex.sets) {
      if (s.weight > 0 && s.reps > 0) {
        exerciseVol += s.weight * s.reps;
      } else if (s.reps > 0) {
        // Bodyweight rep equivalent (e.g. 1 rep = 10kg volume)
        exerciseVol += s.reps * 10;
      } else if (s.duration) {
        // Time equivalent (e.g. 1s = 0.5kg volume)
        exerciseVol += s.duration * 0.5;
      }
    }

    if (ex.muscleGroups.includes('legs')) legsVol += exerciseVol;
    if (ex.muscleGroups.includes('upper')) upperVol += exerciseVol;
    if (ex.muscleGroups.includes('core')) coreVol += exerciseVol;
  }

  return {
    exercises,
    volume: { legs: legsVol, upper: upperVol, core: coreVol }
  };
}
