// src/firebase/config.js

import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCtLKcBSwzDmyMJFzuCaK57rfcQBieqSRo",
  authDomain: "queseria-app-270bf.firebaseapp.com",
  projectId: "queseria-app-270bf",
  storageBucket: "queseria-app-270bf.appspot.com",
  messagingSenderId: "1698239553",
  appId: "1:1698239553:web:b7e26014957e3fa03ae2c0"
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)

// Auth (LOGIN / REGISTRO)
export const auth = getAuth(app)
export const db = getFirestore(app)