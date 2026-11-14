import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./prisma";
const server = app.listen(env.PORT, env.HOST, () =>
  console.log(`LUME API rodando em http://localhost:${env.PORT}`),
);
server.on("error", (err) => {
  console.error(`Falha ao iniciar servidor: ${err.message}`);
  process.exit(1);
});
async function encerrar() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);
