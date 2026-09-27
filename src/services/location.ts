import {AppState, type AppStateStatus, PermissionsAndroid, Platform} from 'react-native';
import Geolocation, {type GeolocationResponse} from '@react-native-community/geolocation';
import DeviceInfo from 'react-native-device-info';
import {collection, doc, serverTimestamp, writeBatch} from '@react-native-firebase/firestore';
import {db} from '../config/firebase';
import type {AppSettings, LocationRecord} from '../types';

type Listener = (location: LocationRecord) => void;

class LocationPublisher {
  private watchId: number | null = null;
  private appStateSubscription?: {remove: () => void};
  private lastWriteAt = 0;
  private lastDrivingAt = 0;
  private current: LocationRecord | null = null;

  async start(uid: string, circleId: string, settings: AppSettings, onLocation: Listener) {
    await this.stop();
    Geolocation.setRNConfiguration({skipPermissionRequests: false, authorizationLevel: 'always', enableBackgroundLocationUpdates: true});
    if (Platform.OS === 'android') {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    } else {
      await new Promise<void>((resolve, reject) => Geolocation.requestAuthorization(resolve, reject));
    }

    const beginWatch = (state: AppStateStatus) => {
      if (this.watchId !== null) {
        Geolocation.clearWatch(this.watchId);
      }
      const isForeground = state === 'active';
      this.watchId = Geolocation.watchPosition(
        position => void this.handlePosition(position, uid, circleId, settings, onLocation),
        error => console.warn('[location]', error.code, error.message),
        {
          enableHighAccuracy: isForeground,
          distanceFilter: isForeground ? 20 : 250,
          interval: settings.foregroundIntervalSeconds * 1000,
          fastestInterval: 15_000,
          useSignificantChanges: !isForeground,
        },
      );
    };

    beginWatch((AppState.currentState || 'active') as AppStateStatus);
    this.appStateSubscription = AppState.addEventListener('change', beginWatch);
  }

  private async handlePosition(position: GeolocationResponse, uid: string, circleId: string, settings: AppSettings, onLocation: Listener) {
    const now = Date.now();
    const speedMps = Math.max(position.coords.speed ?? 0, 0);
    if (speedMps >= 4.47) {
      this.lastDrivingAt = now;
    }
    const [batteryLevel, powerState] = await Promise.all([DeviceInfo.getBatteryLevel(), DeviceInfo.getPowerState()]);
    const location: LocationRecord = {
      uid,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      speedMps,
      heading: Math.max(position.coords.heading ?? 0, 0),
      accuracy: position.coords.accuracy,
      batteryLevel: Math.round(batteryLevel * 100),
      isCharging: powerState.batteryState === 'charging' || powerState.batteryState === 'full',
      isDriving: now - this.lastDrivingAt < 120_000,
    };
    this.current = location;
    onLocation(location);

    const minWriteGap = Math.max(settings.foregroundIntervalSeconds, 30) * 1000;
    if (now - this.lastWriteAt < minWriteGap) {
      return;
    }
    this.lastWriteAt = now;
    const batch = writeBatch(db);
    const payload = {...location, updatedAt: serverTimestamp()};
    batch.set(doc(db, 'circles', circleId, 'locations', uid), payload, {merge: true});
    batch.set(doc(collection(db, 'circles', circleId, 'locations', uid, 'history')), payload);
    batch.set(doc(db, 'users', uid), {
      lastKnownLocation: {latitude: location.latitude, longitude: location.longitude},
      batteryLevel: location.batteryLevel,
      lastUpdated: serverTimestamp(),
    }, {merge: true});
    await batch.commit();
  }

  getCurrent() {
    return this.current;
  }

  async stop() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.appStateSubscription?.remove();
    this.appStateSubscription = undefined;
  }
}

export const locationPublisher = new LocationPublisher();
