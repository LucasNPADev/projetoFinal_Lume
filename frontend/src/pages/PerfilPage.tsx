import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

export function PerfilPage() {
  const { usuario, logout } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState({ nomeCompleto: "", telefone: "", cidade: "", estado: "", consentimentoLocalizacao: false });
  useEffect(() => { if (!usuario) { navigate("/login", { state: { from: "/perfil" } }); return; } api.get(`/usuarios/${usuario.id}`).then(r => setForm({ nomeCompleto:r.data.nomeCompleto ?? "", telefone:r.data.telefone ?? "", cidade:r.data.cidade ?? "", estado:r.data.estado ?? "", consentimentoLocalizacao:r.data.consentimentoLocalizacao ?? false })); }, [usuario, navigate]);
  async function submit(e: FormEvent) { e.preventDefault(); if (!usuario) return; const {data}=await api.put(`/usuarios/${usuario.id}`,form); localStorage.setItem("lume_usuario",JSON.stringify(data)); alert("Perfil atualizado."); }
  if (!usuario) return null;
  return <section className="page narrow"><span className="eyebrow">MEU PERFIL</span><h1>Olá, {usuario.nomeCompleto.split(" ")[0]}.</h1>
    <form className="card form" onSubmit={submit}>
      <label>Nome completo<input value={form.nomeCompleto} onChange={e=>setForm({...form,nomeCompleto:e.target.value})}/></label>
      <label>E-mail<input value={usuario.email} disabled/></label><label>Telefone<input value={form.telefone} onChange={e=>setForm({...form,telefone:e.target.value})}/></label>
      <label>Cidade<input value={form.cidade} onChange={e=>setForm({...form,cidade:e.target.value})}/></label><label>Estado<input value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}/></label>
      <label className="check"><input type="checkbox" checked={form.consentimentoLocalizacao} onChange={e=>setForm({...form,consentimentoLocalizacao:e.target.checked})}/> Permitir uso da localização para recomendações.</label>
      <button>Salvar alterações</button>
    </form><button className="secondary" onClick={()=>{logout();navigate("/")}}>Sair</button>
  </section>;
}
