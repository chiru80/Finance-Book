import React from 'react'
import ReactDOM from 'react-dom/client'
import FinanceBookApp from '../FinanceBook_App'
import './styles/main.css'
import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';

// Expose Auth functions to index.html
window.handleGoogleSignInFirebase = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error(error);
    window.showToast?.('Google Sign-In failed: ' + error.message, 'error');
    throw error; // Re-throw to handle button state
  }
};

window.handleEmailSignInFirebase = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error(error);
    window.showToast?.('Invalid credentials. Please try again.', 'error');
    throw error;
  }
};

window.handleSignUpFirebase = async (email, password) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error(error);
    window.showToast?.(error.message, 'error');
    throw error;
  }
};

window.handleForgotFirebase = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    window.showToast?.('Reset link sent! Check your inbox 📧', 'info');
  } catch (error) {
    console.error(error);
    window.showToast?.(error.message, 'error');
    throw error;
  }
};

// Listen for auth state to auto-hide login page if logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    const loginPage = document.getElementById('loginPage');
    if (loginPage && loginPage.style.display !== 'none') {
      window.showToast?.('Welcome back! Redirecting…', 'success');
      setTimeout(() => {
        loginPage.style.display = 'none';
        
        const bg = document.querySelector('.bg');
        if (bg) bg.style.display = 'none';
        
        const grid = document.querySelector('.grid-lines');
        if (grid) grid.style.display = 'none';
        
        const particles = document.getElementById('particles');
        if (particles) particles.style.display = 'none';
        
        document.querySelectorAll('.orb').forEach(el => el.style.display = 'none');
        document.body.style.overflow = 'auto';
        document.body.style.background = '#0a0b14';
        
        const root = document.getElementById('root');
        if (root) root.style.display = 'block';
      }, 800);
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FinanceBookApp />
  </React.StrictMode>,
)
