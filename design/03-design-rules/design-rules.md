---
status: confirmed
version: 1.0
created_at: 2026-09-18
confirmed_at: 2026-09-18
based_on:
  - scripts/default-tokens.md (default)
  - PRD.md (§9 브랜드 방향)
  - design/01-references/analysis.md
  - design/02-structure/screens.md
  - design/02-structure/flows.md
---

# Design Rules

**주의:** 이 파일은 초안(draft) 상태입니다.
사용자 승인 후 `status: confirmed`로 변경됩니다.
`status: confirmed`가 없으면 figma-builder는 실행되지 않습니다.

---

## A. 색상

> **2계층 필수.** Primitive 에만 값을 쓰고, Semantic 은 `{primitive-name}` 참조만 쓴다.

### Primitive

| 토큰             | 값                 | 출처                                                     |
| ---------------- | ------------------ | -------------------------------------------------------- |
| brand-500        | #5B5FEF            | 가정 (analysis.md AI 화면 보라 강조 + PRD "신뢰감+젊음") |
| brand-600        | #5054D2            | 자동 파생 (brand-500 12% 어둡게)                         |
| brand-50         | rgba(91,95,239,.1) | 자동 파생 (brand-500 10% 불투명)                         |
| neutral-0        | #FFFFFF            | default                                                  |
| neutral-50       | #F5F5F7            | default                                                  |
| neutral-100      | #E9E9EE            | default                                                  |
| neutral-200      | #E5E7EB            | default                                                  |
| neutral-400      | #9CA3AF            | default                                                  |
| neutral-500      | #6B7280            | default                                                  |
| neutral-900      | #111827            | default                                                  |
| red-600          | #DC2626            | default                                                  |
| green-600        | #16A34A            | default                                                  |
| amber-500        | #F59E0B            | default                                                  |
| overlay-black-50 | rgba(0,0,0,.5)     | default                                                  |
| sky-100          | #D6ECFF            | 사용자 확정 (이미지 슬롯 배경 파스텔톤 하늘색)           |

### Semantic

| 토큰                  | 참조               | 용도                                   |
| --------------------- | ------------------ | -------------------------------------- |
| color-bg              | {neutral-0}        | 기본 배경                              |
| color-surface-1       | {neutral-50}       | 카드/시트 배경                         |
| color-surface-2       | {neutral-100}      | 강조 카드 배경                         |
| color-border          | {neutral-200}      | 구분선, 테두리                         |
| color-text            | {neutral-900}      | 본문                                   |
| color-text-muted      | {neutral-500}      | 보조 텍스트                            |
| color-text-disabled   | {neutral-400}      | 비활성 텍스트                          |
| color-text-inverse    | {neutral-0}        | 어두운 배경 위 텍스트                  |
| color-primary         | {brand-500}        | 주요 CTA, 강조, AI 관여 화면 강조      |
| color-primary-pressed | {brand-600}        | CTA pressed                            |
| color-primary-soft    | {brand-50}         | CTA soft 배경, AI 요약 카드 배경       |
| color-danger          | {red-600}          | 위험, 에러                             |
| color-success         | {green-600}        | 성공, 완료, 승인 상태                  |
| color-warning         | {amber-500}        | 경고, 주의, 피드백 대기 상태           |
| color-overlay         | {overlay-black-50} | 모달, 시트 딤 (AI 검수 로딩 모달 포함) |
| color-image-slot-bg   | {sky-100}          | 이미지 슬롯 배경 (파스텔톤 하늘색)     |

---

## B. 간격

### Primitive

| 토큰     | 값   |
| -------- | ---- |
| space-1  | 4px  |
| space-2  | 8px  |
| space-3  | 12px |
| space-4  | 16px |
| space-5  | 20px |
| space-6  | 24px |
| space-8  | 32px |
| space-12 | 48px |

### Semantic

| 토큰                 | 참조      | 용도              |
| -------------------- | --------- | ----------------- |
| space-screen-padding | {space-4} | 화면 좌우 padding |
| space-section        | {space-6} | 섹션 간 간격      |
| space-card-padding   | {space-4} | 카드 내부 padding |
| space-list-gap       | {space-3} | 리스트 아이템 간  |
| space-inline         | {space-1} | 아이콘-텍스트 간  |
| space-tap-gap-min    | {space-2} | 인접 탭 타겟 최소 |

---

## C. 타이포

**2계층 대상 아님.** role 기반 텍스트 스타일로 관리.

| 역할    | 크기/굵기 | 출처    |
| ------- | --------- | ------- |
| display | 28/700    | default |
| h1      | 24/600    | default |
| h2      | 20/600    | default |
| h3      | 17/600    | default |
| body    | 15/400    | default |
| body-sm | 14/400    | default |
| caption | 12/400    | default |
| label   | 13/500    | default |

Font family: "Pretendard", -apple-system, "Roboto", sans-serif (default)

---

## D. Radius

### Primitive

| 토큰        | 값     |
| ----------- | ------ |
| radius-4    | 4px    |
| radius-8    | 8px    |
| radius-12   | 12px   |
| radius-16   | 16px   |
| radius-full | 9999px |

### Semantic

| 토큰          | 참조          | 용도                      |
| ------------- | ------------- | ------------------------- |
| radius-tag    | {radius-4}    | 태그, 뱃지                |
| radius-button | {radius-8}    | 버튼, 인풋                |
| radius-card   | {radius-12}   | 카드                      |
| radius-sheet  | {radius-16}   | 시트, 다이얼로그          |
| radius-pill   | {radius-full} | 원형, 세로형 픽 카드 코너 |

---

## E. Shadow (default)

| 토큰      | 값                         |
| --------- | -------------------------- |
| shadow-sm | 0 1px 2px rgba(0,0,0,.06)  |
| shadow-md | 0 4px 12px rgba(0,0,0,.08) |
| shadow-lg | 0 8px 24px rgba(0,0,0,.12) |

---

## F. Motion (default)

| 토큰        | 값             |
| ----------- | -------------- |
| motion-fast | 150ms ease-out |
| motion-base | 200ms ease-out |
| motion-slow | 250ms ease-out |

---

## G. 모바일 특화

### Primitive

| 토큰    | 값  |
| ------- | --- |
| size-34 | 34  |
| size-36 | 36  |
| size-44 | 44  |
| size-47 | 47  |
| size-49 | 49  |
| size-52 | 52  |
| size-56 | 56  |
| icon-16 | 16  |
| icon-20 | 20  |
| icon-24 | 24  |

### Semantic

| 토큰                | 참조      | 용도                                |
| ------------------- | --------- | ----------------------------------- |
| device-frame        | 390×844   | 기본 화면 크기                      |
| safe-area-top       | {size-44} | 상태바 영역                         |
| safe-area-top-notch | {size-47} | 노치 기기 상태바                    |
| safe-area-bottom    | {size-34} | 홈 인디케이터 영역                  |
| size-tap-min        | {size-44} | 최소 터치 타겟 (44×44)              |
| size-button-sm      | {size-36} | 버튼 sm 높이                        |
| size-button-md      | {size-44} | 버튼 md 높이                        |
| size-button-lg      | {size-52} | 버튼 lg 높이                        |
| app-bar-height      | {size-56} | 상단 앱바 (미션 상세 뒤로가기 헤더) |
| tab-bar-height      | {size-49} | 하단 탭바                           |
| icon-sm             | {icon-16} | 작은 아이콘                         |
| icon-md             | {icon-20} | 기본 아이콘                         |
| icon-lg             | {icon-24} | 큰 아이콘                           |

---

## H. Z-Index (default)

| 토큰       | 값  | 용도                           |
| ---------- | --- | ------------------------------ |
| z-base     | 0   | 기본 콘텐츠                    |
| z-sticky   | 100 | 스티키 헤더/검색바 오버레이    |
| z-app-bar  | 200 | 상단 앱바                      |
| z-tab-bar  | 200 | 하단 탭바                      |
| z-overlay  | 300 | 오버레이 (딤)                  |
| z-sheet    | 400 | 바텀시트                       |
| z-dialog   | 500 | 다이얼로그 (AI 검수 로딩 모달) |
| z-snackbar | 600 | 스낵바 (최상위)                |

---

## I. 이미지

image-slots: used
image-library: design/assets/characters

> 토큰이 아니다. 어느 슬롯에 라이브러리의 어느 파일을 넣을지에 대한 규칙이다.
> **이미지는 생성하지 않는다.** figma-builder 의 STAGE=screens 가 아래 표의 `파일` 열만 보고
> `image-library` 폴더의 파일을 슬롯에 넣는다. `check-assets.mjs` 가 표와 폴더를 대조한다.

### 파일 선택 기준

**가정 (default 사용):** 사용자가 파일 선택 기준을 별도로 정하지 않아 `scripts/default-tokens.md` §I 의
"파일 선택 기준 (기본)"을 그대로 적용한다 — 같은 화면 안에서는 같은 시리즈 파일을 순서대로 쓰고,
텍스트가 올라가는 슬롯에는 배경이 단순한 파일을 고르며, 글자·로고·워터마크가 있는 파일은 쓰지 않는다.
**추가 가정:** 현재 `design/assets/characters/` 라이브러리는 마스코트 캐릭터 이미지(buddy·perdi 시리즈)와
범용 에셋 이미지(character-asset-1~8)로 구성되어 있어, "학습자료/스킬/자산/픽" 콘텐츠 사진과 의미적으로
직접 대응하지 않는다. 홈·내 자산의 콘텐츠 썸네일에는 화면 톤과 충돌이 적은 `character-asset-*` 시리즈를
순번대로 배정하고, 허들링 픽(마켓 상품 느낌이 더 필요한 세로형 카드)에는 `character-asset-*` 잔여분 +
`buddy-front` / `perdi-front`를 배정했다. PRD §9 "실험실+자산 라이브러리" 톤과 마스코트 캐릭터 톤이
어긋난다는 점은 analysis.md "피해야 할 것"에도 지적된 사항이므로, 실제 콘텐츠 썸네일 이미지가 준비되면
이 표의 `파일` 열만 교체하면 된다.

### 슬롯 역할별 비율

| role       | aspect_ratio | 쓰이는 곳                                            |
| ---------- | ------------ | ---------------------------------------------------- |
| thumb      | `1:1`        | 홈 최근 자료/스킬, 내 자산 목록 썸네일 (사용자 확정) |
| full-bleed | `3:4`        | 허들링 픽 세로형 카드 (사용자 확정: 세로형)          |

> hero / card / avatar 는 이번 5개 화면 정의(screens.md)에 해당 슬롯이 없어 사용하지 않는다.

### 슬롯 규약

- 레이어 이름: `Img/{화면번호}-{화면이름}-{슬롯이름}` (예: `Img/01-home-thumb-1`)
- 슬롯 프레임의 radius·padding 은 **semantic 토큰만** (`radius-card`)
- 슬롯 배경: `color-image-slot-bg` ({sky-100}) — 이미지는 fit(contain, 잘라내지 않음)으로 배치 (사용자 확정)
- 화면당 최대 4개. 같은 파일을 여러 슬롯·화면에 재사용해도 된다

### 화면별 슬롯 계획

| 슬롯 key                  | 화면             | role       | 비율  | 파일                    | 담을 내용                 |
| ------------------------- | ---------------- | ---------- | ----- | ----------------------- | ------------------------- |
| 01-home-recent-material-1 | 01-home          | thumb      | `1:1` | `character-asset-1.png` | 최근 학습한 자료 썸네일 1 |
| 01-home-recent-material-2 | 01-home          | thumb      | `1:1` | `character-asset-2.png` | 최근 학습한 자료 썸네일 2 |
| 01-home-recent-skill-1    | 01-home          | thumb      | `1:1` | `character-asset-3.png` | 최근 스킬 카드 썸네일 1   |
| 01-home-recent-skill-2    | 01-home          | thumb      | `1:1` | `character-asset-4.png` | 최근 스킬 카드 썸네일 2   |
| 04-my-assets-item-1       | 04-my-assets     | thumb      | `1:1` | `character-asset-5.png` | 자산 목록 썸네일 1        |
| 04-my-assets-item-2       | 04-my-assets     | thumb      | `1:1` | `character-asset-6.png` | 자산 목록 썸네일 2        |
| 04-my-assets-item-3       | 04-my-assets     | thumb      | `1:1` | `character-asset-7.png` | 자산 목록 썸네일 3        |
| 05-huddling-pick-card-1   | 05-huddling-pick | full-bleed | `3:4` | `character-asset-8.png` | 픽 카드 세로형 썸네일 1   |
| 05-huddling-pick-card-2   | 05-huddling-pick | full-bleed | `3:4` | `buddy-front.png`       | 픽 카드 세로형 썸네일 2   |
| 05-huddling-pick-card-3   | 05-huddling-pick | full-bleed | `3:4` | `perdi-front.png`       | 픽 카드 세로형 썸네일 3   |

> 스킬 라이브러리(02), 미션 상세(03) 화면은 screens.md에 이미지 자리가 명시되어 있지 않아 슬롯 없음.

---

## 컴포넌트 규칙

**필요 컴포넌트 (screens.md 기반):**

> 모든 값은 **semantic 토큰 이름**으로 적는다. primitive 이름이나 생값 금지.

> **높이 거동 (Height)** — 컨테이너는 내용을 감싸는 것이 기본이다 (`hug`).
> `fixed` 로 적은 것만 고정 높이가 허용된다.

### Button

- Variants: primary / secondary / ghost / danger
- Height: fixed(size-button-sm/md/lg)
- Sizes: size-button-sm / size-button-md / size-button-lg
- States: default / pressed / disabled / loading
- Radius: radius-button
- Padding: 좌우 space-screen-padding

### Card

- Height: hug
- Padding: space-card-padding
- Radius: radius-card
- Shadow: shadow-sm
- Background: color-surface-1 (미션 진행률 카드, 이번 달 미션 카드)

### ItemRow (아이템 로우)

- Height: hug
- 구성: 썸네일(정사각) + 제목/서브텍스트 + 선택적 우측 액션
- Gap: space-3
- 용도: 홈 "최근 학습한 자료" / "최근 스킬 카드", 미션 상세 "관련 스킬 카드 추천"

### Badge/Pill

- Height: hug (내부 padding 좌우 space-2, 상하 space-1)
- Variants: 상태뱃지(코너형, 무료/유료/난이도/검수상태) / 카테고리 pill
- Radius: radius-tag (뱃지) / radius-pill (원형 카운트류)
- Colors: color-primary-soft(기본 강조) / color-success(승인·판매중) / color-warning(피드백대기·검수중) / color-danger(반려)

### ProgressBar

- Height: fixed(space-1) — 트랙 두께 고정, 콘텐츠를 감싸는 컨테이너가 아니므로 hug 규칙 예외 (Icon과 동일한 성격)
- Variants: 단순 채움형(진행률 + 분수 텍스트) / 비교 트랙형
- Track: color-surface-2, Fill: color-primary
- 용도: 홈 이번 달 미션 진행률, 미션 상세 마감 진행 표기

### SearchBar

- Height: fixed(size-tap-min)
- Padding: 좌우 space-card-padding
- Radius: radius-button
- Background: color-surface-1
- Icon: lucide/search (icon-md)
- 용도: 스킬 라이브러리 / 허들링 픽 상단 검색바 (탭 시 화면 내 상태 전환으로 인기 검색어 리스트 노출)

### Tab (언더라인 필터 탭)

- Height: fixed(size-button-sm)
- States: active(color-text + 하단 언더라인 color-primary) / inactive(color-text-muted)
- 용도: 스킬 라이브러리 카테고리·난이도 필터, 내 자산 상태 필터, 허들링 픽 카테고리·정렬

### SkillCard

- Height: hug
- Padding: space-card-padding
- Radius: radius-card
- Background: color-bg
- Shadow: shadow-sm
- 구성: 스킬명(h3) + 카테고리 태그(Pill) + 난이도 Badge + 사용 도구 캡션 + 무료/유료 Badge
- 이미지: 없음 (screens.md §2 이미지 자리 없음)

### AssetCard

- Height: hug
- Padding: space-card-padding
- Radius: radius-card
- Background: color-bg
- Shadow: shadow-sm
- 구성: 이미지 슬롯(thumb, color-image-slot-bg 배경) + 제목 + 카테고리 caption + 상태 Badge(코너형) + 검수 진행 상황(ProgressBar 또는 Badge)

### PickCard

- Height: hug
- Padding: space-card-padding
- Radius: radius-card
- Background: color-bg
- Shadow: shadow-sm
- 구성: 이미지 슬롯(full-bleed, color-image-slot-bg 배경) + 제목(h3) + 제작자 row(캡션) + 가격(label, 볼드) + 카테고리 Pill

### TabBar

- Height: fixed(tab-bar-height + safe-area-bottom)
- Tabs: 4개 (홈 / 스킬 라이브러리 / 내 자산 / 허들링 픽)
- Icon: lucide (icon-lg), Label: label (13/500)
- Active: color-primary / Inactive: color-text-muted
- 적용 화면: 홈, 스킬 라이브러리, 내 자산, 허들링 픽 (미션 상세 제외)

### AppBar

- Height: fixed(app-bar-height + safe-area-top)
- Title: h2 중앙 정렬
- Actions: 좌 뒤로가기(lucide/chevron-left)
- 적용 화면: 미션 상세 (유일하게 탭바 없이 뒤로가기로만 복귀)

### Modal (dimmed 로딩)

- Height: hug (중앙 카드), 오버레이 자체는 화면 전체 fixed
- Overlay: color-overlay
- Card: color-bg, radius-sheet, shadow-lg
- 구성: 스파클 아이콘(lucide/sparkles) + 볼드 상태 문구(body) + 회색 서브텍스트(caption)
- 용도: 미션 상세 제출 후 AI/운영자 검수 대기(submitting), 내 자산 등록 흐름 AI 자동 태깅

### SectionHeader

- Height: hug
- Title: h2 또는 label + 우측 보조 링크(caption, color-text-muted)
- 용도: 미션 상세 제출 상태·피드백 이력 구분, 내 자산 상태별 섹션 구분

### BottomCTA

- Height: fixed(size-button-lg + safe-area-bottom)
- Background: color-bg, 상단 1px color-border, shadow-md
- Button: primary, 풀폭
- 용도: 미션 상세 "제출하기/재제출", 내 자산 "새 자산 등록"

### EmptyState

- Height: hug
- 구성: 아이콘(icon-lg, color-text-disabled) + 안내 문구(body-sm, color-text-muted)
- 용도: 홈(신규 멤버), 스킬 라이브러리/허들링 픽(필터 결과 없음), 내 자산(등록된 자산 없음)

### LoadingSpinner

- Height: fixed(icon-lg) — 스피너 자체가 고정 크기 아이콘성 요소 (Icon과 동일한 예외)
- 용도: 화면 default → loading 상태 전환 표시

### DeviceFrame

- Height: fixed(844)
- Width: 390
- 모든 화면의 최상위 프레임

### Icon

- Height: fixed(icon-sm / icon-md / icon-lg) — 아이콘은 정사각 고정 (하네스 기본 면제)
- Library: lucide (버전 고정: lucide-static@0.475.0)
- Icons: home / book-open / target / archive / star / search / chevron-right / chevron-left / bell / sparkles / lock / circle-check / filter / arrow-up-down
  (screens.md·flows.md에 등장하는 아이콘 후보를 lucide 공식 이름으로 나열. 실제 화면 제작 시 필요한 것만 사용)

### 의도적 제외

default-tokens.md 의 컴포넌트 중 시연 5개 화면(screens.md)에 쓰이지 않아 제외한 항목.

| 항목         | 사유                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| Input        | 검색은 SearchBar 로, 미션 제출 폼과 자산 등록 폼은 시연 범위 외(PRD §6) — 범용 텍스트 입력이 5개 화면에 없음 |
| Bottom Sheet | 검색 진입·필터는 화면 내 상태 전환으로 확정(screens.md), 로딩은 Modal 로 처리 — 바텀시트가 필요한 화면 없음  |

---

## 화면 규칙

- Frame: device-frame (390 × 844)
- Safe area: safe-area-top / safe-area-bottom
- Tap target: 최소 size-tap-min
- Primary CTA: 화면당 1개
- Bottom Sheet radius: radius-sheet 상단만
- Modal overlay: color-overlay
- 하단 탭바 대상: 홈 / 스킬 라이브러리 / 내 자산 / 허들링 픽 (확정, screens.md)
- 미션 상세: 하단 탭바 없음, AppBar(뒤로가기)만 사용 (확정, screens.md)
- **모든 바인딩은 semantic 토큰만** (primitive 직접 사용 금지)

---

## 근거 (Phase 1, 2 반영)

### analysis.md에서 반영한 것

- 컴포넌트 패턴 #1 (이미지 코너 상태뱃지 + pill) → Badge/Pill, AssetCard/PickCard 상태 표시
- 컴포넌트 패턴 #2 (진행률 바 2종) → ProgressBar (단순 채움형 + 비교 트랙형)
- 컴포넌트 패턴 #3 (언더라인 탭 네비게이션) → Tab, TabBar 활성 표시
- 컴포넌트 패턴 #4 (Sticky 하단 풀폭 CTA) → BottomCTA
- 컴포넌트 패턴 #5 (카드형 아이템 로우) → ItemRow
- UX 패턴 #2 (상태별 섹션 구분 리스트) → SectionHeader
- UX 패턴 #3 (AI 처리 로딩 모달) → Modal (dimmed + 중앙 카드)
- 시각 패턴 #3 (옅은 회색 배경 위 화이트 카드) → color-bg / color-surface-1 대비 구조
- "AI 관여 화면 보라 강조" 관찰 → brand-500 색상 제안의 근거 (가정)

### screens.md에서 반영한 것

- 필요 컴포넌트: Button, Card, SkillCard/AssetCard/PickCard, Badge/Pill, ProgressBar, SearchBar, Tab, TabBar, Modal, SectionHeader, EmptyState, LoadingSpinner, BottomCTA, AppBar
- 화면 상태: default / loading / empty / submitting(AI 검수 대기) / error
- 하단 탭바 4탭 확정 및 미션 상세 탭바 제외 확정 반영
- 이미지 슬롯 fit(contain) + 파스텔톤 하늘색 배경 확정 반영 (color-image-slot-bg)
- 홈·내 자산 썸네일 1:1(thumb), 허들링 픽 세로형(full-bleed) 확정 반영

### 가정 로그 (default 사용)

- **브랜드 컬러 (brand-500 = #5B5FEF):** 사용자가 직접 지정하지 않음. PRD §9 "신뢰감+젊음"과
  analysis.md의 "AI 관여 화면은 보라 계열 강조색 사용 경향" 관찰을 근거로 블루(신뢰)와 퍼플(AI·실험)을
  절충한 인디고-바이올렛 계열을 제안. **사용자 승인 필요.**
- **파스텔톤 하늘색 값 (sky-100 = #D6ECFF):** "파스텔톤 하늘색"이라는 정성적 지시만 있어 구체 hex는
  하네스가 제안. **사용자 승인 필요.**
- 타이포 스케일, Shadow, Motion, Z-Index → default-tokens.md 값 그대로 사용 (사용자 요청 없음)
- 이미지 라이브러리 파일-슬롯 매핑 → default 파일 선택 기준 + 순번 배정 (사용자 요청 없음, 위 §I 참고)
- 내 자산 화면 배치 순서(필터 → 목록 → 수익 요약, 등록 버튼은 BottomCTA) → screens.md 자체 가정을 그대로 채택
