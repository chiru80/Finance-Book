import React from 'react'
import ReactDOM from 'react-dom/client'
import FinanceBook from './App'
import { auth } from './firebase'
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth'

const provider = new GoogleAuthProvider()

window.handleGoogleSignInFirebase = () =>
  signInWithPopup(auth, provider).catch(err => {
    window.showToast?.(err.message, 'error'); throw err
  })

window.handleEmailSignInFirebase = (email, pw) =>
  signInWithEmailAndPassword(auth, email, pw).catch(err => {
    window.showToast?.(err.message, 'error'); throw err
  })

window.handleSignUpFirebase = (email, pw) =>
  createUserWithEmailAndPassword(auth, email, pw).catch(err => {
    window.showToast?.(err.message, 'error'); throw err
  })

window.handleForgotFirebase = (email) =>
  sendPasswordResetEmail(auth, email).then(() => {
    window.showToast?.('Reset link sent!', 'success')
  }).catch(err => {
    window.showToast?.(err.message, 'error'); throw err
  })

let reactRoot = null

// Hide everything immediately until Firebase resolves
document.getElementById('loginPage').style.display = 'none'

onAuthStateChanged(auth, (user) => {
  const loginPage = document.getElementById('loginPage')
  const rootEl = document.getElementById('root')

  if (user) {
    document.body.classList.add('authenticated')
    if (loginPage) loginPage.style.display = 'none'
    if (rootEl) rootEl.style.display = 'block'
    if (!reactRoot) {
      reactRoot = ReactDOM.createRoot(rootEl)
      reactRoot.render(
        <React.StrictMode>
          <FinanceBook />
        </React.StrictMode>
      )
    }
  } else {
    document.body.classList.remove('authenticated')
    if (loginPage) loginPage.style.display = 'flex'
    if (rootEl) rootEl.style.display = 'none'
  }
})