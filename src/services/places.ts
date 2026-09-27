import {addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp} from '@react-native-firebase/firestore';
import {db} from '../config/firebase';
import type {Coordinates, Place} from '../types';

export function subscribeToPlaces(circleId: string, callback: (places: Place[]) => void) {
  return onSnapshot(collection(db, 'circles', circleId, 'places'), snapshot => {
    callback(snapshot.docs.map(item => ({id: item.id, ...item.data()} as Place)));
  });
}

export function addPlace(circleId: string, uid: string, name: string, coordinates: Coordinates, radius: number) {
  return addDoc(collection(db, 'circles', circleId, 'places'), {
    name: name.trim(),
    ...coordinates,
    radius,
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
}

export function removePlace(circleId: string, placeId: string) {
  return deleteDoc(doc(db, 'circles', circleId, 'places', placeId));
}
