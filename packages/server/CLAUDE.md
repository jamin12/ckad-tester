# Backend Server (packages/server/)

Express 5 + ws + `@kubernetes/client-node` 기반 백엔드. Lab 모드에서 K8s 클러스터 프록시 및 검증 API 제공.

## 구조

### 폴더 설명

| 폴더 | 역할 |
|------|------|
| `src/sessions/` | 세션 생명주기 관리. kubeconfig로 KubeConfig/CoreV1Api/Exec 인스턴스 생성, TTL 기반 정리, 서버 종료 시 K8s 리소스(pod/secret) 자동 삭제 |
| `src/ws/` | WebSocket 통신 계층. 터미널 세션 관리(auth/input/resize), K8s exec으로 pod 쉘 연결, workspace pod 생성 + kubeconfig Secret 마운트 |
| `src/routes/` | REST API 라우트. 헬스체크와 답안 검증 엔드포인트. Zod로 요청 검증 |
| `src/verification/` | 검증 엔진. workspace pod에서 kubectl 커맨드 실행 후 expected 값과 비교(정규식/문자열). 가중 점수 계산 |

### 파일 트리

```
packages/server/src/
├── index.ts                    # 진입점: Express + HTTP + WebSocket 서버 + graceful shutdown
├── config.ts                   # 서버 설정 (포트, TTL, 타임아웃, pod 이미지)
├── sessions/
│   └── SessionManager.ts       # 세션 관리 (KubeConfig, CoreV1Api, Exec per session)
├── ws/
│   ├── wsServer.ts             # WebSocket 서버 (/ws/terminal)
│   ├── shellAttach.ts          # K8s exec → WebSocket 양방향 파이프
│   └── workspacePod.ts         # Workspace pod + kubeconfig Secret 생성/정리
├── routes/
│   ├── health.ts               # GET /api/health
│   └── verify.ts               # POST /api/verify (Zod 검증)
└── verification/
    ├── verifier.ts             # 검증 엔진 (체크 실행 + 가중 점수)
    └── execCommand.ts          # Pod 내 커맨드 실행 (10초 타임아웃)
```

## 명령어

```bash
pnpm dev     # tsx watch src/index.ts
pnpm build   # tsc
pnpm start   # node dist/index.js
```

## 인증: kubeconfig-only

토큰 인증 없음. kubeconfig 파일 내용만으로 K8s 클러스터에 연결.

```ts
// SessionManager.ts
const kc = new KubeConfig();
kc.loadFromString(config.kubeconfig);
const namespace = config.namespace || kc.getContextObject(kc.currentContext)?.namespace || 'default';
```

## API

### GET /api/health

```json
{ "status": "ok", "timestamp": 1234567890 }
```

### POST /api/verify

```json
// Request
{
  "sessionId": "uuid",
  "questionId": "dp-1",
  "checks": [
    { "description": "Deployment exists", "command": "kubectl get deploy webapp -o jsonpath=\"{.metadata.name}\"", "expected": "webapp" }
  ]
}

// Response
{
  "questionId": "dp-1",
  "passed": true,
  "score": 1.0,
  "checks": [
    { "description": "Deployment exists", "passed": true, "actual": "webapp", "expected": "webapp" }
  ]
}
```

### WS /ws/terminal

클라이언트 → 서버:
- `{ type: 'auth', config: { kubeconfig, namespace? } }` — 세션 생성 + 터미널 연결
- `{ type: 'input', data: '...' }` — stdin 전달
- `{ type: 'resize', cols, rows }` — PTY 리사이즈

서버 → 클라이언트:
- `{ type: 'connected', session: { sessionId, connectedAt, namespace } }`
- `{ type: 'output', data: '...' }` — stdout/stderr
- `{ type: 'error', message: '...' }`
- `{ type: 'disconnected', reason: '...' }`

## 코딩 규칙

- **모듈**: `module: "NodeNext"`, `moduleResolution: "NodeNext"`
- **임포트 확장자**: `.js` (컴파일된 JS 기준, NodeNext 규칙)
- **공유 타입**: `@ckad-tester/shared/lab` (workspace 의존성)
- **`import type`**: `verbatimModuleSyntax` 활성화
- **`@kubernetes/client-node` v1.x API**: `readNamespacedPod()` 등은 `V1Pod` 직접 반환 (`{ body }` 패턴 아님)

## 설정 (config.ts)

| 항목 | 기본값 | 설명 |
|------|--------|------|
| `port` | 3001 | HTTP/WS 서버 포트 |
| `sessionTtlMs` | 30분 | 세션 만료 시간 |
| `execTimeoutMs` | 10초 | 커맨드 실행 타임아웃 |
| `workspacePodPrefix` | `ckad-workspace` | Workspace pod 이름 접두사 |
| `workspacePodImage` | `bitnami/kubectl:latest` | Workspace pod 이미지 |

## Workspace Pod

세션 시작 시 target namespace에 workspace pod 자동 생성:
1. 사용자의 kubeconfig를 Secret(`ckad-workspace-kubeconfig`)으로 생성
2. `bitnami/kubectl` 이미지로 pod 생성, Secret을 `/etc/kubeconfig/config`에 마운트
3. `KUBECONFIG` 환경변수로 경로 지정 → pod 안의 kubectl이 사용자 권한으로 동작
4. 최대 60초 대기 후 Running 상태 확인

서버 종료(SIGINT/SIGTERM) 시 모든 세션의 pod + secret 자동 삭제.
