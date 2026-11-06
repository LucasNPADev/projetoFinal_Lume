import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { CoursesPage } from '../pages/CoursesPage';
import { renderWithProviders } from './helpers';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('CT009 - Consulta e Filtragem de Cursos por Modalidade (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite buscar cursos por termo e exibe a modalidade correspondente (EAD e Presencial)', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string, config?: any) => {
      if (url === '/favoritos') {
        return { data: [] };
      }
      if (url === '/ofertas') {
        const busca = config?.params?.busca;
        if (busca === 'Software EAD') {
          return {
            data: {
              data: [
                {
                  id_curso_instituicao: '101',
                  id_curso: '1',
                  mensalidade: 450,
                  mensalidade_max: null,
                  formas_ingresso: 'Vestibular Online',
                  bolsas: 'PROUNI',
                  prouni: true,
                  fies: false,
                  curso: {
                    nome_curso: 'Engenharia de Software',
                    grau_academico: 'Bacharelado',
                    modalidade: 'EAD',
                    carga_horaria: 3200,
                    area_curso: 'Tecnologia',
                    duracao_meses: 48,
                    descricao: 'Curso 100% à distância',
                  },
                  instituicao: {
                    id_instituicao: '10',
                    nome_instituicao: 'Faculdade Virtual do Brasil',
                    cidade: 'São Paulo',
                    estado: 'SP',
                    natureza: 'PRIVADA',
                    nota_mec: 4.5,
                  },
                  local_oferta: {
                    cidade: 'São Paulo',
                    estado: 'SP',
                    polo_nome: 'Polo Central',
                  },
                  distancia_km: 5,
                },
              ],
              total: 1,
              page: 1,
              limit: 20,
              totalPages: 1,
            },
          };
        }

        // Retorno inicial com opções EAD e Presencial
        return {
          data: {
            data: [
              {
                id_curso_instituicao: '101',
                id_curso: '1',
                mensalidade: 450,
                mensalidade_max: null,
                formas_ingresso: 'Vestibular',
                bolsas: 'PROUNI',
                prouni: true,
                fies: false,
                curso: {
                  nome_curso: 'Engenharia de Software',
                  grau_academico: 'Bacharelado',
                  modalidade: 'EAD',
                  carga_horaria: 3200,
                  area_curso: 'Tecnologia',
                  duracao_meses: 48,
                  descricao: 'Curso 100% à distância',
                },
                instituicao: {
                  id_instituicao: '10',
                  nome_instituicao: 'Faculdade Virtual',
                  cidade: 'São Paulo',
                  estado: 'SP',
                  natureza: 'PRIVADA',
                  nota_mec: 4.5,
                },
                local_oferta: { cidade: 'São Paulo', estado: 'SP', polo_nome: 'Polo Central' },
                distancia_km: 5,
              },
              {
                id_curso_instituicao: '102',
                id_curso: '2',
                mensalidade: 1200,
                mensalidade_max: null,
                formas_ingresso: 'ENEM',
                bolsas: 'Nenhuma',
                prouni: false,
                fies: true,
                curso: {
                  nome_curso: 'Direito Tradicional',
                  grau_academico: 'Bacharelado',
                  modalidade: 'PRESENCIAL',
                  carga_horaria: 4000,
                  area_curso: 'Jurídica',
                  duracao_meses: 60,
                  descricao: 'Curso no campus',
                },
                instituicao: {
                  id_instituicao: '20',
                  nome_instituicao: 'Universidade Central',
                  cidade: 'Campinas',
                  estado: 'SP',
                  natureza: 'PRIVADA',
                  nota_mec: 5.0,
                },
                local_oferta: { cidade: 'Campinas', estado: 'SP', polo_nome: 'Campus 1' },
                distancia_km: 15,
              },
            ],
            total: 2,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
        };
      }
      return { data: {} };
    });

    renderWithProviders(<CoursesPage />);

    // Verifica que ambos os cursos foram carregados inicialmente
    await waitFor(() => {
      expect(screen.getByText('Engenharia de Software')).toBeInTheDocument();
      expect(screen.getByText('Direito Tradicional')).toBeInTheDocument();
      expect(screen.getByText('EAD')).toBeInTheDocument();
      expect(screen.getByText('PRESENCIAL')).toBeInTheDocument();
    });

    // Realiza busca combinada pelo curso EAD
    const searchInput = screen.getByPlaceholderText(/buscar curso ou faculdade/i);
    const searchBtn = screen.getByRole('button', { name: /buscar/i });

    fireEvent.change(searchInput, { target: { value: 'Software EAD' } });
    fireEvent.click(searchBtn);

    // Valida que apenas o curso EAD é retornado
    await waitFor(() => {
      expect(screen.getByText('Engenharia de Software')).toBeInTheDocument();
      expect(screen.queryByText('Direito Tradicional')).not.toBeInTheDocument();
      expect(api.get).toHaveBeenCalledWith('/ofertas', expect.objectContaining({
        params: expect.objectContaining({ busca: 'Software EAD' }),
      }));
    });
  });
});

