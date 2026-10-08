import nodemailer from "nodemailer";

export function smtpConfigurado() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM && process.env.WEB_RESET_URL);
}

export async function enviarEmailRecuperacao(destinatario: string, token: string) {
  if (!smtpConfigurado()) throw new Error("SMTP nao configurado");
  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.SMTP_PORT ?? 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SMTP_PORT invalida");
  const url = new URL(process.env.WEB_RESET_URL!);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("WEB_RESET_URL precisa usar HTTPS");
  url.searchParams.set("token", token);
  const auth = process.env.SMTP_USER && process.env.SMTP_PASSWORD
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined;
  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth, tls: { rejectUnauthorized: true } });
  await transporter.sendMail({
    from: process.env.SMTP_FROM!, to: destinatario,
    subject: "LUME - recuperacao de senha",
    text: "Solicitaram uma redefinicao da sua senha. Link valido por 30 minutos: " + url.toString() + ". Se nao foi voce, ignore esta mensagem."
  });
}
