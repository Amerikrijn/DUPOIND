import { useEffect, useMemo, useState } from 'react';
import { QUIZ_QUESTIONS } from '../data';
import { fetchOpenTriviaQuestions } from '../services/openTriviaQuiz';
import { useQuiz } from './useFirestore';
import type { QuizQuestion } from '../types';

const CACHE_PREFIX = 'dupoind_opentdb_quiz_v1';

function dedupeByQuestion(qs: QuizQuestion[]): QuizQuestion[] {
  const seen = new Set<string>();
  const out: QuizQuestion[] = [];
  for (const q of qs) {
    const key = q.question.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}

/**
 * Firestore `quiz` when present, otherwise seed JSON; plus a daily batch from Open Trivia DB
 * so an empty Firestore collection still yields a full, varied pool.
 */
export function useQuizPool() {
  const { questions: fsQuestions, loading: fsLoading } = useQuiz();
  const [merged, setMerged] = useState<QuizQuestion[] | null>(null);

  const baseKey = useMemo(
    () =>
      fsQuestions.length > 0
        ? fsQuestions.map((q) => q.id ?? q.question).join('\x1e')
        : '__seed__',
    [fsQuestions]
  );

  useEffect(() => {
    if (fsLoading) return;

    let cancelled = false;
    const base = fsQuestions.length > 0 ? fsQuestions : QUIZ_QUESTIONS;
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `${CACHE_PREFIX}_${today}`;

    (async () => {
      setMerged(null);
      try {
        let remote: QuizQuestion[] = [];
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          remote = JSON.parse(cached) as QuizQuestion[];
        } else {
          remote = await fetchOpenTriviaQuestions(8);
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(remote));
          } catch {
            /* quota */
          }
        }
        if (cancelled) return;
        setMerged(dedupeByQuestion([...base, ...remote]));
      } catch {
        if (!cancelled) setMerged(dedupeByQuestion([...base]));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fsLoading, baseKey, fsQuestions]);

  const questions = merged ?? [];
  const loading = fsLoading || merged === null;
  return { questions, loading };
}
