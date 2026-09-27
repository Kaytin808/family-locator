import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {colors, spacing} from '../theme';

export function LoadingView({label = 'Loading…'}: {label?: string}) {
  return <View style={styles.root}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.label}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  root: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background},
  label: {marginTop: spacing.md, color: colors.muted, fontSize: 16},
});
