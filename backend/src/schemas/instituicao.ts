import { z } from 'zod';
import { validarCnpj } from '../utils/cnpj';

export const criarInstituicaoSchema = z.object({
  nome_instituicao: z.string().trim().min(2).max(200),
  cnpj: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .pipe(z.string().length(14, 'CNPJ deve ter 14 dígitos'))
    .refine(validarCnpj, 'CNPJ inválido'),
  nota_mec: z.number().min(0).max(5).optional(),
  status: z.boolean().default(true),
  telefone: z.string().trim().max(20).optional(),
  celular: z.string().trim().max(20).optional(),
  email: z.string().trim().toLowerCase().email().max(255).optional(),
  rua: z.string().trim().max(200).optional(),
  cidade: z.string().trim().max(100).optional(),
  estado: z.string().trim().length(2, 'Use a sigla do estado (ex: SP)').toUpperCase().optional(),
  bairro: z.string().trim().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const vincularCursoSchema = z.object({
  id_curso: z
    .union([z.string().regex(/^\d+$/, 'id_curso inválido'), z.number().int().positive()])
    .transform((v) => BigInt(v)),
  mensalidade: z.number().min(0).optional(),
  formas_ingresso: z.string().trim().max(2000).optional(),
  nota_corte: z.number().min(0).optional(),
  status: z.boolean().default(true),
});

export type CriarInstituicaoInput = z.infer<typeof criarInstituicaoSchema>;
export type VincularCursoInput = z.infer<typeof vincularCursoSchema>;
