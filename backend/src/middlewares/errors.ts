import { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

export const notFound: RequestHandler = (_req, _res, next) => next(new ApiError(404, "Rota nao encontrada."));

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Dados invalidos.", details: error.issues.map((item) => ({ path: item.path, message: item.message })) } });
    return;
  }
  if (error instanceof ApiError) {
    res.status(error.status).json({ error: { code: "APP_ERROR", message: error.message, ...(error.details ? { details: error.details } : {}) } });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") { res.status(409).json({ error: { code: "CONFLICT", message: "Registro duplicado." } }); return; }
    if (error.code === "P2025") { res.status(404).json({ error: { code: "NOT_FOUND", message: "Registro nao encontrado." } }); return; }
    if (error.code === "P2003") { res.status(409).json({ error: { code: "RELATION_ERROR", message: "Registro relacionado invalido ou em uso." } }); return; }
  }
  console.error("[LUME API]", error);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor." } });
};
