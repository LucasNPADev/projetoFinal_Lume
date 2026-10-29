import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { api } from '../services/api';

interface FavoriteEntry {
  id_favorito: string;
  tipo: 'CARGO' | 'CURSO' | 'INSTITUICAO' | 'ROTA';
  alvo_id: string;
  cargo: {
    nome: string;
    area_atuacao: string;
    descricao: string | null;
  } | null;
  curso: {
    nome_curso: string;
    area_curso: string;
    modalidade: string;
    duracao_meses: number | null;
  } | null;
  instituicao: {
    nome_instituicao: string;
    cidade: string | null;
    estado: string | null;
  } | null;
  rota: {
    nome: string;
    descricao: string | null;
    cargo: {
      nome: string;
      area_atuacao: string;
    };
    etapas: Array<{
      ordem_etapa: number;
      curso: {
        nome_curso: string;
      };
    }>;
  } | null;
}

const favoriteTypeLabels: Record<FavoriteEntry['tipo'], string> = {
  CARGO: 'Carreira',
  CURSO: 'Curso',
  INSTITUICAO: 'Instituição',
  ROTA: 'Rota de formação'
};

const getTitle = (favorite: FavoriteEntry) =>
  favorite.cargo?.nome ??
  favorite.curso?.nome_curso ??
  favorite.instituicao?.nome_instituicao ??
  favorite.rota?.nome ??
  'Item indisponível';

const getDescription = (favorite: FavoriteEntry) => {
  if (favorite.cargo) return favorite.cargo.area_atuacao;
  if (favorite.curso) {
    return `${favorite.curso.area_curso} · ${favorite.curso.modalidade}${
      favorite.curso.duracao_meses ? ` · ${favorite.curso.duracao_meses} meses` : ''
    }`;
  }
  if (favorite.instituicao) {
    return [favorite.instituicao.cidade, favorite.instituicao.estado]
      .filter(Boolean)
      .join(', ') || 'Localização não informada';
  }
  if (favorite.rota) {
    const courses = favorite.rota.etapas
      .map(step => step.curso.nome_curso)
      .join(' → ');
    return `${favorite.rota.cargo.nome}${courses ? ` · ${courses}` : ''}`;
  }
  return 'Este item pode ter sido removido ou arquivado.';
};

export const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [removingId, setRemovingId] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadFavorites = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const response = await api.get<FavoriteEntry[]>('/favoritos');
        if (!cancelled) setFavorites(response.data);
      } catch (error: unknown) {
        if (cancelled) return;
        setErrorMessage(
          axios.isAxiosError<{ error?: string }>(error)
            ? error.response?.data?.error ?? 'Não foi possível carregar seus favoritos.'
            : 'Não foi possível carregar seus favoritos.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadFavorites();
    return () => {
      cancelled = true;
    };
  }, []);

  const removeFavorite = async (favoriteId: string) => {
    setRemovingId(favoriteId);
    setErrorMessage('');
    try {
      await api.delete(`/favoritos/${favoriteId}`);
      setFavorites(previous => previous.filter(favorite => favorite.id_favorito !== favoriteId));
    } catch (error: unknown) {
      setErrorMessage(
        axios.isAxiosError<{ error?: string }>(error)
          ? error.response?.data?.error ?? 'Não foi possível remover o favorito.'
          : 'Não foi possível remover o favorito.'
      );
    } finally {
      setRemovingId('');
    }
  };

  return (
    <div className="student-page" style={{ minHeight: '100vh', background: '#F1F0F7' }}>
      <header className="student-header" style={{ background: 'linear-gradient(135deg, #EDEB80 0%, #E0DC5A 100%)', padding: '24px 88px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Meus favoritos</h1>
        <p style={{ marginTop: '6px', fontSize: '13px', fontWeight: '600' }}>{favorites.length} itens salvos na sua conta</p>
      </header>

      <main className="student-main" style={{ padding: '32px 88px' }}>
        {loading && <p role="status">Carregando favoritos...</p>}
        {errorMessage && (
          <div role="alert" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
            {errorMessage}
          </div>
        )}
        {!loading && !errorMessage && favorites.length === 0 && (
          <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E0DFF0', padding: '24px', color: '#7B7B96' }}>
            Você ainda não salvou nenhum favorito. Use o ícone de coração nos cursos, carreiras e instituições para guardá-los aqui.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {favorites.map(favorite => (
            <article key={favorite.id_favorito} style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E0DFF0', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#4338CA', textTransform: 'uppercase' }}>{favoriteTypeLabels[favorite.tipo]}</span>
                  <h2 style={{ fontSize: '17px', fontWeight: 'bold', color: '#1C1C2E', marginTop: '5px' }}>{getTitle(favorite)}</h2>
                </div>
                <span aria-hidden="true" style={{ fontSize: '20px' }}>❤️</span>
              </div>
              <p style={{ fontSize: '13px', color: '#7B7B96', marginTop: '10px', lineHeight: 1.5 }}>{getDescription(favorite)}</p>
              {favorite.cargo?.descricao && <p style={{ fontSize: '12px', color: '#7B7B96', marginTop: '8px' }}>{favorite.cargo.descricao}</p>}
              {favorite.rota?.descricao && <p style={{ fontSize: '12px', color: '#7B7B96', marginTop: '8px' }}>{favorite.rota.descricao}</p>}
              <button type="button" disabled={removingId === favorite.id_favorito} onClick={() => removeFavorite(favorite.id_favorito)} style={{ marginTop: '16px', minHeight: '38px', padding: '0 14px', borderRadius: '8px', border: '1px solid #FECACA', background: '#FFF', color: '#B91C1C', fontWeight: 'bold', cursor: removingId === favorite.id_favorito ? 'wait' : 'pointer' }}>
                {removingId === favorite.id_favorito ? 'Removendo...' : 'Remover dos favoritos'}
              </button>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
};
