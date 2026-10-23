import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface RecoveryResponse {
  mensagem: string;
  token_desenvolvimento?: string;
}

export const RecoverPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [developmentToken, setDevelopmentToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setErrorMessage('');
    setDevelopmentToken('');
    setSubmitting(true);
    try {
      const response = await api.post<RecoveryResponse>('/usuarios/recuperar-senha', { email });
      setMessage(response.data.mensagem);
      setDevelopmentToken(response.data.token_desenvolvimento ?? '');
    } catch (error: unknown) {
      setErrorMessage(
        axios.isAxiosError<{ error?: string }>(error)
          ? error.response?.data?.error ?? 'Não foi possível solicitar a recuperação.'
          : 'Não foi possível solicitar a recuperação.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: '#F1F0F7', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
      <section style={{ width: '100%', maxWidth: '440px', background: '#FFF', padding: '36px', borderRadius: '12px', border: '1px solid #E0DFF0' }}>
        <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#7B7B96' }}>RECUPERAÇÃO DE ACESSO</span>
        <h1 style={{ fontSize: '26px', color: '#1C1C2E', margin: '8px 0 12px' }}>Trocar senha</h1>
        <p style={{ color: '#7B7B96', fontSize: '14px', marginBottom: '24px' }}>
          Informe o e-mail da sua conta. Se ele estiver cadastrado, enviaremos instruções para criar uma nova senha.
        </p>
        {message && <p role="status" style={{ background: '#DCFCE7', color: '#15803D', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{message}</p>}
        {errorMessage && <p role="alert" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{errorMessage}</p>}
        {developmentToken && (
          <button type="button" onClick={() => navigate(`/redefinir-senha?token=${encodeURIComponent(developmentToken)}`)} style={{ width: '100%', minHeight: '44px', marginBottom: '16px', border: 0, borderRadius: '8px', background: '#EDEB80', color: '#1C1C2E', fontWeight: 'bold', cursor: 'pointer' }}>
            Continuar para criar nova senha (ambiente de desenvolvimento)
          </button>
        )}
        <form onSubmit={handleSubmit}>
          <label htmlFor="recovery-email" style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#7B7B96', marginBottom: '6px' }}>E-MAIL</label>
          <input id="recovery-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required style={{ boxSizing: 'border-box', width: '100%', height: '48px', borderRadius: '8px', border: '1px solid #E0DFF0', padding: '0 14px', marginBottom: '16px' }} />
          <button type="submit" disabled={submitting} style={{ width: '100%', height: '48px', borderRadius: '8px', border: 0, background: '#1C1C2E', color: '#EDEB80', fontWeight: 'bold', cursor: submitting ? 'wait' : 'pointer' }}>
            {submitting ? 'Enviando...' : 'Enviar instruções'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          <Link to="/" style={{ color: '#1C1C2E', fontWeight: 'bold' }}>Voltar para o login</Link>
        </div>
      </section>
    </main>
  );
};
