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
        description: 'Executed kubectl logs command with --tail and -f flags',
        command: 'grep -cE "kubectl\\s+logs\\s+web-server\\s+.*(--tail|-f)" /tmp/.cmd_history 2>/dev/null || echo 0',
        expected: '^[1-9]',
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
        description: 'Executed kubectl top pod command with all-namespaces and sort-by flags',
        command: 'grep -cE "kubectl\\s+top\\s+pod.*(-A|--all-namespaces).*--sort-by" /tmp/.cmd_history 2>/dev/null || echo 0',
        expected: '^[1-9]',
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
        description: 'Executed kubectl describe pod command',
        command: 'grep -cE "kubectl\\s+describe\\s+pod\\s+failing-pod" /tmp/.cmd_history 2>/dev/null || echo 0',
        expected: '^[1-9]',
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
        description: 'Executed kubectl logs command with -c flag for log-agent container',
        command: 'grep -cE "kubectl\\s+logs\\s+app-with-sidecar\\s+.*-c\\s+log-agent.*(--previous|-p)" /tmp/.cmd_history 2>/dev/null || echo 0',
        expected: '^[1-9]',
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
  {
    id: 'ob-6',
    category: 'observability',
    difficulty: 'medium',
    title: '최고 메모리 사용 Pod 찾기',
    scenario:
      '"memory" 네임스페이스에서 가장 메모리를 많이 사용하는 Pod를 찾아 파일에 기록하세요.\n\n- kubectl top pod 명령어를 사용하여 "memory" 네임스페이스의 Pod 중 가장 메모리를 많이 사용하는 Pod를 찾으세요.\n- --sort-by=memory 옵션을 사용하여 메모리 사용량 순으로 정렬하세요.\n- 해당 Pod의 이름만 /pods/highmemory.txt 파일에 기록하세요.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['top', 'pod', '-n', 'memory', '--sort-by', 'memory'],
        description: 'kubectl top pod로 메모리 사용량 정렬 조회',
      },
    ],
    hints: [
      { text: 'kubectl top pod -n <네임스페이스> --sort-by=memory 명령어로 메모리 사용량 기준으로 정렬할 수 있습니다.', penalty: 0.1 },
      { text: '출력에서 첫 번째 Pod가 가장 많이 메모리를 사용하는 Pod입니다. 이름만 추출하여 파일에 기록하세요.', penalty: 0.2 },
      { text: 'kubectl top pod -n memory --sort-by=memory --no-headers | head -1 | awk \'{print $1}\' > /pods/highmemory.txt', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'File /pods/highmemory.txt exists with pod name',
        command: 'test -f /pods/highmemory.txt && cat /pods/highmemory.txt | head -1 | wc -c',
        expected: '/\\d+/',
      },
    ],
  },
  {
    id: 'ob-7',
    category: 'observability',
    difficulty: 'medium',
    title: '멀티 컨테이너 Pod 생성 및 로그 저장',
    scenario:
      '두 개의 컨테이너를 가진 Pod를 생성하고, 특정 컨테이너의 로그를 파일로 저장하세요.\n\n- "app"이라는 Pod를 생성하세요. 첫 번째 컨테이너 이름은 "first"이고 busybox 이미지를, 두 번째 컨테이너 이름은 "second"이고 nginx 이미지를 사용합니다.\n- busybox 컨테이너가 종료되지 않도록 command를 ["/bin/sh", "-c", "sleep 3600"]으로 설정하세요.\n- "second" 컨테이너의 로그를 kubectl logs 명령어로 확인하세요. -c 플래그로 컨테이너를 지정합니다.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'app' },
          { path: 'spec.containers[0].name', value: 'first' },
          { path: 'spec.containers[0].image', value: 'busybox' },
          { path: 'spec.containers[1].name', value: 'second' },
          { path: 'spec.containers[1].image', value: 'nginx' },
        ],
        description: 'YAML 매니페스트로 멀티 컨테이너 Pod 생성',
      },
      {
        type: 'command',
        requiredParts: ['logs', 'app', '-c', 'second'],
        description: 'kubectl logs로 second 컨테이너 로그 확인',
      },
    ],
    hints: [
      { text: 'spec.containers 배열에 두 개의 컨테이너를 정의하세요. busybox에는 sleep command가 필요합니다.', penalty: 0.1 },
      { text: 'kubectl logs <pod> -c <container> 형식으로 특정 컨테이너의 로그를 확인할 수 있습니다.', penalty: 0.2 },
      { text: 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: app\nspec:\n  containers:\n  - name: first\n    image: busybox\n    command: ["/bin/sh", "-c", "sleep 3600"]\n  - name: second\n    image: nginx\n\n# 로그 확인\nkubectl logs app -c second', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Pod "app" exists',
        command: 'kubectl get pod app -o jsonpath="{.metadata.name}"',
        expected: 'app',
      },
      {
        description: 'Has 2 containers (first, second)',
        command: 'kubectl get pod app -o jsonpath="{.spec.containers[*].name}"',
        expected: 'first second',
      },
      {
        description: 'First container uses busybox',
        command: 'kubectl get pod app -o jsonpath="{.spec.containers[0].image}"',
        expected: 'busybox',
      },
      {
        description: 'Second container uses nginx',
        command: 'kubectl get pod app -o jsonpath="{.spec.containers[1].image}"',
        expected: 'nginx',
      },
    ],
  },
  {
    id: 'ob-8',
    category: 'observability',
    difficulty: 'easy',
    title: 'Liveness Probe (exec 명령어)',
    scenario:
      'exec 방식의 Liveness Probe가 설정된 Pod를 생성하세요.\n\n- "liveness-exec"이라는 Pod를 nginx 이미지로 생성하세요.\n- 컨테이너 이름은 "nginx"입니다.\n- Liveness Probe는 exec 방식으로 "ls" 명령어를 실행합니다.\n- initialDelaySeconds는 5, periodSeconds는 5로 설정하세요.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'liveness-exec' },
          { path: 'spec.containers[0].name', value: 'nginx' },
          { path: 'spec.containers[0].image', value: 'nginx' },
          { path: 'spec.containers[0].livenessProbe.exec.command[0]', value: 'ls' },
          { path: 'spec.containers[0].livenessProbe.initialDelaySeconds', value: 5 },
          { path: 'spec.containers[0].livenessProbe.periodSeconds', value: 5 },
        ],
        description: 'YAML 매니페스트로 exec Liveness Probe Pod 생성',
      },
    ],
    hints: [
      { text: 'livenessProbe.exec.command로 실행할 명령어를 배열로 지정합니다. 명령어가 0을 반환하면 성공입니다.', penalty: 0.1 },
      { text: 'initialDelaySeconds는 컨테이너 시작 후 첫 probe까지의 대기 시간, periodSeconds는 probe 간격입니다.', penalty: 0.2 },
      { text: 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: liveness-exec\nspec:\n  containers:\n  - name: nginx\n    image: nginx\n    livenessProbe:\n      exec:\n        command:\n        - ls\n      initialDelaySeconds: 5\n      periodSeconds: 5', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Pod "liveness-exec" exists',
        command: 'kubectl get pod liveness-exec -o jsonpath="{.metadata.name}"',
        expected: 'liveness-exec',
      },
      {
        description: 'Liveness probe uses exec with ls',
        command: 'kubectl get pod liveness-exec -o jsonpath="{.spec.containers[0].livenessProbe.exec.command[0]}"',
        expected: 'ls',
      },
      {
        description: 'initialDelaySeconds is 5',
        command: 'kubectl get pod liveness-exec -o jsonpath="{.spec.containers[0].livenessProbe.initialDelaySeconds}"',
        expected: '5',
      },
    ],
  },
  {
    id: 'ob-9',
    category: 'observability',
    difficulty: 'easy',
    title: 'Readiness Probe (HTTP GET)',
    scenario:
      'HTTP GET 방식의 Readiness Probe가 설정된 Pod를 생성하세요.\n\n- "readiness-http"라는 Pod를 nginx 이미지로 생성하세요.\n- 컨테이너 이름은 "nginx"이고 포트 80을 노출합니다.\n- Readiness Probe는 HTTP GET 방식으로 포트 80의 "/" 경로를 체크합니다.\n- initialDelaySeconds는 3, periodSeconds는 5로 설정하세요.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'readiness-http' },
          { path: 'spec.containers[0].name', value: 'nginx' },
          { path: 'spec.containers[0].image', value: 'nginx' },
          { path: 'spec.containers[0].ports[0].containerPort', value: 80 },
          { path: 'spec.containers[0].readinessProbe.httpGet.path', value: '/' },
          { path: 'spec.containers[0].readinessProbe.httpGet.port', value: 80 },
          { path: 'spec.containers[0].readinessProbe.initialDelaySeconds', value: 3 },
          { path: 'spec.containers[0].readinessProbe.periodSeconds', value: 5 },
        ],
        description: 'YAML 매니페스트로 HTTP Readiness Probe Pod 생성',
      },
    ],
    hints: [
      { text: 'readinessProbe.httpGet으로 HTTP GET 방식의 프로브를 설정합니다. path와 port를 지정하세요.', penalty: 0.1 },
      { text: 'HTTP 상태 코드 200~399가 반환되면 성공입니다. Pod가 Ready 상태가 되어야 Service 트래픽을 받습니다.', penalty: 0.2 },
      { text: 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: readiness-http\nspec:\n  containers:\n  - name: nginx\n    image: nginx\n    ports:\n    - containerPort: 80\n    readinessProbe:\n      httpGet:\n        path: /\n        port: 80\n      initialDelaySeconds: 3\n      periodSeconds: 5', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Pod "readiness-http" exists',
        command: 'kubectl get pod readiness-http -o jsonpath="{.metadata.name}"',
        expected: 'readiness-http',
      },
      {
        description: 'Readiness probe path is /',
        command: 'kubectl get pod readiness-http -o jsonpath="{.spec.containers[0].readinessProbe.httpGet.path}"',
        expected: '/',
      },
      {
        description: 'Readiness probe port is 80',
        command: 'kubectl get pod readiness-http -o jsonpath="{.spec.containers[0].readinessProbe.httpGet.port}"',
        expected: '80',
      },
    ],
  },
];
