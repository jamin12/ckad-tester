import type { Category } from '../../types/common.ts';
import { CATEGORY_MAP } from '../../data/constants.ts';

interface CategoryBadgeProps {
  category: Category;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const info = CATEGORY_MAP.get(category);

  if (!info) {
    return <span className="rounded-sm bg-surface-3 px-2 py-0.5 text-[11px] font-medium tracking-wide text-text-tertiary">{category}</span>;
  }

  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium tracking-wide ${info.color} ${info.bgColor}`}>
      {info.label}
    </span>
  );
}
