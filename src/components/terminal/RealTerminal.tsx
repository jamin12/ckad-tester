import { useEffect, useRef } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { useLab } from '../../hooks/useLab.ts';

export function RealTerminal() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<XTerminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const { state, meta } = useLab();

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerminal({
      theme: {
        background: '#27272b',
        foreground: '#ececef',
        cursor: '#ececef',
        selectionBackground: '#333338',
        black: '#111113',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#bb9af7',
        cyan: '#7dcfff',
        white: '#a9b1d6',
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', Consolas, monospace",
      fontSize: 14,
      cursorBlink: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(containerRef.current);

    // 초기 fit + 크기 전송
    requestAnimationFrame(() => {
      fitAddon.fit();
      const ws = meta.wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    });

    termRef.current = term;
    fitRef.current = fitAddon;

    // 사용자 입력 → WebSocket input 전송
    const dataDisposable = term.onData((data: string) => {
      const ws = meta.wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    // 터미널 리사이즈 → WebSocket resize 전송
    const resizeDisposable = term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
      const ws = meta.wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }));
      }
    });

    // 컨테이너 리사이즈 감지
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        fitAddon.fit();
      });
    });
    observer.observe(containerRef.current);

    return () => {
      dataDisposable.dispose();
      resizeDisposable.dispose();
      observer.disconnect();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket 메시지 → 터미널 출력 연결
  useEffect(() => {
    const ws = meta.wsRef.current;
    if (!ws || !termRef.current) return;

    function handleMessage(event: MessageEvent) {
      try {
        const msg = JSON.parse(String(event.data)) as { type: string; data?: string };
        if (msg.type === 'output' && msg.data && termRef.current) {
          termRef.current.write(msg.data);
        }
      } catch {
        // 무시
      }
    }

    ws.addEventListener('message', handleMessage);
    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [state.status, meta.wsRef]);

  // 연결 완료 시 정확한 터미널 크기 전송
  useEffect(() => {
    if (state.status !== 'connected') return;
    const ws = meta.wsRef.current;
    const term = termRef.current;
    const fit = fitRef.current;
    if (!ws || !term || !fit || ws.readyState !== WebSocket.OPEN) return;

    requestAnimationFrame(() => {
      fit.fit();
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    });
  }, [state.status, meta.wsRef]);

  // 연결 끊김 시 xterm에 시각적 피드백
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    if (state.status === 'error') {
      term.writeln('\r\n\x1b[1;31m[Connection Error] ' + (state.error ?? 'Terminal disconnected.') + '\x1b[0m');
    } else if (state.status === 'disconnected') {
      term.writeln('\r\n\x1b[1;33m[Disconnected] Terminal session ended.\x1b[0m');
    }
  }, [state.status, state.error]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden rounded-lg border border-border-subtle bg-surface-3 p-2"
      role="log"
      aria-label="실제 터미널"
    />
  );
}
