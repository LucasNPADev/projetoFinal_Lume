import { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res
      .status(400)
      .json({
        error: "Dados inválidos",
        detalhes: err.issues.map((i) => ({
          campo: i.path.join("."),
          mensagem: i.message,
        })),
      });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res
        .status(409)
        .json({
          error:
            "Já existe um registro com esses dados. Confira e-mail, CNPJ ou vínculo repetido.",
        });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: "Registro não encontrado" });
      return;
    }
    if (err.code === "P2003") {
      res
        .status(409)
        .json({
          error:
            "O registro possui vínculo obrigatório ou o registro relacionado não existe",
        });
      return;
    }
    if (["P2000", "P2004"].includes(err.code)) {
      res
        .status(400)
        .json({
          error:
            "Os dados violam uma restrição do banco. Confira os valores enviados.",
        });
      return;
    }
    if (["P2021", "P2022"].includes(err.code)) {
      res
        .status(503)
        .json({
          error:
            "Banco desatualizado. Aplique as migrations com npm run db:deploy.",
        });
      return;
    }
    if (["P1001", "P1002", "P1008", "P1017", "P2024"].includes(err.code)) {
      res
        .status(503)
        .json({
          error:
            "Conexão com o banco indisponível. Confira PostgreSQL e DATABASE_URL.",
        });
      return;
    }
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    res
      .status(503)
      .json({
        error: "Banco indisponível. Confira PostgreSQL e DATABASE_URL.",
      });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "JSON inválido no corpo da requisição" });
    return;
  }
  if (err?.type === "entity.too.large") {
    res.status(413).json({ error: "Corpo da requisição excede 256 KB" });
    return;
  }
  console.error("Erro interno:", err?.code ?? err?.name ?? "desconhecido");
  res.status(500).json({ error: "Erro interno do servidor" });
};
