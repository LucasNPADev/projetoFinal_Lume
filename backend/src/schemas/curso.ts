import { z } from 'zod';

export const MODALIDADES = ['PRESENCIAL', 'EAD', 'HIBRIDO'] as const;

export const criarCursoSchema = z.object({
  nome_curso: z.string().trim().min(2).max(200),
  grau_academico: z.string().trim().min(2).max(80),
  modalidade: z.string().trim().toUpperCase().pipe(z.enum(MODALIDADES)),
  carga_horaria: z.number().int().positive(),
  area_curso: z.string().trim().min(2).max(150),
});

export const listarCursosSchema = z.object({
  busca: z.string().trim().min(1).optional(),
  area: z.string().trim().min(1).optional(),
  modalidade: z.string().trim().toUpperCase().pipe(z.enum(MODALIDADES)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CriarCursoInput = z.infer<typeof criarCursoSchema>;
export type ListarCursosInput = z.infer<typeof listarCursosSchema>;
