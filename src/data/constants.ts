import type { Category, Difficulty } from '../types/common.ts';

export interface CategoryInfo {
  id: Category;
  label: string;
  weight: number;
  color: string;
  bgColor: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'application-design',
    label: '애플리케이션 설계 및 빌드',
    weight: 0.2,
    color: 'text-cat-design',
    bgColor: 'bg-cat-design/6',
  },
  {
    id: 'environment-config',
    label: '환경, 구성 및 보안',
    weight: 0.25,
    color: 'text-cat-config',
    bgColor: 'bg-cat-config/6',
  },
  {
    id: 'deployment',
    label: '배포',
    weight: 0.2,
    color: 'text-cat-deploy',
    bgColor: 'bg-cat-deploy/6',
  },
  {
    id: 'services-networking',
    label: '서비스 및 네트워킹',
    weight: 0.2,
    color: 'text-cat-network',
    bgColor: 'bg-cat-network/6',
  },
  {
    id: 'observability',
    label: '관찰 가능성 및 유지보수',
    weight: 0.15,
    color: 'text-cat-observe',
    bgColor: 'bg-cat-observe/6',
  },
];

export const CATEGORY_MAP = new Map<Category, CategoryInfo>(
  CATEGORIES.map((c) => [c.id, c]),
);

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; color: string; bgColor: string; multiplier: number }
> = {
  easy: {
    label: 'Easy',
    color: 'text-diff-easy',
    bgColor: 'bg-diff-easy/6',
    multiplier: 1,
  },
  medium: {
    label: 'Medium',
    color: 'text-diff-medium',
    bgColor: 'bg-diff-medium/6',
    multiplier: 1.5,
  },
  hard: {
    label: 'Hard',
    color: 'text-diff-hard',
    bgColor: 'bg-diff-hard/6',
    multiplier: 2,
  },
};

export const PASS_THRESHOLD = 0.7;
export const PERFECT_THRESHOLD = 0.9;
export const DEFAULT_TIME_LIMIT = 120;
export const DEFAULT_QUESTION_COUNT = 25;
