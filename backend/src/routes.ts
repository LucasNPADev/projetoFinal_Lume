import { Router } from "express";
import { isAuthenticated as auth } from "./middlewares/isAuthenticated";
import { isAdmin as admin } from "./middlewares/isAdmin";
import * as u from "./controllers/usuarioController";
import * as s from "./controllers/sessionController";
import * as c from "./controllers/cursoController";
import * as i from "./controllers/instituicaoController";
import * as g from "./controllers/cargoController";
import * as r from "./controllers/recursosController";
import { env } from "./config/env";
import { prisma } from "./prisma";
export const routes = Router();
routes.get("/health", (_req, res) =>
  res.json({ status: "ok", servico: "LUME API" }),
);
routes.get("/health/db", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", banco: "conectado" });
});
routes.get("/termos", (_req, res) =>
  res.json({
    versao: env.TERMS_VERSION,
    finalidade:
      "Orientação de carreira, recomendações e recursos salvos pelo estudante.",
    dados:
      "Nome, e-mail, senha em hash, região escolhida, favoritos, avaliações e histórico de consultas e testes.",
    localizacao:
      "O GPS é opcional. A interface deve pedir permissão ao dispositivo. Você pode definir sua região manualmente e retirar o consentimento.",
    controle:
      "Consulte e exporte seus dados em /usuarios/me/dados. Exclua a conta em /usuarios/me. A exclusão remove os dados pessoais associados.",
    orientacao:
      "Resultados vocacionais e estimativas são informativos. Confirme informações de ingresso nos canais oficiais.",
  }),
);
routes.post("/usuarios", u.cadastrar);
routes.post("/session", s.login);
routes.post("/session/refresh", s.refresh);
routes.post("/usuarios/recuperar-senha", u.recuperar);
routes.post("/usuarios/redefinir-senha", u.redefinir);
routes.use(auth);
routes.delete("/session", s.logout);
routes.get("/usuarios/me", u.perfil);
routes.patch("/usuarios/me", u.editar);
routes.put("/usuarios/me/localizacao", u.localizacao);
routes.patch("/usuarios/me/senha", u.senha);
routes.delete("/usuarios/me", u.excluir);
routes.get("/usuarios/me/dados", u.exportar);
routes.get("/usuarios/me/historico", u.historico);
routes.get("/fontes", r.fontes);
routes.post("/fontes", admin, r.fonteCriar);
routes.get("/cursos", c.listar);
routes.get("/cursos/:id", c.buscar);
routes.post("/cursos", admin, c.criar);
routes.patch("/cursos/:id", admin, c.editar);
routes.delete("/cursos/:id", admin, c.arquivar);
routes.get("/instituicoes", i.listar);
routes.get("/instituicoes/:id", i.buscar);
routes.post("/instituicoes", admin, i.criar);
routes.patch("/instituicoes/:id", admin, i.editar);
routes.delete("/instituicoes/:id", admin, i.arquivar);
routes.post("/instituicoes/cursos", admin, i.vincularCursoPorJson);
routes.post("/instituicoes/:id/cursos", admin, i.vincularCurso);
routes.get("/ofertas", i.ofertas);
routes.get("/ofertas/:id", i.oferta);
routes.patch("/ofertas/:id", admin, i.editarOferta);
routes.delete("/ofertas/:id", admin, i.arquivarOferta);
routes.get("/cargos", g.listar);
routes.get("/feed", g.listar);
routes.get("/cargos/:id", g.buscar);
routes.post("/cargos", admin, g.criar);
routes.patch("/cargos/:id", admin, g.editar);
routes.delete("/cargos/:id", admin, g.arquivar);
routes.get("/cargos/:id/rotas", g.listarRotas);
routes.post("/cargos/:id/rotas", admin, g.criarRota);
routes.get("/rotas/:id", g.buscarRota);
routes.put("/rotas/:id", admin, g.editarRota);
routes.delete("/rotas/:id", admin, g.arquivarRota);
routes.get("/favoritos", r.favoritosListar);
routes.post("/favoritos", r.favoritar);
routes.delete("/favoritos/:id", r.favoritoRemover);
routes.get("/avaliacoes", r.avaliacoesListar);
routes.post("/avaliacoes", r.avaliar);
routes.patch("/avaliacoes/:id", r.avaliacaoEditar);
routes.delete("/avaliacoes/:id", r.avaliacaoRemover);
routes.post("/avaliacoes/:id/denuncias", r.denunciar);
routes.get("/perguntas-vocacionais", r.perguntas);
routes.post("/perguntas-vocacionais", admin, r.perguntaCriar);
routes.patch("/perguntas-vocacionais/:id", admin, r.perguntaEditar);
routes.delete("/perguntas-vocacionais/:id", admin, r.perguntaArquivar);
routes.post("/teste-vocacional", r.responder);
routes.get("/teste-vocacional/atual", r.resultado);
routes.get("/teste-vocacional/historico", r.testesHistorico);
routes.post("/comparativos", r.comparar);
routes.post("/simulador-enem", r.simular);
routes.get("/calendario", r.calendario);
routes.post("/eventos", admin, r.eventoCriar);
routes.patch("/eventos/:id", admin, r.eventoEditar);
routes.delete("/eventos/:id", admin, r.eventoArquivar);
routes.get("/notificacoes", r.notificacoesListar);
routes.patch("/notificacoes/:id/lida", r.notificacaoLer);
routes.delete("/notificacoes/:id", r.notificacaoRemover);
routes.get("/admin/ofertas", admin, r.ofertasAdmin);
routes.get("/admin/eventos", admin, r.eventosListar);
routes.get("/admin/perguntas-vocacionais", admin, r.perguntasAdmin);
routes.get("/admin/denuncias", admin, r.denunciasListar);
routes.patch("/admin/denuncias/:id", admin, r.denunciaResolver);
routes.patch("/admin/avaliacoes/:id/moderacao", admin, r.moderar);
routes.get("/admin/relatorios", admin, r.relatorio);
