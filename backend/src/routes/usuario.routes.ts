import { Router } from "express";
import { atualizarUsuario, buscarUsuario } from "../controllers/usuario.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const usuarioRoutes = Router();
usuarioRoutes.get("/:id", requireAuth, buscarUsuario);
usuarioRoutes.put("/:id", requireAuth, atualizarUsuario);
