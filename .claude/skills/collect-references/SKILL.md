---
name: collect-references
description: uibowl MCP로 경쟁사 레퍼런스 스크린샷 수집. Phase 1의 첫 단계.
argument-hint: [PRD 파일 경로]
context: fork
agent: reference-collector
background: false
---

# /collect-references

PRD를 기반으로 경쟁사 앱 스크린샷을 uibowl MCP에서 수집한다.

**요청**: $ARGUMENTS

> 이 스킬은 `reference-collector` 서브에이전트에서 실행된다 (프론트매터 `agent:` 로 고정).
> 역할 경계·중단 조건은 `.claude/agents/reference-collector.md` 에 있다.
> 분석은 하지 않는다 — `reference-analyzer`가 이어받는다.

## 인자

- **PRD 파일 경로** (필수): 예 `./PRD.md`, `./docs/prd.md`
- 없으면 사용자에게 요청 (한 문단이라도 붙여넣기 OK)

## 산출물

```
design/01-references/raw/
├── 001-{앱}-{화면}.png
├── 002-{앱}-{화면}.png
├── ... (5개 앱 × 2-3장 = 10-15장)
└── README.md (수집 리포트)
```

## 목표

- 5개 앱 (도메인 매칭 + 활성 사용자 검증됨)
- 각 앱당 2-3장 (PRD 기능과 매칭되는 화면만)
- 목표 10장 이상 · 게이트 1 최소 조건은 3장 (`npm run check:references` 가 검사) — 3장 미만이면 FAIL

## 다음 단계

수집 완료 후:

- 자동으로 이어서 분석할지 사용자에게 확인
- Yes → `/analyze-references` 실행 (또는 자연어 "분석해줘")
- No → 여기서 중단, 나중에 재개 가능
