import { useState } from 'react';
import { useQuiz } from '../../hooks/useQuiz.ts';
import { useTerminal } from '../../hooks/useTerminal.ts';
import { QuestionPanel } from './QuestionPanel.tsx';
import { QuizNavigation } from './QuizNavigation.tsx';
import { Terminal } from '../terminal/Terminal.tsx';
import { TerminalOutput } from '../terminal/TerminalOutput.tsx';
import { TerminalInput } from '../terminal/TerminalInput.tsx';
import { TerminalYamlInput } from '../terminal/TerminalYamlInput.tsx';
import { RealTerminal } from '../terminal/RealTerminal.tsx';
import { CheckButton } from '../lab/CheckButton.tsx';
import { VerificationResult } from '../lab/VerificationResult.tsx';
import type { QuizMode } from '../../types/lab.ts';
import type { VerificationResponse } from '../../types/lab.ts';
import type { UserAnswer } from '../../types/quiz.ts';

interface QuizPageProps {
  mode: QuizMode;
  onRevealHint: () => void;
  onComplete: () => void;
}

export function QuizPage({ mode, onRevealHint, onComplete }: QuizPageProps) {
  const { state, actions } = useQuiz();
  const [verificationResult, setVerificationResult] = useState<VerificationResponse | null>(null);

  const currentQuestion = state.questions[state.currentIndex];
  const questionIds = state.questions.map((q) => q.id);
  const answeredSet = new Set(state.answers.keys());
  const hintsRevealed = currentQuestion
    ? state.hintsRevealed.get(currentQuestion.id) ?? 0
    : 0;

  function handleVerificationResult(result: VerificationResponse) {
    setVerificationResult(result);
    if (result.passed && currentQuestion) {
      const answer: UserAnswer = {
        questionId: currentQuestion.id,
        input: '[lab-verified]',
        score: result.score,
        isPerfect: result.score >= 0.9,
        matchedAnswer: 'Lab verification',
        timestamp: Date.now(),
      };
      actions.submitAnswer(answer);
    }
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-text-tertiary">문제를 불러오는 중...</p>
      </div>
    );
  }

  const hasLabChecks = mode === 'lab' && currentQuestion.labVerification && currentQuestion.labVerification.length > 0;

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-2 [&>*]:min-w-0">
        <QuestionPanel
          question={currentQuestion}
          hintsRevealed={hintsRevealed}
          onRevealHint={onRevealHint}
        />

        {mode === 'lab' ? (
          <div className="flex min-h-0 flex-col">
            <div className="min-h-0 flex-1">
              <RealTerminal />
            </div>
            {verificationResult ? (
              <VerificationResult result={verificationResult} />
            ) : null}
          </div>
        ) : (
          <SimulationTerminal />
        )}
      </div>

      <QuizNavigation
        currentIndex={state.currentIndex}
        totalQuestions={state.questions.length}
        answeredSet={answeredSet}
        questionIds={questionIds}
        onNavigate={(dir) => {
          setVerificationResult(null);
          actions.navigate(dir);
        }}
        onComplete={onComplete}
      >
        {hasLabChecks ? (
          <CheckButton
            questionId={currentQuestion.id}
            checks={currentQuestion.labVerification!}
            onResult={handleVerificationResult}
          />
        ) : null}
      </QuizNavigation>
    </div>
  );
}

// Simulation 모드 터미널 (기존 로직)
function SimulationTerminal() {
  const { state: terminalState, meta: terminalMeta } = useTerminal();

  return (
    <Terminal>
      <TerminalOutput />
      {terminalState.mode === 'yaml' ? (
        <TerminalYamlInput />
      ) : (
        <TerminalInput ref={terminalMeta.inputRef} />
      )}
    </Terminal>
  );
}
