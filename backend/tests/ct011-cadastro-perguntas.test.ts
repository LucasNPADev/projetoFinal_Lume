import { app, prisma, request, createAdminUser, loginUser, cleanupUser } from "./helpers";

describe("CT011 - Cadastramento de Perguntas para o Teste Vocacional", () => {
  let adminId: bigint | null = null;
  let adminToken = "";
  let createdQuestionId: bigint | null = null;

  beforeAll(async () => {
    const admin = await createAdminUser({
      nome: "Admin Perguntas CT011",
      senha: "SenhaAdmin123!",
    });
    adminId = admin.user.id_usuario;

    const loginRes = await loginUser(admin.email, "SenhaAdmin123!");
    adminToken = loginRes.token;
  });

  afterAll(async () => {
    if (createdQuestionId) {
      await prisma.perguntaVocacional.delete({
        where: { id_pergunta: createdQuestionId },
      });
    }
    if (adminId) {
      await cleanupUser(adminId);
    }
    await prisma.$disconnect();
  });

  it("deve cadastrar uma nova pergunta vocacional com enunciado e área de afinidade persistida", async () => {
    const novaPergunta = {
      enunciado: "Gosto de planejar e gerenciar projetos e metas em equipe?",
      area_afinidade: "Administração e Gestão",
      status: true,
    };

    const response = await request(app)
      .post("/perguntas-vocacionais")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(novaPergunta);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id_pergunta");
    expect(response.body.enunciado).toBe(novaPergunta.enunciado);
    expect(response.body.area_afinidade).toBe(novaPergunta.area_afinidade);
    expect(response.body.status).toBe(true);

    createdQuestionId = BigInt(response.body.id_pergunta);

    // Valida persistência no banco de dados
    const perguntaDb = await prisma.perguntaVocacional.findUnique({
      where: { id_pergunta: createdQuestionId },
    });

    expect(perguntaDb).not.toBeNull();
    expect(perguntaDb?.enunciado).toBe(novaPergunta.enunciado);
    expect(perguntaDb?.area_afinidade).toBe(novaPergunta.area_afinidade);
    expect(perguntaDb?.id_usuario_cadastrador).toBe(adminId);
  });
});

