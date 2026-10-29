import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { InstitutionPayload, CoursePayload, CareerPayload } from '../types';

interface CourseOption {
  id_curso: string;
  nome_curso: string;
  duracao_meses: number | null;
  modalidade: string;
  status: boolean;
}

interface SourceOption {
  id_fonte: string;
  nome: string;
  orgao: string;
  url: string;
  consultado_em: string;
  demonstracao: boolean;
}

interface InstitutionOption {
  id_instituicao: string;
  nome_instituicao: string;
  natureza: string;
  regular_mec: boolean;
  status: boolean;
}

type AdminTab = 'INSTITUICAO' | 'CURSO' | 'FONTE' | 'CARGO' | 'OFERTA' | 'PERGUNTA';

const localDateTimeNow = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

export const AdminDashboardPage: React.FC = () => {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('INSTITUICAO');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [loadingOfferOptions, setLoadingOfferOptions] = useState(false);
  const [loadingCargoOptions, setLoadingCargoOptions] = useState(false);
  const [loadingSources, setLoadingSources] = useState(false);
  const [source, setSource] = useState({
    nome: '',
    orgao: '',
    url: '',
    consultado_em: localDateTimeNow(),
    demonstracao: false
  });
  const [question, setQuestion] = useState({
    enunciado: '',
    area_afinidade: '',
    status: true
  });
  const [offer, setOffer] = useState({
    id_curso: '',
    id_instituicao: '',
    mensalidade: 0,
    mensalidade_max: '',
    formas_ingresso: '',
    bolsas: '',
    prouni: false,
    fies: false,
    nota_corte: '',
    ano_nota_corte: '',
    programa_nota_corte: '',
    id_fonte_nota: '',
    polo_nome: '',
    polo_rua: '',
    polo_cidade: '',
    polo_estado: '',
    polo_bairro: '',
    polo_latitude: '',
    polo_longitude: ''
  });

  const [inst, setInst] = useState<InstitutionPayload>({
    nome_instituicao: '',
    cnpj: '',
    nota_mec: 5,
    status: true,
    telefone: '',
    celular: '',
    email: '',
    rua: '',
    cidade: '',
    estado: 'SP',
    bairro: '',
    latitude: -23.5614,
    longitude: -46.6565,
    regular_mec: false,
    natureza: 'PRIVADA'
  });

  const [curso, setCurso] = useState<CoursePayload>({
    nome_curso: '',
    grau_academico: 'Bacharelado',
    modalidade: 'PRESENCIAL',
    carga_horaria: 3600,
    area_curso: '',
    duracao_meses: 48
  });

  const [cargo, setCargo] = useState<CareerPayload>({
    nome: '',
    area_atuacao: 'Tecnologia',
    descricao: '',
    hard_skills: '',
    soft_skills: '',
    panorama_mercado: '',
    salario_piso: 2500,
    salario_media: 5000,
    salario_teto: 10000,
    id_fonte: '',
    status: true,
    rotas: []
  });

  const [rota, setRota] = useState({
    nome: '',
    descricao: '',
    status: true,
    etapa: {
      id_curso: '',
      ordem_etapa: 1,
      descricao: ''
    }
  });

  useEffect(() => {
    if (activeTab !== 'FONTE') return;

    let cancelled = false;
    setLoadingSources(true);
    setErrorMsg('');
    api.get<{ data: SourceOption[] }>('/fontes', { params: { limit: 100 } })
      .then(response => {
        if (!cancelled) setSources(response.data.data);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMsg(
          axios.isAxiosError<{ error?: string }>(error)
            ? error.response?.data?.error ?? 'Não foi possível carregar as fontes cadastradas.'
            : 'Não foi possível carregar as fontes cadastradas.'
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingSources(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'CARGO') return;

    let cancelled = false;
    setLoadingCargoOptions(true);
    setErrorMsg('');

    Promise.all([
      api.get<{ data: CourseOption[] }>('/cursos', { params: { limit: 100 } }),
      api.get<{ data: SourceOption[] }>('/fontes', { params: { limit: 100 } })
    ])
      .then(([coursesResponse, sourcesResponse]) => {
        if (cancelled) return;
        setCourses(coursesResponse.data.data.filter(course => course.duracao_meses));
        setSources(sourcesResponse.data.data);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMsg(
          axios.isAxiosError<{ error?: string }>(error)
            ? error.response?.data?.error ?? 'Não foi possível carregar cursos e fontes.'
            : 'Não foi possível carregar cursos e fontes.'
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingCargoOptions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'OFERTA') return;

    let cancelled = false;
    setLoadingOfferOptions(true);
    setErrorMsg('');

    Promise.all([
      api.get<{ data: CourseOption[] }>('/cursos', { params: { limit: 100 } }),
      api.get<{ data: InstitutionOption[] }>('/instituicoes', { params: { limit: 100 } }),
      api.get<{ data: SourceOption[] }>('/fontes', { params: { limit: 100 } })
    ])
      .then(([coursesResponse, institutionsResponse, sourcesResponse]) => {
        if (cancelled) return;
        setCourses(coursesResponse.data.data);
        setInstitutions(institutionsResponse.data.data);
        setSources(sourcesResponse.data.data);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMsg(
          axios.isAxiosError<{ error?: string }>(error)
            ? error.response?.data?.error ?? 'Não foi possível carregar cursos e instituições.'
            : 'Não foi possível carregar cursos e instituições.'
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingOfferOptions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const handleCreateInst = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.post('/instituicoes', inst);
      setSuccessMsg('Instituição cadastrada com sucesso!');
    } catch (error: unknown) {
      setErrorMsg(
        axios.isAxiosError<{ error?: string }>(error)
          ? error.response?.data?.error ?? 'Não foi possível cadastrar a instituição.'
          : 'Não foi possível cadastrar a instituição.'
      );
    }
  };

  const handleCreateCurso = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.post('/cursos', curso);
      setSuccessMsg('Curso cadastrado com sucesso!');
    } catch (error: unknown) {
      setErrorMsg(
        axios.isAxiosError<{ error?: string }>(error)
          ? error.response?.data?.error ?? 'Não foi possível cadastrar o curso.'
          : 'Não foi possível cadastrar o curso.'
      );
    }
  };

  const handleCreateCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.post('/cargos', {
        ...cargo,
        rotas: [{
          nome: rota.nome,
          status: rota.status,
          ...(rota.descricao.trim() && { descricao: rota.descricao }),
          etapas: [{
            id_curso: rota.etapa.id_curso,
            ordem_etapa: rota.etapa.ordem_etapa,
            ...(rota.etapa.descricao.trim() && { descricao: rota.etapa.descricao })
          }]
        }]
      });
      setSuccessMsg('Cargo cadastrado com sucesso!');
    } catch (error: unknown) {
      if (axios.isAxiosError<{ error?: string; detalhes?: Array<{ campo: string; mensagem: string }> }>(error)) {
        const details = error.response?.data?.detalhes
          ?.map(detail => `${detail.campo}: ${detail.mensagem}`)
          .join('; ');
        setErrorMsg(details || error.response?.data?.error || 'Não foi possível cadastrar o cargo.');
      } else {
        setErrorMsg('Não foi possível cadastrar o cargo.');
      }
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    const hasAnyCutoffField = [
      offer.nota_corte,
      offer.ano_nota_corte,
      offer.programa_nota_corte,
      offer.id_fonte_nota
    ].some(value => value !== '');
    const hasCompleteCutoff = Boolean(
      offer.nota_corte !== '' &&
      offer.ano_nota_corte !== '' &&
      offer.programa_nota_corte !== '' &&
      offer.id_fonte_nota !== ''
    );
    if (hasAnyCutoffField && !hasCompleteCutoff) {
      setErrorMsg('Para informar nota de corte, preencha nota, ano, programa e fonte.');
      return;
    }

    const selectedCourse = courses.find(course => course.id_curso === offer.id_curso);
    const selectedInstitution = institutions.find(
      institution => institution.id_instituicao === offer.id_instituicao
    );
    const isEad = selectedCourse?.modalidade === 'EAD';
    if (isEad && (!offer.polo_nome.trim() || !offer.polo_cidade.trim() || !offer.polo_estado)) {
      setErrorMsg('Para cursos EAD, informe o nome, a cidade e o estado do polo.');
      return;
    }
    if ((offer.polo_latitude === '') !== (offer.polo_longitude === '')) {
      setErrorMsg('Informe latitude e longitude do polo juntas.');
      return;
    }

    try {
      await api.post('/ofertas', {
        id_instituicao: offer.id_instituicao,
        id_curso: offer.id_curso,
        mensalidade: selectedInstitution?.natureza === 'PUBLICA' ? 0 : offer.mensalidade,
        ...(offer.mensalidade_max !== '' && {
          mensalidade_max: selectedInstitution?.natureza === 'PUBLICA'
            ? 0
            : Number(offer.mensalidade_max)
        }),
        formas_ingresso: offer.formas_ingresso,
        ...(offer.bolsas.trim() && { bolsas: offer.bolsas }),
        prouni: offer.prouni,
        fies: offer.fies,
        ...(hasCompleteCutoff && {
          nota_corte: Number(offer.nota_corte),
          ano_nota_corte: Number(offer.ano_nota_corte),
          programa_nota_corte: offer.programa_nota_corte,
          id_fonte_nota: offer.id_fonte_nota
        }),
        ...(offer.polo_nome.trim() && { polo_nome: offer.polo_nome }),
        ...(offer.polo_rua.trim() && { polo_rua: offer.polo_rua }),
        ...(offer.polo_cidade.trim() && { polo_cidade: offer.polo_cidade }),
        ...(offer.polo_estado && { polo_estado: offer.polo_estado }),
        ...(offer.polo_bairro.trim() && { polo_bairro: offer.polo_bairro }),
        ...(offer.polo_latitude !== '' && offer.polo_longitude !== '' && {
          polo_latitude: Number(offer.polo_latitude),
          polo_longitude: Number(offer.polo_longitude)
        })
      });
      setSuccessMsg('Curso vinculado à instituição com sucesso!');
    } catch (error: unknown) {
      if (axios.isAxiosError<{ error?: string; detalhes?: Array<{ campo: string; mensagem: string }> }>(error)) {
        const details = error.response?.data?.detalhes
          ?.map(detail => `${detail.campo}: ${detail.mensagem}`)
          .join('; ');
        setErrorMsg(details || error.response?.data?.error || 'Não foi possível vincular o curso à instituição.');
      } else {
        setErrorMsg('Não foi possível vincular o curso à instituição.');
      }
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.post('/perguntas-vocacionais', question);
      setSuccessMsg('Pergunta vocacional cadastrada com sucesso!');
      setQuestion({ enunciado: '', area_afinidade: '', status: true });
    } catch (error: unknown) {
      if (axios.isAxiosError<{ error?: string; detalhes?: Array<{ campo: string; mensagem: string }> }>(error)) {
        const details = error.response?.data?.detalhes
          ?.map(detail => `${detail.campo}: ${detail.mensagem}`)
          .join('; ');
        setErrorMsg(details || error.response?.data?.error || 'Não foi possível cadastrar a pergunta.');
      } else {
        setErrorMsg('Não foi possível cadastrar a pergunta.');
      }
    }
  };

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const { data } = await api.post<SourceOption>('/fontes', {
        ...source,
        consultado_em: new Date(source.consultado_em).toISOString()
      });
      setSources(current => [...current, data]);
      setSuccessMsg('Fonte cadastrada com sucesso!');
      setSource({
        nome: '',
        orgao: '',
        url: '',
        consultado_em: localDateTimeNow(),
        demonstracao: false
      });
    } catch (error: unknown) {
      setErrorMsg(
        axios.isAxiosError<{ error?: string; detalhes?: Array<{ campo: string; mensagem: string }> }>(error)
          ? error.response?.data?.detalhes?.map(detail => `${detail.campo}: ${detail.mensagem}`).join('; ')
            || error.response?.data?.error
            || 'Não foi possível cadastrar a fonte.'
          : 'Não foi possível cadastrar a fonte.'
      );
    }
  };

  const selectedOfferCourse = courses.find(course => course.id_curso === offer.id_curso);
  const selectedOfferInstitution = institutions.find(
    institution => institution.id_instituicao === offer.id_instituicao
  );

  return (
    <div className="admin-page" style={{ minHeight: '100vh', background: '#F1F0F7' }}>
      <header className="admin-header" style={{ background: 'linear-gradient(135deg, #EDEB80 0%, #E0DC5A 100%)', padding: '24px 88px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>LUME — Painel Administrativo</span>
          <p style={{ fontSize: '13px', color: 'rgba(28,28,46,0.7)' }}>Gestor: {user?.email}</p>
        </div>
        <button onClick={logout} style={{ background: '#1C1C2E', color: '#EDEB80', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px' }}>
          Sair do Painel 🚪
        </button>
      </header>

      <main className="admin-main" style={{ padding: '32px 88px', maxWidth: '1000px', margin: '0 auto' }}>
        {successMsg && (
          <div style={{ background: '#DCFCE7', color: '#15803D', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', textAlign: 'center' }}>
            ✓ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div role="alert" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          {(['INSTITUICAO', 'CURSO', 'FONTE', 'CARGO', 'OFERTA', 'PERGUNTA'] as const).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSuccessMsg(''); setErrorMsg(''); }} style={{ flex: '1 1 150px', minHeight: '48px', borderRadius: '8px', background: activeTab === tab ? '#1C1C2E' : '#FFF', color: activeTab === tab ? '#EDEB80' : '#1C1C2E', fontWeight: 'bold', border: '1px solid #E0DFF0' }}>
              + {tab === 'OFERTA' ? 'Vincular curso à faculdade' : tab === 'PERGUNTA' ? 'Pergunta vocacional' : tab === 'FONTE' ? 'Cadastrar fonte' : `Cadastrar ${tab.toLowerCase()}`}
            </button>
          ))}
        </div>

        <div style={{ background: '#FFF', padding: '32px', borderRadius: '12px', border: '1px solid #E0DFF0' }}>
          {activeTab === 'FONTE' && (
            <>
              <form onSubmit={handleCreateSource}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Cadastrar fonte de dados</h3>
                <p style={{ fontSize: '13px', color: '#7B7B96', marginBottom: '20px' }}>Registre a origem dos dados e a data em que foram consultados. Podem ser usadas fontes governamentais, institucionais ou outros sites; informe uma URL http/https válida. O banco gera o ID automaticamente e a data não pode estar no futuro.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <input type="text" value={source.nome} onChange={e => setSource({ ...source, nome: e.target.value })} required minLength={1} maxLength={200} placeholder="Nome da fonte (até 200 caracteres)" style={{ boxSizing: 'border-box', width: '100%', height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                  <input type="text" value={source.orgao} onChange={e => setSource({ ...source, orgao: e.target.value })} required minLength={1} maxLength={150} placeholder="Órgão responsável (até 150 caracteres)" style={{ boxSizing: 'border-box', width: '100%', height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                  <input type="url" value={source.url} onChange={e => setSource({ ...source, url: e.target.value })} required maxLength={2048} placeholder="URL da fonte (ex.: https://site-da-faculdade.edu.br)" style={{ boxSizing: 'border-box', width: '100%', height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', color: '#1C1C2E', fontSize: '12px', fontWeight: 'bold' }}>
                    DATA E HORA DA CONSULTA
                    <input type="datetime-local" value={source.consultado_em} onChange={e => setSource({ ...source, consultado_em: e.target.value })} required max={localDateTimeNow()} style={{ boxSizing: 'border-box', width: '100%', height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                  </label>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '13px' }}>
                  <input type="checkbox" checked={source.demonstracao} onChange={e => setSource({ ...source, demonstracao: e.target.checked })} />
                  Fonte demonstrativa (não permitida em produção)
                </label>
                <button type="submit" style={{ width: '100%', height: '48px', borderRadius: '8px', background: '#1C1C2E', color: '#EDEB80', fontWeight: 'bold', marginTop: '20px' }}>Salvar fonte</button>
              </form>

              <section aria-labelledby="registered-sources-title" style={{ marginTop: '32px' }}>
                <h4 id="registered-sources-title" style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Fontes cadastradas</h4>
                {loadingSources ? <p style={{ color: '#7B7B96', fontSize: '13px' }}>Carregando fontes...</p> : null}
                {!loadingSources && sources.length === 0 ? <p style={{ color: '#7B7B96', fontSize: '13px' }}>Nenhuma fonte cadastrada.</p> : null}
                <div style={{ display: 'grid', gap: '10px' }}>
                  {sources.map(item => (
                    <article key={item.id_fonte} style={{ display: 'grid', gap: '5px', padding: '14px', background: '#F8F7FB', border: '1px solid #E0DFF0', borderRadius: '10px' }}>
                      <strong style={{ color: '#1C1C2E', fontSize: '14px' }}>{item.nome} — {item.orgao}</strong>
                      <a href={item.url} target="_blank" rel="noreferrer" style={{ color: '#6D4AFF', fontSize: '12px', overflowWrap: 'anywhere' }}>{item.url}</a>
                      <span style={{ color: '#7B7B96', fontSize: '11px' }}>
                        Consultada em {new Date(item.consultado_em).toLocaleString('pt-BR')}
                        {' · '}{item.demonstracao ? 'Demonstrativa' : 'Oficial'}
                        {' · '}ID {item.id_fonte}
                      </span>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === 'INSTITUICAO' && (
            <form onSubmit={handleCreateInst}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Cadastrar Nova Instituição de Ensino</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input type="text" placeholder="Nome da Instituição" value={inst.nome_instituicao} onChange={(e) => setInst({ ...inst, nome_instituicao: e.target.value })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="text" placeholder="CNPJ (00.000.000/0001-00)" value={inst.cnpj} onChange={(e) => setInst({ ...inst, cnpj: e.target.value })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="text" placeholder="Telefone" value={inst.telefone} onChange={(e) => setInst({ ...inst, telefone: e.target.value })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="text" placeholder="Celular/WhatsApp" value={inst.celular} onChange={(e) => setInst({ ...inst, celular: e.target.value })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="email" placeholder="E-mail Institucional" value={inst.email} onChange={(e) => setInst({ ...inst, email: e.target.value })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="number" min="1" max="5" placeholder="Nota MEC (1-5)" value={inst.nota_mec} onChange={(e) => setInst({ ...inst, nota_mec: Number(e.target.value) })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="text" placeholder="Rua" value={inst.rua} onChange={(e) => setInst({ ...inst, rua: e.target.value })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="text" placeholder="Bairro" value={inst.bairro} onChange={(e) => setInst({ ...inst, bairro: e.target.value })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="text" placeholder="Cidade" value={inst.cidade} onChange={(e) => setInst({ ...inst, cidade: e.target.value })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="text" placeholder="UF" value={inst.estado} onChange={(e) => setInst({ ...inst, estado: e.target.value })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <select value={inst.natureza} onChange={(e) => setInst({ ...inst, natureza: e.target.value === 'PUBLICA' ? 'PUBLICA' : 'PRIVADA' })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }}>
                  <option value="PRIVADA">Instituição privada</option>
                  <option value="PUBLICA">Instituição pública</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '13px' }}>
                <input type="checkbox" checked={inst.regular_mec} onChange={e => setInst({ ...inst, regular_mec: e.target.checked })} />
                Instituição regularizada no MEC (necessário para exibição aos estudantes)
              </label>
              <button type="submit" style={{ width: '100%', height: '48px', borderRadius: '8px', background: '#1C1C2E', color: '#EDEB80', fontWeight: 'bold', marginTop: '20px' }}>Salvar Instituição</button>
            </form>
          )}

          {activeTab === 'CURSO' && (
            <form onSubmit={handleCreateCurso}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Cadastrar Novo Curso</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input type="text" placeholder="Nome do Curso" value={curso.nome_curso} onChange={(e) => setCurso({ ...curso, nome_curso: e.target.value })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="text" placeholder="Área do Curso" value={curso.area_curso} onChange={(e) => setCurso({ ...curso, area_curso: e.target.value })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="number" placeholder="Carga Horária (hs)" value={curso.carga_horaria} onChange={(e) => setCurso({ ...curso, carga_horaria: Number(e.target.value) })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="number" placeholder="Duração (meses)" value={curso.duracao_meses} onChange={(e) => setCurso({ ...curso, duracao_meses: Number(e.target.value) })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
              </div>
              <button type="submit" style={{ width: '100%', height: '48px', borderRadius: '8px', background: '#1C1C2E', color: '#EDEB80', fontWeight: 'bold', marginTop: '20px' }}>Salvar Curso</button>
            </form>
          )}

          {activeTab === 'OFERTA' && (
            <form onSubmit={handleCreateOffer}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Vincular curso a uma faculdade</h3>
              <p style={{ fontSize: '13px', color: '#7B7B96', marginBottom: '20px' }}>Preencha os dados acadêmicos, financeiros e de ingresso da oferta. Somente ofertas ativas de cursos e instituições regulares serão mostradas aos estudantes.</p>
              <h4 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '10px' }}>Curso e instituição</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <select value={offer.id_instituicao} onChange={e => setOffer({ ...offer, id_instituicao: e.target.value })} required disabled={loadingOfferOptions || institutions.length === 0} style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }}>
                  <option value="">Selecione a faculdade</option>
                  {institutions.filter(institution => institution.status && institution.regular_mec).map(institution => <option key={institution.id_instituicao} value={institution.id_instituicao}>{institution.nome_instituicao} ({institution.natureza === 'PUBLICA' ? 'Pública' : 'Privada'})</option>)}
                </select>
                <select value={offer.id_curso} onChange={e => setOffer({ ...offer, id_curso: e.target.value })} required disabled={loadingOfferOptions || courses.length === 0} style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }}>
                  <option value="">Selecione o curso</option>
                  {courses.filter(course => course.status !== false).map(course => <option key={course.id_curso} value={course.id_curso}>{course.nome_curso} ({course.modalidade})</option>)}
                </select>
              </div>

              <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: '22px 0 10px' }}>Valores e ingresso</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input type="number" min="0" max="99999999.99" step="0.01" placeholder={selectedOfferInstitution?.natureza === 'PUBLICA' ? 'Mensalidade (gratuita)' : 'Mensalidade mínima (R$)'} value={selectedOfferInstitution?.natureza === 'PUBLICA' ? 0 : offer.mensalidade} onChange={e => setOffer({ ...offer, mensalidade: Number(e.target.value) })} required disabled={selectedOfferInstitution?.natureza === 'PUBLICA'} style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="number" min={selectedOfferInstitution?.natureza === 'PUBLICA' ? 0 : offer.mensalidade} max="99999999.99" step="0.01" placeholder="Mensalidade máxima (opcional)" value={selectedOfferInstitution?.natureza === 'PUBLICA' ? 0 : offer.mensalidade_max} onChange={e => setOffer({ ...offer, mensalidade_max: e.target.value })} disabled={selectedOfferInstitution?.natureza === 'PUBLICA'} style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
              </div>
              {selectedOfferInstitution?.natureza === 'PUBLICA' && <p style={{ fontSize: '12px', color: '#15803D', marginTop: '6px' }}>Para instituições públicas, a mensalidade é cadastrada como zero.</p>}
              <textarea placeholder="Formas de ingresso (ex.: ENEM, SISU, vestibular)" value={offer.formas_ingresso} onChange={e => setOffer({ ...offer, formas_ingresso: e.target.value })} required maxLength={2000} style={{ width: '100%', height: '70px', padding: '12px', borderRadius: '8px', border: '1px solid #E0DFF0', marginTop: '12px' }} />
              <textarea placeholder="Bolsas e condições oferecidas (opcional)" value={offer.bolsas} onChange={e => setOffer({ ...offer, bolsas: e.target.value })} maxLength={4000} style={{ width: '100%', height: '70px', padding: '12px', borderRadius: '8px', border: '1px solid #E0DFF0', marginTop: '12px' }} />
              <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '14px' }}>
                <label><input type="checkbox" checked={offer.prouni} onChange={e => setOffer({ ...offer, prouni: e.target.checked })} /> Aceita ProUni</label>
                <label><input type="checkbox" checked={offer.fies} onChange={e => setOffer({ ...offer, fies: e.target.checked })} /> Aceita FIES</label>
              </div>

              <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: '22px 0 6px' }}>Nota de corte (opcional)</h4>
              <p style={{ fontSize: '12px', color: '#7B7B96', marginBottom: '10px' }}>Se informar a nota, preencha todos os campos e use uma fonte cadastrada.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input type="number" min="0" max="1000" step="0.01" placeholder="Nota de corte" value={offer.nota_corte} onChange={e => setOffer({ ...offer, nota_corte: e.target.value })} style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="number" min="2000" max="2100" step="1" placeholder="Ano da nota de corte" value={offer.ano_nota_corte} onChange={e => setOffer({ ...offer, ano_nota_corte: e.target.value })} style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <select value={offer.programa_nota_corte} onChange={e => setOffer({ ...offer, programa_nota_corte: e.target.value })} style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }}>
                  <option value="">Selecione o programa</option>
                  <option value="SISU">SISU</option>
                  <option value="PROUNI">ProUni</option>
                  <option value="ENEM">ENEM</option>
                  <option value="VESTIBULAR">Vestibular</option>
                </select>
                <select value={offer.id_fonte_nota} onChange={e => setOffer({ ...offer, id_fonte_nota: e.target.value })} disabled={sources.length === 0} style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }}>
                  <option value="">Selecione a fonte da nota</option>
                  {sources.map(source => <option key={source.id_fonte} value={source.id_fonte}>{source.nome} — {source.orgao}</option>)}
                </select>
              </div>
              {sources.length === 0 && !loadingOfferOptions && <p style={{ fontSize: '12px', color: '#7B7B96', marginTop: '6px' }}>Não há fontes cadastradas; a nota de corte pode ficar em branco.</p>}

              <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: '22px 0 6px' }}>Polo e localização {selectedOfferCourse?.modalidade === 'EAD' ? '(obrigatório para EAD)' : '(opcional)'}</h4>
              <p style={{ fontSize: '12px', color: '#7B7B96', marginBottom: '10px' }}>Cursos EAD precisam de nome, cidade e UF do polo. Latitude e longitude são opcionais, mas devem ser informadas juntas.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input type="text" placeholder={`Nome do polo${selectedOfferCourse?.modalidade === 'EAD' ? ' (obrigatório)' : ''}`} value={offer.polo_nome} onChange={e => setOffer({ ...offer, polo_nome: e.target.value })} required={selectedOfferCourse?.modalidade === 'EAD'} maxLength={200} style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="text" placeholder={`Cidade do polo${selectedOfferCourse?.modalidade === 'EAD' ? ' (obrigatória)' : ''}`} value={offer.polo_cidade} onChange={e => setOffer({ ...offer, polo_cidade: e.target.value })} required={selectedOfferCourse?.modalidade === 'EAD'} maxLength={100} style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="text" placeholder={`UF do polo${selectedOfferCourse?.modalidade === 'EAD' ? ' (obrigatória)' : ''}`} value={offer.polo_estado} onChange={e => setOffer({ ...offer, polo_estado: e.target.value.toUpperCase() })} required={selectedOfferCourse?.modalidade === 'EAD'} maxLength={2} style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="text" placeholder="Bairro do polo (opcional)" value={offer.polo_bairro} onChange={e => setOffer({ ...offer, polo_bairro: e.target.value })} maxLength={100} style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="text" placeholder="Rua do polo (opcional)" value={offer.polo_rua} onChange={e => setOffer({ ...offer, polo_rua: e.target.value })} maxLength={200} style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="number" min="-90" max="90" step="any" placeholder="Latitude do polo (opcional)" value={offer.polo_latitude} onChange={e => setOffer({ ...offer, polo_latitude: e.target.value })} style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="number" min="-180" max="180" step="any" placeholder="Longitude do polo (opcional)" value={offer.polo_longitude} onChange={e => setOffer({ ...offer, polo_longitude: e.target.value })} style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
              </div>

              {institutions.filter(institution => institution.status && institution.regular_mec).length === 0 && !loadingOfferOptions && <p role="alert" style={{ marginTop: '12px' }}>Cadastre ou ative uma instituição regular no MEC antes de criar uma oferta.</p>}
              {courses.length === 0 && !loadingOfferOptions && <p role="alert" style={{ marginTop: '12px' }}>Cadastre um curso antes de criar uma oferta.</p>}
              <button type="submit" disabled={loadingOfferOptions || institutions.filter(institution => institution.status && institution.regular_mec).length === 0 || courses.length === 0} style={{ width: '100%', height: '48px', borderRadius: '8px', background: '#1C1C2E', color: '#EDEB80', fontWeight: 'bold', marginTop: '20px', opacity: loadingOfferOptions || institutions.filter(institution => institution.status && institution.regular_mec).length === 0 || courses.length === 0 ? 0.6 : 1 }}>Vincular curso</button>
            </form>
          )}

          {activeTab === 'PERGUNTA' && (
            <form onSubmit={handleCreateQuestion}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Cadastrar pergunta vocacional</h3>
              <p style={{ fontSize: '13px', color: '#7B7B96', marginBottom: '20px' }}>Informe o enunciado que o estudante responderá e a área usada para calcular a afinidade do resultado. O ID e o administrador responsável são registrados automaticamente.</p>
              <label htmlFor="question-enunciado" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>ENUNCIADO DA PERGUNTA</label>
              <textarea id="question-enunciado" value={question.enunciado} onChange={e => setQuestion({ ...question, enunciado: e.target.value })} required minLength={1} maxLength={3000} placeholder="Ex.: Gosto de analisar dados para resolver problemas." style={{ boxSizing: 'border-box', width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #E0DFF0', resize: 'vertical' }} />
              <label htmlFor="question-area" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', margin: '16px 0 6px' }}>ÁREA DE AFINIDADE</label>
              <input id="question-area" type="text" value={question.area_afinidade} onChange={e => setQuestion({ ...question, area_afinidade: e.target.value })} required maxLength={150} placeholder="Ex.: Tecnologia" style={{ boxSizing: 'border-box', width: '100%', height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '13px' }}>
                <input type="checkbox" checked={question.status} onChange={e => setQuestion({ ...question, status: e.target.checked })} />
                Pergunta ativa (será exibida no teste vocacional)
              </label>
              <button type="submit" style={{ width: '100%', height: '48px', borderRadius: '8px', background: '#1C1C2E', color: '#EDEB80', fontWeight: 'bold', marginTop: '20px' }}>Salvar pergunta</button>
            </form>
          )}

          {activeTab === 'CARGO' && (
            <form onSubmit={handleCreateCargo}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Cadastrar Novo Cargo</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input type="text" placeholder="Nome do Cargo" value={cargo.nome} onChange={(e) => setCargo({ ...cargo, nome: e.target.value })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="text" placeholder="Área de Atuação" value={cargo.area_atuacao} onChange={(e) => setCargo({ ...cargo, area_atuacao: e.target.value })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="number" min="0" step="0.01" placeholder="Salário Piso" value={cargo.salario_piso} onChange={(e) => setCargo({ ...cargo, salario_piso: Number(e.target.value) })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="number" min="0" step="0.01" placeholder="Salário Médio" value={cargo.salario_media} onChange={(e) => setCargo({ ...cargo, salario_media: Number(e.target.value) })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <input type="number" min="0" step="0.01" placeholder="Salário Teto" value={cargo.salario_teto} onChange={(e) => setCargo({ ...cargo, salario_teto: Number(e.target.value) })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <select value={cargo.id_fonte} onChange={(e) => setCargo({ ...cargo, id_fonte: e.target.value })} required disabled={loadingCargoOptions || sources.length === 0} style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }}>
                  <option value="">Selecione a fonte dos dados</option>
                  {sources.map(source => <option key={source.id_fonte} value={source.id_fonte}>{source.nome} — {source.orgao}</option>)}
                </select>
              </div>
              <textarea placeholder="Descrição" value={cargo.descricao} onChange={(e) => setCargo({ ...cargo, descricao: e.target.value })} required style={{ width: '100%', height: '70px', padding: '12px', borderRadius: '8px', border: '1px solid #E0DFF0', marginTop: '12px' }} />
              <textarea placeholder="Hard skills (competências técnicas)" value={cargo.hard_skills} onChange={(e) => setCargo({ ...cargo, hard_skills: e.target.value })} required style={{ width: '100%', height: '70px', padding: '12px', borderRadius: '8px', border: '1px solid #E0DFF0', marginTop: '12px' }} />
              <textarea placeholder="Soft skills (competências comportamentais)" value={cargo.soft_skills} onChange={(e) => setCargo({ ...cargo, soft_skills: e.target.value })} required style={{ width: '100%', height: '70px', padding: '12px', borderRadius: '8px', border: '1px solid #E0DFF0', marginTop: '12px' }} />
              <textarea placeholder="Panorama do mercado" value={cargo.panorama_mercado} onChange={(e) => setCargo({ ...cargo, panorama_mercado: e.target.value })} required style={{ width: '100%', height: '70px', padding: '12px', borderRadius: '8px', border: '1px solid #E0DFF0', marginTop: '12px' }} />

              <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '20px' }}>Rota de formação (obrigatória)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <input type="text" placeholder="Nome da rota" value={rota.nome} onChange={(e) => setRota({ ...rota, nome: e.target.value })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
                <select value={rota.etapa.id_curso} onChange={(e) => setRota({ ...rota, etapa: { ...rota.etapa, id_curso: e.target.value } })} required disabled={loadingCargoOptions || courses.length === 0} style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }}>
                  <option value="">Selecione um curso ativo para a etapa</option>
                  {courses.map(course => <option key={course.id_curso} value={course.id_curso}>{course.nome_curso}</option>)}
                </select>
                <input type="number" min="1" max="100" placeholder="Ordem da etapa" value={rota.etapa.ordem_etapa} onChange={(e) => setRota({ ...rota, etapa: { ...rota.etapa, ordem_etapa: Number(e.target.value) } })} required style={{ height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E0DFF0' }} />
              </div>
              <textarea placeholder="Descrição da rota" value={rota.descricao} onChange={(e) => setRota({ ...rota, descricao: e.target.value })} style={{ width: '100%', height: '70px', padding: '12px', borderRadius: '8px', border: '1px solid #E0DFF0', marginTop: '12px' }} />
              <textarea placeholder="Descrição da etapa (opcional)" value={rota.etapa.descricao} onChange={(e) => setRota({ ...rota, etapa: { ...rota.etapa, descricao: e.target.value } })} style={{ width: '100%', height: '70px', padding: '12px', borderRadius: '8px', border: '1px solid #E0DFF0', marginTop: '12px' }} />
              {sources.length === 0 && !loadingCargoOptions && <p role="alert">Cadastre uma fonte de dados antes de criar um cargo.</p>}
              {courses.length === 0 && !loadingCargoOptions && <p role="alert">Cadastre um curso ativo com duração definida antes de criar uma rota.</p>}
              <button type="submit" disabled={loadingCargoOptions || sources.length === 0 || courses.length === 0} style={{ width: '100%', height: '48px', borderRadius: '8px', background: '#1C1C2E', color: '#EDEB80', fontWeight: 'bold', marginTop: '20px', opacity: loadingCargoOptions || sources.length === 0 || courses.length === 0 ? 0.6 : 1 }}>Salvar Cargo</button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};