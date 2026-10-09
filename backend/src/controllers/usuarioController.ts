import { Request, Response } from "express";
import * as schema from "../schemas/usuario";
import { paginacaoSchema } from "../schemas/comum";
import * as service from "../services/usuarioService";
export async function cadastrar(req: Request, res: Response) {
  res
    .status(201)
    .json(
      await service.cadastrarUsuario(schema.cadastroSchema.parse(req.body)),
    );
}
export async function perfil(req: Request, res: Response) {
  res.json(await service.meuPerfil(req.user!.id));
}
export async function editar(req: Request, res: Response) {
  res.json(
    await service.editarPerfil(
      req.user!.id,
      schema.editarPerfilSchema.parse(req.body),
    ),
  );
}
export async function localizacao(req: Request, res: Response) {
  res.json(
    await service.localizacao(
      req.user!.id,
      schema.localizacaoSchema.parse(req.body),
    ),
  );
}
export async function senha(req: Request, res: Response) {
  const b = schema.alterarSenhaSchema.parse(req.body);
  await service.alterarSenha(req.user!.id, b.senha_atual, b.nova_senha);
  res.status(204).end();
}
export async function excluir(req: Request, res: Response) {
  const b = schema.excluirContaSchema.parse(req.body);
  await service.excluirConta(req.user!.id, b.senha);
  res.status(204).end();
}
export async function recuperar(req: Request, res: Response) {
  res.json(
    await service.solicitarRecuperacao(
      schema.recuperacaoSchema.parse(req.body).email,
    ),
  );
}
export async function redefinir(req: Request, res: Response) {
  const b = schema.redefinirSchema.parse(req.body);
  await service.redefinirSenha(b.token, b.nova_senha);
  res.json({ mensagem: "Senha redefinida. Faça login novamente." });
}
export async function historico(req: Request, res: Response) {
  const q = paginacaoSchema.parse(req.query);
  res.json(await service.historico(req.user!.id, q.page, q.limit));
}
export async function exportar(req: Request, res: Response) {
  res.json(await service.exportarDados(req.user!.id));
}
