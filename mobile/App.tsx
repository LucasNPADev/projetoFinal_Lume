import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { api, setToken } from "./src/api";
import { Cargo, Curso, Instituicao, QuizQuestion } from "./src/types";
import { theme } from "./src/theme";

const Tab = createBottomTabNavigator();

function HomeScreen({ navigation }: any) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>LUME</Text>
        <Text style={styles.title}>Seu GPS de Carreira</Text>
        <Text style={styles.subtitle}>
          Explore cargos, cursos e instituições e visualize rotas de formação.
        </Text>
      </View>

      <View style={styles.grid}>
        <Action title="Explorar carreiras" onPress={() => navigation.navigate("Carreiras")} />
        <Action title="Encontrar cursos" onPress={() => navigation.navigate("Cursos")} />
        <Action title="Instituições" onPress={() => navigation.navigate("Instituições")} />
        <Action title="Teste vocacional" onPress={() => navigation.navigate("Quiz")} />
      </View>
    </ScrollView>
  );
}

function Action({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.muted}>Abrir módulo</Text>
    </Pressable>
  );
}

function CarreirasScreen() {
  const [items, setItems] = useState<Cargo[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    api.get<Cargo[]>("/cargos", { params: busca ? { busca } : undefined }).then((r) => setItems(r.data));
  }, [busca]);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>Carreiras</Text>
      <TextInput
        style={styles.input}
        placeholder="Buscar profissão..."
        value={busca}
        onChangeText={setBusca}
      />
      {items.map((item) => (
        <View style={styles.card} key={item.id}>
          <Text style={styles.eyebrow}>{item.areaAtuacao}</Text>
          <Text style={styles.cardTitle}>{item.nome}</Text>
          <Text style={styles.text}>{item.descricao ?? "Descrição não cadastrada."}</Text>
          {item.faixaSalarial && <Text style={styles.muted}>{item.faixaSalarial}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

function CursosScreen() {
  const [items, setItems] = useState<Curso[]>([]);

  useEffect(() => {
    api.get<Curso[]>("/cursos").then((r) => setItems(r.data));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>Cursos</Text>
      {items.map((item) => (
        <View style={styles.card} key={item.id}>
          <Text style={styles.eyebrow}>{item.area}</Text>
          <Text style={styles.cardTitle}>{item.nome}</Text>
          <Text style={styles.text}>{item.cargaHoraria} horas · {item.modalidade}</Text>
          {item.grauAcademico && <Text style={styles.muted}>{item.grauAcademico}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

function InstituicoesScreen() {
  const [items, setItems] = useState<Instituicao[]>([]);

  useEffect(() => {
    api.get<Instituicao[]>("/instituicoes").then((r) => setItems(r.data));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>Instituições</Text>
      {items.map((item) => (
        <View style={styles.card} key={item.id}>
          <Text style={styles.cardTitle}>{item.nome}</Text>
          <Text style={styles.text}>{item.cidade} - {item.estado}</Text>
          <Text style={styles.muted}>Nota média: {Number(item.notaAvaliacoes).toFixed(2)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function QuizScreen() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<{ perguntaId: number; opcaoIndex: number }[]>([]);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    api.get<QuizQuestion[]>("/quiz/perguntas").then((r) => setQuestions(r.data));
  }, []);

  async function answer(opcaoIndex: number) {
    const question = questions[index];
    const next = [...answers, { perguntaId: question.id, opcaoIndex }];
    setAnswers(next);

    if (index + 1 < questions.length) {
      setIndex(index + 1);
      return;
    }

    const response = await api.post("/quiz/resultado", { respostas: next });
    setResult(response.data.resultadoArea);
  }

  if (!questions.length) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  if (result) {
    return (
      <View style={styles.page}>
        <Text style={styles.eyebrow}>RESULTADO</Text>
        <Text style={styles.title}>{result}</Text>
        <Text style={styles.text}>O resultado prioriza a área de afinidade sem excluir outras possibilidades.</Text>
        <Pressable style={styles.button} onPress={() => { setResult(null); setIndex(0); setAnswers([]); }}>
          <Text style={styles.buttonText}>Refazer teste</Text>
        </Pressable>
      </View>
    );
  }

  const question = questions[index];

  return (
    <View style={styles.page}>
      <Text style={styles.eyebrow}>PERGUNTA {index + 1} DE {questions.length}</Text>
      <Text style={styles.title}>{question.pergunta}</Text>
      {question.opcoes.map((option, optionIndex) => (
        <Pressable style={styles.option} key={option.texto} onPress={() => answer(optionIndex)}>
          <Text style={styles.text}>{option.texto}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function PerfilScreen() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [logged, setLogged] = useState(false);

  async function login() {
    const response = await api.post("/auth/login", { email, senha });
    setToken(response.data.token);
    setLogged(true);
  }

  async function cadastro() {
    const response = await api.post("/auth/register", { nome, email, senha });
    setToken(response.data.token);
    setLogged(true);
  }

  if (logged) {
    return (
      <View style={styles.page}>
        <Text style={styles.eyebrow}>PERFIL</Text>
        <Text style={styles.title}>Sessão iniciada</Text>
        <Text style={styles.text}>O aplicativo está conectado à API LUME.</Text>
        <Pressable style={styles.button} onPress={() => { setToken(); setLogged(false); }}>
          <Text style={styles.buttonText}>Sair</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>Entrar no LUME</Text>
      <TextInput style={styles.input} placeholder="Nome (cadastro)" value={nome} onChangeText={setNome} />
      <TextInput style={styles.input} placeholder="E-mail" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />
      <Pressable style={styles.button} onPress={login}><Text style={styles.buttonText}>Entrar</Text></Pressable>
      <Pressable style={styles.secondaryButton} onPress={cadastro}><Text>Criar conta</Text></Pressable>
    </ScrollView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.dark }}>
        <Tab.Screen name="Início" component={HomeScreen} />
        <Tab.Screen name="Carreiras" component={CarreirasScreen} />
        <Tab.Screen name="Cursos" component={CursosScreen} />
        <Tab.Screen name="Instituições" component={InstituicoesScreen} />
        <Tab.Screen name="Quiz" component={QuizScreen} />
        <Tab.Screen name="Perfil" component={PerfilScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 20, backgroundColor: theme.background, gap: 14 },
  hero: { backgroundColor: theme.yellow, borderRadius: 22, padding: 24, marginBottom: 8 },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 1, color: theme.muted, textTransform: "uppercase" },
  title: { fontSize: 30, lineHeight: 36, fontWeight: "800", color: theme.dark },
  subtitle: { fontSize: 16, lineHeight: 23, color: theme.dark, marginTop: 8 },
  grid: { gap: 12 },
  card: { backgroundColor: theme.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: theme.border, gap: 6 },
  cardTitle: { fontSize: 18, fontWeight: "800", color: theme.dark },
  text: { fontSize: 15, lineHeight: 22, color: theme.dark },
  muted: { color: theme.muted },
  input: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, fontSize: 16 },
  option: { backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 18 },
  button: { backgroundColor: theme.dark, padding: 15, borderRadius: 12, alignItems: "center" },
  secondaryButton: { padding: 15, borderRadius: 12, alignItems: "center", backgroundColor: theme.yellow },
  buttonText: { color: "#FFFFFF", fontWeight: "800" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
