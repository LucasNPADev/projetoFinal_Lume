import { Router } from "express";
import { atualizarUsuario, buscarUsuario } from "../controllers/usuario.controller";
export const usuarioRoutes = Router();
usuarioRoutes.get("/:id", buscarUsuario);
usuarioRoutes.put("/:id", atualizarUsuario);