import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { api } from '../services/api';
import { StudentPageHeader } from './StudentPageHeader';

interface CareerRoute {
  id_rota: string;
  nome: string;
  descricao: string | null;
  duracao_total_meses: number | null;
  etapas: Array<{
    ordem_etapa: number;
    descricao: string | null;
    curso: { nome_curso: string; grau_academico: string; duracao_meses: number | null };
  }>;
}

interface CareerRecord {
  id_cargo: string;
  nome: string;
  area_atuacao: string;
  descricao: string | null;
  hard_skills: string | null;
  soft_skills: string | null;
  panorama_mercado: string | null;
  salario_piso: number | string | null;
  salario_media: number | string | null;
  salario_teto: number | string | null;
  afinidade?: number | null;
  rotas: CareerRoute[];
}

type Tab = 'overview' | 'skills' | 'formation';

const money = (value: number | string | null) =>
  value == null
    ? 'Não informado'
    : Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const splitItems = (value: string | null) =>
  (value ?? '').split(/[,;\n]/).map(item => item.trim()).filter(Boolean);

function messageFromError(error: unknown) {
  return axios.isAxiosError<{ error?: string }>(error)
    ? error.response?.data?.error ?? 'Não foi possível carregar os detalhes da carreira.'
    : 'Não foi possível carregar os detalhes da carreira.';
}

function duration(months: number | null) {
  if (months == null || months <= 0) return '';
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  return [
    years ? `${years} ${years === 1 ? 'ano' : 'anos'}` : '',
    remaining ? `${remaining} ${remaining === 1 ? 'mês' : 'meses'}` : ''
  ].filter(Boolean).join(' e ');
}

export const CareerDetailPanel: React.FC<{
  careerId: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onBack: () => void;
}> = ({ careerId, isFavorite, onToggleFavorite, onBack }) => {
  const [career, setCareer] = useState<CareerRecord | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMessage('');
    api.get<CareerRecord>(`/cargos/${careerId}`)
      .then(({ data }) => { if (active) setCareer(data); })
      .catch(error => { if (active) setErrorMessage(messageFromError(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [careerId]);

  const relatedCourses = career
    ? [...new Set(career.rotas.flatMap(route => route.etapas.map(stage => stage.curso.nome_curso)))]
    : [];
  const salaries = career ? [
    { label: 'Piso', value: career.salario_piso },
    { label: 'Média', value: career.salario_media },
    { label: 'Teto', value: career.salario_teto }
  ] : [];

  return (
    <div className="student-page">
      <StudentPageHeader
        title="Panorama de carreiras"
        subtitle="Detalhes, habilidades e trilhas profissionais."
        action={<button type="button" className="student-page-header__back" onClick={onBack}>Voltar às carreiras</button>}
      />
      <main className="student-main detail-layout">
        {loading && <p role="status">Carregando carreira...</p>}
        {errorMessage && <div role="alert" className="notice notice--error">{errorMessage}</div>}
        {career && (
          <>
            <section className="detail-hero detail-hero--career">
              <div>
                <span className="eyebrow">{career.area_atuacao}</span>
                <h1>{career.nome}</h1>
                {career.afinidade != null && <span className="detail-affinity">{career.afinidade}% de afinidade</span>}
              </div>
              <button type="button" className={`favorite-button${isFavorite ? ' is-favorite' : ''}`} onClick={onToggleFavorite} aria-label={isFavorite ? 'Remover carreira dos favoritos' : 'Salvar carreira nos favoritos'}>
                {isFavorite ? '♥' : '♡'}
              </button>
            </section>

            <div className="detail-tabs" role="tablist" aria-label="Informações da carreira">
              {([
                ['overview', 'Visão geral'],
                ['skills', 'Habilidades'],
                ['formation', 'Formação']
              ] as const).map(([id, label]) => (
                <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>
                  {label}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <>
                <section className="detail-section">
                  <h2>Sobre a carreira</h2>
                  <p>{career.descricao || 'Descrição não informada.'}</p>
                </section>
                <section className="detail-section">
                  <h2>Faixa salarial detalhada</h2>
                  <div className="salary-bars">
                    {salaries.map(item => {
                      const amount = item.value == null ? 0 : Number(item.value);
                      const maximum = career.salario_teto == null ? amount : Number(career.salario_teto);
                      const width = amount === 0 || maximum === 0 ? 0 : Math.max(12, Math.min(100, amount / maximum * 100));
                      return (
                        <div className="salary-bar-row" key={item.label}>
                          <span>{item.label}</span>
                          <div className="salary-bar"><span style={{ width: `${width}%` }} /></div>
                          <strong>{money(item.value)}</strong>
                        </div>
                      );
                    })}
                  </div>
                </section>
                <section className="detail-section">
                  <h2>Cursos relacionados</h2>
                  <div className="detail-chip-row">
                    {relatedCourses.length
                      ? relatedCourses.map(course => <span key={course}>{course}</span>)
                      : <p>Nenhum curso relacionado cadastrado.</p>}
                  </div>
                </section>
              </>
            )}

            {tab === 'skills' && (
              <>
                <section className="detail-section">
                  <h2>Hard skills (técnicas)</h2>
                  <div className="skill-list">
                    {splitItems(career.hard_skills).length
                      ? splitItems(career.hard_skills).map((skill, index) => <div key={`${skill}-${index}`}><span>{index + 1}</span>{skill}</div>)
                      : <p>Não informado.</p>}
                  </div>
                </section>
                <section className="detail-section">
                  <h2>Soft skills (comportamentais)</h2>
                  <div className="detail-chip-row">
                    {splitItems(career.soft_skills).length
                      ? splitItems(career.soft_skills).map(skill => <span key={skill}>✓ {skill}</span>)
                      : <p>Não informado.</p>}
                  </div>
                </section>
              </>
            )}

            {tab === 'formation' && (
              <section className="detail-section">
                <h2>Trilhas de formação</h2>
                {career.rotas.length
                  ? career.rotas.map(route => (
                    <article className="formation-route" key={route.id_rota}>
                      <h3>{route.nome}</h3>
                      {route.descricao && <p>{route.descricao}</p>}
                      <ol>
                        {route.etapas.map((stage, index) => (
                          <li key={`${route.id_rota}-${stage.ordem_etapa}`}>
                            <span>{stage.ordem_etapa}</span>
                            <div>
                              <strong>{stage.curso.nome_curso}{duration(stage.curso.duracao_meses) ? ` · ${duration(stage.curso.duracao_meses)}` : ''}</strong>
                              <p>{stage.curso.grau_academico}{stage.descricao ? ` · ${stage.descricao}` : ''}{index === 0 ? ' · Ponto de partida' : ''}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </article>
                  ))
                  : <p>Ainda não há uma trilha de formação cadastrada para esta carreira.</p>}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};
