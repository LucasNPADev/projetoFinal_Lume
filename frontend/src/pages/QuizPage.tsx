import { useEffect, useState } from "react";
import { api } from "../services/api";
type Pergunta = { id:number; pergunta:string; opcoes:string[] };
export function QuizPage() {
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  useEffect(() => { api.get<Pergunta[]>("/quiz/perguntas").then(r => setPerguntas(r.data)).catch(() => setPerguntas([])); }, []);
  return <section className="page"><span className="eyebrow">QUIZ VOCACIONAL</span><h1>Descubra possibilidades de carreira</h1>
    <p>As respostas ajudam a priorizar áreas de afinidade; elas não eliminam possibilidades.</p>
    {perguntas.map(p => <article className="card" key={p.id}><strong>{p.pergunta}</strong><div className="options">{p.opcoes.map(opcao => <button key={opcao} type="button">{opcao}</button>)}</div></article>)}
  </section>;
}