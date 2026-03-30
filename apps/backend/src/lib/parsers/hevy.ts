export function parseHevyLog(description: string) {
  if (!description || !description.includes('Logged with Hevy')) return null;

  const lines = description.split('\n');
  let totalLegsVolume = 0;
  let totalUpperVolume = 0;
  let totalCoreVolume = 0;

  // Simple keyword mapping for muscle groups
  const muscleMap = {
    legs: ['calf', 'toe', 'jump', 'squat', 'leg', 'lunges', 'deadlift'],
    upper: ['press', 'row', 'curl', 'bench', 'pull', 'shoulder', 'farmer'],
    core: ['abs', 'plank', 'crunch']
  };

  let currentMuscleGroup: 'legs' | 'upper' | 'core' | null = null;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // 1. Detect Exercise & Map to Muscle Group
    if (line && !line.startsWith('Set') && !line.includes('Logged with')) {
      currentMuscleGroup = null;
      if (muscleMap.legs.some(k => lowerLine.includes(k))) currentMuscleGroup = 'legs';
      else if (muscleMap.upper.some(k => lowerLine.includes(k))) currentMuscleGroup = 'upper';
      else if (muscleMap.core.some(k => lowerLine.includes(k))) currentMuscleGroup = 'core';
    }

    // 2. Parse Sets (e.g., "Set 1: 24 kg x 15")
    const weightMatch = line.match(/Set \d+: (\d+(\.\d+)?) kg x (\d+)/);
    if (weightMatch && currentMuscleGroup) {
      const weight = parseFloat(weightMatch[1]);
      const reps = parseInt(weightMatch[3]);
      const volume = weight * reps;

      if (currentMuscleGroup === 'legs') totalLegsVolume += volume;
      if (currentMuscleGroup === 'upper') totalUpperVolume += volume;
      if (currentMuscleGroup === 'core') totalCoreVolume += volume;
    }
    
    // 3. Parse Duration sets (e.g., "Set 1: 32s")
    const durationMatch = line.match(/Set \d+: (\d+)s/);
    if (durationMatch && currentMuscleGroup) {
      // Treat seconds as weight/volume equivalent (1s = 0.5kg for load)
      const volume = parseInt(durationMatch[1]) * 0.5;
      if (currentMuscleGroup === 'legs') totalLegsVolume += volume;
    }
  }

  return { legs: totalLegsVolume, upper: totalUpperVolume, core: totalCoreVolume };
}
