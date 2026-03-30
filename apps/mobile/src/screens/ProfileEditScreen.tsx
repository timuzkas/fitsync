import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { tokens } from '../tokens';
import { useDeviceStore, AthleteProfile } from '../store/useDeviceStore';

type ProfileEditRouteParams = {
  ProfileEdit: { profile?: AthleteProfile };
};

export default function ProfileEditScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ProfileEditRouteParams, 'ProfileEdit'>>();
  const { setAthleteProfile } = useDeviceStore();
  
  const existing = route.params?.profile || null;

  const [height, setHeight] = useState(existing?.height?.toString() || '');
  const [weight, setWeight] = useState(existing?.weight?.toString() || '');
  const [sex, setSex] = useState<'M' | 'F' | undefined>(existing?.sex);
  const [maxHR, setMaxHR] = useState(existing?.maxHR?.toString() || '');
  const [restHR, setRestHR] = useState(existing?.restHR?.toString() || '');

  function saveProfile() {
    const profile: AthleteProfile = {
      height: height ? parseInt(height) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      sex,
      maxHR: maxHR ? parseInt(maxHR) : undefined,
      restHR: restHR ? parseInt(restHR) : undefined,
    };
    setAthleteProfile(profile);
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Body Metrics</Text>
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder="175"
              placeholderTextColor={tokens.color.textMuted}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="70"
              placeholderTextColor={tokens.color.textMuted}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Sex</Text>
            <View style={styles.sexRow}>
              <TouchableOpacity
                style={[styles.sexBtn, sex === 'M' && styles.sexBtnActive]}
                onPress={() => setSex('M')}
              >
                <Text style={[styles.sexBtnText, sex === 'M' && styles.sexBtnTextActive]}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sexBtn, sex === 'F' && styles.sexBtnActive]}
                onPress={() => setSex('F')}
              >
                <Text style={[styles.sexBtnText, sex === 'F' && styles.sexBtnTextActive]}>Female</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Heart Rate</Text>
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Max HR (bpm)</Text>
            <TextInput
              style={styles.input}
              value={maxHR}
              onChangeText={setMaxHR}
              placeholder="190"
              placeholderTextColor={tokens.color.textMuted}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Resting HR (bpm)</Text>
            <TextInput
              style={styles.input}
              value={restHR}
              onChangeText={setRestHR}
              placeholder="60"
              placeholderTextColor={tokens.color.textMuted}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
          <Text style={styles.saveBtnText}>Save Profile</Text>
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
  card: {
    backgroundColor: tokens.color.surface, borderRadius: tokens.radius.md,
    padding: tokens.space.md, borderWidth: 1, borderColor: tokens.color.border,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.space.md },
  inputLabel: { fontSize: tokens.font.md, color: tokens.color.textSecondary },
  input: {
    width: 120, backgroundColor: tokens.color.elevated, color: tokens.color.textPrimary,
    borderRadius: tokens.radius.sm, paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.sm,
    fontSize: tokens.font.md, textAlign: 'right', borderWidth: 1, borderColor: tokens.color.border,
  },
  sexRow: { flexDirection: 'row', gap: tokens.space.sm },
  sexBtn: {
    paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.sm,
    backgroundColor: tokens.color.elevated, borderRadius: tokens.radius.sm,
    borderWidth: 1, borderColor: tokens.color.border,
  },
  sexBtnActive: { borderColor: tokens.color.primary, backgroundColor: tokens.color.primaryMuted },
  sexBtnText: { fontSize: tokens.font.sm, color: tokens.color.textMuted },
  sexBtnTextActive: { color: tokens.color.textPrimary, fontWeight: '600' },
  footer: { padding: tokens.space.md, paddingBottom: tokens.space.xl },
  saveBtn: {
    backgroundColor: tokens.color.primary, borderRadius: tokens.radius.sm,
    padding: tokens.space.md, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: tokens.font.lg, fontWeight: 'bold' },
});
