import { Router } from 'express';
import { isAuthenticated } from './middlewares/isAuthenticated';
import { isAdmin } from './middlewares/isAdmin';
import * as usuarioController from './controllers/usuarioController';
import * as sessionController from './controllers/sessionController';
import * as cursoController from './controllers/cursoController';
import * as instituicaoController from './controllers/instituicaoController';

export const routes = Router();

routes.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Públicas
routes.post('/usuarios', usuarioController.cadastrar); // cadastro
routes.post('/session', sessionController.login); // login

// Autenticado (estudante ou admin)
routes.get('/cursos', isAuthenticated, cursoController.listar);
routes.get('/cursos/:id', isAuthenticated, cursoController.buscar);

// Somente administrador
routes.post('/cursos', isAuthenticated, isAdmin, cursoController.criar);
routes.post('/instituicoes', isAuthenticated, isAdmin, instituicaoController.criar);
routes.post(
  '/instituicoes/:id/cursos',
  isAuthenticated,
  isAdmin,
  instituicaoController.vincularCurso,
);
