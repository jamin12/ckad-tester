import type { QuizMode } from '../../types/lab.ts';
import { ConnectionStatus } from '../lab/ConnectionStatus.tsx';

interface HeaderProps {
  currentPage: string;
  mode?: QuizMode;
  questionCount?: number;
  answeredCount?: number;
  timeFormatted?: string;
}

export function Header({
  currentPage,
  mode,
  questionCount,
  answeredCount,
  timeFormatted,
}: HeaderProps) {
  const isQuizActive = currentPage === 'quiz' && questionCount !== undefined;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center justify-between border-b border-border-subtle bg-surface-1 px-4 backdrop-blur-sm">
      <h1 className="text-[13px] font-semibold tracking-wide text-text-secondary">CKAD Tester</h1>

      {isQuizActive ? (
        <div className="flex items-center gap-4">
          {mode === 'lab' ? <ConnectionStatus /> : null}
          <span className="tabular-nums text-sm text-text-tertiary">
            {answeredCount ?? 0}/{questionCount}
          </span>
          {timeFormatted !== undefined ? (
            <time className="font-terminal tabular-nums text-sm text-text-tertiary">
              {timeFormatted}
            </time>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
