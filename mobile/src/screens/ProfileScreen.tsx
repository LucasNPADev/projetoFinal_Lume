import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, Heading, Loading, Message, MobileHeader, Page } from '../components/UI';
import { RootStackParamList } from '../navigation/navigationTypes';
import { api, ApiUser } from '../services/api';
import { getErrorMessage } from '../services/errors';
import { colors, useTheme } from '../theme';

interface PageResult<T> { data: T[]; total: number }
interface Favorite { id_favorito: string }

export function ProfileScreen() {
  const { mode, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [profile, setProfile] = useState<ApiUser | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [profileResponse, favoritesResponse, quizResponse] = await Promise.all([
        api.get<ApiUser>('/usuarios/me'),
        api.get<Favorite[]>('/favoritos'),
        api.get<PageResult<unknown>>('/teste-vocacional/historico', { params: { page: 1, limit: 1 } }),
      ]);
      setProfile(profileResponse.data);
      setFavoriteCount(favoritesResponse.data.length);
      setQuizCount(quizResponse.data.total);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível carregar seu perfil.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const signOut = async () => {
    setLoggingOut(true);
    setErrorMessage('');
    try {
      await logout();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'A sessão foi encerrada neste aparelho, mas o servidor não confirmou a saída.'));
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Page>
      <MobileHeader caption="Seu espaço no LUME" />
      <Heading title="Meu perfil" subtitle="Seus dados e atividades no LUME." />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>Modo escuro</Text>
            <Text style={{ color: colors.subtle, fontSize: 12 }}>
              {mode === 'dark' ? 'Tema escuro ativado neste aparelho' : 'Ative uma aparência mais confortável à noite'}
            </Text>
          </View>
          <Switch
            accessibilityLabel="Ativar modo escuro"
            value={mode === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.surface}
          />
        </View>
      </Card>
      {errorMessage ? <Message error>{errorMessage}</Message> : null}
      {loading ? <Loading label="Carregando perfil..." /> : null}
      {profile ? (
        <>
          <Card>
            <View style={{ width: 58, height: 58, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 29 }}>
              <Text style={{ color: colors.onPrimary, fontSize: 22, fontWeight: '900' }}>{profile.nome.slice(0, 1).toUpperCase()}</Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>{profile.nome}</Text>
            <Text style={{ color: colors.subtle, fontSize: 14 }}>{profile.email}</Text>
            <Text style={{ color: colors.subtle, fontSize: 13 }}>
              {[profile.rua, profile.bairro, profile.cidade, profile.estado].filter(Boolean).join(', ') || 'Endereço não informado'}
            </Text>
            <Button title="Editar informações do cadastro" secondary onPress={() => navigation.navigate('EditProfile')} />
          </Card>
          <Card>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>Sua atividade</Text>
            <Text style={{ color: colors.subtle, fontSize: 14 }}>Favoritos salvos: {favoriteCount}</Text>
            <Text style={{ color: colors.subtle, fontSize: 14 }}>Testes vocacionais: {quizCount}</Text>
            <Button title="Ver meus favoritos" secondary onPress={() => navigation.navigate('Favorites')} />
            <Button title="Explorar cursos" secondary onPress={() => navigation.navigate('Courses')} />
          </Card>
        </>
      ) : null}
      <Button title="Sair da conta" onPress={() => void signOut()} busy={loggingOut} />
    </Page>
  );
}
