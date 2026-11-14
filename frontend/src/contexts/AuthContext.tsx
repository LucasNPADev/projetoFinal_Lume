import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { api } from '../services/api';
import { User, RegisterPayload } from '../types';

function getApiErrorMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError<{ error?: string; message?: string; detalhes?: Array<{ mensagem: string }> }>(error)) {
    return undefined;
  }

  const data = error.response?.data;
  const details = data?.detalhes?.map((detail) => detail.mensagem).join('; ');
  return details || data?.error || data?.message;
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, senha: string, isAdmin?: boolean) => Promise<void>;
  registerUser: (payload: RegisterPayload) => Promise<void>;
  updateUser: (user: User) => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storagedUser = localStorage.getItem('@lume:user');
    const storagedToken = localStorage.getItem('@lume:token');

    if (storagedUser && storagedToken) {
      try {
        setUser(JSON.parse(storagedUser));
      } catch {
        localStorage.removeItem('@lume:user');
        localStorage.removeItem('@lume:token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, senha: string, isAdmin: boolean = false) => {
    try {
      const response = await api.post('/session', { email, senha });
      const { token, id, nome, perfil } = response.data;

      if (!token || typeof token !== 'string' || !id || !nome || !['ADMIN', 'ESTUDANTE'].includes(perfil)) {
        throw new Error('Resposta de autenticação inválida recebida da API.');
      }
      if (isAdmin && perfil !== 'ADMIN') {
        throw new Error('Acesso negado: Perfil não possui privilégios de administrador.');
      }

      const userData: User = { id, nome, email, perfil };
      localStorage.setItem('@lume:token', token);
      localStorage.setItem('@lume:user', JSON.stringify(userData));
      setUser(userData);
    } catch (error: unknown) {
      const apiError = getApiErrorMessage(error);
      if (apiError) throw new Error(apiError);
      if (axios.isAxiosError(error) && !error.response) {
        throw new Error('Não foi possível conectar à API do LUME. Verifique o servidor e a conexão.');
      }
      throw error;
    }
  };

  const registerUser = async (payload: RegisterPayload) => {
    try {
      await api.post('/usuarios', payload);
      await login(payload.email, payload.senha, false);
    } catch (error: any) {
      const apiError = getApiErrorMessage(error);
      if (apiError) {
        throw new Error(apiError);
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('@lume:token');
    localStorage.removeItem('@lume:user');
    setUser(null);
  };

  const updateUser = useCallback((updatedUser: User) => {
    localStorage.setItem('@lume:user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, registerUser, updateUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};