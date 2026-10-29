import axios from 'axios';

export function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ error?: string; message?: string; detalhes?: Array<{ mensagem: string }> }>(error)) {
    const response = error.response?.data;
    const details = response?.detalhes?.map((detail) => detail.mensagem).join('; ');
    return details || response?.error || response?.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
}
