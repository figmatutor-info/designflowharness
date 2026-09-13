# 하네스 설계 원칙

design-flow-harness가 따르는 설계 철학과 원리 정리.

---

## 1. 왜 하네스가 필요한가

AI에게 그냥 "디자인해줘" 하면:

- 매번 다른 결과
- 규칙 없이 임의 결정
- 프로젝트 일관성 파괴

**하네스는 AI의 판단 여지를 좁혀 일관된 결과를 만든다.**

---

## 2. 좋은 하네스의 4가지 기준

### 기준 1 · SSOT (Single Source of Truth)

규칙이 여러 곳에 있으면 갈라진다.
**규칙은 하나의 파일에만 존재해야 한다.**

우리 하네스의 SSOT:

- `design-rules.md` — 디자인 규칙 SSOT
- `default-tokens.md` — 기본값 SSOT
- `design/` 폴더 — 상태 SSOT

### 기준 2 · 강제성 (Enforceability)

문서만으로는 안 지켜진다.
**세 가지 레이어가 겹쳐야 진짜 강제된다:**

```
Layer 1: 문서 (선언)     → "이렇게 해야 함"
Layer 2: 절차 (에이전트) → "이렇게 하도록 안내"
Layer 3: 스크립트 (자동) → "안 하면 진행 안 됨"
```

우리 하네스:

- Layer 1: CLAUDE.md, design-rules.md
- Layer 2: 6개 에이전트
- Layer 3: check-phase.mjs, verify-design-rules.mjs, figma-audit.mjs

### 기준 3 · 역할 분리 (Role Separation)

만능 에이전트 하나보다 전문 에이전트 여럿이 낫다.
**각 에이전트는 자기 폴더/역할만 담당.**

우리 하네스:

- reference-collector → design/01-references/raw/
- reference-analyzer → design/01-references/analysis.md
- structure-builder → design/02-structure/
- design-rules-generator → design/03-design-rules/ (SSOT)
- figma-builder → design/04-screens/ + Figma
- design-auditor → 읽기 전용 (판정만)

### 기준 4 · 게이트 (Gates)

각 단계 사이에 통과 조건을 두면 품질 유지.
**게이트 없이 진행 = 나중에 재작업 폭발.**

우리 하네스의 4개 게이트:

- 게이트 1: 레퍼런스 3장+ / analysis.md 완성
- 게이트 2: 화면 5개+ / 레퍼런스 매칭
- 게이트 3: `status: confirmed` (핵심!)
- 게이트 4: audit PASS

---

## 3. 하네스 설계 프로세스

이 하네스를 만든 순서:

### Step 1 · 요구사항 도출

- 무엇을 자동화할 것인가?
- 사용자는 누구인가? (디자이너)
- 성공 기준은? (Figma 5화면 완성)

### Step 2 · 파이프라인 설계

- Phase를 몇 개로 나눌 것인가? (4개)
- 각 Phase의 입력/출력은?
- Phase 간 게이트는?

### Step 3 · 에이전트 설계

- 각 Phase에 몇 개 에이전트?
- 에이전트 간 역할 경계?
- 어떤 에이전트가 무슨 폴더 편집?

### Step 4 · 검증 설계

- 어떤 조건이 통과인가?
- 자동 검증 vs 수동 검증?
- 실패 시 대응은?

### Step 5 · 구현 및 테스트

- 파일 작성 (에이전트, 스킬, 스크립트)
- 실제 프로젝트로 테스트
- 부족한 부분 보완

---

## 4. 우리 하네스의 특징

### 하이브리드 트리거

- 자연어 + 슬래시 명령 동시 지원
- 사용자 편의 우선

### 기본값 정책

- 사용자가 안 정해도 진행됨
- `default-tokens.md`가 든든한 기본

### 산출물이 곧 상태

- `design/` 폴더 = 진행 상황
- 세션 끊겨도 재개 가능

### 스크립트 기반 게이트

- LLM 자기 보고 안 믿음
- 스크립트가 exit code로 판정

---

## 5. 확장 아이디어

이 하네스를 확장한다면:

### 추가 가능 에이전트

- `dev-handoff` — 개발자 핸드오프 문서 자동 생성
- `visual-qa` — Playwright로 렌더링 검증
- `accessibility-checker` — 접근성 자동 검사

### 추가 가능 Phase

- Phase 5: QA (visual regression)
- Phase 6: 개발 핸드오프
- Phase 7: 프로덕트 라이브 후 모니터링

### 다른 도메인 응용

- 웹사이트 (반응형)
- 데스크톱 앱
- 이메일 템플릿
- 프레젠테이션

---

## 6. 학습 자료

- [Anthropic Claude Code Docs](https://docs.claude.com)
- Figma MCP 문서
- uibowl MCP 문서
- 하네스 A, B (본 프로젝트의 원본 레퍼런스)
