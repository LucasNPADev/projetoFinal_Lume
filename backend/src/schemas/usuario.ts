import { z } from "zod";
import {
  emailSchema,
  senhaSchema,
  enderecoShape,
  validarCoordenadas,
  exigirAlteracao,
} from "./comum";

const localizacaoShape = {
  ...enderecoShape,
  origem_localizacao: z.enum(["MANUAL", "GPS"]).optional(),
  consentimento_gps: z.boolean().optional(),
};
function localizacao(v: z.infer<typeof localizacaoBase>, ctx: z.RefinementCtx) {
  validarCoordenadas(v, ctx);
  if (v.origem_localizacao === "GPS" && v.consentimento_gps !== true)
    ctx.addIssue({
      code: "custom",
      path: ["consentimento_gps"],
      message: "GPS exige autorização explícita",
    });
  if (
    v.origem_localizacao === "GPS" &&
    (v.latitude == null || v.longitude == null)
  )
    ctx.addIssue({
      code: "custom",
      path: ["latitude"],
      message: "Envie as coordenadas autorizadas",
    });
}
const localizacaoBase = z.object(localizacaoShape).strict();
export const localizacaoSchema = localizacaoBase
  .superRefine(exigirAlteracao)
  .superRefine(localizacao);
export const cadastroSchema = z
  .object({
    nome: z.string().trim().min(2).max(150),
    email: emailSchema,
    senha: senhaSchema,
    aceitou_termos: z.literal(true, {
      errorMap: () => ({ message: "É necessário aceitar os termos" }),
    }),
    ...localizacaoShape,
  })
  .strict()
  .superRefine(localizacao);
export const loginSchema = z
  .object({ email: emailSchema, senha: z.string().min(1).max(256) })
  .strict();
export const editarPerfilSchema = z
  .object({
    nome: z.string().trim().min(2).max(150).optional(),
    email: emailSchema.optional(),
  })
  .strict()
  .superRefine(exigirAlteracao);
export const alterarSenhaSchema = z
  .object({ senha_atual: z.string().min(1).max(256), nova_senha: senhaSchema })
  .strict();
export const excluirContaSchema = z
  .object({
    senha: z.string().min(1).max(256),
    confirmacao: z.literal("EXCLUIR"),
  })
  .strict();
export const recuperacaoSchema = z.object({ email: emailSchema }).strict();
export const redefinirSchema = z
  .object({
    token: z.string().regex(/^[a-f0-9]{64}$/),
    nova_senha: senhaSchema,
  })
  .strict();
export const refreshSchema = z
  .object({ refresh_token: z.string().regex(/^[a-f0-9]{64}$/) })
  .strict();
export type CadastroInput = z.infer<typeof cadastroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
