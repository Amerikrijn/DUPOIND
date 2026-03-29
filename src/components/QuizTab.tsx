import { useState, useMemo } from 'react';
import { Trophy, Check, X, Star, Lock } from 'lucide-react';
import { useQuizScores, recordEngagementSignal } from '../hooks/useFirestore';
import { useTranslation } from '../hooks/useTranslation';
import type { QuizQuestion } from '../types';

interface ScoreEntry {
  name: string;
  score: number;
  cityId: string;
  createdAt?: { seconds: number; nanoseconds: number };
}

export function QuizTab({
  questions,
  loading = false,
  userName,
  userCityId,
}: {
  questions: QuizQuestion[];
  loading?: boolean;
  userName: string;
  userCityId: string;
}) {
  const { scores, saveScore } = useQuizScores();
  const { t } = useTranslation();
  const [qIdx, setQIdx] = useState(-1);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [finished, setFinished] = useState(false);

  // Daily Quiz Selection: 5 unique questions based on current date
  const dailyQuestions = useMemo(() => {
    if (questions.length === 0) return [];
    const today = new Date().toISOString().split('T')[0];
    const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
    const shuffled = [...questions].sort((a, b) => {
      const hA = (a.question.length + seed) % 10;
      const hB = (b.question.length + seed) % 10;
      return hA - hB;
    });
    return shuffled.slice(0, 5);
  }, [questions]);

  const q = qIdx >= 0 ? dailyQuestions[qIdx] : null;

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === q?.correct) setScore(s => s + 1);
    setShowExplanation(true);
  };

  const nextQ = async () => {
    if (qIdx < dailyQuestions.length - 1) {
      setQIdx(qIdx + 1);
      setSelected(null);
      setShowExplanation(false);
    } else {
      setFinished(true);
      await saveScore(userName, userCityId, score);
      void recordEngagementSignal('quiz_complete', {
        userName,
        cityId: userCityId,
        metadata: { score },
      });
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`dupoind_quiz_${userName}_${today}`, 'true');
    }
  };

  const hasPlayedToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const localKey = `dupoind_quiz_${userName}_${today}`;
    if (localStorage.getItem(localKey)) return true;
    
    // Also check Firestore scores for today
    return (scores as ScoreEntry[]).some(s => {
      const sDate = s.createdAt?.seconds 
        ? new Date(s.createdAt.seconds * 1000).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]; 
      return s.name === userName && sDate === today;
    });
  }, [scores, userName]);

  if (loading && questions.length === 0) {
    return (
      <div className="quiz-container">
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2.5rem' }}>
          <div className="spinner-sm" style={{ width: '32px', height: '32px', margin: '0 auto 1rem' }} />
          <p style={{ opacity: 0.8 }}>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (qIdx === -1) {
    return (
      <div className="quiz-container">
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2.5rem' }}>
          <Trophy size={64} color="var(--accent)" style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 0 10px rgba(75,123,243,0.3))' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>{t('daily_challenge')}</h2>
          <p style={{ opacity: 0.6, marginBottom: '2rem' }}>{t('daily_desc')}</p>
          
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', textAlign: 'left', opacity: 0.8 }}><Star size={16} /> {t('hall_of_fame')} (Top 3)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {scores.slice(0, 3).map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: i===0?'#ffd700':i===1?'#c0c0c0':'#cd7f32' }}>#{i+1}</span>
                    <span>{s.name}</span>
                  </div>
                  <span style={{ fontWeight: 700 }}>{s.score} pt</span>
                </div>
              ))}
              {scores.length === 0 && <div style={{ fontSize: '0.8rem', opacity: 0.4 }}>{t('no_scores')}</div>}
            </div>
          </div>

          {hasPlayedToday ? (
            <div style={{ padding: '1rem', background: 'rgba(244,63,94,0.1)', borderRadius: '12px', border: '1px solid rgba(244,63,94,0.3)', color: 'var(--accent)' }}>
              <Lock size={20} style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600 }}>{t('already_played')}</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>{t('come_back_tomorrow')}</p>
            </div>
          ) : (
            <button className="btn-auth" onClick={() => setQIdx(0)}>{t('start_quiz')}</button>
          )}
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="quiz-container">
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <Trophy size={64} color="#ffd700" style={{ marginBottom: '1.5rem' }} />
          <h2>{t('well_done')}</h2>
          <p style={{ fontSize: '1.2rem' }}>{t('your_score')}: <strong>{score} / 5</strong></p>
          <p style={{ opacity: 0.6, marginTop: '1rem', marginBottom: '2rem' }}>{t('score_saved')}</p>
          <button className="btn-auth" onClick={() => window.location.reload()}>{t('finish')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="glass-panel">
        <div className="quiz-header">
          <div className="panel-header" style={{ marginBottom: 0 }}>
            <Trophy className="panel-icon" size={22} />
            <h2>{t('quiz')}</h2>
          </div>
          <div className="city-badge">{q?.city}</div>
        </div>
        
        <div className="quiz-progress-outer">
          <div className="quiz-progress-inner" style={{ width: `${((qIdx + 1) / dailyQuestions.length) * 100}%` }} />
        </div>

        <div className="quiz-body" style={{ padding: '2rem 1.5rem' }}>
          <div className="quiz-counter">{t('question')} {qIdx + 1} / 5 · {t('score')}: {score}</div>
          <div className="quiz-question" style={{ marginBottom: '0.5rem' }}>{q?.question}</div>
          {q?.author && <div className="quiz-author" style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '2rem', fontStyle: 'italic' }}>{t('suggested_by')}: {q.author}</div>}

          <div className="quiz-options" style={{ display: 'grid', gap: '0.75rem' }}>
            {q?.options.map((opt, i) => {
              let dStatus = '';
              if (selected !== null) {
                if (i === q?.correct) dStatus = 'correct';
                else if (i === selected) dStatus = 'wrong';
              }
              return (
                <button key={i} className={`quiz-option ${dStatus}`} onClick={() => handleAnswer(i)} disabled={selected !== null}>
                  {opt}
                  {dStatus === 'correct' && <Check size={18} style={{ marginLeft: 'auto' }} />}
                  {dStatus === 'wrong' && <X size={18} style={{ marginLeft: 'auto' }} />}
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className="quiz-explanation" style={{ marginTop: '2rem', padding: '1.25rem', background: 'rgba(75,123,243,0.1)', borderRadius: '12px', borderLeft: '4px solid var(--accent)', animation: 'fadeIn 0.3s' }}>
              <strong>{t('explanation')}:</strong> {q?.explanation}
              <button className="btn-auth" style={{ marginTop: '1.5rem', width: '100%' }} onClick={nextQ}>
                {qIdx === dailyQuestions.length - 1 ? t('view_results') : t('next_question')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
