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
화면에 들어갈 이미지의 톤·비율·슬롯도 §I 에 적는다. 거기 없는 이미지는 만들지 않는다.

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
           (tokens → components → assets → screens)
```

각 게이트 통과 없이는 다음 Phase 진입 불가.

---

## 에이전트 라우팅

| 요청 유형     | 자연어 예시                      | 에이전트               | 슬래시 명령         |
| ------------- | -------------------------------- | ---------------------- | ------------------- |
| 레퍼런스 수집 | "레퍼런스 뽑아줘", "경쟁사 분석" | reference-collector    | /collect-references |
| 레퍼런스 분석 | "분석해줘", "패턴 뽑아줘"        | reference-analyzer     | /analyze-references |
| 화면 구조     | "화면 구조 짜줘", "화면 목록"    | structure-builder      | /build-structure    |
| 디자인 규칙   | "규칙 만들어줘", "디자인 시스템" | design-rules-generator | /generate-rules     |
| Figma 생성    | "Figma 화면 만들어줘"            | figma-builder          | /create-figma       |
| 화면 이미지   | "이미지 채워줘", "이미지 만들어줘" | figma-builder (assets) | /create-figma STAGE=assets |
| 최종 검증     | "검증해줘", "audit"              | design-auditor         | /audit-design       |

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
└── 04-screens/            ← Phase 4
    ├── figma-file-key.txt      (사용자가 만든 Figma 파일 키)
    ├── figma-snapshot.json     (audit 입력 · figma-snapshot.js 로만 추출)
    ├── build-log.md
    ├── assets/                 (STAGE=assets · higgsfield 이미지)
    │   ├── assets-plan.md          (슬롯별 프롬프트)
    │   ├── assets-manifest.json    (슬롯 계약 · check-assets.mjs 가 검증)
    │   └── img/                    (생성된 원본 이미지)
    ├── audit-report.md
    ├── audit-structural.json   (figma-audit.mjs 출력)
    ├── fix-list.md             (audit FAIL 시만 생성)
    └── screenshots/            (이미지까지 채워진 완성본)
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
- **snapshot 은 scripts/figma-snapshot.js 로만 추출한다** (추출 코드 즉흥 작성 금지)
- **화면 이미지는 assets-manifest.json 에 있는 것만 쓴다** (즉석 생성·외부 이미지 금지)
- **이미지 슬롯을 빈 채로 두고 Phase 4 를 끝내지 않는다** (게이트 4에서 FAIL)
- **각 에이전트는 자기 담당 폴더 외 편집 금지**
- **사용자 승인 없이 다음 Phase로 자동 진행 금지**

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

- `npm run check:assets` 로 매니페스트부터 확인
- 슬롯 레이어 이름이 `Img/{key}` 인지 확인 (이름이 곧 주입 주소)
- `/create-figma STAGE=assets` 로 이미지를 먼저 확보한 뒤 화면을 다시 만든다

**"figma-builder가 시작 안 됨"**

- design-rules.md 상단 status 확인 (confirmed 여야 함)
- Phase 3 다시 확인

**"MCP 인증 오류"**

- /mcp 명령으로 상태 확인
- uibowl, Figma 각각 인증

---

## 상세 문서

- 하네스 설계 원칙: docs/harness-principles.md (별도)
- 각 에이전트 상세: .claude/agents/*.md
- 검증 스크립트: scripts/*.mjs
- 기본 토큰: scripts/default-tokens.md
