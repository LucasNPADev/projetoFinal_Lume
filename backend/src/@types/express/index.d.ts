declare global {
  namespace Express {
    interface Request {
      user?: { id: bigint; perfil: "ADMIN" | "ESTUDANTE"; idSessao: string };
    }
  }
}
export {};
