import { z } from "zod";

export const idSchema = z
  .union([
    z.string().regex(/^[1-9]\d*$/, "Use um ID inteiro positivo"),
    z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  ])
  .transform((v) => BigInt(v))
  .refine((v) => v <= 9223372036854775807n, "ID fora do limite BIGINT");
export const texto = (max = 200) => z.string().trim().min(1).max(max);
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("E-mail inválido")
  .max(255);
export const senhaSchema = z
  .string()
  .min(8, "Use pelo menos 8 caracteres")
  .refine(
    (v) => Buffer.byteLength(v, "utf8") <= 72,
    "Senha excede 72 bytes (limite do bcrypt)",
  );
export const urlSchema = z
  .string()
  .url()
  .max(2048)
  .refine((v) => /^https?:\/\//i.test(v), "Use URL http ou https");
export const valorSchema = z
  .number()
  .finite()
  .min(0)
  .max(99999999.99)
  .refine(
    (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001,
    "Use no máximo 2 casas decimais",
  );
export const notaSchema = z
  .number()
  .finite()
  .min(0)
  .max(1000)
  .refine(
    (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001,
    "Use no máximo 2 casas decimais",
  );
export const estadoSchema = z.enum([
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]);
export const modalidadeSchema = z.enum(["PRESENCIAL", "EAD", "HIBRIDO"]);
export const dataSchema = z
  .string()
  .datetime({ offset: true })
  .transform((v) => new Date(v));
export const paginacaoSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export function exigirAlteracao(v: object, ctx: z.RefinementCtx) {
  if (!Object.values(v).some((x) => x !== undefined))
    ctx.addIssue({
      code: "custom",
      message: "Informe ao menos um campo para alterar",
    });
}
export const enderecoShape = {
  rua: texto(200).nullable().optional(),
  cidade: texto(100).nullable().optional(),
  estado: estadoSchema.nullable().optional(),
  bairro: texto(100).nullable().optional(),
  latitude: z.number().finite().min(-90).max(90).nullable().optional(),
  longitude: z.number().finite().min(-180).max(180).nullable().optional(),
};
export function validarCoordenadas(
  v: { latitude?: number | null; longitude?: number | null },
  ctx: z.RefinementCtx,
) {
  if (
    (v.latitude !== undefined || v.longitude !== undefined) &&
    (v.latitude === undefined ||
      v.longitude === undefined ||
      (v.latitude == null) !== (v.longitude == null))
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["longitude"],
      message: "Informe latitude e longitude juntas ou as duas como null",
    });
  }
}
export const buscaCatalogoSchema = paginacaoSchema
  .extend({
    busca: texto(200).optional(),
    area: texto(150).optional(),
    modalidade: modalidadeSchema.optional(),
    cidade: texto(100).optional(),
    estado: estadoSchema.optional(),
    latitude: z.coerce.number().finite().min(-90).max(90).optional(),
    longitude: z.coerce.number().finite().min(-180).max(180).optional(),
    raio_km: z.coerce.number().positive().max(20000).optional(),
    ordenar: z
      .enum(["nome", "distancia", "mensalidade", "nota_corte", "afinidade"])
      .default("distancia"),
    preco_max: z.coerce.number().min(0).optional(),
    id_cargo: idSchema.optional(),
    id_curso: idSchema.optional(),
    id_instituicao: idSchema.optional(),
    incluir_inativos: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
  })
  .superRefine(validarCoordenadas);
export type BuscaCatalogo = z.infer<typeof buscaCatalogoSchema>;
