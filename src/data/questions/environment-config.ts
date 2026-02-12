import type { Question } from '../../types/question.ts';

export const environmentConfigQuestions: Question[] = [
  {
    id: 'ec-1',
    category: 'environment-config',
    difficulty: 'easy',
    title: 'ConfigMap 생성 (리터럴)',
    scenario:
      '리터럴 값을 사용하여 ConfigMap을 생성하세요. ConfigMap 이름은 "app-config"이며, "APP_ENV=production"과 "LOG_LEVEL=info" 두 개의 키-값 쌍을 포함해야 합니다.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['create', 'configmap', 'app-config', '--from-literal', 'APP_ENV=production', '--from-literal', 'LOG_LEVEL=info'],
        description: 'kubectl create configmap 명령어로 ConfigMap 생성',
      },
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'ConfigMap' },
          { path: 'metadata.name', value: 'app-config' },
          { path: 'data.APP_ENV', value: 'production' },
          { path: 'data.LOG_LEVEL', value: 'info' },
        ],
        description: 'YAML 매니페스트로 ConfigMap 생성',
      },
    ],
    hints: [
      { text: 'kubectl create configmap 명령어와 --from-literal 플래그를 사용하세요.', penalty: 0.1 },
      { text: '--from-literal 플래그를 여러 번 사용하여 각 키-값 쌍을 지정할 수 있습니다.', penalty: 0.2 },
      { text: 'kubectl create configmap app-config --from-literal=APP_ENV=production --from-literal=LOG_LEVEL=info', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'ConfigMap "app-config" exists',
        command: 'kubectl get configmap app-config -o jsonpath="{.metadata.name}"',
        expected: 'app-config',
      },
      {
        description: 'APP_ENV is production',
        command: 'kubectl get configmap app-config -o jsonpath="{.data.APP_ENV}"',
        expected: 'production',
      },
      {
        description: 'LOG_LEVEL is info',
        command: 'kubectl get configmap app-config -o jsonpath="{.data.LOG_LEVEL}"',
        expected: 'info',
      },
    ],
  },
  {
    id: 'ec-2',
    category: 'environment-config',
    difficulty: 'easy',
    title: 'Secret 생성 (generic)',
    scenario:
      '데이터베이스 접속 정보를 저장하는 generic Secret을 생성하세요. Secret 이름은 "db-credentials"이며, "username=admin"과 "password=secret123" 두 개의 키-값 쌍을 포함해야 합니다.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['create', 'secret', 'generic', 'db-credentials', '--from-literal', 'username=admin', '--from-literal', 'password=secret123'],
        description: 'kubectl create secret generic 명령어로 Secret 생성',
      },
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Secret' },
          { path: 'metadata.name', value: 'db-credentials' },
          { path: 'type', value: 'Opaque' },
        ],
        description: 'YAML 매니페스트로 Secret 생성 (data 값은 base64 인코딩 필요)',
      },
    ],
    hints: [
      { text: 'kubectl create secret generic 명령어를 사용하세요.', penalty: 0.1 },
      { text: '--from-literal 플래그로 각 키-값 쌍을 지정합니다.', penalty: 0.2 },
      { text: 'kubectl create secret generic db-credentials --from-literal=username=admin --from-literal=password=secret123', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Secret "db-credentials" exists',
        command: 'kubectl get secret db-credentials -o jsonpath="{.metadata.name}"',
        expected: 'db-credentials',
      },
      {
        description: 'Secret type is Opaque',
        command: 'kubectl get secret db-credentials -o jsonpath="{.type}"',
        expected: 'Opaque',
      },
    ],
  },
  {
    id: 'ec-3',
    category: 'environment-config',
    difficulty: 'medium',
    title: 'ConfigMap을 환경변수로 주입',
    scenario:
      '"app-config"이라는 ConfigMap이 이미 존재합니다. 이 ConfigMap의 모든 키-값 쌍을 환경변수로 주입하는 Pod를 생성하세요. Pod 이름은 "config-test-pod"이고, 컨테이너 이름은 "app"이며, busybox:1.36 이미지를 사용합니다. 컨테이너는 "env" 명령을 실행하여 환경변수를 출력해야 합니다.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'config-test-pod' },
          { path: 'spec.containers[0].name', value: 'app' },
          { path: 'spec.containers[0].image', value: 'busybox:1.36' },
          { path: 'spec.containers[0].envFrom[0].configMapRef.name', value: 'app-config' },
        ],
        description: 'YAML 매니페스트에서 envFrom으로 ConfigMap 전체를 환경변수로 주입',
      },
    ],
    hints: [
      { text: 'envFrom 필드를 사용하면 ConfigMap의 모든 키-값 쌍을 한 번에 환경변수로 주입할 수 있습니다.', penalty: 0.1 },
      { text: 'envFrom 아래에 configMapRef.name으로 ConfigMap 이름을 지정하세요.', penalty: 0.2 },
      {
        text: 'containers:\n- name: app\n  image: busybox:1.36\n  command: ["env"]\n  envFrom:\n  - configMapRef:\n      name: app-config',
        penalty: 0.3,
      },
    ],
    labVerification: [
      {
        description: 'Pod "config-test-pod" exists',
        command: 'kubectl get pod config-test-pod -o jsonpath="{.metadata.name}"',
        expected: 'config-test-pod',
      },
      {
        description: 'envFrom references "app-config"',
        command: 'kubectl get pod config-test-pod -o jsonpath="{.spec.containers[0].envFrom[0].configMapRef.name}"',
        expected: 'app-config',
      },
    ],
  },
  {
    id: 'ec-4',
    category: 'environment-config',
    difficulty: 'medium',
    title: 'SecurityContext 설정',
    scenario:
      '보안이 강화된 Pod를 생성하세요. Pod 이름은 "secure-pod"이고, 컨테이너 이름은 "app"이며 nginx:1.25 이미지를 사용합니다. 컨테이너의 SecurityContext에서 runAsUser를 1000으로, runAsGroup을 3000으로 설정하고, allowPrivilegeEscalation을 false로, readOnlyRootFilesystem을 true로 설정하세요.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'secure-pod' },
          { path: 'spec.containers[0].name', value: 'app' },
          { path: 'spec.containers[0].image', value: 'nginx:1.25' },
          { path: 'spec.containers[0].securityContext.runAsUser', value: 1000 },
          { path: 'spec.containers[0].securityContext.runAsGroup', value: 3000 },
          { path: 'spec.containers[0].securityContext.allowPrivilegeEscalation', value: false },
          { path: 'spec.containers[0].securityContext.readOnlyRootFilesystem', value: true },
        ],
        description: 'YAML 매니페스트로 SecurityContext가 설정된 Pod 생성',
      },
    ],
    hints: [
      { text: '컨테이너 스펙 내의 securityContext 필드를 사용하세요.', penalty: 0.1 },
      { text: 'securityContext 아래에 runAsUser, runAsGroup, allowPrivilegeEscalation, readOnlyRootFilesystem을 설정합니다.', penalty: 0.2 },
      {
        text: 'containers:\n- name: app\n  image: nginx:1.25\n  securityContext:\n    runAsUser: 1000\n    runAsGroup: 3000\n    allowPrivilegeEscalation: false\n    readOnlyRootFilesystem: true',
        penalty: 0.3,
      },
    ],
    labVerification: [
      {
        description: 'Pod "secure-pod" exists',
        command: 'kubectl get pod secure-pod -o jsonpath="{.metadata.name}"',
        expected: 'secure-pod',
      },
      {
        description: 'runAsUser is 1000',
        command: 'kubectl get pod secure-pod -o jsonpath="{.spec.containers[0].securityContext.runAsUser}"',
        expected: '1000',
      },
      {
        description: 'allowPrivilegeEscalation is false',
        command: 'kubectl get pod secure-pod -o jsonpath="{.spec.containers[0].securityContext.allowPrivilegeEscalation}"',
        expected: 'false',
      },
    ],
  },
  {
    id: 'ec-5',
    category: 'environment-config',
    difficulty: 'hard',
    title: 'ServiceAccount와 Secret 마운트',
    scenario:
      '커스텀 ServiceAccount를 사용하고 Secret을 볼륨으로 마운트하는 Pod를 생성하세요. 먼저 "app-sa"라는 ServiceAccount를 생성합니다. 그리고 Pod 이름은 "sa-pod"이고, 컨테이너 이름은 "app"이며 nginx:1.25 이미지를 사용합니다. 이 Pod는 "app-sa" ServiceAccount를 사용하고, "db-credentials"라는 기존 Secret을 /etc/db-creds 경로에 볼륨으로 마운트해야 합니다.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['create', 'serviceaccount', 'app-sa'],
        description: 'kubectl create serviceaccount 명령어로 ServiceAccount 생성',
      },
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'sa-pod' },
          { path: 'spec.serviceAccountName', value: 'app-sa' },
          { path: 'spec.containers[0].name', value: 'app' },
          { path: 'spec.containers[0].image', value: 'nginx:1.25' },
          { path: 'spec.containers[0].volumeMounts[0].name', value: 'db-creds' },
          { path: 'spec.containers[0].volumeMounts[0].mountPath', value: '/etc/db-creds' },
          { path: 'spec.volumes[0].name', value: 'db-creds' },
          { path: 'spec.volumes[0].secret.secretName', value: 'db-credentials' },
        ],
        description: 'YAML 매니페스트로 ServiceAccount와 Secret 볼륨이 설정된 Pod 생성',
      },
    ],
    hints: [
      { text: 'kubectl create serviceaccount으로 SA를 만들고, Pod 스펙에서 serviceAccountName과 secret 볼륨을 설정하세요.', penalty: 0.1 },
      { text: 'spec.serviceAccountName으로 SA를 지정하고, spec.volumes에 secret 타입 볼륨을, containers.volumeMounts에 마운트 경로를 설정합니다.', penalty: 0.2 },
      {
        text: 'kubectl create serviceaccount app-sa\n---\napiVersion: v1\nkind: Pod\nmetadata:\n  name: sa-pod\nspec:\n  serviceAccountName: app-sa\n  containers:\n  - name: app\n    image: nginx:1.25\n    volumeMounts:\n    - name: db-creds\n      mountPath: /etc/db-creds\n  volumes:\n  - name: db-creds\n    secret:\n      secretName: db-credentials',
        penalty: 0.3,
      },
    ],
    labVerification: [
      {
        description: 'ServiceAccount "app-sa" exists',
        command: 'kubectl get sa app-sa -o jsonpath="{.metadata.name}"',
        expected: 'app-sa',
      },
      {
        description: 'Pod "sa-pod" uses "app-sa" service account',
        command: 'kubectl get pod sa-pod -o jsonpath="{.spec.serviceAccountName}"',
        expected: 'app-sa',
      },
      {
        description: 'Secret volume mounted at /etc/db-creds',
        command: 'kubectl get pod sa-pod -o jsonpath="{.spec.containers[0].volumeMounts[0].mountPath}"',
        expected: '/etc/db-creds',
      },
    ],
  },
];
