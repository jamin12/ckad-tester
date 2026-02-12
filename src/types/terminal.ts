export type TerminalLineType = 'input' | 'output' | 'success' | 'error' | 'hint' | 'system';

export interface TerminalLine {
  id: string;
  type: TerminalLineType;
  content: string;
  timestamp: number;
}

export type TerminalMode = 'command' | 'yaml';

export interface TerminalState {
  lines: TerminalLine[];
  mode: TerminalMode;
  yamlBuffer: string;
  isProcessing: boolean;
}

export interface TerminalActions {
  submit: (input: string) => void;
  clear: () => void;
  revealHint: () => void;
  switchMode: (mode: TerminalMode) => void;
}

export interface TerminalMeta {
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}

export interface TerminalContextValue {
  state: TerminalState;
  actions: TerminalActions;
  meta: TerminalMeta;
}
