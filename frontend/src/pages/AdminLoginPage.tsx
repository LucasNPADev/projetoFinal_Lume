import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await login(email, senha, true);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Credenciais de administrador inválidas.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
      <div style={{ width: '440px', background: 'linear-gradient(135deg, #EDEB80 0%, #E0DC5A 100%)', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: 'rgba(28,28,46,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>L</div>
            <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#1C1C2E' }}>LUME Admin</span>
          </div>
          <span style={{ background: 'rgba(28,28,46,0.1)', padding: '6px 14px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}>ÁREA RESTRITA</span>
          <h1 style={{ fontSize: '34px', fontWeight: 'bold', marginTop: '24px', lineHeight: '1.2', color: '#1C1C2E' }}>Gestão segura do conteúdo LUME</h1>
        </div>
      </div>

      <div style={{ flex: 1, background: '#F1F0F7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleAdminLogin} style={{ width: '400px' }}>
          {errorMessage && (
            <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', color: '#991B1B', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', fontWeight: 'bold' }}>
              ⚠️ {errorMessage}
            </div>
          )}

          <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#7B7B96' }}>PAINEL ADMINISTRATIVO</span>
          <h2 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1C1C2E', marginTop: '8px' }}>Acesse sua conta</h2>

          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#7B7B96', letterSpacing: '1.2px', marginTop: '24px', display: 'block' }}>E-MAIL ADMINISTRATIVO</label>
          <input type="email" placeholder="admin@lume.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', height: '48px', borderRadius: '10px', border: '2px solid #E0DFF0', padding: '0 16px', margin: '8px 0 16px 0', background: '#FFF' }} />

          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#7B7B96', letterSpacing: '1.2px' }}>SENHA</label>
          <input type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} required style={{ width: '100%', height: '48px', borderRadius: '10px', border: '2px solid #E0DFF0', padding: '0 16px', margin: '8px 0 24px 0', background: '#FFF' }} />

          <button type="submit" style={{ width: '100%', height: '52px', borderRadius: '10px', background: '#EDEB80', color: '#1C1C2E', fontWeight: 'bold', fontSize: '14px' }}>Entrar no painel</button>
        </form>
      </div>
    </div>
  );
};