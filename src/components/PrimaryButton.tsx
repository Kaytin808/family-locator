import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle} from 'react-native';
import {colors, spacing} from '../theme';

type Props = {label: string; onPress: () => void; disabled?: boolean; busy?: boolean; tone?: 'primary' | 'danger' | 'neutral'; style?: ViewStyle};

export function PrimaryButton({label, onPress, disabled, busy, tone = 'primary', style}: Props) {
  const backgroundColor = tone === 'danger' ? colors.danger : tone === 'neutral' ? colors.ink : colors.primary;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled || busy} onPress={onPress}
      style={({pressed}) => [styles.button, {backgroundColor}, (disabled || busy) && styles.disabled, pressed && styles.pressed, style]}>
      {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {minHeight: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg},
  label: {color: '#fff', fontSize: 16, fontWeight: '700'}, disabled: {opacity: 0.5}, pressed: {transform: [{scale: 0.985}]},
});
