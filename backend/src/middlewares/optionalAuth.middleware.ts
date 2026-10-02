import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type TokenPayload = { sub: string };

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? "lume-local-secret") as TokenPayload;
    const usuarioId = Number(payload.sub);
    if (Number.isInteger(usuarioId)) {
      res.locals.usuarioId = usuarioId;
    }
  } catch {
    // O endpoint continua público; token inválido não cria identidade.
  }

  return next();
}
