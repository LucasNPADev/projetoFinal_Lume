import { RequestHandler } from "express";
import { AppError } from "../utils/AppError";

export const isAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.perfil !== "ADMIN") {
    throw new AppError("Acesso restrito a administradores", 403);
  }
  next();
};
