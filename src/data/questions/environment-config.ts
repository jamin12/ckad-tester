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
  {
    id: 'ec-6',
    category: 'environment-config',
    difficulty: 'medium',
    title: 'Secret을 환경변수로 Pod에 노출',
    scenario:
      'Secret을 생성하고, 해당 Secret의 값을 환경변수로 Pod에 노출하세요.\n\n- "my-secret"이라는 Secret을 생성하고, 키-값 쌍은 key2/value10입니다.\n- "nginx-secret"이라는 Pod를 nginx 이미지로 생성하고, Secret의 key2 값을 TEST_VARIABLE이라는 환경변수로 노출하세요.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['create', 'secret', 'generic', 'my-secret', '--from-literal', 'key2=value10'],
        description: 'kubectl create secret generic 명령어로 Secret 생성',
      },
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'nginx-secret' },
          { path: 'spec.containers[0].image', value: 'nginx' },
          { path: 'spec.containers[0].env[0].name', value: 'TEST_VARIABLE' },
          { path: 'spec.containers[0].env[0].valueFrom.secretKeyRef.name', value: 'my-secret' },
          { path: 'spec.containers[0].env[0].valueFrom.secretKeyRef.key', value: 'key2' },
        ],
        description: 'YAML 매니페스트로 Secret 환경변수가 설정된 Pod 생성',
      },
    ],
    hints: [
      { text: 'kubectl create secret generic 명령어로 Secret을 먼저 생성하세요.', penalty: 0.1 },
      { text: 'Pod 스펙에서 env[].valueFrom.secretKeyRef를 사용하여 Secret 값을 환경변수로 노출합니다.', penalty: 0.2 },
      { text: 'kubectl create secret generic my-secret --from-literal=key2=value10\n---\napiVersion: v1\nkind: Pod\nmetadata:\n  name: nginx-secret\nspec:\n  containers:\n  - name: nginx-secret\n    image: nginx\n    env:\n    - name: TEST_VARIABLE\n      valueFrom:\n        secretKeyRef:\n          name: my-secret\n          key: key2', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Secret "my-secret" exists',
        command: 'kubectl get secret my-secret -o jsonpath="{.metadata.name}"',
        expected: 'my-secret',
      },
      {
        description: 'Pod "nginx-secret" exists',
        command: 'kubectl get pod nginx-secret -o jsonpath="{.metadata.name}"',
        expected: 'nginx-secret',
      },
      {
        description: 'TEST_VARIABLE env var references my-secret key2',
        command: 'kubectl get pod nginx-secret -o jsonpath="{.spec.containers[0].env[0].valueFrom.secretKeyRef.name}"',
        expected: 'my-secret',
      },
    ],
  },
  {
    id: 'ec-7',
    category: 'environment-config',
    difficulty: 'medium',
    title: 'ConfigMap을 Volume으로 Pod에 마운트',
    scenario:
      'ConfigMap을 생성하고, 해당 ConfigMap을 볼륨으로 Pod에 마운트하세요.\n\n- "my-config"이라는 ConfigMap을 생성하고, 키-값 쌍은 key3/value4입니다.\n- "nginx-configmap"이라는 Pod를 nginx 이미지로 생성하고, ConfigMap을 /this/is/mypath 경로에 볼륨으로 마운트하세요.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['create', 'configmap', 'my-config', '--from-literal', 'key3=value4'],
        description: 'kubectl create configmap 명령어로 ConfigMap 생성',
      },
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'nginx-configmap' },
          { path: 'spec.containers[0].image', value: 'nginx' },
          { path: 'spec.containers[0].volumeMounts[0].mountPath', value: '/this/is/mypath' },
          { path: 'spec.volumes[0].configMap.name', value: 'my-config' },
        ],
        description: 'YAML 매니페스트로 ConfigMap 볼륨이 마운트된 Pod 생성',
      },
    ],
    hints: [
      { text: 'kubectl create configmap 명령어로 ConfigMap을 먼저 생성하세요.', penalty: 0.1 },
      { text: 'Pod 스펙에서 spec.volumes에 configMap 타입 볼륨을 정의하고, containers[].volumeMounts에 마운트 경로를 설정합니다.', penalty: 0.2 },
      { text: 'kubectl create configmap my-config --from-literal=key3=value4\n---\napiVersion: v1\nkind: Pod\nmetadata:\n  name: nginx-configmap\nspec:\n  volumes:\n  - name: myvol\n    configMap:\n      name: my-config\n  containers:\n  - name: nginx-configmap\n    image: nginx\n    volumeMounts:\n    - name: myvol\n      mountPath: /this/is/mypath', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'ConfigMap "my-config" exists',
        command: 'kubectl get configmap my-config -o jsonpath="{.metadata.name}"',
        expected: 'my-config',
      },
      {
        description: 'ConfigMap key3 has value4',
        command: 'kubectl get configmap my-config -o jsonpath="{.data.key3}"',
        expected: 'value4',
      },
      {
        description: 'Pod "nginx-configmap" exists',
        command: 'kubectl get pod nginx-configmap -o jsonpath="{.metadata.name}"',
        expected: 'nginx-configmap',
      },
      {
        description: 'Volume mounted at /this/is/mypath',
        command: 'kubectl get pod nginx-configmap -o jsonpath="{.spec.containers[0].volumeMounts[0].mountPath}"',
        expected: '/this/is/mypath',
      },
    ],
  },
  {
    id: 'ec-8',
    category: 'environment-config',
    difficulty: 'medium',
    title: 'ServiceAccount 생성 및 Deployment에 적용',
    scenario:
      'ServiceAccount를 생성하고 Deployment에 적용하세요.\n\n- "ns-prod" 네임스페이스에 "app-sa"라는 ServiceAccount를 생성하세요.\n- 같은 네임스페이스에 "app-deployment"라는 Deployment를 nginx 이미지로 생성하고, "app-sa" ServiceAccount를 사용하도록 설정하세요.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['create', 'serviceaccount', 'app-sa', '-n', 'ns-prod'],
        description: 'kubectl create serviceaccount 명령어로 ServiceAccount 생성',
      },
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Deployment' },
          { path: 'metadata.name', value: 'app-deployment' },
          { path: 'metadata.namespace', value: 'ns-prod' },
          { path: 'spec.template.spec.serviceAccountName', value: 'app-sa' },
          { path: 'spec.template.spec.containers[0].image', value: 'nginx' },
        ],
        description: 'YAML 매니페스트로 ServiceAccount가 설정된 Deployment 생성',
      },
    ],
    hints: [
      { text: 'kubectl create serviceaccount 명령어와 -n 플래그로 네임스페이스를 지정하세요.', penalty: 0.1 },
      { text: 'Deployment 스펙에서 spec.template.spec.serviceAccountName 필드로 ServiceAccount를 지정합니다.', penalty: 0.2 },
      { text: 'kubectl create ns ns-prod\nkubectl create sa app-sa -n ns-prod\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: app-deployment\n  namespace: ns-prod\nspec:\n  replicas: 1\n  selector:\n    matchLabels:\n      app: app-deployment\n  template:\n    metadata:\n      labels:\n        app: app-deployment\n    spec:\n      serviceAccountName: app-sa\n      containers:\n      - name: nginx\n        image: nginx', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'ServiceAccount "app-sa" exists in ns-prod',
        command: 'kubectl get sa app-sa -n ns-prod -o jsonpath="{.metadata.name}"',
        expected: 'app-sa',
      },
      {
        description: 'Deployment "app-deployment" uses app-sa SA',
        command: 'kubectl get deploy app-deployment -n ns-prod -o jsonpath="{.spec.template.spec.serviceAccountName}"',
        expected: 'app-sa',
      },
    ],
  },
  {
    id: 'ec-9',
    category: 'environment-config',
    difficulty: 'hard',
    title: 'PersistentVolume, PVC, Pod 생성',
    scenario:
      'PersistentVolume, PersistentVolumeClaim을 생성하고 Pod에 마운트하세요.\n\n- "task-pv-volume"이라는 PV를 생성하세요: 용량 10Gi, accessModes는 ReadWriteOnce, storageClassName은 "manual", hostPath는 /my/path\n- "task-pv-claim"이라는 PVC를 생성하세요: 최소 3Gi 요청, accessModes는 ReadWriteOnce, storageClassName은 "manual"\n- "task-pv-pod"라는 nginx Pod를 생성하고 containerPort 80을 노출하며, PVC를 /usr/share/nginx/html에 마운트하세요.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'PersistentVolume' },
          { path: 'metadata.name', value: 'task-pv-volume' },
          { path: 'spec.capacity.storage', value: '10Gi' },
          { path: 'spec.accessModes[0]', value: 'ReadWriteOnce' },
          { path: 'spec.storageClassName', value: 'manual' },
          { path: 'spec.hostPath.path', value: '/my/path' },
        ],
        description: 'YAML 매니페스트로 PersistentVolume 생성',
      },
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'PersistentVolumeClaim' },
          { path: 'metadata.name', value: 'task-pv-claim' },
          { path: 'spec.accessModes[0]', value: 'ReadWriteOnce' },
          { path: 'spec.storageClassName', value: 'manual' },
          { path: 'spec.resources.requests.storage', value: '3Gi' },
        ],
        description: 'YAML 매니페스트로 PersistentVolumeClaim 생성',
      },
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'task-pv-pod' },
          { path: 'spec.containers[0].image', value: 'nginx' },
          { path: 'spec.containers[0].ports[0].containerPort', value: 80 },
          { path: 'spec.containers[0].volumeMounts[0].mountPath', value: '/usr/share/nginx/html' },
          { path: 'spec.volumes[0].persistentVolumeClaim.claimName', value: 'task-pv-claim' },
        ],
        description: 'YAML 매니페스트로 PVC가 마운트된 Pod 생성',
      },
    ],
    hints: [
      { text: 'PV → PVC → Pod 순서로 생성합니다. PV와 PVC의 storageClassName과 accessModes가 일치해야 합니다.', penalty: 0.1 },
      { text: 'Pod 스펙에서 spec.volumes에 persistentVolumeClaim 타입을 사용하고, containers[].volumeMounts에 마운트 경로를 설정합니다.', penalty: 0.2 },
      { text: '# PV\napiVersion: v1\nkind: PersistentVolume\nmetadata:\n  name: task-pv-volume\nspec:\n  storageClassName: manual\n  capacity:\n    storage: 10Gi\n  accessModes:\n    - ReadWriteOnce\n  hostPath:\n    path: "/my/path"\n---\n# PVC\napiVersion: v1\nkind: PersistentVolumeClaim\nmetadata:\n  name: task-pv-claim\nspec:\n  storageClassName: manual\n  accessModes:\n    - ReadWriteOnce\n  resources:\n    requests:\n      storage: 3Gi\n---\n# Pod\napiVersion: v1\nkind: Pod\nmetadata:\n  name: task-pv-pod\nspec:\n  volumes:\n    - name: task-pv-storage\n      persistentVolumeClaim:\n        claimName: task-pv-claim\n  containers:\n    - name: task-pv-container\n      image: nginx\n      ports:\n        - containerPort: 80\n      volumeMounts:\n        - mountPath: "/usr/share/nginx/html"\n          name: task-pv-storage', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'PV "task-pv-volume" exists',
        command: 'kubectl get pv task-pv-volume -o jsonpath="{.metadata.name}"',
        expected: 'task-pv-volume',
      },
      {
        description: 'PV capacity is 10Gi',
        command: 'kubectl get pv task-pv-volume -o jsonpath="{.spec.capacity.storage}"',
        expected: '10Gi',
      },
      {
        description: 'PVC "task-pv-claim" is Bound',
        command: 'kubectl get pvc task-pv-claim -o jsonpath="{.status.phase}"',
        expected: 'Bound',
      },
      {
        description: 'Pod "task-pv-pod" exists',
        command: 'kubectl get pod task-pv-pod -o jsonpath="{.metadata.name}"',
        expected: 'task-pv-pod',
      },
      {
        description: 'Pod volume uses task-pv-claim',
        command: 'kubectl get pod task-pv-pod -o jsonpath="{.spec.volumes[0].persistentVolumeClaim.claimName}"',
        expected: 'task-pv-claim',
      },
    ],
  },
  {
    id: 'ec-10',
    category: 'environment-config',
    difficulty: 'medium',
    title: 'ConfigMap 특정 키를 환경변수로 로드',
    scenario:
      'ConfigMap을 생성하고 특정 키의 값을 환경변수로 Pod에 주입하세요.\n\n- "options"라는 ConfigMap을 생성하고 키-값 쌍 var5=val5를 포함하세요.\n- "nginx-options"라는 Pod를 nginx 이미지로 생성하고, ConfigMap "options"의 var5 키 값을 "option"이라는 이름의 환경변수로 로드하세요.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['create', 'configmap', 'options', '--from-literal', 'var5=val5'],
        description: 'kubectl create configmap으로 ConfigMap 생성',
      },
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'nginx-options' },
          { path: 'spec.containers[0].image', value: 'nginx' },
          { path: 'spec.containers[0].env[0].name', value: 'option' },
          { path: 'spec.containers[0].env[0].valueFrom.configMapKeyRef.name', value: 'options' },
          { path: 'spec.containers[0].env[0].valueFrom.configMapKeyRef.key', value: 'var5' },
        ],
        description: 'YAML 매니페스트로 ConfigMap 특정 키를 환경변수로 설정한 Pod 생성',
      },
    ],
    hints: [
      { text: 'env[].valueFrom.configMapKeyRef를 사용하면 ConfigMap의 특정 키를 환경변수로 로드할 수 있습니다.', penalty: 0.1 },
      { text: 'configMapKeyRef에 name(ConfigMap 이름)과 key(조회할 키)를 지정합니다.', penalty: 0.2 },
      { text: 'kubectl create cm options --from-literal=var5=val5\n---\napiVersion: v1\nkind: Pod\nmetadata:\n  name: nginx-options\nspec:\n  containers:\n  - name: nginx\n    image: nginx\n    env:\n    - name: option\n      valueFrom:\n        configMapKeyRef:\n          name: options\n          key: var5', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'ConfigMap "options" exists',
        command: 'kubectl get cm options -o jsonpath="{.metadata.name}"',
        expected: 'options',
      },
      {
        description: 'Pod "nginx-options" exists',
        command: 'kubectl get pod nginx-options -o jsonpath="{.metadata.name}"',
        expected: 'nginx-options',
      },
      {
        description: 'Env var references configMapKeyRef options/var5',
        command: 'kubectl get pod nginx-options -o jsonpath="{.spec.containers[0].env[0].valueFrom.configMapKeyRef.name}"',
        expected: 'options',
      },
    ],
  },
  {
    id: 'ec-11',
    category: 'environment-config',
    difficulty: 'medium',
    title: 'SecurityContext capabilities 추가',
    scenario:
      '추가 Linux capabilities가 설정된 Pod를 생성하세요.\n\n- "cap-pod"라는 Pod를 nginx 이미지로 생성하세요.\n- 컨테이너 이름은 "cap-container"입니다.\n- 컨테이너의 securityContext에 capabilities를 추가하여 "NET_ADMIN"과 "SYS_TIME" 권한을 부여하세요.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'cap-pod' },
          { path: 'spec.containers[0].name', value: 'cap-container' },
          { path: 'spec.containers[0].image', value: 'nginx' },
          { path: 'spec.containers[0].securityContext.capabilities.add[0]', value: 'NET_ADMIN' },
          { path: 'spec.containers[0].securityContext.capabilities.add[1]', value: 'SYS_TIME' },
        ],
        description: 'YAML 매니페스트로 capabilities가 설정된 Pod 생성',
      },
    ],
    hints: [
      { text: '컨테이너의 securityContext.capabilities.add 배열에 추가할 capability를 나열하세요.', penalty: 0.1 },
      { text: 'capabilities는 Linux 커널 권한입니다. NET_ADMIN은 네트워크 관리, SYS_TIME은 시스템 시간 변경 권한입니다.', penalty: 0.2 },
      { text: 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: cap-pod\nspec:\n  containers:\n  - name: cap-container\n    image: nginx\n    securityContext:\n      capabilities:\n        add: ["NET_ADMIN", "SYS_TIME"]', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Pod "cap-pod" exists',
        command: 'kubectl get pod cap-pod -o jsonpath="{.metadata.name}"',
        expected: 'cap-pod',
      },
      {
        description: 'NET_ADMIN capability added',
        command: 'kubectl get pod cap-pod -o jsonpath="{.spec.containers[0].securityContext.capabilities.add[0]}"',
        expected: 'NET_ADMIN',
      },
      {
        description: 'SYS_TIME capability added',
        command: 'kubectl get pod cap-pod -o jsonpath="{.spec.containers[0].securityContext.capabilities.add[1]}"',
        expected: 'SYS_TIME',
      },
    ],
  },
  {
    id: 'ec-12',
    category: 'environment-config',
    difficulty: 'medium',
    title: 'Resource Requests와 Limits 설정',
    scenario:
      'CPU와 메모리에 대한 요청(Requests)과 제한(Limits)이 모두 설정된 Pod를 생성하세요.\n\n- "resource-pod"라는 Pod를 nginx 이미지로 생성하세요.\n- 컨테이너 이름은 "nginx"입니다.\n- Requests: CPU 100m, Memory 256Mi\n- Limits: CPU 200m, Memory 512Mi',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'resource-pod' },
          { path: 'spec.containers[0].name', value: 'nginx' },
          { path: 'spec.containers[0].image', value: 'nginx' },
          { path: 'spec.containers[0].resources.requests.cpu', value: '100m' },
          { path: 'spec.containers[0].resources.requests.memory', value: '256Mi' },
          { path: 'spec.containers[0].resources.limits.cpu', value: '200m' },
          { path: 'spec.containers[0].resources.limits.memory', value: '512Mi' },
        ],
        description: 'YAML 매니페스트로 Requests + Limits가 설정된 Pod 생성',
      },
    ],
    hints: [
      { text: 'resources 아래에 requests와 limits를 각각 설정합니다. requests는 보장되는 최소치, limits는 사용 가능한 최대치입니다.', penalty: 0.1 },
      { text: 'limits는 반드시 requests 이상이어야 합니다. CPU는 밀리코어(m), Memory는 Mi/Gi 단위를 사용합니다.', penalty: 0.2 },
      { text: 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: resource-pod\nspec:\n  containers:\n  - name: nginx\n    image: nginx\n    resources:\n      requests:\n        cpu: 100m\n        memory: 256Mi\n      limits:\n        cpu: 200m\n        memory: 512Mi', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Pod "resource-pod" exists',
        command: 'kubectl get pod resource-pod -o jsonpath="{.metadata.name}"',
        expected: 'resource-pod',
      },
      {
        description: 'CPU request is 100m',
        command: 'kubectl get pod resource-pod -o jsonpath="{.spec.containers[0].resources.requests.cpu}"',
        expected: '100m',
      },
      {
        description: 'Memory limit is 512Mi',
        command: 'kubectl get pod resource-pod -o jsonpath="{.spec.containers[0].resources.limits.memory}"',
        expected: '512Mi',
      },
    ],
  },
  {
    id: 'ec-13',
    category: 'environment-config',
    difficulty: 'hard',
    title: 'ResourceQuota 생성',
    scenario:
      '네임스페이스에 리소스 사용량을 제한하는 ResourceQuota를 생성하세요.\n\n- "quota-ns"라는 네임스페이스를 생성하세요.\n- "my-quota"라는 ResourceQuota를 생성하세요.\n- hard limits: requests.cpu=1, requests.memory=1Gi, limits.cpu=2, limits.memory=2Gi\n- "quota-ns" 네임스페이스에 적용하세요.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['create', 'namespace', 'quota-ns'],
        description: 'kubectl create namespace 명령어로 네임스페이스 생성',
      },
      {
        type: 'command',
        requiredParts: ['create', 'quota', 'my-quota', '--namespace', 'quota-ns', '--hard', 'requests.cpu=1,requests.memory=1Gi,limits.cpu=2,limits.memory=2Gi'],
        description: 'kubectl create quota 명령어로 ResourceQuota 생성',
      },
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'ResourceQuota' },
          { path: 'metadata.name', value: 'my-quota' },
          { path: 'metadata.namespace', value: 'quota-ns' },
          { path: 'spec.hard.requests\\.cpu', value: '1' },
          { path: 'spec.hard.requests\\.memory', value: '1Gi' },
          { path: 'spec.hard.limits\\.cpu', value: '2' },
          { path: 'spec.hard.limits\\.memory', value: '2Gi' },
        ],
        description: 'YAML 매니페스트로 ResourceQuota 생성',
      },
    ],
    hints: [
      { text: 'kubectl create quota 명령어 또는 ResourceQuota YAML을 사용하세요.', penalty: 0.1 },
      { text: 'spec.hard에 requests.cpu, requests.memory, limits.cpu, limits.memory를 지정합니다.', penalty: 0.2 },
      { text: 'kubectl create ns quota-ns\nkubectl create quota my-quota -n quota-ns --hard=requests.cpu=1,requests.memory=1Gi,limits.cpu=2,limits.memory=2Gi', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Namespace "quota-ns" exists',
        command: 'kubectl get ns quota-ns -o jsonpath="{.metadata.name}"',
        expected: 'quota-ns',
      },
      {
        description: 'ResourceQuota "my-quota" exists in quota-ns',
        command: 'kubectl get resourcequota my-quota -n quota-ns -o jsonpath="{.metadata.name}"',
        expected: 'my-quota',
      },
      {
        description: 'Hard limit requests.cpu is 1',
        command: 'kubectl get resourcequota my-quota -n quota-ns -o jsonpath="{.spec.hard.requests\\.cpu}"',
        expected: '1',
      },
    ],
  },
  {
    id: 'ec-14',
    category: 'environment-config',
    difficulty: 'medium',
    title: 'LimitRange 생성',
    scenario:
      '네임스페이스 내 컨테이너의 기본 리소스 제한을 설정하는 LimitRange를 생성하세요.\n\n- "limit-ns"라는 네임스페이스를 생성하세요.\n- "app-limit-range"라는 LimitRange를 생성하세요.\n- 컨테이너 기본(default) 메모리 제한: 512Mi\n- 컨테이너 기본 요청(defaultRequest) 메모리: 256Mi\n- "limit-ns" 네임스페이스에 적용하세요.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['create', 'namespace', 'limit-ns'],
        description: 'kubectl create namespace 명령어로 네임스페이스 생성',
      },
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'LimitRange' },
          { path: 'metadata.name', value: 'app-limit-range' },
          { path: 'metadata.namespace', value: 'limit-ns' },
          { path: 'spec.limits[0].type', value: 'Container' },
          { path: 'spec.limits[0].default.memory', value: '512Mi' },
          { path: 'spec.limits[0].defaultRequest.memory', value: '256Mi' },
        ],
        description: 'YAML 매니페스트로 LimitRange 생성',
      },
    ],
    hints: [
      { text: 'LimitRange는 네임스페이스 내 컨테이너에 기본 리소스 제한을 자동으로 적용합니다.', penalty: 0.1 },
      { text: 'spec.limits[].type은 "Container"로, default와 defaultRequest 필드에 메모리 값을 지정합니다.', penalty: 0.2 },
      { text: 'apiVersion: v1\nkind: LimitRange\nmetadata:\n  name: app-limit-range\n  namespace: limit-ns\nspec:\n  limits:\n  - type: Container\n    default:\n      memory: 512Mi\n    defaultRequest:\n      memory: 256Mi', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Namespace "limit-ns" exists',
        command: 'kubectl get ns limit-ns -o jsonpath="{.metadata.name}"',
        expected: 'limit-ns',
      },
      {
        description: 'LimitRange "app-limit-range" exists in limit-ns',
        command: 'kubectl get limitrange app-limit-range -n limit-ns -o jsonpath="{.metadata.name}"',
        expected: 'app-limit-range',
      },
      {
        description: 'Default memory limit is 512Mi',
        command: 'kubectl get limitrange app-limit-range -n limit-ns -o jsonpath="{.spec.limits[0].default.memory}"',
        expected: '512Mi',
      },
    ],
  },
  {
    id: 'ec-15',
    category: 'environment-config',
    difficulty: 'medium',
    title: 'SecurityContext fsGroup 설정',
    scenario:
      'Pod 레벨의 SecurityContext에서 fsGroup을 설정하여 볼륨에 생성되는 파일의 그룹 소유권을 제어하세요.\n\n- "secured"라는 Pod를 nginx 이미지로 생성하세요.\n- emptyDir 볼륨을 "/data/app" 경로에 마운트하세요.\n- Pod의 SecurityContext에서 fsGroup을 3000으로 설정하세요.\n- 볼륨에 생성되는 파일은 그룹 ID 3000을 사용해야 합니다.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Pod' },
          { path: 'metadata.name', value: 'secured' },
          { path: 'spec.securityContext.fsGroup', value: '3000' },
          { path: 'spec.containers[0].image', value: 'nginx' },
          { path: 'spec.containers[0].volumeMounts[0].mountPath', value: '/data/app' },
          { path: 'spec.volumes[0].emptyDir', value: '{}' },
        ],
        description: 'YAML 매니페스트로 fsGroup이 설정된 Pod 생성',
      },
    ],
    hints: [
      { text: 'Pod의 spec.securityContext.fsGroup 필드를 사용하여 볼륨 파일의 그룹 소유권을 설정합니다.', penalty: 0.1 },
      { text: 'fsGroup은 Pod 레벨의 securityContext에서 설정하며, emptyDir 볼륨과 volumeMounts를 함께 정의해야 합니다.', penalty: 0.2 },
      { text: 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: secured\nspec:\n  securityContext:\n    fsGroup: 3000\n  containers:\n  - image: nginx\n    name: secured\n    volumeMounts:\n    - name: data-vol\n      mountPath: /data/app\n  volumes:\n  - name: data-vol\n    emptyDir: {}', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Pod "secured" exists',
        command: 'kubectl get pod secured -o jsonpath="{.metadata.name}"',
        expected: 'secured',
      },
      {
        description: 'fsGroup is 3000',
        command: 'kubectl get pod secured -o jsonpath="{.spec.securityContext.fsGroup}"',
        expected: '3000',
      },
      {
        description: 'Volume mounted at /data/app',
        command: 'kubectl get pod secured -o jsonpath="{.spec.containers[0].volumeMounts[0].mountPath}"',
        expected: '/data/app',
      },
    ],
  },
];
