import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { requireAdmin } from "../middlewares/auth";
import { ApiError } from "../middlewares/errors";
import { id, modalidade, moeda, pagina, paramId, texto, tipoInstituicao, uf } from "../utils/validation";
import { opcoesSchema } from "../services/quiz.service";
import { avisarMudancaOferta } from "../services/notificacoes.service";

export const adminRoutes = Router();
adminRoutes.use(requireAdmin);

const skills = z.array(texto(100)).max(30);
const cargoFields = z.object({
  nome: texto(150), area: texto(100), descricao: texto(4000),
  salarioPiso: moeda, salarioMedio: moeda, salarioTeto: moeda,
  fonteSalario: texto(500).nullable().optional(),
  referenciaSalario: z.coerce.date().nullable().optional(),
  altaDemanda: z.boolean().default(false),
  hardSkills: skills, softSkills: skills, ativo: z.boolean().default(true)
}).strict();
const cursoFields = z.object({
  nome: texto(150), area: texto(100), descricao: texto(4000).nullable().optional(),
  duracaoAnos: z.number().min(0.1).max(30).nullable().optional(),
  modalidade, turno: texto(60).nullable().optional(),
  notaEnemMin: z.number().min(0).max(1000).nullable().optional(),
  salarioMin: moeda.nullable().optional(), salarioMedio: moeda.nullable().optional(), salarioMax: moeda.nullable().optional(),
  ativo: z.boolean().default(true)
}).strict();
const instituicaoFields = z.object({
  nome: texto(200), tipo: tipoInstituicao, cidade: texto(120), estado: uf,
  endereco: texto(400).nullable().optional(), latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(), descricao: texto(4000).nullable().optional(),
  site: z.string().url().max(500).nullable().optional(), telefone: texto(50).nullable().optional(),
  whatsapp: texto(50).nullable().optional(), email: z.string().email().max(254).nullable().optional(),
  mensalidadeMin: moeda.nullable().optional(), mensalidadeMax: moeda.nullable().optional(),
  fonteDados: texto(500).nullable().optional(), dadosDemonstracao: z.boolean().default(false),
  ativo: z.boolean().default(true)
}).strict();
const ofertaFields = z.object({
  cursoId: id, instituicaoId: id, modalidade, turno: texto(60).default("Não informado"),
  mensalidade: moeda.nullable().optional(), notaCorte: z.number().min(0).max(1000).nullable().optional(),
  anoNotaCorte: z.number().int().min(2000).max(2100).nullable().optional(),
  fonteNotaCorte: z.string().url().max(500).nullable().optional(),
  bolsas: z.boolean().default(false), ativo: z.boolean().default(true)
}).strict();
const trilhaFields = z.object({
  cargoId: id, cursoId: id, rota: texto(100).default("principal"),
  etapa: texto(200), ordem: z.number().int().min(1).max(100),
  descricao: texto(2000).nullable().optional(),
  duracaoMeses: z.number().int().min(1).max(600).nullable().optional()
}).strict();
const perguntaFields = z.object({
  pergunta: texto(1000), categoria: texto(100), ordem: z.number().int().min(1).max(10000),
  opcoes: opcoesSchema, ativo: z.boolean().default(true)
}).strict();

function conferirSalarios(piso: number, media: number, teto: number) {
  if (piso > media || media > teto) throw new ApiError(400, "Faixa salarial deve respeitar piso <= media <= teto.");
}
function conferirMensalidade(min: number | null | undefined, max: number | null | undefined) {
  if (min != null && max != null && min > max) throw new ApiError(400, "Mensalidade minima supera a maxima.");
}

adminRoutes.get("/resumo", async (_req, res) => {
  const [usuarios, cargos, cursos, instituicoes, ofertas, quizRealizados, avaliacoesPendentes, denunciasPendentes] = await Promise.all([
    prisma.usuario.count(), prisma.cargo.count(), prisma.curso.count(), prisma.instituicao.count(),
    prisma.cursoInstituicao.count(), prisma.historicoTesteVocacional.count(),
    prisma.avaliacao.count({ where: { status: "PENDENTE" } }),
    prisma.denunciaAvaliacao.count({ where: { status: "PENDENTE" } })
  ]);
  res.json({ usuarios, cargos, cursos, instituicoes, ofertas, quizRealizados, avaliacoesPendentes, denunciasPendentes });
});

// Consultas de manutencao incluem tambem registros inativos.
adminRoutes.get("/cargos", async (req, res) => { const { skip, take } = pagina(req); res.json(await prisma.cargo.findMany({ skip, take, orderBy: { nome: "asc" } })); });
adminRoutes.get("/cursos", async (req, res) => { const { skip, take } = pagina(req); res.json(await prisma.curso.findMany({ skip, take, orderBy: { nome: "asc" } })); });
adminRoutes.get("/instituicoes", async (req, res) => { const { skip, take } = pagina(req); res.json(await prisma.instituicao.findMany({ skip, take, orderBy: { nome: "asc" } })); });
adminRoutes.get("/ofertas", async (req, res) => { const { skip, take } = pagina(req); res.json(await prisma.cursoInstituicao.findMany({ skip, take, include: { curso: { select: { id: true, nome: true } }, instituicao: { select: { id: true, nome: true } } } })); });
adminRoutes.get("/trilhas", async (req, res) => { const { skip, take } = pagina(req); res.json(await prisma.trilhaCargoCurso.findMany({ skip, take, orderBy: [{ cargoId: "asc" }, { rota: "asc" }, { ordem: "asc" }] })); });
adminRoutes.get("/perguntas", async (req, res) => { const { skip, take } = pagina(req); res.json(await prisma.perguntaVocacional.findMany({ skip, take, orderBy: { ordem: "asc" } })); });

adminRoutes.post("/cargos", async (req, res) => {
  const data = cargoFields.parse(req.body);
  conferirSalarios(data.salarioPiso, data.salarioMedio, data.salarioTeto);
  res.status(201).json(await prisma.cargo.create({ data }));
});
adminRoutes.patch("/cargos/:id", async (req, res) => {
  const cargoId = paramId(req);
  const input = cargoFields.partial().strict().parse(req.body);
  const current = await prisma.cargo.findUnique({ where: { id: cargoId } });
  if (!current) throw new ApiError(404, "Cargo nao encontrado.");
  conferirSalarios(Number(input.salarioPiso ?? current.salarioPiso), Number(input.salarioMedio ?? current.salarioMedio), Number(input.salarioTeto ?? current.salarioTeto));
  res.json(await prisma.cargo.update({ where: { id: cargoId }, data: input }));
});

adminRoutes.post("/cursos", async (req, res) => res.status(201).json(await prisma.curso.create({ data: cursoFields.parse(req.body) })));
adminRoutes.patch("/cursos/:id", async (req, res) => res.json(await prisma.curso.update({ where: { id: paramId(req) }, data: cursoFields.partial().strict().parse(req.body) })));

adminRoutes.post("/instituicoes", async (req, res) => {
  const data = instituicaoFields.parse(req.body);
  conferirMensalidade(data.mensalidadeMin, data.mensalidadeMax);
  res.status(201).json(await prisma.instituicao.create({ data }));
});
adminRoutes.patch("/instituicoes/:id", async (req, res) => {
  const instituicaoId = paramId(req);
  const input = instituicaoFields.partial().strict().parse(req.body);
  const current = await prisma.instituicao.findUnique({ where: { id: instituicaoId } });
  if (!current) throw new ApiError(404, "Instituicao nao encontrada.");
  conferirMensalidade(input.mensalidadeMin === undefined ? (current.mensalidadeMin === null ? null : Number(current.mensalidadeMin)) : input.mensalidadeMin,
    input.mensalidadeMax === undefined ? (current.mensalidadeMax === null ? null : Number(current.mensalidadeMax)) : input.mensalidadeMax);
  res.json(await prisma.instituicao.update({ where: { id: instituicaoId }, data: input }));
});

adminRoutes.post("/ofertas", async (req, res) => {
  const data = ofertaFields.parse(req.body);
  const [curso, instituicao] = await Promise.all([
    prisma.curso.findUnique({ where: { id: data.cursoId }, select: { id: true } }),
    prisma.instituicao.findUnique({ where: { id: data.instituicaoId }, select: { id: true } })
  ]);
  if (!curso || !instituicao) throw new ApiError(404, "Curso/instituicao inexistente.");
  const existente = await prisma.cursoInstituicao.findFirst({ where: { cursoId: data.cursoId, instituicaoId: data.instituicaoId, modalidade: data.modalidade, turno: data.turno ?? null } });
  if (existente) throw new ApiError(409, "Oferta ja cadastrada.");
  res.status(201).json(await prisma.cursoInstituicao.create({ data }));
});
adminRoutes.patch("/ofertas/:id", async (req, res) => {
  const idOferta = paramId(req);
  const input = ofertaFields.partial().strict().parse(req.body);
  const atual = await prisma.cursoInstituicao.findUnique({ where: { id: idOferta } });
  if (!atual) throw new ApiError(404, "Oferta nao encontrada.");
  const changed = ["mensalidade", "notaCorte", "anoNotaCorte", "fonteNotaCorte", "bolsas", "ativo"].some((field) => {
    const valorNovo = (input as Record<string, unknown>)[field];
    return valorNovo !== undefined && String(valorNovo) !== String((atual as unknown as Record<string, unknown>)[field]);
  });
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.cursoInstituicao.update({ where: { id: idOferta }, data: input });
    if (changed) await avisarMudancaOferta(tx, updated);
    return updated;
  });
  res.json(result);
});

adminRoutes.post("/trilhas", async (req, res) => {
  const data = trilhaFields.parse(req.body);
  const [cargo, curso] = await Promise.all([
    prisma.cargo.findUnique({ where: { id: data.cargoId }, select: { id: true } }),
    prisma.curso.findUnique({ where: { id: data.cursoId }, select: { id: true } })
  ]);
  if (!cargo || !curso) throw new ApiError(404, "Cargo/curso inexistente.");
  res.status(201).json(await prisma.trilhaCargoCurso.create({ data }));
});
adminRoutes.patch("/trilhas/:id", async (req, res) => res.json(await prisma.trilhaCargoCurso.update({ where: { id: paramId(req) }, data: trilhaFields.partial().strict().parse(req.body) })));
adminRoutes.delete("/trilhas/:id", async (req, res) => {
  await prisma.trilhaCargoCurso.delete({ where: { id: paramId(req) } });
  res.status(204).end();
});

adminRoutes.post("/perguntas", async (req, res) => res.status(201).json(await prisma.perguntaVocacional.create({ data: perguntaFields.parse(req.body) })));
adminRoutes.patch("/perguntas/:id", async (req, res) => res.json(await prisma.perguntaVocacional.update({ where: { id: paramId(req) }, data: perguntaFields.partial().strict().parse(req.body) })));

adminRoutes.get("/avaliacoes", async (req, res) => {
  const status = z.enum(["PENDENTE", "APROVADA", "REJEITADA"]).default("PENDENTE").parse(req.query.status);
  const { skip, take } = pagina(req);
  res.json(await prisma.avaliacao.findMany({ where: { status }, orderBy: { criadoEm: "desc" }, skip, take, include: { instituicao: { select: { id: true, nome: true } } } }));
});
adminRoutes.patch("/avaliacoes/:id/moderacao", async (req, res) => {
  const { status } = z.object({ status: z.enum(["APROVADA", "REJEITADA", "PENDENTE"]) }).strict().parse(req.body);
  res.json(await prisma.avaliacao.update({ where: { id: paramId(req) }, data: { status } }));
});

adminRoutes.get("/denuncias", async (req, res) => {
  const status = z.enum(["PENDENTE", "RESOLVIDA", "DESCARTADA"]).default("PENDENTE").parse(req.query.status);
  const { skip, take } = pagina(req);
  res.json(await prisma.denunciaAvaliacao.findMany({ where: { status }, skip, take, orderBy: { criadoEm: "desc" }, include: { avaliacao: { select: { id: true, nota: true, comentario: true, status: true } } } }));
});
adminRoutes.patch("/denuncias/:id", async (req, res) => {
  const { status } = z.object({ status: z.enum(["PENDENTE", "RESOLVIDA", "DESCARTADA"]) }).strict().parse(req.body);
  res.json(await prisma.denunciaAvaliacao.update({ where: { id: paramId(req) }, data: { status, resolvidoEm: status === "PENDENTE" ? null : new Date() } }));
});
