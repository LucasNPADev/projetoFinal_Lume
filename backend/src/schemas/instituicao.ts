import { z } from "zod";
import { validarCnpj } from "../utils/cnpj";
import {
  texto,
  emailSchema,
  urlSchema,
  enderecoShape,
  validarCoordenadas,
  idSchema,
  exigirAlteracao,
  paginacaoSchema,
  estadoSchema,
} from "./comum";
const base = z
  .object({
    nome_instituicao: texto(200),
    cnpj: z
      .string()
      .regex(/^[\d.\/-]+$/)
      .transform((v) => v.replace(/\D/g, ""))
      .refine(validarCnpj, "CNPJ inválido"),
    nota_mec: z
      .number()
      .min(1)
      .max(5)
      .refine((v) => Number.isInteger(v * 10), "Use no máximo 1 casa decimal")
      .nullable()
      .optional(),
    status: z.boolean().optional(),
    regular_mec: z.boolean().optional(),
    natureza: z.enum(["PUBLICA", "PRIVADA"]).optional(),
    telefone: texto(20).nullable().optional(),
    celular: texto(20).nullable().optional(),
    email: emailSchema.nullable().optional(),
    site: urlSchema.nullable().optional(),
    ...enderecoShape,
  })
  .strict();
export const criarInstituicaoSchema = base.superRefine(validarCoordenadas);
export const editarInstituicaoSchema = base
  .partial()
  .superRefine(exigirAlteracao)
  .superRefine(validarCoordenadas);
export const listarInstituicoesSchema = paginacaoSchema
  .extend({
    busca: texto(200).optional(),
    cidade: texto(100).optional(),
    estado: estadoSchema.optional(),
    latitude: z.coerce.number().finite().min(-90).max(90).optional(),
    longitude: z.coerce.number().finite().min(-180).max(180).optional(),
    raio_km: z.coerce.number().positive().max(20000).optional(),
    ordenar: z.enum(["nome", "distancia"]).default("distancia"),
    id_instituicao: idSchema.optional(),
    incluir_inativos: z.enum(["true", "false"]).default("false")
      .transform((v) => v === "true"),
  })
  .strict()
  .superRefine(validarCoordenadas);
export type CriarInstituicaoInput = z.infer<typeof criarInstituicaoSchema>;
export type ListarInstituicoesInput = z.infer<typeof listarInstituicoesSchema>;
