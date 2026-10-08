import "dotenv/config";

export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32 || secret.includes("SUBSTITUA") || secret.includes("defina-uma-chave") || secret.includes("lume-local-secret")) {
    throw new Error("JWT_SECRET precisa ser aleatorio e ter no minimo 32 bytes; configure backend/.env.");
  }
  return secret;
}

export function port(): number {
  const parsed = Number(process.env.PORT ?? "3333");
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) throw new Error("PORT invalida");
  return parsed;
}
