import type { Question } from '../types/question.ts';
import type { QuizConfig } from '../types/quiz.ts';

import { applicationDesignQuestions } from '../data/questions/application-design.ts';
import { environmentConfigQuestions } from '../data/questions/environment-config.ts';
import { deploymentQuestions } from '../data/questions/deployment.ts';
import { servicesNetworkingQuestions } from '../data/questions/services-networking.ts';
import { observabilityQuestions } from '../data/questions/observability.ts';

const ALL_QUESTIONS: Question[] = [
  ...applicationDesignQuestions,
  ...environmentConfigQuestions,
  ...deploymentQuestions,
  ...servicesNetworkingQuestions,
  ...observabilityQuestions,
];

/**
 * Fisher-Yates shuffle (in-place, O(n))
 */
function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = temp;
  }
  return arr;
}

export function loadQuestions(config: QuizConfig): Question[] {
  const categorySet = new Set(config.categories);
  const difficultySet = new Set(config.difficulties);

  // Single loop: filter into result array, then shuffle + slice
  const filtered: Question[] = [];
  for (const q of ALL_QUESTIONS) {
    if (categorySet.has(q.category) && difficultySet.has(q.difficulty)) {
      filtered.push(q);
    }
  }

  // Fisher-Yates shuffle in place
  shuffleInPlace(filtered);

  // Slice to requested count
  return filtered.slice(0, config.questionCount);
}
