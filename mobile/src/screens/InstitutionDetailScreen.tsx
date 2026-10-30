import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Button, Card, Heading, Loading, Message, MobileHeader, Page } from '../components/UI';
import { RootStackParamList } from '../navigation/navigationTypes';
import { api } from '../services/api';
import { getErrorMessage } from '../services/errors';
import { colors, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InstitutionDetail'>;

interface InstitutionDetail {
  nome_instituicao: string;
  nota_mec: number | string | null;
  natureza: string;
  regular_mec: boolean;
  telefone: string | null;
  email: string | null;
  site: string | null;
  canais?: {
    telefone: string | null;
    whatsapp: string | null;
    email: string | null;
    site: string | null;
  };
  rua: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  ofertas: Array<{
    id_curso_instituicao: string;
    mensalidade: number | string | null;
    mensalidade_max: number | string | null;
    prouni: boolean;
    fies: boolean;
    curso: { nome_curso: string; grau_academico: string; modalidade: string; duracao_meses: number | null };
  }>;
}

type DetailTab = 'overview' | 'courses' | 'contact';

const money = (value: number | string | null) =>
  value == null ? 'Consulte a instituição' : Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function InfoTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ width: '48%', minHeight: 88, justifyContent: 'center', gap: 5, padding: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12 }}>
      <Text style={{ fontSize: 17 }}>{icon}</Text>
      <Text style={{ color: colors.subtle, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}

export function InstitutionDetailScreen({ route }: Props) {
  useTheme();
  return <InstitutionDetailView institutionId={route.params.institutionId} />;
}

export function InstitutionDetailView({
  institutionId,
  onBack,
}: {
  institutionId: string;
  onBack?: () => void;
}) {
  const { mode } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [institution, setInstitution] = useState<InstitutionDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  useEffect(() => {
    let active = true;
    api.get<InstitutionDetail>(`/instituicoes/${institutionId}`)
      .then(({ data }) => { if (active) setInstitution(data); })
      .catch((error: unknown) => {
        if (active) setErrorMessage(getErrorMessage(error, 'Não foi possível carregar a instituição.'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [institutionId]);

  const openChannel = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      setErrorMessage('Não foi possível abrir este canal de contato no aparelho.');
    }
  };

  const tabButton = (tab: DetailTab, label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activeTab === tab }}
      onPress={() => setActiveTab(tab)}
      style={{ flex: 1, minHeight: 44, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: activeTab === tab ? colors.text : 'transparent' }}
    >
      <Text style={{ color: activeTab === tab ? (mode === 'dark' ? colors.onPrimary : colors.primary) : colors.subtle, fontSize: 10, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );

  return (
    <Page>
      <MobileHeader
        onBackPress={onBack ?? (() => navigation.goBack())}
        onProfilePress={() => navigation.navigate('MainTabs', { screen: 'Perfil' })}
      />
      {loading ? <Loading label="Carregando instituição..." /> : null}
      {errorMessage ? <Message error>{errorMessage}</Message> : null}
      {institution ? (
        <>
          <View style={{ overflow: 'hidden', gap: 10, padding: 18, backgroundColor: '#7452F4', borderRadius: 16 }}>
            <View style={{ width: 42, height: 4, backgroundColor: '#B5A4FF', borderRadius: 3 }} />
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900', lineHeight: 27 }}>{institution.nome_instituicao}</Text>
            <Text style={{ color: '#F0ECFF', fontSize: 12 }}>
              {[institution.cidade, institution.estado].filter(Boolean).join(', ') || 'Localização não informada'}
              {' · '}{institution.natureza === 'PUBLICA' ? 'Pública' : institution.natureza === 'PRIVADA' ? 'Privada' : 'Natureza não informada'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {institution.canais?.whatsapp ? (
              <Pressable onPress={() => void openChannel(institution.canais!.whatsapp!)} style={{ paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.softSuccess, borderRadius: 18 }}>
                <Text style={{ color: colors.success, fontSize: 10, fontWeight: '800' }}>▣ WhatsApp</Text>
              </Pressable>
            ) : null}
            {institution.canais?.telefone ? (
              <Pressable onPress={() => void openChannel(`tel:${institution.canais!.telefone}`)} style={{ paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.softDanger, borderRadius: 18 }}>
                <Text style={{ color: colors.danger, fontSize: 10, fontWeight: '800' }}>☎ {institution.canais.telefone}</Text>
              </Pressable>
            ) : null}
            {institution.canais?.email ? (
              <Pressable onPress={() => void openChannel(`mailto:${institution.canais!.email}`)} style={{ paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.softAccent, borderRadius: 18 }}>
                <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '800' }}>✉ E-mail</Text>
              </Pressable>
            ) : null}
            {institution.canais?.site ? (
              <Pressable onPress={() => void openChannel(institution.canais!.site!.startsWith('http') ? institution.canais!.site! : `https://${institution.canais!.site}`)} style={{ paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.softSuccess, borderRadius: 18 }}>
                <Text style={{ color: colors.success, fontSize: 10, fontWeight: '800' }}>◎ Site</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 7, padding: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 11 }}>
            {tabButton('overview', 'Visão geral')}
            {tabButton('courses', 'Cursos')}
            {tabButton('contact', 'Contato')}
          </View>

          {activeTab === 'overview' ? (
            <>
              <Card>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>Sobre a instituição</Text>
                <Text style={{ color: colors.subtle, fontSize: 12, lineHeight: 19 }}>
                  {institution.regular_mec ? 'Instituição com regularização no MEC confirmada.' : 'A regularização no MEC não está confirmada nos dados cadastrados.'}
                </Text>
                {[institution.rua, institution.bairro, institution.cidade, institution.estado].filter(Boolean).length ? (
                  <Text style={{ color: colors.subtle, fontSize: 11, lineHeight: 18 }}>
                    📍 {[institution.rua, institution.bairro, institution.cidade, institution.estado].filter(Boolean).join(', ')}
                  </Text>
                ) : null}
              </Card>
              {(() => {
                const monthlyFees = institution.ofertas.map((offer) => offer.mensalidade).filter((value): value is number | string => value != null).map(Number);
                const lowestMonthly = monthlyFees.length ? Math.min(...monthlyFees) : null;
                const hasProuni = institution.ofertas.some((offer) => offer.prouni);
                const hasFies = institution.ofertas.some((offer) => offer.fies);
                return (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
                    <InfoTile icon="🏛️" label="Tipo" value={institution.natureza === 'PUBLICA' ? 'Pública' : institution.natureza === 'PRIVADA' ? 'Privada' : 'Não informado'} />
                    <InfoTile icon="📍" label="Cidade" value={[institution.cidade, institution.estado].filter(Boolean).join(', ') || 'Não informada'} />
                    <InfoTile icon="⭐" label="Nota MEC" value={institution.nota_mec == null ? 'Não informada' : `${Number(institution.nota_mec).toLocaleString('pt-BR')} / 5`} />
                    <InfoTile icon="📚" label="Cursos e ofertas" value={String(institution.ofertas.length)} />
                    <InfoTile icon="💰" label="Mensalidade a partir de" value={lowestMonthly === null ? 'Consulte' : money(lowestMonthly)} />
                    <InfoTile icon="🎓" label="ProUni / FIES" value={`${hasProuni ? 'ProUni' : '—'} · ${hasFies ? 'FIES' : '—'}`} />
                  </View>
                );
              })()}
            </>
          ) : null}

          {activeTab === 'courses' ? (
            <>
              <Heading title="Cursos e ofertas" subtitle={`${institution.ofertas.length} ofertas cadastradas`} />
              {!institution.ofertas.length ? <Message>Nenhuma oferta disponível no momento.</Message> : null}
              {institution.ofertas.map((offer) => (
                <Card key={offer.id_curso_instituicao}>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>{offer.curso.nome_curso}</Text>
                  <Text style={{ color: colors.subtle, fontSize: 11 }}>{offer.curso.grau_academico} · {offer.curso.modalidade}{offer.curso.duracao_meses ? ` · ${offer.curso.duracao_meses} meses` : ''}</Text>
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>Mensalidade: {money(offer.mensalidade)}{offer.mensalidade_max ? ` a ${money(offer.mensalidade_max)}` : ''}</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {offer.prouni ? <Text style={{ paddingHorizontal: 9, paddingVertical: 5, backgroundColor: colors.softAccent, color: colors.accent, borderRadius: 12, fontSize: 10, fontWeight: '800' }}>ProUni</Text> : null}
                    {offer.fies ? <Text style={{ paddingHorizontal: 9, paddingVertical: 5, backgroundColor: colors.softSuccess, color: colors.success, borderRadius: 12, fontSize: 10, fontWeight: '800' }}>FIES</Text> : null}
                  </View>
                </Card>
              ))}
            </>
          ) : null}

          {activeTab === 'contact' ? (
            <Card>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>Canais de contato</Text>
              {institution.telefone ? <Text style={{ color: colors.subtle, fontSize: 12 }}>Telefone: {institution.telefone}</Text> : null}
              {institution.email ? <Text style={{ color: colors.subtle, fontSize: 12 }}>E-mail: {institution.email}</Text> : null}
              {institution.site ? <Text style={{ color: colors.subtle, fontSize: 12 }}>Site: {institution.site}</Text> : null}
              {[institution.rua, institution.bairro, institution.cidade, institution.estado].filter(Boolean).length ? (
                <Text style={{ color: colors.subtle, fontSize: 12, lineHeight: 18 }}>Endereço: {[institution.rua, institution.bairro, institution.cidade, institution.estado].filter(Boolean).join(', ')}</Text>
              ) : null}
              {!institution.telefone && !institution.email && !institution.site ? <Text style={{ color: colors.subtle, fontSize: 12 }}>A instituição não cadastrou canais de contato.</Text> : null}
              {institution.canais?.whatsapp ? <Button title="Abrir WhatsApp" secondary onPress={() => void openChannel(institution.canais!.whatsapp!)} /> : null}
            </Card>
          ) : null}

        </>
      ) : null}
    </Page>
  );
}
