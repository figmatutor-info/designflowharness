# 컴포넌트 규칙 상세

design-rules.md의 컴포넌트 섹션 상세. 모든 값은 semantic 토큰만 사용한다.

---

## Button

### Anatomy

- Container (padding, radius, background)
- Icon (선택, 좌/우 — lucide)
- Label (label 텍스트 스타일)

### Variants

#### primary

- background: color-primary
- text: color-text-inverse
- 사용: 화면당 1개 CTA (BottomCTA 내부 버튼 등)

#### secondary

- background: color-surface-1
- text: color-text
- border: 1px solid color-border
- 사용: 부가 액션

#### ghost

- background: transparent
- text: color-primary
- 사용: 텍스트 링크 대체 (예: "자세히 보기")

#### danger

- background: color-danger
- text: color-text-inverse
- 사용: 자산 반려/삭제 등 위험 액션

### Sizes

| Size | Height (fixed) | Padding                   | Icon    |
| ---- | -------------- | ------------------------- | ------- |
| sm   | size-button-sm | 좌우 space-3              | icon-sm |
| md   | size-button-md | 좌우 space-screen-padding | icon-md |
| lg   | size-button-lg | 좌우 space-screen-padding | icon-lg |

### States

- default: 기본
- pressed: color-primary-pressed 배경
- disabled: opacity 40%, 상호작용 없음
- loading: LoadingSpinner + 텍스트 흐리게(opacity 60%)

---

## Card

- Height: hug
- Padding: space-card-padding
- Radius: radius-card
- Shadow: shadow-sm
- Background: color-surface-1
- 용도: 홈 "이번 달 미션 카드" — 내부에 ProgressBar + D-day label 포함

---

## ItemRow (아이템 로우)

### Anatomy

- 썸네일(정사각, size-tap-min 이상) — 좌측
- 제목(body) + 서브텍스트(caption) — 우측, 세로 스택
- 선택적 우측 액션 아이콘(chevron-right, icon-sm)

### 규칙

- Height: hug
- Gap: space-3 (썸네일-텍스트 간), space-list-gap (행간)
- 배경/테두리 없음 (여백으로만 구분 — analysis.md 클래스101 004 패턴)
- 용도: 홈 "최근 학습한 자료" / "최근 스킬 카드", 미션 상세 "관련 스킬 카드 추천"

---

## Badge / Pill

### Anatomy

- 텍스트(label, 12~13px) + 선택적 아이콘(icon-sm)

### Variants

| Variant           | 배경                                       | 텍스트                                | 용도                                     |
| ----------------- | ------------------------------------------ | ------------------------------------- | ---------------------------------------- |
| 코너형 상태뱃지   | color-overlay(어두운 배경) 또는 color-text | color-text-inverse                    | 이미지 코너("품절", "AI 제작" 유사 위치) |
| 카테고리 pill     | color-surface-2                            | color-text                            | 카테고리 태그                            |
| 난이도 pill       | color-primary-soft                         | color-primary                         | 초급/중급/고급                           |
| 무료/유료 pill    | color-surface-2 / color-primary-soft       | color-text / color-primary            | 무료·유료 구분                           |
| 승인/판매중       | color-success (soft 처리 권장)             | color-text-inverse 또는 color-success | 승인, 판매 중                            |
| 피드백대기/검수중 | color-warning (soft 처리 권장)             | color-text-inverse 또는 color-warning | 피드백 대기, 검수 진행 중                |
| 반려              | color-danger (soft 처리 권장)              | color-text-inverse 또는 color-danger  | 반려 상태                                |

### 규칙

- Height: hug
- Padding: 좌우 space-2, 상하 space-1
- Radius: radius-tag (사각형 뱃지) / radius-pill (원형 카운트 배지)

---

## ProgressBar

### Variants

#### 단순 채움형 (말해보카 방식)

- Track: color-surface-2, Height: fixed(space-1)
- Fill: color-primary, Radius: radius-pill
- 옆에 분수 텍스트(label, 예: "3/5") 병기
- 용도: 홈 이번 달 미션 카드 진행률

#### 비교 트랙형 (플랭 방식)

- Track: color-surface-2, Height: fixed(space-1)
- 두 값의 위치에 pill 마커 2개 (color-primary / color-success)
- 용도: 필요 시 내 자산 목표 대비 실적 비교 (선택 적용)

---

## SearchBar

### Anatomy

- 아이콘(lucide/search, icon-md) + placeholder 텍스트(body) + 우측 선택 액션

### 규칙

- Height: fixed(size-tap-min)
- Background: color-surface-1
- Radius: radius-button
- Padding: 좌우 space-card-padding
- 탭 시 화면 내 상태 전환으로 랭크드 인기 검색어 리스트 노출 (별도 화면 아님)
- 용도: 스킬 라이브러리, 허들링 픽 상단

### 인기 검색어 리스트 (오버레이 상태)

- z-index: z-sticky
- 번호(label, color-primary) + 검색어 텍스트(body)
- 리스트 항목 Height: hug, Gap: space-list-gap

---

## Tab (언더라인 필터 탭)

- Height: fixed(size-button-sm)
- Active: color-text + 하단 2px 언더라인 color-primary
- Inactive: color-text-muted, 언더라인 없음
- Gap: space-tap-gap-min 이상 (인접 탭 간)
- 용도: 스킬 라이브러리(카테고리/난이도), 내 자산(상태 필터: 전체/비공개/멤버공개/판매신청중/판매중), 허들링 픽(카테고리/정렬)

---

## SkillCard

### Anatomy

- 스킬명(h3)
- 카테고리 태그(Pill)
- 난이도 Badge(초급/중급/고급)
- 사용 도구(caption)
- 무료/유료 Badge

### 규칙

- Height: hug
- Padding: space-card-padding
- Radius: radius-card
- Shadow: shadow-sm
- 이미지 없음 (screens.md §2 명시)

---

## AssetCard

### Anatomy

- 이미지 슬롯(role: thumb, 1:1, background: color-image-slot-bg, fit: contain)
- 제목(h3)
- 카테고리(caption)
- 상태 Badge (코너형: 비공개/멤버공개/판매신청중/판매중)
- 검수 진행 상황 (판매 신청 중일 때 ProgressBar 또는 단계 Badge)

### 규칙

- Height: hug
- Padding: space-card-padding
- Radius: radius-card
- Shadow: shadow-sm
- 이미지 슬롯 레이어 이름: `Img/04-my-assets-item-{n}`

---

## PickCard

### Anatomy

- 이미지 슬롯(role: full-bleed, 3:4, background: color-image-slot-bg, fit: contain)
- 제목(h3)
- 제작자 row (아바타 생략 가능, 이름 caption)
- 가격(label, 볼드)
- 카테고리 Pill

### 규칙

- Height: hug
- Padding: space-card-padding
- Radius: radius-card
- Shadow: shadow-sm
- 이미지 슬롯 레이어 이름: `Img/05-huddling-pick-card-{n}`

---

## TabBar

- Height: fixed(tab-bar-height + safe-area-bottom)
- Tabs: 4개 — 홈 / 스킬 라이브러리 / 내 자산 / 허들링 픽
- Icon: lucide (icon-lg) — home / book-open / archive / star
- Label: label (13/500)
- Active: color-primary (아이콘+라벨) / Inactive: color-text-muted
- z-index: z-tab-bar
- **미션 상세에는 렌더링하지 않는다** (확정 사항)

---

## AppBar

- Height: fixed(app-bar-height + safe-area-top)
- Title: h2, 중앙 정렬
- 좌측: 뒤로가기 아이콘(lucide/chevron-left, icon-md)
- z-index: z-app-bar
- 유일한 적용 화면: 미션 상세

---

## Modal (dimmed 로딩)

### Anatomy

- 전체 화면 오버레이(color-overlay)
- 중앙 카드(color-bg, radius-sheet, shadow-lg, hug)
  - 아이콘(lucide/sparkles, icon-lg, color-primary)
  - 상태 문구(body, 예: "AI 검수 중...")
  - 서브텍스트(caption, color-text-muted, 예: "제출물 유형 분석")

### 규칙

- z-index: z-dialog
- 배경 콘텐츠는 흐리지 않고 딤 처리만 (analysis.md 차란 009 패턴)
- 용도: 미션 상세 submitting 상태, 내 자산 등록 흐름 AI 자동 태깅

---

## SectionHeader

- Height: hug
- Title: h2 (또는 label + 카운트)
- 선택적 우측 보조 텍스트(caption, color-text-muted)
- 용도: 미션 상세(제출 상태/피드백 이력 구분), 내 자산(상태별 섹션 구분)

---

## BottomCTA

- Height: fixed(size-button-lg + safe-area-bottom)
- 상단 1px color-border, Background: color-bg, Shadow: shadow-md
- 내부 Button(primary, 풀폭, size-button-lg)
- 선택적 캡션(caption, 버튼 위, 예: "파일은 최대 20MB까지 첨부할 수 있어요")
- 용도: 미션 상세 "제출하기/재제출", 내 자산 "새 자산 등록"

---

## EmptyState

- Height: hug
- 아이콘(icon-lg, color-text-disabled)
- 안내 문구(body-sm, color-text-muted)
- 용도: 홈(신규 멤버 — 최근 자료/스킬 없음), 스킬 라이브러리/허들링 픽(필터·검색 결과 없음), 내 자산(등록된 자산 없음)

---

## LoadingSpinner

- Height: fixed(icon-lg)
- color-primary 스트로크
- 화면 default → loading 전환 시 중앙 배치

---

## DeviceFrame

- 390 × 844, Height: fixed(844)
- 모든 화면의 최상위 프레임 (Figma Frame)

---

## Icon

- Height: fixed(icon-sm / icon-md / icon-lg) — 정사각 고정
- Library: lucide (버전 고정: lucide-static@0.475.0), CDN 에서 받는다 · 손으로 그리지 않는다
- Color: color-text (기본) / color-text-muted (비활성) / color-primary (활성 탭·강조)
- Icons: home / book-open / target / archive / star / search / chevron-right / chevron-left / bell / sparkles / lock / circle-check / filter / arrow-up-down
