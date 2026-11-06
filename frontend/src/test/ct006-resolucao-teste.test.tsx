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

describe('CT006 - Resolução Completa do Teste Vocacional com Geração de Perfil (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite responder 100% das perguntas e exibe o gráfico final com as afinidades', async () => {
    // Mock do questionário carregado
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
          { id_pergunta: '1', enunciado: 'Gosto de resolver quebra-cabeças e lógica?' },
          { id_pergunta: '2', enunciado: 'Tenho interesse em desenhar e criar artes visuais?' },
        ],
      },
    });

    // Mock do resultado enviado
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        pontuacao_detalhada: {
          area_maior_afinidade: 'Tecnologia da Informação',
          empate: false,
          areas: [
            { area: 'Tecnologia da Informação', percentual: 75 },
            { area: 'Artes e Design', percentual: 25 },
          ],
          orientacao: 'Resultado orientativo de afinidades.',
        },
      },
    });

    renderWithProviders(<QuizPage />);

    // Aguarda carregar perguntas
    await waitFor(() => {
      expect(screen.getByText(/Gosto de resolver quebra-cabeças/i)).toBeInTheDocument();
      expect(screen.getByText(/Tenho interesse em desenhar/i)).toBeInTheDocument();
    });

    // Responde a pergunta 1 (valor 5)
    const grupo1 = screen.getByRole('group', { name: /resposta da pergunta 1/i });
    const btnP1 = grupo1.querySelector('button:last-child') as HTMLButtonElement;
    fireEvent.click(btnP1);

    // Responde a pergunta 2 (valor 3)
    const grupo2 = screen.getByRole('group', { name: /resposta da pergunta 2/i });
    const btnP2 = grupo2.querySelector('button:nth-child(3)') as HTMLButtonElement;
    fireEvent.click(btnP2);

    // Botão de submissão habilitado
    const submitBtn = screen.getByRole('button', { name: /ver meu resultado/i });
    expect(submitBtn).toBeEnabled();

    fireEvent.click(submitBtn);

    // Valida exibição do resultado detalhado e das barras de progresso (gráfico)
    await waitFor(() => {
      expect(screen.getByText(/resultado do seu teste/i)).toBeInTheDocument();
      expect(screen.getByText(/maior afinidade: tecnologia da informação/i)).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
    });
  });
});

