import { app, prisma, request, createTestUser, loginUser, cleanupUser } from "./helpers";

describe("CT006 - Resolução Completa do Teste Vocacional com Geração de Perfil", () => {
  let userId: bigint | null = null;
  let userToken = "";
  let createdQuestionIds: bigint[] = [];

  beforeAll(async () => {
    const created = await createTestUser({
      nome: "Aluno Vocacional",
      senha: "SenhaValida123!",
    });
    userId = created.user.id_usuario;

    const loginRes = await loginUser(created.email, "SenhaValida123!");
    userToken = loginRes.token;

    // Garante que existam perguntas cadastradas para o teste
    const activeQuestions = await prisma.perguntaVocacional.findMany({
      where: { status: true },
    });

    if (activeQuestions.length === 0) {
      const q1 = await prisma.perguntaVocacional.create({
        data: {
          enunciado: "Gosto de programar computadores?",
          area_afinidade: "Tecnologia",
          status: true,
        },
      });
      const q2 = await prisma.perguntaVocacional.create({
        data: {
          enunciado: "Gosto de cuidar da saúde das pessoas?",
          area_afinidade: "Saúde",
          status: true,
        },
      });
      createdQuestionIds.push(q1.id_pergunta, q2.id_pergunta);
    }
  });

  afterAll(async () => {
    if (createdQuestionIds.length > 0) {
      await prisma.perguntaVocacional.deleteMany({
        where: { id_pergunta: { in: createdQuestionIds } },
      });
    }
    if (userId) {
      await cleanupUser(userId);
    }
    await prisma.$disconnect();
  });

  it("deve processar o questionário completo, calcular afinidades e gerar perfil com gráfico", async () => {
    const perguntas = await prisma.perguntaVocacional.findMany({
      where: { status: true },
      orderBy: { id_pergunta: "asc" },
    });

    // Responde 100% das perguntas ativas
    const respostas = perguntas.map((p, idx) => ({
      id_pergunta: Number(p.id_pergunta),
      // Atribui nota máxima para perguntas da primeira área encontrada
      valor: p.area_afinidade.toLowerCase().includes("tec") ? 5 : 2,
    }));

    const response = await request(app)
      .post("/teste-vocacional")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ respostas });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id_historico");
    expect(response.body).toHaveProperty("pontuacao_detalhada");

    const detalhada = response.body.pontuacao_detalhada;
    expect(detalhada).toHaveProperty("area_maior_afinidade");
    expect(detalhada).toHaveProperty("areas");
    expect(Array.isArray(detalhada.areas)).toBe(true);
    expect(detalhada.areas.length).toBeGreaterThan(0);

    // Valida que o percentual das áreas totaliza 100% (ou próximo com arredondamento)
    const somaPercentuais = detalhada.areas.reduce(
      (acc: number, a: { percentual: number }) => acc + a.percentual,
      0,
    );
    expect(Math.round(somaPercentuais)).toBe(100);

    // Valida recuperação pelo endpoint /teste-vocacional/atual
    const atualRes = await request(app)
      .get("/teste-vocacional/atual")
      .set("Authorization", `Bearer ${userToken}`);

    expect(atualRes.status).toBe(200);
    expect(atualRes.body.pontuacao_detalhada.area_maior_afinidade).toBe(
      detalhada.area_maior_afinidade,
    );
  });
});

