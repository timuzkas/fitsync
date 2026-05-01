import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { tokens } from '../../tokens';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface WorkoutCardProps {
  workout: any;
  onDelete?: (id: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
  run:      '🏃',
  strength: '🏋️',
  walk:     '🚶',
  ride:     '🚴',
  swim:     '🏊',
  other:    '⚡',
};

const TYPE_COLORS: Record<string, string> = {
  run:      tokens.color.primary,
  strength: tokens.color.warning,
  walk:     tokens.color.success,
  ride:     tokens.color.accent,
  swim:     '#06b6d4',
  other:    tokens.color.textMuted,
};

function fmtDur(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function WorkoutCard({ workout, onDelete }: WorkoutCardProps) {
  const [expanded, setExpanded] = useState(false);

  const ls = workout?.loadScore;
  const sessionLoad = workout?.rpe && workout?.durationSec
    ? Math.round(workout.rpe * (workout.durationSec / 60))
    : null;
  const hasLoad = sessionLoad != null && sessionLoad > 0;
  const typeColor = TYPE_COLORS[workout?.type] || tokens.color.textMuted;
  const hasDistance = workout?.distanceM != null && workout?.distanceM > 0;

  const paceSec = hasDistance ? workout.durationSec / (workout.distanceM / 1000) : 0;
  const paceMin = Math.floor(paceSec / 60);
  const paceRemSec = Math.round(paceSec % 60);
  const paceStr = paceSec > 0 ? `${paceMin}:${paceRemSec.toString().padStart(2, '0')}/km` : null;

  const handleToggle = () => {
    LayoutAnimation.configureNext({
      duration: 250,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'easeInEaseOut' },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    setExpanded(e => !e);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.8}
        style={[styles.card, expanded && styles.cardExpanded]}
      >
        <View style={[styles.stripe, { backgroundColor: typeColor }]} />
        <View style={styles.inner}>
          <View style={styles.header}>
            <View style={styles.left}>
              <Text style={styles.icon}>{TYPE_ICONS[workout?.type] || '⚡'}</Text>
              <View>
                <Text style={styles.title}>
                  {workout?.title || `${workout?.type?.charAt(0).toUpperCase() + workout?.type?.slice(1)}`}
                </Text>
                <Text style={styles.subtitle}>
                  {[
                    fmtDur(workout?.durationSec),
                    paceStr,
                    workout?.calories ? `${Math.round(workout.calories)} kcal` : null,
                  ].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
            <View style={styles.right}>
              {hasDistance ? (
                <>
                  <Text style={[styles.mainMetric, { color: tokens.color.textPrimary }]}>
                    {((workout?.distanceM || 0) / 1000).toFixed(1)}
                  </Text>
                  <Text style={styles.unit}>km</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.mainMetric, { color: tokens.color.textPrimary }]}>
                    {Math.round(workout?.durationSec / 60)}
                  </Text>
                  <Text style={styles.unit}>min</Text>
                </>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.detailsPane}>
          {hasLoad && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Session Load</Text>
              <View style={styles.loadGrid}>
                <LoadChip label="RPE"  value={workout.rpe}  color={tokens.color.warning} />
                <LoadChip label="Load" value={sessionLoad!} color={tokens.color.primary} />
              </View>
            </View>
          )}

          {ls?.sourceDetail?.type === 'hevy_parsed' && ls.sourceDetail.volume && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Hevy Volume</Text>
              <View style={styles.loadGrid}>
                {ls.sourceDetail.volume.legs > 0 && (
                  <HevyVolumeChip label="Legs"  value={ls.sourceDetail.volume.legs}  color={tokens.color.success} />
                )}
                {ls.sourceDetail.volume.upper > 0 && (
                  <HevyVolumeChip label="Upper" value={ls.sourceDetail.volume.upper} color={tokens.color.warning} />
                )}
                {ls.sourceDetail.volume.core > 0 && (
                  <HevyVolumeChip label="Core"  value={ls.sourceDetail.volume.core}  color={tokens.color.accent} />
                )}
              </View>
            </View>
          )}

          {workout?.hrZoneTimes && Object.keys(workout.hrZoneTimes).length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>HR Zones</Text>
              <View style={styles.zones}>
                {Object.entries(workout.hrZoneTimes).map(([zone, secs]: [string, any]) => (
                  <View key={zone} style={styles.zone}>
                    <Text style={[styles.zoneName, {
                      color: zone === 'z5' ? tokens.color.danger :
                             zone === 'z4' ? tokens.color.warning :
                             tokens.color.textSecondary,
                    }]}>{zone.toUpperCase()}</Text>
                    <Text style={styles.zoneTime}>{Math.round((secs || 0) / 60)}m</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {(workout?.notes || workout?.sufferScore) && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Session Info</Text>
              {workout.sufferScore != null && (
                <View style={styles.sufferRow}>
                  <Text style={styles.sufferLabel}>Relative Effort</Text>
                  <Text style={styles.sufferValue}>{workout.sufferScore}</Text>
                </View>
              )}
              {workout.notes && (
                <Text style={styles.notesText}>{workout.notes}</Text>
              )}
            </View>
          )}

          {workout?.exercises && workout.exercises.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Exercises</Text>
              <View style={styles.exerciseList}>
                {workout.exercises.map((ex: any, idx: number) => (
                  <View key={ex.id || idx} style={styles.exerciseItem}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <View style={styles.setGrid}>
                      {(ex.sets || []).map((s: any, si: number) => (
                        <View key={si} style={styles.setChip}>
                          <Text style={styles.setText}>
                            {s.reps}<Text style={styles.setUnit}>×</Text>{s.weight}<Text style={styles.setUnit}>kg</Text>
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(workout?.id)}
              style={styles.dangerZone}
              activeOpacity={0.7}
            >
              <Text style={styles.dangerText}>Remove Workout</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function LoadChip({ label, value, color }: { label: string; value: number; color: string }) {
  if (value <= 0) return null;
  return (
    <View style={styles.loadChip}>
      <View style={[styles.chipIndicator, { backgroundColor: color }]} />
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={[styles.chipValue, { color }]}>{value.toFixed(1)}</Text>
    </View>
  );
}

function HevyVolumeChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.loadChip}>
      <View style={[styles.chipIndicator, { backgroundColor: color }]} />
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={[styles.chipValue, { color }]}>
        {value >= 1000 ? `${(value / 1000).toFixed(1)}t` : `${Math.round(value)}kg`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.space.sm,
  },
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.color.border,
    flexDirection: 'row',
  },
  cardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  stripe: {
    width: 3,
    borderTopLeftRadius: tokens.radius.lg,
    borderBottomLeftRadius: tokens.radius.lg,
    marginVertical: tokens.space.sm,
    borderRadius: tokens.radius.full,
  },
  inner: {
    flex: 1,
    padding: tokens.space.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
  },
  icon: { fontSize: 22 },
  title: {
    fontSize: tokens.font.md,
    fontWeight: '700',
    color: tokens.color.textPrimary,
  },
  date: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    marginTop: 1,
  },
  subtitle: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 2,
    alignSelf: 'flex-start',
  },
  mainMetric: {
    fontSize: tokens.font.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    fontWeight: '600',
    marginTop: 4,
  },
  detailsPane: {
    backgroundColor: tokens.color.surface,
    borderBottomLeftRadius: tokens.radius.lg,
    borderBottomRightRadius: tokens.radius.lg,
    paddingHorizontal: tokens.space.md,
    paddingBottom: tokens.space.md,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: tokens.color.border,
  },
  detailSection: { marginTop: tokens.space.sm },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: tokens.color.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: tokens.space.sm,
    paddingTop: tokens.space.sm,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
  },
  loadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space.xs,
  },
  loadChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.color.elevated,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 5,
    borderRadius: tokens.radius.sm,
    gap: 5,
  },
  chipIndicator: { width: 5, height: 5, borderRadius: 3 },
  chipLabel: { fontSize: 11, fontWeight: '600', color: tokens.color.textSecondary },
  chipValue: { fontSize: 11, fontWeight: '800' },
  zones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space.xs,
  },
  zone: {
    backgroundColor: tokens.color.elevated,
    borderRadius: tokens.radius.xs,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 4,
    minWidth: 44,
    alignItems: 'center',
  },
  zoneName: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  zoneTime: { fontSize: 11, fontWeight: '600', color: tokens.color.textPrimary },
  sufferRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.color.elevated,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 8,
    borderRadius: tokens.radius.sm,
    marginBottom: 6,
  },
  sufferLabel: { fontSize: 11, fontWeight: '600', color: tokens.color.textSecondary },
  sufferValue: { fontSize: 13, fontWeight: '800', color: tokens.color.warning },
  notesText: {
    fontSize: tokens.font.sm,
    color: tokens.color.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 4,
  },
  exerciseList: { gap: tokens.space.sm },
  exerciseItem: {
    backgroundColor: tokens.color.elevated,
    borderRadius: tokens.radius.sm,
    padding: tokens.space.sm,
  },
  exerciseName: {
    fontSize: tokens.font.sm,
    fontWeight: '700',
    color: tokens.color.textPrimary,
    marginBottom: 6,
  },
  setGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  setChip: {
    backgroundColor: tokens.color.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  setText: { fontSize: 11, fontWeight: '700', color: tokens.color.textSecondary },
  setUnit: { fontSize: 9, color: tokens.color.textMuted, fontWeight: '400' },
  dangerZone: {
    marginTop: tokens.space.md,
    paddingVertical: tokens.space.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
  },
  dangerText: { fontSize: tokens.font.xs, color: tokens.color.danger, fontWeight: '600' },
});
