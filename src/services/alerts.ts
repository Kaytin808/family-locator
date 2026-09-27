import {addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp} from '@react-native-firebase/firestore';
import {db} from '../config/firebase';
import type {AlertKind, Coordinates} from '../types';

export async function sendAlert(
  circleId: string,
  senderUid: string,
  kind: AlertKind,
  message: string,
  location?: Coordinates,
) {
  await addDoc(collection(db, 'circles', circleId, 'alerts'), {
    kind,
    message,
    senderUid,
    location: location || null,
    createdAt: serverTimestamp(),
    acknowledgedBy: [],
  });
}

export function subscribeToIncomingAlerts(circleId: string, uid: string, callback: (message: string) => void) {
  const startedAt = Date.now();
  const alerts = query(collection(db, 'circles', circleId, 'alerts'), orderBy('createdAt', 'desc'), limit(10));
  return onSnapshot(alerts, snapshot => {
    snapshot.docChanges().forEach(change => {
      const data = change.doc.data();
      const createdAt = data.createdAt?.toMillis?.() as number | undefined;
      if (change.type === 'added' && data.senderUid !== uid && createdAt && createdAt >= startedAt - 2_000) {
        callback(String(data.message || 'New family alert'));
      }
    });
  });
}
