import type { Question } from '../../types/question.ts';
import { CategoryBadge } from './CategoryBadge.tsx';
import { DifficultyBadge } from './DifficultyBadge.tsx';

interface QuestionPanelProps {
  question: Question;
  hintsRevealed: number;
  onRevealHint: () => void;
}

export function QuestionPanel({ question, hintsRevealed, onRevealHint }: QuestionPanelProps) {
  const hasMoreHints = hintsRevealed < question.hints.length;
  const visibleHints = question.hints.slice(0, hintsRevealed);

  return (
    <section
      className="flex h-full flex-col overflow-y-auto border-r border-border-subtle bg-surface-1 p-6"
      aria-label="문제 패널"
    >
      {/* Badges */}
      <div className="mb-4 flex items-center gap-2">
        <CategoryBadge category={question.category} />
        <DifficultyBadge difficulty={question.difficulty} />
      </div>

      {/* Title */}
      <h2 className="mb-4 text-[16px] font-semibold text-text-primary" style={{ overflowWrap: 'break-word' }}>
        {question.title}
      </h2>

      {/* Scenario */}
      <div className="mb-4">
        <p
          className="text-sm leading-relaxed text-text-secondary"
          style={{ overflowWrap: 'break-word' }}
        >
          {question.scenario}
        </p>
      </div>

      {/* Hint Button */}
      {hasMoreHints ? (
        <button
          type="button"
          onClick={onRevealHint}
          aria-label="힌트 보기"
          className="mb-4 self-start text-[13px] text-text-tertiary transition-colors hover:text-warning focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          힌트 보기 ({hintsRevealed}/{question.hints.length})
        </button>
      ) : null}

      {/* Revealed Hints */}
      {visibleHints.length > 0 ? (
        <div className="space-y-2" role="list" aria-label="공개된 힌트 목록">
          {visibleHints.map((hint, index) => (
            <div
              key={index}
              role="listitem"
              className="border-l-2 border-warning/40 pl-3 text-[13px] text-text-secondary"
              style={{ overflowWrap: 'break-word' }}
            >
              <span className="mr-1 font-medium">힌트 {index + 1}:</span>
              <span className="whitespace-pre-wrap">{hint.text}</span>
              <span className="ml-2 text-xs text-text-tertiary">(-{hint.penalty * 100}%)</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
