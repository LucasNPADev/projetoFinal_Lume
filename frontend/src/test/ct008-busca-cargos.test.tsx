import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { CareersPage } from '../pages/CareersPage';
import { renderWithProviders } from './helpers';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('CT008 - Consulta e Busca de Cargos/Profissões por Palavra-Chave (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite buscar profissões por palavra-chave e atualiza a listagem com o filtro aplicado', async () => {
    // 1ª chamada: lista completa
    vi.mocked(api.get).mockImplementation(async (url: string, config?: any) => {
      if (url === '/favoritos') {
        return { data: [] };
      }
      if (url === '/cargos') {
        const busca = config?.params?.busca;
        if (busca === 'Desenvolvedor') {
          return {
            data: {
              data: [
                {
                  id_cargo: '1',
                  nome: 'Desenvolvedor BackEnd',
                  area_atuacao: 'Tecnologia',
                  descricao: 'Criação de APIs e microsserviços',
                  hard_skills: 'Node.js, PostgreSQL',
                  soft_skills: 'Comunicação',
                  panorama_mercado: 'Alta demanda',
                },
              ],
              totalPages: 1,
            },
          };
        }

        return {
          data: {
            data: [
              {
                id_cargo: '1',
                nome: 'Desenvolvedor BackEnd',
                area_atuacao: 'Tecnologia',
                descricao: 'Criação de APIs',
                hard_skills: 'Node.js',
                soft_skills: 'Trabalho em equipe',
                panorama_mercado: 'Aquecido',
              },
              {
                id_cargo: '2',
                nome: 'Médico Clínico Geral',
                area_atuacao: 'Saúde',
                descricao: 'Atendimento ambulatorial',
                hard_skills: 'Diagnóstico',
                soft_skills: 'Empatia',
                panorama_mercado: 'Estável',
              },
            ],
            totalPages: 1,
          },
        };
      }
      return { data: {} };
    });

    renderWithProviders(<CareersPage />);

    // Aguarda carregar os itens iniciais
    await waitFor(() => {
      expect(screen.getByText('Desenvolvedor BackEnd')).toBeInTheDocument();
      expect(screen.getByText('Médico Clínico Geral')).toBeInTheDocument();
    });

    // Digita na barra de busca e submete
    const searchInput = screen.getByPlaceholderText(/buscar por carreira/i);
    const searchBtn = screen.getByRole('button', { name: /buscar/i });

    fireEvent.change(searchInput, { target: { value: 'Desenvolvedor' } });
    fireEvent.click(searchBtn);

    // Valida que apenas o Desenvolvedor é exibido e a requisição usou o parâmetro busca
    await waitFor(() => {
      expect(screen.getByText('Desenvolvedor BackEnd')).toBeInTheDocument();
      expect(screen.queryByText('Médico Clínico Geral')).not.toBeInTheDocument();
      expect(api.get).toHaveBeenCalledWith('/cargos', expect.objectContaining({
        params: expect.objectContaining({ busca: 'Desenvolvedor' }),
      }));
    });
  });
});

