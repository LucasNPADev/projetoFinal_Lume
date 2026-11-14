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

describe('CT013 - Cadastramento de Instituições de Ensino e Inclusão de Cursos (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite ao administrador cadastrar uma nova instituição de ensino com dados completos e validação MEC', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { data: [], totalPages: 1 },
    });

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        id_instituicao: '101',
        nome_instituicao: 'Faculdade de Tecnologia LUME',
        cnpj: '11222333000181',
        nota_mec: 5,
        natureza: 'PRIVADA',
        telefone: '1133334444',
        celular: '11999998888',
        email: 'contato@faculdadelume.edu.br',
        rua: 'Avenida Paulista, 1000',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        estado: 'SP',
        regular_mec: true,
        status: true,
      },
    });

    renderWithProviders(<AdminDashboardPage />);

    // Por padrão a aba inicial é INSTITUICAO
    const nomeInput = await screen.findByPlaceholderText(/nome da instituição/i);
    const cnpjInput = screen.getByPlaceholderText(/cnpj/i);
    const telInput = screen.getByPlaceholderText(/^telefone$/i);
    const celInput = screen.getByPlaceholderText(/celular\/whatsapp/i);
    const emailInput = screen.getByPlaceholderText(/e-mail institucional/i);
    const notaMecInput = screen.getByPlaceholderText(/nota mec/i);
    const ruaInput = screen.getByPlaceholderText(/^rua$/i);
    const bairroInput = screen.getByPlaceholderText(/^bairro$/i);
    const cidadeInput = screen.getByPlaceholderText(/^cidade$/i);
    const ufInput = screen.getByPlaceholderText(/^uf$/i);
    const checkboxRegularMec = screen.getByLabelText(/instituição regularizada no mec/i);

    fireEvent.change(nomeInput, { target: { value: 'Faculdade de Tecnologia LUME' } });
    fireEvent.change(cnpjInput, { target: { value: '11.222.333/0001-81' } });
    fireEvent.change(telInput, { target: { value: '(11) 3333-4444' } });
    fireEvent.change(celInput, { target: { value: '(11) 99999-8888' } });
    fireEvent.change(emailInput, { target: { value: 'contato@faculdadelume.edu.br' } });
    fireEvent.change(notaMecInput, { target: { value: '5' } });
    fireEvent.change(ruaInput, { target: { value: 'Avenida Paulista, 1000' } });
    fireEvent.change(bairroInput, { target: { value: 'Bela Vista' } });
    fireEvent.change(cidadeInput, { target: { value: 'São Paulo' } });
    fireEvent.change(ufInput, { target: { value: 'SP' } });

    if (!(checkboxRegularMec as HTMLInputElement).checked) {
      fireEvent.click(checkboxRegularMec);
    }

    const submitBtn = screen.getByRole('button', { name: /salvar instituição/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/instituicoes', expect.objectContaining({
        nome_instituicao: 'Faculdade de Tecnologia LUME',
        cnpj: '11.222.333/0001-81',
        regular_mec: true,
      }));
      expect(screen.getByText(/instituição cadastrada com sucesso/i)).toBeInTheDocument();
    });
  });

  it('permite ao administrador vincular um curso a uma instituição cadastrada gerando uma oferta', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/instituicoes') {
        return {
          data: {
            data: [
              {
                id_instituicao: '55',
                nome_instituicao: 'Instituto Federal Tecnológico',
                cnpj: '00000000000191',
                natureza: 'PRIVADA',
                regular_mec: true,
                status: true,
              },
            ],
            totalPages: 1,
          },
        };
      }
      if (url === '/cursos') {
        return {
          data: {
            data: [
              {
                id_curso: '88',
                nome_curso: 'Engenharia da Computação',
                modalidade: 'PRESENCIAL',
                status: true,
              },
            ],
            totalPages: 1,
          },
        };
      }
      if (url === '/fontes') {
        return { data: { data: [], totalPages: 1 } };
      }
      return { data: { data: [], totalPages: 1 } };
    });

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        id_curso_instituicao: '300',
        id_instituicao: '55',
        id_curso: '88',
        mensalidade: 650,
        formas_ingresso: 'Vestibular agendado e nota do ENEM',
        status: true,
      },
    });

    renderWithProviders(<AdminDashboardPage />);

    // Clica na aba de Vincular curso à faculdade (OFERTA)
    const tabOferta = await screen.findByRole('button', { name: /vincular curso à faculdade/i });
    fireEvent.click(tabOferta);

    // Seleciona instituição e curso nos dropdowns
    const selects = await screen.findAllByRole('combobox');
    const instSelect = selects[0];
    const cursoSelect = selects[1];

    fireEvent.change(instSelect, { target: { value: '55' } });
    fireEvent.change(cursoSelect, { target: { value: '88' } });

    // Preenche mensalidade e formas de ingresso
    const mensalidadeInput = screen.getByPlaceholderText(/mensalidade mínima/i);
    const formasIngressoInput = screen.getByPlaceholderText(/formas de ingresso/i);

    fireEvent.change(mensalidadeInput, { target: { value: '650' } });
    fireEvent.change(formasIngressoInput, { target: { value: 'Vestibular agendado e nota do ENEM' } });

    const submitBtn = screen.getByRole('button', { name: /^vincular curso$/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/ofertas', expect.objectContaining({
        id_instituicao: '55',
        id_curso: '88',
        mensalidade: 650,
        formas_ingresso: 'Vestibular agendado e nota do ENEM',
      }));
      expect(screen.getByText(/curso vinculado à instituição com sucesso/i)).toBeInTheDocument();
    });
  });
});

