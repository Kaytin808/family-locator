import {getApp} from '@react-native-firebase/app';
import {getAuth} from '@react-native-firebase/auth';
import {getFirestore} from '@react-native-firebase/firestore';
import {getFunctions} from '@react-native-firebase/functions';

// Native Firebase reads GoogleService-Info.plist on iOS. No web API keys belong here.
export const firebaseApp = getApp();
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const functions = getFunctions(firebaseApp);
