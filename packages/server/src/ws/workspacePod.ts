import type { CoreV1Api } from '@kubernetes/client-node';
import { randomBytes } from 'node:crypto';
import { SERVER_CONFIG } from '../config.js';

const SECRET_NAME = 'ckad-workspace-kubeconfig';
const POD_LABEL = 'app=ckad-workspace';

export async function createWorkspacePod(
  coreApi: CoreV1Api,
  namespace: string,
  kubeconfig: string,
  activePodNames: Set<string>,
): Promise<string> {
  await ensureKubeconfigSecret(coreApi, namespace, kubeconfig);

  // 1) 기존 ready pod 재사용 시도 + orphan 정리
  try {
    const list = await coreApi.listNamespacedPod({ namespace, labelSelector: POD_LABEL });
    for (const pod of list.items) {
      const name = pod.metadata?.name;
      if (!name) continue;

      const workspaceStatus = pod.status?.containerStatuses?.find((c) => c.name === 'workspace');
      const isReady = workspaceStatus?.ready === true;

      if (isReady) {
        console.info(`[workspace-pod] reusing existing pod ${name}`);
        return name;
      }

      // ready가 아니고 다른 세션이 사용 중이 아닌 pod → orphan, 삭제
      if (!activePodNames.has(name)) {
        console.info(`[workspace-pod] cleaning orphan pod ${name}`);
        coreApi.deleteNamespacedPod({ name, namespace, gracePeriodSeconds: 0 }).catch(() => {});
      }
    }
  } catch {
    // list 실패 시 무시하고 새로 생성
  }

  // 2) 새 pod 생성
  const suffix = randomBytes(4).toString('hex');
  const podName = `${SERVER_CONFIG.workspacePodPrefix}-${suffix}`;
  console.info(`[workspace-pod] creating new pod ${podName}`);

  await coreApi.createNamespacedPod({
    namespace,
    body: {
      metadata: {
        name: podName,
        labels: { app: 'ckad-workspace' },
        annotations: { 'sidecar.istio.io/inject': 'false' },
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
              'cp /tools/kubectl /usr/local/bin/kubectl && chmod +x /usr/local/bin/kubectl'
              + ' && for i in $(seq 1 30); do apt-get update -qq 2>/dev/null && break; sleep 2; done'
              + ' && (apt-get install -y -qq --no-install-recommends vim curl jq || apt-get install -y -qq --no-install-recommends vim-tiny curl jq)'
              + ' && rm -rf /var/lib/apt/lists/* /var/cache/apt/*'
              + ' && ln -sf "$(command -v vim)" /usr/bin/vi'
              + ' && exec sleep infinity',
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
              requests: { cpu: '100m', memory: '256Mi' },
              limits: { cpu: '500m', memory: '1Gi' },
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

  // Wait for workspace container to be ready (최대 180초 — Istio sidecar 대기 + apt-get 소요 시간)
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const pod = await coreApi.readNamespacedPod({ name: podName, namespace });
      const workspaceStatus = pod.status?.containerStatuses?.find((c) => c.name === 'workspace');
      if (workspaceStatus?.ready) {
        return podName;
      }
      // workspace 컨테이너가 에러로 종료된 경우 즉시 실패
      if (workspaceStatus?.state?.terminated) {
        const exitCode = workspaceStatus.state.terminated.exitCode;
        throw new Error(`Workspace container exited with code ${exitCode}`);
      }
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Workspace container')) {
        throw err;
      }
      // continue waiting
    }
  }

  throw new Error('Workspace pod failed to become ready within timeout');
}

export function deleteWorkspacePod(
  coreApi: CoreV1Api,
  namespace: string,
  podName: string,
): void {
  console.info(`[workspace-pod] deleting pod ${podName} in ${namespace}`);
  coreApi.deleteNamespacedPod({ name: podName, namespace, gracePeriodSeconds: 0 }).catch(() => {});
}

export function deleteKubeconfigSecret(
  coreApi: CoreV1Api,
  namespace: string,
): void {
  coreApi.deleteNamespacedSecret({ name: SECRET_NAME, namespace }).catch(() => {});
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
