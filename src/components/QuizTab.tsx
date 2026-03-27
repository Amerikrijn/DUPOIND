import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data';
import type { QuizQuestion } from '../types';

export function QuizTab() {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q: QuizQuestion = QUIZ_QUESTIONS[qIdx];

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
    if (selected !== null) return;
    setSelected(i);
    if (i === q.correct) setScore(s => s + 1);
    setTimeout(() => {
      if (qIdx + 1 >= QUIZ_QUESTIONS.length) setDone(true);
      else { setQIdx(qIdx + 1); setSelected(null); }
    }, 2000);
  };

  const restart = () => { setQIdx(0); setSelected(null); setScore(0); setDone(false); };

  if (!q && !done) return <div className="glass-panel">Quiz data niet gevonden.</div>;

  return (
    <div className="quiz-container">
      <div className="glass-panel quiz-panel">
        <div className="panel-header"><HelpCircle className="panel-icon" size={22} /><h2>City Quiz</h2><span className={`fact-city-badge ${q?.cityId}`}>{getCityFlag(q?.cityId || '')} {getCityName(q?.cityId || '')}</span></div>
        {done ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{score >= 6 ? '🏆' : score >= 4 ? '🌟' : '📚'}</div>
            <h2 style={{ fontSize: '2rem', marginBottom: '.5rem' }}>{score} / {QUIZ_QUESTIONS.length}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              {score >= 6 ? 'Geweldig! Echte cultuurkenner!' : score >= 4 ? 'Goed bezig!' : 'Blijf leren — DUPOIND helpt 😄'}
            </p>
            <button className="btn-kudos" style={{ width: 'auto', padding: '1rem 2.5rem', marginTop: 0 }} onClick={restart}>Nog een keer!</button>
          </div>
        ) : (
          <>
            <div className="quiz-progress">
              <div className="quiz-progress-bar" style={{ width: `${((qIdx) / QUIZ_QUESTIONS.length) * 100}%` }} />
            </div>
            <div className="quiz-counter">Vraag {qIdx + 1} van {QUIZ_QUESTIONS.length} · Score: {score}</div>
            <div className="quiz-question">{q.question}</div>
            <div className="quiz-options">
              {q.options.map((opt, i) => (
                <button key={i}
                  className={`quiz-option ${selected === null ? '' : i === q.correct ? 'correct' : selected === i ? 'wrong' : 'neutral'}`}
                  onClick={() => answer(i)}>
                  {opt}
                </button>
              ))}
            </div>
            {selected !== null && (
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
