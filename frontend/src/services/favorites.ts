import { api } from './api';

export const toggleFavorite = async (tipo: 'CARGO' | 'CURSO' | 'INSTITUICAO', id: string, currentlyFav?: boolean) => {
  try {
    if (currentlyFav) {
      await api.delete(`/favoritos/${id}`);
      return false;
    } else {
      await api.post('/favoritos', { tipo, id });
      return true;
    }
  } catch {
    return !currentlyFav;
  }
};