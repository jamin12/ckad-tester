import { useRef, useEffect } from 'react';

import { useTerminal } from '../../hooks/useTerminal.ts';

export function TerminalYamlInput() {
  const { actions } = useTerminal();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const hasContentRef = useRef(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  function handleSubmit() {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const value = textarea.value.trim();
    if (!value) return;

    actions.submit(value);
    textarea.value = '';
    hasContentRef.current = false;
  }

  function handleExit() {
    actions.switchMode('command');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const textarea = e.currentTarget;

    // Ctrl+C to exit yaml mode
    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      handleExit();
      return;
    }

    // Ctrl+Enter always submits
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
      return;
    }

    // Enter on empty line after content: submit
    if (e.key === 'Enter' && !e.shiftKey) {
      const value = textarea.value;
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = value.slice(0, cursorPos);
      const lastNewline = textBeforeCursor.lastIndexOf('\n');
      const currentLine = textBeforeCursor.slice(lastNewline + 1);

      if (currentLine.trim() === '' && hasContentRef.current) {
        e.preventDefault();
        handleSubmit();
        return;
      }

      if (value.trim().length > 0) {
        hasContentRef.current = true;
      }
    }

    // Check "exit" command
    if (e.key === 'Enter') {
      const value = textarea.value.trim();
      if (value.toLowerCase() === 'exit') {
        e.preventDefault();
        textarea.value = '';
        handleExit();
        return;
      }
    }
  }

  return (
    <div className="border-t border-border-subtle px-3 py-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-text-tertiary" aria-hidden="true">yaml&gt;</span>
        <span className="text-xs text-text-tertiary">Ctrl+Enter: 제출 | Ctrl+C: 나가기</span>
      </div>
      <textarea
        ref={textareaRef}
        rows={8}
        aria-label="YAML 매니페스트 입력"
        className="w-full resize-y rounded border border-border-subtle bg-surface-0 p-2 font-mono text-sm text-text-primary placeholder-text-tertiary focus:border-accent/50 focus:outline-none"
        placeholder="apiVersion: v1&#10;kind: Pod&#10;metadata:&#10;  name: my-pod&#10;..."
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
