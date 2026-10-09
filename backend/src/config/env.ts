import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1, "Defina DATABASE_URL no .env"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET deve ter pelo menos 32 caracteres"),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, "Exemplo: 15m")
    .default("15m"),
  REFRESH_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://localhost:3000"),
  EMAIL_MODE: z.enum(["console", "smtp"]).default("console"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().default("LUME <nao-responda@lume.local>"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  TERMS_VERSION: z.string().default("2026-10-09"),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(
    parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n"),
  );
}
export const env = parsed.data;
if (env.NODE_ENV === "production" && env.EMAIL_MODE !== "smtp") {
  throw new Error(
    "Em produção, configure EMAIL_MODE=smtp para recuperação de senha.",
  );
}
if (env.EMAIL_MODE === "smtp" && !env.SMTP_HOST)
  throw new Error("Configure SMTP_HOST.");
