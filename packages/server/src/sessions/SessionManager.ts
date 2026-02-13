import { KubeConfig, CoreV1Api, Exec } from '@kubernetes/client-node';
import { randomUUID } from 'node:crypto';
import { SERVER_CONFIG } from '../config.js';
import { deleteWorkspacePod, deleteKubeconfigSecret } from '../ws/workspacePod.js';
import type { ClusterConnectionConfig, LabSession } from '@ckad-tester/shared/lab';

export interface SessionEntry {
  session: LabSession;
  kubeConfig: KubeConfig;
  coreApi: CoreV1Api;
  exec: Exec;
  namespace: string;
  podName: string | null;
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
      podName: null,
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

  /** 현재 활성 세션들이 사용 중인 pod 이름 집합 */
  getActivePodNames(): Set<string> {
    const names = new Set<string>();
    for (const entry of this.sessions.values()) {
      if (entry.podName) {
        names.add(entry.podName);
      }
    }
    return names;
  }

  destroySession(sessionId: string): void {
    const entry = this.sessions.get(sessionId);
    if (entry) {
      console.info(`[session] destroying session ${sessionId}, podName=${entry.podName ?? 'none'}`);
      // Pod는 삭제하지 않음 — 다음 세션이 재사용
      this.sessions.delete(sessionId);
    }
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
    const tasks: Promise<void>[] = [];
    for (const entry of this.sessions.values()) {
      if (entry.podName) {
        tasks.push(deleteWorkspacePod(entry.coreApi, entry.namespace, entry.podName));
      }
      deleteKubeconfigSecret(entry.coreApi, entry.namespace);
    }
    await Promise.allSettled(tasks);
    this.sessions.clear();
  }
}

export const sessionManager = new SessionManager();
