import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

export function PerfilPage() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "",
    endereco: "",
    rua: "",
    cidade: "",
    bairro: "",
    estado: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    if (!usuario) {
      navigate("/login", { state: { from: "/perfil" } });
      return;
    }

    api.get(`/usuarios/${usuario.id}`).then((r) =>
      setForm({
        nome: r.data.nomeCompleto ?? "",
        endereco: r.data.endereco ?? "",
        rua: r.data.rua ?? "",
        cidade: r.data.cidade ?? "",
        bairro: r.data.bairro ?? "",
        estado: r.data.estado ?? "",
        latitude: r.data.latitude ?? "",
        longitude: r.data.longitude ?? "",
      }),
    );
  }, [usuario, navigate]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!usuario) return;
    const { data } = await api.put(`/usuarios/${usuario.id}`, form);
    localStorage.setItem("lume_usuario", JSON.stringify(data));
    alert("Perfil atualizado.");
  }

  if (!usuario) return null;

  return (
    <section className="page narrow">
      <span className="eyebrow">MEU PERFIL</span>
      <h1>Olá, {usuario.nomeCompleto.split(" ")[0]}.</h1>

      <form className="card form" onSubmit={submit}>
        <label>
          Nome completo
          <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </label>
        <label>E-mail<input value={usuario.email} disabled /></label>
        <label>Endereço<input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></label>
        <label>Rua<input value={form.rua} onChange={(e) => setForm({ ...form, rua: e.target.value })} /></label>
        <label>Cidade<input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></label>
        <label>Bairro<input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} /></label>
        <label>Estado<input maxLength={2} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })} /></label>
        <div className="two-col">
          <label>Latitude<input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></label>
          <label>Longitude<input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></label>
        </div>
        <button>Salvar alterações</button>
      </form>

      <button className="secondary" onClick={() => { logout(); navigate("/"); }}>Sair</button>
    </section>
  );
}
