import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type TokenPayload = { sub: string };

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Autenticação obrigatória." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? "lume-local-secret") as TokenPayload;
    const usuarioId = Number(payload.sub);
    if (!Number.isInteger(usuarioId)) return res.status(401).json({ message: "Token inválido." });
    res.locals.usuarioId = usuarioId;
    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido ou expirado." });
  }
}
