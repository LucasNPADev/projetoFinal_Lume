import "dotenv/config";
import { criarAdministrador } from "../src/services/bootstrapService";
import { prisma } from "../src/prisma";
async function main() {
  const { ADMIN_EMAIL, ADMIN_SENHA } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_SENHA)
    throw new Error("Defina ADMIN_EMAIL e ADMIN_SENHA no .env.");
  const admin = await criarAdministrador(
    process.env.ADMIN_NOME ?? "Administrador LUME",
    ADMIN_EMAIL,
    ADMIN_SENHA,
  );
  console.log(
    `Administrador pronto: ${admin.email} (id ${admin.id_usuario}). Senha existente preservada.`,
  );
}
main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : "Erro no seed");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
