import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const db = new PrismaClient();
function cli(...args: string[]) {
  const resultado = spawnSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", ...args],
    { stdio: "inherit" },
  );
  if (resultado.status !== 0)
    throw new Error("Prisma não concluiu a operação. Leia a mensagem acima.");
}
async function main() {
  const rows = await db.$queryRaw<
    { table_name: string; column_name: string }[]
  >`SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public'`;
  const schema = readFileSync("prisma/legacy/schema-original.prisma", "utf8");
  const modelos = [...schema.matchAll(/model\s+(\w+)\s*\{([\s\S]*?)\n\}/g)];
  const faltantes: string[] = [];
  for (const [, nome, conteudo] of modelos) {
    for (const line of conteudo.split("\n")) {
      const coluna =
        /^\s*(\w+)\s+(?:BigInt|String|Decimal|Int|Boolean|DateTime|Json)\??\s/.exec(
          line,
        )?.[1];
      if (
        coluna &&
        !rows.some((r) => r.table_name === nome && r.column_name === coluna)
      )
        faltantes.push(`${nome}.${coluna}`);
    }
  }
  if (faltantes.length)
    throw new Error(
      `O banco não corresponde ao backend enviado. Campos faltantes: ${faltantes.join(", ")}. Use um banco novo ou adapte a migração ao seu banco.`,
    );
  if (
    rows.some(
      (r) => r.table_name === "Usuario" && r.column_name === "versao_termos",
    )
  )
    throw new Error(
      "O banco já tem campos da versão completa. Use npm run db:status; não aplique o baseline novamente.",
    );
  console.log(
    "Estrutura inicial reconhecida. Este comando preserva registros. Mantenha um backup do banco antes de atualizar.",
  );
  const temHistorico = rows.some((r) => r.table_name === "_prisma_migrations");
  const aplicada = temHistorico
    ? await db.$queryRaw<
        { migration_name: string }[]
      >`SELECT migration_name FROM "_prisma_migrations" WHERE migration_name='0_base' AND finished_at IS NOT NULL`
    : [];
  await db.$disconnect();
  if (!aplicada.length) cli("migrate", "resolve", "--applied", "0_base");
  cli("migrate", "deploy");
  cli("generate");
  console.log(
    "Banco atualizado. Registros e IDs anteriores preservados. Instituições precisam de validação regular_mec; cargos precisam de fonte e rotas.",
  );
}
main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : "Falha ao adotar banco");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
