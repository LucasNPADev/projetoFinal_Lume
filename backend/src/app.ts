import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { apiRoutes } from "./routes/routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", projeto: "LUME - GPS de Carreira" });
});

app.use("/api", apiRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Rota não encontrada." });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ message: "Erro interno do servidor." });
});

export default app;
