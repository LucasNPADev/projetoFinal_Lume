// Politica de nomes e destinos de Pull Requests - Git Flow LUME.
// Branches permanentes: main e dev (equivalente a develop).
// Branches de suporte temporarias: feature/*, release/* e hotfix/*.
// bugfix/* e outros prefixos de manutencao tambem sao aceitos rumo a dev.
const slug = "[a-z0-9][a-z0-9._-]*";
const semver = "(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)(?:-[a-z0-9][a-z0-9.-]*)?";
const naming = new RegExp(
  "^(?:(?:feature|bugfix|chore|docs|refactor|test|ci)/" + slug
  + "|release/v?" + semver
  + "|hotfix/" + slug + ")$"
);

export function validarGitFlow(origem, destino) {
  if (typeof origem !== "string" || typeof destino !== "string" || !origem || !destino) {
    return { ok: false, mensagem: "Branches de origem e destino obrigatorias." };
  }
  if (destino !== "main" && destino !== "dev") {
    return { ok: false, mensagem: "Destinos permanentes permitidos: main e dev." };
  }
  if (origem === "main" && destino === "dev") {
    return { ok: true, mensagem: "Sincronizacao main -> dev apos hotfix/release." };
  }
  if (!naming.test(origem)) {
    return { ok: false, mensagem: "Nome invalido. Use feature/<slug>, release/v1.0.0 (ou release/1.0.0), hotfix/<slug> ou bugfix/<slug>." };
  }
  if (destino === "main" && !/^(release|hotfix)\//.test(origem)) {
    return { ok: false, mensagem: "A main so recebe PR de release/* ou hotfix/*." };
  }
  return { ok: true, mensagem: "Git Flow valido: " + origem + " -> " + destino };
}

// A origem real de uma branch (se nasceu de main ou dev) depende
// do historico Git; a politica de nomes/destinos so valida o PR.
// Aplique rulesets no GitHub para bloquear pushes diretos.
if (process.argv[1]?.endsWith("gitflow-policy.mjs")) {
  const r = validarGitFlow(process.env.GITFLOW_ORIGEM, process.env.GITFLOW_DESTINO);
  if (!r.ok) { console.error("ERRO: " + r.mensagem); process.exitCode = 1; }
  else console.log("OK: " + r.mensagem);
}
