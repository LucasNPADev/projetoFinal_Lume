import { z } from "zod";
import {
  estadoSchema,
  idSchema,
  notaSchema,
  texto,
  valorSchema,
} from "./comum";

export const criarOfertaSchema = z
  .object({
    id_instituicao: idSchema,
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
  .strict()
  .superRefine((offer, context) => {
    if (
      offer.mensalidade_max != null &&
      offer.mensalidade_max < offer.mensalidade
    )
      context.addIssue({
        code: "custom",
        path: ["mensalidade_max"],
        message: "Mensalidade máxima não pode ser menor que a mínima",
      });

    const scoreFields = [
      offer.nota_corte,
      offer.ano_nota_corte,
      offer.programa_nota_corte,
      offer.id_fonte_nota,
    ];
    if (scoreFields.some((value) => value != null) && !scoreFields.every((value) => value != null))
      context.addIssue({
        code: "custom",
        path: ["nota_corte"],
        message: "Preencha nota, ano, programa e fonte da nota juntos",
      });

    if ((offer.polo_latitude == null) !== (offer.polo_longitude == null))
      context.addIssue({
        code: "custom",
        path: ["polo_longitude"],
        message: "Informe latitude e longitude do polo juntas",
      });
  });

export type CriarOfertaInput = z.infer<typeof criarOfertaSchema>;
