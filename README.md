# design-flow-harness

> 디자이너가 AI와 일관되게 일하기 위한 4단계 파이프라인

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
│   ├── agents/                ← 에이전트 6개
│   │   ├── reference-collector.md
│   │   ├── reference-analyzer.md
│   │   ├── structure-builder.md
│   │   ├── design-rules-generator.md
│   │   ├── figma-builder.md
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
│   ├── check-phase.mjs        (통합 게이트 체커)
│   ├── verify-design-rules.mjs (규칙 세부 검증)
│   ├── figma-snapshot.js      (Figma 추출기 · use_figma 주입용, Node 실행 X)
│   ├── merge-snapshot.mjs     (배치 추출 결과 병합)
│   ├── check-snapshot.mjs     (snapshot 스키마 검증)
│   ├── figma-audit.mjs        (Figma 파일 검증)
│   └── check-assets.mjs       (이미지 매니페스트 검증)
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

- 화면 5개 이상, 각 primary 1개
- 레퍼런스 매칭 필수
- 사용자 검토·수정 후 승인

### Phase 3 · 디자인 규칙 확정 ⭐

```
/generate-rules
→ default-tokens.md + 브랜드 컬러
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
- audit PASS (8개 항목) + 사용자 완료 승인

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

# design-rules 상세 검증
npm run verify
npm run verify:strict  # 경고도 실패 처리

# Figma 파일 검증
npm run audit
npm run audit:json  # JSON 출력
```

## 📚 문서

- **CLAUDE.md** — 하네스 원칙 및 워크플로 (헌법)
- **scripts/default-tokens.md** — 기본 토큰 세트
- **.claude/agents/\*.md** — 각 에이전트 상세

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
