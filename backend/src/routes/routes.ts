import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { cargoRoutes } from "./cargo.routes";
import { cursoRoutes } from "./curso.routes";
import { instituicaoRoutes } from "./instituicao.routes";
import { quizRoutes } from "./quiz.routes";
import { usuarioRoutes } from "./usuario.routes";

export const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/usuarios", usuarioRoutes);
apiRoutes.use("/cargos", cargoRoutes);
apiRoutes.use("/cursos", cursoRoutes);
apiRoutes.use("/instituicoes", instituicaoRoutes);
apiRoutes.use("/quiz", quizRoutes);
