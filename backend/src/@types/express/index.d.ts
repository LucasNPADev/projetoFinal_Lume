declare global {
  namespace Express {
    interface Request {
      user?: {
        id: bigint;
        perfil: string;
      };
    }
  }
}

export {};
