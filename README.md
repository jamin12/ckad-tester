# CKAD Tester

CKAD(Certified Kubernetes Application Developer) 시험 대비 퀴즈 연습 웹앱입니다.
터미널 UI에서 kubectl 명령어와 YAML 매니페스트를 직접 입력하며 연습할 수 있습니다.

실제 Kubernetes 클러스터 없이 브라우저에서 동작합니다.

## 주요 기능

- 5개 카테고리, 25개 문제 (카테고리/난이도/문제 수 선택 가능)
- 터미널 UI에서 kubectl 명령어 입력 및 즉시 검증
- YAML 모드 지원 (선언형 답안 작성)
- 힌트 시스템 (단계별 힌트 제공, 감점 적용)
- 타이머 및 진행 상황 표시
- 결과 페이지에서 카테고리별 점수 확인

## 시험 카테고리

| 카테고리 | 가중치 |
|----------|--------|
| 애플리케이션 설계 및 빌드 | 20% |
| 환경, 구성 및 보안 | 25% |
| 배포 | 20% |
| 서비스 및 네트워킹 | 20% |
| 관찰 가능성 및 유지보수 | 15% |

## 기술 스택

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4

## 시작하기

```bash
pnpm install
pnpm dev
```

## 빌드

```bash
pnpm build
pnpm preview
```

## 터미널 명령어

| 명령어 | 설명 |
|--------|------|
| `help` | 도움말 표시 |
| `hint` | 현재 문제 힌트 표시 |
| `skip` | 다음 문제로 이동 |
| `clear` | 터미널 출력 지우기 |
| `yaml` | YAML 입력 모드 전환 |
| `exit` | YAML 모드 종료 |
