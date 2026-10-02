import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";

export function CursoPage() {
  const { id } = useParams();
  const [curso, setCurso] = useState<any>();

  useEffect(() => {
    api.get(`/cursos/${id}`).then((r) => setCurso(r.data));
  }, [id]);

  if (!curso) return <section className="page"><p>Carregando...</p></section>;

  return (
    <section className="page">
      <Link to="/cursos">← Cursos</Link>
      <span className="eyebrow">{curso.area}</span>
      <h1>{curso.nome}</h1>
      <p>{curso.descricao ?? "Descrição não cadastrada."}</p>

      <div className="card">
        <strong>{curso.cargaHoraria} horas</strong>
        <span> · {curso.modalidade}</span>
        {curso.grauAcademico && <span> · {curso.grauAcademico}</span>}
      </div>

      {curso.mensalidade != null && (
        <p>
          Mensalidade de referência: R$ {Number(curso.mensalidade).toLocaleString("pt-BR")}
        </p>
      )}

      <h2>Instituições</h2>
      <div className="grid">
        {curso.instituicoes?.map((item: any) => (
          <Link className="card" to={`/instituicoes/${item.instituicao.id}`} key={item.id}>
            <h3>{item.instituicao.nome}</h3>
            <p>{item.instituicao.cidade} - {item.instituicao.estado}</p>
            <small>
              {item.mensalidade != null
                ? `Mensalidade: R$ ${Number(item.mensalidade).toLocaleString("pt-BR")}`
                : "Valor a consultar"}
            </small>
            {item.formasIngresso && <small>Ingresso: {item.formasIngresso}</small>}
          </Link>
        ))}
      </div>
    </section>
  );
}
