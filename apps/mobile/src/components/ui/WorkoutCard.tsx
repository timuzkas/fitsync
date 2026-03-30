import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Pill } from '../ui/Pill';
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
    <Card style={styles.card}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View style={styles.header}>
          <View style={styles.typeRow}>
            <Text style={styles.icon}>{TYPE_ICONS[workout.type] || '⚡'}</Text>
            <Text style={styles.type}>{workout.type}</Text>
            {workout.isManual && <Pill label="manual" variant="muted" size="sm" />}
            {workout.isPlanned && <Pill label="planned" variant="primary" size="sm" />}
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.date}>{fmtDate(workout.startedAt)}</Text>
            {workout.isManual && onDelete && (
              <TouchableOpacity 
                onPress={() => onDelete(workout.id)} 
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteText}>🗑</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.expand}>{expanded ? '▲' : '▼'}</Text>
          </View>
        </View>

        <Text style={styles.title}>{workout.title || `${workout.type} workout`}</Text>

        <View style={styles.stats}>
          <Text style={styles.stat}>{fmtDur(workout.durationSec)}</Text>
          {workout.distanceM != null && workout.distanceM > 0 && (
            <Text style={styles.stat}>{(workout.distanceM / 1000).toFixed(1)} km</Text>
          )}
          {workout.calories != null && workout.calories > 0 && (
            <Text style={styles.stat}>{Math.round(workout.calories)} kcal</Text>
          )}
          {workout.avgHr != null && workout.avgHr > 0 && (
            <Text style={styles.stat}>{workout.avgHr} bpm</Text>
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expanded}>
          {hasLoad && ls && (
            <>
              <Text style={styles.sectionTitle}>Load Impact</Text>
              <View style={styles.loadChips}>
                {ls.cardio > 0 && (
                  <Pill label={`Cardio ${(ls.cardio).toFixed(1)}`} variant="primary" size="sm" />
                )}
                {ls.legs > 0 && (
                  <Pill label={`Legs ${(ls.legs).toFixed(1)}`} variant="success" size="sm" />
                )}
                {ls.upper > 0 && (
                  <Pill label={`Upper ${(ls.upper).toFixed(1)}`} variant="warning" size="sm" />
                )}
                {ls.core > 0 && (
                  <Pill label={`Core ${(ls.core).toFixed(1)}`} variant="muted" size="sm" />
                )}
                {ls.systemic > 0 && (
                  <Pill label={`Systemic ${(ls.systemic).toFixed(1)}`} variant="muted" size="sm" />
                )}
              </View>
            </>
          )}

          {workout.hrZoneTimes && Object.keys(workout.hrZoneTimes).length > 0 && workout.hrZoneTimes && (
            <>
              <Text style={styles.sectionTitle}>HR Zones</Text>
              <View style={styles.zones}>
                {Object.entries(workout.hrZoneTimes).map(([zone, secs]: [string, any]) => (
                  <View key={zone} style={styles.zone}>
                    <Text style={styles.zoneName}>{zone.toUpperCase()}</Text>
                    <Text style={styles.zoneTime}>{Math.round((secs || 0) / 60)}m</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {workout.exercises && workout.exercises.length > 0 && workout.exercises && (
            <>
              <Text style={styles.sectionTitle}>Exercises</Text>
              {workout.exercises.map((ex: any, i: number) => (
                <View key={i} style={styles.exItem}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exSets}>
                    {ex.sets && ex.sets.length > 0
                      ? ex.sets.map((s: any) => `${s.weight}kg × ${s.reps}`).join(', ')
                      : '—'}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: tokens.space.mdSm,
    padding: tokens.space.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.xs,
  },
  icon: {
    fontSize: tokens.font.md,
  },
  type: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.xs,
  },
  date: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
  },
  deleteBtn: {
    marginLeft: tokens.space.xs,
  },
  deleteText: {
    fontSize: 14,
    color: tokens.color.textMuted,
  },
  expand: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
  },
  title: {
    fontSize: tokens.font.lg,
    fontWeight: '600',
    color: tokens.color.textPrimary,
    marginBottom: 6,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space.sm,
  },
  stat: {
    fontSize: tokens.font.sm,
    color: tokens.color.textSecondary,
  },
  expanded: {
    marginTop: tokens.space.md,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
    paddingTop: tokens.space.md,
  },
  sectionTitle: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: tokens.space.sm,
    marginTop: tokens.space.sm,
  },
  loadChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space.xs,
  },
  zones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space.sm,
  },
  zone: {
    backgroundColor: tokens.color.elevated,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  zoneName: {
    fontSize: tokens.font.xs,
    fontWeight: 'bold',
    color: tokens.color.danger,
  },
  zoneTime: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
  },
  exItem: {
    paddingLeft: tokens.space.sm,
    borderLeftWidth: 2,
    borderLeftColor: tokens.color.primary,
    marginBottom: tokens.space.xs,
  },
  exName: {
    fontSize: tokens.font.sm,
    color: tokens.color.textPrimary,
    fontWeight: '500',
  },
  exSets: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    marginTop: 2,
  },
});
