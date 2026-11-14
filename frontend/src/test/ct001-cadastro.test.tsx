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

describe('CT001 - Cadastro de Novo Estudante no Aplicativo com Dados Válidos (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('permite o preenchimento de dados válidos, aceitação dos termos e submissão do cadastro', async () => {
    vi.mocked(api.post).mockImplementation(async (url: string) => {
      if (url === '/usuarios') {
        return {
          data: {
            id_usuario: '10',
            nome: 'Ana Silva',
            email: 'ana.silva@teste.com',
            perfil: 'ESTUDANTE',
          },
        };
      }
      if (url === '/session') {
        return {
          data: {
            token: 'fake-jwt-token',
            id: '10',
            nome: 'Ana Silva',
            perfil: 'ESTUDANTE',
          },
        };
      }
      return { data: {} };
    });

    renderWithProviders(<AuthLoginPage />);

    // Alterna para a aba de cadastro
    const cadastrarTab = screen.getByRole('tab', { name: /criar conta/i });
    fireEvent.click(cadastrarTab);

    // Preenche os campos do formulário
    const nomeInput = screen.getByPlaceholderText(/seu nome/i);
    const emailInput = screen.getByPlaceholderText(/seu@email.com/i);
    const senhaInput = screen.getByPlaceholderText(/crie uma senha/i);
    const termosCheckbox = screen.getByRole('checkbox');

    fireEvent.change(nomeInput, { target: { value: 'Ana Silva' } });
    fireEvent.change(emailInput, { target: { value: 'ana.silva@teste.com' } });
    fireEvent.change(senhaInput, { target: { value: 'SenhaForte123' } });
    fireEvent.click(termosCheckbox);

    const submitBtn = screen.getByRole('button', { name: /criar minha conta/i });
    expect(submitBtn).toBeEnabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/usuarios', expect.objectContaining({
        nome: 'Ana Silva',
        email: 'ana.silva@teste.com',
        senha: 'SenhaForte123',
        aceitou_termos: true,
      }));
    });
  });
});

