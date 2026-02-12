import type { Question } from '../../types/question.ts';

export const servicesNetworkingQuestions: Question[] = [
  {
    id: 'sn-1',
    category: 'services-networking',
    difficulty: 'easy',
    title: 'ClusterIP Service 생성',
    scenario:
      '"web-deploy" Deployment를 클러스터 내부에서 접근할 수 있도록 ClusterIP 타입의 Service를 생성하세요. Service 이름은 "web-svc"이고, 포트 80을 대상 포트(targetPort) 80으로 노출합니다. "app=web-deploy" 셀렉터를 사용하세요.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['expose', 'deployment', 'web-deploy', '--name', 'web-svc', '--port', '80', '--target-port', '80'],
        description: 'kubectl expose 명령어로 ClusterIP Service 생성',
      },
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Service' },
          { path: 'metadata.name', value: 'web-svc' },
          { path: 'spec.type', value: 'ClusterIP' },
          { path: 'spec.ports[0].port', value: 80 },
          { path: 'spec.ports[0].targetPort', value: 80 },
          { path: 'spec.selector.app', value: 'web-deploy' },
        ],
        description: 'YAML 매니페스트로 ClusterIP Service 생성',
      },
    ],
    hints: [
      { text: 'kubectl expose deployment 명령어를 사용하거나 Service YAML을 작성하세요.', penalty: 0.1 },
      { text: '--port와 --target-port 플래그로 포트를 지정하고, --name으로 Service 이름을 설정합니다.', penalty: 0.2 },
      { text: 'kubectl expose deployment web-deploy --name=web-svc --port=80 --target-port=80', penalty: 0.3 },
    ],
    labVerification: [
      {
        description: 'Service "web-svc" exists',
        command: 'kubectl get svc web-svc -o jsonpath="{.metadata.name}"',
        expected: 'web-svc',
      },
      {
        description: 'Service type is ClusterIP',
        command: 'kubectl get svc web-svc -o jsonpath="{.spec.type}"',
        expected: 'ClusterIP',
      },
      {
        description: 'Port is 80',
        command: 'kubectl get svc web-svc -o jsonpath="{.spec.ports[0].port}"',
        expected: '80',
      },
    ],
  },
  {
    id: 'sn-2',
    category: 'services-networking',
    difficulty: 'medium',
    title: 'NodePort Service 생성',
    scenario:
      '"web-deploy" Deployment를 외부에서 접근할 수 있도록 NodePort 타입의 Service를 생성하세요. Service 이름은 "web-nodeport"이고, 서비스 포트는 80, 대상 포트는 80, NodePort는 30080으로 설정합니다. 셀렉터는 "app: web-deploy"를 사용하세요.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Service' },
          { path: 'metadata.name', value: 'web-nodeport' },
          { path: 'spec.type', value: 'NodePort' },
          { path: 'spec.ports[0].port', value: 80 },
          { path: 'spec.ports[0].targetPort', value: 80 },
          { path: 'spec.ports[0].nodePort', value: 30080 },
          { path: 'spec.selector.app', value: 'web-deploy' },
        ],
        description: 'YAML 매니페스트로 NodePort Service 생성',
      },
    ],
    hints: [
      { text: 'Service의 spec.type을 NodePort로 설정하세요.', penalty: 0.1 },
      { text: 'ports 섹션에서 port, targetPort, nodePort를 모두 지정합니다. nodePort는 30000-32767 범위여야 합니다.', penalty: 0.2 },
      {
        text: 'apiVersion: v1\nkind: Service\nmetadata:\n  name: web-nodeport\nspec:\n  type: NodePort\n  selector:\n    app: web-deploy\n  ports:\n  - port: 80\n    targetPort: 80\n    nodePort: 30080',
        penalty: 0.3,
      },
    ],
    labVerification: [
      {
        description: 'Service "web-nodeport" exists',
        command: 'kubectl get svc web-nodeport -o jsonpath="{.metadata.name}"',
        expected: 'web-nodeport',
      },
      {
        description: 'Service type is NodePort',
        command: 'kubectl get svc web-nodeport -o jsonpath="{.spec.type}"',
        expected: 'NodePort',
      },
      {
        description: 'NodePort is 30080',
        command: 'kubectl get svc web-nodeport -o jsonpath="{.spec.ports[0].nodePort}"',
        expected: '30080',
      },
    ],
  },
  {
    id: 'sn-3',
    category: 'services-networking',
    difficulty: 'medium',
    title: 'Ingress 리소스 생성',
    scenario:
      '"web-svc" Service로 트래픽을 라우팅하는 Ingress 리소스를 생성하세요. Ingress 이름은 "web-ingress"이며, 호스트는 "app.example.com"입니다. "/" 경로로 들어오는 HTTP 요청을 "web-svc" Service의 포트 80으로 전달해야 합니다. pathType은 Prefix로 설정하세요.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'Ingress' },
          { path: 'metadata.name', value: 'web-ingress' },
          { path: 'spec.rules[0].host', value: 'app.example.com' },
          { path: 'spec.rules[0].http.paths[0].path', value: '/' },
          { path: 'spec.rules[0].http.paths[0].pathType', value: 'Prefix' },
          { path: 'spec.rules[0].http.paths[0].backend.service.name', value: 'web-svc' },
          { path: 'spec.rules[0].http.paths[0].backend.service.port.number', value: 80 },
        ],
        description: 'YAML 매니페스트로 Ingress 리소스 생성',
      },
    ],
    hints: [
      { text: 'Ingress 리소스의 spec.rules에서 호스트와 경로 기반 라우팅을 설정하세요.', penalty: 0.1 },
      { text: 'rules[].http.paths[].backend.service에 name과 port.number를 지정합니다. pathType은 Prefix 또는 Exact를 사용합니다.', penalty: 0.2 },
      {
        text: 'apiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: web-ingress\nspec:\n  rules:\n  - host: app.example.com\n    http:\n      paths:\n      - path: /\n        pathType: Prefix\n        backend:\n          service:\n            name: web-svc\n            port:\n              number: 80',
        penalty: 0.3,
      },
    ],
    labVerification: [
      {
        description: 'Ingress "web-ingress" exists',
        command: 'kubectl get ingress web-ingress -o jsonpath="{.metadata.name}"',
        expected: 'web-ingress',
      },
      {
        description: 'Host is app.example.com',
        command: 'kubectl get ingress web-ingress -o jsonpath="{.spec.rules[0].host}"',
        expected: 'app.example.com',
      },
      {
        description: 'Backend service is web-svc',
        command: 'kubectl get ingress web-ingress -o jsonpath="{.spec.rules[0].http.paths[0].backend.service.name}"',
        expected: 'web-svc',
      },
    ],
  },
  {
    id: 'sn-4',
    category: 'services-networking',
    difficulty: 'hard',
    title: 'NetworkPolicy 설정 (Ingress)',
    scenario:
      '"backend" 네임스페이스에 있는 Pod들에 대한 NetworkPolicy를 생성하세요. NetworkPolicy 이름은 "api-allow"이며, "app: api" 레이블이 있는 Pod에 적용됩니다. "app: frontend" 레이블이 있는 Pod에서 오는 TCP 포트 8080 트래픽만 허용하고, 그 외 모든 인바운드 트래픽은 차단해야 합니다.',
    expectedAnswers: [
      {
        type: 'yaml',
        yamlRequirements: [
          { path: 'kind', value: 'NetworkPolicy' },
          { path: 'metadata.name', value: 'api-allow' },
          { path: 'metadata.namespace', value: 'backend' },
          { path: 'spec.podSelector.matchLabels.app', value: 'api' },
          { path: 'spec.policyTypes[0]', value: 'Ingress' },
          { path: 'spec.ingress[0].from[0].podSelector.matchLabels.app', value: 'frontend' },
          { path: 'spec.ingress[0].ports[0].protocol', value: 'TCP' },
          { path: 'spec.ingress[0].ports[0].port', value: 8080 },
        ],
        description: 'YAML 매니페스트로 Ingress NetworkPolicy 생성',
      },
    ],
    hints: [
      { text: 'NetworkPolicy 리소스의 spec.podSelector로 대상 Pod를 선택하고, spec.ingress에서 허용할 트래픽을 정의하세요.', penalty: 0.1 },
      { text: 'spec.ingress[].from[].podSelector로 소스 Pod를, spec.ingress[].ports[]로 허용 포트를 지정합니다. policyTypes에 Ingress를 포함하세요.', penalty: 0.2 },
      {
        text: 'apiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: api-allow\n  namespace: backend\nspec:\n  podSelector:\n    matchLabels:\n      app: api\n  policyTypes:\n  - Ingress\n  ingress:\n  - from:\n    - podSelector:\n        matchLabels:\n          app: frontend\n    ports:\n    - protocol: TCP\n      port: 8080',
        penalty: 0.3,
      },
    ],
    labVerification: [
      {
        description: 'NetworkPolicy "api-allow" exists in "backend" namespace',
        command: 'kubectl get netpol api-allow -n backend -o jsonpath="{.metadata.name}"',
        expected: 'api-allow',
      },
      {
        description: 'podSelector targets app=api',
        command: 'kubectl get netpol api-allow -n backend -o jsonpath="{.spec.podSelector.matchLabels.app}"',
        expected: 'api',
      },
      {
        description: 'Ingress from app=frontend on port 8080',
        command: 'kubectl get netpol api-allow -n backend -o jsonpath="{.spec.ingress[0].ports[0].port}"',
        expected: '8080',
      },
    ],
  },
  {
    id: 'sn-5',
    category: 'services-networking',
    difficulty: 'hard',
    title: 'DNS를 이용한 서비스 통신',
    scenario:
      '두 개의 Deployment와 Service를 생성하여 DNS 기반으로 통신하도록 설정하세요. 첫 번째는 "frontend" Deployment(nginx:1.25 이미지, 레플리카 2)와 "frontend-svc" ClusterIP Service(포트 80)입니다. 두 번째는 "backend" Deployment(nginx:1.25 이미지, 레플리카 2)와 "backend-svc" ClusterIP Service(포트 8080, targetPort 80)입니다. 두 Deployment 모두 기본 네임스페이스에 생성하세요.',
    expectedAnswers: [
      {
        type: 'command',
        requiredParts: ['create', 'deployment', 'frontend', '--image', 'nginx:1.25', '--replicas', '2'],
        description: 'frontend Deployment 생성',
      },
      {
        type: 'command',
        requiredParts: ['expose', 'deployment', 'frontend', '--name', 'frontend-svc', '--port', '80'],
        description: 'frontend Service 생성',
      },
      {
        type: 'command',
        requiredParts: ['create', 'deployment', 'backend', '--image', 'nginx:1.25', '--replicas', '2'],
        description: 'backend Deployment 생성',
      },
      {
        type: 'command',
        requiredParts: ['expose', 'deployment', 'backend', '--name', 'backend-svc', '--port', '8080', '--target-port', '80'],
        description: 'backend Service 생성',
      },
    ],
    hints: [
      { text: 'kubectl create deployment와 kubectl expose deployment를 각각 사용하여 Deployment와 Service를 생성하세요.', penalty: 0.1 },
      { text: '같은 네임스페이스 내에서는 Service 이름(예: backend-svc)으로 DNS 조회가 가능합니다. 다른 네임스페이스라면 <svc>.<namespace>.svc.cluster.local을 사용합니다.', penalty: 0.2 },
      {
        text: 'kubectl create deployment frontend --image=nginx:1.25 --replicas=2\nkubectl expose deployment frontend --name=frontend-svc --port=80\nkubectl create deployment backend --image=nginx:1.25 --replicas=2\nkubectl expose deployment backend --name=backend-svc --port=8080 --target-port=80',
        penalty: 0.3,
      },
    ],
    labVerification: [
      {
        description: 'Deployment "frontend" exists',
        command: 'kubectl get deploy frontend -o jsonpath="{.metadata.name}"',
        expected: 'frontend',
      },
      {
        description: 'Service "frontend-svc" exists',
        command: 'kubectl get svc frontend-svc -o jsonpath="{.metadata.name}"',
        expected: 'frontend-svc',
      },
      {
        description: 'Deployment "backend" exists',
        command: 'kubectl get deploy backend -o jsonpath="{.metadata.name}"',
        expected: 'backend',
      },
      {
        description: 'Service "backend-svc" exists',
        command: 'kubectl get svc backend-svc -o jsonpath="{.metadata.name}"',
        expected: 'backend-svc',
      },
    ],
  },
];
