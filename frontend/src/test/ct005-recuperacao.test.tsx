import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { RecoverPasswordPage } from '../pages/RecoverPasswordPage';
import { renderWithProviders } from './helpers';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('CT005 - Solicitação de recuperação de senha com e-mail válido (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite envio de e-mail de recuperação válido e exibe mensagem informativa', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        mensagem: 'Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.',
      },
    });

    renderWithProviders(<RecoverPasswordPage />);

    const emailInput = screen.getByLabelText(/e-mail/i);
    const submitBtn = screen.getByRole('button', { name: /enviar instruções/i });

    fireEvent.change(emailInput, { target: { value: 'recuperar@lume.com' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/usuarios/recuperar-senha', {
        email: 'recuperar@lume.com',
      });
      const statusMsg = screen.getByRole('status');
      expect(statusMsg).toBeInTheDocument();
      expect(statusMsg).toHaveTextContent(/instruções de recuperação/i);
    });
  });
});

