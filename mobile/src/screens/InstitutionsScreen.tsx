import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, Field, Heading, Loading, Message, MobileHeader, Page } from '../components/UI';
import { api } from '../services/api';
import { getErrorMessage } from '../services/errors';
import { colors, useTheme } from '../theme';
import { RootStackParamList } from '../navigation/navigationTypes';
import { InstitutionDetailView } from './InstitutionDetailScreen';

interface Institution {
  id_instituicao: string;
  nome_instituicao: string;
  nota_mec: number | string | null;
  cidade: string | null;
  estado: string | null;
  natureza?: string;
}

interface Favorite {
  id_favorito: string;
  tipo: string;
  alvo_id: string;
}

interface PageResult<T> {
  data: T[];
  total: number;
  totalPages: number;
}

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function InstitutionsScreen() {
  useTheme();
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const [items, setItems] = useState<Institution[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Map<string, string>>(new Map());
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [institutions, favorites] = await Promise.all([
        api.get<PageResult<Institution>>('/instituicoes', {
          params: { page, limit: 50, ordenar: 'nome', ...(search ? { busca: search } : {}) },
        }),
        api.get<Favorite[]>('/favoritos'),
      ]);
      setItems((current) => page === 1
        ? institutions.data.data
        : [...new Map([...current, ...institutions.data.data].map((item) => [item.id_instituicao, item])).values()]);
      setTotal(institutions.data.total);
      setTotalPages(institutions.data.totalPages);
      setFavoriteIds(new Map(
        favorites.data
          .filter((favorite) => favorite.tipo === 'INSTITUICAO')
          .map((favorite) => [favorite.alvo_id, favorite.id_favorito]),
      ));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível carregar as instituições.'));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const toggleFavorite = async (item: Institution) => {
    setErrorMessage('');
    try {
      const favoriteId = favoriteIds.get(item.id_instituicao);
      if (favoriteId) {
        await api.delete(`/favoritos/${favoriteId}`);
        setFavoriteIds((current) => {
          const next = new Map(current);
          next.delete(item.id_instituicao);
          return next;
        });
      } else {
        const response = await api.post<Favorite>('/favoritos', {
          tipo: 'INSTITUICAO',
          id: item.id_instituicao,
        });
        setFavoriteIds((current) => new Map(current).set(item.id_instituicao, response.data.id_favorito));
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível atualizar o favorito.'));
    }
  };

  if (selectedInstitutionId) {
    return (
      <InstitutionDetailView
        institutionId={selectedInstitutionId}
        onBack={() => setSelectedInstitutionId(null)}
      />
    );
  }

  return (
    <Page>
      <MobileHeader
        caption="Encontre o caminho certo para o seu futuro"
        onProfilePress={() => navigation.navigate('MainTabs', { screen: 'Perfil' })}
      />
      <View style={{ gap: 4 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>
          Olá, {user?.nome?.split(' ')[0] ?? 'estudante'} 👋
        </Text>
        <Heading title="Faculdades perto de você" subtitle={`${total} instituições para explorar`} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button title="▤  Explorar cursos" secondary onPress={() => navigation.navigate('Courses')} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="♡  Meus favoritos" secondary onPress={() => navigation.navigate('Favorites')} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Card>
            <Text style={{ color: colors.accent, fontSize: 22, fontWeight: '900' }}>{items.filter((item) => item.natureza === 'PUBLICA').length}</Text>
            <Text style={{ color: colors.subtle, fontSize: 10, fontWeight: '800' }}>PÚBLICAS NESTA PÁGINA</Text>
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Card>
            <Text style={{ color: colors.accent, fontSize: 22, fontWeight: '900' }}>{items.filter((item) => item.natureza === 'PRIVADA').length}</Text>
            <Text style={{ color: colors.subtle, fontSize: 10, fontWeight: '800' }}>PRIVADAS NESTA PÁGINA</Text>
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Card>
            <Text style={{ color: colors.accent, fontSize: 22, fontWeight: '900' }}>{total}</Text>
            <Text style={{ color: colors.subtle, fontSize: 10, fontWeight: '800' }}>NO TOTAL</Text>
          </Card>
        </View>
      </View>
      <Heading title="Instituições" subtitle="Conheça as opções disponíveis e salve as suas favoritas." />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Field label="BUSCAR INSTITUIÇÃO" value={searchText} onChangeText={setSearchText} placeholder="Nome da faculdade" returnKeyType="search" onSubmitEditing={() => setSearch(searchText.trim())} />
        </View>
        <View style={{ width: 92, marginBottom: 4 }}>
          <Button title="Buscar" onPress={() => { setPage(1); setSearch(searchText.trim()); }} />
        </View>
      </View>
      {errorMessage ? <Message error>{errorMessage}</Message> : null}
      {loading ? <Loading label="Carregando instituições..." /> : null}
      {!loading && !items.length ? <Message>Nenhuma instituição encontrada.</Message> : null}
      {items.map((item) => {
        const favorite = favoriteIds.has(item.id_instituicao);
        return (
          <Card key={item.id_instituicao}>
            <Pressable onPress={() => setSelectedInstitutionId(item.id_instituicao)}>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>{item.nome_instituicao}</Text>
              <Text style={{ color: colors.subtle, fontSize: 13, marginTop: 4 }}>
                {[item.cidade, item.estado].filter(Boolean).join(', ') || 'Localização não informada'}
              </Text>
              <Text style={{ color: colors.subtle, fontSize: 12, marginTop: 5 }}>
                {item.natureza === 'PUBLICA' ? 'Pública' : item.natureza === 'PRIVADA' ? 'Privada' : 'Instituição de ensino'}
                {' · Nota MEC: '}{item.nota_mec == null ? 'não informada' : `${Number(item.nota_mec).toLocaleString('pt-BR')} / 5`}
              </Text>
              <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '800', marginTop: 10 }}>Ver detalhes →</Text>
            </Pressable>
            <Button title={favorite ? '♥ Salvo' : '♡ Salvar instituição'} secondary onPress={() => void toggleFavorite(item)} />
          </Card>
        );
      })}
      {!loading && page < totalPages ? (
        <Button title="Carregar mais instituições" secondary onPress={() => setPage((current) => current + 1)} />
      ) : null}
    </Page>
  );
}
