import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Career } from '../types';
import { api } from '../services/api';
import { CareerDetailPanel } from '../components/CareerDetailPanel';

interface CareerListItem {
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
}

interface CareerCard extends Career {
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

const currency = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const CareersPage: React.FC = () => {
  const [careers, setCareers] = useState<CareerCard[]>([]);
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
          api.get<PaginatedCareers>('/cargos', { params: { page: 1, limit: 100 } }),
          api.get<FavoriteItem[]>('/favoritos')
        ]);
        const pages = await Promise.all(
          Array.from({ length: Math.max(0, firstPage.data.totalPages - 1) }, (_, index) =>
            api.get<PaginatedCareers>('/cargos', {
              params: { page: index + 2, limit: 100 }
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
          salario_piso: Number(career.salario_piso ?? 0),
          salario_media: Number(career.salario_media ?? 0),
          salario_teto: Number(career.salario_teto ?? 0),
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
  }, []);

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
      <header className="student-header" style={{ background: 'linear-gradient(135deg, #EDEB80 0%, #E0DC5A 100%)', padding: '24px 88px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>LUME — Panorama de Carreiras</h1>
      </header>

      <main className="student-main" style={{ padding: '32px 88px' }}>
        {loading && <p role="status">Carregando carreiras...</p>}
        {errorMessage && (
          <div role="alert" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
            {errorMessage}
          </div>
        )}
        {!loading && !errorMessage && careers.length === 0 && (
          <p>Nenhuma carreira disponível no momento.</p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {careers.map((c) => (
            <div key={c.id} style={{ background: '#FFF', borderRadius: '12px', border: '2px solid #E0DFF0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <button type="button" className="career-card-title" onClick={() => setSelectedCareerId(c.id)}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{c.nome}</h3>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#4338CA' }}>{c.area_atuacao}</span>
                </button>
                <button type="button" aria-label={c.favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} onClick={() => handleFav(c.id, c.favorito)} style={{ background: c.favorito ? '#FEE2E2' : '#F8F7FB', border: '1px solid #E0DFF0', width: '36px', height: '36px', borderRadius: '50%', fontSize: '16px' }}>
                  {c.favorito ? '❤️' : '🤍'}
                </button>
              </div>

              <p style={{ fontSize: '13px', color: '#7B7B96', margin: '12px 0' }}>{c.descricao}</p>

              <div style={{ background: '#F8F7FB', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#7B7B96' }}>FAIXA SALARIAL (PISO / MÉDIA / TETO)</span>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#15803D' }}>
                  R$ {currency(c.salario_piso)} — R$ {currency(c.salario_media)} — R$ {currency(c.salario_teto)}
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#1C1C2E', marginBottom: '6px' }}>
                <strong>Hard Skills:</strong> {c.hard_skills}
              </div>
              <div style={{ fontSize: '12px', color: '#1C1C2E', marginBottom: '6px' }}>
                <strong>Soft Skills:</strong> {c.soft_skills}
              </div>
              <div style={{ fontSize: '12px', color: '#1C1C2E' }}>
                <strong>Panorama do mercado:</strong> {c.panorama_mercado}
              </div>
              <button type="button" className="primary-button" onClick={() => setSelectedCareerId(c.id)}>
                Conhecer carreira e trilhas
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
