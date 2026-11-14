import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { api } from '../services/api';
import { StudentPageHeader } from '../components/StudentPageHeader';

interface PageResult<T> {
  data: T[];
  total: number;
  totalPages: number;
}

interface QuizHistoryRecord {
  id_historico: string;
  data_realizada: string;
  pontuacao_detalhada: {
    area_maior_afinidade?: string;
    empate?: boolean;
    respostas?: Array<{
      id_pergunta: string;
      enunciado: string;
      valor: number;
    }>;
  };
}

export const ProfilePage: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [quizCount, setQuizCount] = useState(0);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryRecord[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get<PageResult<QuizHistoryRecord>>('/teste-vocacional/historico', {
      params: { page: historyPage, limit: 10 }
    })
      .then((history) => {
        if (!active) return;
        setQuizCount(history.data.total);
        setQuizHistory(history.data.data);
        setHistoryTotalPages(history.data.totalPages);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setErrorMessage(
          axios.isAxiosError<{ error?: string }>(error)
            ? error.response?.data?.error ?? 'Não foi possível carregar suas atividades.'
            : 'Não foi possível carregar suas atividades.'
        );
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [historyPage]);

  return (
    <div className="student-page" style={{ minHeight: '100vh', background: '#F1F0F7' }}>
      <StudentPageHeader
        title="Meu perfil"
        subtitle="Seus dados e atividades no LUME."
        action={<button type="button" className="student-page-header__logout" onClick={logout}>Sair</button>}
      />

      <main className="student-main" style={{ padding: '0 88px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#4338CA', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '28px', border: '4px solid #FFF' }}>
            {user?.nome ? user.nome.substring(0, 2).toUpperCase() : 'US'}
          </div>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold' }}>{user?.nome || 'Estudante LUME'}</h2>
            <p style={{ fontSize: '14px', color: '#7B7B96' }}>{user?.email} · {[user?.cidade, user?.estado].filter(Boolean).join(', ') || 'Endereço não informado'}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/perfil/editar')}
            style={{ marginLeft: 'auto', padding: '12px 18px', borderRadius: '9px', background: '#1C1C2E', color: '#EDEB80', fontWeight: 'bold' }}
          >
            Editar cadastro
          </button>
        </div>

        {errorMessage && (
          <div role="alert" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
            {errorMessage}
          </div>
        )}
        {loading && <p role="status" style={{ marginBottom: '16px' }}>Carregando atividades...</p>}
        <div className="profile-activity">
          <div className="profile-activity__summary">
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{loading ? '—' : quizCount}</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#7B7B96' }}>TESTES VOCACIONAIS REALIZADOS</div>
          </div>
        </div>
        <section className="profile-history" aria-labelledby="profile-history-title">
          <div className="profile-history__heading">
            <div>
              <span className="profile-history__eyebrow">SUA JORNADA</span>
              <h2 id="profile-history-title">Histórico de testes</h2>
              <p>Revise suas respostas e acompanhe suas descobertas.</p>
            </div>
            {!loading && quizCount > 0 && (
              <span className="profile-history__total">{quizCount} {quizCount === 1 ? 'teste realizado' : 'testes realizados'}</span>
            )}
          </div>
          {loading && <p className="profile-history__message" role="status">Carregando histórico...</p>}
          {!loading && quizHistory.length === 0 && (
            <div className="profile-history__empty">
              <span aria-hidden="true">✦</span>
              <strong>Seu histórico começa aqui</strong>
              <p>Quando você concluir um teste vocacional, poderá consultar suas respostas nesta seção.</p>
              <button type="button" onClick={() => navigate('/quiz')}>Fazer meu primeiro teste</button>
            </div>
          )}
          {!loading && quizHistory.map(test => {
            const answers = test.pontuacao_detalhada.respostas ?? [];
            const date = new Date(test.data_realizada);
            return (
              <details className="profile-history__item" key={test.id_historico}>
                <summary>
                  <span className="profile-history__date" aria-hidden="true">
                    <strong>{date.toLocaleDateString('pt-BR', { day: '2-digit' })}</strong>
                    <span>{date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                  </span>
                  <span className="profile-history__summary">
                    <time dateTime={test.data_realizada}>
                      {date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </time>
                    {test.pontuacao_detalhada.area_maior_afinidade ? (
                      <span className="profile-history__result">
                        Maior afinidade: <strong>{test.pontuacao_detalhada.area_maior_afinidade}</strong>
                        {test.pontuacao_detalhada.empate ? ' · empate' : ''}
                      </span>
                    ) : (
                      <span className="profile-history__result">Resultado vocacional</span>
                    )}
                  </span>
                  <span className="profile-history__count">
                    {answers.length} {answers.length === 1 ? 'resposta' : 'respostas'}
                  </span>
                </summary>
                {answers.length > 0 ? (
                  <ol className="profile-history__answers">
                    {answers.map((answer, index) => (
                      <li key={`${test.id_historico}-${answer.id_pergunta}`}>
                        <span className="profile-history__number">{String(index + 1).padStart(2, '0')}</span>
                        <div className="profile-history__question">
                          <strong>{answer.enunciado}</strong>
                        </div>
                        <span className="profile-history__choice">
                          {({
                            1: 'Discordo totalmente',
                            2: 'Discordo',
                            3: 'Neutro',
                            4: 'Concordo',
                            5: 'Concordo totalmente'
                          } as Record<number, string>)[answer.valor] ?? `Resposta ${answer.valor}`}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="profile-history__message">As respostas desta tentativa não estão disponíveis.</p>
                )}
              </details>
            );
          })}
          {historyTotalPages > 1 && (
            <div className="profile-history__pagination" aria-label="Paginação do histórico">
              <button type="button" onClick={() => setHistoryPage(page => page - 1)} disabled={historyPage === 1}>
                Anterior
              </button>
              <span>Página {historyPage} de {historyTotalPages}</span>
              <button type="button" onClick={() => setHistoryPage(page => page + 1)} disabled={historyPage === historyTotalPages}>
                Próxima
              </button>
            </div>
          )}
        </section>
        <div className="profile-actions">
          <button type="button" className="secondary-button" onClick={() => navigate('/favoritos')}>Ver meus favoritos</button>
          <button type="button" className="secondary-button" onClick={() => navigate('/cursos')}>Explorar cursos</button>
          <button type="button" className="secondary-button" onClick={() => navigate('/quiz')}>Fazer teste vocacional</button>
        </div>
      </main>
    </div>
  );
};