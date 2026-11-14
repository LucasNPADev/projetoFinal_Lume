import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiSession, ApiUser, clearStoredSession, readStoredSession, storeSession, storeUser } from '../services/api';

interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
  rua?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  aceitou_termos: true;
}

interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateUser: (user: ApiUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    readStoredSession()
      .then((session) => {
        if (active) setUser(session?.user ?? null);
      })
      .catch((error: unknown) => {
        console.error('Falha ao restaurar a sessão do LUME.', error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, senha: string) => {
    const { data } = await api.post<ApiSession>('/session', { email, senha });
    if (data.perfil !== 'ESTUDANTE') {
      throw new Error('O app mobile é destinado a estudantes. Acesse o painel administrativo pelo frontend web.');
    }
    const nextUser = await storeSession(data);
    setUser(nextUser);
  };

  const register = async (payload: RegisterPayload) => {
    await api.post('/usuarios', payload);
    await login(payload.email, payload.senha);
  };

  const logout = async () => {
    try {
      await api.delete('/session');
    } finally {
      await clearStoredSession();
      setUser(null);
    }
  };

  const updateUser = useCallback(async (updatedUser: ApiUser) => {
    await storeUser(updatedUser);
    setUser(updatedUser);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, updateUser, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
