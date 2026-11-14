import { app, prisma, request, createTestUser, cleanupUser } from "./helpers";

describe("CT002 - Bloqueio de Cadastro com E-mail Já Existente no Sistema", () => {
  let existingUserId: bigint | null = null;
  let duplicateEmail: string = "";

  beforeAll(async () => {
    const created = await createTestUser({
      nome: "Usuario Ja Existente",
      senha: "SenhaExistente123!",
    });
    existingUserId = created.user.id_usuario;
    duplicateEmail = created.email;
  });

  afterAll(async () => {
    if (existingUserId) {
      await cleanupUser(existingUserId);
    }
    await prisma.$disconnect();
  });

  it("deve retornar HTTP 409 e mensagem de erro ao tentar cadastrar email duplicado", async () => {
    const response = await request(app)
      .post("/usuarios")
      .send({
        nome: "Tentativa Duplicada",
        email: duplicateEmail,
        senha: "OutraSenha123!",
        aceitou_termos: true,
      });

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("E-mail já cadastrado");
  });
});

