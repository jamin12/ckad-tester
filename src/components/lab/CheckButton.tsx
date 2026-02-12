import { useState } from 'react';
import { useLab } from '../../hooks/useLab.ts';
import type { VerificationCheck, VerificationResponse } from '../../types/lab.ts';

interface CheckButtonProps {
  questionId: string;
  checks: VerificationCheck[];
  onResult: (result: VerificationResponse) => void;
  disabled?: boolean;
}

export function CheckButton({ questionId, checks, onResult, disabled = false }: CheckButtonProps) {
  const { actions } = useLab();
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    if (isLoading || disabled) return;

    setIsLoading(true);
    try {
      const result = await actions.verify(questionId, checks);
      onResult(result);
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-label="답안 확인"
      className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-inverted transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          검증 중...
        </span>
      ) : (
        'Check'
      )}
    </button>
  );
}
