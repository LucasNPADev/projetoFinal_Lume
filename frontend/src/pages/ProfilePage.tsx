import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { BottomNav } from '../components/BottomNav';

export const ProfilePage: React.FC = () => {
  const { logout, user } = useAuth();

  return (
    <div style={{ paddingBottom: '100px', minHeight: '100vh', background: '#F1F0F7' }}>
      <header style={{ background: 'linear-gradient(135deg, #EDEB80 0%, #dfdb57 100%)', padding: '32px 88px 80px 88px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Meu Perfil</h1>
        <button onClick={logout} style={{ background: 'rgba(28,28,46,0.12)', padding: '6px 18px', borderRadius: '15px', fontWeight: 'bold', fontSize: '11px' }}>Sair</button>
      </header>

      <main style={{ padding: '0 88px', marginTop: '-50px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#4338CA', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '28px', border: '4px solid #FFF' }}>
            {user?.nome ? user.nome.substring(0, 2).toUpperCase() : 'US'}
          </div>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold' }}>{user?.nome || 'Estudante LUME'}</h2>
            <p style={{ fontSize: '14px', color: '#7B7B96' }}>{user?.email} · {user?.cidade || 'São Paulo'}, {user?.estado || 'SP'}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#FFF', padding: '16px', borderRadius: '10px', border: '1px solid #E0DFF0', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>2</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#7B7B96' }}>FACULDADES FAVORITAS</div>
          </div>
          <div style={{ background: '#FFF', padding: '16px', borderRadius: '10px', border: '1px solid #E0DFF0', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>1</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#7B7B96' }}>QUIZ REALIZADO</div>
          </div>
          <div style={{ background: '#FFF', padding: '16px', borderRadius: '10px', border: '1px solid #E0DFF0', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>12</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#7B7B96' }}>CURSOS RECOMENDADOS</div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};