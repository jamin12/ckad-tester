import { useState } from 'react';

import type { Category, Difficulty } from '../../types/common.ts';
import type { QuizConfig } from '../../types/quiz.ts';
import type { QuizMode, LabConfig } from '../../types/lab.ts';
import {
  CATEGORIES,
  DIFFICULTY_CONFIG,
  DEFAULT_QUESTION_COUNT,
  DEFAULT_TIME_LIMIT,
} from '../../data/constants.ts';
import { ModeSelector } from './ModeSelector.tsx';
import { ClusterConnectionForm } from './ClusterConnectionForm.tsx';

interface HomePageProps {
  onStart: (config: QuizConfig) => void;
}

const ALL_CATEGORIES: Category[] = CATEGORIES.map((c) => c.id);
const ALL_DIFFICULTIES: Difficulty[] = Object.keys(DIFFICULTY_CONFIG) as Difficulty[];

export function HomePage({ onStart }: HomePageProps) {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([...ALL_CATEGORIES]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([...ALL_DIFFICULTIES]);
  const [questionCount, setQuestionCount] = useState(DEFAULT_QUESTION_COUNT);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(DEFAULT_TIME_LIMIT);
  const [mode, setMode] = useState<QuizMode>('simulation');
  const [labConfig, setLabConfig] = useState<LabConfig | undefined>(undefined);

  const canStart = selectedCategories.length > 0 && selectedDifficulties.length > 0 && (mode === 'simulation' || (mode === 'lab' && labConfig?.kubeconfig));

  function handleCategoryToggle(category: Category) {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  }

  function handleDifficultyToggle(difficulty: Difficulty) {
    setSelectedDifficulties((prev) =>
      prev.includes(difficulty)
        ? prev.filter((d) => d !== difficulty)
        : [...prev, difficulty],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canStart) return;

    onStart({
      categories: selectedCategories,
      difficulties: selectedDifficulties,
      questionCount,
      timeLimitMinutes,
      mode,
      labConfig,
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 pt-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-lg border border-border-subtle bg-surface-1 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.03)]"
      >
        <h2 className="mb-8 text-xl font-semibold text-text-primary">퀴즈 설정</h2>

        <ModeSelector mode={mode} onChange={setMode} />

        {mode === 'lab' ? (
          <ClusterConnectionForm onChange={setLabConfig} />
        ) : null}

        {/* Category Selection */}
        <fieldset className="mb-6">
          <legend className="mb-3 text-[12px] font-medium uppercase tracking-wider text-text-tertiary">카테고리</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CATEGORIES.map((cat) => {
              const inputId = `category-${cat.id}`;
              return (
                <label
                  key={cat.id}
                  htmlFor={inputId}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border-default px-3 py-2 transition-colors hover:border-border-strong"
                >
                  <input
                    type="checkbox"
                    id={inputId}
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => handleCategoryToggle(cat.id)}
                    className="h-4 w-4 rounded accent-accent"
                  />
                  <span className="text-sm text-text-secondary">{cat.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Difficulty Selection */}
        <fieldset className="mb-6">
          <legend className="mb-3 text-[12px] font-medium uppercase tracking-wider text-text-tertiary">난이도</legend>
          <div className="flex gap-3">
            {ALL_DIFFICULTIES.map((diff) => {
              const config = DIFFICULTY_CONFIG[diff];
              const inputId = `difficulty-${diff}`;
              return (
                <label
                  key={diff}
                  htmlFor={inputId}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border-default px-3 py-2 transition-colors hover:border-border-strong"
                >
                  <input
                    type="checkbox"
                    id={inputId}
                    checked={selectedDifficulties.includes(diff)}
                    onChange={() => handleDifficultyToggle(diff)}
                    className="h-4 w-4 rounded accent-accent"
                  />
                  <span className="text-sm text-text-secondary">{config.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Question Count + Time Limit */}
        <div className="mb-8 flex gap-6">
          <div>
            <label htmlFor="question-count" className="mb-2 block text-[12px] font-medium uppercase tracking-wider text-text-tertiary">
              문제 수
            </label>
            <input
              type="number"
              id="question-count"
              min={1}
              max={100}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-24 rounded-md border border-border-default bg-surface-3 px-3 py-2 text-sm tabular-nums text-text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            />
          </div>

          <div>
            <label htmlFor="time-limit" className="mb-2 block text-[12px] font-medium uppercase tracking-wider text-text-tertiary">
              시간 제한 (분)
            </label>
            <input
              type="number"
              id="time-limit"
              min={1}
              max={300}
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
              className="w-24 rounded-md border border-border-default bg-surface-3 px-3 py-2 text-sm tabular-nums text-text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            />
          </div>
        </div>

        {/* Start Button */}
        <button
          type="submit"
          disabled={!canStart}
          className="w-full rounded-md bg-accent px-6 py-3 text-sm font-medium text-text-inverted transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          퀴즈 시작
        </button>
      </form>
    </main>
  );
}
