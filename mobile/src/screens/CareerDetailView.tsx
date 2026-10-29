import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Heading, Loading, Message, MobileHeader, Page } from '../components/UI';
import { api } from '../services/api';
import { getErrorMessage } from '../services/errors';
import { colors, useTheme } from '../theme';

interface CareerRoute {
  id_rota: string;
  nome: string;
  descricao: string;
  duracao_total_meses: number | null;
  etapas: Array<{
    ordem_etapa: number;
    descricao: string;
    curso: { nome_curso: string; grau_academico: string; duracao_meses: number | null };
  }>;
}

interface CareerDetail {
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
  afinidade?: number | null;
  rotas: CareerRoute[];
}

type DetailTab = 'overview' | 'skills' | 'formation';

const careerAccent = '#C81045';

const money = (value: number | string | null) =>
  value == null
    ? 'Não informado'
    : Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

function splitSkills(value: string) {
  return value.split(/[,;\n]/).map((skill) => skill.trim()).filter(Boolean);
}

function formatDuration(months: number | null) {
  if (months == null || months <= 0) return null;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const parts: string[] = [];
  if (years) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
  if (remainingMonths) parts.push(`${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`);
  return parts.join(' e ');
}

export function CareerDetailView({
  careerId,
  isFavorite,
  onBack,
  onToggleFavorite,
}: {
  careerId: string;
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
}) {
  const { mode } = useTheme();
  const [career, setCareer] = useState<CareerDetail | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const relatedCourses = career
    ? [...new Map(
        career.rotas.flatMap((route) => route.etapas)
          .map((stage) => [stage.curso.nome_curso, stage.curso.nome_curso] as const),
      ).values()]
    : [];

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMessage('');
    api.get<CareerDetail>(`/cargos/${careerId}`)
      .then(({ data }) => { if (active) setCareer(data); })
      .catch((error: unknown) => {
        if (active) setErrorMessage(getErrorMessage(error, 'Não foi possível carregar os detalhes da carreira.'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [careerId]);

  const tabButton = (tab: DetailTab, label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activeTab === tab }}
      onPress={() => setActiveTab(tab)}
      style={{
        flex: 1,
        minHeight: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 9,
        backgroundColor: activeTab === tab ? colors.text : 'transparent',
      }}
    >
      <Text style={{ color: activeTab === tab ? (mode === 'dark' ? colors.onPrimary : colors.primary) : colors.subtle, fontSize: 11, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );

  return (
    <Page>
      <MobileHeader caption="Carreiras" onBackPress={onBack} />
      {loading ? <Loading label="Carregando carreira..." /> : null}
      {errorMessage ? <Message error>{errorMessage}</Message> : null}
      {career ? (
        <>
          <View style={{
            overflow: 'hidden',
            gap: 14,
            padding: 18,
            backgroundColor: careerAccent,
            borderRadius: 18,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14 }}>
                <Text style={{ fontSize: 25 }}>💼</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 19, fontWeight: '900' }}>{career.nome}</Text>
                <Text style={{ color: '#FCE8EF', fontSize: 12 }}>{career.area_atuacao}</Text>
              </View>
              {career.afinidade != null ? (
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>{career.afinidade}%</Text>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { label: 'PISO', value: career.salario_piso },
                { label: 'MÉDIA', value: career.salario_media },
                { label: 'TETO', value: career.salario_teto },
              ].map((salary) => (
                <View key={salary.label} style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 10, paddingHorizontal: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 }}>
                  <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>{money(salary.value)}</Text>
                  <Text style={{ color: '#FCE8EF', fontSize: 9, fontWeight: '800' }}>{salary.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 3, padding: 4, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12 }}>
            {tabButton('overview', 'Visão geral')}
            {tabButton('skills', 'Habilidades')}
            {tabButton('formation', 'Formação')}
          </View>

          {activeTab === 'overview' ? (
            <>
              <Card>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>Sobre a carreira</Text>
                <Text style={{ color: colors.subtle, fontSize: 12, lineHeight: 19 }}>{career.descricao || 'Descrição não informada.'}</Text>
              </Card>
              <Card>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>Faixa salarial detalhada</Text>
                {[
                  { label: 'Piso (entrada)', value: career.salario_piso },
                  { label: 'Média do mercado', value: career.salario_media },
                  { label: 'Teto (sênior/especialista)', value: career.salario_teto },
                ].map((salary) => {
                  const amount = salary.value == null ? null : Number(salary.value);
                  const maximum = career.salario_teto == null ? amount : Number(career.salario_teto);
                  const width = amount === null || !maximum ? '0%' : `${Math.max(12, Math.min(100, amount / maximum * 100))}%`;
                  return (
                    <View key={salary.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                      <Text style={{ flex: 1.2, color: colors.subtle, fontSize: 10 }}>{salary.label}</Text>
                      <View style={{ flex: 0.6, height: 8, overflow: 'hidden', backgroundColor: colors.muted, borderRadius: 6 }}>
                        <View style={{ width, height: '100%', backgroundColor: careerAccent, borderRadius: 6 }} />
                      </View>
                      <Text numberOfLines={1} adjustsFontSizeToFit style={{ flex: 0.75, color: colors.text, fontSize: 10, fontWeight: '900', textAlign: 'right' }}>{money(salary.value)}</Text>
                    </View>
                  );
                })}
              </Card>
              <Card>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>Cursos relacionados</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                  {relatedCourses.length ? (
                    relatedCourses.map((course) => (
                      <Text key={course} style={{ overflow: 'hidden', paddingHorizontal: 11, paddingVertical: 7, backgroundColor: colors.softDanger, borderRadius: 16, color: careerAccent, fontSize: 10, fontWeight: '700' }}>
                        {course}
                      </Text>
                    ))
                  ) : (
                    <Text style={{ color: colors.subtle, fontSize: 12 }}>Nenhum curso relacionado cadastrado.</Text>
                  )}
                </View>
              </Card>
            </>
          ) : null}

          {activeTab === 'skills' ? (
            <>
              <Card>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>Hard Skills (técnicas)</Text>
                {splitSkills(career.hard_skills).length ? splitSkills(career.hard_skills).map((skill, index) => (
                  <View key={skill} style={{ minHeight: 37, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: colors.muted, borderRadius: 8 }}>
                    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: careerAccent, borderRadius: 11 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>{index + 1}</Text>
                    </View>
                    <Text style={{ flex: 1, color: colors.text, fontSize: 11, fontWeight: '600' }}>{skill}</Text>
                  </View>
                )) : <Text style={{ color: colors.subtle, fontSize: 12 }}>Não informado.</Text>}
              </Card>
              <Card>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>Soft Skills (comportamentais)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                  {splitSkills(career.soft_skills).length ? splitSkills(career.soft_skills).map((skill) => (
                    <Text key={skill} style={{ overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.softWarning, borderWidth: 1, borderColor: colors.border, borderRadius: 16, color: colors.warning, fontSize: 10, fontWeight: '600' }}>
                      ✓ {skill}
                    </Text>
                  )) : <Text style={{ color: colors.subtle, fontSize: 12 }}>Não informado.</Text>}
                </View>
              </Card>
            </>
          ) : null}

          {activeTab === 'formation' ? (
            <>
              {career.rotas.length ? career.rotas.map((route) => (
                <View key={route.id_rota} style={{ gap: 10 }}>
                  <Text style={{ paddingHorizontal: 4, color: colors.subtle, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>
                    {career.rotas.length > 1 ? route.nome.toUpperCase() : 'TRILHA DE FORMAÇÃO RECOMENDADA'}
                  </Text>
                  {route.descricao ? <Text style={{ paddingHorizontal: 4, color: colors.subtle, fontSize: 11, lineHeight: 17 }}>{route.descricao}</Text> : null}
                  {route.etapas.map((stage, index) => {
                    const duration = formatDuration(stage.curso.duracao_meses);
                    return (
                      <View key={`${route.id_rota}-${stage.ordem_etapa}`} style={{ minHeight: 74, flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 13, backgroundColor: colors.surface, borderWidth: index === 0 ? 1.5 : 1, borderColor: index === 0 ? careerAccent : colors.border, borderRadius: 11 }}>
                        <View style={{ width: 27, alignItems: 'center', alignSelf: 'stretch' }}>
                          <View style={{ width: 27, height: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: index === 0 ? careerAccent : colors.muted, borderRadius: 16 }}>
                            <Text style={{ color: index === 0 ? '#FFFFFF' : colors.subtle, fontSize: 11, fontWeight: '900' }}>{stage.ordem_etapa}</Text>
                          </View>
                          {index < route.etapas.length - 1 ? <View style={{ flex: 1, width: 2, minHeight: 10, marginTop: 4, backgroundColor: colors.border }} /> : null}
                        </View>
                        <View style={{ flex: 1, gap: 3, paddingTop: 2 }}>
                          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>
                            {stage.curso.nome_curso}{duration ? ` (${duration})` : ''}
                          </Text>
                          {stage.descricao ? <Text style={{ color: colors.subtle, fontSize: 10, lineHeight: 15 }}>{stage.descricao}</Text> : null}
                          {index === 0 ? <Text style={{ color: colors.subtle, fontSize: 10 }}>Ponto de partida</Text> : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )) : (
                <Card>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>Formação relacionada</Text>
                  <Text style={{ color: colors.subtle, fontSize: 13, lineHeight: 20 }}>Ainda não há uma trilha de formação cadastrada para esta carreira.</Text>
                </Card>
              )}
            </>
          ) : null}

          <Button title={isFavorite ? '♥ Carreira salva' : '♡ Salvar carreira'} secondary onPress={onToggleFavorite} />
        </>
      ) : null}
    </Page>
  );
}
