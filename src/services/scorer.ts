import type { Category } from '../types/common.ts';
import type { Question } from '../types/question.ts';
import type { UserAnswer } from '../types/quiz.ts';

import { CATEGORY_MAP } from '../data/constants.ts';

export interface CategoryScore {
  category: Category;
  correct: number;
  total: number;
  perfect: number;
  percentage: number;
  weightedScore: number;
}

export interface QuizResult {
  totalScore: number;
  weightedScore: number;
  correctCount: number;
  perfectCount: number;
  totalQuestions: number;
  categoryScores: CategoryScore[];
  passed: boolean;
}

export function calculateResult(
  questions: Question[],
  answers: Map<string, UserAnswer>,
): QuizResult {
  // Accumulator map for per-category stats
  const categoryAccum = new Map<
    Category,
    { correct: number; total: number; perfect: number; scoreSum: number }
  >();

  let totalCorrect = 0;
  let totalPerfect = 0;
  let totalScoreSum = 0;

  // SINGLE loop over questions: accumulate all stats at once
  for (const question of questions) {
    const { category, id } = question;

    // Initialize category accumulator if needed
    let accum = categoryAccum.get(category);
    if (!accum) {
      accum = { correct: 0, total: 0, perfect: 0, scoreSum: 0 };
      categoryAccum.set(category, accum);
    }

    accum.total++;

    const answer = answers.get(id);
    if (answer) {
      accum.scoreSum += answer.score;
      totalScoreSum += answer.score;

      if (answer.score >= 0.7) {
        accum.correct++;
        totalCorrect++;
      }

      if (answer.isPerfect) {
        accum.perfect++;
        totalPerfect++;
      }
    }
  }

  // Build category scores and compute weighted score
  const categoryScores: CategoryScore[] = [];
  let weightedScore = 0;

  for (const [category, accum] of categoryAccum) {
    const info = CATEGORY_MAP.get(category);
    const weight = info?.weight ?? 0;
    const percentage = accum.total > 0 ? accum.scoreSum / accum.total : 0;
    const catWeightedScore = percentage * weight;

    weightedScore += catWeightedScore;

    categoryScores.push({
      category,
      correct: accum.correct,
      total: accum.total,
      perfect: accum.perfect,
      percentage: Math.round(percentage * 100),
      weightedScore: catWeightedScore,
    });
  }

  const totalQuestions = questions.length;
  const totalScore =
    totalQuestions > 0 ? Math.round((totalScoreSum / totalQuestions) * 100) : 0;

  return {
    totalScore,
    weightedScore: Math.round(weightedScore * 100) / 100,
    correctCount: totalCorrect,
    perfectCount: totalPerfect,
    totalQuestions,
    categoryScores,
    passed: weightedScore >= 0.66,
  };
}
