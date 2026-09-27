import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren} from 'react';
import {Alert} from 'react-native';
import {onAuthStateChanged, type User} from '@react-native-firebase/auth';
import {auth, db} from '../config/firebase';
import {ensureUserAndCircle, subscribeToCircle, subscribeToLocations, subscribeToMemberProfiles, subscribeToProfile} from '../services/circles';
import {locationPublisher} from '../services/location';
import {registerPushToken} from '../services/notifications';
import {loadSettings, saveSettings} from '../services/settings';
import {safetyMonitor} from '../services/safety';
import {sendAlert, subscribeToIncomingAlerts} from '../services/alerts';
import {doc, setDoc} from '@react-native-firebase/firestore';
import {defaultSettings, type AppSettings, type Circle, type LocationRecord, type UserProfile} from '../types';

type PendingCrash = {secondsRemaining: number};
type AppValue = {
  user: User | null;
  profile: UserProfile | null;
  circle: Circle | null;
  locations: LocationRecord[];
  members: Record<string, UserProfile>;
  settings: AppSettings;
  currentLocation: LocationRecord | null;
  pendingCrash: PendingCrash | null;
  initializing: boolean;
  updateSettings: (next: AppSettings) => Promise<void>;
  cancelCrashAlert: () => void;
};

const AppContext = createContext<AppValue | null>(null);

export function AppProvider({children}: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [members, setMembers] = useState<Record<string, UserProfile>>({});
  const [settings, setSettings] = useState(defaultSettings);
  const [currentLocation, setCurrentLocation] = useState<LocationRecord | null>(null);
  const [pendingCrash, setPendingCrash] = useState<PendingCrash | null>(null);
  const [initializing, setInitializing] = useState(true);
  const crashTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    void loadSettings().then(setSettings);
    return onAuthStateChanged(auth, async nextUser => {
      setUser(nextUser);
      setProfile(null);
      setCircle(null);
      setLocations([]);
      if (!nextUser) {
        setInitializing(false);
        return;
      }
      try {
        await ensureUserAndCircle(nextUser);
      } finally {
        setInitializing(false);
      }
    });
  }, []);

  useEffect(() => user ? subscribeToProfile(user.uid, setProfile) : undefined, [user]);
  useEffect(() => profile?.activeCircleId ? subscribeToCircle(profile.activeCircleId, setCircle) : undefined, [profile?.activeCircleId]);
  useEffect(() => circle ? subscribeToLocations(circle.id, setLocations) : undefined, [circle]);
  useEffect(() => circle ? subscribeToMemberProfiles(circle.memberUids, setMembers) : undefined, [circle]);
  useEffect(() => user && circle ? subscribeToIncomingAlerts(circle.id, user.uid, message => Alert.alert('Family alert', message)) : undefined, [user, circle]);

  const cancelCrashAlert = useCallback(() => {
    if (crashTimer.current) {
      clearInterval(crashTimer.current);
      crashTimer.current = null;
    }
    setPendingCrash(null);
  }, []);

  useEffect(() => {
    if (!user || !circle) {
      void locationPublisher.stop();
      safetyMonitor.stop();
      return;
    }

    const alert = (kind: 'speeding' | 'crash', message: string) =>
      sendAlert(circle.id, user.uid, kind, message, locationPublisher.getCurrent() || undefined);

    const startCrashCountdown = () => {
      if (crashTimer.current) return;
      const deadline = Date.now() + settingsRef.current.crashCountdownSeconds * 1000;
      setPendingCrash({secondsRemaining: settingsRef.current.crashCountdownSeconds});
      crashTimer.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        setPendingCrash({secondsRemaining: remaining});
        if (remaining === 0) {
          if (crashTimer.current) clearInterval(crashTimer.current);
          crashTimer.current = null;
          setPendingCrash(null);
          void alert('crash', 'Possible crash detected. Please check in.');
        }
      }, 500);
    };

    safetyMonitor.start(settings, {
      onCrashCandidate: startCrashCountdown,
      onSpeeding: mph => void alert('speeding', `Speed alert: ${mph} mph`),
    });
    void locationPublisher.start(user.uid, circle.id, settings, location => {
      setCurrentLocation(location);
      safetyMonitor.onLocation(location, settingsRef.current);
    }).catch(error => console.warn('[location] could not start', error));
    return () => {
      void locationPublisher.stop();
      safetyMonitor.stop();
    };
  }, [user, circle, settings]);

  useEffect(() => {
    if (!user) return;
    let unsubscribe: () => void = () => {};
    void registerPushToken(user.uid).then(value => { unsubscribe = value; });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => () => cancelCrashAlert(), [cancelCrashAlert]);

  const updateSettings = useCallback(async (next: AppSettings) => {
    setSettings(next);
    await Promise.all([
      saveSettings(next),
      user ? setDoc(doc(db, 'users', user.uid), {safetySettings: {speedingThresholdMph: next.speedingThresholdMph, lowBatteryThreshold: next.lowBatteryThreshold}}, {merge: true}) : Promise.resolve(),
    ]);
  }, [user]);

  const value = useMemo<AppValue>(() => ({
    user, profile, circle, locations, members, settings, currentLocation, pendingCrash,
    initializing, updateSettings, cancelCrashAlert,
  }), [user, profile, circle, locations, members, settings, currentLocation, pendingCrash, initializing, updateSettings, cancelCrashAlert]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used within AppProvider');
  return value;
}
