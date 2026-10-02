import { Router } from "express";
import { login, registrar } from "../controllers/auth.controller";

export const authRoutes = Router();
authRoutes.post("/register", registrar);
authRoutes.post("/login", login);
