import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { renderWithProviders } from './helpers';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('CT011 - Cadastramento de Perguntas para o Teste Vocacional (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite ao administrador preencher e cadastrar uma nova pergunta vocacional com sucesso', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/admin/perguntas-vocacionais') {
        return { data: { perguntas: [], escala: [] } };
      }
      return { data: { data: [], totalPages: 1 } };
    });

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        id_pergunta: '99',
        enunciado: 'Tenho afinidade com análise de dados?',
        area_afinidade: 'Ciência de Dados',
        status: true,
      },
    });

    renderWithProviders(<AdminDashboardPage />);

    // Clica na aba de Pergunta Vocacional
    const tabPergunta = await screen.findByRole('button', { name: /pergunta vocacional/i });
    fireEvent.click(tabPergunta);

    // Preenche o formulário da pergunta
    const enunciadoInput = await screen.findByLabelText(/enunciado da pergunta/i);
    const areaInput = screen.getByLabelText(/área de afinidade/i);

    fireEvent.change(enunciadoInput, {
      target: { value: 'Tenho afinidade com análise de dados?' },
    });
    fireEvent.change(areaInput, {
      target: { value: 'Ciência de Dados' },
    });

    const submitBtn = screen.getByRole('button', { name: /salvar pergunta/i });
    fireEvent.click(submitBtn);

    // Valida chamada à API e mensagem de sucesso
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/perguntas-vocacionais', expect.objectContaining({
        enunciado: 'Tenho afinidade com análise de dados?',
        area_afinidade: 'Ciência de Dados',
      }));
      expect(screen.getByText(/pergunta vocacional cadastrada com sucesso/i)).toBeInTheDocument();
    });
  });
});

