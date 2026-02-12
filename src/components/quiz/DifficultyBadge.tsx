import type { Difficulty } from '../../types/common.ts';
import { DIFFICULTY_CONFIG } from '../../data/constants.ts';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const config = DIFFICULTY_CONFIG[difficulty];

  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium tracking-wide ${config.color} ${config.bgColor}`}>
      {config.label}
    </span>
  );
}
