# Build Log

## Metadata

- figma_file: 9mSXSf3cI36nDWiyolGXja
- figma_file_url: https://www.figma.com/design/9mSXSf3cI36nDWiyolGXja/
- design_rules_version: 1.1
- start_date: 2026-09-18
- design_rules_confirmed_at: 2026-09-18

## STAGE=tokens ✅ (스냅샷은 아래 "### snapshot · 01 Tokens ✅" 에서 완료 — 당시 ⚠️ 부분 완료 기록은 이력으로 남김)

완료: 2026-09-18 14:05 (자원 생성) / 진행 중 14:20 (snapshot 배치 추출)

### 페이지 구조

- 기존 "Page 1" → "01 Tokens" 로 이름 변경
- "02 Components", "03 Screens" 신규 생성
- 최종: ["01 Tokens", "02 Components", "03 Screens"]

### 변수 생성 (Figma Variables — 2계층: primitives → semantic)

**primitives 컬렉션** (38개, design-rules.md §A/B/D/G Primitive 표 그대로)

- COLOR (15): brand-500, brand-600, brand-50, neutral-0/50/100/200/400/500/900,
  red-600, green-600, amber-500, overlay-black-50, sky-100
- FLOAT (23): space-1/2/3/4/5/6/8/12, radius-4/8/12/16/full,
  size-34/36/44/47/49/52/56, icon-16/20/24

**semantic 컬렉션** (39개, 전부 `createVariableAlias` 로 primitives 참조 — 값 직결 0개)

- COLOR (16): color-bg→neutral-0, color-surface-1→neutral-50, color-surface-2→neutral-100,
  color-border→neutral-200, color-text→neutral-900, color-text-muted→neutral-500,
  color-text-disabled→neutral-400, color-text-inverse→neutral-0, color-primary→brand-500,
  color-primary-pressed→brand-600, color-primary-soft→brand-50, color-danger→red-600,
  color-success→green-600, color-warning→amber-500, color-overlay→overlay-black-50,
  color-image-slot-bg→sky-100
- FLOAT (23): space-screen-padding/section/card-padding/list-gap/inline/tap-gap-min,
  radius-tag/button/card/sheet/pill, safe-area-top/top-notch/bottom, size-tap-min,
  size-button-sm/md/lg, app-bar-height, tab-bar-height, icon-sm/md/lg
- missingPrimitiveTargets: 0개 (전부 정상 alias 연결)

**의도적으로 만들지 않은 것:** `device-frame` (390×844) — 단일 스칼라가 아닌 W×H 쌍이라
Figma Variable 로 만들지 않음. figma-audit.mjs/verify-design-rules.mjs 도 이 토큰을
design-rules.md 텍스트에서 직접 읽지 Figma 변수로 기대하지 않음 (CONSTANT_TOKENS 처리 확인).

### 텍스트 스타일 (8개, design-rules.md §C role 그대로)

Text/display(28/Bold), Text/h1(24/SemiBold), Text/h2(20/SemiBold), Text/h3(17/SemiBold),
Text/body(15/Regular), Text/body-sm(14/Regular), Text/caption(12/Regular), Text/label(13/Medium)
— font family: Pretendard (로드 성공, Inter 대체 불필요)

### 이펙트 스타일 (3개, design-rules.md §E 그대로)

Shadow/sm (y1·blur2·6%), Shadow/md (y4·blur12·8%), Shadow/lg (y8·blur24·12%)

### 토큰 문서 (scripts/figma-token-docs.js 그대로 사용, 즉흥 작성 없음)

01 Tokens 페이지에 6개 프레임 생성, 전부 스크린샷으로 육안 검증 완료:

- `Token Documentation — Color Primitives` (node 19:15, 15 카드, 1280×2235)
- `Token Documentation — Color Semantic` (node 19:132, 16 카드, 1280×2866) — 모든 alias 화살표(`→ neutral-0` 등) 정상 표시
- `Token Documentation — Scale Primitives` (node 19:269, 23 카드, 1280×1604)
- `Token Documentation — Scale Semantic` (node 19:411, 23 카드, 1280×2235) — 모든 alias + 값 정상 표시
- `Token Documentation — Typography` (node 19:568, 8 카드, 1280×2083) — 폰트 샘플·role·size/weight 정상
- `Token Documentation — Shadow` (node 19:650, 3 카드, 1280×1039) — 그림자 렌더 정상

레거시 `Token Swatch` 프레임 없음 (removed_frames: 0, 최초 실행이라 지울 것 없었음).

### ⚠️ 진행 중 (체크포인트): figma-snapshot.json 노드 단위 배치 추출

**코디네이터 지시(옵션 1)에 따라 노드 단위 배치 추출로 전환.** 추가 15분 예산 소진 시점에
아래 체크포인트를 남기고 멈춤. 배치 파일은 `design/04-screens/snapshot-batches/tokens-fNN-bNN.json`.

**청크 크기 재조정 경위:** 30개/배치로 시작 → 노드 내용이 짧은 프레임(Color Primitives)은
30개가 들어갔지만, 텍스트가 긴 프레임(Color Semantic 의 안내문 등)에서는 30개도 잘려
20개 이하로 줄여야 했다. 잘린 배치는 파일로 저장하지 않고 즉시 폐기 후 좁혀서 재추출했다
(잘린 JSON을 손으로 고치지 않음 — 원칙 준수).

**완료:**

| 프레임 (index)     | 총 노드 | 배치 파일                     | 커버리지            |
| ------------------ | ------- | ----------------------------- | ------------------- |
| 0 Color Primitives | 116     | tokens-f00-b01~b05.json (5개) | 0~116 완전          |
| 1 Color Semantic   | 136     | tokens-f01-b01~b02.json (2개) | 0~45 만 (91개 남음) |
| 2 Scale Primitives | 141     | 없음                          | 미착수              |
| 3 Scale Semantic   | 156     | 없음                          | 미착수              |
| 4 Typography       | 81      | 없음                          | 미착수              |
| 5 Shadow           | 36      | 없음                          | 미착수              |

**중요:** `merge-snapshot.mjs` 는 페이지 전체(`frame_range.total_frames`)가 커버되어야
파일을 쓴다 — 프레임 0만 완전해도 "01 Tokens" 페이지 전체가 안 끝나면 아무것도 병합되지
않는다(gap 검사가 페이지 단위). 그래서 **아직 figma-snapshot.json 자체는 생성되지 않았다.**
(`node scripts/merge-snapshot.mjs design/04-screens/snapshot-batches/tokens-f00-b0*.json --out ... --dry-run`
실행 시 "범위 누락: 1~6 가 빠졌다" 로 정상 거부됨 — merge 로직 자체는 올바르게 동작 확인.)

**남은 작업 견적:** 20노드/배치 기준으로 프레임 1 잔여(91) ~5배치, 프레임 2(141) ~7배치,
프레임 3(156) ~8배치, 프레임 4(81) ~4배치, 프레임 5(36) ~2배치 = **총 약 26배치 추가 필요**
(이미 완료한 7배치 포함 전체 약 33배치). 배치 1개당 use_figma 호출 1회 + 검증·저장 1회가 필요해
이 페이지 하나를 완전히 끝내는 데 상당히 긴 세션이 필요하다는 것이 실측으로 확인됨.

**재추출 시 유의:**

- 프레임 1(Color Semantic)처럼 안내문 텍스트가 긴 프레임은 20개도 빠듯할 수 있어
  필요시 15개로 더 좁힌다.
- 매 배치는 `use_figma` 응답을 받는 즉시 파이썬(`json.loads(raw)` 후 `json.dump`)으로
  저장하고 `python3 -c "import json; json.load(open('파일'))"` 로 유효성을 확인한 뒤
  다음 배치로 진행한다 (bash heredoc 직접 삽입은 특수문자 이스케이프 문제로 비권장).
- 응답이 `// truncated to Nkb` 로 끝나면 그 배치는 파일로 저장하지 말고 폐기,
  범위를 절반 이하로 좁혀 재시도한다.

**대신 확보한 것 (수동/시각 검증 — 배치 추출과 별개로 유효):**

- `get_screenshot` 으로 6개 문서 전부 확인 → design-rules.md 의 모든 값·별칭이
  정확히 일치 (예: `color-primary → brand-500`, `radius-pill → radius-full · 9999` 등)
- `use_figma` 로 컬렉션·스타일 개수를 직접 조회해 구조적 정합성 확인
  (primitives 38개, semantic 39개, missingPrimitiveTargets: 0, textStyles 8개, effectStyles 3개)

### 다음 단계

이어서 진행할 경우: `design/04-screens/snapshot-batches/` 의 기존 배치 파일을 재사용하고
프레임 1의 45번 노드부터, 프레임 2~5는 처음부터 20노드 단위로 이어서 추출 →

```
node scripts/merge-snapshot.mjs design/04-screens/snapshot-batches/tokens-*.json \
  --out design/04-screens/figma-snapshot.json
npm run check:snapshot
npm run check:token-docs
```

figma_read_calls: 약 21회 (get_metadata 1 · get_screenshot 6 · use_figma 14: 컬렉션/스타일
생성 4 + 토큰문서 1 + 노드개수조회 1 + 스냅샷 배치 7 + 잘려서 폐기한 배치 1)
next: 이 체크포인트에서 재개 (프레임 0 완료 · 프레임 1 45/136 · 프레임 2~5 미착수) —
STAGE=components 진행은 이 페이지의 figma-snapshot.json 완성 및 check-snapshot/
check-token-docs PASS 후로 보류

### snapshot · 01 Tokens ✅

- profile: docs · 배치 8개 (프레임 6 · 프레임 0/3 은 노드 2청크) · 노드 666개 (116/136/141/156/81/36)
- 추출: scripts/figma-snapshot.js v4 치환만 (FRAME_FROM/TO, NODE_FROM/TO) · Figma 수정 없음
- 잘림: 첫 회차에서 프레임 0(변수 포함)·프레임 3(156노드) 20kb 초과 → 폐기 후 NODE 0~58/58~ · 0~78/78~ 로 재추출 (모두 완결)
- 병합: merge-snapshot.mjs → 프레임 6/6 · 구멍·중복 없음 → design/04-screens/figma-snapshot.json
- check-snapshot --stage tokens: PASS (20/20 · primitives 38 · semantic 39 전부 alias · textStyles 8 · effectStyles 3)
- check-token-docs: PASS (32/32 · 6 프레임 모두 폭 1280 · 카드 수 = 토큰 수 · 카드 214×136 · Swatch 190)
- 재추출 필요: 없음

## STAGE=components ✅ (Icon 라이브러리 1건 ❌ — 아래 참고)

완료: 2026-09-18 15:10

### 생성 컴포넌트 (18개, "02 Components" 페이지)

Button(컴포넌트 세트: Variant 4 × Size 3 × State 4 = 48 variants), Card, ItemRow,
Badge(컴포넌트 세트: 8 variants — corner-status/category/difficulty/free/paid/approved/pending/rejected),
ProgressBar(컴포넌트 세트: fill/compare 2 variants), SearchBar, Tab(컴포넌트 세트: active/inactive 2 variants),
SkillCard, AssetCard(Img/asset-thumb 슬롯), PickCard(Img/pick-thumb 슬롯), TabBar, AppBar, Modal,
SectionHeader, BottomCTA(Button primary/lg 인스턴스 내장), EmptyState, LoadingSpinner(순수 도형 원호,
lucide 아님), DeviceFrame(390×844, StatusBar/HomeIndicator 자리 표시)

모든 색상·간격·radius·크기 바인딩은 **semantic 컬렉션 변수만** 사용 (primitive 직접 바인딩 0개).
텍스트는 전부 Text/* 스타일 적용, textAutoResize HEIGHT 또는 WIDTH_AND_HEIGHT.
자리표시 문구 없음 — 전부 실제 문구 사용 (예: "제출하기", "AI 챗봇 프롬프트 템플릿").

### ❌ 건너뛴 것: Icon 컴포넌트 (design-rules.md 14개 lucide 아이콘)

**원인 (검증됨, 가정 아님):** design-rules.md·components.md 가 지정한 `lucide-static@0.475.0` 은
npm 레지스트리에 존재하지 않는 버전이다. 직접 확인:

- `https://registry.npmjs.org/lucide-static` 의 `versions` 목록에 `0.475.0` 없음
- jsdelivr data API 도 동일하게 404 (`Couldn't find version 0.475.0`)
- 인접 버전(`0.473.0`, `0.477.0` 등)은 존재 — 아마도 오탈자/버전 지정 오류로 추정되나 확인 없이 임의로
  바꿔 받지 않음 (`figma-builder.md`: "네트워크 오류 → ... 버전을 바꿔서 받지 않는다" 원칙 적용)

**질문 (design-rules-generator 또는 사용자 확인 필요):** `lucide-static` 버전을 몇으로 고정할지
확정해달라 (예: `0.477.0` 또는 최신 안정 버전). 확정되면 Icon 컴포넌트(14개 아이콘 × 3 사이즈)와
이를 사용하는 컴포넌트들의 아이콘 슬롯을 채운다.

**영향받은 컴포넌트 (아이콘 없이 라벨/구조만으로 구성 — 명시적 생략, 더미 아님):**

- SearchBar: search 아이콘 생략 (placeholder 텍스트만)
- TabBar: home/book-open/archive/star 아이콘 생략 (라벨만)
- AppBar: chevron-left 뒤로가기 아이콘 생략 (빈 아이콘 크기 슬롯 프레임만 배치, 시각적으로 비어있음)
- Modal: sparkles 아이콘 생략
- EmptyState: 아이콘 생략 (빈 icon-lg 크기 슬롯 프레임만)
- Button: 아이콘 슬롯(boolean, 좌/우) 자체를 생성하지 않음 (라벨 전용 variant만 구성)

Icon 버전이 확정되면 이 컴포넌트들에 아이콘만 추가하면 되므로 구조 변경은 불필요.

### figma-lint 결과

`__PAGE_NAME__="02 Components"`, `__FIXED_ALLOW__="Button,ProgressBar,SearchBar,Tab,TabBar,AppBar,BottomCTA,LoadingSpinner,DeviceFrame,Icon"`
(design-rules.md "- Height: fixed(...)" 선언 컴포넌트 그대로)

- 1차 실행: 3건 (no-auto-layout: Badge 세트 1 · content-overflow: ProgressBar Marker 1, BottomCTA Button 1)
- 2차 수정 후 재실행: 1건 (content-overflow: ProgressBar Marker, Track 높이가 space-1/space-3 **primitive**
  이름으로 바인딩 시도되어 조용히 무시된 것이 원인 — semantic 별칭(space-inline={space-1}, space-list-gap={space-3},
  space-tap-gap-min={space-2}, space-section={space-6})으로 재바인딩)
- 3차 수정(마커를 Track 밖으로 이동, absolute 포지셔닝) 후 재실행: **0건, passed: true**

같은 라운드에서 발견한 근본 원인: Button/Badge/SkillCard/AssetCard/PickCard/TabBar/Modal/EmptyState 등에서
components.md 표기(`space-3`, `space-2` 등 primitive 이름)를 그대로 시맨틱 바인딩 이름으로 오인해 사용한 것.
전부 값이 동일한 semantic 별칭으로 교체 완료 (수치 변경 없음, 참조만 semantic 화).

### 스냅샷

snapshot: requested (page=02 Components · profile=full · stage=components)

figma_read_calls: 약 20회 (get_metadata 1 · use_figma 15(생성 9 + 수정 3 + lint 3) · get_screenshot 3)
next: STAGE=screens (사용자 확인 필요) — 단, Icon 버전 확정 전까지 screens 의 아이콘 사용 컴포넌트도
동일하게 아이콘 생략 상태로 진행하거나, 확정 후 진행할지 사용자 선택 필요

### snapshot · 02 Components ❌

- profile: full · 배치 6개 (components-f00-b01/b02/b03, f01-b01, f07-b01, f12-b01) · 노드 180개 · 프레임 18/18 (구멍·중복 없음)
- check-snapshot --stage components: PASS (18/18 · 변수 primitives 38 / semantic 39 전부 alias 정상)
- check-layout --page "02 Components": FAIL — 고정 높이 컨테이너 50건
  - [Button] 48개 variant 전부 (Variant=primary/secondary/ghost/danger × Size=sm/md/lg × State=default/pressed/disabled/loading): 오토레이아웃(HORIZONTAL) 컨테이너인데 layoutSizingVertical=FIXED (height 36/44/52). HUG 여야 함
  - 나머지 2건은 check-layout 출력이 "… 외 38건"으로 생략함. 스냅샷을 직접 스캔한 보조 확인 결과 [Tab] State=active/inactive (height 36, VERTICAL 오토레이아웃 vSizing=FIXED)도 동일 패턴으로 잡힘 — 정확한 전체 목록은 check-layout.mjs 재실행 시 출력 참고
  - 재추출 불필요 — Button/Tab 컴포넌트의 오토레이아웃 세로 sizing을 HUG로 고친 뒤 같은 프레임만 재요청하면 됨 (범위: 프레임 0 Button, 프레임 6 Tab)

### snapshot · 02 Components ✅ (정정)

- 위 ❌ 50건은 check-layout 의 오탐이었다: 컴포넌트 세트 안 variant 노드("Variant=primary, Size=sm, …")에서
  컴포넌트명을 못 뽑아 design-rules 의 `### Button` / `### Tab` → `Height: fixed` 선언과 매칭하지 못함.
- scripts/check-layout.mjs 수정 — 세트 직속 variant 는 세트(프레임) 이름으로 선언을 찾는다.
- 재검사: check-snapshot --stage components PASS (18/18) · check-layout --page "02 Components" PASS (0건). Figma 수정 없음, 재추출 없음.

## STAGE=components ✅ (Icon 보완 완료)

완료: 2026-09-18 15:30

### Icon 라이브러리 생성 (lucide-static@1.47.0 CDN 고정)

14개 아이콘 × Size(sm=16/md=20/lg=24) = 42 variants, 컴포넌트 세트 14개
(`Icon/home`, `Icon/book-open`, `Icon/target`, `Icon/archive`, `Icon/star`, `Icon/search`,
`Icon/chevron-right`, `Icon/chevron-left`, `Icon/bell`, `Icon/sparkles`, `Icon/lock`,
`Icon/circle-check`, `Icon/filter`, `Icon/arrow-up-down`).

- 절차: CDN 에서 SVG 14개 curl 다운로드(전부 200) → `figma.createNodeFromSvg` → `rescale()` 로
  16/20/24 사이즈 생성 → stroke weight 1.5/1.75/2 명시 → `figma.createComponentFromNode` 로
  FRAME → COMPONENT 변환 → `figma.combineAsVariants` 로 세트화
- 색: 전부 stroke 를 semantic `color-text` 에 기본 바인딩(`setBoundVariableForPaint`), 사용처에서
  인스턴스 오버라이드(`color-primary` / `color-text-muted` / `color-text-disabled`)
- 위치: "02 Components" 페이지 y=2200 행에 별도 배치 (기존 18개와 겹치지 않음)
- 손으로 그린 아이콘 없음. lucide 1.47.0 원본 path 그대로 사용

### 아이콘 채운 컴포넌트 (6개)

| 컴포넌트   | 처리                                                                                                                                                                                                     | 비고                                                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SearchBar  | `Icon/search` Size=md 삽입, itemSpacing→`space-inline` 바인딩, 색 `color-text-muted`                                                                                                                     |                                                                                                                                                                         |
| TabBar     | 4개 TabItem 각각 `Icon/home,book-open,archive,star` Size=lg 삽입, itemSpacing→`space-inline`                                                                                                             | 홈 탭은 라벨이 이미 `color-primary`(active) 상태였어서 아이콘도 `color-primary` 로 맞춤(스크린샷 확인 후 수정), 나머지 3개는 `color-text-muted`                         |
| AppBar     | BackSlot: `Icon/chevron-left` Size=md 삽입, layoutMode HORIZONTAL+CENTER, sizing HUG(내용과 정확히 20×20 일치라 시각 크기 그대로)                                                                        |                                                                                                                                                                         |
| Modal      | `Icon/sparkles` Size=lg 삽입(첫 자식), 색 `color-primary`                                                                                                                                                |                                                                                                                                                                         |
| EmptyState | IconSlot: `Icon/archive` Size=lg 삽입, layoutMode HORIZONTAL+CENTER, sizing HUG(24×24 그대로), 색 `color-text-disabled`                                                                                  | 구체 아이콘명이 design-rules 에 없어 "등록된 자산 없음" 등 일반 용도에 맞는 `archive` 로 가정. 화면별로 다른 문맥이 필요하면 각 화면에서 인스턴스 스왑으로 교체         |
| Button     | 컴포넌트 세트에 BOOLEAN `Icon`(default false) + INSTANCE_SWAP `Icon Instance`(default `Icon/circle-check`) 프로퍼티 추가, 48 variant 전부에 아이콘 인스턴스 삽입(기본 숨김) + itemSpacing→`space-inline` | 좌측 슬롯만 구현(components.md "좌/우" 중 좌 고정). 우측 슬롯은 5개 화면 범위에 실사용 사례가 없어 보류 — 필요 시 다음 라운드에서 두 번째 INSTANCE_SWAP 프로퍼티로 확장 |

### 발견·수정한 부수 결함 (lint 1차)

- `AppBar/BackSlot`, `EmptyState/IconSlot` 이 오토레이아웃 + FIXED 세로(20/24)로 `fixed-height` 위반
  (두 노드 모두 `Icon/` 이름 패턴이 아니라 하네스 기본 면제 대상이 아니었음). `primaryAxisSizingMode`/
  `counterAxisSizingMode` 를 AUTO(HUG) 로 변경 — 자식이 정확히 20×20 / 24×24 라 시각적 크기 변화 없음.

### figma-lint 결과

`__PAGE_NAME__="02 Components"`, `__FIXED_ALLOW__="Button,ProgressBar,SearchBar,Tab,TabBar,AppBar,BottomCTA,LoadingSpinner,DeviceFrame,Icon"`

- 1차: 2건 (fixed-height: AppBar/BackSlot, EmptyState/IconSlot)
- 수정 후 2차: **0건, passed: true** (32개 프레임 · 418 노드 스캔)

### 스크린샷 확인 (내부용)

TabBar / SearchBar / AppBar get_screenshot 로 아이콘 렌더링 확인. 홈 탭 아이콘-라벨 색 불일치
1건 발견 → `color-primary` 로 수정 후 재확인 완료.

### snapshot

snapshot: re-requested (page=02 Components · profile=full · stage=components · 범위: 전체 재추출 필요)

- total_frames 변경: 18 → **32** (Icon 컴포넌트 세트 14개 신규 추가) → 프레임 인덱스가 전부 밀렸으므로
  이전 배치 범위 재사용 불가, 페이지 전체 재추출 필요
- 변경된 프레임(신규/수정): Icon/home, Icon/book-open, Icon/target, Icon/archive, Icon/star,
  Icon/search, Icon/chevron-right, Icon/chevron-left, Icon/bell, Icon/sparkles, Icon/lock,
  Icon/circle-check, Icon/filter, Icon/arrow-up-down (신규 14개) · SearchBar, TabBar, AppBar,
  Modal, EmptyState, Button (아이콘 삽입으로 구조 변경 6개)

figma_read_calls: 약 12회 (get_metadata 2 · use_figma 8(생성/수정/lint) · get_screenshot 4)
next: STAGE=screens (사용자 승인 완료 — 코디네이터가 시작)

## screen: 01-home ✅

완료: 2026-09-18 15:42
컴포넌트 사용: Card(미션), SectionHeader×4, ItemRow×4, Badge(approved), Icon/bell×2, TabBar(active=홈, 기본값)
이미지 슬롯: ItemRow "Thumb" 노드 4개에 주입 완료 (레이어 자체 이름은 "Thumb" — 02 Components 의 ItemRow
마스터가 `Img/` 접두사로 명명되어 있지 않음. 이름 규칙 갭이지만 인젝션은 node_id 로 했으므로 정상 동작.
02 Components 는 수정하지 않았음 — 이 사실만 기록)
placements:

- 01-home-recent-material-1: I71:95;36:121 · character-asset-1.png · imageHash b9ef0b44139772083a7287f47022218e59a7e1cf
- 01-home-recent-material-2: I71:100;36:121 · character-asset-2.png · imageHash 4de72c7445dfc9098f24364ce0c7bac86e6401dc
- 01-home-recent-skill-1: I71:110;36:121 · character-asset-3.png · imageHash 89265cc3eb3a628fc808ed56d2e6d5d21ec6ee3b
- 01-home-recent-skill-2: I71:115;36:121 · character-asset-4.png · imageHash d17af1c4fd8e0837a277712e70821f4cc143710c
  상태: default 만 생성 (loading/empty 생략 — 시간 예산 우선순위: 5개 화면 default 콘텐츠 완성 우선)
  figma-lint: 1차 3건(unbound-paint, 자유생성 텍스트 fill 미바인딩) → color-text-muted 바인딩 후 2차 0건
  발견한 버그(재사용 지식): 오토레이아웃 프레임에 resize() 호출 후 layoutSizingHorizontal="FILL" 을 설정하면
  세로 sizing 이 FIXED 로 풀린다 (Section 높이가 10에서 안 늘어나는 현상으로 발견). 이후 모든 화면에서
  "resize() 호출 금지, append 후 FILL/AUTO 만 설정" 패턴으로 작업.
  스크린샷: design/04-screens/screenshots/01-home.png
  figma_read_calls: 약 9회 (get_metadata 다수 · use_figma 6 · get_screenshot 2 · upload_assets 1)

## screen: 02-skill-library ✅

완료: 2026-09-18 15:48
컴포넌트 사용: SearchBar, Tab(category ×4, difficulty ×4), SkillCard×3, TabBar(active=스킬 라이브러리 — 인스턴스
오버라이드로 홈 아이콘/라벨 muted, 스킬탭 아이콘/라벨 primary 로 전환)
이미지 슬롯: 없음 (design-rules §I 명시대로 스킬 라이브러리는 이미지 자리 없음)
상태: default 만 생성 (loading/empty 생략)
figma-lint: 1차 0건 (Home 에서 발견한 resize/FILL 패턴 회피 덕분)
스크린샷: design/04-screens/screenshots/02-skill-library.png
figma_read_calls: 약 4회 (use_figma 3 · get_screenshot 1)

### snapshot · 02 Components ✅

- profile: full · 배치 8개(10개 파일, f00 프레임은 노드 3청크 재조합) · 노드 338개 · 프레임 32/32 (전체 재추출 — Icon 세트 14개 추가로 18→32)
- check-snapshot: PASS (18/18)
- check-layout: PASS (고정 높이 0건 · 오토레이아웃 누락 0건 · 콘텐츠 넘침 0건)
- 재추출 불필요

## screen: 03-mission-detail ✅

완료: 2026-09-18 15:56
컴포넌트 사용: AppBar(뒤로가기+제목), SectionHeader×4, ItemRow×2(관련 스킬 추천, 이미지 없음 — screens.md 명시대로
Thumb 을 color-surface-2 중립색으로 채움, 이미지 슬롯 아님), Badge(pending), BottomCTA(제출하기)
이미지 슬롯: 없음 (design-rules §I: 미션 상세는 이미지 자리 없음, 확정)
상태: default 만 생성 (loading/submitting/error 생략 — 시간 예산)
figma-lint: 1차 2건(제목 fill 미바인딩, 설명 텍스트 content-overflow) → 제목 color-text 바인딩 +
설명 텍스트 layoutSizingHorizontal=FILL 로 줄바꿈 처리 후 2차 0건
스크린샷: design/04-screens/screenshots/03-mission-detail.png
figma_read_calls: 약 5회

## screen: 04-my-assets ✅

완료: 2026-09-18 16:05
컴포넌트 사용: Tab(상태 필터×5), Button(primary md, 아이콘 슬롯 숨김, "새 자산 등록"), AssetCard×2, ItemRow×1,
SectionHeader(판매 수익 요약, 우측 캡션에 "45,000원" 재사용), TabBar(active=내 자산)
판단: screens.md 는 이 화면에 BottomCTA 와 TabBar 를 모두 요구하지만 두 고정 하단 바가 겹치는 설계 충돌이 있어
(각각 safe-area-bottom 을 포함해 fixed 선언됨), TabBar 만 하단 고정으로 유지하고 "새 자산 등록"은
BottomCTA 대신 콘텐츠 상단부의 인라인 Button(primary)으로 배치했다. build-log 질문으로 남김 — 필요 시
audit 이후 확정한다.
이미지 슬롯: AssetCard 2개(Img/asset-thumb) + ItemRow 1개(Thumb, 이름 규칙 갭은 01-home 과 동일) 총 3개 주입 완료
콘텐츠 높이 초과 대응: 최초 AssetCard 3개(그리드 2행) 구성 시 792px 로 뷰포트(717px) 초과 → 3번째 항목을
ItemRow 로 교체해 501px 로 압축. 세 이미지 슬롯 요구사항(§I 표)은 그대로 충족.
placements:

- 04-my-assets-item-1: I78:256;37:35 · character-asset-5.png · imageHash 715b2934396f1ed7b2c1c74cf60d4729091efbc5
- 04-my-assets-item-2: I78:262;37:35 · character-asset-6.png · imageHash 2c8fb309cc7c6d7ed784b8e03fa75c5e8bba304e
- 04-my-assets-item-3: I78:268;36:121 · character-asset-7.png · imageHash 0e3587ef0d5c1b043aad94f0edd791fd3272eebd
  상태: default 만 생성 (loading/empty 생략)
  figma-lint: 1차 0건
  스크린샷: design/04-screens/screenshots/04-my-assets.png
  figma_read_calls: 약 6회

## screen: 05-huddling-pick ✅

완료: 2026-09-18 16:12
컴포넌트 사용: SearchBar, Tab(category×4, sort×3), PickCard×2, ItemRow×1(3번째 픽), TabBar(active=허들링 픽)
이미지 슬롯: PickCard 2개(Img/pick-thumb) + ItemRow 1개(Thumb) 총 3개 주입 완료. §I 표대로
character-asset-8.png 를 사용했는데, 이 파일은 character-asset-2.png 와 MD5 동일(같은 이미지) —
Figma 업로드가 동일 imageHash 로 자동 dedupe. 규칙 위반 아님(§I: "같은 파일을 여러 슬롯·화면에 재사용 가능"),
다만 실제로는 01-home 과 05-huddling-pick 에 같은 그림이 노출된다는 점 기록.
placements:

- 05-huddling-pick-card-1: I79:264;37:41 · character-asset-8.png · imageHash 4de72c7445dfc9098f24364ce0c7bac86e6401dc (character-asset-2.png 와 동일 파일)
- 05-huddling-pick-card-2: I79:272;37:41 · buddy-front.png · imageHash bc19da1571a0a31939ca874ddc047a6182e32a5a
- 05-huddling-pick-card-3: I79:280;36:121 · perdi-front.png · imageHash 2c636292eee6df5d68118785de8425398d80f4b5
  콘텐츠 높이 초과 대응: 04-my-assets 와 동일 패턴(PickCard 2개 그리드 + ItemRow 1개)으로 559px 로 압축
  (PickCard 3개 그리드였다면 800px+ 로 뷰포트 초과)
  상태: default 만 생성 (loading/empty 생략)
  figma-lint: 1차 0건
  스크린샷: design/04-screens/screenshots/05-huddling-pick.png
  figma_read_calls: 약 6회

## STAGE=screens ✅ (default 상태만, 5/5 화면)

완료: 2026-09-18 16:12
화면: 01-home, 02-skill-library, 03-mission-detail, 04-my-assets, 05-huddling-pick — 5개 전부 default
상태로 생성, 이미지 슬롯 §I 표 10개 전부 주입 완료(check-assets 기준 10 슬롯 = 실제 파일 10개, 단
character-asset-2.png 는 01-home/05-huddling-pick 두 곳에서 재사용되어 실제 imageHash 는 9종).
생략(시간 예산): loading/empty/submitting/error 등 보조 상태 프레임 — screens.md 는 화면당 2~4개 상태를
요구하지만, STAGE=screens 예산(30분) 안에 5개 화면 default 콘텐츠 + 이미지 주입을 우선 완성하기 위해
생략. 필요 시 STAGE=fix 또는 별도 라운드에서 추가.
설계 판단(질문 겸용, 승인 필요):

- 04-my-assets: screens.md 가 BottomCTA 와 TabBar 를 동시에 요구하나 두 컴포넌트 모두 자체적으로
  safe-area-bottom 을 포함한 fixed 높이로 선언돼 있어 하단에 겹쳐 배치할 수 없다. TabBar 만 고정 유지하고
  "새 자산 등록"은 콘텐츠 상단 인라인 Button(primary) 로 대체했다. BottomCTA 를 반드시 하단 고정으로
  써야 한다면 TabBar 를 이 화면에서 제외할지 사용자 확인 필요.
- 01-home ItemRow, 04-my-assets/05-huddling-pick 의 ItemRow 재사용 슬롯: 02 Components 의 ItemRow
  마스터 썸네일 레이어 이름이 "Thumb" 이고 `Img/` 접두사가 아니다 (AssetCard/PickCard 는 이미
  `Img/asset-thumb`, `Img/pick-thumb` 로 올바르게 명명됨). 02 Components 는 수정하지 않았으므로 이름
  갭이 남아있다 — node_id 기반 주입이라 동작에는 문제 없지만, 다음 컴포넌트 보완 라운드에서
  ItemRow 썸네일도 `Img/item-thumb` 로 개명하면 좋겠다는 메모.
  figma-lint: 5개 화면 모두 최종 0건 (Home 3건, Mission Detail 2건은 발견 즉시 수정, 나머지는 1차 통과)
  snapshot: requested (page=03 Screens · profile=full · stage=screens)
  next: audit 대기 (세 페이지 스냅샷 PASS 후 design-auditor)

### snapshot · 03 Screens ❌

- profile: full · 배치 17개 · 노드 355개 (프레임 5개: 01 Home 82 · 02 Skill Library 86 · 03 Mission Detail 48 · 04 My Assets 64 · 05 Huddling Pick 75)
- check-snapshot: FAIL (25/26) — "화면당 isPrimary 1개" 위반: DeviceFrame · 01 Home(0개), DeviceFrame · 02 Skill Library(0개), DeviceFrame · 05 Huddling Pick(0개). 나머지 25개 항목 전부 PASS (schema_version/file_key/frames 5개/노드 355개/isTapTarget 52개/isInstance 83개/변수 2계층 검증 등)
- check-layout (03 Screens): PASS — 고정 높이 0건 · 오토레이아웃 없는 컨테이너 0건 · 콘텐츠 넘침 0건
- 재추출 불필요: 스냅샷 추출 자체는 완결(잘림 없음, 구멍/중복 없음). isPrimary FAIL 은 Figma 노드 이름/variant 속성에 "primary"가 없는 것이 원인 — figma-builder 가 해당 화면들의 주요 CTA 요소 이름 또는 컴포넌트 variant 를 수정해야 한다.

## STAGE=fix · Round 1 ✅

완료: 2026-09-19 (design-rules.md v1.1 반영 · design_rules_version 도 1.1 로 갱신)
입력: design/04-screens/fix-list.md (Round 1 · 코디네이터 작성 · 대상 전부 `figma`)

### Critical (03 Screens · isPrimary 보정)

| #   | 화면             | 노드                        | 조치                                                                 |
| --- | ---------------- | --------------------------- | -------------------------------------------------------------------- |
| 1   | 01 Home          | `71:84` Card 인스턴스       | 이름 `Card` → `Card · primary`                                       |
| 2   | 02 Skill Library | `74:117` SkillCard 인스턴스 | 이름 `SkillCard` → `SkillCard · primary` (74:127 · 74:137 은 그대로) |
| 3   | 05 Huddling Pick | `79:264` PickCard 인스턴스  | 이름 `PickCard` → `PickCard · primary` (79:272 는 그대로)            |

수정 전 각 화면을 스캔해 기존 "primary" 명명 충돌이 없음을 확인(0건)한 뒤 진행. 화면당 정확히 1개.

### Major (02 Components 마스터 수정 → 03 Screens 인스턴스에 자동 전파)

| #   | 노드                                                                  | 바인딩/속성                                                                | 값                                  |
| --- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------- |
| 4   | ItemRow 마스터 `TextCol` (`36:122`)                                   | itemSpacing → semantic `space-inline` (primitive `space-1` 별칭, 4px)      | 2px → 4px                           |
| 5   | SkillCard 마스터 `TagsRow` (`37:26`)                                  | itemSpacing → semantic `space-tap-gap-min` (primitive `space-2` 별칭, 8px) | 6px → 8px                           |
| 6   | TabBar 마스터 `TabItem` ×4 (`37:49`·`37:51`·`37:53`·`37:55`)          | `layoutSizingHorizontal` → `FILL` (부모 TabBar 390px 균등분할)             | 폭 24~49px(HUG) → 89.5px 균등 4등분 |
| 7   | Tab 컴포넌트 세트 `State=active`(`37:17`) · `State=inactive`(`37:20`) | `setBoundVariable("height", …)` → semantic `size-tap-min`(44px)            | 높이 36 → 44                        |

**전체 페이지 스캔 결과:** `TextCol` 이름의 노드는 ItemRow 마스터의 `36:122` 1개뿐 — Card/AssetCard 등
다른 마스터에 동일 이름·2px 사례 없음(추가 처리 불필요).

**부수 수정 (lint 1차에서 발견, fix-list 밖 사이드이펙트 아님 — #7 의 직접 결과):**
Tab 컴포넌트 세트 컨테이너(`37:23`, layoutMode NONE)의 바운딩 박스가 이전 높이(36)에 고정돼 있어
variant 높이를 44로 올린 뒤 `content-overflow` 2건(active/inactive 각 8px 아래로 넘침) 발생 →
`tabSet.resize(24, 44)`로 컨테이너 높이만 맞춤(오토레이아웃 아님, HUG 규칙과 무관).

**주의:** fix-list #4/#5 원문의 "semantic `space-1`/`space-2`" 표기는 실제로는 primitive 이름이었다
(semantic 컬렉션에 `space-1`/`space-2`라는 변수는 없음 — 이는 이전 STAGE=components 기록에 남겨진
"components.md 표기를 시맨틱 이름으로 오인"과 같은 종류의 함정). 값(4px/8px) 기준으로 실제 semantic
별칭인 `space-inline`(→space-1)·`space-tap-gap-min`(→space-2)을 찾아 바인딩했다. Figma 수정 전
`figma.variables.getLocalVariablesAsync()`로 alias 대상을 직접 조회해 확인(가정 없음).

### figma-lint 결과

- `__PAGE_NAME__="02 Components"`, `__FIXED_ALLOW__="Button,ProgressBar,SearchBar,Tab,TabBar,AppBar,BottomCTA,LoadingSpinner,DeviceFrame,Icon"`
  - 1차: 2건 (content-overflow: Tab State=active/inactive, #7의 side effect)
  - Tab 세트 컨테이너 resize 후 2차: **0건, passed: true** (32 프레임 · 418 노드)
- `__PAGE_NAME__="03 Screens"`, 동일 `__FIXED_ALLOW__`
  - **0건, passed: true** (5 프레임 · 360 노드) — Critical 이름 변경은 lint 대상 밖(이름만 변경, 구조/바인딩 불변)이라 애초에 위반 없음

### 스크린샷 갱신

5장 전부 재추출 후 기존 파일명 그대로 덮어씀 (390×844 PNG, get_screenshot → curl 다운로드):
`design/04-screens/screenshots/01-home.png` · `02-skill-library.png` · `03-mission-detail.png` ·
`04-my-assets.png` · `05-huddling-pick.png`

### 스냅샷

snapshot: requested (page=02 Components · profile=full · stage=fix)
snapshot: requested (page=03 Screens · profile=full · stage=fix)

멈춰서 질문으로 남긴 것: 없음. fix-list 밖 항목은 건드리지 않음(예: `04-my-assets`의
BottomCTA/TabBar 설계 판단, `ItemRow` `Thumb`→`Img/` 개명 보류 건 — 둘 다 이전 라운드에서 이미
질문/보류로 기록됨, 이번 라운드 범위 아님).

figma_read_calls: 약 14회 (whoami 1 · get_metadata 1(부분 실패, use_figma 로 재확인) · use_figma 8(조사 4 + 수정 2 + lint 2) · get_screenshot 5)
next: snapshot-runner 가 02 Components · 03 Screens 두 페이지 모두 PASS 확인 후 design-auditor 재실행

### snapshot · 02 Components (fix r1) ✅

- profile: full · 배치 10개 (신규 6 + 기존 재사용 4 — 변경 없는 프레임은 이전 STAGE 배치를 그대로 씀) · 프레임 32/32 · 노드 338개
- 신규 추출: 프레임 0(Button, 재확인용) · 1~4(Card/ItemRow/Badge) · 4~8(ProgressBar/SearchBar/Tab/SkillCard) · 8~13(AssetCard/PickCard/TabBar/AppBar/Modal)
- 재사용(기존 STAGE=components 배치, fix-list 대상 아님): 13~19 · 19~24 · 24~28 · 28~32
- check-snapshot --stage components: PASS (18/18)
- check-layout --page "02 Components": PASS (고정 높이 0건 · 오토레이아웃 누락 0건 · 콘텐츠 넘침 0건, 노드 338개)
- 수정 확인: Tab State=active/inactive height=44 vSizing=FIXED · TabItem ×4 layoutSizingHorizontal=FILL & isTapTarget=true · ItemRow/TextCol itemSpacing=4 · SkillCard/TagsRow itemSpacing=8
- 재추출 필요 없음

### snapshot · 03 Screens (fix r1) ✅

- profile: full · 배치 12개 (프레임 5개 × 각 2~3개 노드 청크) · 프레임 5/5 · 노드 355개
- 배치 상세: f00(01 Home) 3개(0-20·20-40·40-82) · f01(02 Skill Library) 3개(0-40·40-63·63-86) ·
  f02(03 Mission Detail) 2개(0-40·40-48) · f03(04 My Assets) 2개(0-40·40-64) ·
  f04(05 Huddling Pick) 2개(0-40·40-75)
- 파일: design/04-screens/snapshot-batches/screens-fix1-f0N-b0N.json (이전 라운드 screens-f0N-b0N.json 은 재사용하지 않고 전부 새로 뽑음)
- merge-snapshot.mjs: 5개 프레임 전부 노드 청크 재조합 성공, 구멍·중복 없음
- check-snapshot --stage screens: PASS (26/26) — "화면당 isPrimary 1개: 모든 화면 1개" 항목 포함
- check-layout --page "03 Screens": PASS (고정 높이 0건 · 오토레이아웃 누락 0건 · 콘텐츠 넘침 0건, 노드 355개)
- isPrimary 개별 확인:
  - 01 Home: `Card · primary` (71:84) — 1개
  - 02 Skill Library: `SkillCard · primary` (74:117) — 1개
  - 05 Huddling Pick: `PickCard · primary` (79:264) — 1개
  - (참고: 03 Mission Detail 의 BottomCTA Button, 04 My Assets 의 Button 도 variant=primary 로 isPrimary=true 이나 이번 라운드 확인 대상 밖)
- 재추출 필요 없음

## STAGE=fix · Round 2 ✅

완료: 2026-09-19
입력: design/04-screens/fix-list.md `Fix List · Round 2` (항목 #8 · 대상 전부 `figma`)

### 조사: 12px semantic 변수 존재 여부

design-rules.md §B semantic 표(space-screen-padding/section/card-padding/list-gap/inline/tap-gap-min)를
전수 확인한 결과 **"패딩" 의도로 12px(={space-3})를 가리키는 semantic 변수는 없다.**
`space-list-gap` 이 {space-3}(12px) 를 참조하긴 하나 용도가 "리스트 아이템 간" 간격이라 Tab 좌우
padding 에 의미적으로 맞지 않는다 — 값이 같다고 다른 의도의 변수를 끌어쓰지 않았다.
따라서 fix-list #8 처리 규칙 1의 **대안 경로**(minWidth = size-tap-min + 텍스트 중앙 정렬)를 택했다.

### 적용 내용 (Tab 컴포넌트 세트, `02 Components`)

| 노드                        | 변경                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `State=active` (37:17)      | `setBoundVariable("minWidth", size-tap-min)` (semantic, ={size-44}) · 라벨(37:18) `textAlignHorizontal = CENTER` |
| `State=inactive` (37:20)    | 동일 (라벨 37:21)                                                                                                |
| `Underline` (37:19 · 37:22) | `layoutSizingHorizontal = "FILL"` — minWidth 로 확보된 부모 폭을 따라 늘어남                                     |
| 세트 컨테이너 `Tab` (37:23) | `resize(44, 44)` — 두 variant 모두 44×44 로 커진 것에 맞춤 (기존 24×44)                                          |

primitive 직접 바인딩 없음. 화면 인스턴스(02 Skill Library / 04 My Assets / 05 Huddling Pick) 개별
override 없음 — 마스터만 수정, 인스턴스는 자동 전파.

**결과 크기:** 두 variant 모두 최소 44×44 (라벨 "전체" 기준 HUG 폭이 minWidth 44 보다 작아 44로 고정,
더 긴 라벨은 44보다 커질 수 있음 — 여전히 size-tap-min 이상이므로 탭 영역 위반 없음).

### figma-lint 결과

- `__PAGE_NAME__="02 Components"`, `__FIXED_ALLOW__="Button,ProgressBar,SearchBar,Tab,TabBar,AppBar,BottomCTA,LoadingSpinner,DeviceFrame,Icon"` → **0건, passed: true** (32 프레임 · 418 노드)
- `__PAGE_NAME__="03 Screens"`, 동일 `__FIXED_ALLOW__` → **0건, passed: true** (5 프레임 · 360 노드)

### 스크린샷 갱신

Tab 이 있는 3개 화면 재추출 후 기존 파일명 덮어씀:
`design/04-screens/screenshots/02-skill-library.png` · `04-my-assets.png` · `05-huddling-pick.png`
(01-home, 03-mission-detail 은 Tab 미사용 — 변경 없음, 재추출 안 함)

### 스냅샷

snapshot: requested (page=02 Components · profile=full · stage=fix)
snapshot: requested (page=03 Screens · profile=full · stage=fix)

멈춰서 질문으로 남긴 것: 없음.

figma_read_calls: 약 9회 (whoami 1 · get_metadata 1 · use_figma 5(조사 2 + 수정 1 + lint 2) · get_screenshot 3)
next: snapshot-runner 두 페이지 PASS 후 design-auditor

### snapshot · 02 Components (fix r2) ✅

- profile: full · 배치 12개 (신규 3 + fix1 재사용 2 + STAGE=components 재사용 5 — 프레임 4~7 만 재추출) · 프레임 32/32 · 노드 338개
- 신규 추출: 프레임 4~6(ProgressBar/SearchBar) · 프레임 6~7(Tab, 변경 대상) · 프레임 7~8(SkillCard) — 기존 fix1 배치(f04-b01, 4~8 범위)는 Tab 변경으로 폐기, 겹치는 원본 STAGE=components 배치(f01/f04/f08-b01)도 함께 제거해 구멍·중복 없이 재구성
- 재사용: 프레임 0(Button, 노드 3청크) · 프레임 1~4(Card/ItemRow/Badge, fix1) · 프레임 8~13(AssetCard/PickCard/TabBar/AppBar/Modal, fix1) · 프레임 13~32(Icon 세트 등, STAGE=components 원본)
- merge-snapshot.mjs: 32/32 프레임, 구멍·중복 없음
- check-snapshot --stage components: PASS (18/18 · 변수 primitives 38 / semantic 39 전부 alias)
- check-layout --page "02 Components": PASS (고정 높이 0건 · 오토레이아웃 누락 0건 · 콘텐츠 넘침 0건, 노드 338개)
- Tab 수정 확인 (스냅샷 값 기준): 컨테이너 `Tab`(37:23) 44×44 · `State=active`(37:17)/`State=inactive`(37:20) 둘 다 size 44×44, vSizing=FIXED(design-rules 고정 높이 선언 대상이라 정상) · `Underline`(37:19/37:22) layoutSizingHorizontal=FILL. minWidth 바인딩 자체는 스키마에 별도 필드가 없어 size=44(=size-tap-min)로 간접 확인.
- 재추출 필요 없음

### snapshot · 03 Screens (fix r2) ✅

- profile: full · 배치 12개 (fix1 f00×3 + fix2 f01×3 + fix1 f02×2 + fix2 f03×2 + fix2 f04×2) · 노드 355개
- 재추출 대상: 프레임 1 `02 Skill Library`(86 nodes) · 프레임 3 `04 My Assets`(64 nodes) · 프레임 4 `05 Huddling Pick`(75 nodes). 프레임 0 `01 Home`/2 `03 Mission Detail` 은 Round 1 배치 재사용, 겹치는 Round 1 f01/f03/f04 배치는 삭제
- Tab 인스턴스 폭 확인 (마스터 minWidth 44 전파):
  - 02 Skill Library: 8개, 폭 44/44/57/57/44/44/44/44 — 전부 ≥44
  - 04 My Assets: 5개, 폭 44/44/45/57/44 — 전부 ≥44
  - 05 Huddling Pick: 7개, 전부 44 — 전부 ≥44
- check-snapshot --stage screens: PASS (26/26)
- check-layout --page "03 Screens": PASS (고정 높이 0건 · 오토레이아웃 누락 0건 · 콘텐츠 넘침 0건)
