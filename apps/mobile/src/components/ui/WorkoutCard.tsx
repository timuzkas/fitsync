import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { tokens } from '../../tokens';

interface WorkoutCardProps {
  workout: any;
  onDelete?: (id: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
  run: '🏃',
  strength: '🏋️',
  walk: '🚶',
  ride: '🚴',
  swim: '🏊',
  other: '⚡',
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
  const ls = workout.loadScore;
  const hasLoad = ls && (ls.cardio + ls.legs + ls.upper + ls.core + ls.systemic) > 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={() => setExpanded(!expanded)} 
        activeOpacity={0.8}
        style={[styles.card, expanded && styles.cardExpanded]}
      >
        <View style={styles.header}>
          <View style={styles.left}>
            <View style={[styles.iconContainer, { backgroundColor: workout.type === 'run' ? tokens.color.primary : tokens.color.surfaceElevated }]}>
              <Text style={styles.icon}>{TYPE_ICONS[workout.type] || '⚡'}</Text>
            </View>
            <View>
              <Text style={styles.title}>{workout.title || `${workout.type.charAt(0).toUpperCase() + workout.type.slice(1)}`}</Text>
              <Text style={styles.date}>{fmtDate(workout.startedAt)}</Text>
            </View>
          </View>
          <View style={styles.right}>
            {workout.distanceM != null && workout.distanceM > 0 ? (
              <Text style={styles.mainMetric}>{(workout.distanceM / 1000).toFixed(1)}<Text style={styles.unit}>km</Text></Text>
            ) : (
              <Text style={styles.mainMetric}>{Math.round(workout.durationSec / 60)}<Text style={styles.unit}>min</Text></Text>
            )}
          </View>
        </View>

        <View style={styles.quickStats}>
          <Text style={styles.qStat}>{fmtDur(workout.durationSec)}</Text>
          {workout.avgHr != null && workout.avgHr > 0 && (
            <Text style={styles.qStat}>{workout.avgHr} bpm</Text>
          )}
          {workout.calories != null && workout.calories > 0 && (
            <Text style={styles.qStat}>{Math.round(workout.calories)} kcal</Text>
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.detailsPane}>
          {hasLoad && ls && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Physiological Impact</Text>
              <View style={styles.loadGrid}>
                <LoadChip label="Cardio" value={ls.cardio} color={tokens.color.primary} />
                <LoadChip label="Legs" value={ls.legs} color={tokens.color.success} />
                <LoadChip label="Systemic" value={ls.systemic} color={tokens.color.accent} />
              </View>
            </View>
          )}

          {workout.hrZoneTimes && Object.keys(workout.hrZoneTimes).length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>HR Zones</Text>
              <View style={styles.zones}>
                {Object.entries(workout.hrZoneTimes).map(([zone, secs]: [string, any]) => (
                  <View key={zone} style={styles.zone}>
                    <Text style={[styles.zoneName, { color: zone === 'z5' ? tokens.color.danger : tokens.color.textSecondary }]}>{zone.toUpperCase()}</Text>
                    <Text style={styles.zoneTime}>{Math.round((secs || 0) / 60)}m</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {onDelete && (
            <TouchableOpacity 
              onPress={() => onDelete(workout.id)} 
              style={styles.dangerZone}
            >
              <Text style={styles.dangerText}>Remove Workout</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function LoadChip({ label, value, color }: { label: string, value: number, color: string }) {
  if (value <= 0) return null;
  return (
    <View style={styles.loadChip}>
      <View style={[styles.chipIndicator, { backgroundColor: color }]} />
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.space.sm,
  },
  card: {
    backgroundColor: tokens.color.surfaceElevated,
    borderRadius: tokens.radius.lg,
    padding: tokens.space.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  cardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: tokens.font.md,
    fontWeight: '700',
    color: tokens.color.textPrimary,
  },
  date: {
    fontSize: tokens.font.xs,
    color: tokens.color.textSecondary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  mainMetric: {
    fontSize: tokens.font.xl,
    fontWeight: '800',
    color: tokens.color.textPrimary,
  },
  unit: {
    fontSize: tokens.font.xs,
    fontWeight: '600',
    color: tokens.color.textSecondary,
    marginLeft: 2,
  },
  quickStats: {
    flexDirection: 'row',
    gap: tokens.space.md,
    marginTop: tokens.space.md,
    paddingTop: tokens.space.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  qStat: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.color.textSecondary,
  },
  detailsPane: {
    backgroundColor: tokens.color.surfaceElevated,
    borderBottomLeftRadius: tokens.radius.lg,
    borderBottomRightRadius: tokens.radius.lg,
    padding: tokens.space.md,
    paddingTop: 0,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderTopWidth: 0,
  },
  detailSection: {
    marginTop: tokens.space.sm,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: tokens.color.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: tokens.space.sm,
    marginTop: tokens.space.sm,
  },
  loadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space.sm,
  },
  loadChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 6,
    borderRadius: tokens.radius.sm,
    gap: 6,
  },
  chipIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.color.textSecondary,
  },
  chipValue: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.color.textPrimary,
  },
  zones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space.sm,
  },
  zone: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  zoneName: {
    fontSize: 10,
    fontWeight: '800',
  },
  zoneTime: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  dangerZone: {
    marginTop: tokens.space.lg,
    paddingVertical: tokens.space.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  dangerText: {
    fontSize: tokens.font.xs,
    color: tokens.color.danger,
    fontWeight: '600',
  },
});
