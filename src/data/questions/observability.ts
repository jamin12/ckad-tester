import type { Question } from '../../types/question.ts';

export const observabilityQuestions: Question[] = [
  {
    id: 'ob-1',
    category: 'observability',
    difficulty: 'easy',
    title: 'Pod 로그 확인',
    scenario:
      '"web-server"라는 이름의 Pod가 실행 중입니다. 이 Pod의 로그를 확인하세요. 가장 최근 20줄의 로그만 출력하고, 실시간으로 로그를 스트리밍하도록 설정하세요.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['logs', 'web-server', '--tail', '20', '-f'],
        description: 'kubectl logs 명령어로 Pod 로그 확인 (tail + follow)',
      },
    ],
    hints: [
      { text: 'kubectl logs 명령어를 사용하여 Pod의 로그를 확인할 수 있습니다.', penalty: 0.1 },
      { text: '--tail 플래그로 마지막 N줄을, -f 플래그로 실시간 스트리밍을 설정합니다.', penalty: 0.2 },
      { text: 'kubectl logs web-server --tail=20 -f', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Pod "web-server" exists and is running',
        command: 'kubectl get pod web-server -o jsonpath="{.status.phase}"',
        expected: 'Running',
      },
    ],
  },
  {
    id: 'ob-2',
    category: 'observability',
    difficulty: 'easy',
    title: '리소스 사용량 모니터링',
    scenario:
      '클러스터에서 실행 중인 모든 Pod의 CPU와 메모리 사용량을 확인하세요. 모든 네임스페이스의 Pod를 대상으로 하며, CPU 사용량 기준으로 정렬하여 가장 많이 사용하는 Pod부터 표시하세요.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['top', 'pod', '-A', '--sort-by', 'cpu'],
        description: 'kubectl top pod 명령어로 리소스 사용량 확인',
      },
      {
        type: 'command',
        requiredParts: ['top', 'pod', '--all-namespaces', '--sort-by', 'cpu'],
        description: 'kubectl top pod --all-namespaces로 리소스 사용량 확인',
      },
    ],
    hints: [
      { text: 'kubectl top 명령어를 사용하면 리소스 사용량을 확인할 수 있습니다.', penalty: 0.1 },
      { text: '-A 또는 --all-namespaces로 모든 네임스페이스를, --sort-by로 정렬 기준을 지정합니다.', penalty: 0.2 },
      { text: 'kubectl top pod -A --sort-by=cpu', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'metrics-server is available',
        command: 'kubectl top pod -A --no-headers 2>&1 | head -1 | wc -l',
        expected: '1',
      },
    ],
  },
  {
    id: 'ob-3',
    category: 'observability',
    difficulty: 'medium',
    title: 'Pod 디버깅 (이벤트 확인)',
    scenario:
      '"failing-pod"라는 Pod가 CrashLoopBackOff 상태입니다. 이 Pod의 상태를 진단하기 위해 Pod의 상세 정보를 확인하세요. describe 명령어를 사용하여 Events 섹션에서 실패 원인을 파악할 수 있습니다.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['describe', 'pod', 'failing-pod'],
        description: 'kubectl describe로 Pod 상세 정보 및 이벤트 확인',
      },
    ],
    hints: [
      { text: 'kubectl describe 명령어를 사용하면 리소스의 상세 정보와 이벤트를 확인할 수 있습니다.', penalty: 0.1 },
      { text: 'kubectl describe pod <이름> 형식으로 특정 Pod의 상세 정보를 확인합니다. 출력의 Events 섹션을 주의 깊게 살펴보세요.', penalty: 0.2 },
      { text: 'kubectl describe pod failing-pod', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Pod "failing-pod" exists',
        command: 'kubectl get pod failing-pod -o jsonpath="{.metadata.name}"',
        expected: 'failing-pod',
      },
    ],
  },
  {
    id: 'ob-4',
    category: 'observability',
    difficulty: 'medium',
    title: '멀티 컨테이너 Pod 로그 확인',
    scenario:
      '"app-with-sidecar"라는 Pod에 "app"과 "log-agent" 두 개의 컨테이너가 있습니다. "log-agent" 컨테이너의 이전 실행(previous)의 로그를 확인하세요. 컨테이너가 재시작된 적이 있어서 이전 로그를 봐야 합니다.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['logs', 'app-with-sidecar', '-c', 'log-agent', '--previous'],
        description: 'kubectl logs로 특정 컨테이너의 이전 로그 확인',
      },
      {
        type: 'command',
        requiredParts: ['logs', 'app-with-sidecar', '-c', 'log-agent', '-p'],
        description: 'kubectl logs -p로 특정 컨테이너의 이전 로그 확인',
      },
    ],
    hints: [
      { text: '멀티 컨테이너 Pod에서 특정 컨테이너의 로그를 보려면 -c 플래그를 사용하세요.', penalty: 0.1 },
      { text: '--previous 또는 -p 플래그를 사용하면 이전에 종료된 컨테이너의 로그를 확인할 수 있습니다.', penalty: 0.2 },
      { text: 'kubectl logs app-with-sidecar -c log-agent --previous', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Pod "app-with-sidecar" exists',
        command: 'kubectl get pod app-with-sidecar -o jsonpath="{.metadata.name}"',
        expected: 'app-with-sidecar',
      },
      {
        description: 'Container "log-agent" exists',
        command: 'kubectl get pod app-with-sidecar -o jsonpath="{.spec.containers[1].name}"',
        expected: 'log-agent',
      },
    ],
  },
  {
    id: 'ob-5',
    category: 'observability',
    difficulty: 'hard',
    title: 'Startup/Liveness Probe를 이용한 디버깅',
    scenario:
      '"api-server"라는 Pod가 있는데, 애플리케이션 시작에 최대 60초가 걸립니다. 이 Pod에 적절한 Probe를 설정하세요. Startup Probe는 HTTP GET 방식으로 포트 8080의 /healthz 경로를 체크하며, failureThreshold는 30, periodSeconds는 2로 설정합니다 (최대 60초까지 기다림). Liveness Probe는 동일한 HTTP GET 엔드포인트를 체크하며, periodSeconds는 10, failureThreshold는 3으로 설정합니다. 컨테이너 이름은 "api"이고 이미지는 nginx:1.25를 사용합니다.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'api-server' },
          { path: 'spec.containers[0].name', value: 'api' },
          { path: 'spec.containers[0].image', value: 'nginx:1.25' },
          { path: 'spec.containers[0].startupProbe.httpGet.path', value: '/healthz' },
          { path: 'spec.containers[0].startupProbe.httpGet.port', value: 8080 },
          { path: 'spec.containers[0].startupProbe.failureThreshold', value: 30 },
          { path: 'spec.containers[0].startupProbe.periodSeconds', value: 2 },
          { path: 'spec.containers[0].livenessProbe.httpGet.path', value: '/healthz' },
          { path: 'spec.containers[0].livenessProbe.httpGet.port', value: 8080 },
          { path: 'spec.containers[0].livenessProbe.periodSeconds', value: 10 },
          { path: 'spec.containers[0].livenessProbe.failureThreshold', value: 3 },
        ],
        description: 'YAML 매니페스트로 Startup/Liveness Probe가 설정된 Pod 생성',
      },
    ],
    hints: [
      { text: 'startupProbe는 애플리케이션이 시작될 때까지 기다리며, 성공 전까지 livenessProbe는 실행되지 않습니다.', penalty: 0.1 },
      { text: 'startupProbe의 failureThreshold * periodSeconds가 최대 시작 시간이 됩니다. 30 * 2 = 60초입니다.', penalty: 0.2 },
      {
        text: 'containers:\n- name: api\n  image: nginx:1.25\n  startupProbe:\n    httpGet:\n      path: /healthz\n      port: 8080\n    failureThreshold: 30\n    periodSeconds: 2\n  livenessProbe:\n    httpGet:\n      path: /healthz\n      port: 8080\n    periodSeconds: 10\n    failureThreshold: 3',
        penalty: 0.3,
      },
    ],
    labVerification: [
      {
        description: 'Pod "api-server" exists',
        command: 'kubectl get pod api-server -o jsonpath="{.metadata.name}"',
        expected: 'api-server',
      },
      {
        description: 'Startup probe path is /healthz',
        command: 'kubectl get pod api-server -o jsonpath="{.spec.containers[0].startupProbe.httpGet.path}"',
        expected: '/healthz',
      },
      {
        description: 'Liveness probe periodSeconds is 10',
        command: 'kubectl get pod api-server -o jsonpath="{.spec.containers[0].livenessProbe.periodSeconds}"',
        expected: '10',
      },
    ],
  },
];
