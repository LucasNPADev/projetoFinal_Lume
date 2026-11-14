import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Career } from '../types';
import { api } from '../services/api';
import { CareerDetailPanel } from '../components/CareerDetailPanel';
import { StudentPageHeader } from '../components/StudentPageHeader';

interface CareerListItem {
  id_cargo: string;
  nome: string;
  area_atuacao: string;
  descricao: string | null;
  hard_skills: string | null;
  soft_skills: string | null;
  panorama_mercado: string | null;
}

interface CareerCard extends Omit<Career, 'salario_piso' | 'salario_media' | 'salario_teto'> {
  favoriteId?: string;
}

interface PaginatedCareers {
  data: CareerListItem[];
  totalPages: number;
}

interface FavoriteItem {
  id_favorito: string;
  tipo: string;
  alvo_id: string;
}

export const CareersPage: React.FC = () => {
  const [careers, setCareers] = useState<CareerCard[]>([]);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCareerId, setSelectedCareerId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCareers = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const [firstPage, favoritesResponse] = await Promise.all([
          api.get<PaginatedCareers>('/cargos', {
            params: { page: 1, limit: 100, ordenar: 'nome', ...(search && { busca: search }) }
          }),
          api.get<FavoriteItem[]>('/favoritos')
        ]);
        const pages = await Promise.all(
          Array.from({ length: Math.max(0, firstPage.data.totalPages - 1) }, (_, index) =>
            api.get<PaginatedCareers>('/cargos', {
              params: { page: index + 2, limit: 100, ordenar: 'nome', ...(search && { busca: search }) }
            })
          )
        );
        if (cancelled) return;

        const favorites = new Map(
          favoritesResponse.data
            .filter(favorite => favorite.tipo === 'CARGO')
            .map(favorite => [favorite.alvo_id, favorite.id_favorito])
        );
        const records = [
          ...firstPage.data.data,
          ...pages.flatMap(page => page.data.data)
        ];

        setCareers(records.map(career => ({
          id: career.id_cargo,
          nome: career.nome,
          area_atuacao: career.area_atuacao,
          descricao: career.descricao ?? '',
          hard_skills: career.hard_skills ?? '',
          soft_skills: career.soft_skills ?? '',
          panorama_mercado: career.panorama_mercado ?? '',
          favorito: favorites.has(career.id_cargo),
          favoriteId: favorites.get(career.id_cargo)
        })));
      } catch (error: unknown) {
        if (cancelled) return;
        setErrorMessage(
          axios.isAxiosError<{ error?: string }>(error)
            ? error.response?.data?.error ?? 'Não foi possível carregar as carreiras.'
            : 'Não foi possível carregar as carreiras.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadCareers();
    return () => {
      cancelled = true;
    };
  }, [search]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(searchText.trim());
  };

  const handleFav = async (id: string, currentlyFav?: boolean) => {
    setErrorMessage('');
    try {
      const career = careers.find(item => item.id === id);
      if (currentlyFav && career?.favoriteId) {
        await api.delete(`/favoritos/${career.favoriteId}`);
        setCareers(prev => prev.map(item => item.id === id
          ? { ...item, favorito: false, favoriteId: undefined }
          : item));
      } else {
        const response = await api.post<FavoriteItem>('/favoritos', { tipo: 'CARGO', id });
        setCareers(prev => prev.map(item => item.id === id
          ? { ...item, favorito: true, favoriteId: response.data.id_favorito }
          : item));
      }
    } catch (error: unknown) {
      setErrorMessage(
        axios.isAxiosError<{ error?: string }>(error)
          ? error.response?.data?.error ?? 'Não foi possível atualizar o favorito.'
          : 'Não foi possível atualizar o favorito.'
      );
    }
  };

  if (selectedCareerId) {
    const selectedCareer = careers.find(career => career.id === selectedCareerId);
    return (
      <CareerDetailPanel
        careerId={selectedCareerId}
        isFavorite={Boolean(selectedCareer?.favorito)}
        onBack={() => setSelectedCareerId(null)}
        onToggleFavorite={() => void handleFav(selectedCareerId, selectedCareer?.favorito)}
      />
    );
  }

  return (
    <div className="student-page" style={{ minHeight: '100vh', background: '#F1F0F7' }}>
      <StudentPageHeader
        title="Panorama de carreiras"
        subtitle="Explore áreas de atuação e caminhos profissionais."
        search={(
          <form onSubmit={handleSearch} className="universities-header__search">
            <input
              type="search"
              placeholder="Buscar por carreira..."
              value={searchText}
              onChange={event => setSearchText(event.target.value)}
            />
            <button type="submit">Buscar</button>
          </form>
        )}
      />

      <main className="student-main" style={{ padding: '32px 88px' }}>
        {loading && <p role="status">Carregando carreiras...</p>}
        {errorMessage && (
          <div role="alert" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
            {errorMessage}
          </div>
        )}
        {!loading && !errorMessage && careers.length === 0 && (
          <p>{search ? 'Nenhuma carreira encontrada para essa busca.' : 'Nenhuma carreira disponível no momento.'}</p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {careers.map((c) => (
            <div key={c.id} className="career-card">
              <div className="career-card__heading">
                <button type="button" className="career-card-title" onClick={() => setSelectedCareerId(c.id)}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{c.nome}</h3>
                  <span>{c.area_atuacao}</span>
                </button>
                <button type="button" aria-label={c.favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} onClick={() => handleFav(c.id, c.favorito)} style={{ background: c.favorito ? '#FEE2E2' : '#F8F7FB', border: '1px solid #E0DFF0', width: '36px', height: '36px', borderRadius: '50%', fontSize: '16px' }}>
                  {c.favorito ? '❤️' : '🤍'}
                </button>
              </div>

              <p className="career-card__description">{c.descricao}</p>

              <div className="career-card__details">
                <div>
                  <strong>Hard skills:</strong> {c.hard_skills}
                </div>
                <div>
                  <strong>Soft skills:</strong> {c.soft_skills}
                </div>
                <div>
                  <strong>Panorama do mercado:</strong> {c.panorama_mercado}
                </div>
              </div>
              <div className="career-card__action">
                <button type="button" className="primary-button career-card__button" onClick={() => setSelectedCareerId(c.id)}>
                  Conhecer carreira e trilhas <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
