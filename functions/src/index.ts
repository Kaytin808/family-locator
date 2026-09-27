import {initializeApp} from 'firebase-admin/app';
import {FieldValue, Timestamp, getFirestore} from 'firebase-admin/firestore';
import {getMessaging} from 'firebase-admin/messaging';
import {HttpsError, onCall} from 'firebase-functions/v2/https';
import {onDocumentCreated, onDocumentWritten} from 'firebase-functions/v2/firestore';
import {onSchedule} from 'firebase-functions/v2/scheduler';

initializeApp();
const db = getFirestore();

function assertAuth(uid?: string): asserts uid is string {
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');
}

function distanceMeters(a: {latitude: number; longitude: number}, b: {latitude: number; longitude: number}) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const dLat = lat2 - lat1;
  const dLng = radians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export const createInvite = onCall(async request => {
  assertAuth(request.auth?.uid);
  const circleId = String(request.data?.circleId || '');
  const circle = await db.doc(`circles/${circleId}`).get();
  if (!circle.exists || !circle.data()?.memberUids?.includes(request.auth.uid)) {
    throw new HttpsError('permission-denied', 'You are not a member of that circle.');
  }
  const invite = db.collection('invites').doc();
  const expiresAt = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);
  await invite.set({circleId, createdBy: request.auth.uid, createdAt: FieldValue.serverTimestamp(), expiresAt, status: 'pending'});
  const projectId = process.env.GCLOUD_PROJECT;
  return {inviteId: invite.id, expiresAt: expiresAt.toDate().toISOString(), url: `https://${projectId}.web.app/invite/${invite.id}`};
});

export const acceptInvite = onCall(async request => {
  assertAuth(request.auth?.uid);
  const inviteId = String(request.data?.inviteId || '').trim();
  if (!inviteId) throw new HttpsError('invalid-argument', 'Invite code is required.');
  const inviteRef = db.doc(`invites/${inviteId}`);
  let circleId = '';
  await db.runTransaction(async transaction => {
    const invite = await transaction.get(inviteRef);
    const data = invite.data();
    if (!invite.exists || !data || data.status !== 'pending' || data.expiresAt.toMillis() < Date.now()) {
      throw new HttpsError('failed-precondition', 'This invite is invalid, used, or expired.');
    }
    circleId = data.circleId;
    const circleRef = db.doc(`circles/${circleId}`);
    transaction.update(circleRef, {memberUids: FieldValue.arrayUnion(request.auth!.uid)});
    transaction.set(db.doc(`users/${request.auth!.uid}`), {activeCircleId: circleId, updatedAt: FieldValue.serverTimestamp()}, {merge: true});
    transaction.update(inviteRef, {status: 'accepted', acceptedBy: request.auth!.uid, acceptedAt: FieldValue.serverTimestamp()});
  });
  return {circleId};
});

export const processLocation = onDocumentWritten('circles/{circleId}/locations/{uid}', async event => {
  const after = event.data?.after;
  if (!after?.exists) return;
  const location = after.data() as {latitude: number; longitude: number; speedMps?: number; batteryLevel?: number};
  const {circleId, uid} = event.params;
  const [places, user] = await Promise.all([
    db.collection(`circles/${circleId}/places`).get(),
    db.doc(`users/${uid}`).get(),
  ]);
  const batch = db.batch();

  for (const place of places.docs) {
    const data = place.data() as {name: string; latitude: number; longitude: number; radius: number};
    const inside = distanceMeters(location, data) <= data.radius;
    const stateRef = db.doc(`circles/${circleId}/geofenceStates/${uid}_${place.id}`);
    const state = await stateRef.get();
    const previous = state.data()?.inside as boolean | undefined;
    batch.set(stateRef, {uid, placeId: place.id, inside, updatedAt: FieldValue.serverTimestamp()}, {merge: true});
    if (previous !== undefined && previous !== inside) {
      batch.set(db.collection(`circles/${circleId}/alerts`).doc(), {
        kind: inside ? 'arrival' : 'departure', senderUid: uid,
        message: `${user.data()?.displayName || 'A family member'} ${inside ? 'arrived at' : 'left'} ${data.name}.`,
        location: {latitude: location.latitude, longitude: location.longitude}, createdAt: FieldValue.serverTimestamp(), acknowledgedBy: [],
      });
    }
  }

  const batteryState = db.doc(`circles/${circleId}/batteryStates/${uid}`);
  const previousBattery = (await batteryState.get()).data()?.low as boolean | undefined;
  const lowBatteryThreshold = Number(user.data()?.safetySettings?.lowBatteryThreshold || 20);
  const low = Number(location.batteryLevel ?? 100) <= lowBatteryThreshold;
  batch.set(batteryState, {low, updatedAt: FieldValue.serverTimestamp()});
  if (low && previousBattery === false) {
    batch.set(db.collection(`circles/${circleId}/alerts`).doc(), {kind: 'low_battery', senderUid: uid, message: `${user.data()?.displayName || 'A family member'} has ${location.batteryLevel}% battery.`, createdAt: FieldValue.serverTimestamp(), acknowledgedBy: []});
  }
  await batch.commit();
});

export const sendAlertNotification = onDocumentCreated('circles/{circleId}/alerts/{alertId}', async event => {
  const alert = event.data?.data();
  if (!alert) return;
  const circle = await db.doc(`circles/${event.params.circleId}`).get();
  const recipientUids = (circle.data()?.memberUids as string[] | undefined)?.filter(uid => uid !== alert.senderUid) || [];
  const users = await Promise.all(recipientUids.map(uid => db.doc(`users/${uid}`).get()));
  const tokens = [...new Set(users.flatMap(user => {
    const data = user.data();
    return [...(data?.fcmTokens || []), ...(data?.fcmToken ? [data.fcmToken] : [])];
  }))].filter(Boolean) as string[];
  if (!tokens.length) return;
  await getMessaging().sendEachForMulticast({tokens, notification: {title: 'Family Locator', body: String(alert.message)}, data: {circleId: event.params.circleId, alertId: event.params.alertId, kind: String(alert.kind)}});
});

export const pruneLocationHistory = onSchedule({schedule: 'every day 03:00', timeoutSeconds: 300}, async () => {
  const cutoff = Timestamp.fromMillis(Date.now() - 48 * 60 * 60 * 1000);
  for (let page = 0; page < 25; page += 1) {
    const oldRows = await db.collectionGroup('history').where('updatedAt', '<', cutoff).limit(400).get();
    if (oldRows.empty) break;
    const batch = db.batch();
    oldRows.docs.forEach(row => batch.delete(row.ref));
    await batch.commit();
  }
});
