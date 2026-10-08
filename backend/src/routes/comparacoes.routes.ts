import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { ApiError } from "../middlewares/errors";
import { catalogService } from "../services/catalog.service";
import { extrairLocalizacao, distanciaKm } from "../utils/geo";
import { paramId } from "../utils/validation";

export const comparacoesRoutes = Router();

comparacoesRoutes.get("/ofertas", async (req, res) => {
  const raw = z.string().max(120).parse(req.query.ids);
  const ids = raw.split(",").map((s) => Number(s.trim()));
  if (ids.length < 2 || ids.length > 6 || new Set(ids).size !== ids.length ||
      ids.some((v) => !Number.isSafeInteger(v) || v <= 0)) {
    throw new ApiError(400, "Informe de 2 a 6 IDs de ofertas diferentes em ?ids=1,2.");
  }
  const geo = extrairLocalizacao(req.query);
  const ofertas = await prisma.cursoInstituicao.findMany({
    where: { id: { in: ids }, ativo: true, instituicao: { ativo: true }, curso: { ativo: true } },
    include: {
      instituicao: { select: {
        id: true, nome: true, tipo: true, cidade: true, estado: true, latitude: true, longitude: true,
        site: true, dadosDemonstracao: true, fonteDados: true
      } },
      curso: { select: { id: true, nome: true, area: true, duracaoAnos: true } }
    }
  });
  if (ofertas.length !== ids.length) throw new ApiError(404, "Alguma oferta nao existe ou esta inativa.");
  const notas = await prisma.avaliacao.groupBy({
    by: ["instituicaoId"], where: { instituicaoId: { in: ofertas.map((o) => o.instituicaoId) }, status: "APROVADA" },
    _avg: { nota: true }, _count: { _all: true }
  });
  const notasPorInstituicao = new Map(notas.map((n) => [n.instituicaoId, { notaMedia: n._avg.nota, numeroAvaliacoes: n._count._all }]));
  res.json(ids.map((id) => {
    const item = ofertas.find((o) => o.id === id)!;
    return {
      ...item, avaliacao: notasPorInstituicao.get(item.instituicaoId) ?? { notaMedia: null, numeroAvaliacoes: 0 },
      distanciaKm: geo && item.instituicao.latitude !== null && item.instituicao.longitude !== null
        ? Number(distanciaKm(geo.latitude, geo.longitude, Number(item.instituicao.latitude), Number(item.instituicao.longitude)).toFixed(1)) : null
    };
  }));
});

comparacoesRoutes.get("/cargos/:id", async (req, res) => {
  const cargo = await catalogService.buscarCargo(paramId(req));
  if (!cargo) throw new ApiError(404, "Cargo inexistente ou inativo.");
  const rotas = Object.entries(cargo.rotas).map(([nome, etapas]) => ({
    nome,
    etapas: etapas.map((e) => ({
      id: e.id, etapa: e.etapa, ordem: e.ordem, descricao: e.descricao,
      curso: { id: e.curso.id, nome: e.curso.nome, duracaoAnos: e.curso.duracaoAnos },
      ofertas: e.curso.instituicoes.map((o) => ({
        id: o.id, instituicao: o.instituicao.nome, cidade: o.instituicao.cidade, tipo: o.instituicao.tipo,
        mensalidade: o.mensalidade, bolsas: o.bolsas, modalidade: o.modalidade, dadosDemonstracao: o.instituicao.dadosDemonstracao
      }))
    }))
  }));
  res.json({
    cargo: { id: cargo.id, nome: cargo.nome, area: cargo.area, salarioPiso: cargo.salarioPiso,
      salarioMedio: cargo.salarioMedio, salarioTeto: cargo.salarioTeto,
      fonteSalario: cargo.fonteSalario, referenciaSalario: cargo.referenciaSalario },
    rotas,
    aviso: "Compare salario e mensalidades de forma orientativa. Mensalidade nula nao significa gratuidade. Duracoes de etapas adicionais podem ser desconhecidas; valores sinteticos nao sao reais."
  });
});

comparacoesRoutes.get("/enem", async (req, res) => {
  const { nota } = z.object({ nota: z.coerce.number().finite().min(0).max(1000) }).passthrough().parse(req.query);
  const ofertas = await prisma.cursoInstituicao.findMany({
    where: { ativo: true, notaCorte: { not: null }, curso: { ativo: true }, instituicao: { ativo: true } },
    include: { curso: { select: { id: true, nome: true } }, instituicao: { select: { id: true, nome: true, cidade: true, dadosDemonstracao: true } } },
    take: 100
  });
  res.json({
    notaInformada: nota,
    ofertas: ofertas.map((o) => ({
      id: o.id, curso: o.curso, instituicao: o.instituicao,
      notaReferencia: o.notaCorte, dentroDaReferencia: nota >= Number(o.notaCorte)
    })),
    aviso: "Simulacao estritamente indicativa; nota de corte nao garante aprovacao. Verifique ano, modalidade, fonte e edital oficiais antes de decidir."
  });
});
