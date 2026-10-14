import { Request, Response } from "express";
import {
  responderTesteSchema,
  historicoTesteSchema,
} from "../../schemas/testeVocacional";
import * as service from "../../services/testeVocacionalService";

export async function perguntas(_req: Request, res: Response) {
  res.json(await service.perguntas());
}
export async function responder(req: Request, res: Response) {
  const { respostas } = responderTesteSchema.parse(req.body);
  res
    .status(201)
    .json(
      await service.responder(
        req.user!.id,
        respostas.map((resposta) => ({
          ...resposta,
          id_pergunta: BigInt(resposta.id_pergunta),
        })),
      ),
    );
}
export async function resultado(req: Request, res: Response) {
  res.json(await service.resultado(req.user!.id));
}
export async function historico(req: Request, res: Response) {
  const { limite } = historicoTesteSchema.parse(req.query);
  res.json(
    await service.historico(req.user!.id, 1, limite),
  );
}