import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import type { QuizQuestion } from '../types';

export function QuizTab({ questions }: { questions: QuizQuestion[] }) {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q: QuizQuestion | undefined = questions[qIdx];

  const getCityFlag = (cityId: string) => {
    if (cityId === 'utrecht') return '🇳🇱';
    if (cityId === 'lisbon') return '🇵🇹';
    if (cityId === 'chennai') return '🇮🇳';
    return '🌍';
  };

  const getCityName = (cityId: string) => {
    return cityId.charAt(0).toUpperCase() + cityId.slice(1);
  };

  const answer = (i: number) => {
    if (selected !== null || !q) return;
    setSelected(i);
    if (i === q.correct) setScore(s => s + 1);
    setTimeout(() => {
      if (qIdx + 1 >= questions.length) setDone(true);
      else { setQIdx(qIdx + 1); setSelected(null); }
    }, 2000);
  };

  const restart = () => { setQIdx(0); setSelected(null); setScore(0); setDone(false); };

  if (questions.length === 0) return (
    <div className="quiz-container">
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
        <HelpCircle size={48} color="var(--accent)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h3>Geen Quiz Vragen</h3>
        <p className="auth-hint">Gebruik de database tool om de quiz te vullen! 📚</p>
      </div>
    </div>
  );

  if (!q && !done) return <div className="glass-panel">Laden...</div>;

  return (
    <div className="quiz-container">
      <div className="glass-panel quiz-panel">
        <div className="panel-header"><HelpCircle className="panel-icon" size={22} /><h2>City Quiz</h2><span className={`fact-city-badge ${q?.cityId}`}>{getCityFlag(q?.cityId || '')} {getCityName(q?.cityId || '')}</span></div>
        {done ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{score >= Math.ceil(questions.length * 0.8) ? '🏆' : score >= Math.ceil(questions.length * 0.5) ? '🌟' : '📚'}</div>
            <h2 style={{ fontSize: '2rem', marginBottom: '.5rem' }}>{score} / {questions.length}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              {score >= Math.ceil(questions.length * 0.8) ? 'Geweldig! Echte cultuurkenner!' : score >= Math.ceil(questions.length * 0.5) ? 'Goed bezig!' : 'Blijf leren — DUPOIND helpt 😄'}
            </p>
            <button className="btn-kudos" style={{ width: 'auto', padding: '1rem 2.5rem', marginTop: 0 }} onClick={restart}>Nog een keer!</button>
          </div>
        ) : (
          <>
            <div className="quiz-progress">
              <div className="quiz-progress-bar" style={{ width: `${((qIdx) / questions.length) * 100}%` }} />
            </div>
            <div className="quiz-counter">Vraag {qIdx + 1} van {questions.length} · Score: {score}</div>
            <div className="quiz-question">{q?.question}</div>
            <div className="quiz-options">
              {q?.options.map((opt, i) => (
                <button key={i}
                  className={`quiz-option ${selected === null ? '' : i === q.correct ? 'correct' : selected === i ? 'wrong' : 'neutral'}`}
                  onClick={() => answer(i)}>
                  {opt}
                </button>
              ))}
            </div>
            {selected !== null && q && (
              <div className={`quiz-explanation ${selected === q.correct ? 'correct-bg' : 'wrong-bg'}`}>
                {selected === q.correct ? '✅' : '❌'} {q.explanation}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
