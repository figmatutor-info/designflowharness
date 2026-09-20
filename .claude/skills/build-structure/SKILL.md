---
name: build-structure
description: 화면 목록과 사용자 플로우를 정의. Phase 2 담당.
argument-hint: [없음 - analysis.md 자동 참조]
context: fork
agent: structure-builder
background: false
---

# /build-structure

`analysis.md`와 PRD를 종합해 `screens.md`(화면 5개+)와 `flows.md`(시나리오 2-3개)를 생성한다.

**품질 계약:** `docs/ui-quality.md`를 읽는다.

**요청**: $ARGUMENTS

> 이 스킬은 `structure-builder` 서브에이전트에서 실행된다 (프론트매터 `agent:` 로 고정).
> 역할 경계는 `.claude/agents/structure-builder.md` 에 있다.
> 각 화면은 반드시 analysis.md 패턴과 매칭되어야 한다.

## 인자

- 인자 불필요 (analysis.md와 PRD 자동 참조)
- 특정 방향 지시 가능: "예약 화면을 2개로 나눠줘"

## 사전 조건

- `design/01-references/analysis.md` 존재
- 게이트 1 통과 (Phase 1 완료)
- PRD 파일 접근 가능

없으면 중단하고 Phase 1부터 진행하도록 안내.

## 산출물

```
design/02-structure/
├── screens.md  (화면 5개+ 상세 정의)
│   ├── 요약표
│   ├── 화면별 상세 (목적, primary, 상태, 레퍼런스 매칭)
│   ├── 화면 흐름 요약
│   └── 컴포넌트 목록
│
└── flows.md    (시나리오 2-3개)
    └── 2인칭 내러티브 형식
        "당신은 앱을 엽니다. 홈 화면이 보입니다. (①)"
```

추가 산출물: `design/02-structure/screen-contract.json`. 완료 전 `npm run check:contract`.

## 목표

- 화면 최소 5개
- screen-contract.json에 화면·필수 상태·single/collection/none 주 행동 정책·사용자 체크 정의
- 각 화면 레퍼런스 패턴 매칭 필수
- 시나리오 2-3개 (주요 사용자 여정)
- 게이트 2 통과 (구조 완성 + 사용자 승인)

## 다음 단계

구조 정의 완료 후:

- AI 초안을 사용자에게 검토 요청
- 수정 요청 시 → 부분 재생성
- 승인 시 → `/generate-rules` 실행 (Phase 3)
