import { RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { prisma } from "../prisma";
import { perfilPublico } from "../utils/perfil";
export const isAuthenticated: RequestHandler = async (req, _res, next) => {
  const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization ?? "");
  if (!match) throw new AppError("Informe Authorization: Bearer <token>", 401);
  let payload: JwtPayload;
  try {
    const parsed = jwt.verify(match[1], env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "lume-api",
      audience: "lume-client",
    });
    if (
      typeof parsed === "string" ||
      !parsed.sub ||
      !/^[1-9]\d*$/.test(parsed.sub) ||
      typeof parsed.sid !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(parsed.sid)
    )
      throw new Error();
    payload = parsed;
  } catch {
    throw new AppError("Token inválido ou expirado", 401);
  }
  const sessao = await prisma.sessao.findUnique({
    where: { id_sessao: payload.sid },
    include: { usuario: { select: { id_usuario: true, perfil: true } } },
  });
  if (
    !sessao ||
    sessao.revogada_em ||
    sessao.expira_em <= new Date() ||
    sessao.id_usuario.toString() !== payload.sub
  )
    throw new AppError("Sessão encerrada ou inválida", 401);
  req.user = {
    id: sessao.id_usuario,
    perfil: perfilPublico(sessao.usuario.perfil),
    idSessao: sessao.id_sessao,
  };
  next();
};
