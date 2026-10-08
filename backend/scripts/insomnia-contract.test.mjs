import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const c = JSON.parse(readFileSync(new URL('../insomnia.collection.json', import.meta.url)));
const requests = c.resources.filter(r => r._type === 'request');
const expected = [
  ['GET','/health'], ['POST','/usuarios'], ['POST','/session'],
  ['GET','/cursos'], ['GET','/cursos/:id'], ['POST','/cursos'],
  ['POST','/instituicoes'], ['POST','/instituicoes/:id/cursos']
];
test('Colecao cobre as oito operacoes de HTTP da API recebida',()=>{
  for(const [method,path] of expected){
    const matching=requests.some(r=>r.method===method &&
      r.url.replace('{{ _.base_url }}','').replace(/\{\{ _.\w+_id \}\}/g,':id')===path);
    assert.ok(matching, method+' '+path+' nao encontrado');
  }
  assert.equal(requests.length,expected.length);
});
test('Colecao nao expoe token literal',()=>{
  const auth=requests.map(r=>r.authentication).filter(Boolean);
  assert.ok(auth.every(a=>!a.token || /^\{\{ _.\w+ \}\}$/.test(a.token)));
});
