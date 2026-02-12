import { createContext, useReducer, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { LabConnectionState, LabConfig, ConnectionStatus } from '../types/lab.ts';
import type { VerificationCheck, VerificationResponse, WsServerMessage } from '../types/lab.ts';

export interface LabActions {
  connect: (config: LabConfig) => void;
  disconnect: () => void;
  verify: (questionId: string, checks: VerificationCheck[]) => Promise<VerificationResponse>;
}

export interface LabMeta {
  wsRef: React.RefObject<WebSocket | null>;
}

export interface LabContextValue {
  state: LabConnectionState;
  actions: LabActions;
  meta: LabMeta;
}

export const LabContext = createContext<LabContextValue | null>(null);

type LabAction =
  | { type: 'SET_STATUS'; payload: { status: ConnectionStatus } }
  | { type: 'CONNECTED'; payload: { sessionId: string; namespace: string } }
  | { type: 'ERROR'; payload: { error: string } }
  | { type: 'DISCONNECTED' };

function computeInitial(): LabConnectionState {
  return {
    status: 'disconnected',
    sessionId: null,
    clusterInfo: null,
    error: null,
    namespace: 'default',
  };
}

function labReducer(state: LabConnectionState, action: LabAction): LabConnectionState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.payload.status, error: null };
    case 'CONNECTED':
      return {
        ...state,
        status: 'connected',
        sessionId: action.payload.sessionId,
        namespace: action.payload.namespace,
        error: null,
      };
    case 'ERROR':
      return { ...state, status: 'error', error: action.payload.error };
    case 'DISCONNECTED':
      return { ...computeInitial() };
    default:
      return state;
  }
}

interface LabProviderProps {
  children: ReactNode;
  onTerminalData?: (data: string) => void;
}

export function LabProvider({ children, onTerminalData }: LabProviderProps) {
  const [state, dispatch] = useReducer(labReducer, undefined, computeInitial);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback((config: LabConfig) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    dispatch({ type: 'SET_STATUS', payload: { status: 'connecting' } });

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/terminal`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'auth',
        config: {
          kubeconfig: config.kubeconfig,
          namespace: config.namespace,
        },
      }));
    };

    ws.onmessage = (event: MessageEvent) => {
      const msg = JSON.parse(String(event.data)) as WsServerMessage;
      switch (msg.type) {
        case 'connected':
          dispatch({
            type: 'CONNECTED',
            payload: { sessionId: msg.session.sessionId, namespace: msg.session.namespace },
          });
          break;
        case 'output':
          onTerminalData?.(msg.data);
          break;
        case 'error':
          dispatch({ type: 'ERROR', payload: { error: msg.message } });
          break;
        case 'disconnected':
          dispatch({ type: 'DISCONNECTED' });
          break;
      }
    };

    ws.onclose = () => {
      dispatch({ type: 'DISCONNECTED' });
      wsRef.current = null;
    };

    ws.onerror = () => {
      dispatch({ type: 'ERROR', payload: { error: '연결에 실패했습니다.' } });
    };
  }, [onTerminalData]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    dispatch({ type: 'DISCONNECTED' });
  }, []);

  const verify = useCallback(async (questionId: string, checks: VerificationCheck[]): Promise<VerificationResponse> => {
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: state.sessionId,
        questionId,
        checks,
      }),
    });

    if (!response.ok) {
      throw new Error(`Verification failed: ${response.statusText}`);
    }

    return response.json() as Promise<VerificationResponse>;
  }, [state.sessionId]);

  const contextValue: LabContextValue = {
    state,
    actions: { connect, disconnect, verify },
    meta: { wsRef },
  };

  return (
    <LabContext value={contextValue}>
      {children}
    </LabContext>
  );
}
