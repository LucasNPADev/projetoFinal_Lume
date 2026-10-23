export interface User {
  id: string;
  nome: string;
  email: string;
  perfil: 'ESTUDANTE' | 'ADMIN';
  rua?: string;
  cidade?: string;
  estado?: string;
  bairro?: string;
  latitude?: number;
  longitude?: number;
}

export interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
  rua: string;
  cidade: string;
  estado: string;
  bairro: string;
  latitude: number;
  longitude: number;
  aceitou_termos: boolean;
}

export interface InstitutionPayload {
  nome_instituicao: string;
  cnpj: string;
  nota_mec: number;
  status: boolean;
  telefone: string;
  celular: string;
  email: string;
  rua: string;
  cidade: string;
  estado: string;
  bairro: string;
  latitude: number;
  longitude: number;
  regular_mec?: boolean;
  natureza?: 'PUBLICA' | 'PRIVADA';
}

export interface CoursePayload {
  nome_curso: string;
  grau_academico: string;
  modalidade: string;
  carga_horaria: number;
  area_curso: string;
  duracao_meses: number;
}

export interface CareerPayload {
  nome: string;
  area_atuacao: string;
  descricao: string;
  hard_skills: string;
  soft_skills: string;
  panorama_mercado: string;
  salario_piso: number;
  salario_media: number;
  salario_teto: number;
  id_fonte: string;
  status: boolean;
  rotas?: Array<{
    nome: string;
    descricao: string;
    status: boolean;
    etapas: Array<{ id_curso: string; ordem_etapa: number; descricao: string }>;
  }>;
}

export interface QuizQuestion {
  id: string;
  enunciado: string;
  area_afinidade: string;
  status: boolean;
}

export interface Institution {
  id: string;
  nome_instituicao: string;
  cnpj: string;
  nota_mec: number;
  telefone: string;
  celular: string;
  email: string;
  rua: string;
  cidade: string;
  estado: string;
  bairro: string;
  latitude: number;
  longitude: number;
  status?: boolean;
  favorito?: boolean;
}

export interface Career {
  id: string;
  nome: string;
  area_atuacao: string;
  descricao: string;
  hard_skills: string;
  soft_skills: string;
  panorama_mercado: string;
  salario_piso: number;
  salario_media: number;
  salario_teto: number;
  favorito?: boolean;
}

export interface Course {
  id: string;
  nome_curso: string;
  grau_academico: string;
  modalidade: string;
  carga_horaria: number;
  area_curso: string;
  duracao_meses: number;
  status?: boolean;
  favorito?: boolean;
}