export function perfilPublico(perfil: string): "ADMIN" | "ESTUDANTE" {
  return ["admin", "ADMIN"].includes(perfil) ? "ADMIN" : "ESTUDANTE";
}
