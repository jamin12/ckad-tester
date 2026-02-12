import { use } from 'react';
import { QuizContext } from '../context/QuizContext.tsx';
import type { QuizContextValue } from '../types/quiz.ts';

export function useQuiz(): QuizContextValue {
  const context = use(QuizContext);

  if (context === null) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }

  return context;
}
