# design-flow-harness

> 디자이너가 AI와 일관되게 일하기 위한 4단계 파이프라인

**Claude Code 전용** (`CLAUDE.md`, `.claude/agents`, `.claude/skills`).

레퍼런스 수집부터 Figma 화면 생성까지, 매 단계 게이트를 통과하며 진행합니다.
자연어로도, 슬래시 명령으로도 동작합니다.

## 🎯 무엇을 하나

**입력:** PRD (Product Requirements Document)
**출력:** 규칙에 맞게 완성된 Figma 화면

```
PRD → 레퍼런스 → 화면 구조 → 디자인 규칙 → Figma 화면
```

## 🚀 빠른 시작

### 1. 사전 준비

**필수 MCP:**

- Claude Code에서 다음 MCP 설치·인증
  - **uibowl MCP** (레퍼런스 수집)
  - **Figma MCP** (화면 생성)

**Node.js:** 18.0.0 이상

**Figma:** 파일은 **사용자가 직접 만든다.** (에이전트는 새 파일을 만들지 않는다)

1. Figma에서 빈 디자인 파일 생성
2. URL에서 파일 키 복사
   ```
   https://www.figma.com/design/AbCdEf123456/내파일
                                ^^^^^^^^^^^^ 이 부분이 파일 키
   ```
3. `design/04-screens/figma-file-key.txt` 에 저장 (키만, 한 줄)

키가 없으면 figma-builder는 시작하지 않고 키를 요청한다.

### 2. 프로젝트 세팅

```bash
# 프로젝트 폴더로 이동
cd design-flow-harness

# 확인
npm run check
```

### 3. 파이프라인 시작

**자연어로:**

```
"이 PRD로 앱 디자인 시작할래. 레퍼런스부터 뽑아줘"
```

**슬래시 명령으로:**

```
/collect-references ./PRD.md
```

### 4. 예시 프로젝트: 허들링 앱

이 하네스에는 예시 PRD로 **허들링 앱** (AI 실무 학습 플랫폼 + 자산 마켓) 이 포함되어 있습니다.

- `PRD.md` — 허들링 앱 요구사항
- 시연 범위: 5개 화면 (홈, 스킬 라이브러리, 미션 상세, 내 자산, 허들링 픽)
- 대상 유저: 유료 멤버

## 📁 폴더 구조

```
design-flow-harness/
├── CLAUDE.md                  ← 하네스 헌법 (원칙, 워크플로)
├── package.json               ← 스크립트 명령
├── README.md                  ← 이 파일
│
├── .claude/
│   ├── agents/                ← 에이전트 7개
│   │   ├── reference-collector.md
│   │   ├── reference-analyzer.md
│   │   ├── structure-builder.md
│   │   ├── design-rules-generator.md
│   │   ├── figma-builder.md
│   │   ├── snapshot-runner.md     (백그라운드 · 스냅샷 추출 전담 · 슬래시 없음)
│   │   └── design-auditor.md
│   │
│   └── skills/                ← 슬래시 명령 6개
│       ├── collect-references/SKILL.md
│       ├── analyze-references/SKILL.md
│       ├── build-structure/SKILL.md
│       ├── generate-rules/SKILL.md
│       ├── create-figma/SKILL.md
│       └── audit-design/SKILL.md
│
├── scripts/                   ← 검증 코드
│   ├── default-tokens.md      (기본 토큰 세트)
│   ├── lib/                   (공통 유틸 · cli.mjs / layout-rules.mjs)
│   ├── check-phase.mjs        (통합 게이트 체커)
│   ├── verify-design-rules.mjs (규칙 세부 검증)
│   ├── check-assets.mjs       (이미지 매니페스트 검증)
│   ├── merge-snapshot.mjs     (배치 추출 결과 병합)
│   ├── check-snapshot.mjs     (snapshot 스키마 검증)
│   ├── check-layout.mjs       (컨테이너 HUG · 넘침 검증)
│   ├── check-token-docs.mjs   (01 Tokens 문서 프레임 규격 검증)
│   ├── figma-audit.mjs        (게이트 4 구조 검증 9항목)
│   │
│   │   ── 아래 3개는 Figma 안에서 use_figma 로 실행 (Node 실행 X) ──
│   ├── figma-snapshot.js      (스냅샷 추출기 · v4 · profile docs/full)
│   ├── figma-lint.js          (생성 직후 즉시 위반 검사 · 스냅샷 없이)
│   └── figma-token-docs.js    (01 Tokens 문서 프레임 6종 렌더)
│
└── design/                    ← 산출물 (자동 생성)
    ├── 01-references/         (Phase 1)
    ├── 02-structure/          (Phase 2)
    ├── 03-design-rules/       (Phase 3)
    └── 04-screens/            (Phase 4)
```

## 🎭 4-Phase 파이프라인

### Phase 1 · 레퍼런스 수집 & 분석

```
/collect-references ./PRD.md
→ uibowl MCP로 경쟁사 스크린샷 수집
→ design/01-references/raw/ 에 저장

/analyze-references
→ Vision으로 스크린샷 분석
→ analysis.md 생성 (UX/시각/컴포넌트 패턴)
```

**게이트 1 통과 조건:**

- 스크린샷 3장 이상
- analysis.md 완성 (패턴 9개+)
- 사용자 승인

### Phase 2 · 화면 구조 정의

```
/build-structure
→ analysis.md + PRD로 화면 5개+ 정의
→ screens.md + flows.md 생성
```

**게이트 2 통과 조건:**

- 화면 5개 이상, screen-contract.json에 상태별 single/collection/none 주 행동 정책
- 레퍼런스 매칭 필수
- 사용자 검토·수정 후 승인

### Phase 3 · 디자인 규칙 확정 ⭐

```
/generate-rules
→ 대표 화면 2안 비교 + 선택 방향 + 미결정 값에 default-tokens.md
→ design-rules.md (SSOT) 생성 · primitive → semantic 2계층
→ HTML 프리뷰 확인
```

**게이트 3 통과 조건 (핵심!):**

- design-rules.md `status: confirmed`
- 4배수 규칙, semantic 이름
- 필수 섹션 (A-I) 완성
- **토큰 2계층** — A/B/D/G 각 섹션에 `### Primitive`(값) + `### Semantic`(`{primitive}` 참조)
- 사용자 승인 후 마킹

### Phase 4 · Figma 화면 생성 + 검증

```
/create-figma
→ STAGE=tokens → components → screens 순차
→ 이미지는 생성하지 않는다: design-rules §I 표가 가리키는 design/assets/characters/ 파일을 슬롯에 주입
→ 아이콘은 lucide 이름으로 CDN 에서 받는다 (손으로 그리지 않음)
→ 각 화면 완성 즉시 스크린샷 전달 (이미지까지 채워진 완성본)

/audit-design
→ figma-audit.mjs 자동 실행
→ 규칙 준수 검증
→ 실패 시 fix-list.md 생성
```

**게이트 4 통과 조건:**

- 5개 화면 완성
- 미바인딩 0개, 4배수 위반 0개
- **primitive 직접 바인딩 0개** (화면은 semantic 변수만 사용)
- **이미지 슬롯 빈 곳 0개** (`Img/*` 노드가 전부 IMAGE fill)
- **레이아웃 거동 0건** (오토레이아웃 컨테이너 세로 HUG · 콘텐츠 넘침 없음 — `check:layout`)
- **토큰 문서 규격 PASS** (`check:token-docs`)
- audit PASS (9개 항목) — 결과가 **현재 스냅샷을 읽은 것**이어야 한다 (snapshot/rules/contract SHA-256 일치)
- 동일 capture_id의 세 페이지·필수 상태 PNG·최신 visual-review.json PASS
- 사용자 완료 승인

## UI 품질 보완 워크플로

기존 Claude Code 에이전트 7개와 슬래시 명령 6개를 그대로 사용합니다.
대표 화면의 디자인 방향을 먼저 비교하고, 실제 이미지·긴 문구·필수 상태로 시안을 검토합니다.
주 행동은 제출형(single), 탐색형(collection), 행동 없는 상태(none)를 구분합니다.
시각 검수는 위계·가독성·밀도·이미지 적합성·일관성에 화면별 근거를 남깁니다.

```bash
npm run check:contract   # 구조 담당: 화면/상태/행동 계약
npm run capture:begin    # builder: 최종 Figma 수정 후 동결, capture_id 발급
# runner: 동일 ID로 3페이지 추출·직렬 병합; builder: 필수 PNG 전부 재출력
npm run capture:seal     # 코디네이터: 입력/출력 해시 봉인, 시각 검수 초안 생성
npm run audit            # auditor: 구조 검사
# auditor: 승인 시안과 PNG를 직접 비교해 visual-review.json 작성
npm run check:evidence   # 최신 캡처·상태·시각 검수 증거
npm run check:screens    # 최종 게이트
```

- [UI 품질 기준·화면 계약 예시](docs/ui-quality.md)
- [캡처 순서·소유권·기존 프로젝트 업그레이드](docs/capture-protocol.md)

기존 예제 산출물은 새 기준으로 자동 승인하지 않습니다. 계약·디자인 방향 기록·캡처 증거가
없으면 게이트가 실패하며, 위 업그레이드 절차로 보완합니다. 독립 검증기의 구형 fixture 호환은 유지합니다.

## 🛠️ 검증 명령어

```bash
# 전체 게이트 확인
npm run check

# 개별 게이트
npm run check:references
npm run check:structure
npm run check:rules
npm run check:screens

# snapshot 배치 병합 (응답이 잘려 나눠 뽑았을 때만)
npm run merge:snapshot -- batch-1.json batch-2.json batch-3.json

# snapshot 스키마 검증 (audit 전 필수)
npm run check:snapshot
npm run check:snapshot:tokens

# 이미지 매니페스트 검증 (screens STAGE 전 필수)
npm run check:assets

# 레이아웃 거동 (컨테이너 HUG · 넘침 · 고정 높이 선언 대조)
npm run check:layout
npm run check:layout -- --page "02 Components"

# 01 Tokens 문서 프레임 규격 (docs/token-docs-spec.md)
npm run check:token-docs

# design-rules 상세 검증
npm run verify
npm run verify:strict  # 경고도 실패 처리

# Figma 파일 검증
npm run audit
npm run audit:json  # JSON 출력

# 검증 스크립트 자체의 회귀 테스트 (scripts/*.mjs 를 고쳤으면 반드시)
# 실제 추출물 정답지(tests/fixtures/)로 PASS·FAIL 앵커 + 결함 주입 변이 + figma-lint 미러 동기화 확인
npm test
```

## 📚 문서

- **CLAUDE.md** — 하네스 원칙 및 워크플로 (헌법)
- **docs/harness-principles.md** — 하네스 설계 원칙
- **docs/token-docs-spec.md** — 01 Tokens 문서 프레임 규격
- **scripts/default-tokens.md** — 기본 토큰 세트
- **.claude/agents/\*.md** — 각 에이전트 상세 (snapshot-runner 포함 7개)

## ⚙️ 커스터마이징

### 브랜드 컬러 변경

`/generate-rules` 실행 시 사용자에게 브랜드 컬러 물어봄.
직접 hex 입력 가능.

### 기본 토큰 변경

`scripts/default-tokens.md` 수정하면 다음 프로젝트부터 반영.

### MCP 도구명 변경

프로젝트에서 다른 MCP 접두사 쓰면:

- `.claude/agents/*.md` 파일의 `tools:` 필드 수정
- 예: `mcp__figma__*` → `mcp__figma-remote-mcp__*`

## 🚨 트러블슈팅

**"게이트 통과 안 됨"**

```bash
npm run check
# 실패한 조건 확인 → 해당 Phase 에이전트 재실행
```

**"figma-builder가 시작 안 됨"**

- design-rules.md 상단 `status: confirmed` 확인
- Phase 3 (`/generate-rules`) 다시 실행

**"MCP 인증 오류"**

```
/mcp
# uibowl, Figma 각각 인증 상태 확인
```

**"figma-snapshot.json 없음 / 스키마 오류"**

```bash
npm run check:snapshot   # 어떤 항목이 깨졌는지 확인
```

- snapshot은 `scripts/figma-snapshot.js` 로만 추출한다 (직접 작성 금지)
- figma-builder가 STAGE 완료 시 use_figma 반환값을 Write
- `isPrimary`/`isTapTarget`이 0개면 Figma 노드 **이름 규칙**이 어긋난 것.
  JSON을 고치지 말고 Figma를 고친 뒤 재추출

**"컨테이너가 내부 콘텐츠를 감싸지 못함 / 텍스트가 카드 밖으로 넘침"**

```bash
npm run check:layout     # 어느 노드인지 먼저 확인
```

- 원인 대부분은 오토레이아웃 프레임에 `resize(w, h)` 를 불러 sizing 이 FIXED 로 풀린 것
- 의도적 고정이면 design-rules.md 컴포넌트 항목에 `- Height: fixed(토큰)` 을 선언한다
- `schema_version 2` 경고 → 스냅샷을 v4 로 재추출 / `profile=docs` 경고 → 컴포넌트·화면 페이지를 full 로 재요청

**"STAGE 가 예산보다 오래 걸림 / 스냅샷을 계속 다시 뽑음"**

- 원인 대부분은 스냅샷으로 검증 → 고치고 → 다시 뽑는 루프 (한 번에 1분+)
- 생성 직후 `scripts/figma-lint.js` 를 use_figma 로 돌려 위반만 받아 고친다 (수 초)
- 스냅샷은 lint 0건 이후 STAGE 당 1회 **요청**만 남기고 다음 STAGE 로 간다. 추출은 snapshot-runner 가 한다
- 01 Tokens 는 `__PROFILE__=docs` 로 프레임당 1배치면 끝난다 — 이 페이지를 full 로 뽑고 있으면 그게 원인

## 📖 원칙 (CLAUDE.md 요약)

1. **레퍼런스 없이 시작하지 않는다** — Phase 1 필수
2. **규칙이 확정되지 않으면 Figma에 손대지 않는다** — status: confirmed 강제
   (규칙 안의 토큰은 primitive → semantic 2계층)
3. **각 단계 게이트를 통과해야 다음으로** — 4개 게이트
4. **기본값이 항상 있다** — default-tokens.md
5. **산출물이 곧 상태다** — design/ 폴더가 진행 상태
6. **자연어로도, 명령어로도 동작한다** — 하이브리드

## 🎓 강의 자료

이 하네스는 **"AI 시대 디자이너가 일하는 방식은 바뀌어야 합니다"** 강의용으로 설계됨.

강의 구성:

- Part 1 · 하네스 설계 사고법 (40분)
- Part 2 · 실전 시연 (70분)
- Part 3 · 마무리 (10분)

## 📝 라이선스

MIT
