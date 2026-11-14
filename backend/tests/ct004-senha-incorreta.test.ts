import { app, prisma, request, createTestUser, cleanupUser } from "./helpers";

describe("CT004 - Bloqueio de Autenticação com Senha Incorreta", () => {
  let userId: bigint | null = null;
  let userEmail = "";
  const correctPassword = "SenhaCorreta@123";

  beforeAll(async () => {
    const created = await createTestUser({
      nome: "Usuario Teste Senha",
      senha: correctPassword,
    });
    userId = created.user.id_usuario;
    userEmail = created.email;
  });

  afterAll(async () => {
    if (userId) {
      await cleanupUser(userId);
    }
    await prisma.$disconnect();
  });

  it("deve retornar HTTP 401 e recusar autenticação quando a senha estiver incorreta", async () => {
    const response = await request(app)
      .post("/session")
      .send({
        email: userEmail,
        senha: "SenhaCompletamenteIncorreta!",
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("E-mail ou senha inválidos");

    // Garante que nenhuma sessão foi criada para o usuário
    const sessoes = await prisma.sessao.findMany({
      where: { id_usuario: userId! },
    });
    expect(sessoes).toHaveLength(0);
  });
});

