import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

type Cargo = {
  id: number;
  nome: string;
  areaAtuacao: string;
  descricao?: string;
  salario?: string | number | null;
  faixaSalarial?: string | null;
};

export function CarreirasPage() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    api
      .get<Cargo[]>("/cargos", { params: busca ? { busca } : undefined })
      .then((r) => setCargos(r.data))
      .catch(() => setCargos([]));
  }, [busca]);

  return (
    <section className="page">
      <span className="eyebrow">CARREIRAS</span>
      <h1>Explore profissões</h1>
      <p>Consulte atribuições, faixa salarial e rotas de formação cadastradas no LUME.</p>

      <input
        className="search"
        placeholder="Buscar profissão..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <div className="grid">
        {cargos.map((cargo) => (
          <Link className="card" key={cargo.id} to={`/carreiras/${cargo.id}`}>
            <span>{cargo.areaAtuacao}</span>
            <h2>{cargo.nome}</h2>
            <p>{cargo.descricao ?? "Descrição não cadastrada."}</p>
            {cargo.salario != null && (
              <strong>R$ {Number(cargo.salario).toLocaleString("pt-BR")} / referência</strong>
            )}
            {cargo.faixaSalarial && <small>{cargo.faixaSalarial}</small>}
          </Link>
        ))}
      </div>
    </section>
  );
}
