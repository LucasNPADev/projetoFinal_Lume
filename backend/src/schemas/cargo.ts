import { z } from "zod";
import {
  texto,
  idSchema,
  valorSchema,
  exigirAlteracao,
  urlSchema,
  dataSchema,
  paginacaoSchema,
} from "./comum";
const etapa = z
  .object({
    id_curso: idSchema,
    ordem_etapa: z.number().int().positive().max(100),
    descricao: texto(4000).optional(),
  })
  .strict();
export const rotaSchema = z
  .object({
    nome: texto(200),
    descricao: texto(10000).optional(),
    status: z.boolean().optional(),
    etapas: z.array(etapa).min(1).max(30),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (new Set(v.etapas.map((e) => e.ordem_etapa)).size !== v.etapas.length)
      ctx.addIssue({
        code: "custom",
        path: ["etapas"],
        message: "Ordem de etapa repetida",
      });
    if (
      new Set(v.etapas.map((e) => e.id_curso.toString())).size !==
      v.etapas.length
    )
      ctx.addIssue({
        code: "custom",
        path: ["etapas"],
        message: "Curso repetido na mesma rota",
      });
  });
const base = z
  .object({
    nome: texto(150),
    area_atuacao: texto(150),
    descricao: texto(20000),
    hard_skills: texto(10000),
    soft_skills: texto(10000),
    panorama_mercado: texto(10000),
    salario_piso: valorSchema,
    salario_media: valorSchema,
    salario_teto: valorSchema,
    id_fonte: idSchema,
    status: z.boolean().optional(),
  })
  .strict();
export const criarCargoSchema = base.extend({
  rotas: z.array(rotaSchema).min(1).max(10),
});
export const editarCargoSchema = base.partial().superRefine(exigirAlteracao);
export const fonteSchema = z
  .object({
    nome: texto(200),
    orgao: texto(150),
    url: urlSchema,
    consultado_em: dataSchema,
    demonstracao: z.boolean().optional(),
  })
  .strict();
export const listarCargosSchema = paginacaoSchema
  .extend({
    busca: texto(200).optional(),
    area: texto(150).optional(),
    salario_min: z.coerce.number().min(0).optional(),
    salario_max: z.coerce.number().min(0).optional(),
    ordenar: z.enum(["afinidade", "nome", "salario"]).default("afinidade"),
    incluir_inativos: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
  })
  .strict()
  .refine(
    (v) =>
      v.salario_min === undefined ||
      v.salario_max === undefined ||
      v.salario_min <= v.salario_max,
    "Use salario_min <= salario_max",
  );
export type ListarCargosInput = z.infer<typeof listarCargosSchema>;
export type CargoInput = z.infer<typeof criarCargoSchema>;
export type RotaInput = z.infer<typeof rotaSchema>;
