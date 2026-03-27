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

// --- Fonctions de hachage compatibles avec la Edge Function ---
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const storedData = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));

    // Extract salt (first 16 bytes)
    const salt = storedData.slice(0, 16);
    const storedHashBytes = storedData.slice(16);

    // Hash the provided password with the same salt
    const passwordData = encoder.encode(password);
    const combined = new Uint8Array(salt.length + passwordData.length);
    combined.set(salt);
    combined.set(passwordData, salt.length);

    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    const hashArray = new Uint8Array(hashBuffer);

    // Compare hashes
    if (hashArray.length !== storedHashBytes.length) return false;
    for (let i = 0; i < hashArray.length; i++) {
      if (hashArray[i] !== storedHashBytes[i]) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const binStr = Array.from(bytes, b => String.fromCharCode(b)).join('');
  return btoa(binStr).replace(/[+/=]/g, '');
}

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
      // Valider la session directement via la base
      const { data: session, error } = await supabase
        .from('user_sessions')
        .select('user_id, expires_at')
        .eq('token', sessionToken)
        .single();

      if (error || !session || new Date(session.expires_at) < new Date()) {
        throw new Error('Session invalide ou expirée');
      }

      // Récupérer les infos utilisateur
      const { data: userData } = await supabase
        .from('local_users')
        .select('id, username, full_name, role')
        .eq('id', session.user_id)
        .single();

      if (userData) {
        setUser({
          id: userData.id,
          username: userData.username,
          full_name: userData.full_name,
          role: userData.role as LocalUserRole,
        });
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
      const uname = username.trim().toLowerCase();

      // Récupérer l'utilisateur depuis la base
      const { data: userData, error: userError } = await supabase
        .from('local_users')
        .select('*')
        .eq('username', uname)
        .single();

      if (userError || !userData) {
        return { success: false, error: 'Identifiants incorrects' };
      }

      // Vérifier si le compte est verrouillé
      if (userData.locked_until && new Date(userData.locked_until) > new Date()) {
        const remainingMinutes = Math.ceil((new Date(userData.locked_until).getTime() - Date.now()) / 60000);
        return { success: false, error: `Compte verrouillé. Réessayez dans ${remainingMinutes} minute(s)` };
      }

      // Vérifier si le compte est actif
      if (!userData.is_active) {
        return { success: false, error: 'Ce compte est désactivé' };
      }

      // Vérifier le mot de passe
      const isValid = await verifyPassword(password, userData.password_hash);

      if (!isValid) {
        const newFailedAttempts = (userData.failed_attempts || 0) + 1;
        const updates: Record<string, unknown> = { failed_attempts: newFailedAttempts };
        if (newFailedAttempts >= 5) {
          updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        }
        await supabase.from('local_users').update(updates).eq('id', userData.id);

        const attemptsLeft = 5 - newFailedAttempts;
        const message = attemptsLeft > 0
          ? `Identifiants incorrects. ${attemptsLeft} tentative(s) restante(s)`
          : 'Compte verrouillé pour 15 minutes';
        return { success: false, error: message };
      }

      // Créer la session
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await supabase.from('local_users').update({
        failed_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString()
      }).eq('id', userData.id);

      await supabase.from('user_sessions').insert({
        user_id: userData.id,
        token,
        expires_at: expiresAt.toISOString(),
        ip_address: 'local',
        user_agent: navigator.userAgent
      });

      const loggedUser: LocalUser = {
        id: userData.id,
        username: userData.username,
        full_name: userData.full_name,
        role: userData.role as LocalUserRole,
      };

      setSessionToken(token);
      setUser(loggedUser);
      localStorage.setItem('local_auth_token', token);
      localStorage.setItem('local_auth_user', JSON.stringify(loggedUser));

      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        // Supprimer la session directement dans la base
        await supabase.from('user_sessions').delete().eq('token', sessionToken);
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
