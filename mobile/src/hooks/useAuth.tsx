import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'sa_auth_token';

type AuthState = {
  token: string | null;
  initializing: boolean;
  setToken: (t: string) => Promise<void>;
  clearToken: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

async function readToken(): Promise<string | null> {
  try { return (await SecureStore.getItemAsync(AUTH_TOKEN_KEY)) || null; }
  catch { return null; }
}

async function writeToken(t: string): Promise<void> {
  try { await SecureStore.setItemAsync(AUTH_TOKEN_KEY, t); } catch {}
}

async function deleteToken(): Promise<void> {
  try { await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY); } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const t = await readToken();
      if (mounted) setTokenState(t);
      if (mounted) setInitializing(false);
    })();
    return () => { mounted = false; };
  }, []);

  const api = useMemo<AuthState>(() => ({
    token,
    initializing,
    setToken: async (t: string) => {
      await writeToken(t);
      setTokenState(t);
    },
    clearToken: async () => {
      await deleteToken();
      setTokenState(null);
    }
  }), [token, initializing]);

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}