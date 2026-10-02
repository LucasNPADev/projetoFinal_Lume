import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";

export function CarreiraDetalhePage() {
  const { id } = useParams();
  const [cargo, setCargo] = useState<any>();

  useEffect(() => {
    api.get(`/cargos/${id}`).then((r) => setCargo(r.data));
  }, [id]);

  if (!cargo) return <section className="page"><p>Carregando...</p></section>;

  const hardSkills = cargo.hardSkills
    ? String(cargo.hardSkills).split(";").map((item: string) => item.trim()).filter(Boolean)
    : [];
  const softSkills = cargo.softSkills
    ? String(cargo.softSkills).split(";").map((item: string) => item.trim()).filter(Boolean)
    : [];

  return (
    <section className="page">
      <Link to="/carreiras">← Carreiras</Link>
      <span className="eyebrow">{cargo.areaAtuacao}</span>
      <h1>{cargo.nome}</h1>
      <p>{cargo.descricao ?? "Descrição não cadastrada."}</p>

      <div className="stats">
        <div className="card">
          <small>Faixa salarial</small>
          <strong>{cargo.faixaSalarial ?? "Não informada"}</strong>
        </div>
        <div className="card">
          <small>Referência</small>
          <strong>
            {cargo.salario != null
              ? `R$ ${Number(cargo.salario).toLocaleString("pt-BR")}`
              : "Não informada"}
          </strong>
        </div>
      </div>

      <div className="two-col">
        <article className="card">
          <h2>Habilidades</h2>
          <h3>Hard skills</h3>
          <p>{hardSkills.length ? hardSkills.join(" · ") : "Não cadastradas."}</p>
          <h3>Soft skills</h3>
          <p>{softSkills.length ? softSkills.join(" · ") : "Não cadastradas."}</p>
        </article>

        <article className="card">
          <h2>Formação</h2>
          {cargo.trilhas?.map((trilha: any) => (
            <div className="timeline" key={trilha.id}>
              <strong>Etapa {trilha.ordemEtapa}</strong>
              <Link to={`/cursos/${trilha.curso.id}`}>{trilha.curso.nome}</Link>
              <p>{trilha.curso.grauAcademico ?? trilha.curso.area}</p>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}
