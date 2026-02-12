export interface ClusterConnectionConfig {
  kubeconfig: string;
  namespace?: string;
}

export interface LabSession {
  sessionId: string;
  connectedAt: number;
  namespace: string;
}

export interface VerificationCheck {
  description: string;
  command: string;
  expected: string;
  jsonpath?: string;
  weight?: number;
}

export interface CheckResult {
  description: string;
  passed: boolean;
  actual: string;
  expected: string;
}

export interface VerificationResponse {
  questionId: string;
  passed: boolean;
  score: number;
  checks: CheckResult[];
}

export type WsClientMessage =
  | { type: 'auth'; config: ClusterConnectionConfig }
  | { type: 'input'; data: string }
  | { type: 'resize'; cols: number; rows: number };

export type WsServerMessage =
  | { type: 'output'; data: string }
  | { type: 'connected'; session: LabSession }
  | { type: 'error'; message: string }
  | { type: 'disconnected'; reason: string };
