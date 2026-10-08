import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { jwtSecret } from "../config/env";
import { ApiError } from "./errors";

export function criarToken(id: number, kind: "USER" | "ADMIN") {
  return jwt.sign({ role: kind }, jwtSecret(), {
    algorithm: "HS256", subject: String(id), issuer: "lume-api", audience: "lume-client", expiresIn: "2h"
  });
}

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header) return next();
  if (!/^Bearer [A-Za-z0-9_\-+.=/]+$/.test(header)) return next(new ApiError(401, "Credencial invalida."));
  try {
    const payload = jwt.verify(header.slice(7), jwtSecret(), { algorithms: ["HS256"], issuer: "lume-api", audience: "lume-client" });
    if (typeof payload === "string" || !payload.sub || !/^[1-9]\d*$/.test(payload.sub) || (payload.role !== "USER" && payload.role !== "ADMIN")) throw new Error("Payload invalido");
    const id = Number(payload.sub);
    if (!Number.isSafeInteger(id)) throw new Error("ID invalido");
    if (payload.role === "ADMIN") {
      const admin = await prisma.admin.findUnique({ where: { id }, select: { ativo: true } });
      if (!admin?.ativo) throw new Error("Admin desativado");
    } else {
      const user = await prisma.usuario.findUnique({ where: { id }, select: { id: true } });
      if (!user) throw new Error("Usuario excluido");
    }
    req.principal = { id, kind: payload.role };
    next();
  } catch {
    next(new ApiError(401, "Sessao invalida ou expirada."));
  }
};

export const requireAuth: RequestHandler = (req, _res, next) => req.principal ? next() : next(new ApiError(401, "Autenticacao obrigatoria."));
export const requireUser: RequestHandler = (req, _res, next) => req.principal?.kind === "USER" ? next() : next(new ApiError(req.principal ? 403 : 401, "Acesso reservado a estudantes."));
export const requireAdmin: RequestHandler = (req, _res, next) => req.principal?.kind === "ADMIN" ? next() : next(new ApiError(req.principal ? 403 : 401, "Acesso reservado a administradores."));
