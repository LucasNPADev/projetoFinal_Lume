import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Institution } from '../types';
import { api } from '../services/api';
import lumeLogo from '../assets/lume-logo.png';

interface InstitutionRecord {
  id_instituicao: string;
  nome_instituicao: string;
  cnpj: string;
  nota_mec: number | string | null;
  telefone: string | null;
  celular: string | null;
  email: string | null;
  rua: string | null;
  cidade: string | null;
  estado: string | null;
  bairro: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  distancia_km: number | null;
  regular_mec: boolean;
}

interface InstitutionPage {
  data: InstitutionRecord[];
  total: number;
  totalPages: number;
}

interface FavoriteRecord {
  id_favorito: string;
  tipo: string;
  alvo_id: string;
}

interface InstitutionCard extends Institution {
  favoriteId?: string;
}

export const UniversitiesPage: React.FC = () => {
  const [universities, setUniversities] = useState<InstitutionCard[]>([]);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const loadUniversities = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const [firstPage, favoritesResponse] = await Promise.all([
          api.get<InstitutionPage>('/instituicoes', {
            params: { page: 1, limit: 100, ordenar: 'nome', ...(search && { busca: search }) }
          }),
          api.get<FavoriteRecord[]>('/favoritos')
        ]);
        const pages = await Promise.all(
          Array.from({ length: Math.max(0, firstPage.data.totalPages - 1) }, (_, index) =>
            api.get<InstitutionPage>('/instituicoes', {
              params: { page: index + 2, limit: 100, ordenar: 'nome', ...(search && { busca: search }) }
            })
          )
        );
        if (cancelled) return;

        const favorites = new Map(
          favoritesResponse.data
            .filter(favorite => favorite.tipo === 'INSTITUICAO')
            .map(favorite => [favorite.alvo_id, favorite.id_favorito])
        );
        const records = [
          ...firstPage.data.data,
          ...pages.flatMap(page => page.data.data)
        ];

        setTotal(firstPage.data.total);
        setUniversities(records.map(institution => ({
          id: institution.id_instituicao,
          nome_instituicao: institution.nome_instituicao,
          cnpj: institution.cnpj,
          nota_mec: Number(institution.nota_mec ?? 0),
          telefone: institution.telefone ?? '',
          celular: institution.celular ?? '',
          email: institution.email ?? '',
          rua: institution.rua ?? '',
          cidade: institution.cidade ?? '',
          estado: institution.estado ?? '',
          bairro: institution.bairro ?? '',
          latitude: Number(institution.latitude ?? 0),
          longitude: Number(institution.longitude ?? 0),
          regular_mec: institution.regular_mec,
          favorito: favorites.has(institution.id_instituicao),
          favoriteId: favorites.get(institution.id_instituicao)
        })));
      } catch (error: unknown) {
        if (cancelled) return;
        setErrorMessage(
          axios.isAxiosError<{ error?: string }>(error)
            ? error.response?.data?.error ?? 'Não foi possível carregar as instituições.'
            : 'Não foi possível carregar as instituições.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadUniversities();
    return () => {
      cancelled = true;
    };
  }, [search]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(searchText.trim());
  };

  const handleFavorite = async (event: React.MouseEvent, institution: InstitutionCard) => {
    event.stopPropagation();
    setErrorMessage('');
    try {
      if (institution.favoriteId) {
        await api.delete(`/favoritos/${institution.favoriteId}`);
        setUniversities(previous => previous.map(item => item.id === institution.id
          ? { ...item, favorito: false, favoriteId: undefined }
          : item));
      } else {
        const response = await api.post<FavoriteRecord>('/favoritos', {
          tipo: 'INSTITUICAO',
          id: institution.id
        });
        setUniversities(previous => previous.map(item => item.id === institution.id
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

  return (
    <div className="student-page" style={{ minHeight: '100vh', background: '#F1F0F7' }}>
      <header className="student-header" style={{ background: 'linear-gradient(135deg, #EDEB80 0%, #E0DC5A 100%)', padding: '24px 88px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={lumeLogo} alt="LUME — GPS de Carreira" style={{ width: '48px', height: '42px', objectFit: 'contain' }} />
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>LUME</span>
          </div>
          <p style={{ marginTop: '6px', fontSize: '13px', fontWeight: '600' }}>{total} instituições disponíveis</p>
        </div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
          <input type="search" placeholder="Buscar por instituição..." value={searchText} onChange={event => setSearchText(event.target.value)} style={{ width: 'min(360px, 40vw)', height: '44px', borderRadius: '10px', border: '1px solid rgba(28,28,46,0.15)', background: '#FFF', padding: '0 16px', fontSize: '13px' }} />
          <button type="submit" style={{ border: 0, borderRadius: '10px', padding: '0 16px', background: '#1C1C2E', color: '#EDEB80', fontWeight: 'bold' }}>Buscar</button>
        </form>
      </header>

      <main className="student-main" style={{ padding: '32px 88px' }}>
        {loading && <p role="status">Carregando instituições...</p>}
        {errorMessage && (
          <div role="alert" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
            {errorMessage}
          </div>
        )}
        {!loading && !errorMessage && universities.length === 0 && (
          <p>Nenhuma instituição regularizada e disponível foi encontrada.</p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {universities.map(university => (
            <article key={university.id} onClick={() => navigate(`/faculdade/${university.id}`)} style={{ background: '#FFF', borderRadius: '12px', border: '2px solid #E0DFF0', padding: '24px', position: 'relative', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 'bold', color: '#1C1C2E' }}>{university.nome_instituicao}</h2>
                  <p style={{ fontSize: '12px', color: '#7B7B96', marginTop: '2px' }}>{university.cidade || 'Cidade não informada'}{university.estado ? `, ${university.estado}` : ''}</p>
                  <span style={{ display: 'inline-block', marginTop: '6px', color: university.regular_mec ? '#15803D' : '#A16207', fontSize: '10px', fontWeight: 'bold' }}>
                    {university.regular_mec ? 'REGULARIZADA NO MEC' : 'AGUARDANDO VALIDAÇÃO MEC'}
                  </span>
                </div>
                <button type="button" aria-label={university.favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} onClick={event => handleFavorite(event, university)} style={{ flexShrink: 0, background: university.favorito ? '#FEE2E2' : '#F8F7FB', border: '1px solid #E0DFF0', width: '36px', height: '36px', borderRadius: '50%', fontSize: '16px' }}>
                  {university.favorito ? '❤️' : '🤍'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', margin: '16px 0' }}>
                <div style={{ flex: 1, background: '#F8F7FB', border: '1px solid #E0DFF0', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#15803D' }}>⭐ {university.nota_mec || '—'} / 5</div>
                  <div style={{ fontSize: '9px', color: '#7B7B96', fontWeight: 'bold' }}>NOTA MEC</div>
                </div>
                <div style={{ flex: 1, background: '#F8F7FB', border: '1px solid #E0DFF0', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '4px' }}>{university.telefone || 'Não informado'}</div>
                  <div style={{ fontSize: '9px', color: '#7B7B96', fontWeight: 'bold' }}>TELEFONE</div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#7B7B96' }}>
                {university.rua ? `📍 ${university.rua}${university.bairro ? `, ${university.bairro}` : ''}` : 'Endereço não informado'}
                {university.email ? ` · ${university.email}` : ''}
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
};
