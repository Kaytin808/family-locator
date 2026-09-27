import {httpsCallable} from '@react-native-firebase/functions';
import {functions} from '../config/firebase';

type InviteResult = {inviteId: string; url: string; expiresAt: string};
type AcceptResult = {circleId: string};

export async function createInvite(circleId: string) {
  const call = httpsCallable<{circleId: string}, InviteResult>(functions, 'createInvite');
  return (await call({circleId})).data;
}

export async function acceptInvite(inviteId: string) {
  const call = httpsCallable<{inviteId: string}, AcceptResult>(functions, 'acceptInvite');
  return (await call({inviteId: inviteId.trim()})).data;
}
