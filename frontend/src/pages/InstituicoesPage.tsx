import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export function InstituicoesPage() {
  const [itens, setItens] = useState<any[]>([]);

  useEffect(() => {
    api.get("/instituicoes").then((r) => setItens(r.data)).catch(() => setItens([]));
  }, []);

  return (
    <section className="page">
      <span className="eyebrow">INSTITUIÇÕES</span>
      <h1>Compare onde estudar</h1>
      <p>Consulte cursos, localização, valores, formas de ingresso e avaliações quando disponíveis.</p>

      <div className="grid">
        {itens.map((instituicao) => (
          <Link className="card" key={instituicao.id} to={`/instituicoes/${instituicao.id}`}>
            <span>{instituicao.status ? "Ativa" : "Inativa"}</span>
            <h2>{instituicao.nome}</h2>
            <p>{instituicao.cidade} - {instituicao.estado}</p>
            <small>{instituicao.cursosOfertados?.length ?? 0} curso(s) ofertado(s)</small>
          </Link>
        ))}
      </div>
    </section>
  );
}
