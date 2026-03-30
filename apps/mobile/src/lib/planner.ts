/**
 * ORCHESTRO ELITE PLANNER ENGINE
 * Logic: Stress-Balance Model (TRIMP / CTL / ATL)
 */

export interface Activity {
  date: Date | string;
  distance: number;      // km
  duration: number;      // seconds
  hrAvg: number;         // bpm
  elevationGain: number; // meters
  cadence?: number;
}

export interface Athlete {
  maxHR: number;
  restHR: number;
  weight: number;
}

export interface Milestone {
  targetDistance: number;
  targetDate: Date;
}

export interface Session {
  type: string;
  distance: string;
  hrRange: { min: number; max: number };
  pace: number;
  signifier: string;
}

export interface PlanWeek {
  week: number;
  type: 'Build' | 'Recovery' | 'Taper';
  focus: string;
  metrics: {
    distance: string;
    targetStressScore: number;
  };
  sessions: Session[];
}

export const generateElitePlan = (activities: Activity[], athlete: Athlete, milestone: Milestone): PlanWeek[] => {
  const stats = analyzeHistory(activities, athlete);
  const plan: PlanWeek[] = [];
  const today = new Date();
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const weeksToGoal = Math.max(1, Math.ceil((milestone.targetDate.getTime() - today.getTime()) / msPerWeek));
  
  let currentCTL = stats.initialCTL; 
  let weeklyVolume = stats.avgWeeklyDistance;

  for (let w = 1; w <= weeksToGoal; w++) {
    const isTaper = w > weeksToGoal - 2;
    const isRecovery = w % 4 === 0 && !isTaper;
    
    let loadMultiplier = 1.07;
    if (isRecovery) loadMultiplier = 0.70;
    if (isTaper) loadMultiplier = 0.60;

    weeklyVolume *= loadMultiplier;
    currentCTL *= loadMultiplier;

    plan.push({
      week: w,
      type: isTaper ? 'Taper' : isRecovery ? 'Recovery' : 'Build',
      focus: determineFocus(w, weeksToGoal),
      metrics: {
        distance: weeklyVolume.toFixed(1),
        targetStressScore: Math.round(currentCTL * 7),
      },
      sessions: generateSessions(weeklyVolume, stats, athlete, isRecovery)
    });
  }

  return plan;
};

function analyzeHistory(activities: Activity[], athlete: Athlete) {
  const now = new Date();
  const last42Days = activities.filter(a => {
    const activityDate = typeof a.date === 'string' ? new Date(a.date) : a.date;
    return (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24) <= 42;
  });

  const activityLoads = last42Days.map(a => {
    const hrReserve = (a.hrAvg - athlete.restHR) / (athlete.maxHR - athlete.restHR || 1);
    const intensity = 0.64 * Math.exp(1.92 * (hrReserve || 0));
    const durationMin = a.duration / 60;
    const elevFactor = 1 + (a.elevationGain / 1000); 
    return durationMin * intensity * elevFactor;
  });

  const totalLoad = activityLoads.reduce((a, b) => a + b, 0);
  const totalDistance = last42Days.reduce((a, b) => a + b.distance, 0);

  return {
    initialCTL: totalLoad / 42 || 0,
    avgWeeklyDistance: (totalDistance / 42) * 7 || 20,
    thresholdPace: calculateThresholdPace(last42Days),
    efficiencyIndex: 1.0
  };
}

function generateSessions(volume: number, stats: any, athlete: Athlete, isRecovery: boolean): Session[] {
  const distribution: Record<string, number> = isRecovery 
    ? { easy: 0.7, long: 0.3 } 
    : { tempo: 0.2, interval: 0.1, easy: 0.4, long: 0.3 };

  return Object.entries(distribution).map(([type, pct]) => {
    const dist = volume * pct;
    return {
      type: type.toUpperCase(),
      distance: dist.toFixed(1),
      hrRange: getHRRange(type, athlete),
      pace: getTargetPace(type, stats.thresholdPace),
      signifier: getSignifier(type)
    };
  });
}

function calculateThresholdPace(activities: Activity[]) {
  if (activities.length === 0) return 300;
  const paces = activities
    .filter(a => a.distance > 0)
    .map(a => a.duration / a.distance)
    .sort((a, b) => a - b);
  return paces[Math.floor(paces.length * 0.1)] || 300;
}

const getHRRange = (type: string, athlete: Athlete) => {
  const max = athlete.maxHR;
  if (type === 'tempo') return { min: Math.round(max * 0.85), max: Math.round(max * 0.90) };
  if (type === 'interval') return { min: Math.round(max * 0.90), max: Math.round(max * 0.95) };
  return { min: Math.round(max * 0.65), max: Math.round(max * 0.75) };
};

const getTargetPace = (type: string, threshold: number) => {
  if (type === 'tempo') return threshold;
  if (type === 'interval') return threshold * 0.9;
  return threshold * 1.2;
};

const getSignifier = (type: string) => {
  if (type === 'interval') return '⚡️ High Intensity';
  if (type === 'long') return '🏔 Endurance';
  return '🍃 Recovery';
};

const determineFocus = (w: number, total: number) => {
  const progress = w / total;
  if (progress < 0.3) return "Base Aerobic Capacity";
  if (progress < 0.7) return "Lactate Threshold Development";
  return "Race Specific Sharpening";
};
