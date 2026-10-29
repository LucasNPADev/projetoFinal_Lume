import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import lumeLogo from '../assets/lume-logo.png';

const links = [
  { label: 'Faculdades', route: '/faculdades' },
  { label: 'Cursos', route: '/cursos' },
  { label: 'Quiz vocacional', route: '/quiz' },
  { label: 'Carreiras', route: '/carreiras' },
  { label: 'Favoritos', route: '/favoritos' },
  { label: 'Perfil', route: '/perfil' },
];

export const StudentNavigation: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || user?.perfil !== 'ESTUDANTE') return null;

  return (
    <nav className="student-navigation" aria-label="Navegação principal">
      <div className="student-navigation__inner">
        <NavLink to="/faculdades" className="student-navigation__brand" aria-label="LUME — GPS de Carreira">
          <img src={lumeLogo} alt="LUME — GPS de Carreira" />
        </NavLink>
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
      </div>
    </nav>
  );
};
