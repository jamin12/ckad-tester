import type { Question } from '../../types/question.ts';
import type { UserAnswer } from '../../types/quiz.ts';
import type { QuizResult } from '../../services/scorer.ts';
import { ScoreChart } from './ScoreChart.tsx';
import { PASS_THRESHOLD } from '../../data/constants.ts';
import { CategoryBadge } from '../quiz/CategoryBadge.tsx';
import { DifficultyBadge } from '../quiz/DifficultyBadge.tsx';

interface ResultPageProps {
  result: QuizResult;
  questions: Question[];
  answers: Map<string, UserAnswer>;
  onRestart: () => void;
}

export function ResultPage({ result, questions, answers, onRestart }: ResultPageProps) {
  const passed = result.passed;

  const categoryScores = result.categoryScores.map((cs) => ({
    category: cs.category,
    correct: cs.correct,
    total: cs.total,
    percentage: cs.percentage,
  }));

  return (
    <main className="min-h-screen px-4 pt-6 pb-8">
      <div className="mx-auto max-w-3xl">
        {/* Overall Score */}
        <section className="mb-8 rounded-lg border border-border-subtle bg-surface-1 p-8 text-center">
          <h2 className="mb-2 text-sm text-text-tertiary">최종 점수</h2>
          <p className="tabular-nums text-5xl font-semibold text-text-primary">
            {result.totalScore}
            <span className="text-2xl text-text-tertiary">%</span>
          </p>
          <div className="mt-3">
            <span
              className={`inline-block rounded-sm px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ${
                passed
                  ? 'bg-success-muted text-success'
                  : 'bg-danger-muted text-danger'
              }`}
            >
              {passed ? '합격' : '불합격'}
            </span>
          </div>
          <p className="mt-2 tabular-nums text-sm text-text-tertiary">
            {result.correctCount}/{result.totalQuestions} 정답 | {result.perfectCount} 완벽
          </p>
        </section>

        {/* Category Breakdown */}
        <section className="mb-8 rounded-lg border border-border-subtle bg-surface-1 p-6">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">카테고리별 점수</h3>
          <ScoreChart categoryScores={categoryScores} />
        </section>

        {/* Answered Questions List */}
        <section className="mb-8 rounded-lg border border-border-subtle bg-surface-1 p-6">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">문제별 결과</h3>

          {answers.size === 0 ? (
            <p className="text-sm text-text-tertiary">답안이 없습니다</p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {questions.map((question) => {
                const answer = answers.get(question.id);
                const isCorrect = answer ? answer.score >= PASS_THRESHOLD : false;

                return (
                  <li
                    key={question.id}
                    className="flex items-center gap-3 px-2 py-3"
                    style={{ contentVisibility: 'auto' }}
                  >
                    {answer ? (
                      <span
                        className={`shrink-0 text-sm font-medium ${
                          isCorrect ? 'text-success' : 'text-danger'
                        }`}
                        aria-label={isCorrect ? '정답' : '오답'}
                      >
                        {isCorrect ? '\u2713' : '\u2717'}
                      </span>
                    ) : (
                      <span
                        className="shrink-0 text-sm text-text-tertiary"
                        aria-label="미답변"
                      >
                        -
                      </span>
                    )}

                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-sm text-text-primary" style={{ overflowWrap: 'break-word' }}>
                        {question.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <CategoryBadge category={question.category} />
                        <DifficultyBadge difficulty={question.difficulty} />
                      </div>
                    </div>

                    {answer ? (
                      <span className="tabular-nums text-sm font-medium text-text-tertiary">
                        {Math.round(answer.score * 100)}%
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Restart Button */}
        <div className="text-center">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-md bg-accent px-8 py-3 text-sm font-medium text-text-inverted transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            다시 시작
          </button>
        </div>
      </div>
    </main>
  );
}
