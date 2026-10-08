import assert from "node:assert/strict";
import test from "node:test";
import { pontuarQuiz } from "../src/services/quiz.service";
import { ApiError } from "../src/middlewares/errors";

const perguntas = [
  { id: 1, ordem: 1, pergunta: "Q1", categoria: "interesses", opcoes: [
    { texto: "Tecnologia", pesos: { Tecnologia: 3 } },
    { texto: "Saude", pesos: { "Saúde": 3 } }
  ] },
  { id: 2, ordem: 2, pergunta: "Q2", categoria: "habilidades", opcoes: [
    { texto: "Humanas", pesos: { Humanas: 3 } },
    { texto: "Tecnologia", pesos: { Tecnologia: 3 } }
  ] }
];

test("soma pesos oficiais e retorna ranking reproducivel", () => {
  const resultado = pontuarQuiz(perguntas, [{ perguntaId: 1, opcaoIndex: 0 }, { perguntaId: 2, opcaoIndex: 1 }]);
  assert.equal(resultado.resultadoArea, "Tecnologia");
  assert.equal(resultado.ranking[0].pontuacao, 6);
});
test("impede respostas duplicadas", () => assert.throws(() =>
  pontuarQuiz(perguntas, [{ perguntaId: 1, opcaoIndex: 0 }, { perguntaId: 1, opcaoIndex: 1 }]), ApiError));
test("exige todas as perguntas", () => assert.throws(() =>
  pontuarQuiz(perguntas, [{ perguntaId: 1, opcaoIndex: 0 }]), ApiError));
test("rejeita alternativa inexistente", () => assert.throws(() =>
  pontuarQuiz(perguntas, [{ perguntaId: 1, opcaoIndex: 4 }, { perguntaId: 2, opcaoIndex: 0 }]), ApiError));
test("nao aceita pesos ausentes ou legado", () => assert.throws(() =>
  pontuarQuiz([{ ...perguntas[0], opcoes: ["A", "B"] }], [{ perguntaId: 1, opcaoIndex: 0 }]), ApiError));
test("empate nao elimina areas e possui desempate deterministico", () => {
  const resultado = pontuarQuiz(perguntas, [{ perguntaId: 1, opcaoIndex: 0 }, { perguntaId: 2, opcaoIndex: 0 }]);
  assert.equal(resultado.ranking.length, 2);
  assert.equal(resultado.ranking[0].pontuacao, 3);
});
