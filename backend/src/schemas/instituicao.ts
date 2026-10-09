import { z } from "zod";
import { validarCnpj } from "../utils/cnpj";
import {
  texto,
  emailSchema,
  urlSchema,
  enderecoShape,
  validarCoordenadas,
  valorSchema,
  notaSchema,
  idSchema,
  exigirAlteracao,
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
const oferta = z
  .object({
    id_curso: idSchema,
    mensalidade: valorSchema,
    mensalidade_max: valorSchema.nullable().optional(),
    formas_ingresso: texto(2000),
    nota_corte: notaSchema.nullable().optional(),
    ano_nota_corte: z.number().int().min(2000).max(2100).nullable().optional(),
    programa_nota_corte: z
      .enum(["SISU", "PROUNI", "ENEM", "VESTIBULAR"])
      .nullable()
      .optional(),
    id_fonte_nota: idSchema.nullable().optional(),
    bolsas: texto(4000).nullable().optional(),
    prouni: z.boolean().optional(),
    fies: z.boolean().optional(),
    polo_nome: texto(200).nullable().optional(),
    polo_rua: texto(200).nullable().optional(),
    polo_cidade: texto(100).nullable().optional(),
    polo_estado: estadoSchema.nullable().optional(),
    polo_bairro: texto(100).nullable().optional(),
    polo_latitude: z.number().min(-90).max(90).nullable().optional(),
    polo_longitude: z.number().min(-180).max(180).nullable().optional(),
    status: z.boolean().optional(),
  })
  .strict();
export const vincularCursoSchema = oferta;
export const vincularCursoJsonSchema = oferta.extend({
  id_instituicao: idSchema,
});
export const editarOfertaSchema = oferta
  .omit({ id_curso: true })
  .partial()
  .superRefine(exigirAlteracao);
export type CriarInstituicaoInput = z.infer<typeof criarInstituicaoSchema>;
export type VincularCursoInput = z.infer<typeof oferta>;
