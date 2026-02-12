import { useEffect } from 'react';

import { useTerminal } from '../../hooks/useTerminal.ts';
import type { TerminalLineType } from '../../types/terminal.ts';

const LINE_STYLES: Record<TerminalLineType, string> = {
  input: 'text-text-primary',
  output: 'text-text-secondary',
  success: 'text-[#6db88a]',
  error: 'text-[#c46060]',
  hint: 'text-[#c4a24e]',
  system: 'text-text-tertiary',
};

const LINE_PREFIXES: Record<TerminalLineType, string> = {
  input: '$ ',
  output: '',
  success: '\u2713 ',
  error: '\u2717 ',
  hint: '\uD83D\uDCA1 ',
  system: '',
};

export function TerminalOutput() {
  const { state, meta } = useTerminal();

  useEffect(() => {
    if (meta.bottomRef.current) {
      meta.bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.lines.length, meta.bottomRef]);

  return (
    <div
      role="log"
      aria-live="polite"
      className="flex-1 overflow-y-auto px-3 py-2"
    >
      {state.lines.length === 0 ? (
        <p className="text-sm text-text-tertiary">
          명령어를 입력하세요. &quot;help&quot;를 입력하면 도움말을 볼 수 있습니다.
        </p>
      ) : null}

      {state.lines.map((line) => (
        <div
          key={line.id}
          className={`whitespace-pre-wrap text-sm leading-relaxed ${LINE_STYLES[line.type]}`}
          style={{ overflowWrap: 'break-word' }}
        >
          <span aria-hidden="true">{LINE_PREFIXES[line.type]}</span>
          {line.content}
        </div>
      ))}

      <div ref={meta.bottomRef} />
    </div>
  );
}
