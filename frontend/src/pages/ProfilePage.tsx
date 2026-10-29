import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { api } from '../services/api';

interface PageResult<T> {
  data: T[];
  total: number;
}

interface FavoriteRecord {
  id_favorito: string;
}

export const ProfilePage: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<FavoriteRecord[]>('/favoritos'),
      api.get<PageResult<unknown>>('/teste-vocacional/historico', { params: { page: 1, limit: 1 } })
    ])
      .then(([favorites, history]) => {
        if (!active) return;
        setFavoriteCount(favorites.data.length);
        setQuizCount(history.data.total);
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
  }, []);

  return (
    <div className="student-page" style={{ minHeight: '100vh', background: '#F1F0F7' }}>
      <header className="student-header" style={{ background: 'linear-gradient(135deg, #EDEB80 0%, #dfdb57 100%)', padding: '32px 88px 80px 88px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Meu Perfil</h1>
        <button onClick={logout} style={{ background: 'rgba(28,28,46,0.12)', padding: '6px 18px', borderRadius: '15px', fontWeight: 'bold', fontSize: '11px' }}>Sair</button>
      </header>

      <main className="student-main" style={{ padding: '0 88px', marginTop: '-50px' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#FFF', padding: '16px', borderRadius: '10px', border: '1px solid #E0DFF0', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{loading ? '—' : favoriteCount}</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#7B7B96' }}>FAVORITOS SALVOS</div>
          </div>
          <div style={{ background: '#FFF', padding: '16px', borderRadius: '10px', border: '1px solid #E0DFF0', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{loading ? '—' : quizCount}</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#7B7B96' }}>TESTES VOCACIONAIS</div>
          </div>
        </div>
        <div className="profile-actions">
          <button type="button" className="secondary-button" onClick={() => navigate('/favoritos')}>Ver meus favoritos</button>
          <button type="button" className="secondary-button" onClick={() => navigate('/cursos')}>Explorar cursos</button>
          <button type="button" className="secondary-button" onClick={() => navigate('/quiz')}>Fazer teste vocacional</button>
        </div>
      </main>
    </div>
  );
};