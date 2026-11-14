import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

interface ResetResponse {
  mensagem: string;
}

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setErrorMessage('');
    if (password !== passwordConfirmation) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }
    if (!token) {
      setErrorMessage('Link de redefinição inválido. Solicite uma nova recuperação.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post<ResetResponse>('/usuarios/redefinir-senha', {
        token,
        nova_senha: password
      });
      setMessage(response.data.mensagem);
      window.setTimeout(() => navigate('/'), 1800);
    } catch (error: unknown) {
      setErrorMessage(
        axios.isAxiosError<{ error?: string; detalhes?: Array<{ mensagem: string }> }>(error)
          ? error.response?.data?.detalhes?.map(detail => detail.mensagem).join('; ')
            ?? error.response?.data?.error
            ?? 'Não foi possível redefinir a senha.'
          : 'Não foi possível redefinir a senha.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: '#F1F0F7', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
      <section style={{ width: '100%', maxWidth: '440px', background: '#FFF', padding: '36px', borderRadius: '12px', border: '1px solid #E0DFF0' }}>
        <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#7B7B96' }}>NOVA SENHA</span>
        <h1 style={{ fontSize: '26px', color: '#1C1C2E', margin: '8px 0 12px' }}>Crie sua nova senha</h1>
        <p style={{ color: '#7B7B96', fontSize: '14px', marginBottom: '24px' }}>A senha deve ter pelo menos 8 caracteres.</p>
        {message && <p role="status" style={{ background: '#DCFCE7', color: '#15803D', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{message}</p>}
        {errorMessage && <p role="alert" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{errorMessage}</p>}
        <form onSubmit={handleSubmit}>
          <label htmlFor="new-password" style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#7B7B96', marginBottom: '6px' }}>NOVA SENHA</label>
          <input id="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={event => setPassword(event.target.value)} required style={{ boxSizing: 'border-box', width: '100%', height: '48px', borderRadius: '8px', border: '1px solid #E0DFF0', padding: '0 14px', marginBottom: '16px' }} />
          <label htmlFor="confirm-password" style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#7B7B96', marginBottom: '6px' }}>CONFIRMAR NOVA SENHA</label>
          <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={passwordConfirmation} onChange={event => setPasswordConfirmation(event.target.value)} required style={{ boxSizing: 'border-box', width: '100%', height: '48px', borderRadius: '8px', border: '1px solid #E0DFF0', padding: '0 14px', marginBottom: '16px' }} />
          <button type="submit" disabled={submitting || !token} style={{ width: '100%', height: '48px', borderRadius: '8px', border: 0, background: '#1C1C2E', color: '#EDEB80', fontWeight: 'bold', cursor: submitting ? 'wait' : 'pointer', opacity: !token ? 0.6 : 1 }}>
            {submitting ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          <Link to="/recuperar-senha" style={{ color: '#1C1C2E', fontWeight: 'bold' }}>Solicitar outro link</Link>
        </div>
      </section>
    </main>
  );
};
