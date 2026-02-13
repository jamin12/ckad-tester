import type { Question } from '../../types/question.ts';

export const applicationDesignQuestions: Question[] = [
  {
    id: 'ad-1',
    category: 'application-design',
    difficulty: 'easy',
    title: 'nginx Pod 생성',
    scenario:
      '기본 nginx 웹 서버를 실행하는 Pod를 생성하세요. Pod 이름은 "web-server"로 하고, nginx:1.25 이미지를 사용해야 합니다. 별도의 네임스페이스 지정 없이 기본 네임스페이스에 생성하면 됩니다.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['run', 'web-server', '--image', 'nginx:1.25'],
        description: 'kubectl run 명령어로 Pod 생성',
      },
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'web-server' },
          { path: 'spec.containers[0].image', value: 'nginx:1.25' },
        ],
        description: 'YAML 매니페스트로 Pod 생성',
      },
    ],
    hints: [
      { text: 'kubectl run 명령어를 사용하면 간단하게 Pod를 생성할 수 있습니다.', penalty: 0.1 },
      { text: '--image 플래그로 컨테이너 이미지를 지정합니다.', penalty: 0.2 },
      { text: 'kubectl run web-server --image=nginx:1.25', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Pod "web-server" exists',
        command: 'kubectl get pod web-server -o jsonpath="{.metadata.name}"',
        expected: 'web-server',
      },
      {
        description: 'Image is nginx:1.25',
        command: 'kubectl get pod web-server -o jsonpath="{.spec.containers[0].image}"',
        expected: 'nginx:1.25',
      },
    ],
  },
  {
    id: 'ad-2',
    category: 'application-design',
    difficulty: 'easy',
    title: 'CronJob 생성',
    scenario:
      '매 5분마다 현재 날짜를 출력하는 CronJob을 생성하세요. CronJob 이름은 "date-printer"로 하고, busybox:1.36 이미지를 사용하여 "date" 명령을 실행해야 합니다. 스케줄은 "*/5 * * * *"로 설정하세요.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['create', 'cronjob', 'date-printer', '--image', 'busybox:1.36', '--schedule', '*/5 * * * *', '--', 'date'],
        description: 'kubectl create cronjob 명령어로 CronJob 생성',
      },
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'CronJob' },
          { path: 'metadata.name', value: 'date-printer' },
          { path: 'spec.schedule', value: '*/5 * * * *' },
          { path: 'spec.jobTemplate.spec.template.spec.containers[0].image', value: 'busybox:1.36' },
          { path: 'spec.jobTemplate.spec.template.spec.containers[0].command[0]', value: 'date' },
        ],
        description: 'YAML 매니페스트로 CronJob 생성',
      },
    ],
    hints: [
      { text: 'kubectl create cronjob 명령어를 사용할 수 있습니다.', penalty: 0.1 },
      { text: '--schedule 플래그로 cron 표현식을 지정하고, -- 뒤에 실행할 명령어를 작성합니다.', penalty: 0.2 },
      { text: 'kubectl create cronjob date-printer --image=busybox:1.36 --schedule="*/5 * * * *" -- date', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'CronJob "date-printer" exists',
        command: 'kubectl get cronjob date-printer -o jsonpath="{.metadata.name}"',
        expected: 'date-printer',
      },
      {
        description: 'Schedule is */5 * * * *',
        command: 'kubectl get cronjob date-printer -o jsonpath="{.spec.schedule}"',
        expected: '*/5 * * * *',
      },
      {
        description: 'Image is busybox:1.36',
        command: 'kubectl get cronjob date-printer -o jsonpath="{.spec.jobTemplate.spec.template.spec.containers[0].image}"',
        expected: 'busybox:1.36',
      },
    ],
  },
  {
    id: 'ad-3',
    category: 'application-design',
    difficulty: 'medium',
    title: '멀티 컨테이너 Pod (Sidecar 패턴)',
    scenario:
      '두 개의 컨테이너를 가진 Pod를 생성하세요. Pod 이름은 "app-with-sidecar"입니다. 첫 번째 컨테이너는 이름이 "app"이고 nginx:1.25 이미지를 사용하며, 두 번째 컨테이너는 이름이 "log-agent"이고 busybox:1.36 이미지를 사용합니다. 두 컨테이너는 "shared-logs"라는 이름의 emptyDir 볼륨을 /var/log/nginx 경로에 공유해야 합니다.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'app-with-sidecar' },
          { path: 'spec.containers[0].name', value: 'app' },
          { path: 'spec.containers[0].image', value: 'nginx:1.25' },
          { path: 'spec.containers[0].volumeMounts[0].name', value: 'shared-logs' },
          { path: 'spec.containers[0].volumeMounts[0].mountPath', value: '/var/log/nginx' },
          { path: 'spec.containers[1].name', value: 'log-agent' },
          { path: 'spec.containers[1].image', value: 'busybox:1.36' },
          { path: 'spec.containers[1].volumeMounts[0].name', value: 'shared-logs' },
          { path: 'spec.containers[1].volumeMounts[0].mountPath', value: '/var/log/nginx' },
          { path: 'spec.volumes[0].name', value: 'shared-logs' },
        ],
        description: 'YAML 매니페스트로 멀티 컨테이너 Pod 생성',
      },
    ],
    hints: [
      { text: 'spec.containers 배열에 두 개의 컨테이너를 정의하고, spec.volumes에 emptyDir 볼륨을 추가하세요.', penalty: 0.1 },
      { text: '각 컨테이너의 volumeMounts에 동일한 볼륨 이름과 마운트 경로를 지정합니다.', penalty: 0.2 },
      {
        text: 'spec:\n  volumes:\n  - name: shared-logs\n    emptyDir: {}\n  containers:\n  - name: app\n    image: nginx:1.25\n    volumeMounts:\n    - name: shared-logs\n      mountPath: /var/log/nginx\n  - name: log-agent\n    image: busybox:1.36\n    volumeMounts:\n    - name: shared-logs\n      mountPath: /var/log/nginx',
        penalty: 0.3,
      },
    ],
    labVerification: [
      {
        description: 'Pod "app-with-sidecar" exists',
        command: 'kubectl get pod app-with-sidecar -o jsonpath="{.metadata.name}"',
        expected: 'app-with-sidecar',
      },
      {
        description: 'Has 2 containers',
        command: 'kubectl get pod app-with-sidecar -o jsonpath="{.spec.containers[*].name}"',
        expected: 'app log-agent',
      },
      {
        description: 'Volume "shared-logs" exists',
        command: 'kubectl get pod app-with-sidecar -o jsonpath="{.spec.volumes[0].name}"',
        expected: 'shared-logs',
      },
    ],
  },
  {
    id: 'ad-4',
    category: 'application-design',
    difficulty: 'medium',
    title: 'Init Container가 있는 Pod',
    scenario:
      'Init Container를 사용하는 Pod를 생성하세요. Pod 이름은 "web-app"이며 메인 컨테이너는 이름이 "web"이고 nginx:1.25 이미지를 사용합니다. Init Container는 이름이 "init-config"이고 busybox:1.36 이미지를 사용하여 "wget -O /work-dir/index.html http://example.com" 명령을 실행합니다. "workdir"이라는 emptyDir 볼륨을 Init Container는 /work-dir에, 메인 컨테이너는 /usr/share/nginx/html에 마운트하세요.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'web-app' },
          { path: 'spec.initContainers[0].name', value: 'init-config' },
          { path: 'spec.initContainers[0].image', value: 'busybox:1.36' },
          { path: 'spec.initContainers[0].volumeMounts[0].name', value: 'workdir' },
          { path: 'spec.initContainers[0].volumeMounts[0].mountPath', value: '/work-dir' },
          { path: 'spec.containers[0].name', value: 'web' },
          { path: 'spec.containers[0].image', value: 'nginx:1.25' },
          { path: 'spec.containers[0].volumeMounts[0].name', value: 'workdir' },
          { path: 'spec.containers[0].volumeMounts[0].mountPath', value: '/usr/share/nginx/html' },
          { path: 'spec.volumes[0].name', value: 'workdir' },
        ],
        description: 'YAML 매니페스트로 Init Container Pod 생성',
      },
    ],
    hints: [
      { text: 'spec.initContainers 필드를 사용하여 초기화 컨테이너를 정의하세요.', penalty: 0.1 },
      { text: 'Init Container와 메인 컨테이너 모두 동일한 emptyDir 볼륨을 마운트하되, 마운트 경로는 다르게 설정합니다.', penalty: 0.2 },
      {
        text: 'spec:\n  initContainers:\n  - name: init-config\n    image: busybox:1.36\n    command: ["wget", "-O", "/work-dir/index.html", "http://example.com"]\n    volumeMounts:\n    - name: workdir\n      mountPath: /work-dir\n  containers:\n  - name: web\n    image: nginx:1.25\n    volumeMounts:\n    - name: workdir\n      mountPath: /usr/share/nginx/html\n  volumes:\n  - name: workdir\n    emptyDir: {}',
        penalty: 0.3,
      },
    ],
    labVerification: [
      {
        description: 'Pod "web-app" exists',
        command: 'kubectl get pod web-app -o jsonpath="{.metadata.name}"',
        expected: 'web-app',
      },
      {
        description: 'Init container "init-config" exists',
        command: 'kubectl get pod web-app -o jsonpath="{.spec.initContainers[0].name}"',
        expected: 'init-config',
      },
      {
        description: 'Volume "workdir" exists',
        command: 'kubectl get pod web-app -o jsonpath="{.spec.volumes[0].name}"',
        expected: 'workdir',
      },
    ],
  },
  {
    id: 'ad-5',
    category: 'application-design',
    difficulty: 'hard',
    title: 'Liveness/Readiness Probe가 있는 Pod',
    scenario:
      '프로덕션 환경에 적합한 헬스체크가 구성된 Pod를 생성하세요. Pod 이름은 "production-app"이고 nginx:1.25 이미지를 사용합니다. 컨테이너 이름은 "app"이며 포트 80을 노출합니다. Liveness Probe는 HTTP GET 방식으로 포트 80의 /healthz 경로를 체크하며, initialDelaySeconds는 15, periodSeconds는 20으로 설정하세요. Readiness Probe는 TCP 소켓 방식으로 포트 80을 체크하며, initialDelaySeconds는 5, periodSeconds는 10으로 설정하세요.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'production-app' },
          { path: 'spec.containers[0].name', value: 'app' },
          { path: 'spec.containers[0].image', value: 'nginx:1.25' },
          { path: 'spec.containers[0].ports[0].containerPort', value: 80 },
          { path: 'spec.containers[0].livenessProbe.httpGet.path', value: '/healthz' },
          { path: 'spec.containers[0].livenessProbe.httpGet.port', value: 80 },
          { path: 'spec.containers[0].livenessProbe.initialDelaySeconds', value: 15 },
          { path: 'spec.containers[0].livenessProbe.periodSeconds', value: 20 },
          { path: 'spec.containers[0].readinessProbe.tcpSocket.port', value: 80 },
          { path: 'spec.containers[0].readinessProbe.initialDelaySeconds', value: 5 },
          { path: 'spec.containers[0].readinessProbe.periodSeconds', value: 10 },
        ],
        description: 'YAML 매니페스트로 Probe가 설정된 Pod 생성',
      },
    ],
    hints: [
      { text: 'livenessProbe와 readinessProbe는 컨테이너 스펙 내에 정의합니다.', penalty: 0.1 },
      { text: 'livenessProbe에는 httpGet을, readinessProbe에는 tcpSocket을 사용하세요. 각각 initialDelaySeconds와 periodSeconds를 설정합니다.', penalty: 0.2 },
      {
        text: 'containers:\n- name: app\n  image: nginx:1.25\n  ports:\n  - containerPort: 80\n  livenessProbe:\n    httpGet:\n      path: /healthz\n      port: 80\n    initialDelaySeconds: 15\n    periodSeconds: 20\n  readinessProbe:\n    tcpSocket:\n      port: 80\n    initialDelaySeconds: 5\n    periodSeconds: 10',
        penalty: 0.3,
      },
    ],
    labVerification: [
      {
        description: 'Pod "production-app" exists',
        command: 'kubectl get pod production-app -o jsonpath="{.metadata.name}"',
        expected: 'production-app',
      },
      {
        description: 'Liveness probe path is /healthz',
        command: 'kubectl get pod production-app -o jsonpath="{.spec.containers[0].livenessProbe.httpGet.path}"',
        expected: '/healthz',
      },
      {
        description: 'Readiness probe uses TCP socket on port 80',
        command: 'kubectl get pod production-app -o jsonpath="{.spec.containers[0].readinessProbe.tcpSocket.port}"',
        expected: '80',
      },
    ],
  },
  {
    id: 'ad-6',
    category: 'application-design',
    difficulty: 'easy',
    title: '네임스페이스에 Pod 생성 및 포트 노출',
    scenario:
      '웹 애플리케이션에서 캐시로 사용할 Redis Pod를 생성하세요.\n\n- "frontend" 네임스페이스에 Pod를 생성하세요. 네임스페이스가 없으면 먼저 생성합니다.\n- Pod 이름은 "cache"이고, library/redis:3.2 이미지를 사용합니다.\n- 포트 6379를 노출하세요.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['create', 'namespace', 'frontend'],
        description: 'kubectl create namespace 명령어로 네임스페이스 생성',
      },
      {
        type: 'command',
        requiredParts: ['run', 'cache', '--image', 'library/redis:3.2', '--port', '6379', '-n', 'frontend'],
        description: 'kubectl run 명령어로 Redis Pod 생성',
      },
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'cache' },
          { path: 'metadata.namespace', value: 'frontend' },
          { path: 'spec.containers[0].image', value: 'library/redis:3.2' },
          { path: 'spec.containers[0].ports[0].containerPort', value: 6379 },
        ],
        description: 'YAML 매니페스트로 Redis Pod 생성',
      },
    ],
    hints: [
      { text: 'kubectl create namespace으로 네임스페이스를 먼저 생성하세요.', penalty: 0.1 },
      { text: 'kubectl run 명령어에 --port와 -n 플래그를 사용하여 포트와 네임스페이스를 지정합니다.', penalty: 0.2 },
      { text: 'kubectl create ns frontend\nkubectl run cache --image=library/redis:3.2 --port=6379 -n frontend', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Namespace "frontend" exists',
        command: 'kubectl get ns frontend -o jsonpath="{.metadata.name}"',
        expected: 'frontend',
      },
      {
        description: 'Pod "cache" exists in frontend namespace',
        command: 'kubectl get pod cache -n frontend -o jsonpath="{.metadata.name}"',
        expected: 'cache',
      },
      {
        description: 'Image is library/redis:3.2',
        command: 'kubectl get pod cache -n frontend -o jsonpath="{.spec.containers[0].image}"',
        expected: 'library/redis:3.2',
      },
      {
        description: 'ContainerPort is 6379',
        command: 'kubectl get pod cache -n frontend -o jsonpath="{.spec.containers[0].ports[0].containerPort}"',
        expected: '6379',
      },
    ],
  },
  {
    id: 'ad-7',
    category: 'application-design',
    difficulty: 'easy',
    title: '리소스 요청(Requests)이 설정된 Pod 생성',
    scenario:
      '특정 CPU와 메모리 리소스를 요청하는 Pod를 생성하여, 해당 리소스를 보유한 노드에 스케줄링되도록 하세요.\n\n- "resources" 네임스페이스에 Pod를 생성하세요. 네임스페이스가 없으면 먼저 생성합니다.\n- Pod 이름은 "pod-resources"이고, nginx 이미지를 사용합니다.\n- 컨테이너에 최소 CPU 300m, 메모리 1Gi를 요청(requests)하세요.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['create', 'namespace', 'resources'],
        description: 'kubectl create namespace 명령어로 네임스페이스 생성',
      },
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'pod-resources' },
          { path: 'metadata.namespace', value: 'resources' },
          { path: 'spec.containers[0].image', value: 'nginx' },
          { path: 'spec.containers[0].resources.requests.cpu', value: '300m' },
          { path: 'spec.containers[0].resources.requests.memory', value: '1Gi' },
        ],
        description: 'YAML 매니페스트로 리소스 요청이 설정된 Pod 생성',
      },
    ],
    hints: [
      { text: '컨테이너 스펙의 resources.requests 필드에서 CPU와 메모리를 지정하세요.', penalty: 0.1 },
      { text: 'CPU는 밀리코어(m) 단위로, 메모리는 Gi/Mi 단위로 지정합니다. 예: cpu: 300m, memory: 1Gi', penalty: 0.2 },
      { text: 'kubectl create ns resources\n---\napiVersion: v1\nkind: Pod\nmetadata:\n  name: pod-resources\n  namespace: resources\nspec:\n  containers:\n  - name: pod-resources\n    image: nginx\n    resources:\n      requests:\n        cpu: 300m\n        memory: 1Gi', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Namespace "resources" exists',
        command: 'kubectl get ns resources -o jsonpath="{.metadata.name}"',
        expected: 'resources',
      },
      {
        description: 'Pod "pod-resources" exists in resources namespace',
        command: 'kubectl get pod pod-resources -n resources -o jsonpath="{.metadata.name}"',
        expected: 'pod-resources',
      },
      {
        description: 'CPU request is 300m',
        command: 'kubectl get pod pod-resources -n resources -o jsonpath="{.spec.containers[0].resources.requests.cpu}"',
        expected: '300m',
      },
      {
        description: 'Memory request is 1Gi',
        command: 'kubectl get pod pod-resources -n resources -o jsonpath="{.spec.containers[0].resources.requests.memory}"',
        expected: '1Gi',
      },
    ],
  },
  {
    id: 'ad-8',
    category: 'application-design',
    difficulty: 'medium',
    title: 'Job 생성',
    scenario:
      'Job 리소스를 생성하여 한 번 실행되고 완료되는 작업을 정의하세요.\n\n- "busybox-job"이라는 Job을 생성하세요.\n- busybox 이미지를 사용하고, 명령어 "/bin/sh -c \'echo hello;sleep 30;echo world\'"를 실행합니다.\n- Job이 완료되면 로그를 확인하세요.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['create', 'job', 'busybox-job', '--image', 'busybox'],
        description: 'kubectl create job 명령어로 Job 생성',
      },
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Job' },
          { path: 'metadata.name', value: 'busybox-job' },
          { path: 'spec.template.spec.containers[0].image', value: 'busybox' },
          { path: 'spec.template.spec.restartPolicy', value: 'Never' },
        ],
        description: 'YAML 매니페스트로 Job 생성',
      },
    ],
    hints: [
      { text: 'kubectl create job 명령어를 사용하여 Job을 생성할 수 있습니다.', penalty: 0.1 },
      { text: 'Job 스펙에서 restartPolicy는 Never 또는 OnFailure만 사용 가능합니다.', penalty: 0.2 },
      { text: 'kubectl create job busybox-job --image=busybox -- /bin/sh -c "echo hello;sleep 30;echo world"', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Job "busybox-job" exists',
        command: 'kubectl get job busybox-job -o jsonpath="{.metadata.name}"',
        expected: 'busybox-job',
      },
      {
        description: 'Job image is busybox',
        command: 'kubectl get job busybox-job -o jsonpath="{.spec.template.spec.containers[0].image}"',
        expected: 'busybox',
      },
    ],
  },
  {
    id: 'ad-9',
    category: 'application-design',
    difficulty: 'hard',
    title: 'Job completions와 parallelism 설정',
    scenario:
      '여러 번 실행되고 병렬로 처리되는 Job을 생성하세요.\n\n- "parallel-job"이라는 Job을 생성하세요.\n- busybox 이미지를 사용하고 명령어 "/bin/sh -c \'echo processing;sleep 5;echo done\'"을 실행합니다.\n- completions를 5로 설정하여 총 5번 실행되도록 합니다.\n- parallelism을 2로 설정하여 한 번에 2개씩 병렬 실행되도록 합니다.\n- activeDeadlineSeconds를 60으로 설정하세요.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Job' },
          { path: 'metadata.name', value: 'parallel-job' },
          { path: 'spec.completions', value: 5 },
          { path: 'spec.parallelism', value: 2 },
          { path: 'spec.activeDeadlineSeconds', value: 60 },
          { path: 'spec.template.spec.containers[0].image', value: 'busybox' },
          { path: 'spec.template.spec.restartPolicy', value: 'Never' },
        ],
        description: 'YAML 매니페스트로 completions/parallelism이 설정된 Job 생성',
      },
    ],
    hints: [
      { text: 'spec.completions는 총 실행 횟수, spec.parallelism은 동시 실행 수를 지정합니다.', penalty: 0.1 },
      { text: 'spec.activeDeadlineSeconds로 Job의 최대 실행 시간을 제한할 수 있습니다. 시간 초과 시 Job이 종료됩니다.', penalty: 0.2 },
      { text: 'apiVersion: batch/v1\nkind: Job\nmetadata:\n  name: parallel-job\nspec:\n  completions: 5\n  parallelism: 2\n  activeDeadlineSeconds: 60\n  template:\n    spec:\n      containers:\n      - name: busybox\n        image: busybox\n        command: ["/bin/sh", "-c", "echo processing;sleep 5;echo done"]\n      restartPolicy: Never', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Job "parallel-job" exists',
        command: 'kubectl get job parallel-job -o jsonpath="{.metadata.name}"',
        expected: 'parallel-job',
      },
      {
        description: 'Completions is 5',
        command: 'kubectl get job parallel-job -o jsonpath="{.spec.completions}"',
        expected: '5',
      },
      {
        description: 'Parallelism is 2',
        command: 'kubectl get job parallel-job -o jsonpath="{.spec.parallelism}"',
        expected: '2',
      },
      {
        description: 'activeDeadlineSeconds is 60',
        command: 'kubectl get job parallel-job -o jsonpath="{.spec.activeDeadlineSeconds}"',
        expected: '60',
      },
    ],
  },
  {
    id: 'ad-10',
    category: 'application-design',
    difficulty: 'easy',
    title: 'Pod Label 관리',
    scenario:
      'Pod를 생성하고 레이블을 관리하세요.\n\n- "nginx-labeled"라는 Pod를 nginx 이미지로 생성하고, 레이블 app=v1을 지정하세요.\n- 생성 후 레이블을 app=v2로 변경하세요.\n- 변경된 레이블을 확인하세요.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['run', 'nginx-labeled', '--image', 'nginx', '--labels', 'app=v1'],
        description: 'kubectl run 명령어로 레이블이 지정된 Pod 생성',
      },
      {
        type: 'command',
        requiredParts: ['label', 'pod', 'nginx-labeled', 'app=v2', '--overwrite'],
        description: 'kubectl label로 레이블 변경',
      },
    ],
    hints: [
      { text: 'kubectl run 명령어에 --labels 또는 -l 플래그로 레이블을 지정할 수 있습니다.', penalty: 0.1 },
      { text: 'kubectl label pod <이름> <키>=<값> --overwrite 명령어로 기존 레이블을 변경합니다.', penalty: 0.2 },
      { text: 'kubectl run nginx-labeled --image=nginx --labels=app=v1\nkubectl label pod nginx-labeled app=v2 --overwrite', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Pod "nginx-labeled" exists',
        command: 'kubectl get pod nginx-labeled -o jsonpath="{.metadata.name}"',
        expected: 'nginx-labeled',
      },
      {
        description: 'Label app=v2 is set',
        command: 'kubectl get pod nginx-labeled -o jsonpath="{.metadata.labels.app}"',
        expected: 'v2',
      },
    ],
  },
  {
    id: 'ad-11',
    category: 'application-design',
    difficulty: 'medium',
    title: 'nodeSelector를 사용한 Pod 배치',
    scenario:
      '특정 노드에만 스케줄링되도록 nodeSelector가 설정된 Pod를 생성하세요.\n\n- "gpu-pod"라는 Pod를 nginx 이미지로 생성하세요.\n- nodeSelector를 사용하여 "accelerator: nvidia-tesla-p100" 레이블이 있는 노드에만 배치되도록 설정하세요.\n- 컨테이너 이름은 "gpu-container"로 하세요.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'gpu-pod' },
          { path: 'spec.containers[0].name', value: 'gpu-container' },
          { path: 'spec.containers[0].image', value: 'nginx' },
          { path: 'spec.nodeSelector.accelerator', value: 'nvidia-tesla-p100' },
        ],
        description: 'YAML 매니페스트로 nodeSelector가 설정된 Pod 생성',
      },
    ],
    hints: [
      { text: 'spec.nodeSelector 필드를 사용하여 Pod가 배치될 노드의 레이블을 지정하세요.', penalty: 0.1 },
      { text: 'nodeSelector는 키-값 쌍 형태로, 해당 레이블이 있는 노드에만 Pod가 스케줄링됩니다.', penalty: 0.2 },
      { text: 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: gpu-pod\nspec:\n  nodeSelector:\n    accelerator: nvidia-tesla-p100\n  containers:\n  - name: gpu-container\n    image: nginx', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Pod "gpu-pod" exists',
        command: 'kubectl get pod gpu-pod -o jsonpath="{.metadata.name}"',
        expected: 'gpu-pod',
      },
      {
        description: 'nodeSelector has accelerator=nvidia-tesla-p100',
        command: 'kubectl get pod gpu-pod -o jsonpath="{.spec.nodeSelector.accelerator}"',
        expected: 'nvidia-tesla-p100',
      },
    ],
  },
  {
    id: 'ad-12',
    category: 'application-design',
    difficulty: 'hard',
    title: 'Adapter 패턴 Multi-Container Pod',
    scenario:
      'Adapter 패턴을 사용하는 Multi-Container Pod를 생성하세요. 하나의 컨테이너가 로그를 생성하고, 다른 컨테이너가 로그를 변환합니다.\n\n- "adapter"라는 Pod를 생성하세요.\n- 첫 번째 컨테이너 "app": busybox 이미지, 명령어 `while true; do echo "$(date) | $(du -sh ~)" >> /var/logs/diskspace.txt; sleep 5; done;`\n- 두 번째 컨테이너 "transformer": busybox 이미지, 명령어 `sleep 20; while true; do while read LINE; do echo "$LINE" | cut -f2 -d"|" >> /var/logs/transformed.txt; done < /var/logs/diskspace.txt; sleep 20; done;`\n- 두 컨테이너가 emptyDir 볼륨을 "/var/logs" 경로로 공유하세요.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'adapter' },
          { path: 'spec.containers[0].name', value: 'app' },
          { path: 'spec.containers[0].image', value: 'busybox' },
          { path: 'spec.containers[1].name', value: 'transformer' },
          { path: 'spec.containers[1].image', value: 'busybox' },
          { path: 'spec.containers[0].volumeMounts[0].mountPath', value: '/var/logs' },
          { path: 'spec.containers[1].volumeMounts[0].mountPath', value: '/var/logs' },
          { path: 'spec.volumes[0].emptyDir', value: '{}' },
        ],
        description: 'YAML 매니페스트로 Adapter 패턴 Multi-Container Pod 생성',
      },
    ],
    hints: [
      { text: '두 컨테이너가 같은 emptyDir 볼륨을 공유하여 로그 데이터를 주고받습니다.', penalty: 0.1 },
      { text: 'spec.volumes에 emptyDir 볼륨을 정의하고, 양쪽 컨테이너의 volumeMounts에 같은 볼륨 이름으로 /var/logs 경로에 마운트합니다.', penalty: 0.2 },
      { text: 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: adapter\nspec:\n  volumes:\n  - name: shared-logs\n    emptyDir: {}\n  containers:\n  - name: app\n    image: busybox\n    command: [\"/bin/sh\", \"-c\", \"while true; do echo \\\"$(date) | $(du -sh ~)\\\" >> /var/logs/diskspace.txt; sleep 5; done;\"]\n    volumeMounts:\n    - name: shared-logs\n      mountPath: /var/logs\n  - name: transformer\n    image: busybox\n    command: [\"/bin/sh\", \"-c\", \"sleep 20; while true; do while read LINE; do echo \\\"$LINE\\\" | cut -f2 -d\\\"|\\\" >> /var/logs/transformed.txt; done < /var/logs/diskspace.txt; sleep 20; done;\"]\n    volumeMounts:\n    - name: shared-logs\n      mountPath: /var/logs', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Pod "adapter" exists',
        command: 'kubectl get pod adapter -o jsonpath="{.metadata.name}"',
        expected: 'adapter',
      },
      {
        description: 'Pod has 2 containers',
        command: 'kubectl get pod adapter -o jsonpath="{.spec.containers[*].name}"',
        expected: 'app transformer',
      },
      {
        description: 'Both containers mount /var/logs',
        command: 'kubectl get pod adapter -o jsonpath="{.spec.containers[0].volumeMounts[0].mountPath}"',
        expected: '/var/logs',
      },
    ],
  },
];
