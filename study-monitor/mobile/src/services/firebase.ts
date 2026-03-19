// src/services/firebase.ts
// Replace firebaseConfig with your own from Firebase Console

import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import messaging from '@react-native-firebase/messaging';

// ── Assignments ───────────────────────────────────────────────
export function subscribeAssignments(cb: (docs: any[]) => void) {
  return firestore()
    .collection('assignments')
    .orderBy('assignedAt', 'desc')
    .onSnapshot(snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export async function updateAssignment(id: string, data: any) {
  return firestore().collection('assignments').doc(id).update(data);
}

// ── Results ───────────────────────────────────────────────────
export async function saveResult(data: any) {
  await firestore().collection('results').add({
    ...data,
    takenAt: firestore.FieldValue.serverTimestamp(),
  });
  await updateAssignment(data.assignmentId, {
    status: data.passed ? 'passed' : 'failed',
    lastScore: data.score,
  });
}

// ── Books ─────────────────────────────────────────────────────
export function subscribeBooks(cb: (docs: any[]) => void) {
  return firestore()
    .collection('books')
    .orderBy('uploadedAt', 'desc')
    .onSnapshot(snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export async function fetchBookPages(downloadUrl: string): Promise<string[]> {
  const res = await fetch(downloadUrl);
  return res.json();
}

// ── Alarms ────────────────────────────────────────────────────
export function subscribeAlarms(cb: (docs: any[]) => void) {
  return firestore()
    .collection('alarms')
    .where('active', '==', true)
    .onSnapshot(snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

// ── Push queue listener (admin triggers → student receives) ──
export function subscribePushQueue(cb: (payload: any) => void) {
  return firestore()
    .collection('push')
    .doc('latest')
    .onSnapshot(snap => {
      if (snap.exists) cb(snap.data());
    });
}

// ── FCM Token ─────────────────────────────────────────────────
export async function registerFCMToken(role: 'admin' | 'student') {
  const status = await messaging().requestPermission();
  if (status < 1) return;
  const token = await messaging().getToken();
  await firestore()
    .collection('config')
    .doc('tokens')
    .set({ [role]: token }, { merge: true });
}

// ── FCM foreground handler ────────────────────────────────────
export function setupFCMListener(onMessage: (msg: any) => void) {
  return messaging().onMessage(onMessage);
}
