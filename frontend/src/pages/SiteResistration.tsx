import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const SiteRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [step] = useState(1);

  return (
    <div style={{ minHeight: '100vh', background: '#F1F0F7' }}>
      <header style={{ background: 'linear-gradient(135deg, #EDEB80 0%, #E0DC5A 100%)', padding: '24px 88px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/admin/dashboard')} style={{ background: 'transparent', fontWeight: 'bold', fontSize: '14px' }}>← Voltar / Cadastrar Instituição</button>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {['1. Instituição', '2. Responsável', '3. Acesso', '4. Confirmação'].map((st, i) => (
            <span key={i} style={{ fontSize: '12px', fontWeight: 'bold', opacity: i + 1 === step ? 1 : 0.5 }}>{st}</span>
          ))}
        </div>
      </header>

      <main style={{ padding: '32px 88px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ background: '#FFF', borderRadius: '12px', padding: '32px', border: '1px solid #E0DFF0' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#7B7B96', letterSpacing: '1.2px' }}>DADOS DA INSTITUIÇÃO</span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#7B7B96' }}>NOME DA INSTITUIÇÃO</label>
              <input type="text" placeholder="Faculdade Central do Brasil" style={{ width: '100%', height: '48px', borderRadius: '10px', border: '2px solid #E0DFF0', padding: '0 16px', marginTop: '8px' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#7B7B96' }}>CNPJ</label>
              <input type="text" placeholder="00.000.000/0001-00" style={{ width: '100%', height: '48px', borderRadius: '10px', border: '2px solid #E0DFF0', padding: '0 16px', marginTop: '8px' }} />
            </div>
          </div>

          <button onClick={() => navigate('/admin/dashboard')} style={{ width: '100%', height: '54px', borderRadius: '10px', background: '#1C1C2E', color: '#EDEB80', fontWeight: 'bold', fontSize: '14px', marginTop: '32px' }}>
            Continuar →
          </button>
        </div>
      </main>
    </div>
  );
};