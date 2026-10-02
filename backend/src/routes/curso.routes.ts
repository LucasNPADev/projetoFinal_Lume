import { Router } from "express";
import { listarCursos } from "../controllers/catalog.controller";
export const cursoRoutes = Router();
cursoRoutes.get("/", listarCursos);