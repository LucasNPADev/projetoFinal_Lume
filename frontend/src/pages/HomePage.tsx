import { Link } from "react-router-dom";
export function HomePage() {
  return <section className="page">
    <span className="eyebrow">GPS DE CARREIRA</span>
    <h1>Descubra caminhos de formação que combinam com você.</h1>
    <p>Explore carreiras, cursos e instituições e use o quiz vocacional para organizar suas possibilidades.</p>
    <div className="actions">
      <Link className="button" to="/quiz">Começar Quiz</Link>
      <Link className="button secondary" to="/carreiras">Explorar carreiras</Link>
    </div>
  </section>;
}