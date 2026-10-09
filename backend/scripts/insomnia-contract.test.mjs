import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// A colecao versionada vive em /insomnia, na raiz do repositorio.
const raw = readFileSync(new URL('../../insomnia/colecao-lume.json', import.meta.url), 'utf8');
const collection = JSON.parse(raw);
const resources = collection.resources;
const requests = resources.filter((resource) => resource._type === 'request');
const environment = resources.find((resource) => resource._type === 'environment');

const expected = [
  ['GET', '/health'],
  ['POST', '/usuarios'],
  ['POST', '/session'],
  ['GET', '/cursos'],
  ['GET', '/cursos/:id'],
  ['POST', '/cursos'],
  ['POST', '/instituicoes'],
  ['POST', '/instituicoes/:id/cursos'],
];

const toPath = (url) => url
  .replace('{{ _.base_url }}', '')
  .replace(/\{\{ _.\w+_id \}\}/g, ':id');

test('Colecao Insomnia cobre somente as 8 rotas reais da API', () => {
  assert.equal(requests.length, expected.length);
  for (const [method, path] of expected) {
    assert.ok(
      requests.some((request) => request.method === method && toPath(request.url) === path),
      `Requisicao ausente: ${method} ${path}`,
    );
  }
});

test('JWTs de usuario/admin ficam vazios no ambiente versionado', () => {
  assert.ok(environment);
  assert.equal(environment.data.token, '');
  assert.equal(environment.data.admin_token, '');
  assert.equal(environment.data.base_url, 'http://localhost:3333');
  for (const request of requests) {
    const value = request.authentication?.token;
    if (value !== undefined) {
      assert.match(value, /^\{\{ _\.(?:token|admin_token) \}\}$/);
    }
    const authorizationHeader = request.headers?.find((header) =>
      header.name?.toLowerCase() === 'authorization');
    assert.equal(authorizationHeader, undefined, 'Nao versionar header Authorization literal');
  }
});

test('Nao ha JWT literal nem valores secretos em campos de ambiente', () => {
  assert.doesNotMatch(
    raw,
    /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+/,
    'Um JWT literal foi encontrado na colecao',
  );
  for (const [key, value] of Object.entries(environment.data)) {
    if (/token|secret|senha/i.test(key)) {
      assert.equal(value, '', `A variavel sensivel ${key} deve estar vazia`);
    }
  }
});

test('Exportacoes YAML/JSON do repositorio nao podem conter JWT literal', () => {
  // Impede regressao semelhante ao arquivo YAML proposto no PR #11.
  const root = new URL('../../', import.meta.url);
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root })
    .toString('utf8').split('\0').filter(Boolean);
  const exports = tracked.filter((path) =>
    /\.(?:json|yaml|yml)$/i.test(path) && !path.endsWith('package-lock.json'));
  const jwtPattern = /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+/;
  for (const file of exports) {
    const contents = readFileSync(new URL('../../' + file, import.meta.url), 'utf8');
    assert.doesNotMatch(contents, jwtPattern, 'JWT literal versionado em ' + file);
  }
});
