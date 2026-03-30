import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from './Card';
import { tokens } from '../../tokens';
import { PlanWeek } from '../../../../backend/src/lib/planner';

interface PlanDashboardProps {
  plan: PlanWeek[];
}

export function PlanDashboard({ plan }: PlanDashboardProps) {
  if (!plan || plan.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Elite Training Plan</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {plan.map((week, i) => (
          <Card key={i} style={styles.weekCard}>
            <View style={styles.weekHeader}>
              <Text style={styles.weekNum}>Week {week.week}</Text>
              <View style={[styles.typeBadge, { backgroundColor: getBadgeColor(week.type) }]}>
                <Text style={styles.typeText}>{week.type}</Text>
              </View>
            </View>
            
            <Text style={styles.focus}>{week.focus}</Text>
            
            <View style={styles.metrics}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Dist</Text>
                <Text style={styles.metricVal}>{week.metrics.distance}k</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Stress</Text>
                <Text style={styles.metricVal}>{week.metrics.targetStressScore}</Text>
              </View>
            </View>

            <View style={styles.sessions}>
              {week.sessions.map((s, si) => (
                <View key={si} style={styles.session}>
                  <Text style={styles.sessionIcon}>{s.signifier.split(' ')[0]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionType}>{s.type}</Text>
                    <Text style={styles.sessionSub}>{s.distance}km · {s.hrRange.min}-{s.hrRange.max}bpm</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

function getBadgeColor(type: string) {
  if (type === 'Build') return tokens.color.primary;
  if (type === 'Recovery') return tokens.color.success;
  return tokens.color.warning;
}

const styles = StyleSheet.create({
  container: {
    marginTop: tokens.space.lg,
    marginBottom: tokens.space.xl,
  },
  sectionTitle: {
    fontSize: tokens.font.sm,
    fontWeight: '600',
    color: tokens.color.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
  },
  scroll: {
    paddingHorizontal: tokens.space.md,
    gap: tokens.space.md,
  },
  weekCard: {
    width: 280,
    padding: tokens.space.md,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.space.sm,
  },
  weekNum: {
    fontSize: tokens.font.lg,
    fontWeight: 'bold',
    color: tokens.color.textPrimary,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: tokens.radius.sm,
  },
  typeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  focus: {
    fontSize: tokens.font.sm,
    color: tokens.color.textSecondary,
    marginBottom: tokens.space.md,
    height: 40,
  },
  metrics: {
    flexDirection: 'row',
    gap: tokens.space.lg,
    marginBottom: tokens.space.md,
    paddingBottom: tokens.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.border,
  },
  metric: {
    gap: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: tokens.color.textMuted,
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: tokens.font.md,
    fontWeight: 'bold',
    color: tokens.color.textPrimary,
  },
  sessions: {
    gap: tokens.space.sm,
  },
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
  },
  sessionIcon: {
    fontSize: 16,
  },
  sessionType: {
    fontSize: tokens.font.sm,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  sessionSub: {
    fontSize: 11,
    color: tokens.color.textMuted,
  },
});
