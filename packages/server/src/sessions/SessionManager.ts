import { KubeConfig, CoreV1Api, Exec } from '@kubernetes/client-node';
import { randomUUID } from 'node:crypto';
import { SERVER_CONFIG } from '../config.js';
import { cleanupWorkspacePod } from '../ws/workspacePod.js';
import type { ClusterConnectionConfig, LabSession } from '@ckad-tester/shared/lab';

interface SessionEntry {
  session: LabSession;
  kubeConfig: KubeConfig;
  coreApi: CoreV1Api;
  exec: Exec;
  namespace: string;
  createdAt: number;
  lastActiveAt: number;
}

class SessionManager {
  private sessions = new Map<string, SessionEntry>();

  createSession(config: ClusterConnectionConfig): SessionEntry {
    const kc = new KubeConfig();
    kc.loadFromString(config.kubeconfig);

    const ctxObj = kc.getContextObject(kc.currentContext);
    const namespace = config.namespace || ctxObj?.namespace || 'default';

    const coreApi = kc.makeApiClient(CoreV1Api);
    const exec = new Exec(kc);
    const sessionId = randomUUID();
    const now = Date.now();

    const entry: SessionEntry = {
      session: { sessionId, connectedAt: now, namespace },
      kubeConfig: kc,
      coreApi,
      exec,
      namespace,
      createdAt: now,
      lastActiveAt: now,
    };

    this.sessions.set(sessionId, entry);
    return entry;
  }

  getSession(sessionId: string): SessionEntry | undefined {
    const entry = this.sessions.get(sessionId);
    if (entry) {
      entry.lastActiveAt = Date.now();
    }
    return entry;
  }

  destroySession(sessionId: string): void {
    // Pod는 삭제하지 않음 — 공유 pod이므로 다른 세션이 사용 중일 수 있음
    // Pod 정리는 서버 종료(destroyAll)에서만 수행
    this.sessions.delete(sessionId);
  }

  cleanupStale(): void {
    const now = Date.now();
    for (const [id, entry] of this.sessions) {
      if (now - entry.lastActiveAt > SERVER_CONFIG.sessionTtlMs) {
        this.sessions.delete(id);
      }
    }
  }

  async destroyAll(): Promise<void> {
    const entries = [...this.sessions.values()];
    this.sessions.clear();
    await Promise.allSettled(
      entries.map((entry) => cleanupWorkspacePod(entry.coreApi, entry.namespace)),
    );
  }
}

export const sessionManager = new SessionManager();
