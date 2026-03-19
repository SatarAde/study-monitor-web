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
  appId: "1:133954507626:web:1cc3949146a6e40f4a0b13",
  measurementId: "G-RLDQVX5VJ4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);