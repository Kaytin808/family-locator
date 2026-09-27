import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from '@react-native-firebase/firestore';
import type {User} from '@react-native-firebase/auth';
import {db} from '../config/firebase';
import type {Circle, LocationRecord, UserProfile} from '../types';

export async function ensureUserAndCircle(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const existing = await getDoc(userRef);
  if (existing.exists() && existing.data()?.activeCircleId) {
    return {uid: user.uid, ...(existing.data() as Omit<UserProfile, 'uid'>)};
  }

  const circleRef = doc(collection(db, 'circles'));
  const displayName = user.displayName || user.email?.split('@')[0] || 'Family member';
  await setDoc(circleRef, {
    name: `${displayName}'s family`,
    memberUids: [user.uid],
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  });
  const profile: UserProfile = {
    uid: user.uid,
    displayName,
    email: user.email || '',
    activeCircleId: circleRef.id,
  };
  await setDoc(userRef, {...profile, createdAt: serverTimestamp(), updatedAt: serverTimestamp()}, {merge: true});
  return profile;
}

export function subscribeToProfile(uid: string, callback: (profile: UserProfile | null) => void) {
  return onSnapshot(doc(db, 'users', uid), snapshot => {
    callback(snapshot.exists() ? {uid, ...(snapshot.data() as Omit<UserProfile, 'uid'>)} : null);
  });
}

export function subscribeToCircle(circleId: string, callback: (circle: Circle | null) => void) {
  return onSnapshot(doc(db, 'circles', circleId), snapshot => {
    callback(snapshot.exists() ? {id: snapshot.id, ...(snapshot.data() as Omit<Circle, 'id'>)} : null);
  });
}

export function subscribeToLocations(circleId: string, callback: (locations: LocationRecord[]) => void) {
  return onSnapshot(collection(db, 'circles', circleId, 'locations'), snapshot => {
    const rows = snapshot.docs.map(item => ({uid: item.id, ...item.data()} as LocationRecord));
    callback(rows);
  });
}

export function subscribeToMemberProfiles(uids: string[], callback: (profiles: Record<string, UserProfile>) => void) {
  const profiles: Record<string, UserProfile> = {};
  if (uids.length === 0) {
    callback(profiles);
    return () => undefined;
  }
  const unsubscribers: Unsubscribe[] = uids.map(uid =>
    onSnapshot(doc(db, 'users', uid), snapshot => {
      if (snapshot.exists()) {
        profiles[uid] = {uid, ...(snapshot.data() as Omit<UserProfile, 'uid'>)};
      } else {
        delete profiles[uid];
      }
      callback({...profiles});
    }),
  );
  return () => unsubscribers.forEach(unsubscribe => unsubscribe());
}
