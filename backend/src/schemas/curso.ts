import { z } from "zod";
import {
  texto,
  modalidadeSchema,
  buscaCatalogoSchema,
  exigirAlteracao,
} from "./comum";
export const MODALIDADES = ["PRESENCIAL", "EAD", "HIBRIDO"] as const;
const base = z
  .object({
    nome_curso: texto(200),
    grau_academico: texto(80),
    modalidade: modalidadeSchema,
    carga_horaria: z.number().int().positive().max(50000),
    area_curso: texto(150),
    duracao_meses: z.number().int().min(1).max(240),
    descricao: texto(10000).nullable().optional(),
    grade_curricular: texto(20000).nullable().optional(),
    status: z.boolean().optional(),
  })
  .strict();
export const criarCursoSchema = base;
export const editarCursoSchema = base.partial().superRefine(exigirAlteracao);
export const listarCursosSchema = buscaCatalogoSchema;
export type CriarCursoInput = z.infer<typeof base>;
export type ListarCursosInput = z.infer<typeof buscaCatalogoSchema>;
