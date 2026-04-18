import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBwGBnnMnKsZ2Pqa2mQv4pO8qMJ07Y2XlI",
  authDomain: "e-study-97072.firebaseapp.com",
  projectId: "e-study-97072",
  storageBucket: "e-study-97072.firebasestorage.app",
  messagingSenderId: "351324744836",
  appId: "1:351324744836:web:fad5eb89dbb91d197426d1",
  measurementId: "G-LQYD0NQMWS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);