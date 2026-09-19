# design-flow-harness

디자이너가 AI와 일관되게 일하기 위한 4단계 파이프라인.
대상: 모바일 앱 (iOS/Android, 390×844).

레퍼런스 수집부터 Figma 화면 생성까지, 매 단계 게이트를 통과하며 진행한다.
자연어로도, 슬래시 명령으로도 동작한다.

---

## 6가지 원칙

### 1. 레퍼런스 없이 시작하지 않는다

Phase 1의 analysis.md 없이는 Phase 2로 갈 수 없다.
근거 없는 화면 구조는 만들지 않는다.

### 2. 규칙이 확정되지 않으면 Figma에 손대지 않는다

design/03-design-rules/design-rules.md 상단 `status: confirmed` 없이는
figma-builder가 절대 실행되지 않는다. 이 파일이 규칙 SSOT다.

규칙 안의 토큰은 primitive(값) → semantic(의도) 2계층으로 적는다.
색상·간격·radius·size 가 대상이며, 타이포는 role 기반 텍스트 스타일을 쓴다.
화면에 들어갈 이미지는 §I 표에 "어느 슬롯에 라이브러리의 어느 파일"로 적는다.
이미지는 생성하지 않는다 — `design/assets/characters/` 에 있는 파일만 쓴다.
아이콘도 그리지 않는다 — lucide 이름을 적고 CDN 에서 받는다.

### 3. 각 단계 게이트를 통과해야 다음으로

4개 Phase 사이에 게이트 4개. 각 게이트는 3중 확인:

- 스크립트 자동 검증
- 에이전트 자체 판단
- 사용자 승인

하나라도 실패하면 다음 Phase 진입 금지.

### 4. 기본값이 항상 있다

사용자가 "모르겠어요"라고 해도 진행이 멈추지 않는다.
scripts/default-tokens.md의 기본값을 적용하고 산출물에 가정 로그로 남긴다.

### 5. 산출물이 곧 상태다

각 Phase의 진행 상황은 design/ 폴더가 자체적으로 알려준다.
세션이 끊겨도 폴더만 있으면 다음부터 이어갈 수 있다.
"어디까지 했지?"를 물어볼 필요가 없다.

### 6. 자연어로도, 명령어로도 동작한다

"레퍼런스 뽑아줘" (자연어) = `/collect-references` (슬래시)
사용자 편의에 따라 선택. 결과는 동일한 에이전트가 실행.

---

## 표준 워크플로

```
Phase 1 · 레퍼런스     → 게이트 1 →
Phase 2 · 화면 구조    → 게이트 2 →
Phase 3 · 디자인 규칙  → 게이트 3 →
Phase 4 · Figma 생성   → 게이트 4 → 🎉 완료
           (tokens → components → screens)
```

각 게이트 통과 없이는 다음 Phase 진입 불가.

---

## 에이전트 라우팅

| 요청 유형     | 자연어 예시                                  | 에이전트               | 슬래시 명령         |
| ------------- | -------------------------------------------- | ---------------------- | ------------------- |
| 레퍼런스 수집 | "레퍼런스 뽑아줘", "경쟁사 분석"             | reference-collector    | /collect-references |
| 레퍼런스 분석 | "분석해줘", "패턴 뽑아줘"                    | reference-analyzer     | /analyze-references |
| 화면 구조     | "화면 구조 짜줘", "화면 목록"                | structure-builder      | /build-structure    |
| 디자인 규칙   | "규칙 만들어줘", "디자인 시스템"             | design-rules-generator | /generate-rules     |
| Figma 생성    | "Figma 화면 만들어줘"                        | figma-builder          | /create-figma       |
| 최종 검증     | "검증해줘", "audit"                          | design-auditor         | /audit-design       |
| 스냅샷 추출   | (자연어 없음 · 코디네이터가 백그라운드 기동) | snapshot-runner        | (없음)              |

snapshot-runner 는 사용자가 직접 부르는 에이전트가 아니다. figma-builder 가 build-log 에
`snapshot: requested` 를 남기면 코디네이터가 띄운다.

---

## 산출물 구조

```
design/
├── 01-references/         ← Phase 1
│   ├── raw/               (스크린샷 3개+)
│   └── analysis.md        (분석 + 패턴 통합)
│
├── 02-structure/          ← Phase 2
│   ├── screens.md         (화면 5개+ 정의)
│   └── flows.md           (시나리오 2-3개)
│
├── 03-design-rules/       ← Phase 3 (SSOT)
│   ├── design-rules.md    ⭐ 유일한 규칙 SSOT
│   ├── tokens.md
│   ├── components.md
│   └── preview.html
│
├── 04-screens/            ← Phase 4
│   ├── figma-file-key.txt      (사용자가 만든 Figma 파일 키)
│   ├── figma-snapshot.json     (audit 입력 · figma-snapshot.js 로만 추출)
│   ├── build-log.md
│   ├── audit-report.md
│   ├── audit-structural.json   (figma-audit.mjs 출력)
│   ├── fix-list.md             (audit FAIL 시만 생성)
│   └── screenshots/            (이미지까지 채워진 완성본)
│
└── assets/                ← 이미지 라이브러리 (사람이 채운다 · 에이전트 생성 금지)
    └── characters/        (§I 표의 `파일` 열이 가리키는 곳 · check-assets.mjs 가 대조)
```

---

## 절대 원칙

- **design-rules.md `status: confirmed` 없이 figma-builder 실행 금지**
- **토큰은 primitive → semantic 2계층. semantic 에 값 직결 금지**
- **컴포넌트·화면은 semantic 토큰만 바인딩** (primitive 직접 사용 금지)
- **Phase 순서 건너뛰기 금지** (1 → 2 → 3 → 4 순차)
- **게이트 실패 시 다음 Phase 진입 금지**
- **design/03-design-rules/design-rules.md 는 유일한 규칙 SSOT**
- **Figma 파일은 사용자가 만든 것만 사용한다** (에이전트가 새 파일 생성 금지)
- **snapshot 은 scripts/figma-snapshot.js 로만 추출한다** (추출 코드 즉흥 작성 금지 · 경량화는 스크립트의 `__PROFILE__=docs` 만)
- **snapshot 추출은 snapshot-runner 가 백그라운드로 한다.** figma-builder 는 lint 0건이면 요청만 남기고 다음 STAGE 로 간다. audit 전에는 세 페이지 스냅샷 전부 PASS 필수
- **토큰 문서 프레임은 scripts/figma-token-docs.js 로만 그린다** (규격은 docs/token-docs-spec.md · 즉흥 작성 금지)
- **컨테이너는 내용을 감싼다 (세로 HUG).** 고정 높이는 design-rules.md 에 `Height: fixed` 로 선언된 것만 허용 (check-layout.mjs 가 검사)
- **화면 이미지는 design-rules.md §I 표가 가리키는 `design/assets/characters/` 파일만 쓴다** (이미지 생성·외부 URL 금지)
- **아이콘은 lucide 이름으로 적고 CDN 에서 받는다** (손으로 그리지 않는다 · 버전 고정)
- **이미지 슬롯을 빈 채로 두고 Phase 4 를 끝내지 않는다** (게이트 4에서 FAIL)
- **각 에이전트는 자기 담당 폴더 외 편집 금지**
- **사용자 승인 없이 다음 Phase로 자동 진행 금지**

---

## 시간 예산 · 지연 시 기준

하네스는 "언제 멈추고 무엇을 포기할지"를 미리 정한다. 지연됐을 때 탐색을 더 하는 게 아니라
기본값을 적용하고 필수 콘텐츠에 집중한다. 누적 시점 기준.

| 시점                  | 목표                                   | 지연됐을 때                                                     |
| --------------------- | -------------------------------------- | --------------------------------------------------------------- |
| 15분                  | 분석 · 구조 확정                       | 추가 탐색을 중단하고 채택 패턴 확정                             |
| 25분                  | 규칙 · 대표 시안 확정                  | 미결정 스타일에 기본값(default-tokens) 적용                     |
| 40분                  | Figma 토큰 (STAGE=tokens 15분)         | 토큰 문서 정돈 중단, 변수·스타일·문서 6프레임 존재만 확보       |
| 60분                  | Figma 컴포넌트 (STAGE=components 20분) | 장식 중단, semantic 바인딩·HUG·텍스트 스타일만 완성             |
| 90분                  | Figma 화면 (STAGE=screens 30분)        | 장식 개선 중단, 필수 콘텐츠 + 이미지 주입 완성에 집중           |
| 100분                 | 검수 · 수정 종료                       | 남은 결함을 표시하고 결과 설명                                  |
| 어느 단계든 도구 장애 | 실행 재개                              | 준비된 체크포인트(build-log 마지막 ✅)로 전환했다고 알리고 진행 |

Phase 4 의 STAGE 별 예산과 재시도 상한은 `.claude/agents/figma-builder.md` 의
"시간 예산 · 재시도 기준" 에 있다 (tokens 15 · components 20 · screens 30분 = 65분 · 위 표의 누적치와 같다).
검증은 `scripts/figma-lint.js` 로 먼저 하고, 스냅샷은 STAGE 마지막에 `snapshot-runner` 에 위임한다
(백그라운드 · builder 는 기다리지 않는다 · runner 예산은 `.claude/agents/snapshot-runner.md`).

---

## 진행 상태 확인

각 Phase 완료 여부는 해당 폴더 존재로 판단.

```bash
# 현재 어디까지 왔는지
ls design/

# 각 Phase 게이트 통과 여부
node scripts/check-phase.mjs
```

---

## 트러블슈팅

**"게이트 통과 안 됨"**

- 실패한 조건이 뭔지 스크립트 출력 확인
- 해당 Phase 에이전트 재실행

**"화면에 이미지가 회색 박스로 남음"**

- `npm run check:assets` 로 design-rules §I 표와 `design/assets/characters/` 가 맞는지부터 확인
- 표의 `파일` 열에 적힌 파일이 폴더에 실제로 있는지 확인 (없으면 사람이 넣는다 — 생성하지 않는다)
- 슬롯 레이어 이름이 `Img/{key}` 인지 확인 (이름이 곧 주입 주소)
- `/create-figma STAGE=screens` 로 해당 화면을 다시 만든다

**"컨테이너가 내부 콘텐츠를 감싸지 못함 / 텍스트가 카드 밖으로 넘침"**

- `npm run check:layout` 으로 어느 노드인지 먼저 확인
- 원인 대부분은 오토레이아웃 프레임에 `resize(w, h)` 를 불러 sizing 이 FIXED 로 풀린 것
- 의도적 고정이면 design-rules.md 컴포넌트 항목에 `- Height: fixed(토큰)` 을 선언한다
- `schema_version 2` 경고가 뜨면 고정 높이 검사가 건너뛰어진 것 — 스냅샷을 v4 로 재추출
- `profile=docs` 로 검사가 건너뛰어졌다는 경고가 뜨면 컴포넌트·화면 페이지를 docs 로 뽑은 것 — `profile=full` 로 재요청

**"figma-builder가 시작 안 됨"**

- design-rules.md 상단 status 확인 (confirmed 여야 함)
- Phase 3 다시 확인

**"STAGE 가 예산보다 오래 걸림 / 스냅샷을 계속 다시 뽑음"**

- 원인 대부분은 스냅샷으로 검증하고 → 고치고 → 다시 뽑는 루프 (한 번 뽑는 데 1분+)
- 생성 직후 `scripts/figma-lint.js` 를 use_figma 로 돌려 위반만 받아 고친다 (수 초)
- 스냅샷은 lint 0건 이후 STAGE 당 1회 **요청**만 하고 다음 STAGE 로 간다. 추출은 snapshot-runner 가 한다
- runner 에서 응답이 잘리면 `__FRAME_FROM__/__FRAME_TO__` → `__NODE_FROM__/__NODE_TO__` 로 범위만 나눈다
  ("경량 추출" 코드를 직접 짜지 않는다 — check-\* 가 조용히 오판한다).
  01 Tokens 는 `__PROFILE__=docs`(스크립트 내장) 로 프레임당 1배치면 끝난다 — 이 페이지를 full 로 뽑고 있으면 그게 원인이다

**"MCP 인증 오류"**

- /mcp 명령으로 상태 확인
- uibowl, Figma 각각 인증

---

## 상세 문서

- 하네스 설계 원칙: docs/harness-principles.md (별도)
- 토큰 문서 규격: docs/token-docs-spec.md
- 각 에이전트 상세: .claude/agents/*.md
- figma-builder STAGE 별 절차: docs/figma-builder/stage-{tokens,components,screens,fix}.md (에이전트 파일은 공통 규칙만 · STAGE 확정 후 해당 문서 1개만 Read)
- 검증 스크립트: scripts/*.mjs (로컬 · 스냅샷 기반)
- Figma 안에서 돌리는 스크립트: scripts/figma-snapshot.js (추출 · v4 프로필 docs/full) · scripts/figma-lint.js (즉시 검증) · scripts/figma-token-docs.js (토큰 문서)
- 스냅샷 전담 에이전트: .claude/agents/snapshot-runner.md (figma-builder 가 STAGE 를 끝낼 때마다 코디네이터가 백그라운드로 띄운다)
- 기본 토큰: scripts/default-tokens.md
