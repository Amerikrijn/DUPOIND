import type { CityId, QuizQuestion } from '../types';

function decodeHtmlEntities(text: string): string {
  if (typeof document === 'undefined') return text;
  const ta = document.createElement('textarea');
  ta.innerHTML = text;
  return ta.value;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type OTRResult = {
  category: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
};

const HUB_CITY: CityId = 'utrecht';

/**
 * Fetches general-knowledge multiple-choice questions from Open Trivia DB (no API key).
 * Mixed into the app quiz pool so the daily set is not only static seed data.
 */
export async function fetchOpenTriviaQuestions(count: number): Promise<QuizQuestion[]> {
  const url = `https://opentdb.com/api.php?amount=${count}&type=multiple`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('opentdb_http');
  const data = (await res.json()) as { response_code: number; results?: OTRResult[] };
  if (data.response_code !== 0 || !Array.isArray(data.results)) {
    throw new Error('opentdb_payload');
  }
  const city = 'DUPO IND';
  return data.results.map((r, i) => {
    const correct = decodeHtmlEntities(r.correct_answer);
    const incorrect = r.incorrect_answers.map(decodeHtmlEntities);
    const options = shuffle([correct, ...incorrect]);
    const correctIndex = options.indexOf(correct);
    return {
      id: `opentdb-${i}-${correct.length}`,
      question: decodeHtmlEntities(r.question),
      options,
      correct: correctIndex,
      city,
      cityId: HUB_CITY,
      explanation: `Open Trivia · ${decodeHtmlEntities(r.category)}`,
    } satisfies QuizQuestion;
  });
}
