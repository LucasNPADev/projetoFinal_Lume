import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { Button, Card, Heading, Loading, Message, MobileHeader, Page } from '../components/UI';
import { RootStackParamList } from '../navigation/navigationTypes';
import { api } from '../services/api';
import { getErrorMessage } from '../services/errors';
import { colors, useTheme } from '../theme';

interface Favorite {
  id_favorito: string;
  tipo: 'CARGO' | 'CURSO' | 'INSTITUICAO' | 'ROTA';
  alvo_id: string;
  cargo: { nome: string; area_atuacao: string; descricao: string | null } | null;
  curso: { nome_curso: string; area_curso: string; modalidade: string; duracao_meses: number | null } | null;
  instituicao: { nome_instituicao: string; cidade: string | null; estado: string | null } | null;
  rota: {
    nome: string;
    descricao: string | null;
    cargo: { nome: string; area_atuacao: string };
    etapas: Array<{ curso: { nome_curso: string } }>;
  } | null;
}

const typeLabels: Record<Favorite['tipo'], string> = {
  CARGO: 'Carreira',
  CURSO: 'Curso',
  INSTITUICAO: 'Instituição',
  ROTA: 'Rota de formação',
};

function getTitle(item: Favorite) {
  return item.cargo?.nome ?? item.curso?.nome_curso ?? item.instituicao?.nome_instituicao ?? item.rota?.nome ?? 'Item indisponível';
}

function getDescription(item: Favorite) {
  if (item.cargo) return item.cargo.area_atuacao;
  if (item.curso) return `${item.curso.area_curso} · ${item.curso.modalidade}${item.curso.duracao_meses ? ` · ${item.curso.duracao_meses} meses` : ''}`;
  if (item.instituicao) return [item.instituicao.cidade, item.instituicao.estado].filter(Boolean).join(', ') || 'Localização não informada';
  if (item.rota) {
    const courses = item.rota.etapas.map((step) => step.curso.nome_curso).join(' → ');
    return `${item.rota.cargo.nome}${courses ? ` · ${courses}` : ''}`;
  }
  return 'Este item pode ter sido removido ou arquivado.';
}

export function FavoritesScreen() {
  useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const { data } = await api.get<Favorite[]>('/favoritos');
      setFavorites(data);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível carregar seus favoritos.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const removeFavorite = async (id: string) => {
    setRemovingId(id);
    setErrorMessage('');
    try {
      await api.delete(`/favoritos/${id}`);
      setFavorites((current) => current.filter((favorite) => favorite.id_favorito !== id));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível remover o favorito.'));
    } finally {
      setRemovingId('');
    }
  };

  return (
    <Page>
      <MobileHeader
        caption="Tudo que você salvou"
        onBackPress={() => navigation.goBack()}
        onProfilePress={() => navigation.navigate('MainTabs', { screen: 'Perfil' })}
      />
      <Heading title="Meus favoritos" subtitle={`${favorites.length} itens salvos na sua conta`} />
      {errorMessage ? <Message error>{errorMessage}</Message> : null}
      {loading ? <Loading label="Carregando favoritos..." /> : null}
      {!loading && !favorites.length ? <Message>Você ainda não salvou favoritos. Use o botão de salvar nas instituições, cursos e carreiras.</Message> : null}
      {favorites.map((favorite) => (
        <Card key={favorite.id_favorito}>
          <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>{typeLabels[favorite.tipo]}</Text>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>{getTitle(favorite)}</Text>
          <Text style={{ color: colors.subtle, fontSize: 13, lineHeight: 19 }}>{getDescription(favorite)}</Text>
          {favorite.cargo?.descricao ? <Text style={{ color: colors.subtle, fontSize: 12 }}>{favorite.cargo.descricao}</Text> : null}
          {favorite.rota?.descricao ? <Text style={{ color: colors.subtle, fontSize: 12 }}>{favorite.rota.descricao}</Text> : null}
          <Button
            title={removingId === favorite.id_favorito ? 'Removendo...' : 'Remover dos favoritos'}
            secondary
            disabled={Boolean(removingId)}
            onPress={() => void removeFavorite(favorite.id_favorito)}
          />
        </Card>
      ))}
    </Page>
  );
}
