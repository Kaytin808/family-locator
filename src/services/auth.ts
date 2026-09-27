import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from '@react-native-firebase/auth';
import {doc, serverTimestamp, setDoc} from '@react-native-firebase/firestore';
import {auth, db} from '../config/firebase';

export async function register(displayName: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(credential.user, {displayName: displayName.trim()});
  await setDoc(doc(db, 'users', credential.user.uid), {
    displayName: displayName.trim(),
    email: email.trim(),
    updatedAt: serverTimestamp(),
  }, {merge: true});
  return credential.user;
}

export function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export function logout() {
  return signOut(auth);
}
