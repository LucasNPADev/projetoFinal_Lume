import jwt from "jsonwebtoken";
import { app, prisma, request, createTestUser, cleanupUser } from "./helpers";
import { env } from "../src/config/env";

describe("CT003 - Autenticação de Estudante (Login)", () => {
  let userId: bigint | null = null;
  let userEmail = "";
  const rawPassword = "SenhaLoginValida123!";

  beforeAll(async () => {
    const created = await createTestUser({
      nome: "Estudante Login",
      senha: rawPassword,
      perfil: "usuario",
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

  it("deve autenticar o estudante com sucesso retornando HTTP 200 OK e token JWT válido", async () => {
    const response = await request(app)
      .post("/session")
      .send({
        email: userEmail,
        senha: rawPassword,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("refresh_token");
    expect(response.body.token_type).toBe("Bearer");
    expect(response.body.perfil).toBe("ESTUDANTE");
    expect(response.body.email).toBe(userEmail);

    // Valida assinatura do token JWT
    const decoded = jwt.verify(response.body.token, env.JWT_SECRET) as jwt.JwtPayload;
    expect(decoded.sub).toBe(userId?.toString());
    expect(decoded.perfil).toBe("ESTUDANTE");
    expect(decoded).toHaveProperty("sid");

    // Valida persistência da sessão no banco
    const sessaoNoBanco = await prisma.sessao.findUnique({
      where: { id_sessao: decoded.sid },
    });
    expect(sessaoNoBanco).not.toBeNull();
    expect(sessaoNoBanco?.id_usuario).toBe(userId);
  });
});

