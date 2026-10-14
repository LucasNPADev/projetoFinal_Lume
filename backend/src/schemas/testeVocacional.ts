import { z } from "zod";
 
export const responderTesteSchema = z.object({
  respostas: z
    .array(
      z.object({
        id_pergunta: z.coerce.number().int().positive(),
        // Escala de 1 (discordo totalmente) a 5 (concordo totalmente).
        valor: z.coerce.number().int().min(1).max(5),
      }),
    )
    .min(1, "Envie ao menos uma resposta")
    .refine(
      (r) => new Set(r.map((x) => x.id_pergunta)).size === r.length,
      "Há perguntas respondidas mais de uma vez",
    ),
});
 
export const historicoTesteSchema = z.object({
  limite: z.coerce.number().int().min(1).max(100).default(20),
});
 
export type ResponderTesteInput = z.infer<typeof responderTesteSchema>;
export type HistoricoTesteInput = z.infer<typeof historicoTesteSchema>;
 