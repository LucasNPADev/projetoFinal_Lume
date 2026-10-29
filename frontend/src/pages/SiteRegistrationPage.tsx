import React from 'react';
import { useNavigate } from 'react-router-dom';

export const SiteRegistrationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-page" style={{ minHeight: '100vh', background: '#F1F0F7' }}>
      <header className="admin-header" style={{ background: 'linear-gradient(135deg, #EDEB80 0%, #E0DC5A 100%)', padding: '24px 88px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/admin/dashboard')} style={{ background: 'transparent', fontWeight: 'bold', fontSize: '14px' }}>← Voltar / Cadastrar Instituição</button>
      </header>

      <main className="admin-main" style={{ padding: '32px 88px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ background: '#FFF', borderRadius: '12px', padding: '32px', border: '1px solid #E0DFF0' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Cadastro Simplificado de Instituição</h2>
          <p style={{ color: '#7B7B96', fontSize: '14px', marginBottom: '24px' }}>Utilize o painel principal do administrador para gerenciar e cadastrar instituições com geolocalização e nota MEC completa.</p>
          <button onClick={() => navigate('/admin/dashboard')} style={{ width: '100%', height: '48px', borderRadius: '8px', background: '#1C1C2E', color: '#EDEB80', fontWeight: 'bold' }}>
            Ir para o Dashboard Administrativo →
          </button>
        </div>
      </main>
    </div>
  );
};