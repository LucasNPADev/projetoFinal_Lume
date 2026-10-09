import { idSchema } from "../schemas/comum";
export function parseId(raw: unknown, _nome = "id"): bigint {
  return idSchema.parse(raw);
}
