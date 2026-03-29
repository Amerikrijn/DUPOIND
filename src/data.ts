import type { QuizQuestion, Poll } from './types';
import { getHubConfig } from './config/appConfig';
import seedDefaults from './config/seed-defaults.json';

export const QUIZ_QUESTIONS = seedDefaults.quiz as QuizQuestion[];

export const INITIAL_POLLS: Poll[] = seedDefaults.initialPolls.map((p) => ({
  ...p,
  createdAt: p.createdAt || new Date().toISOString(),
  options: p.options.map((o) => ({ label: o.label, votes: [...o.votes] })),
}));

export function getMoods(): string[] {
  return getHubConfig().moods;
}

export { seedDefaults };
