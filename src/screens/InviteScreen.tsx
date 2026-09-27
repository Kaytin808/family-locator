import React, {useEffect, useState} from 'react';
import {Alert, Share, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {Field} from '../components/Field';
import {PrimaryButton} from '../components/PrimaryButton';
import {useApp} from '../context/AppContext';
import {acceptInvite, createInvite} from '../services/invites';
import {colors, spacing} from '../theme';
import type {RootTabParamList} from '../navigation/AppNavigator';

type Props = BottomTabScreenProps<RootTabParamList, 'Invite'>;

export function InviteScreen({route}: Props) {
  const {circle} = useApp();
  const [code, setCode] = useState(route.params?.inviteId || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (route.params?.inviteId) setCode(route.params.inviteId); }, [route.params?.inviteId]);

  const shareInvite = async () => {
    if (!circle) return;
    setBusy(true);
    try {
      const invite = await createInvite(circle.id);
      await Share.share({title: 'Join my family circle', message: `Join my private family circle: ${invite.url}\n\nInvite code: ${invite.inviteId}`});
    } catch (error) {
      Alert.alert('Could not create invite', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      await acceptInvite(code);
      Alert.alert('Circle joined', 'You are now sharing with your family member.');
      setCode('');
    } catch (error) {
      Alert.alert('Could not join', error instanceof Error ? error.message : 'The invite may be invalid or expired.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.hero}><Text style={styles.eyebrow}>ONE-TIME LINK</Text><Text style={styles.title}>Bring your person into the circle.</Text><Text style={styles.subtitle}>Invites expire after 24 hours and can only be used once.</Text></View>
      <View style={styles.card}><PrimaryButton label="Share a private invite" onPress={shareInvite} busy={busy} /><View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>OR JOIN WITH A CODE</Text><View style={styles.line} /></View><Field label="Invite code" placeholder="Paste code from your invite" value={code} onChangeText={setCode} autoCapitalize="none" /><PrimaryButton label="Join circle" tone="neutral" onPress={join} disabled={!code.trim()} busy={busy} /></View>
      <Text style={styles.note}>Only invite people you trust. Members can see one another’s live and recent location.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background, padding: spacing.lg}, hero: {gap: spacing.md, paddingVertical: spacing.lg}, eyebrow: {color: colors.primary, letterSpacing: 2, fontSize: 12, fontWeight: '800'}, title: {fontSize: 38, lineHeight: 44, fontWeight: '800', color: colors.ink}, subtitle: {fontSize: 17, lineHeight: 24, color: colors.muted},
  card: {backgroundColor: colors.surface, borderRadius: 22, padding: spacing.lg, gap: spacing.md}, divider: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm}, line: {height: 1, backgroundColor: colors.line, flex: 1}, or: {fontSize: 10, letterSpacing: 1, color: colors.muted, fontWeight: '800'}, note: {marginTop: spacing.lg, color: colors.muted, textAlign: 'center', lineHeight: 20},
});
