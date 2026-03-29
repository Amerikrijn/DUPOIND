// Shared data types for DUPOIND

export type CityId = 'utrecht' | 'lisbon' | 'chennai';

export type WallPost = {
  id: string;
  author: string;
  city: string;
  cityId: CityId | string;
  content: string;
  emoji: string;
  likes: string[]; // array of user names who liked
  time: string;
  translations: { nl: string; pt: string; ta: string; en?: string };
};

export type KudoEntry = {
  id: string;
  from: string;
  fromCity: string;
  to: string;
  message: string;
  translation: string;
  emoji: string;
  time: string;
};

export type UserStatus = {
  id?: string;
  name: string;
  city: string;
  cityId: string;
  available: boolean;
  mood: string;
  lastSeen: string;
};

export type Dish = {
  id?: string;
  cityId: string;
  name: string;
  description: string;
  image: string; // Emoji for now, but ready for URLs
  flag: string;
};

export type QuizQuestion = {
  id?: string;
  question: string;
  options: string[];
  correct: number;
  city: string;
  cityId: CityId;
  explanation: string;
  author?: string;
  authorCity?: string;
};

export type Idea = {
  id: string;
  title: string;
  description: string;
  author: string;
  cityId: string;
  status: 'pending' | 'realized' | 'rejected';
  votes: string[]; // array of user names who voted
  category: 'feature' | 'event' | 'poll' | 'fact' | 'suggestion';
  createdAt: string;
};

export type AssistantResponse = {
  id: string;
  role: 'assistant';
  content: string;
  timestamp: string;
  type: 'fact' | 'news' | 'weather' | 'translation' | 'general';
};

/** Lightweight events so the app can learn what people do (no PII in metadata). */
export type EngagementKind =
  | 'quiz_complete'
  | 'wall_like'
  | 'idea_vote';
