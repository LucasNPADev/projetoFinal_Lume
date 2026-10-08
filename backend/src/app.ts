import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { montarRotasApi } from "./routes/routes";
import { ApiError, errorHandler, notFound } from "./middlewares/errors";

const app = express();
app.disable("x-powered-by");
app.use(helmet());
const origens = (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors({ credentials: true, origin(origin, callback) {
  if (!origin || origens.includes(origin)) return callback(null, true);
  callback(new ApiError(403, "Origem nao permitida."));
}}));
app.use(express.json({ limit: "64kb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", projeto: "LUME - GPS de Carreira" }));
app.get("/api/ready", async (_req, res) => {
  const { prisma } = await import("./config/prisma");
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ready", database: "ok" });
});
montarRotasApi(app);
app.use(notFound);
app.use(errorHandler);
export default app;
