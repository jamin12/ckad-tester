import type { QuizMode } from '../../types/lab.ts';

interface ModeSelectorProps {
  mode: QuizMode;
  onChange: (mode: QuizMode) => void;
}

const MODE_DESCRIPTIONS: Record<QuizMode, string> = {
  simulation: '패턴 매칭 기반 검증',
  lab: '실제 K8s 클러스터 연동',
};

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <fieldset className="mb-6">
      <legend className="mb-3 text-[12px] font-medium uppercase tracking-wider text-text-tertiary">모드</legend>
      <div className="inline-flex rounded-md border border-border-default bg-surface-0 p-0.5">
        <button
          type="button"
          onClick={() => onChange('simulation')}
          className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === 'simulation'
              ? 'bg-surface-2 text-text-primary'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          Simulation
        </button>
        <button
          type="button"
          onClick={() => onChange('lab')}
          className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === 'lab'
              ? 'bg-surface-2 text-text-primary'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          Lab
        </button>
      </div>
      <p className="mt-2 text-[12px] text-text-tertiary">{MODE_DESCRIPTIONS[mode]}</p>
    </fieldset>
  );
}
