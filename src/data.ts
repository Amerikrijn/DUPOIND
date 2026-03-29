import type { QuizQuestion } from './types';
import { getHubConfig } from './config/appConfig';
import seedDefaults from './config/seed-defaults.json';

export const QUIZ_QUESTIONS = seedDefaults.quiz as QuizQuestion[];

export function getMoods(): string[] {
  return getHubConfig().moods;
}

export { seedDefaults };
