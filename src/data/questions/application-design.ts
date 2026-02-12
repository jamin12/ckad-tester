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
];
