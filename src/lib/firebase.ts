// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAdUS_gw7gOxTzEm81wFeSdQ1zXjnD-JEg",
  authDomain: "klyro-abf56.firebaseapp.com",
  projectId: "klyro-abf56",
  storageBucket: "klyro-abf56.firebasestorage.app",
  messagingSenderId: "646906380793",
  appId: "1:646906380793:web:31c04129ef9a7f0bc8fd28",
  measurementId: "G-SLMGZX6GF6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);