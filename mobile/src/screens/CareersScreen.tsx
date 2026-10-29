import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Heading, Loading, Message, MobileHeader, Page } from '../components/UI';
import { api } from '../services/api';
import { getErrorMessage } from '../services/errors';
import { RootStackParamList } from '../navigation/navigationTypes';
import { colors, useTheme } from '../theme';
import { CareerDetailView } from './CareerDetailView';

interface Career {
  id_cargo: string;
  nome: string;
  area_atuacao: string;
  descricao: string;
  hard_skills: string;
  soft_skills: string;
  panorama_mercado: string;
  salario_piso: number | string | null;
  salario_media: number | string | null;
  salario_teto: number | string | null;
  afinidade: number | null;
}

interface PageResult<T> { data: T[]; total: number; totalPages: number }
interface Favorite { id_favorito: string; tipo: string; alvo_id: string }

const money = (value: number | string | null) =>
  value == null ? 'Não informado' : Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function CareersScreen() {
  useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [careers, setCareers] = useState<Career[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Map<string, string>>(new Map());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCareerId, setSelectedCareerId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [careerResponse, favoriteResponse] = await Promise.all([
        api.get<PageResult<Career>>('/cargos', { params: { page, limit: 50, ordenar: 'afinidade' } }),
        api.get<Favorite[]>('/favoritos'),
      ]);
      setCareers((current) => page === 1
        ? careerResponse.data.data
        : [...new Map([...current, ...careerResponse.data.data].map((career) => [career.id_cargo, career])).values()]);
      setTotalPages(careerResponse.data.totalPages);
      setFavoriteIds(new Map(
        favoriteResponse.data.filter((favorite) => favorite.tipo === 'CARGO')
          .map((favorite) => [favorite.alvo_id, favorite.id_favorito]),
      ));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível carregar as carreiras.'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const toggleFavorite = async (careerId: string) => {
    setErrorMessage('');
    try {
      const favoriteId = favoriteIds.get(careerId);
      if (favoriteId) {
        await api.delete(`/favoritos/${favoriteId}`);
        setFavoriteIds((current) => {
          const next = new Map(current);
          next.delete(careerId);
          return next;
        });
      } else {
        const response = await api.post<Favorite>('/favoritos', { tipo: 'CARGO', id: careerId });
        setFavoriteIds((current) => new Map(current).set(careerId, response.data.id_favorito));
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível atualizar o favorito.'));
    }
  };

  if (selectedCareerId) {
    return (
      <CareerDetailView
        careerId={selectedCareerId}
        isFavorite={favoriteIds.has(selectedCareerId)}
        onBack={() => setSelectedCareerId(null)}
        onToggleFavorite={() => void toggleFavorite(selectedCareerId)}
      />
    );
  }

  return (
    <Page>
      <MobileHeader caption="Explore carreiras, salários e trilhas de formação" onProfilePress={() => navigation.navigate('MainTabs', { screen: 'Perfil' })} />
      <Heading title="Carreiras" subtitle="Conheça áreas de atuação e caminhos profissionais." />
      {errorMessage ? <Message error>{errorMessage}</Message> : null}
      {loading ? <Loading label="Carregando carreiras..." /> : null}
      {!loading && !careers.length ? <Message>Nenhuma carreira disponível no momento.</Message> : null}
      {careers.map((career) => (
        <Card key={career.id_cargo}>
          <Text onPress={() => setSelectedCareerId(career.id_cargo)} style={{ color: colors.accent, fontSize: 11, fontWeight: '800', textAlign: 'right' }}>Ver detalhes →</Text>
          <Pressable onPress={() => setSelectedCareerId(career.id_cargo)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.softAccent, borderRadius: 12 }}>
              <Text style={{ color: colors.accent, fontSize: 18, fontWeight: '900' }}>{career.nome.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{career.nome}</Text>
              <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '800' }}>{career.area_atuacao}</Text>
            </View>
            {career.afinidade !== null ? (
              <View style={{ paddingHorizontal: 8, paddingVertical: 5, backgroundColor: colors.softSuccess, borderRadius: 12 }}>
                <Text style={{ color: colors.success, fontSize: 10, fontWeight: '800' }}>{career.afinidade}% afinidade</Text>
              </View>
            ) : null}
          </Pressable>
          <Text style={{ color: colors.subtle, fontSize: 13, lineHeight: 19 }}>{career.descricao}</Text>
          <View style={{ padding: 12, gap: 10, backgroundColor: colors.softWarning, borderWidth: 1, borderColor: colors.primaryDark, borderRadius: 12 }}>
            <Text style={{ color: colors.warning, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>FAIXA SALARIAL ESTIMADA</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
              {[
                { label: 'PISO', value: career.salario_piso },
                { label: 'MÉDIA', value: career.salario_media },
                { label: 'TETO', value: career.salario_teto },
              ].map((salary) => (
                <View key={salary.label} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
                  <Text style={{ color: colors.subtle, fontSize: 9, fontWeight: '800' }}>{salary.label}</Text>
                  <Text style={{ color: colors.text, fontSize: 11, fontWeight: '900', textAlign: 'center' }}>{money(salary.value)}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={{ color: colors.text, fontSize: 12 }}><Text style={{ fontWeight: '800' }}>Habilidades: </Text>{[career.hard_skills, career.soft_skills].filter(Boolean).join(' · ')}</Text>
          <Text style={{ color: colors.subtle, fontSize: 12, lineHeight: 18 }}>{career.panorama_mercado}</Text>
          <Button title="Conhecer carreira" secondary onPress={() => setSelectedCareerId(career.id_cargo)} />
          <Button
            title={favoriteIds.has(career.id_cargo) ? '♥ Salvo' : '♡ Salvar carreira'}
            secondary
            onPress={() => void toggleFavorite(career.id_cargo)}
          />
        </Card>
      ))}
      {!loading && page < totalPages ? (
        <Button title="Carregar mais carreiras" secondary onPress={() => setPage((current) => current + 1)} />
      ) : null}
    </Page>
  );
}
