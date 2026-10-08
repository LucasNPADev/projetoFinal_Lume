import type { Express } from "express";
import { rateLimit } from "express-rate-limit";
import { optionalAuth } from "../middlewares/auth";
import { authRoutes } from "./auth.routes";
import { adminRoutes } from "./admin.routes";
import { avaliacaoRoutes } from "./avaliacao.routes";
import { cargoRoutes } from "./cargo.routes";
import { comparacoesRoutes } from "./comparacoes.routes";
import { cursoRoutes } from "./curso.routes";
import { eventosRoutes } from "./eventos.routes";
import { instituicaoRoutes } from "./instituicao.routes";
import { quizRoutes } from "./quiz.routes";
import { usuarioRoutes } from "./usuario.routes";

/**
 * Registro central de rotas REST do LUME.
 * Os endpoints sao prefixados por /api e testaveis no Insomnia
 * (veja backend/insomnia.collection.json).
 *
 * Esta lista representa os modulos efetivamente montados no Express.
 */
export const modulosApi = [
  { prefixo: "/api/auth", router: authRoutes },
  { prefixo: "/api/admin", router: adminRoutes },
  { prefixo: "/api/avaliacoes", router: avaliacaoRoutes },
  { prefixo: "/api/eventos", router: eventosRoutes },
  { prefixo: "/api/comparacoes", router: comparacoesRoutes },
  { prefixo: "/api/cargos", router: cargoRoutes },
  { prefixo: "/api/cursos", router: cursoRoutes },
  { prefixo: "/api/instituicoes", router: instituicaoRoutes },
  { prefixo: "/api/quiz", router: quizRoutes },
  { prefixo: "/api/usuarios", router: usuarioRoutes },
] as const;

// Login, cadastro, refresh e recuperacao nao podem depender de
// um JWT vencido enviado automaticamente por um cliente como Insomnia.
const caminhosAuthPublicos = new Set([
  "/auth/login", "/auth/cadastro", "/auth/admin/login",
  "/auth/refresh", "/auth/senha/solicitar-recuperacao",
  "/auth/senha/redefinir"
]);

export function montarRotasApi(app: Express) {
  app.use("/api", (req, res, next) => {
    if (caminhosAuthPublicos.has(req.path)) return next();
    optionalAuth(req, res, next);
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });
  for (const { prefixo, router } of modulosApi) {
    app.use(prefixo, prefixo === "/api/auth" ? authLimiter : router);
    if (prefixo === "/api/auth") app.use(prefixo, router);
  }
}
