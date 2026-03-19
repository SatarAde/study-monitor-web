// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDMEsEgUKMVNHrHNKsd5ZwVgavl-YEqLRg",
  authDomain: "study-monitor-5febe.firebaseapp.com",
  projectId: "study-monitor-5febe",
  storageBucket: "study-monitor-5febe.firebasestorage.app",
  messagingSenderId: "133954507626",
  appId: "1:133954507626:web:1cc3949146a6e40f4a0b13",
  measurementId: "G-RLDQVX5VJ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);