import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLoginPage } from '../pages/AuthLoginPage';
import { UniversitiesPage } from '../pages/UniversitiesPage';
import { UniversityDetailPage } from '../pages/UniversityDetailPage';
import { QuizPage } from '../pages/QuizPage';
import { CareersPage } from '../pages/CareersPage';
import { CoursesPage } from '../pages/CoursesPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { ProfilePage } from '../pages/ProfilePage';
import { AdminLoginPage } from '../pages/AdminLoginPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { SiteRegistrationPage } from '../pages/SiteRegistrationPage';
import { RecoverPasswordPage } from '../pages/RecoverPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { useAuth } from '../hooks/useAuth';

const PrivateRoute: React.FC<{ element: React.ReactElement; adminOnly?: boolean }> = ({ element, adminOnly }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div>Carregando LUME...</div>;
  if (!isAuthenticated) return <Navigate to="/" />;
  if (adminOnly && user?.perfil !== 'ADMIN') return <Navigate to="/faculdades" />;

  return element;
};

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthLoginPage />} />
        <Route path="/recuperar-senha" element={<RecoverPasswordPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route path="/faculdades" element={<PrivateRoute element={<UniversitiesPage />} />} />
        <Route path="/faculdade/:id" element={<PrivateRoute element={<UniversityDetailPage />} />} />
        <Route path="/quiz" element={<PrivateRoute element={<QuizPage />} />} />
        <Route path="/carreiras" element={<PrivateRoute element={<CareersPage />} />} />
        <Route path="/cursos" element={<PrivateRoute element={<CoursesPage />} />} />
        <Route path="/favoritos" element={<PrivateRoute element={<FavoritesPage />} />} />
        <Route path="/perfil" element={<PrivateRoute element={<ProfilePage />} />} />

        <Route path="/admin/dashboard" element={<PrivateRoute element={<AdminDashboardPage />} adminOnly />} />
        <Route path="/admin/cadastrar-instituicao" element={<PrivateRoute element={<SiteRegistrationPage />} adminOnly />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};