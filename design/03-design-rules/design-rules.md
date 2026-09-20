---
status: confirmed
version: 1.1
created_at: 2026-09-19
confirmed_at: 2026-09-20
approved_by: user
based_on:
  - scripts/default-tokens.md
  - design/01-references/analysis.md
  - design/02-structure/screens.md
  - design/02-structure/flows.md
---

# Design Rules ✅ CONFIRMED

**이 파일은 프로젝트의 규칙 SSOT입니다.**
**figma-builder의 유일한 입력이며, 확정 후 임의 수정 금지.**

**대상 프로젝트:** 허들링 앱 (유료 멤버 시연 5화면 — 홈 · 스킬 라이브러리 · 미션 상세 · 내 자산 · 허들링 픽)

---

## A. 색상

> **2계층 필수.** Primitive 에만 값을 쓰고, Semantic 은 `{primitive-name}` 참조만 쓴다.

### Primitive

| 토큰             | 값                 | 출처                                    |
| ---------------- | ------------------ | --------------------------------------- |
| brand-500        | #2563EB            | 사용자 확정 (2026-09-19 · default 유지) |
| brand-600        | #1D4ED8            | 자동 파생 (brand-500 12% 어둡게)        |
| brand-50         | rgba(37,99,235,.1) | 자동 파생 (brand-500 10% 불투명)        |
| neutral-0        | #FFFFFF            | default                                 |
| neutral-50       | #F5F5F7            | default                                 |
| neutral-100      | #E9E9EE            | default                                 |
| neutral-200      | #E5E7EB            | default                                 |
| neutral-400      | #9CA3AF            | default                                 |
| neutral-500      | #6B7280            | default                                 |
| neutral-900      | #111827            | default                                 |
| red-600          | #DC2626            | default                                 |
| green-600        | #16A34A            | default                                 |
| amber-500        | #F59E0B            | default                                 |
| overlay-black-50 | rgba(0,0,0,.5)     | default                                 |

### Semantic

| 토큰                  | 참조               | 용도                                                  |
| --------------------- | ------------------ | ----------------------------------------------------- |
| color-bg              | {neutral-0}        | 기본 배경                                             |
| color-surface-1       | {neutral-50}       | 카드/시트 배경                                        |
| color-surface-2       | {neutral-100}      | 강조 카드 배경 (MissionCard highlight 등)             |
| color-border          | {neutral-200}      | 구분선, 테두리                                        |
| color-text            | {neutral-900}      | 본문                                                  |
| color-text-muted      | {neutral-500}      | 보조 텍스트                                           |
| color-text-disabled   | {neutral-400}      | 비활성 텍스트                                         |
| color-text-inverse    | {neutral-0}        | 어두운 배경 위 텍스트                                 |
| color-primary         | {brand-500}        | 주요 CTA, 강조 (MissionCard highlight 보더/배경 포함) |
| color-primary-pressed | {brand-600}        | CTA pressed                                           |
| color-primary-soft    | {brand-50}         | CTA soft 배경, MissionCard highlight 배경             |
| color-danger          | {red-600}          | 위험, 에러, 제출 실패(error 상태)                     |
| color-success         | {green-600}        | 성공, 완료, 승인 상태 뱃지                            |
| color-warning         | {amber-500}        | 경고, 마감 임박 D-day 뱃지                            |
| color-overlay         | {overlay-black-50} | 모달(CenterModal), 시트 딤                            |

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

| 토큰          | 참조          | 용도                                                 |
| ------------- | ------------- | ---------------------------------------------------- |
| radius-tag    | {radius-4}    | 태그, 뱃지, StatusBadge                              |
| radius-button | {radius-8}    | 버튼, 인풋, FilterChip                               |
| radius-card   | {radius-12}   | 카드 (MissionCard/Card/SkillCard/AssetCard/PickCard) |
| radius-sheet  | {radius-16}   | CenterModal, 다이얼로그                              |
| radius-pill   | {radius-full} | 원형, 아바타, 선택 순서 배지                         |

## E. Shadow (default)

| 토큰      | 값                         |
| --------- | -------------------------- |
| shadow-sm | 0 1px 2px rgba(0,0,0,.06)  |
| shadow-md | 0 4px 12px rgba(0,0,0,.08) |
| shadow-lg | 0 8px 24px rgba(0,0,0,.12) |

## F. Motion (default)

| 토큰        | 값             |
| ----------- | -------------- |
| motion-fast | 150ms ease-out |
| motion-base | 200ms ease-out |
| motion-slow | 250ms ease-out |

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

| 토큰                | 참조      | 용도                                                    |
| ------------------- | --------- | ------------------------------------------------------- |
| device-frame        | 390×844   | 기본 화면 크기                                          |
| safe-area-top       | {size-44} | 상태바 영역                                             |
| safe-area-top-notch | {size-47} | 노치 기기 상태바                                        |
| safe-area-bottom    | {size-34} | 홈 인디케이터 영역                                      |
| size-tap-min        | {size-44} | 최소 터치 타겟 (44×44) — FilterChip · SegmentedTab 포함 |
| size-button-sm      | {size-36} | 버튼 sm 높이                                            |
| size-button-md      | {size-44} | 버튼 md 높이                                            |
| size-button-lg      | {size-52} | 버튼 lg 높이                                            |
| app-bar-height      | {size-56} | 상단 앱바                                               |
| tab-bar-height      | {size-49} | 하단 탭바                                               |
| icon-sm             | {icon-16} | 작은 아이콘                                             |
| icon-md             | {icon-20} | 기본 아이콘                                             |
| icon-lg             | {icon-24} | 큰 아이콘                                               |

## H. Z-Index (default)

| 토큰       | 값  | 용도            |
| ---------- | --- | --------------- |
| z-base     | 0   | 기본 콘텐츠     |
| z-sticky   | 100 | 스티키 헤더     |
| z-app-bar  | 200 | 상단 앱바       |
| z-tab-bar  | 200 | 하단 탭바       |
| z-overlay  | 300 | 오버레이 (딤)   |
| z-sheet    | 400 | 바텀시트        |
| z-dialog   | 500 | 다이얼로그      |
| z-snackbar | 600 | 스낵바 (최상위) |

---

## I. 이미지

    image-slots: used
    image-library: design/assets/characters

> 토큰이 아니다. 어느 슬롯에 라이브러리의 어느 파일을 넣을지에 대한 규칙이다.
> **이미지는 생성하지 않는다.** figma-builder 의 STAGE=screens 가 아래 표의 `파일` 열만 보고
> `image-library` 폴더의 파일을 슬롯에 넣는다. `check-assets.mjs` 가 표와 폴더를 대조한다.

### 파일 선택 기준

사용자가 별도 기준을 정하지 않아 `scripts/default-tokens.md` §I 의 "파일 선택 기준 (기본)"을
그대로 적용한다 (가정 로그 참고): 한 화면 안에서는 같은 시리즈 파일(`character-asset-*`)을 쓰고,
텍스트가 올라가는 슬롯에는 배경이 단순한 파일을 고르며, 글자·로고·워터마크가 있는 파일은 쓰지 않는다.
`character-asset-1~8.png` 8개는 홀릭스 앱의 자산/콘텐츠 썸네일 톤에 맞아 세 화면 슬롯 모두에서
재사용한다 (같은 파일을 여러 슬롯에 재사용하는 것은 default-tokens.md 규칙상 허용).

### 슬롯 역할별 비율

| role       | aspect_ratio | 쓰이는 곳                 |
| ---------- | ------------ | ------------------------- |
| hero       | `16:9`       | 홈 상단 배너, 상세 최상단 |
| card       | `4:3`        | 리스트/그리드 카드 썸네일 |
| thumb      | `1:1`        | 작은 정사각 썸네일        |
| avatar     | `1:1`        | 프로필 이미지             |
| full-bleed | `3:4`        | 전체 폭 세로 이미지       |

### 슬롯 규약

- 레이어 이름: `Img/{화면번호}-{화면이름}-{슬롯이름}` (예: `Img/01-home-recent-material-1`)
- 슬롯 프레임의 radius·padding 은 **semantic 토큰만** (`radius-card` 등)
- 화면당 최대 6개. 같은 파일을 여러 슬롯·화면에 재사용해도 된다

### 화면별 슬롯 계획

> screens.md "이미지 슬롯 총계" 표 기준: 홈 3(4:3) · 스킬 라이브러리 0 · 미션 상세 0 · 내 자산 6(1:1) · 허들링 픽 4(4:3) = 총 13개.
> (v1.1 · 2026-09-20: 허들링 픽 3×2 그리드가 StatusBar 44 포함 시 뷰포트를 41px 초과해 2×2 로 축소 · 슬롯 5·6 제거 · 사용자 확정)

| 슬롯 key                  | 화면             | role  | 비율  | 파일                    | 담을 내용                                 |
| ------------------------- | ---------------- | ----- | ----- | ----------------------- | ----------------------------------------- |
| 01-home-recent-material-1 | 01-home          | card  | `4:3` | `character-asset-1.png` | 최근 학습한 자료 썸네일 1                 |
| 01-home-recent-material-2 | 01-home          | card  | `4:3` | `character-asset-2.png` | 최근 학습한 자료 썸네일 2                 |
| 01-home-recent-material-3 | 01-home          | card  | `4:3` | `character-asset-3.png` | 최근 학습한 자료 썸네일 3                 |
| 04-my-assets-thumb-1      | 04-my-assets     | thumb | `1:1` | `character-asset-4.png` | 내 자산 카드 썸네일 1                     |
| 04-my-assets-thumb-2      | 04-my-assets     | thumb | `1:1` | `character-asset-5.png` | 내 자산 카드 썸네일 2                     |
| 04-my-assets-thumb-3      | 04-my-assets     | thumb | `1:1` | `character-asset-6.png` | 내 자산 카드 썸네일 3                     |
| 04-my-assets-thumb-4      | 04-my-assets     | thumb | `1:1` | `character-asset-7.png` | 내 자산 카드 썸네일 4                     |
| 04-my-assets-thumb-5      | 04-my-assets     | thumb | `1:1` | `character-asset-8.png` | 내 자산 카드 썸네일 5                     |
| 04-my-assets-thumb-6      | 04-my-assets     | thumb | `1:1` | `character-asset-1.png` | 내 자산 카드 썸네일 6 (재사용)            |
| 05-huddling-pick-card-1   | 05-huddling-pick | card  | `4:3` | `character-asset-2.png` | 픽 카드 이미지 1 (가격/카테고리 오버레이) |
| 05-huddling-pick-card-2   | 05-huddling-pick | card  | `4:3` | `character-asset-3.png` | 픽 카드 이미지 2                          |
| 05-huddling-pick-card-3   | 05-huddling-pick | card  | `4:3` | `character-asset-4.png` | 픽 카드 이미지 3                          |
| 05-huddling-pick-card-4   | 05-huddling-pick | card  | `4:3` | `character-asset-5.png` | 픽 카드 이미지 4                          |

---

## 컴포넌트 규칙

**필요 컴포넌트 (screens.md 기반):**

> 모든 값은 **semantic 토큰 이름**으로 적는다. primitive 이름이나 생값 금지.

> **높이 거동 (Height)** — 컨테이너는 기본 `hug`. `fixed` 는 기기·크롬 치수와 탭 규격(Button)·
> 탭 타겟(FilterChip/SegmentedTab)으로 제한한다.

### Button

- Variants: primary / secondary / ghost / danger
- Height: fixed(size-button-sm/md/lg)
- Sizes: size-button-sm / size-button-md / size-button-lg
- States: default / pressed / disabled / loading
- Radius: radius-button
- Padding: 좌우 space-screen-padding
- 사용: 화면당 primary 1개. 내 자산 화면의 "새 자산 등록"은 secondary/outline 사이즈로 우측 정렬 인라인 배치 (BottomActionBar 아님 — TabBar 와 겹침 방지)

### MissionCard

- Variants: default / highlight
- Height: hug
- Radius: radius-card
- Padding: space-card-padding
- highlight variant: background color-primary-soft, border 1px solid color-primary, 진행률 바(ProgressBar) + D-day 뱃지(StatusBadge, color-warning) 포함
- 레이어 이름 규칙: highlight 인스턴스는 반드시 레이어 이름에 `primary` 를 포함한다 (예: `MissionCard/primary`) — 화면당 1개만, 스냅샷 isPrimary 판정 기준
- 이미지: 없음 (analysis.md UX-3 — 게임 일러스트 요소 배제)

### Card

- Height: hug
- Radius: radius-card
- Shadow: shadow-sm
- Background: color-surface-1
- Padding: space-card-padding
- 용도: 최근 학습자료 · 최근 스킬 카드 공용 (기본 variant)

### SkillCard

- Height: hug
- Radius: radius-card
- Padding: space-card-padding
- 구성: 제목(h3) + 카테고리 태그(StatusBadge) + 난이도 뱃지(StatusBadge) + 도구 태그 + 무료/유료 뱃지
- 이미지: 없음
- 모든 카드 동일 가중치 (강조 variant 없음)

### AssetCard

- Height: hug
- Radius: radius-card
- Padding: space-card-padding
- 구성: 썸네일(Img slot, thumb 1:1) + 상태 뱃지 오버레이(StatusBadge) + 제목(h3) + 카테고리(caption)

### PickCard

- Height: hug
- Radius: radius-card
- Padding: space-card-padding
- 구성: 이미지(Img slot, card 4:3) + 가격/카테고리 오버레이 태그(StatusBadge) + 제목(h3) + 제작자(caption)
- 모든 카드 동일 가중치 (강조 variant 없음)

### SearchBar

- Height: hug (내부 인풋 높이는 size-tap-min 이상 확보)
- Radius: radius-button
- Background: color-surface-1
- Padding: 좌우 space-card-padding
- Icon: lucide/search, icon-md
- 위치: sticky top (z-sticky)

### FilterChip

- Height: fixed(size-tap-min) — 탭 타겟이므로 hug 예외
- Radius: radius-pill
- Padding: 좌우 space-3
- States: default / selected
- 용도: 카테고리 · 난이도 · 상태 필터 (스킬 라이브러리, 내 자산, 허들링 픽)

### SegmentedTab

- Height: fixed(size-tap-min) — 탭 타겟이므로 hug 예외
- Radius: radius-button
- Background: color-surface-1 (선택된 세그먼트만 color-bg + shadow-sm)
- 용도: 허들링 픽 정렬 옵션 (최신순/인기순/가격순)

### StatusBadge

- Height: hug
- Radius: radius-tag
- 텍스트형 (미션 제출 상태: 작성 중/제출 완료/피드백 대기/승인) — 배경 color-surface-2, 승인은 color-success
- 이미지 오버레이형 (자산 상태: 비공개/멤버공개/판매신청중/판매중, 픽 카드 가격/카테고리) — 배경 color-overlay 위 color-text-inverse 텍스트

### SummaryBox

- Height: hug
- Radius: radius-card
- Background: color-surface-2
- Padding: space-card-padding
- 용도: 내 자산 화면 판매 수익 요약 (강조 배경 + CTA 링크)

### MultiSelectGrid

- Height: hug (컨테이너)
- 개별 선택 타일: fixed(size-tap-min) 이상 정사각 — 탭 타겟 확보
- Radius: radius-button (타일), radius-pill (선택 순서 배지)
- 선택 순서 배지: color-primary 배경 + color-text-inverse 숫자
- 용도: 미션 제출 파일 첨부 (다중 선택, 선택 시 하단 "N개 선택 완료" Button 노출)

### BottomActionBar

- Height: fixed(size-button-lg + safe-area-bottom) — 기기 하단 안전영역 포함 고정 바
- Background: color-bg, 상단 경계 color-border, shadow-md
- 용도: 미션 상세 전용 (제출하기 1버튼, sticky, z-sheet). 하단 탭바 루트 화면(홈/스킬 라이브러리/내 자산/허들링 픽)에는 배치하지 않는다 — TabBar 와 겹침 방지

### CenterModal

- Height: hug
- Radius: radius-sheet
- Background: color-bg
- Overlay: color-overlay (z-dialog)
- 구성: 설명 텍스트 + 취소(secondary)/확정(primary) 2버튼

### BottomTabBar

- Height: fixed(tab-bar-height + safe-area-bottom)
- Background: color-bg, 상단 경계 color-border
- Tabs: 5개 (홈/스킬 라이브러리/미션/내 자산/허들링 픽) — 단, 미션 상세는 탭바 루트가 아닌 push 화면
- Icon: icon-lg, Label: label (13/500)
- 배지 카운트: color-danger 배경 원형(radius-pill)

### EmptyState

- Height: hug
- 구성: 아이콘(icon-lg, color-text-disabled) + 한 줄 안내(body-sm, color-text-muted)
- 사용 화면: 홈(미션 미배정), 스킬 라이브러리(검색 결과 0건), 내 자산(필터 결과 0건), 허들링 픽(카테고리 결과 0건)

### LoadingSpinner

- Height: fixed(icon-lg) — 아이콘형 고정 (하네스 기본 면제)
- 색상: color-primary

### Icon

- Height: fixed(icon-sm / icon-md / icon-lg) — 아이콘은 정사각 고정 (하네스 기본 면제)
- Library: lucide
- Icons: home / book-open / target / archive / store / search / bell / chevron-right / chevron-down / x / arrow-left / chevron-left
  (lucide 공식 이름(kebab-case). figma-builder 는 CDN 에서 받아 만든다 — 손으로 그리지 않는다)

### App Bar

- Height: fixed(app-bar-height + safe-area-top)
- Background: color-bg, 하단 경계 color-border
- 구성: 좌측 뒤로가기 버튼(lucide/chevron-left, icon-lg, 탭 타겟 size-tap-min) + 제목(h2, 중앙 정렬)
- 적용 화면: 미션 상세 전용 (홈/스킬 라이브러리/내 자산/허들링 픽은 탭바 루트라 App Bar 없이 화면 규칙의 단순 타이틀 영역만 사용)
- z-index: z-app-bar (200) — §H 표 그대로

---

## 화면 규칙

- Frame: device-frame (390 × 844)
- Safe area: safe-area-top / safe-area-bottom
- Tap target: 최소 size-tap-min (FilterChip · SegmentedTab · MultiSelectGrid 타일 포함)
- Primary CTA: 화면당 1개
- Primary 카드 레이어 이름에 `primary` 표기: 홈 화면의 MissionCard(highlight) 인스턴스는 레이어 이름에 `primary`를 포함한다 (스냅샷 isPrimary 판정 기준)
- 내 자산: BottomTabBar 유지 + "새 자산 등록"은 콘텐츠 상단 인라인 Button(secondary/outline). BottomActionBar는 배치하지 않는다 (TabBar와 하단 겹침 방지)
- 미션 상세: App Bar(좌측 뒤로가기 + 제목) 상단 고정 + BottomActionBar(제출하기 1버튼, sticky) 하단 고정 — 탭바 루트가 아닌 push 화면이므로 TabBar 미배치
- Bottom Sheet / CenterModal radius: radius-sheet
- Modal overlay: color-overlay
- **모든 바인딩은 semantic 토큰만** (primitive 직접 사용 금지)

---

## 의도적 제외

> default-tokens.md "컴포넌트 기본값"에 정의되어 있으나, 본 시연 5화면(screens.md) 범위에는
> 등장하지 않아 컴포넌트 규칙에서 상세를 만들지 않는다. 필요해지면 default-tokens.md 정의를 그대로 가져온다.

| 항목         | 사유                                                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Input        | 시연 5화면에 텍스트 입력 폼이 없다 (미션 제출은 MultiSelectGrid 파일 첨부, 설명 작성 입력창은 PRD §6 시연 제외인 별도 등록 폼에서 다룬다) |
| Bottom Sheet | 시연 5화면에 half/full 바텀시트 화면이 없다 (확인 UI는 CenterModal 로 대체)                                                               |

## 근거 (Phase 1, 2 반영)

### analysis.md에서 반영한 것

- UX 패턴 #3 (게이미피케이션 진행률+잠금 카드, 일러스트 배제) → MissionCard highlight variant 진행률 바 + D-day 뱃지
- UX 패턴 #2 (Sticky 하단 액션 바) → BottomActionBar(미션 상세 제출하기)
- UX 패턴 #1 (다중 파일 선택→하단 sticky 확정) → MultiSelectGrid + 선택 완료 Button
- UX 패턴 #4 (마이페이지 그룹 리스트) → SummaryBox + FilterChip 섹션 구조 (내 자산)
- UX 패턴 #5 (빈 상태: 아이콘+한 줄 안내) → EmptyState
- 시각 패턴 #1 (이미지 위 뱃지/태그 오버레이) → AssetCard·PickCard의 StatusBadge 오버레이
- 시각 패턴 #2 (화이트 배경+단일 강조색 CTA) → color-bg 기본, color-primary 단일 강조
- 컴포넌트 패턴 #1 (하단 탭바 5개) → BottomTabBar
- 컴포넌트 패턴 #4 (세그먼트/칩 필터) → FilterChip, SegmentedTab
- 컴포넌트 패턴 #5 (중앙 확인 모달 2버튼) → CenterModal

### screens.md에서 반영한 것

- 필요 컴포넌트: BottomTabBar, MissionCard, Card, SkillCard, AssetCard, PickCard, SearchBar, FilterChip, SegmentedTab, StatusBadge, SummaryBox, MultiSelectGrid, BottomActionBar, AppBar, CenterModal, Button, EmptyState, LoadingSpinner
- 화면 상태: default / loading / empty (전 화면 공통) + 미션 상세의 submitting / error
- 이미지 슬롯: 홈 3(4:3) · 내 자산 6(1:1) · 허들링 픽 4(4:3) = 13개, 스킬 라이브러리·미션 상세는 이미지 없음

### 가정 로그 (default 사용)

- 브랜드 컬러 → default(#2563EB) 유지 · 사용자 확정 (2026-09-19 · default 유지). PRD §9 "신뢰감+젊음" 힌트와 default 블루의 "신뢰, 프로페셔널" 톤이 부합해 사용자가 그대로 채택.
- 타이포 스케일 → default 사용 (사용자 요청 없음)
- Shadow/Motion → default 사용 (사용자 요청 없음)
- 이미지 파일 선택 기준 → default-tokens.md §I "파일 선택 기준 (기본)" 그대로 적용 (사용자 지정 기준 없음)
- 이미지 파일 배정 → `character-asset-1~8.png` 8개를 13개 슬롯에 재사용 배정 (같은 화면 내 순차 배정, 부족분은 재사용)
