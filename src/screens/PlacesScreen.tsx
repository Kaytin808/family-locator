import React, {useEffect, useState} from 'react';
import {Alert, FlatList, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Field} from '../components/Field';
import {PrimaryButton} from '../components/PrimaryButton';
import {useApp} from '../context/AppContext';
import {addPlace, removePlace, subscribeToPlaces} from '../services/places';
import {colors, spacing} from '../theme';
import type {Place} from '../types';

export function PlacesScreen() {
  const {circle, currentLocation, user} = useApp();
  const [places, setPlaces] = useState<Place[]>([]);
  const [name, setName] = useState('');
  const [radius, setRadius] = useState('200');
  const [busy, setBusy] = useState(false);

  useEffect(() => circle ? subscribeToPlaces(circle.id, setPlaces) : undefined, [circle]);

  const save = async () => {
    const radiusMeters = Number(radius);
    if (!circle || !user || !currentLocation || !name.trim() || radiusMeters < 50 || radiusMeters > 5000) {
      Alert.alert('Place not ready', 'Wait for your location, add a name, and choose a radius from 50–5000 meters.');
      return;
    }
    setBusy(true);
    try {
      await addPlace(circle.id, user.uid, name, currentLocation, radiusMeters);
      setName('');
    } catch (error) {
      Alert.alert('Could not save place', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>Places</Text><Text style={styles.subtitle}>Arrival and departure alerts around the locations you care about.</Text></View>
      <View style={styles.form}>
        <Field label="Place name" placeholder="Home" value={name} onChangeText={setName} />
        <Field label="Radius in meters" value={radius} onChangeText={setRadius} keyboardType="number-pad" />
        <PrimaryButton label="Add at my current location" onPress={save} busy={busy} disabled={!currentLocation} />
      </View>
      <FlatList data={places} keyExtractor={item => item.id} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.empty}>No saved places yet.</Text>}
        renderItem={({item}) => <View style={styles.place}><View style={styles.placeDot} /><View style={styles.placeCopy}><Text style={styles.placeName}>{item.name}</Text><Text style={styles.placeMeta}>{item.radius} m radius</Text></View><Text style={styles.delete} onPress={() => circle && void removePlace(circle.id, item.id)}>Remove</Text></View>} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background}, header: {padding: spacing.lg, gap: spacing.sm}, title: {fontSize: 34, fontWeight: '800', color: colors.ink}, subtitle: {fontSize: 16, lineHeight: 23, color: colors.muted},
  form: {paddingHorizontal: spacing.lg, gap: spacing.md}, list: {padding: spacing.lg, gap: spacing.sm}, empty: {color: colors.muted, textAlign: 'center', marginTop: spacing.lg},
  place: {backgroundColor: colors.surface, padding: spacing.md, borderRadius: 16, flexDirection: 'row', alignItems: 'center'}, placeDot: {width: 13, height: 13, borderRadius: 7, backgroundColor: colors.secondary, marginRight: spacing.md}, placeCopy: {flex: 1}, placeName: {fontSize: 16, fontWeight: '800', color: colors.ink}, placeMeta: {fontSize: 13, color: colors.muted, marginTop: 3}, delete: {color: colors.danger, fontWeight: '700', padding: spacing.sm},
});
