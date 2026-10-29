import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Heading, Loading, Message, MobileHeader, Page } from '../components/UI';
import { api } from '../services/api';
import { getErrorMessage } from '../services/errors';
import { colors, useTheme } from '../theme';
import { RootStackParamList } from '../navigation/navigationTypes';

interface Question {
  id_pergunta: string;
  enunciado: string;
}

interface QuestionsResponse {
  escala: Array<{ valor: number; rotulo: string }>;
  perguntas: Question[];
}

interface QuizResult {
  pontuacao_detalhada?: {
    area_maior_afinidade?: string;
    empate?: boolean;
    areas?: Array<{ area: string; percentual: number }>;
    orientacao?: string;
  };
}

export function QuizScreen() {
  useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [scale, setScale] = useState<QuestionsResponse['escala']>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const { data } = await api.get<QuestionsResponse>('/perguntas-vocacionais');
      setQuestions(data.perguntas);
      setScale(data.escala);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível carregar o questionário.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const submit = async () => {
    setErrorMessage('');
    setSubmitting(true);
    try {
      const { data } = await api.post<QuizResult>('/teste-vocacional', {
        respostas: questions.map((question) => ({
          id_pergunta: question.id_pergunta,
          valor: answers[question.id_pergunta],
        })),
      });
      setResult(data);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível enviar suas respostas.'));
    } finally {
      setSubmitting(false);
    }
  };

  const detailed = result?.pontuacao_detalhada;

  return (
    <Page>
      <MobileHeader caption="Descubra suas afinidades" onProfilePress={() => navigation.navigate('MainTabs', { screen: 'Perfil' })} />
      <Heading title="Quiz vocacional" subtitle="Responda com sinceridade. O resultado é uma orientação para explorar suas afinidades." />
      {errorMessage ? <Message error>{errorMessage}</Message> : null}
      {loading ? <Loading label="Carregando perguntas..." /> : null}
      {!loading && !questions.length && !errorMessage ? <Message>O questionário ainda não está disponível.</Message> : null}
      {result ? (
        <Card>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Resultado do seu teste</Text>
          {detailed?.area_maior_afinidade
            ? <Text style={{ color: colors.accent, fontSize: 17, fontWeight: '800' }}>Maior afinidade: {detailed.area_maior_afinidade}{detailed.empate ? ' (empate)' : ''}</Text>
            : <Text style={{ color: colors.subtle }}>O teste foi salvo. Não foi possível ler os detalhes do resultado.</Text>}
          {detailed?.areas?.map((area) => (
            <View key={area.area} style={{ gap: 5 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{area.area}</Text>
                <Text style={{ color: colors.subtle }}>{area.percentual}%</Text>
              </View>
              <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 5 }}>
                <View style={{ width: `${Math.min(100, Math.max(0, area.percentual))}%`, height: 8, backgroundColor: colors.accent, borderRadius: 5 }} />
              </View>
            </View>
          ))}
          {detailed?.orientacao ? <Text style={{ color: colors.subtle, fontSize: 12, lineHeight: 18 }}>{detailed.orientacao}</Text> : null}
          <Button title="Refazer teste" secondary onPress={() => { setResult(null); setAnswers({}); }} />
        </Card>
      ) : null}
      {!loading && !result ? questions.map((question, index) => (
        <Card key={question.id_pergunta}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', lineHeight: 22 }}>{index + 1}. {question.enunciado}</Text>
          <Text style={{ color: colors.subtle, fontSize: 12 }}>
            {scale.find((item) => item.valor === 1)?.rotulo ?? 'Pouco interesse'} → {scale.find((item) => item.valor === 5)?.rotulo ?? 'Muito interesse'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {scale.map((item) => {
              const selected = answers[question.id_pergunta] === item.valor;
              return (
                <View key={item.valor} style={{ flex: 1 }}>
                  <Button
                    title={String(item.valor)}
                    secondary={!selected}
                    onPress={() => setAnswers((current) => ({ ...current, [question.id_pergunta]: item.valor }))}
                  />
                </View>
              );
            })}
          </View>
        </Card>
      )) : null}
      {!loading && !result && questions.length > 0 ? (
        <Button
          title="Ver meu resultado"
          onPress={() => void submit()}
          disabled={Object.keys(answers).length !== questions.length}
          busy={submitting}
        />
      ) : null}
    </Page>
  );
}
