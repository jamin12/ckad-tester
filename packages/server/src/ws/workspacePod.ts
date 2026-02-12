import type { CoreV1Api, Exec } from '@kubernetes/client-node';
import { SERVER_CONFIG } from '../config.js';
import { execCommand } from '../verification/execCommand.js';

const SECRET_NAME = 'ckad-workspace-kubeconfig';
const WORKSPACE_RUNTIME_ANNOTATION = 'ckad-tester/runtime-version';
const WORKSPACE_RUNTIME_VERSION = '2026-02-vim-required-v2';
type RecreateReason = 'not-ready' | 'runtime-version-mismatch' | 'pod-not-found';

export async function ensureWorkspacePod(
  coreApi: CoreV1Api,
  exec: Exec,
  namespace: string,
  kubeconfig: string,
): Promise<string> {
  const podName = `${SERVER_CONFIG.workspacePodPrefix}-session`;

  // kubeconfig Secret 생성/갱신
  await ensureKubeconfigSecret(coreApi, namespace, kubeconfig);

  try {
    const pod = await coreApi.readNamespacedPod({ name: podName, namespace });
    const containerStatus = pod.status?.containerStatuses?.[0];
    const runtimeVersion = pod.metadata?.annotations?.[WORKSPACE_RUNTIME_ANNOTATION];
    const isReady = pod.status?.phase === 'Running' && containerStatus?.ready === true;
    const runtimeMatches = runtimeVersion === WORKSPACE_RUNTIME_VERSION;
    if (isReady && runtimeMatches) {
      const editorsReady = await hasRequiredEditors(exec, namespace, podName);
      if (editorsReady) {
        return podName;
      }
      console.info(
        `[workspace-pod] recreating ${podName} (reason=runtime-version-mismatch, detail=editors-missing)`,
      );
    }

    const reason: RecreateReason = isReady ? 'runtime-version-mismatch' : 'not-ready';
    console.info(
      `[workspace-pod] recreating ${podName} (reason=${reason}, phase=${pod.status?.phase ?? 'unknown'}, ready=${String(containerStatus?.ready ?? false)}, runtimeVersion=${runtimeVersion ?? 'none'})`,
    );

    try {
      await coreApi.deleteNamespacedPod({ name: podName, namespace, gracePeriodSeconds: 0 });
    } catch {
      // 이미 삭제 중이거나 없음
    }
    await waitForPodGone(coreApi, namespace, podName);
  } catch (err) {
    if (isNotFoundError(err)) {
      const reason: RecreateReason = 'pod-not-found';
      console.info(`[workspace-pod] creating ${podName} (reason=${reason})`);
    } else {
      throw err;
    }
  }

  await coreApi.createNamespacedPod({
    namespace,
    body: {
      metadata: {
        name: podName,
        labels: { app: 'ckad-workspace' },
        annotations: { [WORKSPACE_RUNTIME_ANNOTATION]: WORKSPACE_RUNTIME_VERSION },
      },
      spec: {
        initContainers: [
          {
            name: 'kubectl-copy',
            image: 'bitnami/kubectl:latest',
            command: ['sh', '-c', 'cp $(which kubectl) /tools/kubectl'],
            volumeMounts: [
              { name: 'tools', mountPath: '/tools' },
            ],
          },
        ],
        containers: [
          {
            name: 'workspace',
            image: SERVER_CONFIG.workspacePodImage,
            command: ['sh', '-c',
              'set -eu'
              + ' && cp /tools/kubectl /usr/local/bin/kubectl'
              + ' && chmod +x /usr/local/bin/kubectl'
              + ' && apt-get update -qq'
              + ' && (apt-get install -y -qq vim curl jq || apt-get install -y -qq vim-tiny curl jq)'
              + ' && ln -sf "$(command -v vim)" /usr/bin/vi'
              + ' && sleep infinity',
            ],
            workingDir: '/workspace',
            securityContext: { runAsUser: 0 },
            readinessProbe: {
              exec: { command: ['sh', '-c', 'test -x /usr/local/bin/kubectl && command -v vim >/dev/null 2>&1 && command -v vi >/dev/null 2>&1'] },
              initialDelaySeconds: 5,
              periodSeconds: 3,
              failureThreshold: 40,
            },
            resources: {
              requests: { cpu: '100m', memory: '128Mi' },
              limits: { cpu: '500m', memory: '512Mi' },
            },
            env: [
              { name: 'KUBECONFIG', value: '/etc/kubeconfig/config' },
              { name: 'TERM', value: 'xterm' },
            ],
            volumeMounts: [
              {
                name: 'tools',
                mountPath: '/tools',
                readOnly: true,
              },
              {
                name: 'kubeconfig',
                mountPath: '/etc/kubeconfig',
                readOnly: true,
              },
              {
                name: 'workspace',
                mountPath: '/workspace',
              },
            ],
          },
        ],
        volumes: [
          {
            name: 'tools',
            emptyDir: {},
          },
          {
            name: 'kubeconfig',
            secret: {
              secretName: SECRET_NAME,
            },
          },
          {
            name: 'workspace',
            emptyDir: {},
          },
        ],
        restartPolicy: 'Never',
      },
    },
  });

  // Wait for pod to be ready (최대 120초 — apt-get install 소요 시간 포함)
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const pod = await coreApi.readNamespacedPod({ name: podName, namespace });
      const containerStatus = pod.status?.containerStatuses?.[0];
      if (containerStatus?.ready) {
        return podName;
      }
    } catch {
      // continue waiting
    }
  }

  throw new Error('Workspace pod failed to become ready within timeout');
}

export async function cleanupWorkspacePod(
  coreApi: CoreV1Api,
  namespace: string,
): Promise<void> {
  const podName = `${SERVER_CONFIG.workspacePodPrefix}-session`;

  try {
    await coreApi.deleteNamespacedPod({ name: podName, namespace });
  } catch {
    // 이미 없으면 무시
  }

  try {
    await coreApi.deleteNamespacedSecret({ name: SECRET_NAME, namespace });
  } catch {
    // 이미 없으면 무시
  }
}

async function waitForPodGone(
  coreApi: CoreV1Api,
  namespace: string,
  podName: string,
): Promise<void> {
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      await coreApi.readNamespacedPod({ name: podName, namespace });
      // Pod still exists, keep waiting
    } catch {
      // 404 = pod is gone
      return;
    }
  }
  throw new Error(`Pod ${podName} did not terminate within 30 seconds`);
}

async function ensureKubeconfigSecret(
  coreApi: CoreV1Api,
  namespace: string,
  kubeconfig: string,
): Promise<void> {
  const encoded = Buffer.from(kubeconfig).toString('base64');

  try {
    await coreApi.readNamespacedSecret({ name: SECRET_NAME, namespace });
    // Secret 존재 → 갱신
    await coreApi.replaceNamespacedSecret({
      name: SECRET_NAME,
      namespace,
      body: {
        metadata: { name: SECRET_NAME },
        data: { config: encoded },
      },
    });
  } catch {
    // Secret 없음 → 생성
    await coreApi.createNamespacedSecret({
      namespace,
      body: {
        metadata: { name: SECRET_NAME },
        data: { config: encoded },
      },
    });
  }
}

function isNotFoundError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) {
    return false;
  }

  const maybeErr = err as {
    code?: number;
    statusCode?: number;
    body?: { code?: number; reason?: string } | string;
    response?: { statusCode?: number };
    message?: string;
  };

  const bodyCode = typeof maybeErr.body === 'object' && maybeErr.body !== null
    ? maybeErr.body.code
    : undefined;
  const bodyReason = typeof maybeErr.body === 'object' && maybeErr.body !== null
    ? maybeErr.body.reason
    : undefined;

  if (maybeErr.code === 404
    || maybeErr.statusCode === 404
    || bodyCode === 404
    || maybeErr.response?.statusCode === 404
    || bodyReason === 'NotFound') {
    return true;
  }

  if (typeof maybeErr.body === 'string') {
    try {
      const parsed = JSON.parse(maybeErr.body) as { code?: number; reason?: string };
      if (parsed.code === 404 || parsed.reason === 'NotFound') {
        return true;
      }
    } catch {
      // ignore invalid JSON body
    }
  }

  return typeof maybeErr.message === 'string'
    && (maybeErr.message.includes('HTTP-Code: 404') || maybeErr.message.includes('"reason":"NotFound"'));
}

async function hasRequiredEditors(exec: Exec, namespace: string, podName: string): Promise<boolean> {
  try {
    const result = await execCommand(
      exec,
      namespace,
      podName,
      ['sh', '-lc', 'if command -v vim >/dev/null 2>&1 && command -v vi >/dev/null 2>&1; then echo ok; else echo missing; fi'],
    );
    return result.includes('ok');
  } catch {
    return false;
  }
}
