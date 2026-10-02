import { Link, Route, Routes } from "react-router-dom";
import { HomePage } from "../pages/HomePage"; import { CarreirasPage } from "../pages/CarreirasPage"; import { CarreiraDetalhePage } from "../pages/CarreiraDetalhePage";
import { CursosPage } from "../pages/CursosPage"; import { CursoPage } from "../pages/CursoPage"; import { InstituicoesPage } from "../pages/InstituicoesPage"; import { InstituicaoPage } from "../pages/InstituicaoPage";
import { QuizPage } from "../pages/QuizPage"; import { QuizResultadoPage } from "../pages/QuizResultadoPage"; import { PerfilPage } from "../pages/PerfilPage"; import { AuthPage } from "../pages/AuthPage";
function NotFound(){return <section className="page"><h1>Página não encontrada</h1><Link to="/">Voltar ao início</Link></section>}
export function AppRoutes(){return <Routes>
<Route path="/" element={<HomePage/>}/><Route path="/login" element={<AuthPage modo="login"/>}/><Route path="/cadastro" element={<AuthPage modo="cadastro"/>}/><Route path="/perfil" element={<PerfilPage/>}/>
<Route path="/quiz" element={<QuizPage/>}/><Route path="/quiz/resultado" element={<QuizResultadoPage/>}/>
<Route path="/carreiras" element={<CarreirasPage/>}/><Route path="/carreiras/:id" element={<CarreiraDetalhePage/>}/>
<Route path="/cursos" element={<CursosPage/>}/><Route path="/cursos/:id" element={<CursoPage/>}/>
<Route path="/instituicoes" element={<InstituicoesPage/>}/><Route path="/instituicoes/:id" element={<InstituicaoPage/>}/>
<Route path="*" element={<NotFound/>}/></Routes>}
