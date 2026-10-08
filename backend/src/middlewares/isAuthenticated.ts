import { RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export const isAuthenticated: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header) throw new AppError('Token não informado', 401);

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError('Token mal formatado', 401);

  let payload: JwtPayload & { perfil?: string };
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload & { perfil?: string };
  } catch {
    throw new AppError('Token inválido ou expirado', 401);
  }

  if (!payload.sub || !payload.perfil) throw new AppError('Token inválido', 401);

  req.user = { id: BigInt(payload.sub), perfil: payload.perfil };
  next();
};
