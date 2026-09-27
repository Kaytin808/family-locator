import React from 'react';
import {StyleSheet, Text, TextInput, type TextInputProps, View} from 'react-native';
import {colors, spacing} from '../theme';

export function Field({label, ...props}: TextInputProps & {label: string}) {
  return <View style={styles.group}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor="#8A969C" {...props} style={[styles.input, props.style]} /></View>;
}

const styles = StyleSheet.create({
  group: {gap: spacing.sm}, label: {color: colors.ink, fontSize: 13, fontWeight: '700'},
  input: {backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, color: colors.ink, fontSize: 16, paddingHorizontal: spacing.md, minHeight: 50},
});
