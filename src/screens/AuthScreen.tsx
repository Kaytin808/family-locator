import React, {useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Field} from '../components/Field';
import {PrimaryButton} from '../components/PrimaryButton';
import {login, register} from '../services/auth';
import {colors, spacing} from '../theme';

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || password.length < 6 || (mode === 'register' && !displayName.trim())) {
      Alert.alert('Check your details', 'Enter a name, valid email, and a password of at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(displayName, email, password);
    } catch (error) {
      Alert.alert('Could not sign in', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>PRIVATE FAMILY CIRCLE</Text>
          <Text style={styles.title}>Know they’re safe, without the noise.</Text>
          <Text style={styles.subtitle}>Location sharing built for the two people who matter here.</Text>
        </View>
        <View style={styles.form}>
          {mode === 'register' && <Field label="Your name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />}
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          <PrimaryButton label={mode === 'login' ? 'Sign in' : 'Create account'} onPress={submit} busy={busy} />
          <Text onPress={() => setMode(mode === 'login' ? 'register' : 'login')} style={styles.switch}>
            {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background}, root: {flex: 1, justifyContent: 'space-between', padding: spacing.lg},
  hero: {paddingTop: spacing.xl, gap: spacing.md}, eyebrow: {color: colors.primary, letterSpacing: 2, fontSize: 12, fontWeight: '800'},
  title: {fontSize: 42, lineHeight: 47, color: colors.ink, fontWeight: '800'}, subtitle: {fontSize: 18, lineHeight: 26, color: colors.muted},
  form: {gap: spacing.md, paddingBottom: spacing.xl}, switch: {textAlign: 'center', color: colors.primaryDark, fontWeight: '700', padding: spacing.sm},
});
