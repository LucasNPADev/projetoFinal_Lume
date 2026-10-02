import { Link, Route, Routes } from "react-router-dom";
import { CarreirasPage } from "./pages/CarreirasPage";
import { HomePage } from "./pages/HomePage";
import { QuizPage } from "./pages/QuizPage";

export default function App() {
  return (
    <>
      <header>
        <strong>LUME</strong>
        <nav>
          <Link to="/">Início</Link>
          <Link to="/carreiras">Carreiras</Link>
          <Link to="/quiz">Quiz</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/carreiras" element={<CarreirasPage />} />
          <Route path="/quiz" element={<QuizPage />} />
        </Routes>
      </main>
    </>
  );
}