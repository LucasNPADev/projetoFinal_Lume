import { z } from 'zod';

export const cadastroSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto').max(150),
  email: z.string().trim().toLowerCase().email('E-mail inválido').max(255),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').max(72),
  rua: z.string().trim().max(200).optional(),
  cidade: z.string().trim().max(100).optional(),
  estado: z.string().trim().length(2, 'Use a sigla do estado (ex: SP)').toUpperCase().optional(),
  bairro: z.string().trim().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
});

export type CadastroInput = z.infer<typeof cadastroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
