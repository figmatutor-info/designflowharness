---
name: audit-design
description: Figma 화면을 design-rules 기준으로 검증. 실패 시 fix-list.md 생성. Phase 4 최종 게이트.
argument-hint: [없음 - Figma 파일 자동 검증]
context: fork
agent: design-auditor
background: false
---

# /audit-design

`figma-builder`가 만든 Figma 화면을 `design-rules.md` 기준으로 검증한다.

**요청**: $ARGUMENTS

> 이 스킬은 `design-auditor` 서브에이전트에서 실행된다 (프론트매터 `agent:` 로 고정).
> 역할 경계는 `.claude/agents/design-auditor.md` 에 있다.
> **읽기 전용** — Figma 파일과 코드를 절대 수정하지 않는다.

## 인자

- 인자 불필요 (build-log.md와 figma-file-key 자동 참조)

## 사전 조건

- `design/03-design-rules/design-rules.md` 존재 & status: confirmed
- `design/04-screens/build-log.md` 존재 (screens STAGE 완료됨)
- `design/04-screens/figma-file-key.txt` 존재
- `scripts/figma-audit.mjs` 존재
- Figma MCP 인증

없거나 미완료 시 종료.

## 검증 방식

**A단계 · 구조 검증 (스크립트 자동)**

`scripts/figma-audit.mjs` 실행. 8개 항목:

| 항목              | 통과 기준                      |
| ----------------- | ------------------------------ |
| 팔레트 일관성     | 미바인딩 SOLID fill/stroke 0개 |
| 타이포 재사용     | 미적용 텍스트 스타일 0개       |
| spacing 그리드    | 4배수 아닌 값 0개              |
| 탭 영역           | 44×44 미만 0개                 |
| 세이프 에어리어   | 침범 0개                       |
| primary 개수      | 화면당 정확히 1개              |
| 컴포넌트 재사용률 | ≥ 90%                          |
| 토큰 계층         | primitive 직접 바인딩 0개      |

**C단계 · 시각적 검증 (LLM)**

스크린샷 육안 판단:

- 전체 균형 (시각 위계, 여백, 정렬)
- 규칙 준수 (색, 타이포, 크기)
- 사용성 (primary 눈에 띔, 탭 영역, 콘텐츠)
- 이미지 (빈 슬롯 0개, 톤 일관성, 이미지 속 글자 없음)

## 산출물

```
design/04-screens/
├── audit-report.md          (검증 결과 상세)
├── audit-structural.json    (스크립트 출력)
└── fix-list.md              (FAIL 시만 생성, 표 형식)
```

## 진단 (실패 시)

3가지로 분류:

1. **국소 결함** → `/create-figma STAGE=fix` 실행
2. **이미지 결함** → 빈 슬롯·잘못된 파일은 `/create-figma STAGE=fix` 재주입 / 톤·대비 문제는 `/generate-rules` 로 §I 표의 `파일` 열 교체 (생성하지 않는다)
3. **방향 오류** → `/generate-rules` 재검토
4. **반복 실패** (3회) → 사용자 에스컬레이션

## 목표

- 게이트 4 통과 판정 (PASS or FAIL)
- FAIL 시 정확한 fix-list.md 제공
- 재시도 최대 3회

## 다음 단계

**PASS 시:**

- 🎉 프로젝트 완료
- 모든 게이트 통과 리캡
- Figma 파일 링크 전달

**FAIL (국소 결함):**

- `/create-figma STAGE=fix` 자동 안내
- 수정 완료 후 `/audit-design` 재실행

**FAIL (방향 오류):**

- Phase 3 재검토 권장
- `/generate-rules` 재실행 안내

**FAIL (반복 실패):**

- 사용자 에스컬레이션
- 근본 원인 함께 검토
