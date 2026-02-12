import { createContext, useReducer, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type {
  TerminalContextValue,
  TerminalState,
  TerminalLine,
  TerminalMode,
} from '../types/terminal.ts';

export interface ValidationResult {
  score: number;
  isPerfect: boolean;
  matchedAnswer: string;
  feedback: string;
}

export const TerminalContext = createContext<TerminalContextValue | null>(null);

type TerminalAction =
  | { type: 'ADD_LINE'; payload: { line: TerminalLine } }
  | { type: 'CLEAR' }
  | { type: 'SWITCH_MODE'; payload: { mode: TerminalMode } }
  | { type: 'SET_YAML_BUFFER'; payload: { buffer: string } }
  | { type: 'SET_PROCESSING'; payload: { isProcessing: boolean } };

function computeInitial(): TerminalState {
  return {
    lines: [],
    mode: 'command',
    yamlBuffer: '',
    isProcessing: false,
  };
}

function terminalReducer(
  state: TerminalState,
  action: TerminalAction,
): TerminalState {
  switch (action.type) {
    case 'ADD_LINE': {
      return {
        ...state,
        lines: [...state.lines, action.payload.line],
      };
    }

    case 'CLEAR': {
      return {
        ...state,
        lines: [],
      };
    }

    case 'SWITCH_MODE': {
      return {
        ...state,
        mode: action.payload.mode,
        yamlBuffer: action.payload.mode === 'yaml' ? '' : state.yamlBuffer,
      };
    }

    case 'SET_YAML_BUFFER': {
      return {
        ...state,
        yamlBuffer: action.payload.buffer,
      };
    }

    case 'SET_PROCESSING': {
      return {
        ...state,
        isProcessing: action.payload.isProcessing,
      };
    }

    default:
      return state;
  }
}

function generateLineId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function createLine(
  type: TerminalLine['type'],
  content: string,
): TerminalLine {
  return {
    id: generateLineId(),
    type,
    content,
    timestamp: Date.now(),
  };
}

const HELP_TEXT = `Available commands:
  help   - Show this help message
  hint   - Reveal next hint for current question
  skip   - Skip to next question
  clear  - Clear terminal output
  yaml   - Switch to YAML input mode
  exit   - Exit YAML mode (return to command mode)

Type your kubectl command or answer directly.`;

interface TerminalProviderProps {
  onValidate: (input: string) => ValidationResult;
  children: ReactNode;
}

export function TerminalProvider({
  onValidate,
  children,
}: TerminalProviderProps) {
  const [state, dispatch] = useReducer(
    terminalReducer,
    undefined,
    computeInitial,
  );

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const addLine = useCallback(
    (type: TerminalLine['type'], content: string) => {
      dispatch({ type: 'ADD_LINE', payload: { line: createLine(type, content) } });
    },
    [],
  );

  const submit = useCallback(
    (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      const lower = trimmed.toLowerCase();

      switch (lower) {
        case 'help': {
          addLine('system', HELP_TEXT);
          return;
        }

        case 'clear': {
          dispatch({ type: 'CLEAR' });
          return;
        }

        case 'yaml': {
          dispatch({ type: 'SWITCH_MODE', payload: { mode: 'yaml' } });
          addLine('system', 'Switched to YAML input mode. Type "exit" to return to command mode.');
          return;
        }

        case 'exit': {
          dispatch({ type: 'SWITCH_MODE', payload: { mode: 'command' } });
          addLine('system', 'Returned to command mode.');
          return;
        }

        case 'hint': {
          addLine('system', 'Requesting hint...');
          return;
        }

        case 'skip': {
          addLine('system', 'Skipping to next question...');
          return;
        }

        default: {
          addLine('input', trimmed);

          dispatch({
            type: 'SET_PROCESSING',
            payload: { isProcessing: true },
          });

          const result = onValidate(trimmed);

          dispatch({
            type: 'SET_PROCESSING',
            payload: { isProcessing: false },
          });

          if (result.score >= 1) {
            addLine('success', result.feedback);
          } else if (result.score > 0) {
            addLine('output', result.feedback);
          } else {
            addLine('error', result.feedback);
          }

          return;
        }
      }
    },
    [addLine, onValidate],
  );

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const revealHint = useCallback(() => {
    addLine('system', 'Requesting hint...');
  }, [addLine]);

  const switchMode = useCallback((mode: TerminalMode) => {
    dispatch({ type: 'SWITCH_MODE', payload: { mode } });
  }, []);

  const contextValue: TerminalContextValue = {
    state,
    actions: {
      submit,
      clear,
      revealHint,
      switchMode,
    },
    meta: {
      inputRef,
      bottomRef,
    },
  };

  return (
    <TerminalContext value={contextValue}>
      {children}
    </TerminalContext>
  );
}
