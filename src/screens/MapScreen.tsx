import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import MapView, {Marker, Polyline, PROVIDER_DEFAULT, type Region} from 'react-native-maps';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useApp} from '../context/AppContext';
import {sendAlert} from '../services/alerts';
import {subscribeToHistory} from '../services/history';
import {colors, shadow, spacing} from '../theme';
import type {LocationRecord} from '../types';

const fallbackRegion: Region = {latitude: 37.3349, longitude: -122.009, latitudeDelta: 0.08, longitudeDelta: 0.08};

export function MapScreen() {
  const {circle, currentLocation, locations, members, user, pendingCrash, cancelCrashAlert} = useApp();
  const map = useRef<MapView>(null);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [history, setHistory] = useState<LocationRecord[]>([]);
  const center = currentLocation || locations[0];

  useEffect(() => {
    if (!circle || !selectedUid) {
      setHistory([]);
      return;
    }
    return subscribeToHistory(circle.id, selectedUid, setHistory);
  }, [circle, selectedUid]);

  useEffect(() => {
    if (center) {
      map.current?.animateToRegion({...center, latitudeDelta: 0.025, longitudeDelta: 0.025}, 500);
    }
  }, [center]);

  const orderedLocations = useMemo(() => [...locations].sort((a, b) => a.uid === user?.uid ? -1 : b.uid === user?.uid ? 1 : 0), [locations, user]);

  const quickAlert = async (kind: 'checkin' | 'sos') => {
    if (!circle || !user) return;
    try {
      await sendAlert(circle.id, user.uid, kind, kind === 'sos' ? 'Need help — please contact me now.' : 'I’m OK. Just checking in.', currentLocation || undefined);
      Alert.alert(kind === 'sos' ? 'Help alert sent' : 'Checked in', 'Your family circle has been notified.');
    } catch (error) {
      Alert.alert('Could not send alert', error instanceof Error ? error.message : 'Try again.');
    }
  };

  return (
    <View style={styles.root}>
      <MapView ref={map} provider={PROVIDER_DEFAULT} style={StyleSheet.absoluteFill} initialRegion={center ? {...center, latitudeDelta: 0.025, longitudeDelta: 0.025} : fallbackRegion} showsUserLocation showsCompass>
        {orderedLocations.map(location => (
          <Marker key={location.uid} coordinate={location} onPress={() => setSelectedUid(location.uid)} title={members[location.uid]?.displayName || 'Family member'}
            description={`${location.isDriving ? 'Driving · ' : ''}${Math.round(location.batteryLevel)}% battery`} pinColor={location.uid === user?.uid ? colors.primary : colors.secondary} />
        ))}
        {history.length > 1 && <Polyline coordinates={history} strokeColor={colors.primary} strokeWidth={4} />}
      </MapView>
      <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
        <View style={[styles.header, shadow]}>
          <View><Text style={styles.eyebrow}>YOUR CIRCLE</Text><Text style={styles.circleName}>{circle?.name || 'Family'}</Text></View>
          <Text style={styles.live}>{locations.length} live</Text>
        </View>
        <View style={styles.bottom}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberRow}>
            {orderedLocations.map(location => (
              <Pressable key={location.uid} onPress={() => setSelectedUid(selectedUid === location.uid ? null : location.uid)} style={[styles.memberCard, selectedUid === location.uid && styles.memberSelected]}>
                <View style={[styles.avatar, {backgroundColor: location.uid === user?.uid ? colors.primary : colors.secondary}]}><Text style={styles.avatarText}>{(members[location.uid]?.displayName || '?')[0]}</Text></View>
                <View><Text style={styles.memberName}>{location.uid === user?.uid ? 'You' : members[location.uid]?.displayName || 'Member'}</Text><Text style={styles.meta}>{location.isDriving ? 'Driving' : 'Stationary'} · {location.batteryLevel}%</Text></View>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable style={[styles.action, styles.ok]} onPress={() => void quickAlert('checkin')}><Text style={styles.actionText}>I’m OK</Text></Pressable>
            <Pressable style={[styles.action, styles.sos]} onPress={() => void quickAlert('sos')}><Text style={styles.actionText}>SOS</Text></Pressable>
          </View>
        </View>
      </SafeAreaView>
      <Modal transparent visible={Boolean(pendingCrash)} animationType="fade">
        <View style={styles.modalBackdrop}><View style={styles.crashCard}><Text style={styles.crashTitle}>Possible crash detected</Text><Text style={styles.crashBody}>An alert will be sent in {pendingCrash?.secondsRemaining ?? 0} seconds.</Text><Pressable style={[styles.action, styles.ok]} onPress={cancelCrashAlert}><Text style={styles.actionText}>I’m OK — cancel</Text></Pressable></View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1}, overlay: {flex: 1, justifyContent: 'space-between'}, header: {margin: spacing.md, padding: spacing.md, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.96)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  eyebrow: {fontSize: 10, letterSpacing: 1.5, color: colors.primary, fontWeight: '800'}, circleName: {fontSize: 20, color: colors.ink, fontWeight: '800'}, live: {color: colors.primary, fontWeight: '800'},
  bottom: {paddingBottom: spacing.sm}, memberRow: {paddingHorizontal: spacing.md, gap: spacing.sm}, memberCard: {backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 18, padding: spacing.md, minWidth: 190, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', ...shadow}, memberSelected: {borderWidth: 2, borderColor: colors.primary},
  avatar: {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'}, avatarText: {color: '#fff', fontWeight: '800'}, memberName: {fontWeight: '800', color: colors.ink}, meta: {fontSize: 12, color: colors.muted, marginTop: 2},
  actions: {flexDirection: 'row', gap: spacing.sm, padding: spacing.md}, action: {minHeight: 52, flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center'}, ok: {backgroundColor: colors.primary}, sos: {backgroundColor: colors.danger}, actionText: {color: '#fff', fontWeight: '800', fontSize: 16},
  modalBackdrop: {flex: 1, backgroundColor: 'rgba(18,25,29,.7)', justifyContent: 'center', padding: spacing.lg}, crashCard: {backgroundColor: colors.surface, padding: spacing.lg, borderRadius: 24, gap: spacing.md}, crashTitle: {fontSize: 28, fontWeight: '800', color: colors.danger}, crashBody: {fontSize: 17, lineHeight: 24, color: colors.ink},
});
