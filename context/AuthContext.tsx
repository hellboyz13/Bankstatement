'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '@/lib/auth-types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth from localStorage as fallback for previously logged in users
  // Note: In a production app, you would initialize from Supabase session
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setUser(data.user);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      setUser(data.user);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    } catch (error) {
      throw error;
    }
  };

  const signupWithGoogle = async () => {
    try {
      const response = await fetch('/api/auth/signup-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPremium: false }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Google signup failed');
      }

      setUser(data.user);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    } catch (error) {
      throw error;
    }
  };

  const signupWithGooglePremium = async () => {
    try {
      const response = await fetch('/api/auth/signup-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPremium: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Premium Google signup failed');
      }

      setUser(data.user);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout API if needed (future: Supabase signOut)
      setUser(null);
      localStorage.removeItem('currentUser');
      // Clear all transaction and statement data
      localStorage.removeItem('bank_analyzer_transactions');
      localStorage.removeItem('bank_analyzer_statements');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if API call fails
      setUser(null);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('bank_analyzer_transactions');
      localStorage.removeItem('bank_analyzer_statements');
    }
  };

  const upgradeToPremium = async () => {
    if (!user) return;

    try {
      // Call API to upgrade user in Supabase
      const response = await fetch('/api/user/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upgrade failed');
      }

      const updatedUser = data.user;
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Upgrade error:', error);
      // Fallback: update locally if API fails
      const updatedUser = { ...user, plan: 'premium' as const };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  const incrementUploadCount = async () => {
    if (!user) return;

    try {
      // Call API to increment upload count in Supabase
      const response = await fetch('/api/user/increment-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload increment failed');
      }

      const updatedUser = data.user;
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Upload increment error:', error);
      // Fallback: update locally if API fails
      const updatedUser = { ...user, uploadCount: user.uploadCount + 1 };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    signupWithGoogle,
    signupWithGooglePremium,
    logout,
    upgradeToPremium,
    incrementUploadCount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
