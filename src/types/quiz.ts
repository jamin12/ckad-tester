import type { Category, Difficulty } from './common.ts';
import type { Question } from './question.ts';
import type { QuizMode, LabConfig } from './lab.ts';

export interface QuizConfig {
  categories: Category[];
  difficulties: Difficulty[];
  questionCount: number;
  timeLimitMinutes: number;
  mode: QuizMode;
  labConfig?: LabConfig;
}

export interface UserAnswer {
  questionId: string;
  input: string;
  score: number;
  isPerfect: boolean;
  matchedAnswer: string;
  timestamp: number;
}

export type QuizStatus = 'idle' | 'configuring' | 'active' | 'completed';

export interface QuizState {
  status: QuizStatus;
  questions: Question[];
  currentIndex: number;
  answers: Map<string, UserAnswer>;
  hintsRevealed: Map<string, number>;
}

export interface QuizActions {
  startQuiz: (config: QuizConfig, questions: Question[]) => void;
  navigate: (direction: 'next' | 'prev' | number) => void;
  submitAnswer: (answer: UserAnswer) => void;
  revealHint: (questionId: string) => void;
  completeQuiz: () => void;
}

export interface QuizMeta {
  startedAt: number | null;
  config: QuizConfig | null;
}

export interface QuizContextValue {
  state: QuizState;
  actions: QuizActions;
  meta: QuizMeta;
}
