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

describe('CT002 - Bloqueio de Cadastro com E-mail Já Existente no Sistema (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('exibe alerta na interface ao receber HTTP 409 para e-mail já cadastrado', async () => {
    // Simula erro 409 do Axios
    const axiosError = new axios.AxiosError(
      'Request failed with status code 409',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 409,
        statusText: 'Conflict',
        data: { error: 'E-mail já cadastrado' },
        headers: {},
        config: {} as any,
      },
    );

    vi.mocked(api.post).mockRejectedValue(axiosError);

    renderWithProviders(<AuthLoginPage />);

    // Alterna para cadastro
    const cadastrarTab = screen.getByRole('tab', { name: /criar conta/i });
    fireEvent.click(cadastrarTab);

    // Preenche com dados incluindo email duplicado
    fireEvent.change(screen.getByPlaceholderText(/seu nome/i), { target: { value: 'João Duplicado' } });
    fireEvent.change(screen.getByPlaceholderText(/seu@email.com/i), { target: { value: 'jaexiste@teste.com' } });
    fireEvent.change(screen.getByPlaceholderText(/crie uma senha/i), { target: { value: 'SenhaForte123' } });
    fireEvent.click(screen.getByRole('checkbox'));

    const submitBtn = screen.getByRole('button', { name: /criar minha conta/i });
    fireEvent.click(submitBtn);

    // Aguarda exibição do alerta na tela
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('E-mail já cadastrado');
    });
  });
});

