import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const firebaseAvailable = !!auth;

  function signup(email, password) {
    if (!auth) {
      return Promise.reject(new Error('Firebase is not configured. Please add Firebase credentials to .env file'));
    }
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    if (!auth) {
      return Promise.reject(new Error('Firebase is not configured. Please add Firebase credentials to .env file'));
    }
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    if (!auth) {
      setCurrentUser(null);
      return Promise.resolve();
    }
    return signOut(auth);
  }

  function resetPassword(email) {
    if (!auth) {
      return Promise.reject(new Error('Firebase is not configured'));
    }
    return sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      // In demo mode, set a mock user so app can render
      setCurrentUser({ uid: 'demo-user', email: 'demo@example.com' });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    }, (error) => {
      console.error('Auth state error:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    resetPassword,
    firebaseAvailable,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

