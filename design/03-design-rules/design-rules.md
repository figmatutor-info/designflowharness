---
status: confirmed
version: 1.0
created_at: 2026-09-13
confirmed_at: 2026-09-13 22:24:32
approved_by: user
based_on:
  - scripts/default-tokens.md (default)
  - design/01-references/analysis.md
  - design/02-structure/screens.md
  - design/02-structure/flows.md
  - PRD.md (§9 브랜드 방향)
---

# Design Rules ✅ CONFIRMED

**이 파일은 프로젝트의 규칙 SSOT입니다.**
**figma-builder의 유일한 스타일 입력이며, 확정 후 임의 수정 금지.**

여기에 없는 색·크기·간격·글꼴은 Figma에 만들지 않는다.
규칙을 바꿔야 하면 이 파일을 고치고 version 을 올린 뒤 재승인한다.

---

## A. 색상

### Brand (사용자 결정)

| 토큰                  | 값                  | 출처                   |
| --------------------- | ------------------- | ---------------------- |
| color-primary         | #7C3AED             | 사용자 결정 (바이올렛) |
| color-primary-pressed | #6D28D9             | 자동 파생 (12% 어둡게) |
| color-primary-soft    | rgba(124,58,237,.1) | 자동 파생 (10% 불투명) |

**선정 이유:** PRD §9 "따뜻하고 실험적 / 실험실 + 자산 라이브러리" 중 실험실 성격을 우선했다.
레퍼런스 3종(토스·디맨드·크몽)이 전부 블루 계열이라, 차별화를 위해 바이올렛을 채택했다.

### Base (default 구조 유지, 값은 analysis.md 패턴 10 반영)

| 토큰            | 값      | 출처                                                  |
| --------------- | ------- | ----------------------------------------------------- |
| color-bg        | #F7F5FB | analysis.md 패턴 10 (연한 surface 배경) 반영 override |
| color-surface-1 | #FFFFFF | analysis.md 패턴 10 (흰 카드 1층) 반영 override       |
| color-surface-2 | #F0EDF9 | 강조 카드/필드 배경 (2층), 자동 파생                  |
| color-border    | #E5E7EB | default                                               |

> **⚠️ default-tokens.md와 반전됨에 주의:** default는 `color-bg=흰색 / color-surface=연한 회색`이지만,
> 이 프로젝트는 analysis.md 패턴 10(디맨드: 연보라 배경 + 흰 카드)을 그대로 따르기 위해
> **배경(color-bg)을 연한 바이올렛 틴트, 카드(color-surface-1)를 흰색으로 반전**했다.
> 화면 규칙 참고.

### Text (default)

| 토큰                | 값      | 출처    |
| ------------------- | ------- | ------- |
| color-text          | #111827 | default |
| color-text-muted    | #6B7280 | default |
| color-text-disabled | #9CA3AF | default |
| color-text-inverse  | #FFFFFF | default |

### System (default)

| 토큰          | 값             | 출처    |
| ------------- | -------------- | ------- |
| color-danger  | #DC2626        | default |
| color-success | #16A34A        | default |
| color-warning | #F59E0B        | default |
| color-overlay | rgba(0,0,0,.5) | default |

---

## B. 간격

**원칙: 모든 값은 4의 배수 (default 그대로 사용)**

| 토큰     | 값   | 용도                     |
| -------- | ---- | ------------------------ |
| space-1  | 4px  | 최소 간격, 아이콘-텍스트 |
| space-2  | 8px  | 요소 내부, 밀도 높은 곳  |
| space-3  | 12px | 리스트 아이템 간격       |
| space-4  | 16px | 컴포넌트 표준 padding    |
| space-5  | 20px | 카드 내부 여유           |
| space-6  | 24px | 섹션 간격                |
| space-8  | 32px | 큰 섹션 간격             |
| space-12 | 48px | 화면 상하 여유           |

### 화면 규칙

| 토큰                 | 값   | 용도              |
| -------------------- | ---- | ----------------- |
| space-screen-padding | 16px | 화면 좌우 padding |
| space-section        | 24px | 섹션 간 간격      |
| space-card-padding   | 16px | 카드 내부 padding |
| space-list-gap       | 12px | 리스트 아이템 간  |

---

## C. 타이포

### Font Family

| 토큰        | 값                                                |
| ----------- | ------------------------------------------------- |
| font-family | "Pretendard", -apple-system, "Roboto", sans-serif |

### Roles (default, line-height: 제목 1.3 / 본문 1.5)

| role    | 크기/굵기 | 용도                     |
| ------- | --------- | ------------------------ |
| display | 28/700    | 큰 제목 (온보딩, 히어로) |
| h1      | 24/600    | 화면 제목                |
| h2      | 20/600    | 섹션 제목                |
| h3      | 17/600    | 카드 제목                |
| body    | 15/400    | 본문 (기본)              |
| body-sm | 14/400    | 본문 작은 것             |
| caption | 12/400    | 설명, 부가 정보          |
| label   | 13/500    | 버튼, 태그, 라벨         |

**최소 본문 크기: 14px** (body-sm) — body(15px)는 이를 만족.

---

## D. Radius

| 토큰        | 값     | 용도               |
| ----------- | ------ | ------------------ |
| radius-sm   | 4px    | 태그, 뱃지         |
| radius-md   | 8px    | 버튼, 인풋         |
| radius-lg   | 12px   | 카드               |
| radius-xl   | 16px   | 시트, 다이얼로그   |
| radius-full | 9999px | 원형 (아바타, FAB) |

---

## E. Shadow

| 토큰      | 값                         | 용도         |
| --------- | -------------------------- | ------------ |
| shadow-sm | 0 1px 2px rgba(0,0,0,.06)  | 카드         |
| shadow-md | 0 4px 12px rgba(0,0,0,.08) | 시트, 팝오버 |
| shadow-lg | 0 8px 24px rgba(0,0,0,.12) | 다이얼로그   |

---

## F. Motion

| 토큰        | 값             | 용도                |
| ----------- | -------------- | ------------------- |
| motion-fast | 150ms ease-out | 이미지 교체, 페이드 |
| motion-base | 200ms ease-out | 기본 전환           |
| motion-slow | 250ms ease-out | 시트 열림/닫힘      |

---

## G. 모바일 특화

| 토큰                | 값      | 용도                         |
| ------------------- | ------- | ---------------------------- |
| device-frame        | 390×844 | 기본 화면 크기 (iPhone 기준) |
| safe-area-top       | 44px    | 상태바 영역                  |
| safe-area-top-notch | 47px    | 노치 기기 상태바             |
| safe-area-bottom    | 34px    | 홈 인디케이터 영역           |
| tap-min             | 44×44px | 최소 터치 타겟 크기          |
| tap-gap-min         | 8px     | 인접 터치 타겟 최소 간격     |

---

## H. Z-Index

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

## 컴포넌트 규칙

**필요 컴포넌트 (screens.md "컴포넌트 목록 (전체 화면 통합)" 17개, 상세는 components.md 참조):**

Card · Badge · Chip · SearchBar · SegmentedControl · Button · ListRow · ProgressIndicator ·
EmptyState · Input · Tabs · BottomCTA · TabBar · SpecBox · PriceBlock · BottomActionBar · ExpandButton

**하단 CTA 2종 구분 (analysis.md 패턴 6 vs 19, screens.md 명시 사항 반영):**

- **BottomCTA** — primary filled + ghost 세로 2층. 폼/동의 화면용 (예: 미션 상세 제출). 높이 56 + safe-area-bottom(34).
- **BottomActionBar** — 찜 아이콘(정사각 outlined) + 보조 outlined + 주 filled 가로 3분할. 마켓/상세 화면용 (예: 픽 상세, 참고).

**Badge 3종 (analysis.md 패턴 12):**

- 시간형 — D-day. 여유(soft primary) ↔ 임박(danger filled) 전환.
- 분류형 — 카테고리/무료·유료/visibility·review_status. color-primary-soft 배경 + color-primary 텍스트.
- 속성형 — 난이도 등 중립 속성. 회색(color-surface-2 배경 + color-text-muted 텍스트), 상태 전환 없음.

---

## 화면 규칙

- Frame: 390 × 844 (iPhone 기준)
- Safe area: 상단 44 / 하단 34
- Tap target: 최소 44 × 44
- Primary CTA: 화면당 1개
- Bottom Sheet radius: radius-xl 상단만
- Modal overlay: color-overlay

### 배경 2층 구조 (analysis.md 패턴 10 필수 적용)

- 화면 전체 배경: **color-bg (#F7F5FB, 연한 바이올렛 틴트)**
- 그 위에 얹는 모든 카드/리스트 컨테이너: **color-surface-1 (#FFFFFF, 흰색)** + shadow-sm 최소 사용
- 카드 내부 강조 블록(SpecBox, filled Input 등): color-surface-2 (#F0EDF9)
- 예외: 미션 상세(③)의 SpecBox, 내 자산(④) 등록 폼의 Input은 흰 카드 안에서 다시 한 단계
  들어간 회색 필드로 보이도록 color-surface-2를 쓴다 (패턴 18 스펙 박스, 패턴 15 필드).

---

## 근거 (Phase 1, 2 반영)

### analysis.md에서 반영한 것

- 패턴 1 (진행 상태 최상단 수치) → 홈 미션 카드 ProgressIndicator, 미션 상세 D-day
- 패턴 2 (카드 = 정보 + 액션) → 홈 미션/자산 카드 하단 액션 링크 구조
- 패턴 3 (검색바 → 필터 칩 → 리스트) → 스킬 라이브러리, 허들링 픽 3단 고정 구조
- 패턴 4 (결과 총 건수 표시) → 스킬 라이브러리·내 자산·허들링 픽 리스트 상단
- 패턴 6 vs 19 (하단 CTA 2종) → BottomCTA(폼/동의) vs BottomActionBar(마켓) 컴포넌트 분리
- 패턴 7 (조건 미충족 시 CTA disabled 유지) → Button disabled state, 화면당 CTA 자리 고정
- 패턴 8 (빈 상태 문장 한 줄) → EmptyState 컴포넌트
- 패턴 9 (컬러는 액션/상태에만) → color-primary는 화면당 CTA 1곳 + 배지로 제한
- 패턴 10 (연한 배경 + 흰 카드 2층) → color-bg/color-surface-1 반전 override, "배경 2층 구조" 절
- 패턴 11 (여백을 채우지 않는다) → 내 자산 초기 상태 레이아웃 원칙
- 패턴 12 (상태 배지 2종 체계) → Badge 3종(시간형/분류형/속성형) 정의
- 패턴 13 (리스트 행 구조) → ListRow 컴포넌트
- 패턴 14 (토글 filled↔outlined) → 찜 Button 토글 variant
- 패턴 15 (라벨 내장 filled 필드 + 2열) → Input 컴포넌트, 등록 폼 참고 구조
- 패턴 17~20 (마켓 상세 결정 요소·스펙 박스·3분할 액션바·더보기) → SpecBox, BottomActionBar, ExpandButton
- 패턴 21 (선택 카드 + 개수 병기 CTA) → 구조로 남김 (시연 범위 밖)

### screens.md / flows.md에서 반영한 것

- 필요 컴포넌트 17개 전부 components.md에 정의
- 화면 5개(홈/스킬 라이브러리/미션 상세/내 자산/허들링 픽) 상태: default / loading / empty / submitting / error
- 시나리오 1~3의 화면 간 이동, 배지 상태 전환(작성중→제출완료→피드백대기→승인, 비공개→판매신청중→판매중) 반영

### 가정 로그 (default 사용)

- 타이포 스케일, Radius, Shadow, Motion, Z-Index → 전부 default 값 그대로 사용 (사용자 요청 없음)
- Icon/Tab Bar/App Bar/Bottom Sheet 기본값 → default-tokens.md "컴포넌트 기본값" 그대로 적용
- Gumroad/해외 크리에이터 마켓 결제 표현 근거 없음 → 크몽 패턴(17~20) 기준으로 대체 (analysis.md 가정 로그 승계)
- 신규 자산 기본 visibility "비공개" → flows.md 가정 승계
