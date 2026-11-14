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

describe('CT012 - Cadastramento de Novo Cargo e Especificação de Requisitos (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite ao administrador preencher e cadastrar um novo cargo com requisitos e rota de formação', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/cursos') {
        return {
          data: {
            data: [
              {
                id_curso: '10',
                nome_curso: 'Engenharia de Software',
                duracao_meses: 48,
                modalidade: 'PRESENCIAL',
                status: true,
                grau_academico: 'Bacharelado',
                carga_horaria: 3200,
                area_curso: 'Tecnologia',
                descricao: null,
                grade_curricular: null,
              },
            ],
            totalPages: 1,
          },
        };
      }
      if (url === '/fontes') {
        return {
          data: {
            data: [
              {
                id_fonte: '5',
                nome: 'Guia de Profissões e Salários 2026',
                orgao: 'Ministério do Trabalho',
                url: 'https://exemplo.gov.br',
                consultado_em: '2026-11-01T10:00:00Z',
                demonstracao: false,
              },
            ],
            totalPages: 1,
          },
        };
      }
      return { data: { data: [], totalPages: 1 } };
    });

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        id_cargo: '88',
        nome: 'Engenheiro de Inteligência Artificial',
        area_atuacao: 'Tecnologia da Informação',
        salario_piso: 8000,
        salario_media: 13000,
        salario_teto: 20000,
        id_fonte: '5',
        descricao: 'Desenvolve modelos neurais e pipelines de aprendizado de máquina.',
        hard_skills: 'Python, PyTorch, Docker, MLOps',
        soft_skills: 'Resolução de problemas, Pensamento crítico, Colaboração',
        panorama_mercado: 'Mercado com alta demanda e escassez de profissionais qualificados.',
        rotas: [
          {
            nome: 'Trilha de IA e Engenharia',
            status: true,
            etapas: [{ id_curso: '10', ordem_etapa: 1, descricao: 'Graduação base em Computação' }],
          },
        ],
      },
    });

    renderWithProviders(<AdminDashboardPage />);

    // Clica na aba de Cadastrar cargo
    const tabCargo = await screen.findByRole('button', { name: /cadastrar cargo/i });
    fireEvent.click(tabCargo);

    // Preenche as informações do cargo
    const nomeInput = await screen.findByPlaceholderText(/nome do cargo/i);
    const areaInput = screen.getByPlaceholderText(/área de atuação/i);
    const pisoInput = screen.getByPlaceholderText(/salário piso/i);
    const mediaInput = screen.getByPlaceholderText(/salário médio/i);
    const tetoInput = screen.getByPlaceholderText(/salário teto/i);
    const selects = screen.getAllByRole('combobox');
    const fonteSelect = selects[0];
    const descInput = screen.getByPlaceholderText(/^descrição$/i);
    const hardSkillsInput = screen.getByPlaceholderText(/hard skills/i);
    const softSkillsInput = screen.getByPlaceholderText(/soft skills/i);
    const panoramaInput = screen.getByPlaceholderText(/panorama do mercado/i);

    fireEvent.change(nomeInput, { target: { value: 'Engenheiro de Inteligência Artificial' } });
    fireEvent.change(areaInput, { target: { value: 'Tecnologia da Informação' } });
    fireEvent.change(pisoInput, { target: { value: '8000' } });
    fireEvent.change(mediaInput, { target: { value: '13000' } });
    fireEvent.change(tetoInput, { target: { value: '20000' } });
    fireEvent.change(fonteSelect, { target: { value: '5' } });
    fireEvent.change(descInput, { target: { value: 'Desenvolve modelos neurais e pipelines de aprendizado de máquina.' } });
    fireEvent.change(hardSkillsInput, { target: { value: 'Python, PyTorch, Docker, MLOps' } });
    fireEvent.change(softSkillsInput, { target: { value: 'Resolução de problemas, Pensamento crítico, Colaboração' } });
    fireEvent.change(panoramaInput, { target: { value: 'Mercado com alta demanda e escassez de profissionais qualificados.' } });

    // Preenche a rota de formação obrigatória
    const rotaNomeInput = screen.getByPlaceholderText(/nome da rota/i);
    const cursoRotaSelect = selects[1];
    const ordemEtapaInput = screen.getByPlaceholderText(/ordem da etapa/i);
    const rotaDescInput = screen.getByPlaceholderText(/descrição da rota/i);
    const etapaDescInput = screen.getByPlaceholderText(/descrição da etapa/i);

    fireEvent.change(rotaNomeInput, { target: { value: 'Trilha de IA e Engenharia' } });
    fireEvent.change(cursoRotaSelect, { target: { value: '10' } });
    fireEvent.change(ordemEtapaInput, { target: { value: '1' } });
    fireEvent.change(rotaDescInput, { target: { value: 'Formação superior recomendada' } });
    fireEvent.change(etapaDescInput, { target: { value: 'Graduação base em Computação' } });

    const submitBtn = screen.getByRole('button', { name: /salvar cargo/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    // Valida envio à API e feedback visual
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/cargos', expect.objectContaining({
        nome: 'Engenheiro de Inteligência Artificial',
        area_atuacao: 'Tecnologia da Informação',
        salario_piso: 8000,
        salario_media: 13000,
        salario_teto: 20000,
        id_fonte: '5',
        descricao: 'Desenvolve modelos neurais e pipelines de aprendizado de máquina.',
        hard_skills: 'Python, PyTorch, Docker, MLOps',
        soft_skills: 'Resolução de problemas, Pensamento crítico, Colaboração',
        panorama_mercado: 'Mercado com alta demanda e escassez de profissionais qualificados.',
        rotas: [
          expect.objectContaining({
            nome: 'Trilha de IA e Engenharia',
            descricao: 'Formação superior recomendada',
            etapas: [
              expect.objectContaining({
                id_curso: '10',
                ordem_etapa: 1,
                descricao: 'Graduação base em Computação',
              }),
            ],
          }),
        ],
      }));
      expect(screen.getByText(/cargo cadastrado com sucesso/i)).toBeInTheDocument();
    });
  });
});

