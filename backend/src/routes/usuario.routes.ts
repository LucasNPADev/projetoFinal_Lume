import { Router } from "express";
import { requireUser } from "../middlewares/auth";
import { atualizarUsuario, buscarUsuario, excluirUsuario } from "../controllers/usuario.controller";
import { favoritosRoutes } from "./favoritos.routes";
import { notificacoesRoutes } from "./notificacoes.routes";

export const usuarioRoutes = Router();
usuarioRoutes.use(requireUser);
usuarioRoutes.use("/me/favoritos", favoritosRoutes);
usuarioRoutes.use("/me/notificacoes", notificacoesRoutes);
usuarioRoutes.get("/me", buscarUsuario);
usuarioRoutes.patch("/me", atualizarUsuario);
usuarioRoutes.delete("/me", excluirUsuario);
usuarioRoutes.get("/:id", buscarUsuario);
usuarioRoutes.put("/:id", atualizarUsuario);
