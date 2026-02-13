import { useRef, useEffect, type RefObject } from 'react';

import { useTerminal } from '../../hooks/useTerminal.ts';

const PROMPT_PREFIX = <span className="text-text-tertiary" aria-hidden="true">$ </span>;

interface TerminalInputProps {
  ref: RefObject<HTMLTextAreaElement | null>;
}

export function TerminalInput({ ref }: TerminalInputProps) {
  const { actions } = useTerminal();
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [ref]);

  function autoResize(textarea: HTMLTextAreaElement) {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const textarea = e.currentTarget;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const value = textarea.value.trim();
      if (!value) return;

      historyRef.current.push(value);
      historyIndexRef.current = -1;
      actions.submit(value);
      textarea.value = '';
      autoResize(textarea);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const history = historyRef.current;
      if (history.length === 0) return;

      if (historyIndexRef.current === -1) {
        historyIndexRef.current = history.length - 1;
      } else if (historyIndexRef.current > 0) {
        historyIndexRef.current -= 1;
      }

      textarea.value = history[historyIndexRef.current] ?? '';
      autoResize(textarea);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const history = historyRef.current;

      if (historyIndexRef.current === -1) return;

      if (historyIndexRef.current < history.length - 1) {
        historyIndexRef.current += 1;
        textarea.value = history[historyIndexRef.current] ?? '';
      } else {
        historyIndexRef.current = -1;
        textarea.value = '';
      }
      autoResize(textarea);
      return;
    }
  }

  return (
    <div className="flex items-start border-t border-border-subtle px-3 py-2">
      <span className="mt-0.5">{PROMPT_PREFIX}</span>
      <textarea
        ref={ref}
        rows={1}
        aria-label="kubectl 명령어 입력"
        className="max-h-32 flex-1 resize-none overflow-y-auto bg-transparent text-sm text-text-primary placeholder-text-tertiary focus:outline-none"
        placeholder="kubectl ..."
        onKeyDown={handleKeyDown}
        onInput={(e) => autoResize(e.currentTarget)}
      />
    </div>
  );
}
