'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/types/user';
import { getCurrentUser, loginUser, logoutUser, registerUser } from '@/lib/auth';
import { UserLogin, UserRegistration } from '@/types/user';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: UserLogin) => Promise<{ error: string | null }>;
  register: (userData: UserRegistration) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user on mount
  useEffect(() => {
    loadUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await loadUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Error loading user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: UserLogin): Promise<{ error: string | null }> => {
    try {
      setError(null);
      setLoading(true);

      const { user: loggedInUser, error: loginError } = await loginUser(credentials);

      if (loginError) {
        setError(loginError);
        return { error: loginError };
      }

      setUser(loggedInUser);
      return { error: null };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: UserRegistration): Promise<{ error: string | null }> => {
    try {
      setError(null);
      setLoading(true);

      const { user: registeredUser, error: registerError } = await registerUser(userData);

      if (registerError) {
        setError(registerError);
        return { error: registerError };
      }

      setUser(registeredUser);
      return { error: null };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      setLoading(true);

      const { error: logoutError } = await logoutUser();

      if (logoutError) {
        setError(logoutError);
      }

      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError('An unexpected error occurred during logout');
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to require authentication
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !user && !redirecting) {
      setRedirecting(true);
      window.location.href = '/login';
    }
  }, [user, loading, redirecting]);

  return { user, loading: loading || redirecting };
}
