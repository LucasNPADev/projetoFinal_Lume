import { Router } from "express";
import { buscarCurso, listarCursos } from "../controllers/catalog.controller";

export const cursoRoutes = Router();
cursoRoutes.get("/", listarCursos);
cursoRoutes.get("/:id", buscarCurso);
