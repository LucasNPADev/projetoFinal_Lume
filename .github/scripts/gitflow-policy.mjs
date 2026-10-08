// Git Flow LUME: valida nomes e destinos dos pull requests.
const slug = "[a-z0-9][a-z0-9._-]*";
const version = "(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)(?:-[a-z0-9][a-z0-9.-]*)?";
const naming = new RegExp("^(?:(?:feature|bugfix|chore|docs|refactor|test|ci)/" + slug + "|(?:release|hotfix)/" + version + ")$");

export function validarGitFlow(origem, destino) {
  if (!origem || !destino) return { ok: false, mensagem: "Branches de origem e destino obrigatorias." };
  if (destino !== "main" && destino !== "dev") return { ok: false, mensagem: "Destinos permitidos: main e dev." };
  if (origem === "main" && destino === "dev") return { ok: true, mensagem: "Sincronizacao main -> dev permitida." };
  if (!naming.test(origem)) return { ok: false, mensagem: "Nome invalido: use feature|bugfix|chore|docs|refactor|test|ci/<slug> ou release|hotfix/<x.y.z>." };
  if (destino === "main" && !/^(release|hotfix)\//.test(origem)) {
    return { ok: false, mensagem: "A main recebe somente release/* e hotfix/*." };
  }
  return { ok: true, mensagem: "Fluxo valido: " + origem + " -> " + destino };
}

if (process.argv[1]?.endsWith("gitflow-policy.mjs")) {
  const r = validarGitFlow(process.env.GITFLOW_ORIGEM, process.env.GITFLOW_DESTINO);
  if (!r.ok) { console.error("ERRO: " + r.mensagem); process.exitCode = 1; }
  else console.log("OK: " + r.mensagem);
}
