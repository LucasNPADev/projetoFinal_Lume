import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { api } from '../services/api';

interface Question {
  id_pergunta: string;
  enunciado: string;
}

interface QuestionsResponse {
  escala: Array<{ valor: number; rotulo: string }>;
  perguntas: Question[];
}

interface QuizResult {
  pontuacao_detalhada?: {
    area_maior_afinidade?: string;
    empate?: boolean;
    areas?: Array<{ area: string; percentual: number }>;
    orientacao?: string;
  };
}

export const QuizPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [scale, setScale] = useState<QuestionsResponse['escala']>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    api.get<QuestionsResponse>('/perguntas-vocacionais')
      .then(({ data }) => {
        if (!active) return;
        setQuestions(data.perguntas);
        setScale(data.escala);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setErrorMessage(
          axios.isAxiosError<{ error?: string }>(error)
            ? error.response?.data?.error ?? 'Não foi possível carregar o questionário.'
            : 'Não foi possível carregar o questionário.'
        );
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      const { data } = await api.post<QuizResult>('/teste-vocacional', {
        respostas: questions.map(question => ({
          id_pergunta: question.id_pergunta,
          valor: answers[question.id_pergunta]
        }))
      });
      setResult(data);
    } catch (error: unknown) {
      setErrorMessage(
        axios.isAxiosError<{ error?: string }>(error)
          ? error.response?.data?.error ?? 'Não foi possível enviar suas respostas.'
          : 'Não foi possível enviar suas respostas.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const detailed = result?.pontuacao_detalhada;

  return (
    <div className="student-page">
      <header className="student-header">
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Quiz vocacional</h1>
        <p style={{ marginTop: '6px', fontSize: '13px', fontWeight: '600' }}>Descubra suas afinidades e explore caminhos profissionais.</p>
      </header>

      <main className="student-main quiz-main">
        <div className="quiz-intro">
          <span className="eyebrow">ORIENTAÇÃO VOCACIONAL</span>
          <h2>Responda com sinceridade</h2>
          <p>Classifique cada afirmação conforme seu interesse. Seu resultado será calculado com base nas perguntas ativas cadastradas no LUME.</p>
        </div>

        {loading && <p role="status">Carregando perguntas...</p>}
        {errorMessage && <div role="alert" className="notice notice--error">{errorMessage}</div>}
        {!loading && !errorMessage && questions.length === 0 && (
          <div className="detail-section">O questionário ainda não está disponível.</div>
        )}

        {result && (
          <section className="quiz-result">
            <span className="quiz-result__icon" aria-hidden="true">🎯</span>
            <h2>Resultado do seu teste</h2>
            {detailed?.area_maior_afinidade
              ? <h3>Maior afinidade: {detailed.area_maior_afinidade}{detailed.empate ? ' (empate)' : ''}</h3>
              : <p>O teste foi salvo. Não foi possível ler os detalhes do resultado.</p>}
            {detailed?.areas?.map(area => (
              <div className="quiz-area-result" key={area.area}>
                <div><strong>{area.area}</strong><span>{area.percentual}%</span></div>
                <div className="quiz-progress"><span style={{ width: `${Math.min(100, Math.max(0, area.percentual))}%` }} /></div>
              </div>
            ))}
            {detailed?.orientacao && <p>{detailed.orientacao}</p>}
            <button type="button" className="primary-button" onClick={() => { setResult(null); setAnswers({}); }}>
              Refazer teste
            </button>
          </section>
        )}

        {!loading && !result && questions.map((question, index) => (
          <article className="quiz-question" key={question.id_pergunta}>
            <div className="quiz-question__heading">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{question.enunciado}</p>
            </div>
            <p className="quiz-scale-label">
              {scale.find(item => item.valor === 1)?.rotulo ?? 'Pouco interesse'}
              {' → '}
              {scale.find(item => item.valor === 5)?.rotulo ?? 'Muito interesse'}
            </p>
            <div className="quiz-scale" role="group" aria-label={`Resposta da pergunta ${index + 1}`}>
              {scale.map(item => (
                <button
                  type="button"
                  key={item.valor}
                  aria-pressed={answers[question.id_pergunta] === item.valor}
                  className={answers[question.id_pergunta] === item.valor ? 'is-selected' : ''}
                  onClick={() => setAnswers(current => ({ ...current, [question.id_pergunta]: item.valor }))}
                >
                  <strong>{item.valor}</strong>
                  <span>{item.rotulo}</span>
                </button>
              ))}
            </div>
          </article>
        ))}

        {!loading && !result && questions.length > 0 && (
          <button
            type="button"
            className="primary-button quiz-submit"
            onClick={() => void handleSubmitQuiz()}
            disabled={Object.keys(answers).length !== questions.length || submitting}
          >
            {submitting ? 'Enviando...' : 'Ver meu resultado →'}
          </button>
        )}
      </main>
    </div>
  );
};
