// ============================================
// Firebase Configuration - Ali App
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ⚠️ إعدادات مشروعك في Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBdsG5XN20qdHq8MTPeqb6ZJfWFq6vbq40",
  authDomain: "ali-app-bd8ad.firebaseapp.com",
  projectId: "ali-app-bd8ad",
  storageBucket: "ali-app-bd8ad.firebasestorage.app",
  messagingSenderId: "488712782407",
  appId: "1:488712782407:web:d988c8ae75d23423c9a762",
  measurementId: "G-HQ94G1699P"
};

// تهيئة Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ============================================
// 📧 بريد الأدمن
// ============================================
export const ADMIN_EMAIL = "afri95759@gmail.com";
