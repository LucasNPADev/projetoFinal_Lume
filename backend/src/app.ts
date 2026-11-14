import "./utils/bigint";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { routes } from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { env } from "./config/env";
import { AppError } from "./utils/AppError";
export const app = express();
app.disable("x-powered-by");
app.use(helmet());
const origens = env.CORS_ORIGINS.split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origens.includes(origin)) callback(null, true);
      else callback(new AppError("Origem não autorizada", 403));
    },
  }),
);
app.use(express.json({ limit: "256kb" }));
if (env.NODE_ENV !== "test") {
  app.use(
    rateLimit({
      windowMs: 60000,
      limit: 300,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Muitas requisições. Aguarde um minuto." },
    }),
  );
  const limitarAuth = rateLimit({
    windowMs: 15 * 60000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Muitas tentativas. Aguarde 15 minutos." },
  });
  app.use(
    ["/session", "/usuarios/recuperar-senha", "/usuarios/redefinir-senha"],
    limitarAuth,
  );
}
app.use(routes);
app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});
app.use(errorHandler);
