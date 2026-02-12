import { createContext, useReducer, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type {
  QuizContextValue,
  QuizState,
  QuizConfig,
  UserAnswer,
} from '../types/quiz.ts';
import type { Question } from '../types/question.ts';

export const QuizContext = createContext<QuizContextValue | null>(null);

type QuizAction =
  | { type: 'START_QUIZ'; payload: { config: QuizConfig; questions: Question[] } }
  | { type: 'NAVIGATE'; payload: { direction: 'next' | 'prev' | number } }
  | { type: 'SUBMIT_ANSWER'; payload: { answer: UserAnswer } }
  | { type: 'REVEAL_HINT'; payload: { questionId: string } }
  | { type: 'COMPLETE_QUIZ' };

function computeInitial(): QuizState {
  return {
    status: 'idle',
    questions: [],
    currentIndex: 0,
    answers: new Map<string, UserAnswer>(),
    hintsRevealed: new Map<string, number>(),
  };
}

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'START_QUIZ': {
      return {
        status: 'active',
        questions: action.payload.questions,
        currentIndex: 0,
        answers: new Map<string, UserAnswer>(),
        hintsRevealed: new Map<string, number>(),
      };
    }

    case 'NAVIGATE': {
      const { direction } = action.payload;
      let nextIndex: number;

      if (typeof direction === 'number') {
        nextIndex = direction;
      } else if (direction === 'next') {
        nextIndex = state.currentIndex + 1;
      } else {
        nextIndex = state.currentIndex - 1;
      }

      const clampedIndex = Math.max(
        0,
        Math.min(nextIndex, state.questions.length - 1),
      );

      return {
        ...state,
        currentIndex: clampedIndex,
      };
    }

    case 'SUBMIT_ANSWER': {
      const { answer } = action.payload;
      const nextAnswers = new Map(state.answers);
      nextAnswers.set(answer.questionId, answer);

      return {
        ...state,
        answers: nextAnswers,
      };
    }

    case 'REVEAL_HINT': {
      const { questionId } = action.payload;
      const nextHints = new Map(state.hintsRevealed);
      const currentCount = nextHints.get(questionId) ?? 0;
      nextHints.set(questionId, currentCount + 1);

      return {
        ...state,
        hintsRevealed: nextHints,
      };
    }

    case 'COMPLETE_QUIZ': {
      return {
        ...state,
        status: 'completed',
      };
    }

    default:
      return state;
  }
}

interface QuizProviderProps {
  children: ReactNode;
}

export function QuizProvider({ children }: QuizProviderProps) {
  const [state, dispatch] = useReducer(quizReducer, undefined, computeInitial);

  const startedAtRef = useRef<number | null>(null);
  const configRef = useRef<QuizConfig | null>(null);

  const startQuiz = useCallback(
    (config: QuizConfig, questions: Question[]) => {
      startedAtRef.current = Date.now();
      configRef.current = config;
      dispatch({ type: 'START_QUIZ', payload: { config, questions } });
    },
    [],
  );

  const navigate = useCallback(
    (direction: 'next' | 'prev' | number) => {
      dispatch({ type: 'NAVIGATE', payload: { direction } });
    },
    [],
  );

  const submitAnswer = useCallback((answer: UserAnswer) => {
    dispatch({ type: 'SUBMIT_ANSWER', payload: { answer } });
  }, []);

  const revealHint = useCallback((questionId: string) => {
    dispatch({ type: 'REVEAL_HINT', payload: { questionId } });
  }, []);

  const completeQuiz = useCallback(() => {
    dispatch({ type: 'COMPLETE_QUIZ' });
  }, []);

  const actions = useCallback(() => ({
    startQuiz,
    navigate,
    submitAnswer,
    revealHint,
    completeQuiz,
  }), [startQuiz, navigate, submitAnswer, revealHint, completeQuiz]);

  const contextValue: QuizContextValue = {
    state,
    actions: actions(),
    meta: {
      startedAt: startedAtRef.current,
      config: configRef.current,
    },
  };

  return (
    <QuizContext value={contextValue}>
      {children}
    </QuizContext>
  );
}
