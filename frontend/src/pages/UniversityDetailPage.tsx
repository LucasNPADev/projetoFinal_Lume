import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { api } from '../services/api';

interface UniversityOffer {
  id_curso_instituicao: string;
  mensalidade: number | string | null;
  mensalidade_max: number | string | null;
  formas_ingresso: string | null;
  bolsas: string | null;
  prouni: boolean;
  fies: boolean;
  nota_corte: number | string | null;
  ano_nota_corte: number | null;
  programa_nota_corte: string | null;
  curso: {
    nome_curso: string;
    grau_academico: string;
    modalidade: string;
    carga_horaria: number;
    area_curso: string;
    duracao_meses: number | null;
    descricao: string | null;
  };
}

interface UniversityDetail {
  nome_instituicao: string;
  cnpj: string;
  nota_mec: number | string | null;
  natureza: string;
  regular_mec: boolean;
  telefone: string | null;
  celular: string | null;
  email: string | null;
  site: string | null;
  rua: string | null;
  cidade: string | null;
  estado: string | null;
  bairro: string | null;
  ofertas: UniversityOffer[];
  avaliacoes: {
    media: number | string | null;
    total: number;
  };
  canais: {
    telefone: string | null;
    whatsapp: string | null;
    email: string | null;
    site: string | null;
  };
}

const money = (amount: number | string | null) =>
  amount == null
    ? 'Consulte a instituição'
    : Number(amount).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });

export const UniversityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [institution, setInstitution] = useState<UniversityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!id) {
      setErrorMessage('Instituição não encontrada.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadInstitution = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const response = await api.get<UniversityDetail>(`/instituicoes/${id}`);
        if (!cancelled) setInstitution(response.data);
      } catch (error: unknown) {
        if (cancelled) return;
        setErrorMessage(
          axios.isAxiosError<{ error?: string }>(error)
            ? error.response?.data?.error ?? 'Não foi possível carregar a instituição.'
            : 'Não foi possível carregar a instituição.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadInstitution();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div style={{ paddingBottom: '100px', minHeight: '100vh', background: '#F1F0F7' }}>
      <header style={{ background: 'linear-gradient(135deg, #EDEB80 0%, #E0DC5A 100%)', padding: '24px 88px' }}>
        <button type="button" onClick={() => navigate('/faculdades')} style={{ background: 'transparent', fontWeight: 'bold', fontSize: '14px', color: '#1C1C2E' }}>← Voltar para faculdades</button>
      </header>

      <main style={{ padding: '32px 88px' }}>
        {loading && <p role="status">Carregando instituição...</p>}
        {errorMessage && (
          <div role="alert" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
            {errorMessage}
          </div>
        )}

        {institution && (
          <>
            <section style={{ background: '#6D4AFF', borderRadius: '14px', padding: '32px', color: '#FFF' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>{institution.nome_instituicao}</h1>
              <p style={{ marginTop: '8px', opacity: 0.9, fontSize: '14px' }}>
                {[institution.cidade, institution.estado].filter(Boolean).join(', ') || 'Localização não informada'}
                {institution.natureza ? ` · ${institution.natureza === 'PUBLICA' ? 'Instituição pública' : 'Instituição privada'}` : ''}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                  Nota MEC: {institution.nota_mec == null ? 'Não informada' : `${Number(institution.nota_mec).toLocaleString('pt-BR')} / 5`}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                  {institution.regular_mec ? 'Regularizada no MEC' : 'Aguardando validação MEC'}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                  Avaliação: {institution.avaliacoes.media == null ? 'Sem avaliações' : `${Number(institution.avaliacoes.media).toLocaleString('pt-BR')} / 5`}
                  {institution.avaliacoes.total ? ` (${institution.avaliacoes.total})` : ''}
                </span>
              </div>
            </section>

            <section style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E0DFF0', padding: '24px', marginTop: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Contato e endereço</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', color: '#7B7B96', fontSize: '14px' }}>
                <p><strong>Endereço:</strong> {[institution.rua, institution.bairro, institution.cidade, institution.estado].filter(Boolean).join(', ') || 'Não informado'}</p>
                <p><strong>Telefone:</strong> {institution.canais.telefone || institution.celular || 'Não informado'}</p>
                <p><strong>E-mail:</strong> {institution.canais.email || 'Não informado'}</p>
                {institution.canais.whatsapp && <p><a href={institution.canais.whatsapp} target="_blank" rel="noreferrer">Conversar pelo WhatsApp</a></p>}
                {institution.canais.site && <p><a href={institution.canais.site} target="_blank" rel="noreferrer">Acessar site da instituição</a></p>}
              </div>
            </section>

            <section style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1C1C2E' }}>Cursos oferecidos</h2>
                  <p style={{ color: '#7B7B96', fontSize: '13px', marginTop: '4px' }}>{institution.ofertas.length} {institution.ofertas.length === 1 ? 'curso vinculado' : 'cursos vinculados'}</p>
                </div>
              </div>

              {institution.ofertas.length === 0 ? (
                <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E0DFF0', padding: '24px', color: '#7B7B96' }}>
                  {institution.regular_mec
                    ? 'Ainda não há cursos ativos vinculados a esta instituição.'
                    : 'Os cursos serão exibidos após a validação da instituição no MEC.'}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {institution.ofertas.map(offer => (
                    <article key={offer.id_curso_instituicao} style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E0DFF0', padding: '20px 24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                        <div>
                          <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#1C1C2E' }}>{offer.curso.nome_curso}</h3>
                          <p style={{ color: '#4338CA', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>{offer.curso.area_curso} · {offer.curso.grau_academico}</p>
                        </div>
                        <p style={{ color: '#15803D', fontWeight: 'bold' }}>
                          {money(offer.mensalidade)}
                          {offer.mensalidade_max != null && Number(offer.mensalidade_max) !== Number(offer.mensalidade) ? ` até ${money(offer.mensalidade_max)}` : ''}
                          <span style={{ display: 'block', color: '#7B7B96', fontSize: '10px', textAlign: 'right' }}>MENSALIDADE</span>
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '12px 0' }}>
                        {[offer.curso.modalidade, `${offer.curso.duracao_meses ?? '—'} meses`, `${offer.curso.carga_horaria} horas`].map(label => (
                          <span key={label} style={{ background: '#F1F0F7', color: '#4338CA', padding: '5px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>{label}</span>
                        ))}
                      </div>
                      <p style={{ fontSize: '13px', color: '#1C1C2E' }}><strong>Formas de ingresso:</strong> {offer.formas_ingresso || 'Consulte a instituição'}</p>
                      {offer.bolsas && <p style={{ fontSize: '13px', color: '#1C1C2E', marginTop: '6px' }}><strong>Bolsas:</strong> {offer.bolsas}</p>}
                      {(offer.prouni || offer.fies) && <p style={{ fontSize: '12px', color: '#7B7B96', marginTop: '6px' }}>{[offer.prouni && 'ProUni', offer.fies && 'FIES'].filter(Boolean).join(' · ')}</p>}
                      {offer.nota_corte != null && <p style={{ fontSize: '12px', color: '#7B7B96', marginTop: '6px' }}><strong>Nota de corte {offer.programa_nota_corte} ({offer.ano_nota_corte}):</strong> {Number(offer.nota_corte).toLocaleString('pt-BR')}</p>}
                      {offer.curso.descricao && <p style={{ fontSize: '13px', color: '#7B7B96', marginTop: '10px' }}>{offer.curso.descricao}</p>}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
};
