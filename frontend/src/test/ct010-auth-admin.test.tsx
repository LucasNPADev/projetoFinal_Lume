import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminLoginPage } from '../pages/AdminLoginPage';
import { renderWithProviders } from './helpers';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('CT010 - Autenticação Administrativa e Concessão de Permissão (ROLE_ADMIN) (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('bloqueia o login administrativo e emite erro quando o usuário não possui ROLE_ADMIN', async () => {
    // API retorna perfil comum de estudante
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        token: 'token-aluno',
        id: '15',
        nome: 'Estudante Sem Acesso Admin',
        email: 'aluno@lume.com',
        perfil: 'ESTUDANTE',
      },
    });

    renderWithProviders(<AdminLoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/email@lume.com/i), { target: { value: 'aluno@lume.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'senha123' } });

    const submitBtn = screen.getByRole('button', { name: /entrar no painel/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/perfil não possui privilégios de administrador/i)).toBeInTheDocument();
      expect(localStorage.getItem('@lume:token')).toBeNull();
    });
  });

  it('permite o login administrativo com sucesso quando o perfil for ADMIN', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        token: 'token-admin-jwt',
        id: '1',
        nome: 'Super Admin',
        email: 'admin@lume.com',
        perfil: 'ADMIN',
      },
    });

    renderWithProviders(<AdminLoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/email@lume.com/i), { target: { value: 'admin@lume.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'adminSenhaSegura' } });

    const submitBtn = screen.getByRole('button', { name: /entrar no painel/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(localStorage.getItem('@lume:token')).toBe('token-admin-jwt');
      const user = JSON.parse(localStorage.getItem('@lume:user') || '{}');
      expect(user.perfil).toBe('ADMIN');
      expect(user.email).toBe('admin@lume.com');
    });
  });
});

