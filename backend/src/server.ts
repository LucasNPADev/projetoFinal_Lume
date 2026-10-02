import "dotenv/config";
import app from "./app";
import { disconnectPrisma } from "./config/prisma";

const PORT = Number(process.env.PORT ?? 3333);
const server = app.listen(PORT, () => console.log(`LUME API rodando na porta ${PORT}`));

async function shutdown() {
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);