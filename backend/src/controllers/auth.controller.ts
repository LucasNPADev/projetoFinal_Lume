import { Request, Response } from "express";
import { autenticarUsuario, registrarUsuario } from "../services/auth.service";

export async function registrar(req: Request, res: Response) {
  const {
    nome,
    nomeCompleto,
    email,
    senha,
    endereco,
    rua,
    cidade,
    bairro,
    estado,
  } = req.body ?? {};

  const nomeFinal = String(nome ?? nomeCompleto ?? "").trim();
  if (!nomeFinal || !email || !senha) {
    return res.status(400).json({ message: "nome, email e senha são obrigatórios." });
  }

  if (String(senha).length < 6) {
    return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres." });
  }

  try {
    return res.status(201).json(
      await registrarUsuario({
        nome: nomeFinal,
        email,
        senha,
        endereco,
        rua,
        cidade,
        bairro,
        estado,
      }),
    );
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_EM_USO") {
      return res.status(409).json({ message: "E-mail já cadastrado." });
    }
    throw error;
  }
}

export async function login(req: Request, res: Response) {
  const { email, senha } = req.body ?? {};
  if (!email || !senha) {
    return res.status(400).json({ message: "email e senha são obrigatórios." });
  }

  try {
    return res.json(await autenticarUsuario(String(email), String(senha)));
  } catch (error) {
    if (error instanceof Error && error.message === "CREDENCIAIS_INVALIDAS") {
      return res.status(401).json({ message: "E-mail ou senha inválidos." });
    }
    throw error;
  }
}
