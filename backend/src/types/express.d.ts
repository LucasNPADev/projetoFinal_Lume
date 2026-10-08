declare global {
  namespace Express {
    interface Request {
      principal?: { id: number; kind: "USER" | "ADMIN"; sessionId: string };
    }
  }
}
export {};
