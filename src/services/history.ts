import {collection, limit, onSnapshot, orderBy, query, where} from '@react-native-firebase/firestore';
import {db} from '../config/firebase';
import type {LocationRecord} from '../types';

export function subscribeToHistory(circleId: string, uid: string, callback: (rows: LocationRecord[]) => void) {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const historyQuery = query(
    collection(db, 'circles', circleId, 'locations', uid, 'history'),
    where('updatedAt', '>=', since),
    orderBy('updatedAt', 'asc'),
    limit(1000),
  );
  return onSnapshot(historyQuery, snapshot => callback(snapshot.docs.map(item => item.data() as LocationRecord)));
}
