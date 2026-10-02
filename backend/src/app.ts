import cors from "cors";
import express from "express";
import { cargoRoutes } from "./routes/cargo.routes";
import { cursoRoutes } from "./routes/curso.routes";
import { instituicaoRoutes } from "./routes/instituicao.routes";
import { quizRoutes } from "./routes/quiz.routes";
import { usuarioRoutes } from "./routes/usuario.routes";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", projeto: "LUME - GPS de Carreira" });
});

app.use("/api/cargos", cargoRoutes);
app.use("/api/cursos", cursoRoutes);
app.use("/api/instituicoes", instituicaoRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/usuarios", usuarioRoutes);

export default app;