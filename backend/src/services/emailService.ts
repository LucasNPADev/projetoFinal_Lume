import nodemailer from "nodemailer";
import { env } from "../config/env";
export async function enviarRecuperacao(email: string, token: string) {
  if (env.EMAIL_MODE === "console") return;
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    ...(env.SMTP_USER && {
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    }),
  });
  const link = new URL("/redefinir-senha", env.FRONTEND_URL);
  link.searchParams.set("token", token);
  await transport.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject: "LUME: recuperação de senha",
    text: `Use este link em até 15 minutos para redefinir sua senha: ${link.toString()}\nSe você não solicitou, ignore esta mensagem.`,
  });
}
