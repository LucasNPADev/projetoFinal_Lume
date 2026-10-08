import "dotenv/config";
import app from "./app";
import { prisma } from "./config/prisma";
import { jwtSecret, port } from "./config/env";

async function main() {
  jwtSecret();
  const listenPort = port();
  await prisma.$connect();
  const server = app.listen(listenPort, () => console.info("LUME API pronta na porta " + listenPort));
  let stopping = false;
  async function shutdown() {
    if (stopping) return;
    stopping = true;
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  }
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
main().catch((error) => { console.error("Falha ao iniciar LUME API:", error); process.exit(1); });
