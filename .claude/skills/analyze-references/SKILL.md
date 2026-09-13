---
name: analyze-references
description: 수집된 스크린샷을 Vision으로 분석해 UX/시각/컴포넌트 패턴 추출. Phase 1의 두 번째 단계.
argument-hint: [없음 - raw 폴더 자동 스캔]
context: fork
agent: reference-analyzer
background: false
---

# /analyze-references

`design/01-references/raw/` 폴더의 스크린샷을 분석해 패턴을 추출하고 `analysis.md`를 생성한다.

**요청**: $ARGUMENTS

> 이 스킬은 `reference-analyzer` 서브에이전트에서 실행된다 (프론트매터 `agent:` 로 고정).
> 역할 경계는 `.claude/agents/reference-analyzer.md` 에 있다.
> Vision으로 이미지를 직접 봐서 분석한다.

## 인자

- 인자 불필요 (raw 폴더 자동 스캔)
- 특정 앱만 분석하고 싶으면 명시 가능: "airbnb만 분석해줘"

## 사전 조건

- `design/01-references/raw/` 존재
- 최소 스크린샷 3장 이상
- `raw/README.md` 존재 (수집 리포트)

없으면 중단하고 `/collect-references` 먼저 실행하도록 안내.

## 산출물

```
design/01-references/
└── analysis.md (카테고리별 정리)
    ├── UX 패턴 (근거 앱 + 우리 앱 적용법)
    ├── 시각 패턴
    ├── 컴포넌트 패턴
    ├── 앱별 상세 (부록)
    └── 우리 앱 적용 계획
```

## 목표

- UX/시각/컴포넌트 각 카테고리 최소 3개 패턴
- 각 패턴마다 근거 앱 목록 + 우리 앱 적용법
- 게이트 1 통과 (analysis.md 완성 + 사용자 승인)

## 다음 단계

분석 완료 후:

- 결과 요약을 사용자에게 전달
- 승인 시 → `/build-structure` 실행 (Phase 2)
- 수정 요청 시 → 부분 재분석
