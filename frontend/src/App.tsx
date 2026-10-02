import { Link } from "react-router-dom";
import { AppRoutes } from "./routes";

export default function App() {
  return (
    <>
      <header>
        <strong>LUME</strong>
        <nav>
          <Link to="/">Início</Link>
          <Link to="/carreiras">Carreiras</Link>
          <Link to="/cursos">Cursos</Link>
          <Link to="/instituicoes">Instituições</Link>
          <Link to="/quiz">Quiz</Link>
          <Link to="/perfil">Perfil</Link>
        </nav>
      </header>
      <main>
        <AppRoutes />
      </main>
    </>
  );
}
