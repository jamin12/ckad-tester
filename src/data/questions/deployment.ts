import type { Question } from '../../types/question.ts';

export const deploymentQuestions: Question[] = [
  {
    id: 'dp-1',
    category: 'deployment',
    difficulty: 'easy',
    title: 'Deployment 생성',
    scenario:
      '기본적인 Deployment를 생성하세요. Deployment 이름은 "web-deploy"이고, nginx:1.25 이미지를 사용하며, 레플리카 수는 3으로 설정해야 합니다.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['create', 'deployment', 'web-deploy', '--image', 'nginx:1.25', '--replicas', '3'],
        description: 'kubectl create deployment 명령어로 Deployment 생성',
      },
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Deployment' },
          { path: 'metadata.name', value: 'web-deploy' },
          { path: 'spec.replicas', value: 3 },
          { path: 'spec.template.spec.containers[0].image', value: 'nginx:1.25' },
        ],
        description: 'YAML 매니페스트로 Deployment 생성',
      },
    ],
    hints: [
      { text: 'kubectl create deployment 명령어를 사용하세요.', penalty: 0.1 },
      { text: '--replicas 플래그로 레플리카 수를, --image 플래그로 이미지를 지정합니다.', penalty: 0.2 },
      { text: 'kubectl create deployment web-deploy --image=nginx:1.25 --replicas=3', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Deployment "web-deploy" exists',
        command: 'kubectl get deploy web-deploy -o jsonpath="{.metadata.name}"',
        expected: 'web-deploy',
      },
      {
        description: 'Replicas set to 3',
        command: 'kubectl get deploy web-deploy -o jsonpath="{.spec.replicas}"',
        expected: '3',
      },
      {
        description: 'Image is nginx:1.25',
        command: 'kubectl get deploy web-deploy -o jsonpath="{.spec.template.spec.containers[0].image}"',
        expected: 'nginx:1.25',
      },
    ],
  },
  {
    id: 'dp-2',
    category: 'deployment',
    difficulty: 'easy',
    title: 'Deployment 스케일링',
    scenario:
      '현재 실행 중인 "web-deploy" Deployment의 레플리카 수를 5로 스케일링하세요. 기존 Deployment의 설정은 유지한 채 레플리카 수만 변경하면 됩니다.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['scale', 'deployment', 'web-deploy', '--replicas', '5'],
        description: 'kubectl scale 명령어로 Deployment 스케일링',
      },
    ],
    hints: [
      { text: 'kubectl scale 명령어를 사용하면 레플리카 수를 변경할 수 있습니다.', penalty: 0.1 },
      { text: 'kubectl scale deployment <이름> --replicas=<수> 형식으로 사용합니다.', penalty: 0.2 },
      { text: 'kubectl scale deployment web-deploy --replicas=5', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Deployment "web-deploy" replicas is 5',
        command: 'kubectl get deploy web-deploy -o jsonpath="{.spec.replicas}"',
        expected: '5',
      },
    ],
  },
  {
    id: 'dp-3',
    category: 'deployment',
    difficulty: 'medium',
    title: 'Rolling Update 수행',
    scenario:
      '"web-deploy" Deployment의 이미지를 nginx:1.26으로 업데이트하세요. 변경 이유를 기록하기 위해 "--record" 대신 annotation에 변경 사유 "Image update to 1.26"을 남기세요. kubectl set image 명령어를 사용하되, 컨테이너 이름은 "nginx"입니다.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['set', 'image', 'deployment', 'web-deploy', 'nginx=nginx:1.26'],
        description: 'kubectl set image 명령어로 Rolling Update 수행',
      },
    ],
    hints: [
      { text: 'kubectl set image 명령어를 사용하여 Deployment의 컨테이너 이미지를 변경할 수 있습니다.', penalty: 0.1 },
      { text: 'kubectl set image deployment/<이름> <컨테이너이름>=<새이미지> 형식으로 사용합니다.', penalty: 0.2 },
      { text: 'kubectl set image deployment/web-deploy nginx=nginx:1.26 && kubectl annotate deployment web-deploy kubernetes.io/change-cause="Image update to 1.26"', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Image updated to nginx:1.26',
        command: 'kubectl get deploy web-deploy -o jsonpath="{.spec.template.spec.containers[0].image}"',
        expected: 'nginx:1.26',
      },
    ],
  },
  {
    id: 'dp-4',
    category: 'deployment',
    difficulty: 'medium',
    title: 'Deployment 롤백',
    scenario:
      '"web-deploy" Deployment에 문제가 발생했습니다. 먼저 rollout history를 확인한 다음, 이전 버전(revision 1)으로 롤백하세요.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['rollout', 'history', 'deployment', 'web-deploy'],
        description: 'kubectl rollout history로 배포 이력 확인',
      },
      {
        type: 'command',
        requiredParts: ['rollout', 'undo', 'deployment', 'web-deploy', '--to-revision', '1'],
        description: 'kubectl rollout undo로 특정 revision으로 롤백',
      },
    ],
    hints: [
      { text: 'kubectl rollout history와 kubectl rollout undo 명령어를 사용하세요.', penalty: 0.1 },
      { text: 'rollout undo에 --to-revision 플래그를 사용하면 특정 리비전으로 롤백할 수 있습니다.', penalty: 0.2 },
      { text: 'kubectl rollout history deployment/web-deploy\nkubectl rollout undo deployment/web-deploy --to-revision=1', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Deployment rolled back to revision 1',
        command: 'kubectl get deploy web-deploy -o jsonpath="{.spec.template.spec.containers[0].image}"',
        expected: 'nginx:1.25',
      },
    ],
  },
  {
    id: 'dp-5',
    category: 'deployment',
    difficulty: 'hard',
    title: 'Rolling Update 전략 설정',
    scenario:
      '"api-server"라는 Deployment를 생성하세요. nginx:1.25 이미지를 사용하고, 레플리카 수는 4입니다. Rolling Update 전략을 설정하여 maxSurge를 1로, maxUnavailable을 0으로 지정하세요. 이렇게 하면 업데이트 시 항상 최소 4개의 Pod가 사용 가능하도록 보장됩니다. 또한 Pod에 "app: api-server" 레이블을 지정하세요.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Deployment' },
          { path: 'metadata.name', value: 'api-server' },
          { path: 'spec.replicas', value: 4 },
          { path: 'spec.strategy.type', value: 'RollingUpdate' },
          { path: 'spec.strategy.rollingUpdate.maxSurge', value: 1 },
          { path: 'spec.strategy.rollingUpdate.maxUnavailable', value: 0 },
          { path: 'spec.selector.matchLabels.app', value: 'api-server' },
          { path: 'spec.template.metadata.labels.app', value: 'api-server' },
          { path: 'spec.template.spec.containers[0].image', value: 'nginx:1.25' },
        ],
        description: 'YAML 매니페스트로 Rolling Update 전략이 설정된 Deployment 생성',
      },
    ],
    hints: [
      { text: 'spec.strategy 필드에서 type을 RollingUpdate로 설정하고, rollingUpdate 아래에 maxSurge와 maxUnavailable을 지정하세요.', penalty: 0.1 },
      { text: 'selector.matchLabels와 template.metadata.labels가 일치해야 하며, strategy.rollingUpdate에서 maxSurge: 1, maxUnavailable: 0을 설정합니다.', penalty: 0.2 },
      {
        text: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api-server\nspec:\n  replicas: 4\n  strategy:\n    type: RollingUpdate\n    rollingUpdate:\n      maxSurge: 1\n      maxUnavailable: 0\n  selector:\n    matchLabels:\n      app: api-server\n  template:\n    metadata:\n      labels:\n        app: api-server\n    spec:\n      containers:\n      - name: api-server\n        image: nginx:1.25',
        penalty: 0.3,
      },
    ],
    labVerification: [
      {
        description: 'Deployment "api-server" exists',
        command: 'kubectl get deploy api-server -o jsonpath="{.metadata.name}"',
        expected: 'api-server',
      },
      {
        description: 'Replicas set to 4',
        command: 'kubectl get deploy api-server -o jsonpath="{.spec.replicas}"',
        expected: '4',
      },
      {
        description: 'Strategy is RollingUpdate',
        command: 'kubectl get deploy api-server -o jsonpath="{.spec.strategy.type}"',
        expected: 'RollingUpdate',
      },
      {
        description: 'maxSurge is 1',
        command: 'kubectl get deploy api-server -o jsonpath="{.spec.strategy.rollingUpdate.maxSurge}"',
        expected: '1',
      },
      {
        description: 'maxUnavailable is 0',
        command: 'kubectl get deploy api-server -o jsonpath="{.spec.strategy.rollingUpdate.maxUnavailable}"',
        expected: '0',
      },
    ],
  },
];
