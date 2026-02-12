# CKAD Tester

CKAD(Certified Kubernetes Application Developer) 시험 대비 인터랙티브 퀴즈 앱. **Simulation 모드**(클라이언트 사이드 패턴매칭)와 **Lab 모드**(실제 K8s 클러스터 연동) 두 가지 모드를 지원.

## 기술 스택

- **Frontend**: Vite 7, React 19, TypeScript 5.9, Tailwind CSS 4
- **Backend**: Node.js, Express 5, ws, `@kubernetes/client-node`
- **공유 타입**: `packages/shared` (빌드 불필요, 소스 직접 참조)
- **패키지 매니저**: pnpm (workspace 모노레포)
- **빌드 타겟**: ES2022 (frontend), ES2023 (server)
- **모듈**: `verbatimModuleSyntax` 활성화

## 모노레포 구조

```
ckad-tester/
├── src/                         # 프론트엔드 소스 (Vite + React 19)
│   ├── types/                   # 타입 정의 (quiz, question, terminal, lab)
│   ├── data/                    # 정적 데이터
│   │   └── questions/           # CKAD 5개 도메인별 문제 데이터
│   ├── services/                # 비즈니스 로직 (검증, 파싱, 점수 계산)
│   ├── context/                 # React Context (Quiz, Terminal, Lab)
│   ├── hooks/                   # Custom hooks (useQuiz, useTerminal, useLab, useTimer)
│   └── components/              # UI 컴포넌트
│       ├── layout/              # 공통 레이아웃 (Header)
│       ├── home/                # 홈 페이지 (설정, 모드 선택, kubeconfig 입력)
│       ├── quiz/                # 퀴즈 진행 (문제 표시, 네비게이션)
│       ├── terminal/            # 터미널 (시뮬레이션 + xterm.js 실제 터미널)
│       ├── lab/                 # Lab 모드 전용 (Check 버튼, 검증 결과, 연결 상태)
│       └── result/              # 결과 페이지 (점수 요약, 차트)
├── packages/
│   ├── shared/                  # 공유 타입 패키지 (@ckad-tester/shared)
│   │   └── src/                 # 클라이언트-서버 공유 인터페이스
│   └── server/                  # 백엔드 서버 패키지 (@ckad-tester/server)
│       └── src/                 # Express + WebSocket + K8s API
│           ├── sessions/        # 세션 생명주기 관리
│           ├── ws/              # WebSocket 서버, 쉘 연결, workspace pod 관리
│           ├── routes/          # REST API 라우트 (health, verify)
│           └── verification/    # 검증 엔진 (커맨드 실행, 결과 비교)
├── pnpm-workspace.yaml          # pnpm 워크스페이스 설정
└── vite.config.ts               # Vite 설정 + dev proxy (/api, /ws → localhost:3001)
```

## 명령어

```bash
pnpm dev          # 프론트엔드 개발 서버 (Vite)
pnpm dev:server   # 백엔드 개발 서버 (tsx watch)
pnpm dev:all      # 프론트 + 백엔드 동시 실행
pnpm build        # tsc -b && vite build (프론트엔드)
pnpm build:server # tsc (서버)
pnpm preview      # 빌드 결과 프리뷰
```

## 두 가지 모드

### Simulation 모드 (기존)

클라이언트 사이드 전용. 터미널에서 kubectl 커맨드/YAML을 입력하면 패턴매칭으로 검증.

```
사용자 입력 → validator.ts → commandParser.ts / yamlValidator.ts → 점수
```

### Lab 모드 (신규)

실제 K8s 클러스터에 연결. kubeconfig 파일만 제공하면 연결됨.

```
Kubeconfig → WebSocket → Backend → K8s exec (실시간 터미널)
Check 버튼 → POST /api/verify → workspace pod에서 kubectl 실행 → 검증 결과
```

- **인증**: kubeconfig 파일 (파일 업로드 또는 붙여넣기)
- **서버 URL, namespace**: kubeconfig에서 자동 추출, namespace는 오버라이드 가능
- **터미널**: xterm.js + WebSocket으로 실제 쉘 연결
- **검증**: 각 문제의 `labVerification` 필드에 정의된 kubectl 커맨드를 workspace pod에서 실행

## 아키텍처 핵심

### 해시 라우팅

`App.tsx`의 `getPageFromHash()`로 `home` / `quiz` / `result` 3개 페이지를 `window.location.hash`로 전환.

### QuizSession 브릿지

`App.tsx`의 `QuizSession`이 `QuizContext`(내부 상태)와 App 레벨 상태(questions, result, timer)를 연결. `mode` prop으로 simulation/lab 분기.

### Context 3분할 인터페이스

모든 Context는 `{ state, actions, meta }` 구조:
- **QuizContext**: 퀴즈 상태, 네비게이션, 답변 제출
- **TerminalContext**: 시뮬레이션 터미널 입출력 (simulation 모드 전용)
- **LabContext**: WebSocket 연결, 검증 API (lab 모드 전용)

### Lab 모드 검증 흐름

```
Check 버튼 클릭
→ useLab().actions.verify(questionId, checks)
→ POST /api/verify { sessionId, questionId, checks }
→ verifier.ts: workspace pod에서 각 check.command 실행
→ matchResult(actual, expected): 정규식 또는 문자열 비교
→ 가중 점수 계산 (score >= 0.7 → passed)
→ VerificationResponse 반환
```

## 코딩 규칙

### 임포트

- **barrel file(index.ts) 금지** - 항상 직접 경로로 임포트
- **프론트엔드**: `.ts`/`.tsx` 확장자 포함
- **서버**: `.js` 확장자 포함 (NodeNext 모듈)
- **`import type` 사용** - `verbatimModuleSyntax` 활성화
- **공유 타입 참조**: 프론트엔드는 `../../packages/shared/src/lab.ts`, 서버는 `@ckad-tester/shared/lab`

### React 19 패턴

- `<Context value={}>` 문법 사용 (`<Context.Provider>` 아님)
- `use()` 훅으로 context 소비 (`useContext` 아님)
- `forwardRef` 사용 금지
- **삼항 렌더링만 사용** (`? :` only, `&&` 렌더링 금지)

### 성능

- `Map`/`Set`으로 O(1) 조회
- 모듈 레벨 `RegExp` 컴파일
- `validationCache` (Map) 로 파싱 결과 캐시
- 파생 상태는 렌더 중 직접 계산 (`useEffect` 금지)

### 상태 관리

- `useRef`로 transient 값 관리
- `useReducer` + `useCallback`으로 dispatch 안정화

### 접근성

- `aria-label`, `role="log"` 적용
- `focus-visible:ring-2` 포커스 스타일
- 시맨틱 HTML 사용

## 문제 데이터 추가

1. `src/data/questions/` 아래 해당 카테고리 파일에 문제 추가
2. `Question` 타입 준수 (`src/types/question.ts`)
3. 새 카테고리 파일 생성 시 `questionLoader.ts`의 `ALL_QUESTIONS` 배열에 import 추가

`ExpectedAnswer` 타입별 필수 필드:
- `type: 'command'` → `requiredParts: string[]`
- `type: 'yaml'` → `yamlRequirements: YamlRequirement[]`

Lab 모드 검증 추가:
- `labVerification?: VerificationCheck[]` 필드에 kubectl 커맨드 + expected 값 정의
- `labVerification`이 없는 문제는 lab 모드에서 Check 버튼 비활성화

## 점수 기준

| 기준 | 임계값 |
|------|--------|
| 정답 | `score >= 0.7` |
| 완벽 | `score >= 0.9` |
| 합격 (가중 점수) | `weightedScore >= 0.66` |

카테고리 가중치: application-design 20%, environment-config 25%, deployment 20%, services-networking 20%, observability 15%
