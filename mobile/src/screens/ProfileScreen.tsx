import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, Heading, Loading, Message, MobileHeader, Page } from '../components/UI';
import { RootStackParamList } from '../navigation/navigationTypes';
import { api, ApiUser } from '../services/api';
import { getErrorMessage } from '../services/errors';
import { colors, useTheme } from '../theme';

interface PageResult<T> { data: T[]; total: number; totalPages: number }
interface Favorite { id_favorito: string }

interface QuizHistoryRecord {
  id_historico: string;
  data_realizada: string;
  pontuacao_detalhada: {
    area_maior_afinidade?: string;
    empate?: boolean;
    respostas?: Array<{
      id_pergunta: string;
      enunciado: string;
      valor: number;
    }>;
  };
}

const quizAnswerLabels: Record<number, string> = {
  1: 'Discordo totalmente',
  2: 'Discordo',
  3: 'Neutro',
  4: 'Concordo',
  5: 'Concordo totalmente',
};

export function ProfileScreen() {
  const { mode, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [profile, setProfile] = useState<ApiUser | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryRecord[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
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
        api.get<PageResult<QuizHistoryRecord>>('/teste-vocacional/historico', {
          params: { page: historyPage, limit: 10 },
        }),
      ]);
      setProfile(profileResponse.data);
      setFavoriteCount(favoritesResponse.data.length);
      setQuizCount(quizResponse.data.total);
      setQuizHistory(quizResponse.data.data);
      setHistoryTotalPages(quizResponse.data.totalPages);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível carregar seu perfil.'));
    } finally {
      setLoading(false);
    }
  }, [historyPage]);

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
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, paddingHorizontal: 2 }}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>SUA JORNADA</Text>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900' }}>Histórico de testes</Text>
                <Text style={{ color: colors.subtle, fontSize: 12, lineHeight: 18 }}>Revise suas respostas e acompanhe suas descobertas.</Text>
              </View>
              {quizCount > 0 ? (
                <View style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.softAccent, borderRadius: 16 }}>
                  <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '800' }}>{quizCount} {quizCount === 1 ? 'teste' : 'testes'}</Text>
                </View>
              ) : null}
            </View>
            {loading ? <Loading label="Carregando histórico..." /> : null}
            {!loading && quizHistory.length === 0 ? (
              <Card>
                <View style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.softAccent, borderRadius: 14 }}>
                  <Text style={{ color: colors.accent, fontSize: 22 }}>✦</Text>
                </View>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>Seu histórico começa aqui</Text>
                <Text style={{ color: colors.subtle, fontSize: 12, lineHeight: 19 }}>Quando você concluir um teste vocacional, poderá consultar suas respostas nesta seção.</Text>
                <Button title="Fazer meu primeiro teste" secondary onPress={() => navigation.navigate('MainTabs', { screen: 'Quiz' })} />
              </Card>
            ) : null}
            {quizHistory.map((test) => {
              const date = new Date(test.data_realizada);
              const answers = test.pontuacao_detalhada.respostas ?? [];
              const isExpanded = expandedHistoryId === test.id_historico;
              return (
                <Card key={test.id_historico}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isExpanded }}
                    onPress={() => setExpandedHistoryId(isExpanded ? null : test.id_historico)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}
                  >
                    <View style={{ width: 46, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.softAccent, borderRadius: 12 }}>
                      <Text style={{ color: colors.accent, fontSize: 17, fontWeight: '900' }}>{date.toLocaleDateString('pt-BR', { day: '2-digit' })}</Text>
                      <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}>{date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>
                        {date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                      <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700' }}>
                        {test.pontuacao_detalhada.area_maior_afinidade
                          ? `Maior afinidade: ${test.pontuacao_detalhada.area_maior_afinidade}${test.pontuacao_detalhada.empate ? ' · empate' : ''}`
                          : 'Resultado vocacional'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 3 }}>
                      <Text style={{ color: colors.subtle, fontSize: 10 }}>{answers.length} {answers.length === 1 ? 'resposta' : 'respostas'}</Text>
                      <Text style={{ color: colors.accent, fontSize: 17, fontWeight: '800' }}>{isExpanded ? '−' : '+'}</Text>
                    </View>
                  </Pressable>
                  {isExpanded ? (
                    <View style={{ gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
                      {answers.length ? answers.map((answer, index) => (
                        <View key={`${test.id_historico}-${answer.id_pergunta}`} style={{ gap: 6, padding: 11, backgroundColor: colors.muted, borderRadius: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                            <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900' }}>{String(index + 1).padStart(2, '0')}</Text>
                            <Text style={{ flex: 1, color: colors.text, fontSize: 11, fontWeight: '700', lineHeight: 17 }}>{answer.enunciado}</Text>
                          </View>
                          <Text style={{ alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, backgroundColor: colors.surface, borderRadius: 12, color: colors.accent, fontSize: 10, fontWeight: '800' }}>
                            {quizAnswerLabels[answer.valor] ?? `Resposta ${answer.valor}`}
                          </Text>
                        </View>
                      )) : (
                        <Text style={{ color: colors.subtle, fontSize: 12 }}>As respostas desta tentativa não estão disponíveis.</Text>
                      )}
                    </View>
                  ) : null}
                </Card>
              );
            })}
            {historyTotalPages > 1 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Button title="Anterior" secondary disabled={historyPage === 1} onPress={() => { setExpandedHistoryId(null); setHistoryPage((page) => page - 1); }} />
                </View>
                <Text style={{ color: colors.subtle, fontSize: 11 }}>Página {historyPage} de {historyTotalPages}</Text>
                <View style={{ flex: 1 }}>
                  <Button title="Próxima" secondary disabled={historyPage === historyTotalPages} onPress={() => { setExpandedHistoryId(null); setHistoryPage((page) => page + 1); }} />
                </View>
              </View>
            ) : null}
          </View>
        </>
      ) : null}
      <Button title="Sair da conta" onPress={() => void signOut()} busy={loggingOut} />
    </Page>
  );
}
