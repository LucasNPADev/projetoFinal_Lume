import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Field, Heading, Loading, Message, MobileHeader, Page } from '../components/UI';
import { RootStackParamList } from '../navigation/navigationTypes';
import { api } from '../services/api';
import { getErrorMessage } from '../services/errors';
import { colors, useTheme } from '../theme';
import { CourseDetailView } from './CourseDetailView';

interface CourseOffer {
  id_curso_instituicao: string;
  id_curso: string;
  mensalidade: number | string | null;
  mensalidade_max: number | string | null;
  prouni: boolean;
  fies: boolean;
  formas_ingresso: string | null;
  bolsas: string | null;
  nota_corte: number | string | null;
  ano_nota_corte: number | null;
  programa_nota_corte: string | null;
  local_oferta: { cidade: string | null; estado: string | null; polo_nome: string | null };
  distancia_km: number | null;
  curso: {
    nome_curso: string;
    grau_academico: string;
    modalidade: string;
    area_curso: string;
    carga_horaria: number;
    duracao_meses: number | null;
  };
  instituicao: {
    id_instituicao: string;
    nome_instituicao: string;
    cidade: string | null;
    estado: string | null;
  };
}

interface PageResult<T> { data: T[]; total: number; totalPages: number }
interface Favorite { id_favorito: string; tipo: string; alvo_id: string }

const money = (value: number | string | null) =>
  value == null ? 'Consulte a instituição' : Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function groupCoursesById(offers: CourseOffer[]) {
  const courses = new Map<string, {
    offer: CourseOffer;
    institutionIds: Set<string>;
    lowestMonthly: number | string | null;
  }>();

  offers.forEach((offer) => {
    const course = courses.get(offer.id_curso);
    if (!course) {
      courses.set(offer.id_curso, {
        offer,
        institutionIds: new Set([offer.instituicao.id_instituicao]),
        lowestMonthly: offer.mensalidade,
      });
      return;
    }

    course.institutionIds.add(offer.instituicao.id_instituicao);
    if (
      offer.mensalidade != null
      && (course.lowestMonthly == null || Number(offer.mensalidade) < Number(course.lowestMonthly))
    ) {
      course.lowestMonthly = offer.mensalidade;
    }
  });

  return Array.from(courses, ([id, course]) => ({ id, ...course }));
}

export function CoursesScreen() {
  useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [offers, setOffers] = useState<CourseOffer[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Map<string, string>>(new Map());
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const courses = groupCoursesById(offers);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [offerResponse, favoriteResponse] = await Promise.all([
        api.get<PageResult<CourseOffer>>('/ofertas', {
          params: { page, limit: 30, ordenar: 'nome', ...(search ? { busca: search } : {}) },
        }),
        api.get<Favorite[]>('/favoritos'),
      ]);
      setOffers((current) => page === 1
        ? offerResponse.data.data
        : [...new Map([...current, ...offerResponse.data.data].map((offer) => [offer.id_curso_instituicao, offer])).values()]);
      setTotalPages(offerResponse.data.totalPages);
      setFavoriteIds(new Map(
        favoriteResponse.data.filter((favorite) => favorite.tipo === 'CURSO')
          .map((favorite) => [favorite.alvo_id, favorite.id_favorito]),
      ));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível carregar as ofertas de cursos.'));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const toggleFavorite = async (courseId: string) => {
    setErrorMessage('');
    try {
      const favoriteId = favoriteIds.get(courseId);
      if (favoriteId) {
        await api.delete(`/favoritos/${favoriteId}`);
        setFavoriteIds((current) => {
          const next = new Map(current);
          next.delete(courseId);
          return next;
        });
      } else {
        const response = await api.post<Favorite>('/favoritos', { tipo: 'CURSO', id: courseId });
        setFavoriteIds((current) => new Map(current).set(courseId, response.data.id_favorito));
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível atualizar o favorito.'));
    }
  };

  if (selectedCourseId) {
    return (
      <CourseDetailView
        courseId={selectedCourseId}
        isFavorite={favoriteIds.has(selectedCourseId)}
        onBack={() => setSelectedCourseId(null)}
        onToggleFavorite={() => void toggleFavorite(selectedCourseId)}
      />
    );
  }

  return (
    <Page>
      <MobileHeader
        caption="Encontre sua próxima oportunidade"
        onBackPress={() => navigation.goBack()}
        onProfilePress={() => navigation.navigate('MainTabs', { screen: 'Perfil' })}
      />
      <View style={{ gap: 5 }}>
        <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>EXPLORE POSSIBILIDADES</Text>
        <Heading title="Cursos" subtitle="Compare formações, instituições e oportunidades para dar o próximo passo." />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: colors.softAccent, borderRadius: 13 }}>
        <View style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 12 }}>
          <Text style={{ fontSize: 19 }}>🎓</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '900' }}>{courses.length} {courses.length === 1 ? 'curso exibido' : 'cursos exibidos'}</Text>
          <Text style={{ color: colors.subtle, fontSize: 10 }}>Cursos agrupados; veja faculdades e mensalidades ao abrir cada um</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Field label="BUSCAR CURSO OU INSTITUIÇÃO" value={searchText} onChangeText={setSearchText} placeholder="Ex.: Medicina, engenharia..." returnKeyType="search" onSubmitEditing={() => { setPage(1); setSearch(searchText.trim()); }} />
        </View>
        <View style={{ width: 92, marginBottom: 4 }}>
          <Button title="Buscar" onPress={() => { setPage(1); setSearch(searchText.trim()); }} />
        </View>
      </View>
      {errorMessage ? <Message error>{errorMessage}</Message> : null}
      {loading ? <Loading label="Carregando cursos..." /> : null}
      {!loading && !courses.length ? <Message>Nenhuma oferta encontrada.</Message> : null}
      {courses.map(({ id, offer, institutionIds, lowestMonthly }) => {
        const favorite = favoriteIds.has(id);
        return (
          <Card key={id}>
            <View style={{ height: 4, marginHorizontal: -16, marginTop: -16, backgroundColor: colors.accent, borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedCourseId(id)}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 }}
              >
                <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.softAccent, borderRadius: 13 }}>
                  <Text style={{ fontSize: 21 }}>📖</Text>
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>{offer.curso.nome_curso}</Text>
                  <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '800' }}>{offer.curso.area_curso} · {offer.curso.grau_academico}</Text>
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={favorite ? 'Remover curso dos favoritos' : 'Salvar curso nos favoritos'}
                onPress={() => void toggleFavorite(id)}
                style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: favorite ? colors.softDanger : colors.muted, borderRadius: 20 }}
              >
                <Text style={{ color: favorite ? '#C81045' : colors.subtle, fontSize: 17 }}>{favorite ? '♥' : '♡'}</Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {[
                offer.curso.modalidade,
                offer.curso.duracao_meses ? `${offer.curso.duracao_meses} meses` : null,
                `${offer.curso.carga_horaria}h`,
              ].filter(Boolean).map((tag) => (
                <Text key={tag} style={{ overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5, backgroundColor: colors.muted, borderRadius: 12, color: colors.subtle, fontSize: 9, fontWeight: '800' }}>{tag}</Text>
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, padding: 11, backgroundColor: colors.muted, borderRadius: 10 }}>
              <Text style={{ fontSize: 17 }}>🏛️</Text>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: '900' }}>{institutionIds.size} {institutionIds.size === 1 ? 'instituição listada' : 'instituições listadas'}</Text>
                <Text style={{ color: colors.subtle, fontSize: 10 }}>Veja todas as faculdades e ofertas no detalhe do curso</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: colors.subtle, fontSize: 9, fontWeight: '800' }}>MENSALIDADE A PARTIR DE</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.success, fontSize: 15, fontWeight: '900' }}>
                  {money(lowestMonthly)}
                </Text>
              </View>
            </View>
            <Button title="Ver faculdades e detalhes" secondary onPress={() => setSelectedCourseId(id)} />
          </Card>
        );
      })}
      {!loading && page < totalPages ? (
        <Button title="Carregar mais cursos" secondary onPress={() => setPage((current) => current + 1)} />
      ) : null}
    </Page>
  );
}
