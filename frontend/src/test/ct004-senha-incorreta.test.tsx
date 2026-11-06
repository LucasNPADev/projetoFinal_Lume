import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { AuthLoginPage } from '../pages/AuthLoginPage';
import { renderWithProviders } from './helpers';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('CT004 - Bloqueio de Autenticação com Senha Incorreta (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('exibe mensagem de erro e não salva token ao receber 401 por credenciais inválidas', async () => {
    const axiosError = new axios.AxiosError(
      'Request failed with status code 401',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 401,
        statusText: 'Unauthorized',
        data: { error: 'E-mail ou senha inválidos' },
        headers: {},
        config: {} as any,
      },
    );

    vi.mocked(api.post).mockRejectedValue(axiosError);

    renderWithProviders(<AuthLoginPage />);

    const emailInput = screen.getByPlaceholderText(/seu@email.com/i);
    const senhaInput = screen.getByPlaceholderText(/sua senha/i);
    const submitBtn = screen.getByRole('button', { name: /^entrar$/i });

    fireEvent.change(emailInput, { target: { value: 'aluno@lume.com' } });
    fireEvent.change(senhaInput, { target: { value: 'senhaErrada123' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('E-mail ou senha inválidos');
      expect(localStorage.getItem('@lume:token')).toBeNull();
    });
  });
});

