import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BottomNav } from '../components/BottomNav';
import { api } from '../services/api';

interface CourseOffer {
  id_curso_instituicao: string;
  id_curso: string;
  mensalidade: number | string | null;
  mensalidade_max: number | string | null;
  formas_ingresso: string | null;
  bolsas: string | null;
  prouni: boolean;
  fies: boolean;
  curso: {
    nome_curso: string;
    grau_academico: string;
    modalidade: string;
    carga_horaria: number;
    area_curso: string;
    duracao_meses: number | null;
    descricao: string | null;
  };
  instituicao: {
    id_instituicao: string;
    nome_instituicao: string;
    cidade: string | null;
    estado: string | null;
    natureza: string;
    nota_mec: number | string | null;
  };
  local_oferta: {
    cidade: string | null;
    estado: string | null;
    polo_nome: string | null;
  };
  distancia_km: number | null;
}

interface PaginatedOffers {
  data: CourseOffer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FavoriteItem {
  id_favorito: string;
  tipo: string;
  alvo_id: string;
}

const money = (amount: number | string | null) =>
  amount == null
    ? 'Consulte a instituição'
    : Number(amount).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });

export const CoursesPage: React.FC = () => {
  const [offers, setOffers] = useState<CourseOffer[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Map<string, string>>(new Map());
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadOffers = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const [offersResponse, favoritesResponse] = await Promise.all([
          api.get<PaginatedOffers>('/ofertas', {
            params: { page, limit: 20, ordenar: 'nome', ...(search && { busca: search }) }
          }),
          api.get<FavoriteItem[]>('/favoritos')
        ]);
        if (cancelled) return;
        setOffers(offersResponse.data.data);
        setTotal(offersResponse.data.total);
        setTotalPages(offersResponse.data.totalPages);
        setFavoriteIds(new Map(
          favoritesResponse.data
            .filter(item => item.tipo === 'CURSO')
            .map(item => [item.alvo_id, item.id_favorito])
        ));
      } catch (error: unknown) {
        if (cancelled) return;
        setErrorMessage(
          axios.isAxiosError<{ error?: string }>(error)
            ? error.response?.data?.error ?? 'Não foi possível carregar as ofertas de cursos.'
            : 'Não foi possível carregar as ofertas de cursos.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadOffers();
    return () => {
      cancelled = true;
    };
  }, [page, search]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchText.trim());
  };

  const toggleCourseFavorite = async (courseId: string) => {
    setErrorMessage('');
    try {
      const favoriteId = favoriteIds.get(courseId);
      if (favoriteId) {
        await api.delete(`/favoritos/${favoriteId}`);
        setFavoriteIds(current => {
          const updated = new Map(current);
          updated.delete(courseId);
          return updated;
        });
      } else {
        const response = await api.post<FavoriteItem>('/favoritos', {
          tipo: 'CURSO',
          id: courseId
        });
        setFavoriteIds(current => new Map(current).set(courseId, response.data.id_favorito));
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
    <div style={{ paddingBottom: '100px', minHeight: '100vh', background: '#F1F0F7' }}>
      <header style={{ background: 'linear-gradient(135deg, #EDEB80 0%, #E0DC5A 100%)', padding: '24px 88px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>LUME — Cursos em Faculdades</h1>
        <p style={{ marginTop: '6px', fontSize: '13px', fontWeight: '600' }}>{total} ofertas de cursos disponíveis</p>
      </header>

      <main style={{ padding: '32px 88px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <input
            type="search"
            placeholder="Buscar curso ou faculdade..."
            value={searchText}
            onChange={event => setSearchText(event.target.value)}
            style={{ flex: 1, height: '44px', borderRadius: '10px', border: '1px solid #E0DFF0', background: '#FFF', padding: '0 16px', fontSize: '13px' }}
          />
          <button type="submit" style={{ padding: '0 24px', borderRadius: '10px', border: 0, background: '#1C1C2E', color: '#EDEB80', fontWeight: 'bold' }}>Buscar</button>
        </form>

        {loading && <p role="status">Carregando cursos...</p>}
        {errorMessage && (
          <div role="alert" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
            {errorMessage}
          </div>
        )}
        {!loading && !errorMessage && offers.length === 0 && (
          <p>Nenhuma oferta de curso encontrada.</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {offers.map(offer => {
            const favorite = favoriteIds.has(offer.id_curso);
            return (
              <article key={offer.id_curso_instituicao} style={{ background: '#FFF', borderRadius: '12px', border: '2px solid #E0DFF0', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1C1C2E' }}>{offer.curso.nome_curso}</h2>
                    <p style={{ fontSize: '12px', color: '#4338CA', fontWeight: 'bold', marginTop: '4px' }}>{offer.curso.area_curso} · {offer.curso.grau_academico}</p>
                  </div>
                  <button type="button" aria-label={favorite ? 'Remover curso dos favoritos' : 'Adicionar curso aos favoritos'} onClick={() => toggleCourseFavorite(offer.id_curso)} style={{ flexShrink: 0, background: favorite ? '#FEE2E2' : '#F8F7FB', border: '1px solid #E0DFF0', width: '36px', height: '36px', borderRadius: '50%', fontSize: '16px' }}>
                    {favorite ? '❤️' : '🤍'}
                  </button>
                </div>

                <div style={{ marginTop: '16px', padding: '12px', background: '#F8F7FB', borderRadius: '8px' }}>
                  <strong style={{ display: 'block', fontSize: '14px' }}>{offer.instituicao.nome_instituicao}</strong>
                  <span style={{ fontSize: '12px', color: '#7B7B96' }}>
                    {offer.local_oferta.polo_nome ? `${offer.local_oferta.polo_nome} · ` : ''}
                    {offer.local_oferta.cidade ?? offer.instituicao.cidade ?? 'Local não informado'}
                    {offer.local_oferta.estado ?? offer.instituicao.estado ? `, ${offer.local_oferta.estado ?? offer.instituicao.estado}` : ''}
                    {offer.distancia_km != null ? ` · ${offer.distancia_km.toFixed(1)} km` : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '14px 0' }}>
                  {[offer.curso.modalidade, `${offer.curso.duracao_meses ?? '—'} meses`, `${offer.curso.carga_horaria} horas`].map(label => (
                    <span key={label} style={{ background: '#F1F0F7', color: '#4338CA', padding: '5px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>{label}</span>
                  ))}
                </div>

                <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#15803D' }}>
                  Mensalidade: {money(offer.mensalidade)}
                  {offer.mensalidade_max != null && Number(offer.mensalidade_max) !== Number(offer.mensalidade) ? ` até ${money(offer.mensalidade_max)}` : ''}
                </p>
                <p style={{ fontSize: '12px', color: '#1C1C2E', marginTop: '10px' }}>
                  <strong>Ingresso:</strong> {offer.formas_ingresso || 'Consulte a instituição'}
                </p>
                {offer.bolsas && <p style={{ fontSize: '12px', color: '#1C1C2E', marginTop: '6px' }}><strong>Bolsas:</strong> {offer.bolsas}</p>}
                {(offer.prouni || offer.fies) && (
                  <p style={{ fontSize: '11px', color: '#7B7B96', marginTop: '8px' }}>
                    {offer.prouni ? 'ProUni' : ''}{offer.prouni && offer.fies ? ' · ' : ''}{offer.fies ? 'FIES' : ''}
                  </p>
                )}
              </article>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
            <button type="button" onClick={() => setPage(current => current - 1)} disabled={page <= 1} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #E0DFF0', background: '#FFF' }}>Anterior</button>
            <span>Página {page} de {totalPages}</span>
            <button type="button" onClick={() => setPage(current => current + 1)} disabled={page >= totalPages} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #E0DFF0', background: '#FFF' }}>Próxima</button>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};
