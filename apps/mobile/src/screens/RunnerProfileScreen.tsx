import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../tokens';
import { useDeviceStore } from '../store/useDeviceStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type GoalRace = '5K' | '10K' | 'Half Marathon' | 'Marathon';
type RunningYears = '<2' | '2-4' | '5-8' | '9+';
type WeeklyKm = '<40' | '40-60' | '60-80' | '80-110' | '110+';
type AgeGroup = 'Under 25' | '25-39' | '40+';
type InjuryFrequency = 'Rarely' | 'Occasionally' | 'Frequently';
type LimiterType = 'Speed' | 'Endurance';
type WeeklyDays = '3-4' | '5-6' | '7+';

interface Answers {
  q1?: GoalRace;
  q2?: RunningYears;
  q3?: WeeklyKm;
  q4?: AgeGroup;
  q5?: InjuryFrequency;
  q6?: LimiterType;
  q7?: WeeklyDays;
}

type RunnerLevel = 'beginner' | 'lowKey' | 'competitive' | 'highlyCompetitive' | 'elite';
type AgeCategory = 'youth' | 'masters' | 'adult';
type AgeLevelMode = 'age' | 'standard';
type YouthLevel = 'freshman' | 'sophomore' | 'junior' | 'senior';

interface ScoringResult {
  level: RunnerLevel;
  score: number;
  limiterType: 'speed' | 'endurance';
  riskProfile: 'conservative' | 'balanced' | 'aggressive';
  ageCategory: AgeCategory;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

const LEVEL_ORDER: RunnerLevel[] = ['beginner', 'lowKey', 'competitive', 'highlyCompetitive', 'elite'];

function clampLevel(level: RunnerLevel, min?: RunnerLevel, max?: RunnerLevel): RunnerLevel {
  let idx = LEVEL_ORDER.indexOf(level);
  if (min) idx = Math.max(idx, LEVEL_ORDER.indexOf(min));
  if (max) idx = Math.min(idx, LEVEL_ORDER.indexOf(max));
  return LEVEL_ORDER[idx];
}

function scoreAnswers(a: Required<Answers>): ScoringResult {
  const q1Score: Record<GoalRace, number> = { '5K': 1, '10K': 2, 'Half Marathon': 3, 'Marathon': 4 };
  const q2Score: Record<RunningYears, number> = { '<2': 0, '2-4': 1, '5-8': 2, '9+': 3 };
  const q3Score: Record<WeeklyKm, number> = { '<40': 0, '40-60': 1, '60-80': 2, '80-110': 3, '110+': 4 };
  const q4Score: Record<AgeGroup, number> = { 'Under 25': 2, '25-39': 1, '40+': 0 };
  const q5Score: Record<InjuryFrequency, number> = { Rarely: 2, Occasionally: 1, Frequently: 0 };
  const q7Score: Record<WeeklyDays, number> = { '3-4': 1, '5-6': 2, '7+': 3 };

  const total =
    q1Score[a.q1] * 1.0 +
    q2Score[a.q2] * 1.5 +
    q3Score[a.q3] * 2.5 +
    q4Score[a.q4] * 0.5 +
    q5Score[a.q5] * 1.0 +
    q7Score[a.q7] * 2.0;

  let base: RunnerLevel =
    total >= 22 ? 'elite' :
    total >= 17 ? 'highlyCompetitive' :
    total >= 12 ? 'competitive' :
    total >= 7  ? 'lowKey' :
                  'beginner';

  let minLevel: RunnerLevel | undefined;
  let maxLevel: RunnerLevel | undefined;

  if (a.q3 === '<40') maxLevel = 'lowKey';
  if (a.q7 === '3-4') maxLevel = clampLevel('competitive', undefined, maxLevel) as RunnerLevel;
  if (a.q3 === '80-110' || a.q3 === '110+') {
    if (a.q7 === '5-6' || a.q7 === '7+') minLevel = 'competitive';
  }
  if (a.q3 === '110+' && (a.q2 === '5-8' || a.q2 === '9+')) {
    minLevel = clampLevel('highlyCompetitive', minLevel) as RunnerLevel;
  }

  base = clampLevel(base, minLevel, maxLevel);

  if (a.q5 === 'Frequently') {
    const idx = LEVEL_ORDER.indexOf(base);
    if (idx > 0) base = LEVEL_ORDER[idx - 1];
  }

  const limiterType: 'speed' | 'endurance' = a.q6 === 'Speed' ? 'speed' : 'endurance';
  const riskProfile: 'conservative' | 'balanced' | 'aggressive' =
    (a.q4 === '40+' || a.q5 === 'Frequently') ? 'conservative' :
    (a.q4 === 'Under 25' && a.q5 === 'Rarely') ? 'aggressive' :
    'balanced';

  const ageCategory: AgeCategory =
    a.q4 === 'Under 25' ? 'youth' :
    a.q4 === '40+' ? 'masters' :
    'adult';

  return { level: base, score: total, limiterType, riskProfile, ageCategory };
}

// Maps regular runner level to youth plan tier
const YOUTH_LEVEL_MAP: Record<RunnerLevel, YouthLevel> = {
  beginner: 'freshman',
  lowKey: 'sophomore',
  competitive: 'junior',
  highlyCompetitive: 'senior',
  elite: 'senior',
};

// ─── Questions ────────────────────────────────────────────────────────────────

interface Question {
  key: keyof Answers;
  title: string;
  subtitle?: string;
  options: string[];
}

const QUESTIONS: Question[] = [
  {
    key: 'q1',
    title: 'What is your goal race?',
    subtitle: 'The distance you\'re primarily training for',
    options: ['5K', '10K', 'Half Marathon', 'Marathon'],
  },
  {
    key: 'q2',
    title: 'How many years have you been running?',
    subtitle: 'Consistent running, not occasional jogging',
    options: ['<2', '2-4', '5-8', '9+'],
  },
  {
    key: 'q3',
    title: 'What is your sustained weekly mileage?',
    subtitle: 'Average km/week over the last 8–12 weeks',
    options: ['<40 km', '40–60 km', '60–80 km', '80–110 km', '110+ km'],
  },
  {
    key: 'q4',
    title: 'What is your age group?',
    options: ['Under 25', '25–39', '40+'],
  },
  {
    key: 'q5',
    title: 'How often do you experience running injuries?',
    subtitle: 'Injuries that interrupt your training',
    options: ['Rarely', 'Occasionally', 'Frequently'],
  },
  {
    key: 'q6',
    title: 'What limits your race performance most?',
    subtitle: 'Be honest — this shapes your training bias',
    options: ['Speed', 'Endurance'],
  },
  {
    key: 'q7',
    title: 'How many days per week do you run?',
    subtitle: 'Including double-day sessions',
    options: ['3–4 days', '5–6 days', '7+ days / doubles'],
  },
];

const OPTION_MAP: Record<string, string> = {
  '<40 km': '<40',
  '40–60 km': '40-60',
  '60–80 km': '60-80',
  '80–110 km': '80-110',
  '110+ km': '110+',
  '25–39': '25-39',
  '3–4 days': '3-4',
  '5–6 days': '5-6',
  '7+ days / doubles': '7+',
};

function normalizeAnswer(raw: string): string {
  return OPTION_MAP[raw] ?? raw;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<RunnerLevel, string> = {
  beginner: 'Beginner',
  lowKey: 'Low-Key Competitive',
  competitive: 'Competitive',
  highlyCompetitive: 'Highly Competitive',
  elite: 'Elite',
};

const LEVEL_DESC: Record<RunnerLevel, string> = {
  beginner: 'Building your aerobic base. Focus on consistency and easy effort runs.',
  lowKey: 'Running regularly with some structure. Ready for a first race plan.',
  competitive: 'Training with purpose and volume. Race-ready with structured workouts.',
  highlyCompetitive: 'High mileage and quality. Competing seriously and chasing PRs.',
  elite: 'Peak performance training. Near-maximal volume with full periodisation.',
};

const YOUTH_LEVEL_LABELS: Record<YouthLevel, string> = {
  freshman: 'Freshman',
  sophomore: 'Sophomore',
  junior: 'Junior',
  senior: 'Senior',
};

const YOUTH_LEVEL_DESC: Record<YouthLevel, string> = {
  freshman: 'Beginner-level youth plan. 12-week summer base, building aerobic foundation.',
  sophomore: 'Intermediate youth plan. More volume and first fartlek work.',
  junior: 'Competitive youth plan. Structured progression and harder workouts.',
  senior: 'High-level youth plan. Near-senior volume with race-specific stimuli.',
};

const RISK_LABELS: Record<string, string> = {
  conservative: 'Conservative',
  balanced: 'Balanced',
  aggressive: 'Aggressive',
};

const LIMITER_LABELS: Record<string, string> = {
  speed: 'Speed',
  endurance: 'Endurance',
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RunnerProfileScreen() {
  const navigation = useNavigation();
  const { setAthleteProfile, athleteProfile } = useDeviceStore();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [ageChoice, setAgeChoice] = useState<AgeLevelMode | null>(null);

  const totalSteps = QUESTIONS.length;
  const progress = step < totalSteps ? (step / totalSteps) * 100 : 100;

  // Age category qualifies for an age-specific plan when Under 25 (youth) or 40+ (masters)
  const ageQualifies = result && result.ageCategory !== 'adult';
  // Show age-choice screen when score is ready and choice hasn't been made yet
  const showAgeChoice = !!result && ageQualifies && ageChoice === null;
  // Show result screen when either age doesn't qualify, or choice has been made
  const showResult = !!result && !showAgeChoice;

  const youthLevel: YouthLevel | null = result ? YOUTH_LEVEL_MAP[result.level] : null;

  function handleAnswer(raw: string) {
    const q = QUESTIONS[step];
    const value = normalizeAnswer(raw);
    const updated = { ...answers, [q.key]: value } as Answers;
    setAnswers(updated);

    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      const r = scoreAnswers(updated as Required<Answers>);
      setResult(r);
    }
  }

  function handleBack() {
    if (showResult && ageQualifies) { setAgeChoice(null); return; }
    if (showResult || showAgeChoice) { setResult(null); setAgeChoice(null); return; }
    if (step > 0) setStep(step - 1);
    else navigation.goBack();
  }

  function handleSave() {
    if (!result) return;
    const mode = ageChoice ?? 'standard';
    const cat = result.ageCategory;
    setAthleteProfile({
      ...athleteProfile,
      runnerLevel: result.level,
      runnerLevelDeterminedAt: new Date().toISOString(),
      limiterType: result.limiterType,
      riskProfile: result.riskProfile,
      ageCategory: cat,
      ageLevelMode: mode,
      youthLevel: (cat === 'youth' && mode === 'age' && youthLevel) ? youthLevel : undefined,
    });
    navigation.goBack();
  }

  function handleRetake() {
    setStep(0);
    setAnswers({});
    setResult(null);
    setAgeChoice(null);
  }

  // ── Age-choice screen ──────────────────────────────────────────────────────
  if (showAgeChoice && result) {
    const isMasters = result.ageCategory === 'masters';
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={tokens.color.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan Type</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.resultContent}>
          <View style={styles.ageBadge}>
            <Ionicons
              name={isMasters ? 'ribbon-outline' : 'school-outline'}
              size={36}
              color={tokens.color.primary}
            />
            <Text style={styles.ageBadgeTitle}>
              {isMasters ? 'Masters Runner Detected' : 'Youth Runner Detected'}
            </Text>
            <Text style={styles.ageBadgeSub}>
              {isMasters
                ? 'Age 40+ qualifies you for a Masters plan — same race-specific stimuli with extra recovery days built in.'
                : 'Under 25 qualifies you for a Youth base-training track — a 12-week seasonal foundation plan.'}
            </Text>
          </View>

          <Text style={styles.choiceHeading}>Which plan track would you like to use?</Text>

          {/* Age-based option */}
          <TouchableOpacity
            style={styles.choiceCard}
            onPress={() => setAgeChoice('age')}
            activeOpacity={0.75}
          >
            <View style={styles.choiceCardRow}>
              <Ionicons
                name={isMasters ? 'ribbon' : 'school'}
                size={22}
                color={tokens.color.primary}
              />
              <View style={styles.choiceCardText}>
                <Text style={styles.choiceCardTitle}>
                  {isMasters ? 'Masters Plan' : 'Youth Plan'}
                </Text>
                <Text style={styles.choiceCardSub}>
                  {isMasters
                    ? 'Age-optimised: lower peak volume, more X-Train days, structured recovery'
                    : `${youthLevel ? YOUTH_LEVEL_LABELS[youthLevel] : 'Seasonal'} — 12-week summer base, no goal race`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={tokens.color.textMuted} />
            </View>
          </TouchableOpacity>

          {/* Standard option */}
          <TouchableOpacity
            style={styles.choiceCard}
            onPress={() => setAgeChoice('standard')}
            activeOpacity={0.75}
          >
            <View style={styles.choiceCardRow}>
              <Ionicons name="trending-up" size={22} color={tokens.color.textSecondary} />
              <View style={styles.choiceCardText}>
                <Text style={styles.choiceCardTitle}>
                  Standard Level — {LEVEL_LABELS[result.level]}
                </Text>
                <Text style={styles.choiceCardSub}>
                  Regular race-distance plan matched to your scoring result
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={tokens.color.textMuted} />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Result screen ──────────────────────────────────────────────────────────
  if (showResult && result) {
    const usingAge = ageChoice === 'age';
    const isMasters = result.ageCategory === 'masters';
    const isYouth = result.ageCategory === 'youth';

    const displayTitle = usingAge
      ? (isMasters ? 'Masters' : youthLevel ? YOUTH_LEVEL_LABELS[youthLevel] : '')
      : LEVEL_LABELS[result.level];

    const displayDesc = usingAge
      ? (isMasters
          ? 'Age-optimised plan: extra recovery days, lower peak volume, structured X-Train sessions. Same race-specific stimuli as standard plans.'
          : (youthLevel ? YOUTH_LEVEL_DESC[youthLevel] : ''))
      : LEVEL_DESC[result.level];

    const planTrackLabel = usingAge
      ? (isMasters ? 'Masters Plan' : 'Youth Plan')
      : 'Standard Level';

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={tokens.color.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Runner Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.resultContent}>
          <View style={styles.resultBadge}>
            <Text style={styles.resultBadgeLabel}>{planTrackLabel}</Text>
            <Text style={styles.resultLevel}>{displayTitle}</Text>
            {!usingAge && (
              <Text style={styles.resultScore}>Score: {result.score.toFixed(1)}</Text>
            )}
            {usingAge && !isMasters && (
              <Text style={styles.resultScore}>
                Based on {LEVEL_LABELS[result.level]} scoring
              </Text>
            )}
          </View>

          <Text style={styles.resultDesc}>{displayDesc}</Text>

          <View style={styles.tagsRow}>
            <View style={styles.tag}>
              <Text style={styles.tagLabel}>Limiter</Text>
              <Text style={styles.tagValue}>{LIMITER_LABELS[result.limiterType]}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagLabel}>Risk Profile</Text>
              <Text style={styles.tagValue}>{RISK_LABELS[result.riskProfile]}</Text>
            </View>
          </View>

          {usingAge && ageQualifies && (
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => setAgeChoice(null)}
              activeOpacity={0.75}
            >
              <Text style={styles.switchBtnText}>Switch to Standard Level</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Save & Apply</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRetake} style={styles.retakeBtn}>
            <Text style={styles.retakeBtnText}>Retake Quiz</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Quiz screen ────────────────────────────────────────────────────────────
  const q = QUESTIONS[step];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={tokens.color.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Runner Profile</Text>
        <Text style={styles.stepCounter}>{step + 1}/{totalSteps}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.content}>
        <View style={styles.questionBlock}>
          <Text style={styles.questionTitle}>{q.title}</Text>
          {q.subtitle && <Text style={styles.questionSub}>{q.subtitle}</Text>}
        </View>

        <View style={styles.optionsBlock}>
          {q.options.map(opt => {
            const normalized = normalizeAnswer(opt);
            const isSelected = answers[q.key] === normalized;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.optionCard, isSelected && styles.optionCardActive]}
                onPress={() => handleAnswer(opt)}
                activeOpacity={0.75}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>{opt}</Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={tokens.color.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.color.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: tokens.font.md,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  stepCounter: {
    fontSize: tokens.font.sm,
    color: tokens.color.textMuted,
    width: 36,
    textAlign: 'right',
  },
  progressTrack: {
    height: 3,
    backgroundColor: tokens.color.border,
    marginHorizontal: 16,
    borderRadius: 2,
    marginBottom: 32,
  },
  progressFill: {
    height: 3,
    backgroundColor: tokens.color.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionBlock: {
    marginBottom: 28,
  },
  questionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: tokens.color.textPrimary,
    lineHeight: 30,
    marginBottom: 8,
  },
  questionSub: {
    fontSize: tokens.font.sm,
    color: tokens.color.textMuted,
    lineHeight: 20,
  },
  optionsBlock: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.color.surface,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  optionCardActive: {
    borderColor: tokens.color.primary,
    backgroundColor: `${tokens.color.primary}18`,
  },
  optionText: {
    fontSize: tokens.font.md,
    color: tokens.color.textSecondary,
    fontWeight: '500',
  },
  optionTextActive: {
    color: tokens.color.textPrimary,
    fontWeight: '600',
  },
  // Age choice screen
  ageBadge: {
    backgroundColor: tokens.color.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: tokens.color.primary,
    gap: 12,
  },
  ageBadgeTitle: {
    fontSize: tokens.font.lg,
    fontWeight: '700',
    color: tokens.color.textPrimary,
    textAlign: 'center',
  },
  ageBadgeSub: {
    fontSize: tokens.font.sm,
    color: tokens.color.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  choiceHeading: {
    fontSize: tokens.font.md,
    fontWeight: '600',
    color: tokens.color.textPrimary,
    marginBottom: 14,
  },
  choiceCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.color.border,
    marginBottom: 12,
  },
  choiceCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  choiceCardText: {
    flex: 1,
  },
  choiceCardTitle: {
    fontSize: tokens.font.md,
    fontWeight: '600',
    color: tokens.color.textPrimary,
    marginBottom: 3,
  },
  choiceCardSub: {
    fontSize: tokens.font.sm,
    color: tokens.color.textMuted,
    lineHeight: 18,
  },
  // Result screen
  resultContent: {
    padding: 20,
    paddingBottom: 40,
  },
  resultBadge: {
    backgroundColor: tokens.color.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: tokens.color.primary,
  },
  resultBadgeLabel: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  resultLevel: {
    fontSize: 28,
    fontWeight: '800',
    color: tokens.color.textPrimary,
    marginBottom: 4,
  },
  resultScore: {
    fontSize: tokens.font.sm,
    color: tokens.color.textMuted,
  },
  resultDesc: {
    fontSize: tokens.font.sm,
    color: tokens.color.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  tag: {
    flex: 1,
    backgroundColor: tokens.color.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  tagLabel: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  tagValue: {
    fontSize: tokens.font.sm,
    color: tokens.color.textPrimary,
    fontWeight: '600',
  },
  switchBtn: {
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  switchBtnText: {
    color: tokens.color.textSecondary,
    fontSize: tokens.font.sm,
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: tokens.color.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: tokens.font.md,
    fontWeight: '700',
  },
  retakeBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  retakeBtnText: {
    color: tokens.color.textMuted,
    fontSize: tokens.font.sm,
  },
});
