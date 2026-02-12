import { use } from 'react';
import { TerminalContext } from '../context/TerminalContext.tsx';
import type { TerminalContextValue } from '../types/terminal.ts';

export function useTerminal(): TerminalContextValue {
  const context = use(TerminalContext);

  if (context === null) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }

  return context;
}
