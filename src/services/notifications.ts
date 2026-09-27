import {doc, arrayUnion, setDoc} from '@react-native-firebase/firestore';
import {getMessaging, getToken, onTokenRefresh, registerDeviceForRemoteMessages, requestPermission} from '@react-native-firebase/messaging';
import {firebaseApp, db} from '../config/firebase';

export async function registerPushToken(uid: string) {
  const messaging = getMessaging(firebaseApp);
  try {
    await registerDeviceForRemoteMessages(messaging);
    await requestPermission(messaging, {alert: true, badge: true, sound: true});
    const token = await getToken(messaging);
    await setDoc(doc(db, 'users', uid), {fcmTokens: arrayUnion(token), fcmToken: token}, {merge: true});
    return onTokenRefresh(messaging, refreshed => {
      void setDoc(doc(db, 'users', uid), {fcmTokens: arrayUnion(refreshed), fcmToken: refreshed}, {merge: true});
    });
  } catch (error) {
    // Personal Team profiles may not include APNs. Live Firestore alerts still work.
    console.warn('[push] registration unavailable', error);
    return () => undefined;
  }
}
