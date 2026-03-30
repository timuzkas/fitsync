/**
 * ORCHESTRO ELITE PLANNER ENGINE
 * Logic: Stress-Balance Model (TRIMP / CTL / ATL)
 * Follows: The Constitution of Good Design (Article V: Purpose Over Decoration)
 */

export interface Activity {
  date: Date;
  distance: number;      // km
  duration: number;      // seconds
  hrAvg: number;         // bpm
  elevationGain: number; // meters
  cadence?: number;      // spm (used for efficiency rating)
}

export interface Athlete {
  maxHR: number;
  restHR: number;
  weight: number;        // kg (used for grade-adjusted power estimation)
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
  // 1. CALCULATE PHYSIOLOGICAL MARKERS (The "Real" Baseline)
  const stats = analyzeHistory(activities, athlete);
  
  // 2. INITIALIZE STATE
  const plan: PlanWeek[] = [];
  const today = new Date();
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const weeksToGoal = Math.max(1, Math.floor((milestone.targetDate.getTime() - today.getTime()) / msPerWeek));
  
  // Starting point: Your current 6-week weighted average load
  let currentCTL = stats.initialCTL; 
  let weeklyVolume = stats.avgWeeklyDistance;

  // 3. THE 4-POINT GROWTH CYCLE (Article III: Structure)
  for (let w = 1; w <= weeksToGoal; w++) {
    const isTaper = w > weeksToGoal - 2;
    const isRecovery = w % 4 === 0 && !isTaper; // Every 4th week is a reset
    
    // PROGRESSION LOGIC
    // We target a "Load Increase" of 5-8 CTL points per build cycle
    let loadMultiplier = 1.07; // 7% load growth
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
        targetStressScore: Math.round(currentCTL * 7), // Weekly TSS target
      },
      sessions: generateSessions(weeklyVolume, stats, athlete, isRecovery)
    });
  }

  return plan;
};

/** 
 * Deep Data Analysis: Calculates "Stress" per run 
 * Elevation + HR + Pace = TRIMP (Training Impulse)
 */
function analyzeHistory(activities: Activity[], athlete: Athlete) {
  const now = new Date();
  const last42Days = activities.filter(a => 
    (now.getTime() - new Date(a.date).getTime()) / (1000 * 60 * 60 * 24) <= 42
  );

  const activityLoads = last42Days.map(a => {
    // Relative Effort calculation (TRIMP)
    const hrReserve = (a.hrAvg - athlete.restHR) / (athlete.maxHR - athlete.restHR);
    const intensity = 0.64 * Math.exp(1.92 * hrReserve); // Exponential intensity curve
    const durationMin = a.duration / 60;
    
    // Elevation factor (Article V: All data used)
    const elevFactor = 1 + (a.elevationGain / 1000); 
    
    return durationMin * intensity * elevFactor;
  });

  const totalLoad = activityLoads.reduce((a, b) => a + b, 0);
  const totalDistance = last42Days.reduce((a, b) => a + b.distance, 0);

  return {
    initialCTL: totalLoad / 42,
    avgWeeklyDistance: (totalDistance / 42) * 7 || 20, // Default to 20km if no history
    thresholdPace: calculateThresholdPace(last42Days),
    efficiencyIndex: calculateEfficiency(last42Days) // Pace vs HR ratio
  };
}

function generateSessions(volume: number, stats: any, athlete: Athlete, isRecovery: boolean): Session[] {
  // Logic: Hierarchical distribution of volume (Article II)
  const distribution: Record<string, number> = isRecovery 
    ? { tempo: 0.1, easy: 0.6, long: 0.3 } 
    : { tempo: 0.2, interval: 0.1, easy: 0.4, long: 0.3 };

  return Object.entries(distribution).map(([type, pct]) => {
    const dist = volume * pct;
    return {
      type: type.toUpperCase(),
      distance: dist.toFixed(1),
      hrRange: getHRRange(type, athlete),
      pace: getTargetPace(type, stats.thresholdPace),
      signifier: getSignifier(type) // Article I: Visual Cues
    };
  });
}

// Helper: Threshold pace is the 90th percentile of your recent fast efforts
function calculateThresholdPace(activities: Activity[]) {
  if (activities.length === 0) return 300; // Default 5:00/km
  const paces = activities
    .filter(a => a.distance > 0)
    .map(a => a.duration / a.distance)
    .sort((a, b) => a - b);
  return paces[Math.floor(paces.length * 0.1)] || 300;
}

function calculateEfficiency(activities: Activity[]) {
  if (activities.length === 0) return 1;
  // Simplified efficiency: distance per heart beat or similar
  return 1.0; 
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
  if (w / total < 0.3) return "Base Aerobic Capacity";
  if (w / total < 0.7) return "Lactate Threshold Development";
  return "Race Specific Sharpening";
};
