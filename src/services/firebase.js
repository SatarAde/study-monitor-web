import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, onSnapshot,
  orderBy, query, serverTimestamp, doc, updateDoc, setDoc
} from 'firebase/firestore';
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDMEsEgUKMVNHrHNKsd5ZwVgavl-YEqLRg",
  authDomain: "study-monitor-5febe.firebaseapp.com",
  projectId: "study-monitor-5febe",
  storageBucket: "study-monitor-5febe.firebasestorage.app",
  messagingSenderId: "133954507626",
  appId: "1:133954507626:web:1cc3949146a6e40f4a0b13"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ── Assignments ───────────────────────────────────────────────
export async function createAssignment(data) {
  return addDoc(collection(db, 'assignments'), {
    ...data,
    status: 'pending',
    assignedAt: serverTimestamp(),
  });
}

export function subscribeAssignments(cb) {
  return onSnapshot(
    query(collection(db, 'assignments'), orderBy('assignedAt', 'desc')),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export async function updateAssignment(id, data) {
  return updateDoc(doc(db, 'assignments', id), data);
}

// ── Results ───────────────────────────────────────────────────
export async function saveResult(data) {
  await addDoc(collection(db, 'results'), {
    ...data,
    takenAt: serverTimestamp(),
  });
  await updateAssignment(data.assignmentId, {
    status: data.passed ? 'passed' : 'failed',
    lastScore: data.score,
  });
}

export function subscribeResults(cb) {
  return onSnapshot(
    query(collection(db, 'results'), orderBy('takenAt', 'desc')),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

// ── Books ─────────────────────────────────────────────────────
export async function uploadBookPages(pages, name, totalPages) {
  const blob = new Blob([JSON.stringify(pages)], { type: 'application/json' });
  const storageRef = ref(storage, `books/${Date.now()}_${name}.json`);
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  const docRef = await addDoc(collection(db, 'books'), {
    name, totalPages, downloadUrl: url,
    uploadedAt: serverTimestamp(),
  });
  return { id: docRef.id, name, totalPages, downloadUrl: url };
}

export function subscribeBooks(cb) {
  return onSnapshot(
    query(collection(db, 'books'), orderBy('uploadedAt', 'desc')),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export async function fetchBookPages(downloadUrl) {
  const res = await fetch(downloadUrl);
  return res.json();
}

// ── Alarms ────────────────────────────────────────────────────
export async function createAlarm(data) {
  return addDoc(collection(db, 'alarms'), {
    ...data, active: true, createdAt: serverTimestamp()
  });
}

export async function deleteAlarmDB(id) {
  return updateDoc(doc(db, 'alarms', id), { active: false });
}

export function subscribeAlarms(cb) {
  return onSnapshot(
    query(collection(db, 'alarms'), orderBy('createdAt', 'desc')),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

// ── Push trigger queue ────────────────────────────────────────
export async function pushToStudent(payload) {
  return setDoc(doc(db, 'push', 'latest'), {
    ...payload, timestamp: serverTimestamp()
  });
}