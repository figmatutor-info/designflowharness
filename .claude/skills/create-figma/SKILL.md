---
name: create-figma
description: Figma MCP로 토큰→컴포넌트→화면 순서로 실제 Figma 파일 생성. Phase 4 담당.
argument-hint: [STAGE=tokens|components|screens|fix (선택)]
context: fork
agent: figma-builder
background: false
---

# /create-figma

`design-rules.md`를 유일한 입력으로 Figma MCP를 사용해 토큰 → 컴포넌트 → 화면을 순차 생성한다.

**요청**: $ARGUMENTS

> 이 스킬은 `figma-builder` 서브에이전트에서 실행된다 (프론트매터 `agent:` 로 고정).
> 역할 경계는 `.claude/agents/figma-builder.md` 에 있다.
> **design-rules.md status: confirmed 없으면 즉시 종료.**

## 인자

- **STAGE 지정 (선택):** `STAGE=tokens` / `STAGE=components` / `STAGE=screens` / `STAGE=fix`
- 지정 안 하면 build-log.md 읽어 자동 판단 (없으면 tokens부터)

## 사전 조건

- `design/03-design-rules/design-rules.md` 존재 & status: confirmed
- Figma MCP 인증 완료 (`/mcp` 확인)
- `design/04-screens/figma-file-key.txt` 존재
  - **Figma 파일은 사용자가 직접 만든다.** 에이전트는 새 파일을 만들지 않는다.
  - `https://www.figma.com/design/{파일 키}/파일이름` 에서 키를 복사해 저장
  - 없으면 즉시 종료하고 키를 요청한다

없으면 즉시 종료.

## 산출물

```
design/04-screens/
├── figma-file-key.txt   (사용자가 만든 Figma 파일의 키)
├── figma-snapshot.json  (audit 입력 · scripts/figma-snapshot.js 가 추출)
├── build-log.md         (STAGE별 진행 기록)
└── screenshots/         (screens STAGE 완성 즉시 저장)
    ├── 01-home.png
    ├── 02-search-results.png
    └── ...
```

**Figma 파일 페이지 구조:**

```
01 Tokens      (색·간격·타이포·shadow 변수)
02 Components  (Button, Card, TabBar 등 14개)
03 Screens     (실제 화면 5개+)
```

## 진행 리듬

1. **STAGE=tokens** (자동 진행) — 2-3분
   - 색 15개, space 8개, radius 5개, size 12개, text 8개, shadow 3개
2. **STAGE=components** (자동 진행) — 5-7분
   - Icon, Button, Card, Input, TabBar 등 14개
3. **STAGE=screens** (사용자 확인 후 시작) — 10-15분
   - 화면당 완성 즉시 스크린샷 전달
4. **STAGE=fix** (필요 시) — audit 실패 fix-list 처리

## 목표

- design-rules.md 100% 준수 (하드코딩 0개)
- 5개 화면 완성 + 각 상태별 프레임
- 게이트 4 통과 준비 (audit 통과)

## 다음 단계

screens STAGE 완료 후:

- 사용자에게 검증 시작 확인
- Yes → `/audit-design` 실행
- audit 실패 시 → `/create-figma STAGE=fix` 자동 안내
