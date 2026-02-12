import { useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';

import type { UserAnswer } from '../../types/quiz.ts';
import { QuizProvider as QuizContextProvider } from '../../context/QuizContext.tsx';
import { TerminalProvider } from '../terminal/TerminalProvider.tsx';
import { validateAnswer } from '../../services/validator.ts';
import type { ValidationResult } from '../../context/TerminalContext.tsx';
import { useQuiz } from '../../hooks/useQuiz.ts';

export interface QuizResult {
  totalScore: number;
  totalQuestions: number;
  answeredCount: number;
  passed: boolean;
  completedAt: number;
}

interface QuizProviderWrapperProps {
  onComplete: (result: QuizResult) => void;
  children: ReactNode;
}

function QuizTerminalBridge({
  onComplete,
  children,
}: {
  onComplete: (result: QuizResult) => void;
  children: ReactNode;
}) {
  const { state, actions } = useQuiz();

  const handleValidate = useCallback(
    (input: string): ValidationResult => {
      const currentQuestion = state.questions[state.currentIndex];
      if (!currentQuestion) {
        return {
          score: 0,
          isPerfect: false,
          matchedAnswer: '',
          feedback: '문제를 찾을 수 없습니다.',
        };
      }

      const result = validateAnswer(input, currentQuestion.expectedAnswers);

      const answer: UserAnswer = {
        questionId: currentQuestion.id,
        input,
        score: result.score,
        isPerfect: result.isPerfect,
        matchedAnswer: result.matchedAnswer,
        timestamp: Date.now(),
      };

      actions.submitAnswer(answer);

      return {
        score: result.score,
        isPerfect: result.isPerfect,
        matchedAnswer: result.matchedAnswer,
        feedback: result.feedback,
      };
    },
    [state.questions, state.currentIndex, actions],
  );

  useEffect(() => {
    if (state.status === 'completed') {
      let totalScore = 0;
      for (const answer of state.answers.values()) {
        totalScore += answer.score;
      }
      const answeredCount = state.answers.size;
      const totalQuestions = state.questions.length;
      const averageScore = answeredCount > 0 ? totalScore / totalQuestions : 0;

      onComplete({
        totalScore: averageScore,
        totalQuestions,
        answeredCount,
        passed: averageScore >= 0.7,
        completedAt: Date.now(),
      });
    }
  }, [state.status, state.answers, state.questions, onComplete]);

  return (
    <TerminalProvider onValidate={handleValidate}>
      {children}
    </TerminalProvider>
  );
}

export function QuizProviderWrapper({
  onComplete,
  children,
}: QuizProviderWrapperProps) {
  return (
    <QuizContextProvider>
      <QuizTerminalBridge onComplete={onComplete}>
        {children}
      </QuizTerminalBridge>
    </QuizContextProvider>
  );
}
