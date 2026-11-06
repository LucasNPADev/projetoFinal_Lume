import nodemailer from "nodemailer";
import { app, prisma, request, createTestUser, cleanupUser } from "./helpers";

describe("CT005 - Solicitação de recuperação de senha com e-mail válido", () => {
  let userId: bigint | null = null;
  let userEmail = "";
  let sendMailMock: jest.Mock;

  beforeAll(async () => {
    sendMailMock = jest.fn().mockResolvedValue({ messageId: "mock-msg-id" });
    jest.spyOn(nodemailer, "createTransport").mockReturnValue({
      sendMail: sendMailMock,
    } as any);

    const created = await createTestUser({
      nome: "Estudante Recuperacao",
      senha: "SenhaOriginal123!",
    });
    userId = created.user.id_usuario;
    userEmail = created.email;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    if (userId) {
      await cleanupUser(userId);
    }
    await prisma.$disconnect();
  });

  it("deve gerar token de recuperação no banco e disparar e-mail via fluxo SMTP", async () => {
    const response = await request(app)
      .post("/usuarios/recuperar-senha")
      .send({ email: userEmail });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("mensagem");
    expect(response.body.mensagem).toContain("Se o e-mail estiver cadastrado");

    // Valida geração e persistência do token no banco de dados
    const recuperacao = await prisma.recuperacaoSenha.findFirst({
      where: { id_usuario: userId! },
      orderBy: { expira_em: "desc" },
    });

    expect(recuperacao).not.toBeNull();
    expect(recuperacao?.token_hash).toHaveLength(64);
    expect(recuperacao?.expira_em.getTime()).toBeGreaterThan(Date.now());
    expect(recuperacao?.usado_em).toBeNull();

    // Valida que o SMTP disparou o e-mail com link contendo token
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: userEmail,
        subject: expect.stringContaining("recuperação de senha"),
        text: expect.stringMatching(/redefinir-senha\?token=/),
      }),
    );
  });
});

