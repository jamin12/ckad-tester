import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/layout/Header.tsx';
import { HomePage } from './components/home/HomePage.tsx';
import { QuizProvider } from './context/QuizContext.tsx';
import { TerminalProvider } from './context/TerminalContext.tsx';
import { LabProvider } from './context/LabContext.tsx';
import { QuizPage } from './components/quiz/QuizPage.tsx';
import { ResultPage } from './components/result/ResultPage.tsx';
import { loadQuestions } from './services/questionLoader.ts';
import { validateAnswer } from './services/validator.ts';
import { calculateResult } from './services/scorer.ts';
import { useQuiz } from './hooks/useQuiz.ts';
import { useTimer } from './hooks/useTimer.ts';
import type { QuizConfig, UserAnswer } from './types/quiz.ts';
import type { Question } from './types/question.ts';
import type { QuizResult } from './services/scorer.ts';
import type { QuizMode, LabConfig } from './types/lab.ts';
import { useLab } from './hooks/useLab.ts';

const QUIZ_SESSION_KEY = 'ckad-tester:quizSession';

interface SavedQuizSession {
  questions: Question[];
  mode: QuizMode;
  labConfig: LabConfig | null;
  timeLimitMinutes: number;
}

function saveQuizSession(data: SavedQuizSession): void {
  try {
    sessionStorage.setItem(QUIZ_SESSION_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable
  }
}

function loadQuizSession(): SavedQuizSession | null {
  try {
    const raw = sessionStorage.getItem(QUIZ_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedQuizSession;
  } catch {
    return null;
  }
}

function clearQuizSession(): void {
  try {
    sessionStorage.removeItem(QUIZ_SESSION_KEY);
  } catch {
    // silently ignore
  }
}

type Page = 'home' | 'quiz' | 'result';

function getPageFromHash(): Page {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'quiz' || hash === 'result') {
    return hash;
  }
  return 'home';
}

function navigateTo(page: Page): void {
  window.location.hash = page === 'home' ? 'home' : page;
}

function LabAutoConnect({ labConfig: cfg }: { labConfig: LabConfig }) {
  const { actions } = useLab();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!connectedRef.current) {
      connectedRef.current = true;
      actions.connect(cfg);
    }
  }, [cfg, actions]);

  return null;
}

function QuizSession({
  questions,
  mode,
  labConfig: labCfg,
  onComplete,
  timer,
}: {
  questions: Question[];
  mode: QuizMode;
  labConfig: LabConfig | null;
  onComplete: (answers: Map<string, UserAnswer>) => void;
  timer: ReturnType<typeof useTimer>;
}) {
  const { state, actions } = useQuiz();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current && questions.length > 0) {
      initializedRef.current = true;
      actions.startQuiz(
        { categories: [], difficulties: [], questionCount: questions.length, timeLimitMinutes: 0, mode },
        questions,
      );
      timer.start();
    }
  }, [questions, actions, timer]);


  useEffect(() => {
    if (state.status === 'completed') {
      onComplete(state.answers);
    }
  }, [state.status, state.answers, onComplete]);

  useEffect(() => {
    if (timer.timeLeft === 0 && state.status === 'active') {
      actions.completeQuiz();
    }
  }, [timer.timeLeft, state.status, actions]);

  const handleValidate = useCallback(
    (input: string) => {
      const currentQuestion = state.questions[state.currentIndex];
      if (!currentQuestion) {
        return { score: 0, isPerfect: false, isCorrect: false, matchedAnswer: '', feedback: '문제를 불러올 수 없습니다.' };
      }

      const result = validateAnswer(input, currentQuestion.expectedAnswers);

      if (result.isCorrect) {
        const answer: UserAnswer = {
          questionId: currentQuestion.id,
          input,
          score: result.score,
          isPerfect: result.isPerfect,
          matchedAnswer: result.matchedAnswer,
          timestamp: Date.now(),
        };
        actions.submitAnswer(answer);
      }

      return result;
    },
    [state.questions, state.currentIndex, actions],
  );

  const handleRevealHint = useCallback(() => {
    const currentQuestion = state.questions[state.currentIndex];
    if (currentQuestion) {
      actions.revealHint(currentQuestion.id);
    }
  }, [state.questions, state.currentIndex, actions]);

  return mode === 'lab' && labCfg ? (
    <>
      <LabAutoConnect labConfig={labCfg} />
      <QuizPage mode="lab" onRevealHint={handleRevealHint} onComplete={actions.completeQuiz} />
    </>
  ) : (
    <TerminalProvider onValidate={handleValidate}>
      <QuizPage mode="simulation" onRevealHint={handleRevealHint} onComplete={actions.completeQuiz} />
    </TerminalProvider>
  );
}

export function App() {
  const [page, setPage] = useState<Page>(getPageFromHash);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [finalAnswers, setFinalAnswers] = useState<Map<string, UserAnswer>>(new Map());
  const [mode, setMode] = useState<QuizMode>('simulation');
  const [labConfig, setLabConfig] = useState<LabConfig | null>(null);

  const timer = useTimer(120);

  useEffect(() => {
    function onHashChange() {
      setPage(getPageFromHash());
    }
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  useEffect(() => {
    if (page === 'quiz' && questions.length === 0) {
      const saved = loadQuizSession();
      if (saved) {
        setQuestions(saved.questions);
        setMode(saved.mode);
        setLabConfig(saved.labConfig);
      } else {
        navigateTo('home');
      }
    }
    if (page === 'result' && !result) {
      navigateTo('home');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = useCallback((config: QuizConfig) => {
    const loaded = loadQuestions(config);
    saveQuizSession({
      questions: loaded,
      mode: config.mode,
      labConfig: config.labConfig ?? null,
      timeLimitMinutes: config.timeLimitMinutes,
    });
    setQuestions(loaded);
    setResult(null);
    setFinalAnswers(new Map());
    setMode(config.mode);
    setLabConfig(config.labConfig ?? null);
    navigateTo('quiz');
  }, []);

  const handleQuizComplete = useCallback(
    (answers: Map<string, UserAnswer>) => {
      clearQuizSession();
      const quizResult = calculateResult(questions, answers);
      setResult(quizResult);
      setFinalAnswers(answers);
      timer.pause();
      navigateTo('result');
    },
    [questions, timer],
  );

  const handleRestart = useCallback(() => {
    clearQuizSession();
    setQuestions([]);
    setResult(null);
    setFinalAnswers(new Map());
    timer.reset();
    navigateTo('home');
  }, [timer]);

  const pageContent = (
    <div className="min-h-dvh flex flex-col bg-surface-0">
      <Header
        currentPage={page}
        mode={mode}
        questionCount={questions.length}
        answeredCount={finalAnswers.size}
        timeFormatted={page === 'quiz' ? timer.formatTime() : undefined}
      />

      <main className="flex-1 pt-12">
        {page === 'home' ? (
          <HomePage onStart={handleStart} />
        ) : page === 'quiz' ? (
          <QuizProvider>
            <QuizSession
              questions={questions}
              mode={mode}
              labConfig={labConfig}
              onComplete={handleQuizComplete}
              timer={timer}
            />
          </QuizProvider>
        ) : page === 'result' && result ? (
          <ResultPage
            result={result}
            questions={questions}
            answers={finalAnswers}
            onRestart={handleRestart}
          />
        ) : null}
      </main>
    </div>
  );

  return mode === 'lab' ? (
    <LabProvider>{pageContent}</LabProvider>
  ) : (
    pageContent
  );
}
