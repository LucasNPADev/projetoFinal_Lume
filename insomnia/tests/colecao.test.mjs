import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// Toda a validacao da colecao mora em /insomnia/tests, fora do backend.
const raw = readFileSync(new URL('../colecao-lume.json', import.meta.url), 'utf8');
const collection = JSON.parse(raw);
const resources = collection.resources;
const requests = resources.filter((resource) => resource._type === 'request');
const environment = resources.find((resource) => resource._type === 'environment');
const groups = resources.filter((resource) => resource._type === 'request_group');

const expected = [
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
  .replace(/\{\{ _\.\w+_id \}\}/g, ':id');

test('A colecao contem exatamente sete APIs de negocio, sem health e sem placeholders de rota', () => {
  assert.equal(collection.__export_format, 4);
  assert.equal(requests.length, 7);
  assert.equal(groups.length, 3);
  const actual = requests.map((r) => [r.method, toPath(r.url)]);
  assert.deepEqual(
    [...actual].sort((a, b) => a.join(' ').localeCompare(b.join(' '))),
    [...expected].sort((a, b) => a.join(' ').localeCompare(b.join(' '))),
  );
  assert.ok(!actual.some(([method, path]) => method === 'GET' && path === '/health'));
  for (const request of requests) {
    assert.ok(request.url.startsWith('{{ _.base_url }}/'), 'A URL deve usar base_url');
    assert.ok(groups.some((group) => group._id === request.parentId), 'Requisicao fora de grupo');
  }
});

test('Ambiente versionado nao expoe tokens, senhas ou IDs preenchidos', () => {
  assert.ok(environment);
  assert.equal(environment.data.base_url, 'http://localhost:3333');
  for (const key of ['token', 'admin_token', 'senha_estudante', 'curso_id', 'instituicao_id']) {
    assert.equal(environment.data[key], '', 'Variavel deve ficar vazia: ' + key);
  }
  for (const request of requests) {
    const token = request.authentication?.token;
    if (token !== undefined) {
      assert.match(token, /^\{\{ _\.(?:token|admin_token) \}\}$/);
    }
    const authHeader = request.headers?.find((header) =>
      header.name?.toLowerCase() === 'authorization');
    assert.equal(authHeader, undefined, 'Nao publicar Authorization literal');
  }
});

test('Nao ha JWT literal em colecoes JSON ou YAML versionadas', () => {
  const root = new URL('../../', import.meta.url);
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root })
    .toString('utf8').split('\0').filter(Boolean);
  const exports = tracked.filter((path) =>
    /\.(?:json|yaml|yml)$/i.test(path) && !path.endsWith('package-lock.json'));
  const jwtPattern = /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+/;
  assert.doesNotMatch(raw, jwtPattern);
  for (const file of exports) {
    const contents = readFileSync(new URL('../../' + file, import.meta.url), 'utf8');
    assert.doesNotMatch(contents, jwtPattern, 'JWT literal encontrado no arquivo ' + file);
  }
});

test('Requisicoes de negocio usam metodos e autenticacao corretos', () => {
  for (const request of requests) {
    const path = toPath(request.url);
    const isPublic = path === '/usuarios' || path === '/session';
    const isAdmin = request.method === 'POST' && !isPublic;
    if (isPublic) {
      assert.ok(!request.authentication?.token, 'Requisicao publica nao requer token');
    } else {
      assert.equal(
        request.authentication?.token,
        isAdmin ? '{{ _.admin_token }}' : '{{ _.token }}',
      );
    }
  }
});
