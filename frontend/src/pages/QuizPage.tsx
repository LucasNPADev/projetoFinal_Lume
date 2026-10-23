import React, { useState } from 'react';
import { BottomNav } from '../components/BottomNav';
import { QuizQuestion } from '../types';
import { api } from '../services/api';

const mockQuestions: QuizQuestion[] = [
  { id: '1', enunciado: 'Tenho interesse em manipular dados e criar algoritmos', area_afinidade: 'Tecnologia', status: true },
  { id: '2', enunciado: 'Gosto de cuidar de pessoas e estudar processos biológicos', area_afinidade: 'Saúde', status: true },
  { id: '3', enunciado: 'Prefiro trabalhar com gestão financeira e planejamento de negócios', area_afinidade: 'Negócios', status: true },
];

export const QuizPage: React.FC = () => {
  const [questions] = useState<QuizQuestion[]>(mockQuestions);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelectScore = (questionId: string, score: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: score }));
  };

  const handleSubmitQuiz = async () => {
    setLoading(true);
    const payload = {
      respostas: Object.entries(answers).map(([id_pergunta, valor]) => ({
        id_pergunta,
        valor
      }))
    };

    try {
      await api.post('/teste-vocacional', payload);
    } catch {
      // Fallback para testes
    } finally {
      setLoading(false);
      setFinished(true);
    }
  };

  return (
    <div style={{ paddingBottom: '100px', minHeight: '100vh', background: '#F1F0F7' }}>
      <header style={{ background: 'linear-gradient(135deg, #EDEB80 0%, #E0DC5A 100%)', padding: '24px 88px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Quiz Vocacional LUME</h1>
      </header>

      <main style={{ padding: '32px 88px', maxWidth: '800px', margin: '0 auto' }}>
        {!finished ? (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Responda com base na sua afinidade</h2>
            <p style={{ color: '#7B7B96', fontSize: '14px', marginBottom: '24px' }}>Classifique de 1 (Pouco Interesse) a 5 (Muito Interesse):</p>

            {questions.map((q, idx) => (
              <div key={q.id} style={{ background: '#FFF', padding: '20px', borderRadius: '12px', border: '1px solid #E0DFF0', marginBottom: '16px' }}>
                <p style={{ fontWeight: 'bold', fontSize: '15px', color: '#1C1C2E' }}>{idx + 1}. {q.enunciado}</p>
                <span style={{ fontSize: '11px', color: '#7B7B96', fontWeight: 'bold' }}>ÁREA: {q.area_afinidade}</span>

                <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button key={val} onClick={() => handleSelectScore(q.id, val)} style={{ flex: 1, height: '40px', borderRadius: '8px', background: answers[q.id] === val ? '#1C1C2E' : '#F1F0F7', color: answers[q.id] === val ? '#EDEB80' : '#1C1C2E', fontWeight: 'bold' }}>
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button onClick={handleSubmitQuiz} disabled={Object.keys(answers).length < questions.length || loading} style={{ width: '100%', height: '52px', borderRadius: '10px', background: '#1C1C2E', color: '#EDEB80', fontWeight: 'bold', opacity: Object.keys(answers).length < questions.length ? 0.5 : 1 }}>
              {loading ? 'Enviando...' : 'Finalizar Teste Vocacional →'}
            </button>
          </div>
        ) : (
          <div style={{ background: '#FFF', padding: '32px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E0DFF0' }}>
            <span style={{ fontSize: '40px' }}>🎯</span>
            <h2 style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '12px' }}>Resultado Processado!</h2>
            <p style={{ color: '#7B7B96', marginTop: '8px' }}>Seu perfil indicou forte inclinação para a área de **Tecnologia & Inovação**.</p>
            <button onClick={() => { setFinished(false); setAnswers({}); }} style={{ marginTop: '24px', padding: '12px 24px', borderRadius: '10px', background: '#EDEB80', color: '#1C1C2E', fontWeight: 'bold' }}>
              Refazer Teste
            </button>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};