import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Institution } from '../types';
import { api } from '../services/api';
import { StudentPageHeader } from '../components/StudentPageHeader';

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

const normalizeSearchText = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();

export const UniversitiesPage: React.FC = () => {
  const [universities, setUniversities] = useState<InstitutionCard[]>([]);
  const [searchText, setSearchText] = useState('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const normalizedSearch = normalizeSearchText(searchText);
  const filteredUniversities = normalizedSearch
    ? universities.filter(university =>
        normalizeSearchText(university.nome_instituicao).includes(normalizedSearch)
      )
    : universities;

  useEffect(() => {
    let cancelled = false;

    const loadUniversities = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const [firstPage, favoritesResponse] = await Promise.all([
          api.get<InstitutionPage>('/instituicoes', {
            params: { page: 1, limit: 100, ordenar: 'nome' }
          }),
          api.get<FavoriteRecord[]>('/favoritos')
        ]);
        const pages = await Promise.all(
          Array.from({ length: Math.max(0, firstPage.data.totalPages - 1) }, (_, index) =>
            api.get<InstitutionPage>('/instituicoes', {
              params: { page: index + 2, limit: 100, ordenar: 'nome' }
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
  }, []);

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
      <StudentPageHeader
        title="Faculdades perto de você"
        subtitle={`${normalizedSearch ? filteredUniversities.length : total} instituições disponíveis`}
        search={(
          <form onSubmit={event => event.preventDefault()} className="universities-header__search">
            <input
              type="search"
              placeholder="Buscar por instituição..."
              value={searchText}
              onChange={event => setSearchText(event.target.value)}
              aria-label="Buscar por instituição"
            />
          </form>
        )}
      />

      <main className="student-main" style={{ padding: '32px 88px' }}>
        {loading && <p role="status">Carregando instituições...</p>}
        {errorMessage && (
          <div role="alert" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
            {errorMessage}
          </div>
        )}
        {!loading && !errorMessage && filteredUniversities.length === 0 && (
          <p>Nenhuma instituição {normalizedSearch ? 'corresponde à busca' : 'regularizada e disponível foi encontrada'}.</p>
        )}
        <div className="institution-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {filteredUniversities.map(university => (
            <article key={university.id} className="institution-card" onClick={() => navigate(`/faculdade/${university.id}`)} style={{ background: '#FFF', borderRadius: '12px', border: '2px solid #E0DFF0', padding: '24px', position: 'relative', cursor: 'pointer' }}>
              <div className="institution-card__heading">
                <div className="institution-card__identity">
                  <h2 title={university.nome_instituicao}>{university.nome_instituicao}</h2>
                  <p>{university.cidade || 'Cidade não informada'}{university.estado ? `, ${university.estado}` : ''}</p>
                  <span className={university.regular_mec ? 'is-regular' : 'is-pending'}>
                    {university.regular_mec ? 'REGULARIZADA NO MEC' : 'AGUARDANDO VALIDAÇÃO MEC'}
                  </span>
                </div>
                <button type="button" aria-label={university.favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} onClick={event => handleFavorite(event, university)} style={{ flexShrink: 0, background: university.favorito ? '#FEE2E2' : '#F8F7FB', border: '1px solid #E0DFF0', width: '36px', height: '36px', borderRadius: '50%', fontSize: '16px' }}>
                  {university.favorito ? '❤️' : '🤍'}
                </button>
              </div>

              <div className="institution-card__metrics">
                <div className="institution-card__metric">
                  <div className="institution-card__metric-value">⭐ {university.nota_mec || '—'} / 5</div>
                  <div className="institution-card__metric-label">NOTA MEC</div>
                </div>
                <div className="institution-card__metric">
                  <div className="institution-card__metric-phone">{university.telefone || 'Não informado'}</div>
                  <div className="institution-card__metric-label">TELEFONE</div>
                </div>
              </div>

              <div className="institution-card__contact">
                <p>{university.rua ? `📍 ${university.rua}${university.bairro ? `, ${university.bairro}` : ''}` : '📍 Endereço não informado'}</p>
                {university.email && <p>{university.email}</p>}
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
};
