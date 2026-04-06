import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../tokens';
import { useDeviceStore } from '../store/useDeviceStore';
import { api } from '../api/client';
import { StepIndicator } from '../components/ui/StepIndicator';
import { Pill } from '../components/ui/Pill';

const WORKOUT_TYPES = [
  { id: 'run', icon: '🏃', label: 'Run' },
  { id: 'ride', icon: '🚴', label: 'Ride' },
  { id: 'strength', icon: '🏋️', label: 'Lift' },
  { id: 'walk', icon: '🚶', label: 'Walk' },
  { id: 'swim', icon: '🏊', label: 'Swim' },
  { id: 'other', icon: '⚡', label: 'Other' },
];

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Core', 'Calves', 'Forearms'];

export default function AddWorkoutScreen() {
  const navigation = useNavigation<any>();
  const { deviceId, deviceSecret } = useDeviceStore();
  const [step, setStep] = useState(0);
  const [entryMode, setEntryMode] = useState<'log' | 'plan' | ''>('');
  const [workoutType, setWorkoutType] = useState('');
  const [title, setTitle] = useState('');
  const [durMin, setDurMin] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [distanceKm, setDistanceKm] = useState('');
  const [avgHr, setAvgHr] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [sessionPurpose, setSessionPurpose] = useState<'training' | 'b-race' | 'c-race'>('training');
  const [targetDist, setTargetDist] = useState('');
  const [targetHours, setTargetHours] = useState('1');
  const [targetMinutes, setTargetMinutes] = useState('0');
  const [targetSeconds, setTargetSeconds] = useState('0');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPurposePicker, setShowPurposePicker] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [library, setLibrary] = useState<any[]>([]);
  const [showLib, setShowLib] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (deviceId && deviceSecret && workoutType === 'strength') {
      api.getExerciseLibrary(deviceId, deviceSecret).then(setLibrary).catch(() => {});
    }
  }, [deviceId, deviceSecret, workoutType]);

  const filteredLib = library.filter((ex: any) =>
    selectedMuscles.length === 0 ||
    ex.muscleGroups.some((mg: string) => selectedMuscles.includes(mg))
  );

  function toggleMuscle(mg: string) {
    setSelectedMuscles(prev =>
      prev.includes(mg) ? prev.filter(m => m !== mg) : [...prev, mg]
    );
  }

  function addEx(name?: string) {
    setExercises(prev => [...prev, { name: name || '', sets: [{ reps: 0, weight: 0 }] }]);
  }

  function removeEx(i: number) {
    setExercises(prev => prev.filter((_, idx) => idx !== i));
  }

  function addSet(exI: number) {
    const u = [...exercises];
    u[exI].sets = [...u[exI].sets, { reps: 0, weight: 0 }];
    setExercises(u);
  }

  function remSet(exI: number, setI: number) {
    const u = [...exercises];
    u[exI].sets = u[exI].sets.filter((_: any, i: number) => i !== setI);
    setExercises(u);
  }

  function updSet(exI: number, setI: number, field: 'reps' | 'weight', v: string) {
    const u = [...exercises];
    u[exI].sets[setI] = { ...u[exI].sets[setI], [field]: parseInt(v) || 0 };
    setExercises(u);
  }

  function calcPreview() {
    let total = 0;
    exercises.filter(e => e.name.trim()).forEach(ex => {
      const vol = (ex.sets || []).reduce((a: number, s: any) => a + (s.reps || 0) * (s.weight || 0), 0);
      total += vol * 0.05;
    });
    return Math.round(total * 10) / 10;
  }

  async function handleSave() {
    if (!title.trim() || !durMin) {
      Alert.alert('Error', 'Fill in title and duration');
      return;
    }
    if (!deviceId || !deviceSecret) return;
    setSaving(true);

    const validExs = exercises
      .filter(e => e.name.trim() && (e.sets || []).length > 0)
      .map(e => ({
        name: e.name.trim(),
        muscleGroups: selectedMuscles,
        sets: (e.sets || []).map((s: any) => ({ reps: s.reps || 0, weight: s.weight || 0 })),
      }));

    try {
      const timeParts = timeStr.split(':');
      const combinedDate = new Date(dateStr);
      if (timeParts.length === 2) {
        combinedDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
      }

      await api.createManualWorkout(deviceId, deviceSecret, {
        title: title.trim(),
        type: workoutType,
        startedAt: combinedDate.toISOString(),
        durationSec: parseInt(durMin) * 60,
        distanceM: entryMode === 'log' && distanceKm ? parseFloat(distanceKm) * 1000 : (entryMode === 'plan' && targetDist ? parseFloat(targetDist) * 1000 : undefined),
        avgHr: entryMode === 'log' && avgHr ? parseInt(avgHr) : undefined,
        calories: entryMode === 'log' && calories ? parseFloat(calories) : undefined,
        notes: (notes || '') + (sessionPurpose !== 'training' ? `\n[Type: ${sessionPurpose.toUpperCase()}]` : ''),
        exercises: validExs,
        isPlanned: sessionPurpose !== 'training',
        sessionPurpose: sessionPurpose !== 'training' ? sessionPurpose : undefined,
        targetTimeSec: entryMode === 'plan' ? (parseInt(targetHours || '0') * 3600 + parseInt(targetMinutes || '0') * 60 + parseInt(targetSeconds || '0')) : undefined,
      });
      Alert.alert('Saved!', 'Workout added', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  function canContinue() {
    if (step === 0) return !!entryMode;
    if (step === 1) return !!workoutType;
    if (step === 2) return !!title.trim() && !!durMin;
    if (step === 3 && entryMode === 'plan') return !!targetDist;
    return true;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step === 0 ? navigation.goBack() : setStep(s => s - 1)}>
            <Text style={styles.back}>{step === 0 ? '✕' : '←'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {entryMode === 'plan' ? 'Plan Race' : 'Add Workout'}
          </Text>
          <View style={{ width: 30 }} />
        </View>

        <StepIndicator current={step} total={5} />

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">

          {step === 0 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>What are you logging?</Text>
              <View style={styles.entryModeGrid}>
                <TouchableOpacity 
                  style={[styles.modeCard, entryMode === 'log' && styles.modeCardActive]}
                  onPress={() => { setEntryMode('log'); setSessionPurpose('training'); }}
                >
                  <Text style={styles.modeIcon}>🏃</Text>
                  <Text style={styles.modeTitle}>Log Activity</Text>
                  <Text style={styles.modeDesc}>Completed workout/race</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modeCard, entryMode === 'plan' && styles.modeCardActive]}
                  onPress={() => { setEntryMode('plan'); setSessionPurpose('c-race'); }}
                >
                  <Text style={styles.modeIcon}>🏁</Text>
                  <Text style={styles.modeTitle}>Plan Race</Text>
                  <Text style={styles.modeDesc}>Future B or C event</Text>
                </TouchableOpacity>
              </View>

      {entryMode === 'plan' && (
        <>
          <Text style={[styles.fieldLabel, { marginTop: tokens.space.lg }]}>Race Priority</Text>
          <View style={styles.purposeGrid}>
            {[
              { id: 'b-race', label: 'B Race', desc: 'Important race' },
              { id: 'c-race', label: 'C Race', desc: 'Easy/Training race' },
            ].map(p => (
              <TouchableOpacity 
                key={p.id}
                style={[styles.purposeCard, sessionPurpose === p.id && styles.purposeCardActive]}
                onPress={() => setSessionPurpose(p.id as any)}
              >
                <Text style={[styles.purposeLabel, sessionPurpose === p.id && styles.purposeTextActive]}>{p.label}</Text>
                <Text style={[styles.purposeDesc, sessionPurpose === p.id && styles.purposeTextActiveMuted]}>{p.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  )}

          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Select Type</Text>
              <View style={styles.typeGrid}>
                {WORKOUT_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.typeCard, workoutType === t.id && styles.typeCardActive]}
                    onPress={() => setWorkoutType(t.id)}
                  >
                    <Text style={styles.typeIcon}>{t.icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>
                {entryMode === 'plan' ? 'Race Details' : 'Basic Info'}
              </Text>
              
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Date</Text>
                  <TextInput
                    style={styles.input}
                    value={dateStr}
                    onChangeText={setDateStr}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={tokens.color.textMuted}
                  />
                </View>
                {entryMode === 'log' && (
                  <View style={{ flex: 1, marginLeft: tokens.space.md }}>
                    <Text style={styles.fieldLabel}>Time</Text>
                    <TextInput
                      style={styles.input}
                      value={timeStr}
                      onChangeText={setTimeStr}
                      placeholder="HH:MM"
                      placeholderTextColor={tokens.color.textMuted}
                    />
                  </View>
                )}
              </View>

              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder={entryMode === 'plan' ? "e.g. London 10K, Trail Half" : "e.g. Morning Run, Push Day"}
                placeholderTextColor={tokens.color.textMuted}
              />
              
              <Text style={styles.fieldLabel}>
                {entryMode === 'plan' ? 'Target Duration (min)' : 'Duration (minutes)'}
              </Text>
              <TextInput
                style={styles.input}
                value={durMin}
                onChangeText={setDurMin}
                placeholder="60"
                placeholderTextColor={tokens.color.textMuted}
                keyboardType="numeric"
              />

              {entryMode === 'log' && (
                <>
                  <Text style={styles.fieldLabel}>Notes (optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="How did it feel?"
                    placeholderTextColor={tokens.color.textMuted}
                    multiline
                  />
                </>
              )}
            </View>
          )}

          {step === 3 && entryMode === 'plan' && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Race Goals</Text>
              
              <Text style={styles.fieldLabel}>Target Distance (km)</Text>
              <TextInput
                style={styles.input}
                value={targetDist}
                onChangeText={setTargetDist}
                placeholder="10.0"
                placeholderTextColor={tokens.color.textMuted}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Target Time</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeInputGroup}>
                  <TextInput
                    style={styles.timeInput}
                    value={targetHours}
                    onChangeText={v => setTargetHours(v.replace(/[^0-9]/g, '').slice(0, 2))}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.timeLabel}>h</Text>
                </View>
                <Text style={styles.timeSep}>:</Text>
                <View style={styles.timeInputGroup}>
                  <TextInput
                    style={styles.timeInput}
                    value={targetMinutes}
                    onChangeText={v => setTargetMinutes(v.replace(/[^0-9]/g, '').slice(0, 2))}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.timeLabel}>m</Text>
                </View>
                <Text style={styles.timeSep}>:</Text>
                <View style={styles.timeInputGroup}>
                  <TextInput
                    style={styles.timeInput}
                    value={targetSeconds}
                    onChangeText={v => setTargetSeconds(v.replace(/[^0-9]/g, '').slice(0, 2))}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.timeLabel}>s</Text>
                </View>
              </View>
            </View>
          )}

          {step === 3 && entryMode === 'log' && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Performance Stats</Text>
              
              <Text style={styles.fieldLabel}>Distance (km)</Text>
              <TextInput
                style={styles.input}
                value={distanceKm}
                onChangeText={setDistanceKm}
                placeholder="5.0"
                placeholderTextColor={tokens.color.textMuted}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Avg Heart Rate (bpm)</Text>
              <TextInput
                style={styles.input}
                value={avgHr}
                onChangeText={setAvgHr}
                placeholder="145"
                placeholderTextColor={tokens.color.textMuted}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Calories (optional)</Text>
              <TextInput
                style={styles.input}
                value={calories}
                onChangeText={setCalories}
                placeholder="350"
                placeholderTextColor={tokens.color.textMuted}
                keyboardType="numeric"
              />
            </View>
          )}

          {step === 2 && entryMode === 'log' && workoutType === 'strength' && (
            <View style={{ marginTop: tokens.space.lg }}>
              <Text style={styles.stepTitle}>Muscle Groups</Text>
              <View style={styles.muscleGrid}>
                {MUSCLE_GROUPS.map(mg => (
                  <TouchableOpacity key={mg} onPress={() => toggleMuscle(mg)}>
                    <Pill label={mg} variant={selectedMuscles.includes(mg) ? 'primary' : 'muted'} outlined={!selectedMuscles.includes(mg)} showCheck={selectedMuscles.includes(mg)} />
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={[styles.stepTitle, { marginTop: tokens.space.lg }]}>Exercises</Text>
              {exercises.map((ex, ei) => (
                <View key={ei} style={styles.exCard}>
                  <View style={styles.exHeader}>
                    <TextInput
                      style={styles.exName}
                      value={ex.name}
                      onChangeText={v => { const u = [...exercises]; u[ei].name = v; setExercises(u); }}
                      placeholder="Exercise name"
                      placeholderTextColor={tokens.color.textMuted}
                    />
                    <TouchableOpacity onPress={() => removeEx(ei)}>
                      <Text style={{ color: tokens.color.danger, fontSize: 18 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  {ex.sets.map((s: any, si: number) => (
                    <View key={si} style={styles.setRow}>
                      <Text style={styles.setNum}>Set {si + 1}</Text>
                      <TextInput
                        style={styles.setInput}
                        value={s.reps || s.reps === 0 ? String(s.reps) : ''}
                        onChangeText={v => updSet(ei, si, 'reps', v)}
                        placeholder="Reps"
                        placeholderTextColor={tokens.color.textMuted}
                        keyboardType="numeric"
                      />
                      <Text style={{ color: tokens.color.textMuted }}>×</Text>
                      <TextInput
                        style={styles.setInput}
                        value={s.weight || s.weight === 0 ? String(s.weight) : ''}
                        onChangeText={v => updSet(ei, si, 'weight', v)}
                        placeholder="kg"
                        placeholderTextColor={tokens.color.textMuted}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity onPress={() => remSet(ei, si)}>
                        <Text style={{ color: tokens.color.textMuted, marginLeft: 8 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(ei)}>
                    <Text style={styles.addSetBtnText}>+ Add Set</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addExBtn} onPress={() => addEx()}>
                <Text style={styles.addExBtnText}>+ Add Exercise</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>
                {entryMode === 'plan' ? '📋 Plan Summary' : '📋 Review'}
              </Text>
              
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Type</Text>
                  <Text style={styles.summaryValue}>{WORKOUT_TYPES.find(t => t.id === workoutType)?.icon} {workoutType}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date</Text>
                  <Text style={styles.summaryValue}>{dateStr}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Duration</Text>
                  <Text style={styles.summaryValue}>{durMin} min</Text>
                </View>
                
                {entryMode === 'plan' ? (
                  <>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Target</Text>
                      <Text style={styles.summaryValue}>{targetDist || '-'} km</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Goal Time</Text>
                      <Text style={styles.summaryValue}>
                        {targetHours || '0'}h {targetMinutes || '0'}m {targetSeconds || '0'}s
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Priority</Text>
                      <View style={[styles.priorityBadge, sessionPurpose === 'b-race' ? styles.badgeB : styles.badgeC]}>
                        <Text style={styles.priorityBadgeText}>{sessionPurpose === 'b-race' ? 'B Race' : 'C Race'}</Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Distance</Text>
                      <Text style={styles.summaryValue}>{distanceKm || '-'} km</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Avg HR</Text>
                      <Text style={styles.summaryValue}>{avgHr || '-'} bpm</Text>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.loadPreviewCard}>
                <Text style={styles.loadPreviewTitle}>Estimated Load Impact</Text>
                <View style={styles.loadRow}>
                  <Text style={styles.loadLabel}>Acute Load</Text>
                  <Text style={styles.loadValue}>
                    +{Math.round(parseInt(durMin || '0') * (entryMode === 'plan' ? 0.8 : 0.6))} AU
                  </Text>
                </View>
                <View style={styles.loadBarBg}>
                  <View style={[styles.loadBarFill, { width: '65%' }]} />
                </View>
                <Text style={styles.loadHint}>This will be added to your acute load</Text>
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.continueBtn, step === 0 && styles.continueBtnFull]}
            onPress={() => {
              if (step < 4) setStep(s => s + 1);
              else handleSave();
            }}
            disabled={!canContinue() || saving}
          >
            <Text style={styles.continueBtnText}>
              {saving ? 'Saving...' : step < 4 ? 'Continue →' : '💾 Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space.md,
    paddingTop: 60,
    paddingBottom: tokens.space.sm,
  },
  back: { fontSize: 20, color: tokens.color.textMuted },
  headerTitle: { fontSize: tokens.font.lg, fontWeight: '600', color: tokens.color.textPrimary },
  content: { flex: 1, paddingHorizontal: tokens.space.md },
  stepContent: { paddingTop: tokens.space.lg, paddingBottom: tokens.space.md },
  stepTitle: { fontSize: tokens.font.xl, fontWeight: 'bold', color: tokens.color.textPrimary, marginBottom: tokens.space.lg },
  row: { flexDirection: 'row', alignItems: 'center' },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  entryModeGrid: {
    flexDirection: 'row',
    gap: tokens.space.md,
  },
  modeCard: {
    flex: 1,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    padding: tokens.space.lg,
    borderWidth: 2,
    borderColor: tokens.color.border,
    alignItems: 'center',
  },
  modeCardActive: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primary + '10',
  },
  modeIcon: {
    fontSize: 32,
    marginBottom: tokens.space.sm,
  },
  modeTitle: {
    fontSize: tokens.font.md,
    fontWeight: 'bold',
    color: tokens.color.textPrimary,
  },
  modeDesc: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  typeCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: tokens.space.sm,
  },
  typeCardActive: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primaryMuted,
  },
  typeIcon: { fontSize: 32 },
  fieldLabel: { fontSize: tokens.font.sm, color: tokens.color.textMuted, marginBottom: 4, marginTop: tokens.space.lg },
  fieldHint: { fontSize: tokens.font.xs, color: tokens.color.textMuted, marginTop: 2 },
  input: {
    backgroundColor: tokens.color.surface,
    color: tokens.color.textPrimary,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    fontSize: tokens.font.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: tokens.space.sm },
  muscleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm },
  exCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
    padding: tokens.space.sm,
    marginBottom: tokens.space.sm,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  exHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: tokens.space.xs },
  exName: { flex: 1, color: tokens.color.textPrimary, fontSize: tokens.font.md, borderBottomWidth: 1, borderBottomColor: tokens.color.border, paddingBottom: 4 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  setNum: { fontSize: tokens.font.xs, color: tokens.color.textMuted, width: 32 },
  setInput: { backgroundColor: tokens.color.elevated, color: tokens.color.textPrimary, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, width: 56, textAlign: 'center', fontSize: tokens.font.sm },
  addSet: { fontSize: tokens.font.sm, color: tokens.color.primary, marginTop: 6 },
  addExBtn: { backgroundColor: tokens.color.surface, borderRadius: tokens.radius.sm, padding: tokens.space.md, alignItems: 'center', borderWidth: 1, borderColor: tokens.color.border, borderStyle: 'dashed' },
  addExText: { color: tokens.color.primary, fontSize: tokens.font.md, fontWeight: '600' },
  libToggle: { fontSize: tokens.font.sm, color: tokens.color.primary, marginVertical: tokens.space.sm },
  libList: { backgroundColor: tokens.color.surface, borderRadius: tokens.radius.sm, maxHeight: 200 },
  libItem: { padding: tokens.space.sm, borderBottomWidth: 1, borderBottomColor: tokens.color.border },
  libName: { fontSize: tokens.font.sm, color: tokens.color.textPrimary, fontWeight: '500' },
  libMuscles: { fontSize: tokens.font.xs, color: tokens.color.textMuted },
  loadPreviewBox: { backgroundColor: tokens.color.surface, borderRadius: tokens.radius.md, padding: tokens.space.md, marginTop: tokens.space.md },
  summaryCard: { backgroundColor: tokens.color.surface, borderRadius: tokens.radius.md, padding: tokens.space.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: tokens.space.sm, borderBottomWidth: 1, borderBottomColor: tokens.color.border },
  summaryLabel: { fontSize: tokens.font.sm, color: tokens.color.textMuted },
  summaryValue: { fontSize: tokens.font.md, fontWeight: '600', color: tokens.color.textPrimary, textTransform: 'capitalize' },
  priorityBadge: { paddingHorizontal: tokens.space.sm, paddingVertical: 2, borderRadius: tokens.radius.sm },
  badgeB: { backgroundColor: tokens.color.warning + '30' },
  badgeC: { backgroundColor: tokens.color.primary + '30' },
  priorityBadgeText: { fontSize: tokens.font.xs, fontWeight: 'bold', color: tokens.color.textPrimary },
  loadPreviewCard: { backgroundColor: tokens.color.surface, borderRadius: tokens.radius.md, padding: tokens.space.md, marginTop: tokens.space.lg },
  loadPreviewTitle: { fontSize: tokens.font.md, fontWeight: '600', color: tokens.color.textPrimary, marginBottom: tokens.space.md },
  loadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.space.sm },
  loadValue: { fontSize: tokens.font.lg, fontWeight: 'bold', color: tokens.color.primary },
  loadVal: { fontSize: 32, fontWeight: 'bold', color: tokens.color.primary, textAlign: 'center' },
  loadLabel: { fontSize: tokens.font.sm, color: tokens.color.textMuted, textAlign: 'center', marginTop: 4 },
  loadBarBg: { height: 8, backgroundColor: tokens.color.border, borderRadius: 4, marginTop: tokens.space.md, overflow: 'hidden' },
  loadBarFill: { height: '100%', backgroundColor: tokens.color.primary, borderRadius: 4 },
  loadHint: { fontSize: tokens.font.xs, color: tokens.color.textMuted, textAlign: 'center', marginTop: tokens.space.sm },
  loadPreview: { gap: tokens.space.xs },
  loadPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm },
  loadPreviewBullet: { color: tokens.color.primary, fontSize: 16, marginRight: -4 },
  loadPreviewLabel: { fontSize: tokens.font.sm, color: tokens.color.textSecondary, width: 80 },
  loadPreviewVal: { fontSize: tokens.font.sm, fontWeight: '600', color: tokens.color.textPrimary, width: 40 },
  loadPreviewBar: { flex: 1, height: 4, backgroundColor: tokens.color.border, borderRadius: 2 },
  loadPreviewFill: { height: '100%', backgroundColor: tokens.color.primary, borderRadius: 2 },
  reviewEx: { paddingLeft: tokens.space.sm, borderLeftWidth: 2, borderLeftColor: tokens.color.primary, marginBottom: tokens.space.sm },
  reviewExName: { fontSize: tokens.font.md, color: tokens.color.textPrimary, fontWeight: '500' },
  reviewExSets: { fontSize: tokens.font.sm, color: tokens.color.textMuted, marginTop: 2 },
  noExNote: { fontSize: tokens.font.sm, color: tokens.color.textMuted, textAlign: 'center', marginTop: tokens.space.lg },
  subtitle: { fontSize: tokens.font.md, color: tokens.color.textMuted, marginBottom: tokens.space.md },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    backgroundColor: tokens.color.elevated,
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  toggleLabel: {
    flex: 1,
    fontSize: tokens.font.sm,
    color: tokens.color.textSecondary,
  },
  purposeGrid: { flexDirection: 'row', gap: tokens.space.sm },
  purposeCard: { 
    flex: 1, 
    backgroundColor: tokens.color.surface, 
    borderRadius: tokens.radius.md, 
    padding: tokens.space.sm, 
    borderWidth: 1, 
    borderColor: tokens.color.border,
    alignItems: 'center'
  },
  purposeCardActive: { 
    backgroundColor: tokens.color.primary, 
    borderColor: tokens.color.primary 
  },
  purposeLabel: { fontSize: tokens.font.sm, fontWeight: 'bold', color: tokens.color.textPrimary },
  purposeDesc: { fontSize: 10, color: tokens.color.textMuted, marginTop: 2, textAlign: 'center' },
  purposeTextActive: { color: '#fff' },
  purposeTextActiveMuted: { color: 'rgba(255,255,255,0.7)' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.space.sm, marginTop: tokens.space.sm },
  timeInputGroup: { flexDirection: 'row', alignItems: 'center' },
  timeInput: { 
    backgroundColor: tokens.color.surface, 
    borderRadius: tokens.radius.sm, 
    paddingHorizontal: tokens.space.sm, 
    paddingVertical: tokens.space.sm, 
    fontSize: tokens.font.lg, 
    fontWeight: 'bold',
    width: 50, 
    textAlign: 'center',
    borderWidth: 1, 
    borderColor: tokens.color.border,
    color: tokens.color.textPrimary,
  },
  timeLabel: { fontSize: tokens.font.sm, color: tokens.color.textMuted, marginLeft: 4 },
  timeSep: { fontSize: tokens.font.lg, fontWeight: 'bold', color: tokens.color.textPrimary },
  footer: { flexDirection: 'row', padding: tokens.space.md, paddingBottom: tokens.space.xl, gap: tokens.space.md },
  backBtn: { flex: 1, backgroundColor: tokens.color.surface, borderRadius: tokens.radius.sm, padding: tokens.space.md, alignItems: 'center', borderWidth: 1, borderColor: tokens.color.border },
  backBtnText: { color: tokens.color.textPrimary, fontSize: tokens.font.md, fontWeight: '600' },
  continueBtn: { flex: 2, backgroundColor: tokens.color.primary, borderRadius: tokens.radius.sm, padding: tokens.space.md, alignItems: 'center' },
  continueBtnFull: { flex: 1 },
  continueBtnDisabled: { opacity: 0.3 },
  continueBtnText: { color: '#fff', fontSize: tokens.font.lg, fontWeight: 'bold' },
});
