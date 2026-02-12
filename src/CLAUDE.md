# Frontend (src/)

Vite 7 + React 19 + TypeScript 5.9 프론트엔드. Tailwind CSS 4로 스타일링.

## 구조

### 폴더 설명

| 폴더 | 역할 |
|------|------|
| `src/types/` | 모든 TypeScript 인터페이스/타입 정의. 도메인별로 분리 (quiz, question, terminal, lab) |
| `src/data/` | 정적 데이터. `constants.ts`(가중치, 임계값)와 `questions/`(문제 데이터) |
| `src/data/questions/` | CKAD 5개 도메인별 문제 파일. 각 파일이 `Question[]` 배열을 export. `labVerification` 포함 |
| `src/services/` | UI와 무관한 순수 비즈니스 로직. 문제 로딩, 답변 검증(패턴매칭), 점수 계산 |
| `src/context/` | React Context 정의. 모든 Context는 `{ state, actions, meta }` 3분할 구조 |
| `src/hooks/` | Context 소비 훅 + 유틸리티 훅(타이머). 각 Context에 대응하는 `use*` 훅 제공 |
| `src/components/layout/` | 페이지 공통 레이아웃. Header(진행률, 타이머, lab 연결 상태) |
| `src/components/home/` | 홈 페이지. 모드 선택(Simulation/Lab), kubeconfig 입력, 카테고리/난이도 설정 |
| `src/components/quiz/` | 퀴즈 진행 페이지. 문제 표시, 네비게이션, mode별 터미널 분기 렌더링 |
| `src/components/terminal/` | 터미널 관련 컴포넌트. Simulation용(패턴매칭 입출력) + Lab용(xterm.js 실제 쉘) |
| `src/components/lab/` | Lab 모드 전용 UI. Check 버튼, 검증 결과 표시, 클러스터 연결 상태 뱃지 |
| `src/components/result/` | 퀴즈 완료 후 결과 페이지. 점수 요약, 카테고리별 레이더 차트 |

### 파일 트리

```
src/
├── App.tsx                          # 루트: 해시 라우팅 + QuizSession(mode 분기)
├── main.tsx                         # 엔트리포인트
├── index.css                        # Tailwind + xterm.js 오버라이드
├── types/
│   ├── common.ts                    # Category, Difficulty
│   ├── question.ts                  # Question, ExpectedAnswer, labVerification
│   ├── quiz.ts                      # QuizConfig (mode, labConfig 포함)
│   ├── terminal.ts                  # 시뮬레이션 터미널 타입
│   └── lab.ts                       # QuizMode, LabConfig, ConnectionStatus + 공유 타입 re-export
├── data/
│   ├── constants.ts                 # 카테고리 가중치, 난이도, 임계값
│   └── questions/                   # 5개 도메인별 문제 (labVerification 포함)
├── services/
│   ├── questionLoader.ts            # 문제 필터링 + Fisher-Yates 셔플
│   ├── validator.ts                 # 검증 진입점 (command/yaml 분기)
│   ├── commandParser.ts             # kubectl 커맨드 파싱
│   ├── yamlValidator.ts             # YAML 구조 검증
│   └── scorer.ts                    # 카테고리별 가중 점수
├── context/
│   ├── QuizContext.tsx              # useReducer 기반 퀴즈 상태
│   ├── TerminalContext.tsx          # 시뮬레이션 터미널 (simulation 모드 전용)
│   └── LabContext.tsx               # WebSocket + 검증 API (lab 모드 전용)
├── hooks/
│   ├── useQuiz.ts                   # QuizContext 소비
│   ├── useTerminal.ts               # TerminalContext 소비
│   ├── useLab.ts                    # LabContext 소비
│   └── useTimer.ts                  # 타이머
└── components/
    ├── layout/
    │   └── Header.tsx               # 헤더 (lab 모드: ConnectionStatus 표시)
    ├── home/
    │   ├── HomePage.tsx             # 퀴즈 설정 (ModeSelector + ClusterConnectionForm)
    │   ├── ModeSelector.tsx         # Simulation / Lab 라디오
    │   └── ClusterConnectionForm.tsx # kubeconfig 입력 (파일/붙여넣기, localStorage 캐싱)
    ├── quiz/
    │   ├── QuizPage.tsx             # mode별 듀얼 렌더링 (RealTerminal vs SimulationTerminal)
    │   ├── QuizProvider.tsx         # QuizTerminalBridge
    │   ├── QuestionPanel.tsx        # 문제 표시
    │   ├── QuizNavigation.tsx       # 네비게이션 (children으로 CheckButton 수용)
    │   ├── CategoryBadge.tsx        # 카테고리 뱃지
    │   └── DifficultyBadge.tsx      # 난이도 뱃지
    ├── terminal/
    │   ├── Terminal.tsx             # 시뮬레이션 터미널 컨테이너
    │   ├── TerminalProvider.tsx     # TerminalContext Provider
    │   ├── TerminalInput.tsx        # 커맨드 입력
    │   ├── TerminalOutput.tsx       # 검증 결과 출력
    │   ├── TerminalYamlInput.tsx    # YAML 입력
    │   └── RealTerminal.tsx         # xterm.js 실제 터미널 (lab 모드 전용)
    ├── lab/
    │   ├── CheckButton.tsx          # 검증 실행 버튼
    │   ├── VerificationResult.tsx   # 검증 결과 UI
    │   └── ConnectionStatus.tsx     # 연결 상태 뱃지
    └── result/
        ├── ResultPage.tsx           # 결과 요약
        └── ScoreChart.tsx           # 카테고리별 점수 차트
```

## 모드별 렌더링

```tsx
// App.tsx
mode === 'lab'
  ? <LabProvider><QuizSession mode="lab" /></LabProvider>
  : <QuizSession mode="simulation" />

// QuizPage.tsx
mode === 'lab'
  ? <RealTerminal /> + <CheckButton /> + <VerificationResult />
  : <TerminalProvider>(<TerminalOutput /> + <TerminalInput />)</TerminalProvider>
```

## 코딩 규칙

- **임포트**: barrel 금지, `.ts`/`.tsx` 확장자 필수, `import type` 사용
- **공유 타입**: `../../packages/shared/src/lab.ts`에서 직접 임포트
- **React 19**: `<Context value={}>`, `use()` 훅, `forwardRef` 금지
- **렌더링**: 삼항(`? :`)만 사용, `&&` 금지
- **성능**: Map/Set O(1), 모듈 레벨 RegExp, 파생 상태는 렌더 중 계산 (useEffect 금지)
- **상태**: useRef(transient), useReducer + useCallback(dispatch 안정화)
- **접근성**: aria-label, role, focus-visible:ring-2, 시맨틱 HTML

## LabConfig (kubeconfig-only)

```ts
interface LabConfig {
  kubeconfig: string;     // kubeconfig 파일 내용
  namespace?: string;     // 오버라이드 (없으면 kubeconfig에서 추출)
}
```

kubeconfig에서 서버 URL과 namespace를 클라이언트 사이드에서 자동 추출 (`yaml` 패키지).
