import bcrypt from "bcryptjs";
import { app, prisma, request, uniqueEmail, cleanupUser } from "./helpers";

describe("CT001 - Cadastro de Novo Estudante no Aplicativo com Dados Válidos", () => {
  let createdUserId: bigint | null = null;
  const email = uniqueEmail("ct001_estudante");
  const rawPassword = "MinhaSenhaSegura123!";

  afterAll(async () => {
    if (createdUserId) {
      await cleanupUser(createdUserId);
    }
    await prisma.$disconnect();
  });

  it("deve cadastrar um estudante com sucesso e persistir a senha com hash bcrypt", async () => {
    const response = await request(app)
      .post("/usuarios")
      .send({
        nome: "Estudante CT001",
        email,
        senha: rawPassword,
        aceitou_termos: true,
        cidade: "São Paulo",
        estado: "SP",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id_usuario");
    expect(response.body.nome).toBe("Estudante CT001");
    expect(response.body.email).toBe(email);
    expect(response.body.perfil).toBe("ESTUDANTE");

    createdUserId = BigInt(response.body.id_usuario);

    const userInDb = await prisma.usuario.findUnique({
      where: { id_usuario: createdUserId },
    });

    expect(userInDb).not.toBeNull();
    expect(userInDb?.senha_hash).not.toBe(rawPassword);
    expect(userInDb?.senha_hash.startsWith("$2")).toBe(true);

    const isMatch = await bcrypt.compare(rawPassword, userInDb!.senha_hash);
    expect(isMatch).toBe(true);
  });
});

