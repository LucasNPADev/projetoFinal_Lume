import { z } from "zod";
import {
  texto,
  idSchema,
  urlSchema,
  dataSchema,
  exigirAlteracao,
  notaSchema,
  buscaCatalogoSchema,
} from "./comum";
export const favoritoSchema = z
  .object({
    tipo: z.enum(["CARGO", "CURSO", "INSTITUICAO", "ROTA"]),
    id: idSchema,
  })
  .strict();
const avaliacao = z
  .object({
    id_instituicao: idSchema,
    id_curso: idSchema.optional(),
    nota: z.number().int().min(1).max(5),
    comentario: texto(4000),
  })
  .strict();
export const avaliacaoSchema = avaliacao;
export const editarAvaliacaoSchema = avaliacao
  .pick({ nota: true, comentario: true })
  .partial()
  .superRefine(exigirAlteracao);
export const denunciaSchema = z.object({ motivo: texto(2000) }).strict();
export const moderacaoSchema = z
  .object({ status: z.enum(["PUBLICADA", "OCULTA"]), motivo: texto(2000) })
  .strict();
export const resolverDenunciaSchema = z
  .object({ status: z.enum(["RESOLVIDA", "REJEITADA"]), resposta: texto(2000) })
  .strict();
const pergunta = z
  .object({
    enunciado: texto(3000),
    area_afinidade: texto(150),
    status: z.boolean().optional(),
  })
  .strict();
export const perguntaSchema = pergunta;
export const editarPerguntaSchema = pergunta
  .partial()
  .superRefine(exigirAlteracao);
export const respostasSchema = z
  .object({
    respostas: z
      .array(
        z
          .object({
            id_pergunta: idSchema,
            valor: z.number().int().min(1).max(5),
          })
          .strict(),
      )
      .min(1)
      .max(200),
  })
  .strict();
const evento = z
  .object({
    id_instituicao: idSchema.nullable().optional(),
    titulo: texto(200),
    tipo: z.enum(["VESTIBULAR", "ENEM", "SISU", "PROUNI", "BOLSA", "OUTRO"]),
    inicio: dataSchema,
    fim: dataSchema.nullable().optional(),
    descricao: texto(6000).nullable().optional(),
    url: urlSchema,
    status: z.boolean().optional(),
  })
  .strict();
export const eventoSchema = evento;
export const editarEventoSchema = evento.partial().superRefine(exigirAlteracao);
export const calendarioSchema = z
  .object({
    inicio: dataSchema.optional(),
    fim: dataSchema.optional(),
    favoritos: z
      .enum(["true", "false"])
      .default("true")
      .transform((v) => v === "true"),
  })
  .strict();
export const compararSchema = z
  .object({
    tipo: z.enum(["CURSO", "INSTITUICAO", "OFERTA"]),
    ids: z.array(idSchema).min(2).max(4),
  })
  .strict()
  .refine(
    (v) => new Set(v.ids.map(String)).size === v.ids.length,
    "Não repita IDs",
  );
export const simularSchema = z
  .object({
    nota: notaSchema,
    programa: z.enum(["SISU", "PROUNI", "ENEM", "VESTIBULAR"]).optional(),
    cidade: texto(100).optional(),
    estado: z
      .enum([
        "SP",
        "RJ",
        "MG",
        "PR",
        "SC",
        "RS",
        "ES",
        "BA",
        "PE",
        "CE",
        "DF",
        "GO",
        "MT",
        "MS",
        "AM",
        "AC",
        "AL",
        "AP",
        "MA",
        "PA",
        "PB",
        "PI",
        "RN",
        "RO",
        "RR",
        "SE",
        "TO",
      ])
      .optional(),
  })
  .strict();
export const listarAvaliacoesSchema = z.object({
  id_instituicao: idSchema.optional(),
  id_curso: idSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  todas: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});
