import { Router } from "express";
import { prisma } from "../config/prisma";
import { requireUser } from "../middlewares/auth";
import { ApiError } from "../middlewares/errors";
import { paramId } from "../utils/validation";

export const favoritosRoutes = Router();
favoritosRoutes.use(requireUser);

favoritosRoutes.get("/", async (req, res) => {
  const usuarioId = req.principal!.id;
  const [cargos, cursos, instituicoes] = await Promise.all([
    prisma.favoritoCargo.findMany({ where: { usuarioId, cargo: { ativo: true } }, include: { cargo: true }, orderBy: { criadoEm: "desc" } }),
    prisma.favoritoCurso.findMany({ where: { usuarioId, curso: { ativo: true } }, include: { curso: true }, orderBy: { criadoEm: "desc" } }),
    prisma.favoritoInstituicao.findMany({ where: { usuarioId, instituicao: { ativo: true } }, include: { instituicao: true }, orderBy: { criadoEm: "desc" } }),
  ]);
  res.json({ cargos, cursos, instituicoes });
});

favoritosRoutes.put("/:tipo/:id", async (req, res) => {
  const id = paramId(req);
  const usuarioId = req.principal!.id;
  switch (req.params.tipo) {
    case "cargos":
      if (!(await prisma.cargo.findFirst({ where: { id, ativo: true, trilhas: { some: { curso: { ativo: true } } } } }))) throw new ApiError(404, "Cargo indisponivel.");
      await prisma.favoritoCargo.upsert({ where: { usuarioId_cargoId: { usuarioId, cargoId: id } }, update: {}, create: { usuarioId, cargoId: id } });
      break;
    case "cursos":
      if (!(await prisma.curso.findFirst({ where: { id, ativo: true } }))) throw new ApiError(404, "Curso indisponivel.");
      await prisma.favoritoCurso.upsert({ where: { usuarioId_cursoId: { usuarioId, cursoId: id } }, update: {}, create: { usuarioId, cursoId: id } });
      break;
    case "instituicoes":
      if (!(await prisma.instituicao.findFirst({ where: { id, ativo: true } }))) throw new ApiError(404, "Instituicao indisponivel.");
      await prisma.favoritoInstituicao.upsert({ where: { usuarioId_instituicaoId: { usuarioId, instituicaoId: id } }, update: {}, create: { usuarioId, instituicaoId: id } });
      break;
    default: throw new ApiError(400, "Tipo de favorito invalido.");
  }
  res.status(204).end();
});

favoritosRoutes.delete("/:tipo/:id", async (req, res) => {
  const id = paramId(req);
  const usuarioId = req.principal!.id;
  switch (req.params.tipo) {
    case "cargos": await prisma.favoritoCargo.deleteMany({ where: { usuarioId, cargoId: id } }); break;
    case "cursos": await prisma.favoritoCurso.deleteMany({ where: { usuarioId, cursoId: id } }); break;
    case "instituicoes": await prisma.favoritoInstituicao.deleteMany({ where: { usuarioId, instituicaoId: id } }); break;
    default: throw new ApiError(400, "Tipo de favorito invalido.");
  }
  res.status(204).end();
});
