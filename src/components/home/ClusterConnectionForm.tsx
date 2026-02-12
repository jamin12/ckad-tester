import { useState, useCallback, useEffect, useRef } from 'react';
import { parse as parseYaml } from 'yaml';
import type { LabConfig } from '../../types/lab.ts';

const STORAGE_KEY = 'ckad-tester:labConfig';

interface ClusterConnectionFormProps {
  onChange: (config: LabConfig) => void;
}

interface KubeconfigInfo {
  server: string | null;
  namespace: string | null;
}

function extractKubeconfigInfo(raw: string): KubeconfigInfo {
  try {
    const doc = parseYaml(raw) as Record<string, unknown>;
    const currentContext = doc['current-context'] as string | undefined;
    const contexts = doc['contexts'] as Array<{ name: string; context: { cluster: string; namespace?: string } }> | undefined;
    const clusters = doc['clusters'] as Array<{ name: string; cluster: { server: string } }> | undefined;

    const ctx = contexts?.find((c) => c.name === currentContext);
    const clusterName = ctx?.context?.cluster;
    const cluster = clusters?.find((c) => c.name === clusterName);

    return {
      server: cluster?.cluster?.server ?? null,
      namespace: ctx?.context?.namespace ?? null,
    };
  } catch {
    return { server: null, namespace: null };
  }
}

function loadCached(): { kubeconfig: string; namespace: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { kubeconfig?: string; namespace?: string };
    if (!parsed.kubeconfig) return null;
    return { kubeconfig: parsed.kubeconfig, namespace: parsed.namespace ?? '' };
  } catch {
    return null;
  }
}

function saveCache(kubeconfig: string, namespace: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ kubeconfig, namespace }));
}

function clearCache(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function ClusterConnectionForm({ onChange }: ClusterConnectionFormProps) {
  const cached = loadCached();
  const [kubeconfig, setKubeconfig] = useState(cached?.kubeconfig ?? '');
  const [namespace, setNamespace] = useState(cached?.namespace ?? '');
  const [info, setInfo] = useState<KubeconfigInfo>(() =>
    cached?.kubeconfig ? extractKubeconfigInfo(cached.kubeconfig) : { server: null, namespace: null },
  );

  // 마운트 시 캐시된 값으로 부모에 알림 (1회)
  const notifiedRef = useRef(false);
  useEffect(() => {
    if (!notifiedRef.current && cached?.kubeconfig) {
      notifiedRef.current = true;
      const ns = cached.namespace || extractKubeconfigInfo(cached.kubeconfig).namespace || undefined;
      onChange({ kubeconfig: cached.kubeconfig, namespace: ns });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKubeconfigChange = useCallback(
    (raw: string) => {
      setKubeconfig(raw);
      const extracted = extractKubeconfigInfo(raw);
      setInfo(extracted);

      if (extracted.namespace && !namespace) {
        setNamespace(extracted.namespace);
      }

      const ns = namespace || extracted.namespace || undefined;
      saveCache(raw, namespace || extracted.namespace || '');
      onChange({ kubeconfig: raw, namespace: ns });
    },
    [namespace, onChange],
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        handleKubeconfigChange(text);
      };
      reader.readAsText(file);
    },
    [handleKubeconfigChange],
  );

  const handleClear = useCallback(() => {
    clearCache();
    setKubeconfig('');
    setNamespace('');
    setInfo({ server: null, namespace: null });
    onChange({ kubeconfig: '', namespace: undefined });
  }, [onChange]);

  return (
    <fieldset className="mb-6 rounded-md border border-border-subtle p-4">
      <legend className="px-2 text-[12px] font-medium uppercase tracking-wider text-text-tertiary">클러스터 연결 설정</legend>

      {/* Kubeconfig Input */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="cluster-kubeconfig" className="text-xs text-text-tertiary">
            Kubeconfig
          </label>
          <div className="flex gap-2">
            {kubeconfig ? (
              <button
                type="button"
                onClick={handleClear}
                className="rounded border border-danger/40 px-2 py-0.5 text-xs text-danger transition-colors hover:border-danger hover:text-danger"
              >
                초기화
              </button>
            ) : null}
            <label
              htmlFor="kubeconfig-file"
              className="cursor-pointer rounded border border-border-default px-2 py-0.5 text-xs text-text-tertiary transition-colors hover:border-border-strong hover:text-text-secondary"
            >
              파일 선택
              <input
                type="file"
                id="kubeconfig-file"
                accept=".yaml,.yml,.conf,*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
        <textarea
          id="cluster-kubeconfig"
          placeholder={'apiVersion: v1\nclusters:\n- cluster:\n    server: https://...'}
          value={kubeconfig}
          onChange={(e) => handleKubeconfigChange(e.target.value)}
          rows={8}
          className="font-terminal w-full rounded-md border border-border-default bg-surface-3 px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        />
      </div>

      {/* Extracted Info */}
      {info.server ? (
        <div className="font-terminal mb-4 rounded-md border border-border-subtle bg-surface-2 px-3 py-2 text-xs text-text-secondary">
          <span className="text-text-tertiary">Server:</span>{' '}
          <span>{info.server}</span>
        </div>
      ) : null}

      {/* Namespace Override */}
      <div>
        <label htmlFor="cluster-namespace" className="mb-1 block text-xs text-text-tertiary">
          Namespace {info.namespace ? <span className="text-text-tertiary">(kubeconfig: {info.namespace})</span> : null}
        </label>
        <input
          type="text"
          id="cluster-namespace"
          placeholder="default"
          value={namespace}
          onChange={(e) => {
            setNamespace(e.target.value);
            saveCache(kubeconfig, e.target.value);
            onChange({ kubeconfig, namespace: e.target.value || info.namespace || undefined });
          }}
          className="w-48 rounded-md border border-border-default bg-surface-3 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        />
      </div>
    </fieldset>
  );
}
