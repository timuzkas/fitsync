import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { tokens } from '../tokens';
import { TrainingTarget } from '../types';
import { useDeviceStore, PlanConfig } from '../store/useDeviceStore';

type TargetRouteParams = {
  Target: { target?: TrainingTarget; planConfig?: PlanConfig };
};

const RACE_PRESETS = [
  { label: '5K', distanceKm: 5 },
  { label: '10K', distanceKm: 10 },
  { label: 'Half Marathon', distanceKm: 21.1 },
  { label: 'Marathon', distanceKm: 42.2 },
  { label: '50K', distanceKm: 50 },
  { label: '100K', distanceKm: 100 },
  { label: 'Custom', distanceKm: 0 },
];

const RACE_TYPES = [
  { id: 'run', icon: '🏃', label: 'Run' },
  { id: 'ride', icon: '🚴', label: 'Ride' },
  { id: 'swim', icon: '🏊', label: 'Swim' },
];

export default function TargetScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<TargetRouteParams, 'Target'>>();
  const existingTarget: TrainingTarget | null = route.params?.target || null;
  const routePlanConfig = route.params?.planConfig || null;
  const { setPlanConfig, planConfig: storedPlanConfig } = useDeviceStore();

  const planConfig = routePlanConfig || storedPlanConfig;

  const [targetType, setTargetType] = useState<'run' | 'ride' | 'swim'>(existingTarget?.type || 'run');
  const [distanceKm, setDistanceKm] = useState(existingTarget?.distanceKm ?? 10);
  const [customDist, setCustomDist] = useState(() => {
    const dist = existingTarget?.distanceKm;
    return dist != null && dist > 0 && !RACE_PRESETS.find(p => p.distanceKm === dist) ? String(dist) : '';
  });
  const [targetDate, setTargetDate] = useState(existingTarget?.targetDate ? new Date(existingTarget.targetDate) : new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000));
  const [targetHours, setTargetHours] = useState(existingTarget?.targetTimeSec ? Math.floor(existingTarget.targetTimeSec / 3600) : 1);
  const [targetMinutes, setTargetMinutes] = useState(existingTarget?.targetTimeSec ? Math.floor((existingTarget.targetTimeSec % 3600) / 60) : 0);
  const [targetSeconds, setTargetSeconds] = useState(existingTarget?.targetTimeSec ? existingTarget.targetTimeSec % 60 : 0);
  const [hoursText, setHoursText] = useState(String(existingTarget?.targetTimeSec ? Math.floor(existingTarget.targetTimeSec / 3600) : 1));
  const [minutesText, setMinutesText] = useState(String(existingTarget?.targetTimeSec ? Math.floor((existingTarget.targetTimeSec % 3600) / 60) : 0));
  const [secondsText, setSecondsText] = useState(String(existingTarget?.targetTimeSec ? existingTarget.targetTimeSec % 60 : 0));
  const [targetHr, setTargetHr] = useState(existingTarget?.targetHr?.toString() || '');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isCustom = !RACE_PRESETS.find(p => p.distanceKm === distanceKm);

  function getDistance(): number {
    if (isCustom && customDist) return parseFloat(customDist) || 0;
    return distanceKm;
  }

  function calcPace(): string {
    const totalSec = targetHours * 3600 + targetMinutes * 60 + targetSeconds;
    const dist = getDistance();
    if (!dist || !totalSec) return '--:--';
    const paceSec = totalSec / dist;
    const m = Math.floor(paceSec / 60);
    const s = Math.round(paceSec % 60);
    return `${m}:${s.toString().padStart(2, '0')}/km`;
  }

  function calcFinishTime(): string {
    const totalSec = targetHours * 3600 + targetMinutes * 60 + targetSeconds;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function getWeeksRemaining(): number {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24 * 7)));
  }

  function handleSave() {
    const dist = getDistance();
    if (!dist || dist <= 0) {
      Alert.alert('Error', 'Please enter a valid distance');
      return;
    }

    const target: TrainingTarget = {
      id: existingTarget?.id || `target-${Date.now()}`,
      type: targetType,
      distanceKm: dist,
      targetDate: targetDate.toISOString(),
      targetTimeSec: targetHours * 3600 + targetMinutes * 60 + targetSeconds,
      targetPaceSecPerKm: Math.round((targetHours * 3600 + targetMinutes * 60 + targetSeconds) / dist),
      targetHr: targetHr ? parseInt(targetHr) : undefined,
      createdAt: existingTarget?.createdAt || new Date().toISOString(),
    };

    if (planConfig) {
      setPlanConfig(planConfig);
    }

    navigation.navigate('Plan', { target, refresh: true });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Target</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Event Type</Text>
        <View style={styles.typeRow}>
          {RACE_TYPES.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.typeBtn, targetType === t.id && styles.typeBtnActive]}
              onPress={() => setTargetType(t.id as any)}
            >
              <Text style={styles.typeIcon}>{t.icon}</Text>
              <Text style={[styles.typeLabel, targetType === t.id && styles.typeLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Distance</Text>
        <View style={styles.presetGrid}>
          {RACE_PRESETS.map(p => (
            <TouchableOpacity
              key={p.label}
              style={[
                styles.presetBtn,
                distanceKm === p.distanceKm && !isCustom && styles.presetBtnActive,
                isCustom && p.label === 'Custom' && styles.presetBtnActive,
              ]}
              onPress={() => {
                setDistanceKm(p.distanceKm);
                if (p.label === 'Custom') {
                  setCustomDist('');
                }
              }}
            >
              <Text style={[
                styles.presetLabel,
                (distanceKm === p.distanceKm || (isCustom && p.label === 'Custom')) && styles.presetLabelActive
              ]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isCustom && (
          <View style={styles.customRow}>
            <TextInput
              style={styles.customInput}
              value={customDist}
              onChangeText={setCustomDist}
              placeholder="Distance (km)"
              placeholderTextColor={tokens.color.textMuted}
              keyboardType="numeric"
            />
            <Text style={styles.customUnit}>km</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Target Date</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          <Text style={styles.weeksText}>{getWeeksRemaining()} weeks away</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={targetDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={(_, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) setTargetDate(date);
            }}
          />
        )}

        <Text style={styles.sectionTitle}>Target Time</Text>
        <View style={styles.timeRow}>
          <View style={styles.timeInputGroup}>
            <TextInput
              style={styles.timeInput}
              value={hoursText}
              onChangeText={v => {
                const cleaned = v.replace(/[^0-9]/g, '').slice(0, 2);
                setHoursText(cleaned);
                const num = Math.min(23, Math.max(0, parseInt(cleaned) || 0));
                setTargetHours(num);
              }}
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={styles.timeLabel}>h</Text>
          </View>
          <Text style={styles.timeSep}>:</Text>
          <View style={styles.timeInputGroup}>
            <TextInput
              style={styles.timeInput}
              value={minutesText}
              onChangeText={v => {
                const cleaned = v.replace(/[^0-9]/g, '').slice(0, 2);
                setMinutesText(cleaned);
                const num = Math.min(59, Math.max(0, parseInt(cleaned) || 0));
                setTargetMinutes(num);
              }}
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={styles.timeLabel}>m</Text>
          </View>
          <Text style={styles.timeSep}>:</Text>
          <View style={styles.timeInputGroup}>
            <TextInput
              style={styles.timeInput}
              value={secondsText}
              onChangeText={v => {
                const cleaned = v.replace(/[^0-9]/g, '').slice(0, 2);
                setSecondsText(cleaned);
                const num = Math.min(59, Math.max(0, parseInt(cleaned) || 0));
                setTargetSeconds(num);
              }}
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={styles.timeLabel}>s</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{calcFinishTime()}</Text>
            <Text style={styles.statLabel}>Finish Time</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{calcPace()}</Text>
            <Text style={styles.statLabel}>Pace</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Target Heart Rate (optional)</Text>
        <TextInput
          style={styles.hrInput}
          value={targetHr}
          onChangeText={setTargetHr}
          placeholder="e.g. 165 bpm"
          placeholderTextColor={tokens.color.textMuted}
          keyboardType="numeric"
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Generate Plan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: tokens.space.md, paddingTop: 60, paddingBottom: tokens.space.md,
  },
  back: { fontSize: 24, color: tokens.color.textMuted },
  headerTitle: { fontSize: tokens.font.lg, fontWeight: '600', color: tokens.color.textPrimary },
  content: { flex: 1, paddingHorizontal: tokens.space.md },
  sectionTitle: {
    fontSize: tokens.font.sm, fontWeight: '600', color: tokens.color.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginTop: tokens.space.lg, marginBottom: tokens.space.sm,
  },
  typeRow: { flexDirection: 'row', gap: tokens.space.sm },
  typeBtn: {
    flex: 1, backgroundColor: tokens.color.surface, borderRadius: tokens.radius.md,
    padding: tokens.space.md, alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  typeBtnActive: { borderColor: tokens.color.primary, backgroundColor: tokens.color.primaryMuted },
  typeIcon: { fontSize: 28, marginBottom: 4 },
  typeLabel: { fontSize: tokens.font.sm, color: tokens.color.textMuted },
  typeLabelActive: { color: tokens.color.textPrimary, fontWeight: '600' },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm },
  presetBtn: {
    paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.sm,
    backgroundColor: tokens.color.surface, borderRadius: tokens.radius.full,
    borderWidth: 1, borderColor: tokens.color.border,
  },
  presetBtnActive: { borderColor: tokens.color.primary, backgroundColor: tokens.color.primaryMuted },
  presetLabel: { fontSize: tokens.font.sm, color: tokens.color.textMuted },
  presetLabelActive: { color: tokens.color.textPrimary, fontWeight: '600' },
  customRow: { flexDirection: 'row', alignItems: 'center', marginTop: tokens.space.sm },
  customInput: {
    flex: 1, backgroundColor: tokens.color.surface, color: tokens.color.textPrimary,
    borderRadius: tokens.radius.sm, paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.sm,
    fontSize: tokens.font.md, borderWidth: 1, borderColor: tokens.color.border,
  },
  customUnit: { marginLeft: tokens.space.sm, color: tokens.color.textMuted, fontSize: tokens.font.md },
  dateBtn: {
    backgroundColor: tokens.color.surface, borderRadius: tokens.radius.sm,
    padding: tokens.space.md, borderWidth: 1, borderColor: tokens.color.border,
  },
  dateText: { fontSize: tokens.font.md, color: tokens.color.textPrimary, fontWeight: '500' },
  weeksText: { fontSize: tokens.font.sm, color: tokens.color.textMuted, marginTop: 4 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.space.sm },
  timeInputGroup: { flexDirection: 'row', alignItems: 'center' },
  timeInput: {
    width: 48, backgroundColor: tokens.color.surface, color: tokens.color.textPrimary,
    borderRadius: tokens.radius.sm, paddingHorizontal: tokens.space.sm, paddingVertical: tokens.space.sm,
    fontSize: tokens.font.xl, fontWeight: '600', textAlign: 'center', borderWidth: 1, borderColor: tokens.color.border,
  },
  timeLabel: { marginLeft: 4, color: tokens.color.textMuted, fontSize: tokens.font.sm },
  timeSep: { fontSize: tokens.font.xl, color: tokens.color.textMuted },
  statsRow: { flexDirection: 'row', gap: tokens.space.md, marginTop: tokens.space.lg },
  statBox: {
    flex: 1, backgroundColor: tokens.color.surface, borderRadius: tokens.radius.sm,
    padding: tokens.space.md, alignItems: 'center', borderWidth: 1, borderColor: tokens.color.border,
  },
  statValue: { fontSize: tokens.font.xl, fontWeight: 'bold', color: tokens.color.primary },
  statLabel: { fontSize: tokens.font.xs, color: tokens.color.textMuted, marginTop: 4 },
  hrInput: {
    backgroundColor: tokens.color.surface, color: tokens.color.textPrimary,
    borderRadius: tokens.radius.sm, paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.sm,
    fontSize: tokens.font.md, borderWidth: 1, borderColor: tokens.color.border,
  },
  footer: { padding: tokens.space.md, paddingBottom: tokens.space.xl },
  saveBtn: {
    backgroundColor: tokens.color.primary, borderRadius: tokens.radius.sm,
    padding: tokens.space.md, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: tokens.font.lg, fontWeight: 'bold' },
});
