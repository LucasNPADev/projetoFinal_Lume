import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { label: 'Faculdades', route: '/faculdades' },
    { label: 'Cursos', route: '/cursos' },
    { label: 'Quiz', route: '/quiz' },
    { label: 'Carreiras', route: '/carreiras' },
    { label: 'Favoritos', route: '/favoritos' },
    { label: 'Perfil', route: '/perfil' },
  ];

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px', background: '#FFF', borderTop: '1px solid #E0DFF0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 100 }}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.route;
        return (
          <div key={tab.route} onClick={() => navigate(tab.route)} style={{ textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: isActive ? '#1C1C2E' : '#7B7B96' }}>{tab.label}</div>
            {isActive && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EDEB80', margin: '4px auto 0 auto' }} />}
          </div>
        );
      })}
    </nav>
  );
};