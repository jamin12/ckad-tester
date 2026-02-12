import type { VerificationCheck, VerificationResponse, LabSession, WsServerMessage } from '../../packages/shared/src/lab.ts';

export type QuizMode = 'simulation' | 'lab';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface LabConnectionState {
  status: ConnectionStatus;
  sessionId: string | null;
  clusterInfo: string | null;
  error: string | null;
  namespace: string;
}

export interface LabConfig {
  kubeconfig: string;
  namespace?: string;
}

export type { VerificationCheck, VerificationResponse, LabSession, WsServerMessage };
