import type { ReactNode } from 'react';

interface QuizNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  answeredSet: Set<string>;
  questionIds: string[];
  onNavigate: (direction: 'next' | 'prev' | number) => void;
  onComplete: () => void;
  children?: ReactNode;
}

export function QuizNavigation({
  currentIndex,
  totalQuestions,
  answeredSet,
  questionIds,
  onNavigate,
  onComplete,
  children,
}: QuizNavigationProps) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;
  const showDots = totalQuestions <= 10;

  return (
    <nav
      className="flex items-center justify-between border-t border-border-subtle bg-surface-1 px-4 py-3"
      aria-label="퀴즈 네비게이션"
    >
      {/* Previous Button */}
      <button
        type="button"
        onClick={() => onNavigate('prev')}
        disabled={isFirst}
        aria-label="이전 문제"
        className="rounded-md border border-border-default px-4 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
      >
        이전
      </button>

      {/* Dot Indicators or Numeric Indicator */}
      <div className="flex items-center gap-1" role="group" aria-label="문제 진행 상태">
        {showDots ? (
          questionIds.map((id, index) => {
            const isAnswered = answeredSet.has(id);
            const isCurrent = index === currentIndex;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(index)}
                aria-label={`문제 ${index + 1}${isAnswered ? ' (답변 완료)' : ''}${isCurrent ? ' (현재)' : ''}`}
                aria-current={isCurrent ? 'step' : undefined}
                className={`h-2 w-2 rounded-[2px] transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                  isCurrent
                    ? 'bg-accent'
                    : isAnswered
                      ? 'bg-text-tertiary'
                      : 'border border-border-default bg-transparent'
                }`}
              />
            );
          })
        ) : (
          <span className="tabular-nums text-sm text-text-tertiary">
            {currentIndex + 1} / {totalQuestions} (답변: {answeredSet.size})
          </span>
        )}
      </div>

      {/* Children (e.g. Check Button) */}
      {children ? children : null}

      {/* Next / Complete Buttons */}
      <div className="flex items-center gap-2">
        {!isLast ? (
          <button
            type="button"
            onClick={() => onNavigate('next')}
            aria-label="다음 문제"
            className="rounded-md border border-border-default px-4 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            다음
          </button>
        ) : null}

        <button
          type="button"
          onClick={onComplete}
          className="rounded-md bg-danger/80 px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-danger focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          퀴즈 종료
        </button>
      </div>
    </nav>
  );
}
