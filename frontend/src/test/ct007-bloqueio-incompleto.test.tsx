import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { QuizPage } from '../pages/QuizPage';
import { renderWithProviders } from './helpers';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('CT007 - Cancelamento do Envio do Teste Vocacional com Respostas Pendentes (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mantém o botão de envio desabilitado e impede a submissão com respostas pendentes', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        escala: [
          { valor: 1, rotulo: 'Discordo totalmente' },
          { valor: 2, rotulo: 'Discordo' },
          { valor: 3, rotulo: 'Neutro' },
          { valor: 4, rotulo: 'Concordo' },
          { valor: 5, rotulo: 'Concordo totalmente' },
        ],
        perguntas: [
          { id_pergunta: '10', enunciado: 'Pergunta número um do quiz' },
          { id_pergunta: '20', enunciado: 'Pergunta número dois do quiz' },
          { id_pergunta: '30', enunciado: 'Pergunta número três do quiz' },
        ],
      },
    });

    renderWithProviders(<QuizPage />);

    await waitFor(() => {
      expect(screen.getByText('Pergunta número um do quiz')).toBeInTheDocument();
    });

    // O botão deve estar inicialmente desabilitado
    const submitBtn = screen.getByRole('button', { name: /ver meu resultado/i });
    expect(submitBtn).toBeDisabled();

    // Responde apenas a pergunta 1 de 3
    const grupo1 = screen.getByRole('group', { name: /resposta da pergunta 1/i });
    const btn1 = grupo1.querySelector('button') as HTMLButtonElement;
    fireEvent.click(btn1);

    // O botão ainda deve estar desabilitado porque faltam as perguntas 2 e 3
    expect(submitBtn).toBeDisabled();

    // Responde a pergunta 2 de 3
    const grupo2 = screen.getByRole('group', { name: /resposta da pergunta 2/i });
    const btn2 = grupo2.querySelector('button') as HTMLButtonElement;
    fireEvent.click(btn2);

    // Ainda desabilitado (pergunta 3 pendente)
    expect(submitBtn).toBeDisabled();

    // Tentar clicar no botão desabilitado não chama a API
    fireEvent.click(submitBtn);
    expect(api.post).not.toHaveBeenCalled();
  });
});

