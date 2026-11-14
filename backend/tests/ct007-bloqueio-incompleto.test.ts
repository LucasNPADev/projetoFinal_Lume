import { app, prisma, request, createTestUser, loginUser, cleanupUser } from "./helpers";

describe("CT007 - Cancelamento do Envio do Teste Vocacional com Respostas Pendentes", () => {
  let userId: bigint | null = null;
  let userToken = "";
  let createdQuestionIds: bigint[] = [];

  beforeAll(async () => {
    const created = await createTestUser({
      nome: "Aluno Incompleto",
      senha: "SenhaValida123!",
    });
    userId = created.user.id_usuario;

    const loginRes = await loginUser(created.email, "SenhaValida123!");
    userToken = loginRes.token;

    // Garante ao menos duas perguntas ativas
    const activeQuestions = await prisma.perguntaVocacional.findMany({
      where: { status: true },
    });

    if (activeQuestions.length < 2) {
      const q1 = await prisma.perguntaVocacional.create({
        data: {
          enunciado: "Pergunta 1 teste incompleto",
          area_afinidade: "Exatas",
          status: true,
        },
      });
      const q2 = await prisma.perguntaVocacional.create({
        data: {
          enunciado: "Pergunta 2 teste incompleto",
          area_afinidade: "Humanas",
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

  it("deve retornar HTTP 400 e bloquear o envio do teste vocacional quando houver respostas pendentes", async () => {
    const perguntas = await prisma.perguntaVocacional.findMany({
      where: { status: true },
    });

    // Envia respostas deixando ao menos uma pergunta de fora
    const respostasIncompletas = perguntas.slice(0, -1).map((p) => ({
      id_pergunta: Number(p.id_pergunta),
      valor: 4,
    }));

    const response = await request(app)
      .post("/teste-vocacional")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ respostas: respostasIncompletas });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toMatch(/Faltam \d+ pergunta\(s\) para concluir o teste/);
  });
});

