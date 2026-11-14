import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const defaultApiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3333' : 'http://localhost:3333';
const baseURL = process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl;
const ACCESS_TOKEN_KEY = 'lume.accessToken';
const REFRESH_TOKEN_KEY = 'lume.refreshToken';
const USER_KEY = 'lume.user';

export interface ApiSession {
  token: string;
  refresh_token: string;
  id: string;
  nome: string;
  email: string;
  perfil: 'ESTUDANTE' | 'ADMIN';
}

export interface ApiUser {
  id_usuario: string;
  nome: string;
  email: string;
  perfil: 'ESTUDANTE' | 'ADMIN';
  rua?: string | null;
  cidade?: string | null;
  estado?: string | null;
  bairro?: string | null;
}

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

export async function storeSession(session: ApiSession) {
  const user: ApiUser = {
    id_usuario: session.id,
    nome: session.nome,
    email: session.email,
    perfil: session.perfil,
  };
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.token),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refresh_token),
    storeUser(user),
  ]);
  return user;
}

export async function storeUser(user: ApiUser) {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function readStoredSession() {
  const [token, refreshToken, storedUser] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(USER_KEY),
  ]);

  if (!token || !refreshToken || !storedUser) return null;

  try {
    return { token, refreshToken, user: JSON.parse(storedUser) as ApiUser };
  } catch (error) {
    await clearStoredSession();
    throw new Error('Não foi possível recuperar a sessão salva.', { cause: error });
  }
}

export async function clearStoredSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };
let refreshing: Promise<ApiSession> | undefined;

async function refreshSession() {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new Error('Sua sessão expirou. Entre novamente.');

  const { data } = await axios.post<ApiSession>(`${baseURL}/session/refresh`, {
    refresh_token: refreshToken,
  });
  await storeSession(data);
  return data;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    if (
      error.response?.status !== 401 ||
      !config ||
      config._retry ||
      config.url?.includes('/session')
    ) {
      throw error;
    }

    config._retry = true;
    try {
      refreshing ??= refreshSession();
      const session = await refreshing;
      config.headers.Authorization = `Bearer ${session.token}`;
      return api(config);
    } catch (refreshError) {
      await clearStoredSession();
      throw refreshError;
    } finally {
      refreshing = undefined;
    }
  },
);
