import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  fbSignOut,
  onAuthStateChanged,
  User,
} from './firebase';
import { wipeAllUserData } from './storage';
import { setSessionUnlocked } from './crypto';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        setSessionUnlocked(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('[Google Sign-In Error]:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
        setAuthError(error.message || 'Failed to sign in with Google. Please try again.');
      }
    }
  };

  const signOut = async () => {
    try {
      setSessionUnlocked(false);
      await fbSignOut(auth);
    } catch (error: any) {
      console.error('[Sign-Out Error]:', error);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
      await wipeAllUserData(user.uid);
      await signOut();
    } catch (error: any) {
      console.error('[Account Deletion Error]:', error);
      throw error;
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOut,
        deleteAccount,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
