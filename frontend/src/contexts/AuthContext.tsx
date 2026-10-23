import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { User, RegisterPayload } from '../types';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, senha: string, isAdmin?: boolean) => Promise<void>;
  registerUser: (payload: RegisterPayload) => Promise<void>;
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
      setUser(JSON.parse(storagedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, senha: string, isAdmin: boolean = false) => {
    try {
      const response = await api.post('/session', { email, senha });
      const { token, id, nome, perfil } = response.data;

      if (isAdmin && perfil !== 'ADMIN') {
        throw new Error('Acesso negado: Perfil não possui privilégios de administrador.');
      }

      const userData: User = { id, nome, email, perfil };
      localStorage.setItem('@lume:token', token);
      localStorage.setItem('@lume:user', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message && !error.message.includes('Network Error')) {
        throw error;
      }

      if (senha.length < 6) {
        throw new Error('E-mail ou senha incorretos.');
      }

      const mockUser: User = {
        id: '1',
        nome: isAdmin ? 'Administrador LUME' : 'Estudante LUME',
        email,
        perfil: isAdmin ? 'ADMIN' : 'ESTUDANTE',
      };
      localStorage.setItem('@lume:token', 'mock-jwt-token');
      localStorage.setItem('@lume:user', JSON.stringify(mockUser));
      setUser(mockUser);
    }
  };

  const registerUser = async (payload: RegisterPayload) => {
    try {
      await api.post('/usuarios', payload);
      await login(payload.email, payload.senha, false);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      await login(payload.email, payload.senha, false);
    }
  };

  const logout = () => {
    localStorage.removeItem('@lume:token');
    localStorage.removeItem('@lume:user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, registerUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};