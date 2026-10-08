import { createHash, randomBytes } from "node:crypto";
import { RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { jwtSecret } from "../config/env";
import { ApiError } from "./errors";

export const REFRESH_COOKIE = "lume_refresh";
export const REFRESH_MS = 30 * 24 * 60 * 60 * 1000;
const acessTtl = 15 * 60;

export function hashOpaque(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
function accessToken(id: number, kind: "USER" | "ADMIN", sessionId: string) {
  return jwt.sign({ role: kind, sid: sessionId }, jwtSecret(), {
    algorithm: "HS256", subject: String(id), issuer: "lume-api",
    audience: "lume-client", expiresIn: acessTtl
  });
}
export function cookieRefresh(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    maxAge: REFRESH_MS
  });
}
export function limparCookieRefresh(res: Response) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth"
  });
}
export function lerRefreshCookie(cookieHeader?: string) {
  const cookies = (cookieHeader ?? "").split(";").map((s) => s.trim());
  const item = cookies.find((s) => s.startsWith(REFRESH_COOKIE + "="));
  return item ? item.slice(REFRESH_COOKIE.length + 1) : undefined;
}
export async function emitirSessao(id: number, kind: "USER" | "ADMIN", res: Response) {
  const refreshToken = randomBytes(48).toString("base64url");
  const session = await prisma.sessao.create({
    data: {
      ...(kind === "USER" ? { usuarioId: id } : { adminId: id }),
      refreshHash: hashOpaque(refreshToken),
      expiraEm: new Date(Date.now() + REFRESH_MS)
    }
  });
  cookieRefresh(res, refreshToken);
  return { token: accessToken(id, kind, session.id), tipo: "Bearer", expiraEmSegundos: acessTtl };
}
export async function renovarSessao(refreshToken: string, res: Response) {
  const currentHash = hashOpaque(refreshToken);
  const current = await prisma.sessao.findUnique({
    where: { refreshHash: currentHash },
    include: { admin: { select: { ativo: true } }, usuario: { select: { id: true } } }
  });
  if (!current || current.revogadaEm || current.expiraEm <= new Date() ||
      (current.adminId !== null && !current.admin?.ativo) ||
      (current.usuarioId !== null && !current.usuario)) {
    throw new ApiError(401, "Refresh token invalido ou expirado.");
  }
  const nextToken = randomBytes(48).toString("base64url");
  const updated = await prisma.sessao.updateMany({
    where: { id: current.id, refreshHash: currentHash, revogadaEm: null, expiraEm: { gt: new Date() } },
    data: { refreshHash: hashOpaque(nextToken), ultimoUsoEm: new Date() }
  });
  if (updated.count !== 1) throw new ApiError(401, "Refresh token reutilizado ou invalido.");
  cookieRefresh(res, nextToken);
  const id = current.usuarioId ?? current.adminId!;
  const kind = current.usuarioId !== null ? "USER" as const : "ADMIN" as const;
  return { token: accessToken(id, kind, current.id), tipo: "Bearer", expiraEmSegundos: acessTtl };
}

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header) return next();
  if (!/^Bearer [A-Za-z0-9_\-+.=/]+$/.test(header)) return next(new ApiError(401, "Credencial invalida."));
  try {
    const payload = jwt.verify(header.slice(7), jwtSecret(), {
      algorithms: ["HS256"], issuer: "lume-api", audience: "lume-client"
    });
    if (typeof payload === "string" || !payload.sub ||
        !/^[1-9]\d*$/.test(payload.sub) || !Number.isSafeInteger(Number(payload.sub)) ||
        typeof payload.sid !== "string" || (payload.role !== "USER" && payload.role !== "ADMIN")) {
      throw new Error("Token malformado");
    }
    const id = Number(payload.sub);
    const sessao = await prisma.sessao.findUnique({
      where: { id: payload.sid },
      include: { admin: { select: { ativo: true } }, usuario: { select: { id: true } } }
    });
    if (!sessao || sessao.revogadaEm || sessao.expiraEm <= new Date() ||
        (payload.role === "USER" && (sessao.usuarioId !== id || !sessao.usuario)) ||
        (payload.role === "ADMIN" && (sessao.adminId !== id || !sessao.admin?.ativo))) {
      throw new Error("Sessao revogada ou ator inativo");
    }
    req.principal = { id, kind: payload.role, sessionId: sessao.id };
    next();
  } catch {
    next(new ApiError(401, "Sessao invalida ou expirada."));
  }
};

export const requireAuth: RequestHandler = (req, _res, next) =>
  req.principal ? next() : next(new ApiError(401, "Autenticacao obrigatoria."));
export const requireUser: RequestHandler = (req, _res, next) =>
  req.principal?.kind === "USER" ? next() : next(new ApiError(req.principal ? 403 : 401, "Acesso reservado a estudantes."));
export const requireAdmin: RequestHandler = (req, _res, next) =>
  req.principal?.kind === "ADMIN" ? next() : next(new ApiError(req.principal ? 403 : 401, "Acesso reservado a administradores."));
