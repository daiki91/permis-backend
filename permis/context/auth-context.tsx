import React, { createContext, useContext, useMemo, useState } from 'react';
import { authApi } from '@/services/api';

type User = {
  id: number;
  nom: string;
  email: string;
  telephone?: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (nom: string, email: string, telephone: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      setUser(data.user);
      setToken(data.token);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (nom: string, email: string, telephone: string, password: string) => {
    setLoading(true);
    try {
      await authApi.register({
        nom,
        email,
        telephone,
        password,
        confirm_password: password,
      });
      const data = await authApi.login(email, password);
      setUser(data.user);
      setToken(data.token);
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({ user, token, loading, signIn, signUp, signOut }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
