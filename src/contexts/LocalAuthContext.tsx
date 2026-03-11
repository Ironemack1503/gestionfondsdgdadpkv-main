import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type LocalUserRole = 'admin' | 'instructeur' | 'observateur';

interface LocalUser {
  id: string;
  username: string;
  full_name: string | null;
  role: LocalUserRole;
}

interface LocalAuthContextValue {
  user: LocalUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isInstructeur: boolean;
  isObservateur: boolean;
  canEdit: boolean;
}

const LocalAuthContext = createContext<LocalAuthContextValue | undefined>(undefined);

export function LocalAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('local_auth_token');
    const storedUser = localStorage.getItem('local_auth_user');

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setSessionToken(storedToken);
        setUser(userData);
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem('local_auth_token');
        localStorage.removeItem('local_auth_user');
      }
    }

    setLoading(false);
  }, []);

  const validateSession = useCallback(async () => {
    if (!sessionToken) return;

    try {
      // Call local-auth function to validate session
      const { data, error } = await supabase.functions.invoke('local-auth', {
        body: { action: 'validate_session', token: sessionToken }
      });

      if (error || !data?.valid) {
        throw new Error('Session invalide');
      }

      // Session is valid, user data should be in response
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Session validation error:', error);
      setUser(null);
      setSessionToken(null);
      localStorage.removeItem('local_auth_token');
      localStorage.removeItem('local_auth_user');
    }
  }, [sessionToken]);

  useEffect(() => {
    if (sessionToken) {
      validateSession();
    }
  }, [validateSession]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Call local-auth function
      const { data, error } = await supabase.functions.invoke('local-auth', {
        body: {
          action: 'login',
          username: username.trim(),
          password
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.error) {
        return { success: false, error: data.error };
      }

      if (data?.token && data?.user) {
        // Store session data
        setSessionToken(data.token);
        setUser(data.user);

        // Persist to localStorage
        localStorage.setItem('local_auth_token', data.token);
        localStorage.setItem('local_auth_user', JSON.stringify(data.user));

        return { success: true };
      }

      return { success: false, error: 'Réponse invalide du serveur' };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        // Call local-auth function to invalidate session
        await supabase.functions.invoke('local-auth', {
          body: { action: 'logout', token: sessionToken }
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    }

    // Clear local state
    setUser(null);
    setSessionToken(null);

    // Clear localStorage
    localStorage.removeItem('local_auth_token');
    localStorage.removeItem('local_auth_user');
  };

  const value = useMemo<LocalAuthContextValue>(() => {
    const isAdmin = user?.role === 'admin';
    const isInstructeur = user?.role === 'instructeur';
    const isObservateur = user?.role === 'observateur';

    return {
      user,
      loading,
      login,
      logout,
      isAdmin,
      isInstructeur,
      isObservateur,
      canEdit: isAdmin || isInstructeur,
    };
  }, [user, loading]);

  return <LocalAuthContext.Provider value={value}>{children}</LocalAuthContext.Provider>;
}


export function useLocalAuth() {
  const ctx = useContext(LocalAuthContext);
  if (!ctx) {
    throw new Error("useLocalAuth must be used within a LocalAuthProvider");
  }
  return ctx;
}
