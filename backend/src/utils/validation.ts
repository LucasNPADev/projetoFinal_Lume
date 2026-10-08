import { Request } from "express";
import { z } from "zod";
import { ApiError } from "../middlewares/errors";

export const id = z.number().int().positive().safe();
export const texto = (max = 255) => z.string().trim().min(1).max(max);
export const moeda = z.number().finite().min(0).max(999999999);
export const uf = z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "UF invalida");
export const email = z.string().trim().toLowerCase().email().max(254);
export const senha = z.string().min(12).max(72).refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Senha acima de 72 bytes.");
export const modalidade = z.enum(["PRESENCIAL", "EAD", "HIBRIDO"]);
export const tipoInstituicao = z.enum(["PUBLICA", "PRIVADA"]);
export const paginacao = z.object({
  pagina: z.coerce.number().int().min(1).max(10000).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
}).passthrough();

export function paramId(req: Request, name = "id"): number {
  const raw = req.params[name];
  if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw)) throw new ApiError(400, "Identificador invalido.");
  return id.parse(Number(raw));
}

export function pagina(req: Request) {
  const parsed = paginacao.parse(req.query);
  return { skip: (parsed.pagina - 1) * parsed.limite, take: parsed.limite, pagina: parsed.pagina, limite: parsed.limite };
}
