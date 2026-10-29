import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface CourseRecord {
  id_curso: string;
  nome_curso: string;
  grau_academico: string;
  modalidade: string;
  carga_horaria: number;
  area_curso: string;
  duracao_meses: number | null;
  descricao: string | null;
  grade_curricular: string | null;
  cargos: Array<{ id_cargo: string; nome: string; area_atuacao: string }>;
  avaliacoes: { media: number | string | null; total: number };
}

interface CourseOffer {
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
  local_oferta: { cidade: string | null; estado: string | null; polo_nome: string | null };
  distancia_km: number | null;
  instituicao: {
    id_instituicao: string;
    nome_instituicao: string;
    cidade: string | null;
    estado: string | null;
    natureza: string;
    nota_mec: number | string | null;
  };
}

interface Paginated<T> {
  data: T[];
  total: number;
}

interface Favorite {
  id_favorito: string;
  tipo: string;
  alvo_id: string;
}

interface FavoriteRecord {
  id_favorito: string;
}

const money = (value: number | string | null) =>
  value == null
    ? 'Consulte a instituição'
    : Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function errorText(error: unknown, fallback: string) {
  return axios.isAxiosError<{ error?: string }>(error)
    ? error.response?.data?.error ?? fallback
    : fallback;
}

export const CourseDetailPanel: React.FC<{
  courseId: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onBack: () => void;
}> = ({ courseId, isFavorite, onToggleFavorite, onBack }) => {
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseRecord | null>(null);
  const [offers, setOffers] = useState<CourseOffer[]>([]);
  const [offerCount, setOfferCount] = useState(0);
  const [favoriteInstitutions, setFavoriteInstitutions] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMessage('');
    Promise.all([
      api.get<CourseRecord>(`/cursos/${courseId}`),
      api.get<Paginated<CourseOffer>>('/ofertas', {
        params: { id_curso: courseId, page: 1, limit: 100, ordenar: 'mensalidade' }
      }),
      api.get<Favorite[]>('/favoritos')
    ])
      .then(([courseResponse, offersResponse, favoritesResponse]) => {
        if (!active) return;
        setCourse(courseResponse.data);
        setOffers(offersResponse.data.data);
        setOfferCount(offersResponse.data.total);
        setFavoriteInstitutions(new Map(
          favoritesResponse.data
            .filter(favorite => favorite.tipo === 'INSTITUICAO')
            .map(favorite => [favorite.alvo_id, favorite.id_favorito])
        ));
      })
      .catch(error => {
        if (active) setErrorMessage(errorText(error, 'Não foi possível carregar os detalhes do curso.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [courseId]);

  const toggleInstitutionFavorite = async (institutionId: string) => {
    setErrorMessage('');
    try {
      const favoriteId = favoriteInstitutions.get(institutionId);
      if (favoriteId) {
        await api.delete(`/favoritos/${favoriteId}`);
        setFavoriteInstitutions(current => {
          const next = new Map(current);
          next.delete(institutionId);
          return next;
        });
      } else {
        const { data } = await api.post<FavoriteRecord>('/favoritos', {
          tipo: 'INSTITUICAO',
          id: institutionId
        });
        setFavoriteInstitutions(current => new Map(current).set(institutionId, data.id_favorito));
      }
    } catch (error) {
      setErrorMessage(errorText(error, 'Não foi possível atualizar o favorito da instituição.'));
    }
  };

  const grade = (course?.grade_curricular ?? '')
    .split(/\r?\n|;/)
    .map(item => item.trim())
    .filter(Boolean);

  return (
    <div className="student-page">
      <header className="student-header">
        <button type="button" className="secondary-button" onClick={onBack}>← Voltar aos cursos</button>
      </header>
      <main className="student-main detail-layout">
        {loading && <p role="status">Carregando detalhes do curso...</p>}
        {errorMessage && <div role="alert" className="notice notice--error">{errorMessage}</div>}
        {course && (
          <>
            <section className="detail-hero detail-hero--course">
              <div>
                <span className="eyebrow">{course.area_curso} · {course.grau_academico}</span>
                <h1>{course.nome_curso}</h1>
                <div className="detail-chip-row">
                  <span>{course.modalidade}</span>
                  {course.duracao_meses != null && <span>{course.duracao_meses} meses</span>}
                  <span>{course.carga_horaria} horas</span>
                </div>
              </div>
              <button type="button" className={`favorite-button${isFavorite ? ' is-favorite' : ''}`} onClick={onToggleFavorite} aria-label={isFavorite ? 'Remover curso dos favoritos' : 'Salvar curso nos favoritos'}>
                {isFavorite ? '♥' : '♡'}
              </button>
            </section>

            <section className="detail-section">
              <h2>Sobre o curso</h2>
              <p>{course.descricao || 'A descrição deste curso ainda não foi cadastrada.'}</p>
            </section>

            <section className="detail-stat-grid">
              <article><span>Grau acadêmico</span><strong>{course.grau_academico}</strong></article>
              <article><span>Modalidade</span><strong>{course.modalidade}</strong></article>
              <article><span>Duração</span><strong>{course.duracao_meses == null ? 'Não informada' : `${course.duracao_meses} meses`}</strong></article>
              <article><span>Carga horária</span><strong>{course.carga_horaria} horas</strong></article>
              <article><span>Ofertas disponíveis</span><strong>{offerCount}</strong></article>
              <article><span>Avaliação</span><strong>{course.avaliacoes.media == null ? 'Sem avaliações' : `${Number(course.avaliacoes.media).toLocaleString('pt-BR')} / 5`}</strong></article>
            </section>

            {grade.length > 0 && (
              <section className="detail-section">
                <h2>Grade curricular</h2>
                <ol className="detail-list">
                  {grade.map((subject, index) => <li key={`${subject}-${index}`}>{subject}</li>)}
                </ol>
              </section>
            )}

            <section className="detail-section">
              <div className="section-heading">
                <div>
                  <h2>Onde estudar</h2>
                  <p>{offerCount} {offerCount === 1 ? 'oferta disponível' : 'ofertas disponíveis'}</p>
                </div>
              </div>
              {offers.length === 0 && <p>Nenhuma oferta disponível para este curso no momento.</p>}
              <div className="detail-offer-grid">
                {offers.map(offer => {
                  const location = [
                    offer.local_oferta.polo_nome,
                    [offer.local_oferta.cidade, offer.local_oferta.estado].filter(Boolean).join(', ')
                      || [offer.instituicao.cidade, offer.instituicao.estado].filter(Boolean).join(', ')
                  ].filter(Boolean).join(' · ');
                  return (
                    <article className="detail-offer-card" key={offer.id_curso_instituicao}>
                      <div className="section-heading">
                        <div>
                          <h3>{offer.instituicao.nome_instituicao}</h3>
                          <p>{location || 'Localização não informada'}</p>
                          <p>{offer.instituicao.natureza === 'PUBLICA' ? 'Pública' : 'Privada'}
                            {offer.instituicao.nota_mec != null ? ` · Nota MEC ${Number(offer.instituicao.nota_mec).toLocaleString('pt-BR')}` : ''}
                            {offer.distancia_km != null ? ` · ${offer.distancia_km.toFixed(1)} km` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          className={`favorite-button favorite-button--small${favoriteInstitutions.has(offer.instituicao.id_instituicao) ? ' is-favorite' : ''}`}
                          aria-label={favoriteInstitutions.has(offer.instituicao.id_instituicao) ? 'Remover instituição dos favoritos' : 'Salvar instituição nos favoritos'}
                          onClick={() => void toggleInstitutionFavorite(offer.instituicao.id_instituicao)}
                        >
                          {favoriteInstitutions.has(offer.instituicao.id_instituicao) ? '♥' : '♡'}
                        </button>
                      </div>
                      <div className="offer-price">
                        <span>Mensalidade</span>
                        <strong>{money(offer.mensalidade)}
                          {offer.mensalidade_max != null && Number(offer.mensalidade_max) !== Number(offer.mensalidade)
                            ? ` a ${money(offer.mensalidade_max)}`
                            : ''}
                        </strong>
                      </div>
                      <p><strong>Ingresso:</strong> {offer.formas_ingresso || 'Consulte a instituição'}</p>
                      {offer.bolsas && <p><strong>Bolsas:</strong> {offer.bolsas}</p>}
                      {(offer.prouni || offer.fies) && <div className="detail-chip-row">
                        {offer.prouni && <span>ProUni</span>}
                        {offer.fies && <span>FIES</span>}
                      </div>}
                      {offer.nota_corte != null && <p>Nota de corte: {Number(offer.nota_corte).toLocaleString('pt-BR')}
                        {offer.programa_nota_corte ? ` · ${offer.programa_nota_corte}` : ''}
                        {offer.ano_nota_corte ? ` · ${offer.ano_nota_corte}` : ''}
                      </p>}
                      <button type="button" className="secondary-button" onClick={() => navigate(`/faculdade/${offer.instituicao.id_instituicao}`)}>
                        Ver instituição
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>

            {course.cargos.length > 0 && (
              <section className="detail-section">
                <h2>Carreiras relacionadas</h2>
                <div className="detail-chip-row">
                  {course.cargos.map(career => <span key={career.id_cargo}>{career.nome} · {career.area_atuacao}</span>)}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};
