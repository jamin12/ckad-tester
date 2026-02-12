import type { ReactNode } from 'react';

interface TerminalProps {
  children: ReactNode;
}

export function Terminal({ children }: TerminalProps) {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface-3 font-mono"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Title bar */}
      <div className="flex items-center border-b border-border-subtle px-3 py-1.5">
        <span className="text-[11px] font-medium tracking-wide text-text-tertiary">TERMINAL</span>
      </div>

      {/* Terminal content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
