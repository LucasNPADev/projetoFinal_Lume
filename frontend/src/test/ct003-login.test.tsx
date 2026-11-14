import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthLoginPage } from '../pages/AuthLoginPage';
import { renderWithProviders } from './helpers';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('CT003 - Autenticação de Estudante (Login) (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('autentica o estudante, grava o token JWT e dados no localStorage', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        token: 'token-jwt-ct003',
        id: '42',
        nome: 'Estudante Aprovado',
        email: 'estudante@lume.com',
        perfil: 'ESTUDANTE',
      },
    });

    renderWithProviders(<AuthLoginPage />);

    // Formulário padrão já está na aba de Login (Entrar)
    const emailInput = screen.getByPlaceholderText(/seu@email.com/i);
    const senhaInput = screen.getByPlaceholderText(/sua senha/i);
    const submitBtn = screen.getByRole('button', { name: /^entrar$/i });

    fireEvent.change(emailInput, { target: { value: 'estudante@lume.com' } });
    fireEvent.change(senhaInput, { target: { value: 'SenhaCorreta123' } });

    expect(submitBtn).toBeEnabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/session', {
        email: 'estudante@lume.com',
        senha: 'SenhaCorreta123',
      });
      // Verifica gravação no localStorage
      expect(localStorage.getItem('@lume:token')).toBe('token-jwt-ct003');
      const storedUser = JSON.parse(localStorage.getItem('@lume:user') || '{}');
      expect(storedUser.id).toBe('42');
      expect(storedUser.email).toBe('estudante@lume.com');
      expect(storedUser.perfil).toBe('ESTUDANTE');
    });
  });
});

