---
name: generate-rules
description: 디자인 규칙 확정 (SSOT 생성). Phase 3 담당 - 하네스의 심장부.
argument-hint: [없음 - Phase 1, 2 자동 참조]
context: fork
agent: design-rules-generator
background: false
---

# /generate-rules ⭐

`default-tokens.md`를 기반으로 사용자의 브랜드 컬러를 반영하여 `design-rules.md` (SSOT)를 생성한다.

**요청**: $ARGUMENTS

> 이 스킬은 `design-rules-generator` 서브에이전트에서 실행된다 (프론트매터 `agent:` 로 고정).
> 역할 경계는 `.claude/agents/design-rules-generator.md` 에 있다.
> **이 스킬이 생성하는 design-rules.md 없이는 figma-builder가 실행되지 않는다.**

## 인자

- 인자 불필요 (Phase 1, 2 산출물 자동 참조)
- 브랜드 컬러 지정 가능: "primary는 #FF6B35로"

## 사전 조건

- `design/01-references/analysis.md` 존재
- `design/02-structure/screens.md` 존재
- `design/02-structure/flows.md` 존재
- `scripts/default-tokens.md` 존재 (기본값 세트)

없으면 중단하고 이전 Phase 먼저 완료 안내.

## 산출물

```
design/03-design-rules/
├── design-rules.md   ⭐ SSOT (figma-builder 유일 입력)
│   └── frontmatter: status: draft → confirmed (사용자 승인 후)
├── tokens.md         (토큰 상세)
├── components.md     (컴포넌트 규칙 상세)
└── preview.html      (시각 확인용 프리뷰)
```

## 프로세스

1. default-tokens.md 로드 (모든 값 default로 시작)
2. 브랜드 컬러 사용자 결정 (유일한 사용자 개입)
3. design-rules.md 초안 생성 (status: draft)
4. tokens.md, components.md 상세 파일 생성
5. preview.html 생성 (색 스와치 + 주요 컴포넌트 렌더)
6. 사용자에게 프리뷰 확인 요청
7. 승인 시 status: confirmed 마킹

## 목표

- 사용자는 브랜드 컬러 1개만 결정
- 나머지 모두 검증된 default 사용 (원칙 4)
- HTML 프리뷰로 시각적 확인 가능
- 게이트 3 통과 (status: confirmed + 사용자 승인)

## 다음 단계

status: confirmed 마킹 완료 후:

- 사용자에게 "Phase 4 시작?" 확인
- Yes → `/create-figma` 실행
- No → 여기서 중단, 나중에 재개
