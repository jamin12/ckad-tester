import { use } from 'react';
import { LabContext } from '../context/LabContext.tsx';
import type { LabContextValue } from '../context/LabContext.tsx';

export function useLab(): LabContextValue {
  const context = use(LabContext);

  if (context === null) {
    throw new Error('useLab must be used within a LabProvider');
  }

  return context;
}
