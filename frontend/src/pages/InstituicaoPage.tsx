import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";

export function InstituicaoPage() {
  const { id } = useParams();
  const [instituicao, setInstituicao] = useState<any>();

  useEffect(() => {
    api.get(`/instituicoes/${id}`).then((r) => setInstituicao(r.data));
  }, [id]);

  if (!instituicao) return <section className="page"><p>Carregando...</p></section>;

  return (
    <section className="page">
      <Link to="/instituicoes">← Instituições</Link>
      <span className="eyebrow">INSTITUIÇÃO</span>
      <h1>{instituicao.nome}</h1>
      <p>Status: {instituicao.status ? "Ativa" : "Inativa"}</p>

      <div className="two-col">
        <article className="card">
          <h2>Localização</h2>
          <p>
            {instituicao.endereco ? `${instituicao.endereco}, ` : ""}
            {instituicao.cidade} - {instituicao.estado}
          </p>
          {instituicao.rua && <p>{instituicao.rua}</p>}
          {instituicao.bairro && <p>Bairro: {instituicao.bairro}</p>}
          {instituicao.telefone && <p>Telefone: {instituicao.telefone}</p>}
          {instituicao.celular && <p>Celular: {instituicao.celular}</p>}
          {instituicao.email && <p>E-mail: {instituicao.email}</p>}
        </article>

        <article className="card">
          <h2>Avaliação</h2>
          <p>Nota média: {Number(instituicao.notaAvaliacoes).toFixed(2)}</p>
          <p>Nota MEC: {Number(instituicao.notaMec).toFixed(2)}</p>
        </article>
      </div>

      <article className="card">
        <h2>Contato</h2>
        <p>{instituicao.contato ?? "Informação não cadastrada."}</p>
      </article>

      <h2>Cursos</h2>
      <div className="grid">
        {instituicao.cursosOfertados?.map((item: any) => (
          <Link className="card" to={`/cursos/${item.curso.id}`} key={item.id}>
            <h3>{item.curso.nome}</h3>
            <p>{item.curso.modalidade} · {item.curso.area}</p>
            {item.mensalidade != null && (
              <small>Mensalidade: R$ {Number(item.mensalidade).toLocaleString("pt-BR")}</small>
            )}
            {item.formasIngresso && <small>Ingresso: {item.formasIngresso}</small>}
          </Link>
        ))}
      </div>

      <h2>Avaliações</h2>
      <div className="grid">
        {instituicao.avaliacoes?.map((avaliacao: any) => (
          <article className="card" key={avaliacao.id}>
            <p>{avaliacao.comentario ?? "Sem comentário."}</p>
            <small>{avaliacao.usuario?.nomeCompleto ?? "Usuário"}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
