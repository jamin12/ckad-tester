import { useLab } from '../../hooks/useLab.ts';

export function ConnectionStatus() {
  const { state } = useLab();

  const statusConfig = {
    disconnected: { color: 'bg-text-tertiary', text: '미연결' },
    connecting: { color: 'bg-warning animate-pulse', text: '연결 중...' },
    connected: { color: 'bg-success', text: '연결됨' },
    error: { color: 'bg-danger', text: '오류' },
  } as const;

  const config = statusConfig[state.status];

  return (
    <div className="flex items-center gap-2" aria-label={`클러스터 연결 상태: ${config.text}`}>
      <span className={`h-2 w-2 rounded-full ${config.color}`} />
      <span className="text-xs text-text-tertiary">{config.text}</span>
      {state.error ? (
        <span className="text-xs text-danger" title={state.error}>{'\u26A0'}</span>
      ) : null}
    </div>
  );
}
