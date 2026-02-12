import type { Category } from '../../types/common.ts';
import { CATEGORY_MAP } from '../../data/constants.ts';

export interface CategoryScore {
  category: Category;
  correct: number;
  total: number;
  percentage: number;
}

interface ScoreChartProps {
  categoryScores: CategoryScore[];
}

export function ScoreChart({ categoryScores }: ScoreChartProps) {
  if (categoryScores.length === 0) {
    return <p className="text-sm text-text-tertiary">점수 데이터가 없습니다</p>;
  }

  return (
    <div className="space-y-4" role="list" aria-label="카테고리별 점수 차트">
      {categoryScores.map((score) => {
        const info = CATEGORY_MAP.get(score.category);
        const label = info ? info.label : score.category;

        return (
          <div key={score.category} role="listitem" className="space-y-1">
            {/* Label and counts */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">{label}</span>
              <span className="tabular-nums text-sm text-text-tertiary">
                {score.correct}/{score.total} ({score.percentage}%)
              </span>
            </div>

            {/* Bar */}
            <div className="h-2.5 w-full overflow-hidden rounded-sm bg-accent-muted">
              <div
                className="h-full rounded-sm bg-accent transition-all duration-500 motion-reduce:transition-none"
                style={{
                  width: `${score.percentage}%`,
                }}
                role="progressbar"
                aria-valuenow={score.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${label}: ${score.percentage}%`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
