import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import lumeLogo from '../assets/lume-logo.png';

const links = [
  { label: 'Faculdades', route: '/faculdades' },
  { label: 'Quiz', route: '/quiz' },
  { label: 'Carreiras', route: '/carreiras' },
  { label: 'Perfil', route: '/perfil' },
];

export const StudentNavigation: React.FC<{ inHeader?: boolean }> = ({ inHeader = false }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || user?.perfil !== 'ESTUDANTE') return null;
  const firstName = user.nome.trim().split(/\s+/)[0] || 'Estudante';
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <nav className={`student-navigation${inHeader ? ' student-navigation--in-header' : ''}`} aria-label="Navegação principal">
      <div className="student-navigation__inner">
        {!inHeader && (
          <NavLink to="/faculdades" className="student-navigation__brand" aria-label="LUME — GPS de Carreira">
            <img src={lumeLogo} alt="LUME — GPS de Carreira" />
          </NavLink>
        )}
        <div className="student-navigation__links">
          {links.map(({ label, route }) => (
            <NavLink
              key={route}
              to={route}
              end={route === '/faculdades'}
              className={({ isActive }) =>
                `student-navigation__link${isActive ? ' student-navigation__link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
        <div className="student-navigation__actions">
          <NavLink to="/perfil" className="student-navigation__user" aria-label={`Abrir perfil de ${user.nome}`}>
            <span className="student-navigation__avatar" aria-hidden="true">{initial}</span>
            <span className="student-navigation__user-name">{firstName}</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
};
