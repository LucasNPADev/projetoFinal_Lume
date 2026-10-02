import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { api } from "../services/api";

type Usuario = { id: number; nomeCompleto: string; email: string; telefone?: string | null; cidade?: string | null; estado?: string | null };
type AuthContextValue = { usuario: Usuario | null; login: (email: string, senha: string) => Promise<void>; cadastro: (data: Record<string, string>) => Promise<void>; logout: () => void; };

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const raw = localStorage.getItem("lume_usuario");
    return raw ? JSON.parse(raw) : null;
  });

  async function login(email: string, senha: string) {
    const { data } = await api.post("/auth/login", { email, senha });
    localStorage.setItem("lume_token", data.token); localStorage.setItem("lume_usuario", JSON.stringify(data.usuario)); setUsuario(data.usuario);
  }
  async function cadastro(dataInput: Record<string, string>) {
    const { data } = await api.post("/auth/register", dataInput);
    localStorage.setItem("lume_token", data.token); localStorage.setItem("lume_usuario", JSON.stringify(data.usuario)); setUsuario(data.usuario);
  }
  function logout() { localStorage.removeItem("lume_token"); localStorage.removeItem("lume_usuario"); setUsuario(null); }

  const value = useMemo(() => ({ usuario, login, cadastro, logout }), [usuario]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}
