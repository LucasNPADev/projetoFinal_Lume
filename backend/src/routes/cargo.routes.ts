import { Router } from "express";
import { buscarCargo, listarCargos } from "../controllers/catalog.controller";
export const cargoRoutes = Router();
cargoRoutes.get("/", listarCargos);
cargoRoutes.get("/:id", buscarCargo);