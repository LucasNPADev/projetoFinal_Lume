import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function AuthPage({ modo }: { modo: "login" | "cadastro" }) {
  const { login, cadastro } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [form, setForm] = useState({ nomeCompleto: "", email: "", senha: "" }); const [erro, setErro] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setErro("");
    try { if (modo === "login") await login(form.email, form.senha); else await cadastro(form); navigate(location.state?.from ?? "/perfil"); }
    catch (e: any) { setErro(e?.response?.data?.message ?? "Não foi possível concluir."); }
  }
  return <section className="page narrow"><span className="eyebrow">LUME</span><h1>{modo === "login" ? "Entrar" : "Criar conta"}</h1>
    <p>Seu perfil reúne preferências, histórico do quiz e dados usados para personalizar a exploração de carreiras.</p>
    <form className="card form" onSubmit={submit}>
      {modo === "cadastro" && <label>Nome completo<input required value={form.nomeCompleto} onChange={e=>setForm({...form,nomeCompleto:e.target.value})}/></label>}
      <label>E-mail<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
      <label>Senha<input required minLength={6} type="password" value={form.senha} onChange={e=>setForm({...form,senha:e.target.value})}/></label>
      {erro && <p className="error">{erro}</p>}<button type="submit">{modo === "login" ? "Entrar" : "Cadastrar"}</button>
    </form>
    <Link to={modo === "login" ? "/cadastro" : "/login"}>{modo === "login" ? "Ainda não tenho conta" : "Já tenho conta"}</Link>
  </section>;
}
