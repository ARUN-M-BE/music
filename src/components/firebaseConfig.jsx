import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import {getFirestore} from "firebase/firestore";
import { getStorage } from "firebase/storage";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNbp_HxrYnfy-wsMWjGk-QzJ8nTe7E9cg",
  authDomain: "g-app-music.firebaseapp.com",
  projectId: "g-app-music",
  storageBucket: "g-app-music.firebasestorage.app",
  messagingSenderId: "617441769108",
  appId: "1:617441769108:web:edb3711660e0fab2a82681"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

