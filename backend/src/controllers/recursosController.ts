import { Request, Response } from "express";
import * as schema from "../schemas/recursos";
import { paginacaoSchema } from "../schemas/comum";
import { editarFonteSchema, fonteSchema } from "../schemas/cargo";
import { parseId } from "../utils/parseId";
import { AppError } from "../utils/AppError";
import * as favoritos from "../services/favoritoService";
import * as avaliacoes from "../services/avaliacaoService";
import * as testes from "../services/testeVocacionalService";
import * as ferramentas from "../services/ferramentasService";
import * as admin from "../services/adminService";
import * as notificacoes from "../services/notificacaoService";

export async function favoritar(req: Request, res: Response) {
  const b = schema.favoritoSchema.parse(req.body);
  res.status(201).json(await favoritos.favoritar(req.user!.id, b.tipo, b.id));
}
export async function favoritosListar(req: Request, res: Response) {
  res.json(await favoritos.listar(req.user!.id));
}
export async function favoritoRemover(req: Request, res: Response) {
  await favoritos.remover(parseId(req.params.id), req.user!.id);
  res.status(204).end();
}
export async function avaliar(req: Request, res: Response) {
  res
    .status(201)
    .json(
      await avaliacoes.criar(
        req.user!.id,
        schema.avaliacaoSchema.parse(req.body),
      ),
    );
}
export async function avaliacoesListar(req: Request, res: Response) {
  res.json(
    await avaliacoes.listar(
      schema.listarAvaliacoesSchema.parse(req.query),
      req.user!.perfil === "ADMIN",
    ),
  );
}
export async function avaliacaoEditar(req: Request, res: Response) {
  res.json(
    await avaliacoes.editar(
      parseId(req.params.id),
      req.user!.id,
      schema.editarAvaliacaoSchema.parse(req.body),
    ),
  );
}
export async function avaliacaoRemover(req: Request, res: Response) {
  await avaliacoes.excluir(
    parseId(req.params.id),
    req.user!.id,
    req.user!.perfil === "ADMIN",
  );
  res.status(204).end();
}
export async function denunciar(req: Request, res: Response) {
  res
    .status(201)
    .json(
      await avaliacoes.denunciar(
        parseId(req.params.id),
        req.user!.id,
        schema.denunciaSchema.parse(req.body).motivo,
      ),
    );
}
export async function moderar(req: Request, res: Response) {
  const b = schema.moderacaoSchema.parse(req.body);
  res.json(
    await avaliacoes.moderar(parseId(req.params.id), b.status, b.motivo),
  );
}
export async function perguntasAdmin(req: Request, res: Response) {
  res.json(await testes.perguntas(true));
}
export async function ofertasAdmin(req: Request, res: Response) {
  const q = paginacaoSchema.parse(req.query);
  res.json(await admin.ofertasAdmin(q.page, q.limit));
}
export async function perguntaCriar(req: Request, res: Response) {
  res
    .status(201)
    .json(
      await admin.criarPergunta(
        req.user!.id,
        schema.perguntaSchema.parse(req.body),
      ),
    );
}
export async function perguntaEditar(req: Request, res: Response) {
  res.json(
    await admin.editarPergunta(
      parseId(req.params.id),
      schema.editarPerguntaSchema.parse(req.body),
    ),
  );
}
export async function perguntaArquivar(req: Request, res: Response) {
  res.json(
    await admin.editarPergunta(parseId(req.params.id), { status: false }),
  );
}
export async function comparar(req: Request, res: Response) {
  const b = schema.compararSchema.parse(req.body);
  res.json(await ferramentas.comparar(req.user!.id, b.tipo, b.ids));
}
export async function fontes(req: Request, res: Response) {
  const q = paginacaoSchema.parse(req.query);
  res.json(await admin.listarFontes(q.page, q.limit));
}
export async function fonteCriar(req: Request, res: Response) {
  res.status(201).json(await admin.criarFonte(fonteSchema.parse(req.body)));
}
export async function fonteEditar(req: Request, res: Response) {
  res.json(
    await admin.editarFonte(
      parseId(req.params.id),
      editarFonteSchema.parse(req.body),
    ),
  );
}
export async function fonteExcluir(req: Request, res: Response) {
  await admin.excluirFonte(parseId(req.params.id));
  res.status(204).end();
}
export async function notificacoesListar(req: Request, res: Response) {
  const q = paginacaoSchema.parse(req.query);
  res.json(await notificacoes.listar(req.user!.id, q.page, q.limit));
}
export async function notificacaoLer(req: Request, res: Response) {
  if (!(await notificacoes.ler(parseId(req.params.id), req.user!.id)))
    throw new AppError("Notificação não encontrada", 404);
  res.status(204).end();
}
export async function notificacaoRemover(req: Request, res: Response) {
  if (!(await notificacoes.remover(parseId(req.params.id), req.user!.id)))
    throw new AppError("Notificação não encontrada", 404);
  res.status(204).end();
}