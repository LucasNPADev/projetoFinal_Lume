import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Heading, Loading, Message, MobileHeader, Page } from '../components/UI';
import { RootStackParamList } from '../navigation/navigationTypes';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../services/api';
import { getErrorMessage } from '../services/errors';
import { colors, useTheme } from '../theme';

interface CourseOffer {
  id_curso_instituicao: string;
  id_curso: string;
  mensalidade: number | string | null;
  mensalidade_max: number | string | null;
  formas_ingresso: string | null;
  bolsas: string | null;
  nota_corte: number | string | null;
  ano_nota_corte: number | null;
  programa_nota_corte: string | null;
  prouni: boolean;
  fies: boolean;
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

interface CourseDetail {
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

interface PageResult<T> { data: T[]; total: number; totalPages: number }
interface Favorite { id_favorito: string; tipo: string; alvo_id: string }

const courseAccent = '#6D4AFF';

const money = (value: number | string | null) =>
  value == null
    ? 'Consulte a instituição'
    : Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function InfoTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ width: '48%', minHeight: 82, justifyContent: 'center', gap: 5, padding: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12 }}>
      <Text style={{ fontSize: 17 }}>{icon}</Text>
      <Text style={{ color: colors.subtle, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}

export function CourseDetailView({
  courseId,
  isFavorite,
  onBack,
  onToggleFavorite,
}: {
  courseId: string;
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
}) {
  useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [offers, setOffers] = useState<CourseOffer[]>([]);
  const [offerCount, setOfferCount] = useState(0);
  const [favoriteInstitutionIds, setFavoriteInstitutionIds] = useState<Map<string, string>>(new Map());
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMessage('');
    Promise.all([
      api.get<CourseDetail>(`/cursos/${courseId}`),
      api.get<PageResult<CourseOffer>>('/ofertas', {
        params: { id_curso: courseId, page: 1, limit: 100, ordenar: 'mensalidade' },
      }),
      api.get<Favorite[]>('/favoritos'),
    ])
      .then(([courseResponse, offerResponse, favoriteResponse]) => {
        if (!active) return;
        setCourse(courseResponse.data);
        setOffers(offerResponse.data.data);
        setOfferCount(offerResponse.data.total);
        setFavoriteInstitutionIds(new Map(
          favoriteResponse.data
            .filter((favorite) => favorite.tipo === 'INSTITUICAO')
            .map((favorite) => [favorite.alvo_id, favorite.id_favorito]),
        ));
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(getErrorMessage(error, 'Não foi possível carregar os detalhes do curso.'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId]);

  const toggleInstitutionFavorite = async (institutionId: string) => {
    setErrorMessage('');
    try {
      const favoriteId = favoriteInstitutionIds.get(institutionId);
      if (favoriteId) {
        await api.delete(`/favoritos/${favoriteId}`);
        setFavoriteInstitutionIds((current) => {
          const next = new Map(current);
          next.delete(institutionId);
          return next;
        });
      } else {
        const { data } = await api.post<Favorite>('/favoritos', { tipo: 'INSTITUICAO', id: institutionId });
        setFavoriteInstitutionIds((current) => new Map(current).set(institutionId, data.id_favorito));
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível atualizar o favorito da instituição.'));
    }
  };

  const gradeItems = (course?.grade_curricular ?? '')
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <Page>
      <MobileHeader caption="Detalhes do curso" onBackPress={onBack} />
      {loading ? <Loading label="Carregando detalhes do curso..." /> : null}
      {errorMessage ? <Message error>{errorMessage}</Message> : null}
      {course ? (
        <>
          <View style={{ overflow: 'hidden', gap: 14, padding: 18, backgroundColor: courseAccent, borderRadius: 17 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14 }}>
                <Text style={{ fontSize: 24 }}>🎓</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 19, fontWeight: '900' }}>{course.nome_curso}</Text>
                <Text style={{ color: '#F0ECFF', fontSize: 11 }}>{course.area_curso} · {course.grau_academico}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isFavorite ? 'Remover curso dos favoritos' : 'Salvar curso nos favoritos'}
                onPress={onToggleFavorite}
                style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 19 }}>{isFavorite ? '♥' : '♡'}</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {[
                course.modalidade,
                course.duracao_meses == null ? null : `${course.duracao_meses} meses`,
                `${course.carga_horaria} horas`,
              ].filter(Boolean).map((tag) => (
                <Text key={tag} style={{ overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>{tag}</Text>
              ))}
            </View>
          </View>

          <Heading title="Sobre o curso" />
          <Card>
            <Text style={{ color: colors.subtle, fontSize: 12, lineHeight: 19 }}>
              {course.descricao || 'A descrição deste curso ainda não foi cadastrada.'}
            </Text>
          </Card>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
            <InfoTile icon="📚" label="Grau acadêmico" value={course.grau_academico} />
            <InfoTile icon="🖥️" label="Modalidade" value={course.modalidade} />
            <InfoTile icon="⏳" label="Duração" value={course.duracao_meses == null ? 'Não informada' : `${course.duracao_meses} meses`} />
            <InfoTile icon="📝" label="Carga horária" value={`${course.carga_horaria} horas`} />
            <InfoTile icon="🏫" label="Ofertas disponíveis" value={String(offerCount)} />
            <InfoTile icon="⭐" label="Avaliação" value={course.avaliacoes.media == null ? 'Sem avaliações' : `${Number(course.avaliacoes.media).toLocaleString('pt-BR')} / 5`} />
          </View>

          {gradeItems.length ? (
            <Card>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>Grade curricular</Text>
              {gradeItems.map((subject, index) => (
                <View key={`${subject}-${index}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 4 }}>
                  <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.softAccent, borderRadius: 12 }}>
                    <Text style={{ color: courseAccent, fontSize: 10, fontWeight: '900' }}>{index + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, color: colors.text, fontSize: 12 }}>{subject}</Text>
                </View>
              ))}
            </Card>
          ) : null}

          <Heading title="Onde estudar" subtitle={`${offerCount} ${offerCount === 1 ? 'oferta disponível' : 'ofertas disponíveis'}`} />
          {!offers.length ? <Message>Nenhuma oferta disponível para este curso no momento.</Message> : null}
          {offers.map((offer) => {
            const location = [
              offer.local_oferta.polo_nome,
              [offer.local_oferta.cidade, offer.local_oferta.estado].filter(Boolean).join(', ')
                || [offer.instituicao.cidade, offer.instituicao.estado].filter(Boolean).join(', '),
            ].filter(Boolean).join(' · ');
            return (
              <Card key={offer.id_curso_instituicao}>
                <View style={{ height: 4, marginHorizontal: -16, marginTop: -16, backgroundColor: courseAccent, borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => navigation.navigate('InstitutionDetail', { institutionId: offer.instituicao.id_instituicao })}
                    style={{ flex: 1, gap: 4 }}
                  >
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>{offer.instituicao.nome_instituicao}</Text>
                    <Text style={{ color: colors.subtle, fontSize: 11 }}>{location || 'Localização não informada'}</Text>
                    <Text style={{ color: colors.subtle, fontSize: 10 }}>
                      {offer.instituicao.natureza === 'PUBLICA' ? 'Pública' : 'Privada'}
                      {offer.instituicao.nota_mec != null ? ` · Nota MEC ${Number(offer.instituicao.nota_mec).toLocaleString('pt-BR')}` : ''}
                      {offer.distancia_km != null ? ` · ${offer.distancia_km.toFixed(1)} km` : ''}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={favoriteInstitutionIds.has(offer.instituicao.id_instituicao) ? 'Remover instituição dos favoritos' : 'Salvar instituição nos favoritos'}
                    onPress={() => void toggleInstitutionFavorite(offer.instituicao.id_instituicao)}
                    style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.muted, borderRadius: 18 }}
                  >
                    <Text style={{ color: favoriteInstitutionIds.has(offer.instituicao.id_instituicao) ? '#C81045' : colors.subtle, fontSize: 17 }}>
                      {favoriteInstitutionIds.has(offer.instituicao.id_instituicao) ? '♥' : '♡'}
                    </Text>
                  </Pressable>
                </View>
                <View style={{ padding: 12, gap: 5, backgroundColor: colors.softAccent, borderRadius: 10 }}>
                  <Text style={{ color: colors.subtle, fontSize: 10, fontWeight: '800' }}>MENSALIDADE</Text>
                  <Text style={{ color: courseAccent, fontSize: 17, fontWeight: '900' }}>
                    {money(offer.mensalidade)}
                    {offer.mensalidade_max != null && Number(offer.mensalidade_max) !== Number(offer.mensalidade) ? ` a ${money(offer.mensalidade_max)}` : ''}
                  </Text>
                </View>
                {(offer.prouni || offer.fies || offer.bolsas) ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {offer.prouni ? <Text style={{ paddingHorizontal: 9, paddingVertical: 5, backgroundColor: colors.softSuccess, borderRadius: 12, color: colors.success, fontSize: 10, fontWeight: '800' }}>ProUni</Text> : null}
                    {offer.fies ? <Text style={{ paddingHorizontal: 9, paddingVertical: 5, backgroundColor: colors.softAccent, borderRadius: 12, color: courseAccent, fontSize: 10, fontWeight: '800' }}>FIES</Text> : null}
                    {offer.bolsas ? <Text style={{ paddingHorizontal: 9, paddingVertical: 5, backgroundColor: colors.softWarning, borderRadius: 12, color: colors.warning, fontSize: 10, fontWeight: '800' }}>Bolsas disponíveis</Text> : null}
                  </View>
                ) : null}
                {offer.nota_corte != null ? (
                  <Text style={{ color: colors.subtle, fontSize: 11 }}>
                    Nota de corte: {Number(offer.nota_corte).toLocaleString('pt-BR')}
                    {offer.programa_nota_corte ? ` · ${offer.programa_nota_corte}` : ''}
                    {offer.ano_nota_corte ? ` · ${offer.ano_nota_corte}` : ''}
                  </Text>
                ) : null}
                <Text style={{ color: colors.subtle, fontSize: 11, lineHeight: 17 }}>
                  Ingresso: {offer.formas_ingresso || 'Consulte a instituição'}
                </Text>
                <Button
                  title="Ver instituição"
                  secondary
                  onPress={() => navigation.navigate('InstitutionDetail', { institutionId: offer.instituicao.id_instituicao })}
                />
              </Card>
            );
          })}

          {course.cargos.length ? (
            <Card>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>Carreiras relacionadas</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                {course.cargos.map((career) => (
                  <View key={career.id_cargo} style={{ paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.softDanger, borderRadius: 15 }}>
                    <Text style={{ color: colors.danger, fontSize: 10, fontWeight: '700' }}>{career.nome}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}

          <Button title={isFavorite ? '♥ Curso salvo' : '♡ Salvar curso'} secondary onPress={onToggleFavorite} />
        </>
      ) : null}
    </Page>
  );
}
