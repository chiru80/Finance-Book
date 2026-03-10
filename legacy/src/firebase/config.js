import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Placeholder Firebase configuration
// Replace with your actual project keys
const firebaseConfig = {
    apiKey: "AIzaSyBU9gWVXqYPhbWB9qND15ulFZ28zS4LesQ",
    authDomain: "finance-book-pro-777888.firebaseapp.com",
    projectId: "finance-book-pro-777888",
    storageBucket: "finance-book-pro-777888.firebasestorage.app",
    messagingSenderId: "745372550630",
    appId: "1:745372550630:web:b93a406c8ffcbeec208227"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a a time.
        console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        console.warn('Firestore persistence failed: Browser not supported');
    }
});
