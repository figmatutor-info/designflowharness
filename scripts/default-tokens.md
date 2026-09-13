# Default Tokens

모바일 앱 (iOS/Android, 390×844) 기준.
사용자가 아무것도 정하지 않아도 이 값으로 일관성이 보장된다.

design-rules-generator가 이 파일을 로드하여 초안을 생성하고,
사용자가 override한 값만 반영해 최종 design-rules.md를 만든다.

---

## A. 색상 (Color)

### Base

| 토큰            | 값      | 용도                 |
| --------------- | ------- | -------------------- |
| color-bg        | #FFFFFF | 기본 배경            |
| color-surface-1 | #F5F5F7 | 카드/시트 배경 (1층) |
| color-surface-2 | #E9E9EE | 강조 카드 배경 (2층) |
| color-border    | #E5E7EB | 구분선, 테두리       |

### Text

| 토큰                | 값      | 용도                  |
| ------------------- | ------- | --------------------- |
| color-text          | #111827 | 본문                  |
| color-text-muted    | #6B7280 | 보조 텍스트           |
| color-text-disabled | #9CA3AF | 비활성 텍스트         |
| color-text-inverse  | #FFFFFF | 어두운 배경 위 텍스트 |

### Brand

| 토큰                  | 값                 | 용도                          |
| --------------------- | ------------------ | ----------------------------- |
| color-primary         | #2563EB            | 주요 CTA, 강조                |
| color-primary-pressed | #1D4ED8            | CTA pressed 상태 (12% 어둡게) |
| color-primary-soft    | rgba(37,99,235,.1) | CTA soft 배경                 |

### System

| 토큰          | 값             | 용도             |
| ------------- | -------------- | ---------------- |
| color-danger  | #DC2626        | 위험, 에러, 삭제 |
| color-success | #16A34A        | 성공, 완료       |
| color-warning | #F59E0B        | 경고, 주의       |
| color-overlay | rgba(0,0,0,.5) | 모달, 시트, 로딩 |

---

## B. 간격 (Spacing)

**원칙: 모든 값은 4의 배수**

### Scale

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

## C. 타이포 (Typography)

### Font Family

| 토큰        | 값                                                |
| ----------- | ------------------------------------------------- |
| font-family | "Pretendard", -apple-system, "Roboto", sans-serif |

### Roles

**형식: 크기/굵기 (line-height는 제목 1.3, 본문 1.5 자동 적용)**

| 역할    | 크기/굵기 | 용도                     |
| ------- | --------- | ------------------------ |
| display | 28/700    | 큰 제목 (온보딩, 히어로) |
| h1      | 24/600    | 화면 제목                |
| h2      | 20/600    | 섹션 제목                |
| h3      | 17/600    | 카드 제목                |
| body    | 15/400    | 본문 (기본)              |
| body-sm | 14/400    | 본문 작은 것             |
| caption | 12/400    | 설명, 부가 정보          |
| label   | 13/500    | 버튼, 태그, 라벨         |

**최소 본문 크기: 14px** (가독성 확보)

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

## G. 모바일 특화 (필수)

| 토큰                | 값      | 용도                         |
| ------------------- | ------- | ---------------------------- |
| device-frame        | 390×844 | 기본 화면 크기 (iPhone 기준) |
| safe-area-top       | 44px    | 상태바 영역                  |
| safe-area-top-notch | 47px    | 노치 기기 상태바             |
| safe-area-bottom    | 34px    | 홈 인디케이터 영역           |
| tap-min             | 44×44px | 최소 터치 타겟 크기          |
| tap-gap-min         | 8px     | 인접 터치 타겟 최소 간격     |

---

## H. Z-Index (레이어 순서)

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

## 컴포넌트 기본값

### Button

| 속성     | 값                                     |
| -------- | -------------------------------------- |
| Variants | primary / secondary / ghost / danger   |
| Sizes    | sm(36) / md(44) / lg(52)               |
| States   | default / pressed / disabled / loading |
| Radius   | radius-md (8px)                        |
| Padding  | 좌우 space-4 (16px), 상하 자동         |

### Card

| 속성       | 값                              |
| ---------- | ------------------------------- |
| Padding    | space-4 (16px)                  |
| Radius     | radius-lg (12px)                |
| Shadow     | shadow-sm                       |
| Background | color-bg (또는 color-surface-1) |

### Input

| 속성    | 값                                 |
| ------- | ---------------------------------- |
| Height  | 44px (tap-min)                     |
| Padding | 좌우 space-4 (16px)                |
| Radius  | radius-md (8px)                    |
| Border  | 1px solid color-border             |
| States  | default / focus / error / disabled |

### Icon

| 속성    | 값             |
| ------- | -------------- |
| Sizes   | 16 / 20 / 24   |
| Stroke  | 1.5 / 1.75 / 2 |
| Library | lucide (권장)  |

### Tab Bar

| 속성      | 값                      |
| --------- | ----------------------- |
| Height    | 49px + safe-area-bottom |
| Tabs      | 3~5개                   |
| Icon size | 24                      |
| Label     | label (13/500)          |

### App Bar

| 속성    | 값                      |
| ------- | ----------------------- |
| Height  | 56px + safe-area-top    |
| Title   | h2 (20/600) 중앙 정렬   |
| Actions | 좌 뒤로 / 우 액션 0-2개 |

### Bottom Sheet

| 속성           | 값                      |
| -------------- | ----------------------- |
| Sizes          | half / full             |
| Radius         | radius-xl (16px) 상단만 |
| Grab bar       | 있음                    |
| Header         | 56px                    |
| Footer padding | + safe-area-bottom      |

---

## 규칙

### 절대 금지

- 4의 배수 아닌 spacing 값 사용
- 이 파일에 없는 색상 직접 하드코딩
- tap-min 44×44 미만의 탭 타겟
- safe-area 침범 (콘텐츠/고정 바)
- 화면당 primary 버튼 2개 이상

### 반드시 지킴

- 본문 텍스트 최소 14px
- 모든 색은 semantic 이름 사용 (color-purple-500 X, color-primary O)
- 모든 spacing은 space-* 토큰 사용
- 모든 텍스트는 role 지정 (h1/body/caption 등)

---

## 사용 예시

design-rules-generator가 이 파일을 로드하면:

1. 모든 토큰이 default로 세팅됨
2. 사용자가 override한 값만 사용자 설정으로 표시
3. 예: 사용자가 primary 색을 #FF6B35로 바꾸면
   → color-primary만 override, 나머지 기본값 유지
4. 최종 design-rules.md에 반영
