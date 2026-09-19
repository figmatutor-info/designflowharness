# 컴포넌트 규칙 상세

**상태:** design-rules.md 가 status: confirmed (v1.0, 2026-09-19) 로 확정됨. 이 문서는 그 상세다.
design-rules.md 의 컴포넌트 섹션 요약을 화면별 적용 맥락과 함께 풀어 쓴다.

## Button

### Anatomy

- Container (padding, radius, background)
- Icon (선택, 좌/우)
- Label

### Variants

#### primary

- background: color-primary
- text: color-text-inverse
- 사용: 화면당 1개 CTA (예: 미션 상세 BottomActionBar 안의 "제출하기", CenterModal 확정 버튼)

#### secondary

- background: color-surface-1
- text: color-text
- border: 1px solid color-border
- 사용: 부가 액션, 내 자산 화면의 인라인 "새 자산 등록"

#### ghost

- background: transparent
- text: color-primary
- 사용: 텍스트 링크 대체 (이전 피드백 기록 펼쳐보기 등)

#### danger

- background: color-danger
- text: color-text-inverse
- 사용: 없음 (본 5화면 시연 범위에는 삭제류 액션 없음 — 확장 대비 정의만 유지)

### Sizes

| Size | Height (semantic)   | Padding           | Icon    |
| ---- | ------------------- | ----------------- | ------- |
| sm   | size-button-sm (36) | 좌우 space-3 (12) | icon-sm |
| md   | size-button-md (44) | 좌우 space-4 (16) | icon-md |
| lg   | size-button-lg (52) | 좌우 space-5 (20) | icon-lg |

### States

- default: 기본
- pressed: color-primary-pressed 배경
- disabled: opacity 40%, 상호작용 없음
- loading: spinner(LoadingSpinner) + 텍스트 흐리게 (미션 상세 submitting 상태)

## MissionCard

- Variants: default(사용 안 함, Card로 대체) / highlight
- highlight 구성: 진행률 바(ProgressBar, color-primary 채움 + color-border 트랙) + D-day StatusBadge(color-warning) + 제목(h3) + 부제(body-sm)
- background: color-primary-soft, border: 1px solid color-primary
- Radius: radius-card, Padding: space-card-padding, Height: hug
- 레이어 이름: `MissionCard/primary` (화면당 1개만 인스턴스화)
- 잠금/empty 상태: 미션 미배정 시 EmptyState 로 대체 (카드 자체를 만들지 않음)

## Card

- 용도: 최근 학습자료, 최근 스킬 카드(SkillCard 재사용) 컨테이너 wrapper
- background: color-surface-1, Radius: radius-card, Shadow: shadow-sm
- Padding: space-card-padding, Height: hug

## SkillCard

- 구성: 제목(h3) + 카테고리 태그(StatusBadge, color-surface-2 배경) + 난이도 뱃지(초급/중급/고급, StatusBadge) + 도구 태그(caption) + 무료/유료 뱃지(StatusBadge, 유료는 color-primary-soft)
- 이미지: 없음 — 텍스트 중심
- 모든 인스턴스 동일 가중치 (강조 없음), Radius: radius-card, Height: hug

## AssetCard

- 구성: 썸네일(Img slot 1:1) 좌상단에 StatusBadge 오버레이(비공개/멤버공개/판매신청중/판매중) + 제목(h3) + 카테고리(caption)
- 상태별 색: 비공개(color-text-muted 배경), 멤버공개(color-primary-soft), 판매신청중(color-warning), 판매중(color-success)
- Radius: radius-card, Height: hug

## PickCard

- 구성: 이미지(Img slot 4:3) 위 가격(우상단)·카테고리(좌하단) StatusBadge 오버레이 + 제목(h3) + 제작자(caption)
- Radius: radius-card, Height: hug
- 모든 인스턴스 동일 가중치

## SearchBar

- Height: hug, 내부 인풋 최소 높이 size-tap-min
- Background: color-surface-1, Radius: radius-button
- Icon: lucide/search (좌측), placeholder는 body-sm + color-text-muted
- sticky top, z-sticky

## FilterChip

- Height: fixed(size-tap-min) — 탭 타겟 규칙 예외
- Radius: radius-pill
- default: background color-surface-1, text color-text
- selected: background color-primary, text color-text-inverse
- 인접 칩 간격: space-tap-gap-min 이상

## SegmentedTab

- Height: fixed(size-tap-min)
- Radius: radius-button (컨테이너), 선택된 세그먼트만 color-bg 배경 + shadow-sm
- 미선택 세그먼트: color-surface-1, text color-text-muted
- 용도: 허들링 픽 정렬(최신순/인기순/가격순) — 3개 옵션

## StatusBadge

### 텍스트형 (미션 제출 상태)

- 작성 중: color-surface-2 배경, color-text-muted 텍스트
- 제출 완료: color-primary-soft 배경, color-primary 텍스트
- 피드백 대기: color-warning 배경(연하게), color-text 텍스트
- 승인: color-success 배경, color-text-inverse 텍스트

### 이미지 오버레이형 (자산/픽 상태)

- 배경: color-overlay 위에 얹는 반투명 박스, 텍스트 color-text-inverse
- Radius: radius-tag

## SummaryBox

- background: color-surface-2, Radius: radius-card, Padding: space-card-padding
- 구성: 판매 수익 숫자(h2, 강조) + 설명(caption) + CTA 링크(ghost Button)

## MultiSelectGrid

- 컨테이너: Height hug, 그리드 gap space-list-gap
- 타일: fixed(size-tap-min) 이상 정사각, Radius: radius-button
- 선택 순서 배지: 좌상단 원형(radius-pill), color-primary 배경 + 숫자
- 하단: 선택 개수만큼 "N개 선택 완료" Button(primary, md) sticky 노출

## BottomActionBar

- Height: fixed(size-button-lg + safe-area-bottom)
- Background: color-bg, 상단 1px color-border, shadow-md
- 구성: Button(primary, lg) 1개, 좌우 padding space-screen-padding
- 전용 화면: 미션 상세만 (내 자산 등의 탭바 루트 화면에는 배치하지 않음)

## CenterModal

- Height: hug, Radius: radius-sheet, Background: color-bg
- Overlay: color-overlay, z-index: z-dialog
- 구성: 제목(h3, 선택) + 설명(body) + 2버튼(좌 secondary "취소" / 우 primary "확정")
- 용도: 미션 제출 확인

## BottomTabBar

- Height: fixed(tab-bar-height + safe-area-bottom)
- Background: color-bg, 상단 1px color-border
- 5개 탭: 홈(home) / 스킬 라이브러리(book-open) / 미션(target) / 내 자산(archive) / 허들링 픽(store)
- 아이콘: icon-lg, 라벨: label, 선택 탭: color-primary / 미선택: color-text-muted
- 배지: color-danger 원형 + color-text-inverse 숫자 (caption 크기)

## EmptyState

- Height: hug, 아이콘 icon-lg(color-text-disabled) + 안내(body-sm, color-text-muted)
- 사용: 홈(미션 미배정), 스킬 라이브러리(검색결과 0), 내 자산(필터결과 0), 허들링 픽(카테고리결과 0)

## LoadingSpinner

- Height: fixed(icon-lg), color: color-primary
- 전 화면 공용 loading 상태에서 콘텐츠 영역 중앙 배치

## Icon

- Sizes: icon-sm(16) / icon-md(20) / icon-lg(24)
- Library: lucide, CDN: `https://cdn.jsdelivr.net/npm/lucide-static@1.47.0/icons/{name}.svg`
- 사용 아이콘: home, book-open, target, archive, store, search, bell, chevron-right, chevron-down, x, arrow-left, chevron-left

## App Bar

- Height: fixed(app-bar-height + safe-area-top)
- Background: color-bg, 하단 1px color-border
- 좌측: 뒤로가기 버튼 — lucide/chevron-left, icon-lg, 탭 타겟 size-tap-min 확보
- 중앙: 제목(h2, 20/600)
- 적용 화면: 미션 상세 전용 (홈/스킬 라이브러리/내 자산/허들링 픽은 탭바 루트 화면이라 App Bar 대신 단순 타이틀 영역만 사용)
- z-index: z-app-bar (200)
