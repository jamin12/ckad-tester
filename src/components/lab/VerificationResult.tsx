import type { VerificationResponse } from '../../types/lab.ts';

interface VerificationResultProps {
  result: VerificationResponse;
}

export function VerificationResult({ result }: VerificationResultProps) {
  const scorePercent = Math.round(result.score * 100);

  return (
    <div
      className="mt-3 rounded-md border border-border-subtle bg-surface-2 p-4"
      role="region"
      aria-label="검증 결과"
    >
      {/* Header: PASSED/FAILED + Score */}
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`rounded-sm px-2 py-1 text-xs font-bold ${
            result.passed
              ? 'bg-success-muted text-success'
              : 'bg-danger-muted text-danger'
          }`}
        >
          {result.passed ? 'PASSED' : 'FAILED'}
        </span>
        <span className="tabular-nums text-sm text-text-secondary">{scorePercent}%</span>
      </div>

      {/* Check List */}
      <ul className="space-y-2">
        {result.checks.map((check, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <span className={check.passed ? 'text-success' : 'text-danger'}>
              {check.passed ? '\u2713' : '\u2717'}
            </span>
            <div className="flex-1">
              <p className="text-text-primary">{check.description}</p>
              {!check.passed ? (
                <p className="mt-1 text-xs text-text-tertiary">
                  Expected: {check.expected} | Actual: {check.actual}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
