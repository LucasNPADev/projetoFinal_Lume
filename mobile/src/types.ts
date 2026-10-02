export type Cargo = {
  id: number;
  nome: string;
  areaAtuacao: string;
  descricao?: string;
  salario?: string | number | null;
  faixaSalarial?: string | null;
};

export type Curso = {
  id: number;
  nome: string;
  area: string;
  cargaHoraria: number;
  modalidade: string;
  grauAcademico?: string | null;
  mensalidade?: string | number | null;
};

export type Instituicao = {
  id: number;
  nome: string;
  cidade: string;
  estado: string;
  status: boolean;
  notaAvaliacoes: string | number;
};

export type QuizQuestion = {
  id: number;
  pergunta: string;
  areaAfinidade: string;
  opcoes: { texto: string; area: string; peso: number }[];
};
