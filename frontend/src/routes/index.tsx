import { Link, Route, Routes } from "react-router-dom";
import { CarreirasPage } from "../pages/CarreirasPage";
import { HomePage } from "../pages/HomePage";
import { QuizPage } from "../pages/QuizPage";

function EmDesenvolvimentoPage({ titulo }: { titulo: string }) {
  return (
    <section className="page">
      <span className="eyebrow">LUME</span>
      <h1>{titulo}</h1>
      <p>Esta área faz parte do fluxo do LUME e será implementada nas próximas etapas.</p>
      <Link className="button" to="/">Voltar para o início</Link>
    </section>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<EmDesenvolvimentoPage titulo="Login" />} />
      <Route path="/cadastro" element={<EmDesenvolvimentoPage titulo="Cadastro" />} />
      <Route path="/perfil" element={<EmDesenvolvimentoPage titulo="Meu perfil" />} />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="/quiz/resultado" element={<EmDesenvolvimentoPage titulo="Resultado do quiz" />} />
      <Route path="/carreiras" element={<CarreirasPage />} />
      <Route path="/carreiras/:id" element={<EmDesenvolvimentoPage titulo="Detalhes da carreira" />} />
      <Route path="/cursos" element={<EmDesenvolvimentoPage titulo="Cursos" />} />
      <Route path="/cursos/:id" element={<EmDesenvolvimentoPage titulo="Detalhes do curso" />} />
      <Route path="/instituicoes" element={<EmDesenvolvimentoPage titulo="Instituições" />} />
      <Route path="/instituicoes/:id" element={<EmDesenvolvimentoPage titulo="Detalhes da instituição" />} />
      <Route path="*" element={<EmDesenvolvimentoPage titulo="Página não encontrada" />} />
    </Routes>
  );
}
