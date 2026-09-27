import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useApp} from '../context/AppContext';
import {logout} from '../services/auth';
import {colors, spacing} from '../theme';

function Stepper({value, unit, step, min, max, onChange}: {value: number; unit: string; step: number; min: number; max: number; onChange: (value: number) => void}) {
  return <View style={styles.stepper}><Pressable style={styles.stepButton} onPress={() => onChange(Math.max(min, value - step))}><Text style={styles.stepText}>−</Text></Pressable><Text style={styles.value}>{value} {unit}</Text><Pressable style={styles.stepButton} onPress={() => onChange(Math.min(max, value + step))}><Text style={styles.stepText}>+</Text></Pressable></View>;
}

export function SettingsScreen() {
  const {profile, circle, settings, updateSettings} = useApp();
  const patch = (value: Partial<typeof settings>) => void updateSettings({...settings, ...value});

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View><Text style={styles.title}>Settings</Text><Text style={styles.subtitle}>{profile?.displayName} · {profile?.email}</Text></View>
        <View style={styles.section}><Text style={styles.sectionTitle}>LOCATION</Text><View style={styles.rowStack}><View><Text style={styles.label}>Foreground update interval</Text><Text style={styles.help}>Background uses battery-friendly significant changes.</Text></View><Stepper value={settings.foregroundIntervalSeconds} unit="sec" step={15} min={30} max={120} onChange={value => patch({foregroundIntervalSeconds: value})} /></View></View>
        <View style={styles.section}><Text style={styles.sectionTitle}>DRIVING SAFETY</Text><View style={styles.rowStack}><Text style={styles.label}>Speed alert threshold</Text><Stepper value={settings.speedingThresholdMph} unit="mph" step={5} min={30} max={120} onChange={value => patch({speedingThresholdMph: value})} /></View><View style={styles.row}><View style={styles.copy}><Text style={styles.label}>Crash detection</Text><Text style={styles.help}>Experimental; never substitutes for emergency services.</Text></View><Switch value={settings.crashDetectionEnabled} onValueChange={value => patch({crashDetectionEnabled: value})} trackColor={{true: colors.primary}} /></View><View style={styles.rowStack}><Text style={styles.label}>Crash countdown</Text><Stepper value={settings.crashCountdownSeconds} unit="sec" step={5} min={15} max={30} onChange={value => patch({crashCountdownSeconds: value})} /></View></View>
        <View style={styles.section}><Text style={styles.sectionTitle}>CIRCLE</Text><View style={styles.row}><Text style={styles.label}>Name</Text><Text style={styles.detail}>{circle?.name}</Text></View><View style={styles.row}><Text style={styles.label}>Members</Text><Text style={styles.detail}>{circle?.memberUids.length || 0}</Text></View></View>
        <Pressable style={styles.signOut} onPress={() => Alert.alert('Sign out?', 'Location sharing stops on this phone until you sign back in.', [{text: 'Cancel'}, {text: 'Sign out', style: 'destructive', onPress: () => void logout()}])}><Text style={styles.signOutText}>Sign out</Text></Pressable>
        <Text style={styles.disclaimer}>Family Locator is a personal coordination tool, not an emergency monitoring service. GPS, motion sensing, background execution, and notifications can be delayed or unavailable.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background}, content: {padding: spacing.lg, gap: spacing.lg}, title: {fontSize: 34, fontWeight: '800', color: colors.ink}, subtitle: {marginTop: spacing.sm, color: colors.muted}, section: {backgroundColor: colors.surface, borderRadius: 20, padding: spacing.md, gap: spacing.lg}, sectionTitle: {fontSize: 11, letterSpacing: 1.5, color: colors.primary, fontWeight: '800'}, row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md}, rowStack: {gap: spacing.sm}, copy: {flex: 1}, label: {fontSize: 16, fontWeight: '700', color: colors.ink}, help: {fontSize: 12, lineHeight: 17, color: colors.muted, marginTop: 3}, detail: {color: colors.muted},
  stepper: {flexDirection: 'row', alignItems: 'center', gap: spacing.md}, stepButton: {width: 38, height: 38, borderRadius: 12, backgroundColor: colors.mapTint, alignItems: 'center', justifyContent: 'center'}, stepText: {fontSize: 24, color: colors.primaryDark, fontWeight: '600'}, value: {minWidth: 78, textAlign: 'center', color: colors.ink, fontWeight: '800'}, signOut: {borderWidth: 1, borderColor: colors.danger, borderRadius: 16, padding: spacing.md, alignItems: 'center'}, signOutText: {color: colors.danger, fontWeight: '800'}, disclaimer: {fontSize: 12, lineHeight: 18, color: colors.muted, textAlign: 'center'},
});
