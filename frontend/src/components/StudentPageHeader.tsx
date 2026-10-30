import React from 'react';
import lumeLogo from '../assets/lume-logo.png';
import { StudentNavigation } from './StudentNavigation';

interface StudentPageHeaderProps {
  title: string;
  subtitle?: string;
  search?: React.ReactNode;
  action?: React.ReactNode;
}

export const StudentPageHeader: React.FC<StudentPageHeaderProps> = ({
  title,
  subtitle,
  search,
  action,
}) => (
  <header className={`student-page-header${search ? ' student-page-header--search' : ''}${action ? ' student-page-header--action' : ''}`}>
    <div className="student-page-header__title">
      <img src={lumeLogo} alt="LUME — GPS de Carreira" />
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </div>
    {search ? <div className="student-page-header__search">{search}</div> : null}
    <StudentNavigation inHeader />
    {action ? <div className="student-page-header__action">{action}</div> : null}
  </header>
);
