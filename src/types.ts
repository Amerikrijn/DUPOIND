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
  translations: { nl: string; pt: string; ta: string };
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

export type Poll = {
  id: string;
  question: string;
  options: { label: string; votes: string[] }[];
  author: string;
  cityId: string;
  createdAt: string;
};

export type UserStatus = {
  name: string;
  city: string;
  cityId: string;
  available: boolean;
  mood: string;
  lastSeen: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correct: number;
  city: string;
  cityId: CityId;
  explanation: string;
};
