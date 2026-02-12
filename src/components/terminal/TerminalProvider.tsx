import type { ReactNode } from 'react';

import { TerminalProvider as TerminalContextProvider } from '../../context/TerminalContext.tsx';
import type { ValidationResult } from '../../context/TerminalContext.tsx';

interface TerminalProviderWrapperProps {
  onValidate: (input: string) => ValidationResult;
  children: ReactNode;
}

export function TerminalProvider({ onValidate, children }: TerminalProviderWrapperProps) {
  return (
    <TerminalContextProvider onValidate={onValidate}>
      {children}
    </TerminalContextProvider>
  );
}
