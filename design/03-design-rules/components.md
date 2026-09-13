# 컴포넌트 규칙 상세

design-rules.md "컴포넌트 규칙" 섹션의 상세. screens.md "컴포넌트 목록 (전체 화면 통합)" 17개를 전부 정의한다.
모든 색상/간격/타이포/Radius/Shadow 값은 design-rules.md A~H 토큰만 참조한다.

---

## Button

### Anatomy

- Container (padding, radius, background)
- Icon (선택, 좌/우, 16-24px)
- Label (label role, 13/500)

### Variants

#### primary

- background: color-primary
- text: color-text-inverse
- pressed: color-primary-pressed
- 사용: 화면당 CTA 1개 (제출하기, 새 자산 등록, 구매하기)

#### secondary (outlined)

- background: color-surface-1
- text: color-text
- border: 1px solid color-border
- 사용: 부가 액션 (BottomActionBar의 "문의하기" 등)

#### ghost

- background: transparent
- text: color-primary
- border: 없음
- 사용: 텍스트 링크형 보조 액션 (BottomCTA의 "임시저장")

#### danger

- background: color-danger
- text: color-text-inverse
- 사용: 삭제 등 위험 액션

#### toggle (찜 전용 — 패턴 14)

- 기본(찜 안 함): outlined — border 1px solid color-border, icon color-text-muted
- 활성(찜함): filled — background color-primary, icon color-text-inverse
- motion-fast로 전환

### Sizes

| Size | Height | Padding            | Icon |
| ---- | ------ | ------------------ | ---- |
| sm   | 36px   | 좌우 space-3(12px) | 16px |
| md   | 44px   | 좌우 space-4(16px) | 20px |
| lg   | 52px   | 좌우 space-5(20px) | 24px |

### States

- default: 기본
- pressed: primary → primary-pressed 배경 (또는 secondary/ghost는 background color-surface-2로 살짝 어둡게)
- disabled: opacity 40%, 상호작용 없음. **자리는 사라지지 않고 유지** (패턴 7)
- loading: 텍스트 자리에 spinner + 텍스트 opacity 60%

---

## Card

### Anatomy

- Container (padding, radius, shadow, background)
- 내부는 화면별로 3가지 서브타입

### Variants

#### 미션형 (홈 ①, 미션 상세 ③ 관련 스킬 추천)

- 상단: ProgressIndicator + Badge(D-day) 우측 정렬
- 본문: h3 제목 + body 설명
- 하단: 텍스트 링크 액션 행 (패턴 2)

#### 스킬형 (스킬 라이브러리 ②)

- 좌측 썸네일(라운드 사각) + 우측 텍스트 블록(h3 제목 + Badge 2종: 난이도 속성형 + 무료/유료 분류형)

#### 자산형 (내 자산 ④, 허들링 픽 ⑤)

- 썸네일 + h3 제목 + PriceBlock(⑤만 해당) + Badge(분류형: visibility/review_status 또는 카테고리)

### 공통 속성

| 속성       | 값                                            |
| ---------- | --------------------------------------------- |
| Padding    | space-4(16px), 여유 필요 시 space-5(20px)     |
| Radius     | radius-lg (12px)                              |
| Shadow     | shadow-sm                                     |
| Background | color-surface-1 (흰색, 화면 배경 color-bg 위) |

---

## Badge

3종 체계 (analysis.md 패턴 12, design-rules.md "컴포넌트 규칙" 참조).

### 시간형 (D-day)

- 여유: background color-primary-soft, text color-primary
- 임박(당일/1일 이내): background color-danger, text color-text-inverse
- motion-fast로 상태 전환 (soft ↔ danger filled)

### 분류형

- background: color-primary-soft
- text: color-primary
- 예: 카테고리, 무료/유료, visibility/review_status(비공개/신청중/판매중), 제출 상태(작성중/제출완료/피드백대기/승인)

### 속성형

- background: color-surface-2
- text: color-text-muted
- 상태 전환 없음 (정적 속성만 표시)
- 예: 난이도(초급/중급/고급)

### 공통

| 속성    | 값                 |
| ------- | ------------------ |
| Height  | 20-24px            |
| Padding | 좌우 space-2(8px)  |
| Radius  | radius-sm (4px)    |
| Text    | caption 또는 label |

---

## Chip

### Anatomy

- 텍스트 단독 또는 텍스트 + 아이콘

### States

- 선택: background color-primary, text color-text-inverse (filled)
- 미선택: background color-surface-1, border 1px solid color-border, text color-text

### 속성

| 속성    | 값                                |
| ------- | --------------------------------- |
| Height  | 36px (tap-min 근접)               |
| Padding | 좌우 space-3(12px)                |
| Radius  | radius-full (9999px)              |
| Text    | label (13/500)                    |
| Gap     | 칩 사이 space-2(8px), 가로 스크롤 |

용도: 카테고리 필터(②④⑤), 상태 필터(④)

---

## SearchBar

### Anatomy

- 검색 아이콘(좌) + placeholder/입력 텍스트 + (선택) 클리어 아이콘(우)

### 속성

| 속성       | 값                                          |
| ---------- | ------------------------------------------- |
| Height     | 44px (tap-min)                              |
| Padding    | 좌우 space-4(16px)                          |
| Radius     | radius-md (8px)                             |
| Background | color-surface-2                             |
| Border     | 없음 (filled 스타일, 패턴 15 참조)          |
| Text       | body (15/400), placeholder color-text-muted |

용도: 스킬 라이브러리(②), 허들링 픽(⑤) 상단 고정

---

## SegmentedControl

### Anatomy

- 2~3개 세그먼트, pill 형태 컨테이너 안에 개별 세그먼트

### States

- 선택: background color-primary, text color-text-inverse
- 미선택: background transparent, text color-text-muted

### 속성

| 속성      | 값                                      |
| --------- | --------------------------------------- |
| Height    | 36px                                    |
| Container | background color-surface-2, radius-full |
| Segment   | radius-full, padding 좌우 space-3(12px) |
| Text      | label (13/500)                          |

용도: 난이도 필터(②, 2~3분할), 정렬 옵션(⑤: 최신순/인기순/가격순)

---

## ListRow

### Anatomy (패턴 13)

- 좌: 썸네일 (원형 또는 라운드 사각, 40-48px). 이미지 없으면 컬러 배경 라운드 사각으로 대체
- 중: 제목(h3 또는 body 볼드) + 메타 한 줄(caption, 중점 `·` 구분)
- 우: 액션 버튼 또는 Badge

### 속성

| 속성    | 값                                     |
| ------- | -------------------------------------- |
| Height  | 최소 tap-min(44px), 내용에 따라 가변   |
| Padding | space-3(12px) 상하, space-4(16px) 좌우 |
| Gap     | 아이템 간 space-list-gap(12px)         |
| Divider | 1px solid color-border (선택)          |

용도: 홈 최근 학습 자료·알림(①), 내 자산 리스트(④)

---

## ProgressIndicator

### Anatomy (패턴 1)

- 곡선 또는 직선 프로그레스 바 + 수치(%) 텍스트 병기

### 속성

| 속성        | 값                                |
| ----------- | --------------------------------- |
| Track       | color-surface-2                   |
| Fill        | color-primary                     |
| 수치 텍스트 | h2 또는 h3 볼드, 카드 최상단 배치 |

용도: 홈 미션 카드(①)

---

## EmptyState

### Anatomy (패턴 8)

- 문장 한 줄 (caption 또는 body, color-text-muted), 중앙 정렬
- 일러스트/버튼 없음 (원칙: 여백 자체가 정보)

### 속성

| 속성    | 값                                |
| ------- | --------------------------------- |
| Padding | 상하 space-12(48px)               |
| Text    | body, color-text-muted, 중앙 정렬 |

용도: 홈(①)·스킬 라이브러리(②)·내 자산(④)·허들링 픽(⑤) 빈 상태

---

## Input

### Anatomy (패턴 15)

- 라벨 내장형 filled 박스: 상단에 작은 라벨(caption), 하단에 값/placeholder(body)
- 2열 그리드 지원 (짧은 값 2개 나란히 배치 가능)

### 속성

| 속성       | 값                                                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Height     | 44px (tap-min), 라벨 포함 시 56px                                                                                             |
| Padding    | 좌우 space-4(16px)                                                                                                            |
| Radius     | radius-md (8px)                                                                                                               |
| Background | color-surface-2 (filled, border 없음)                                                                                         |
| States     | default / focus(border 1px solid color-primary) / error(border 1px solid color-danger, 하단 caption로 에러 메시지) / disabled |

용도: 내 자산(④) 등록 폼 참고 구조 (시연 범위 밖이나 구조 유지)

---

## Tabs

### Anatomy (언더라인형, 패턴 5)

- 탭 라벨 나열, 선택 탭만 하단 2px 언더라인 + 볼드

### 속성

| 속성   | 값                                                             |
| ------ | -------------------------------------------------------------- |
| 선택   | text color-text, font-weight 600, 하단 2px solid color-primary |
| 미선택 | text color-text-muted, font-weight 400                         |
| Height | 44px                                                           |

용도: 시연 범위 밖 구조 유지 (통합 검색 축 분리 대비)

---

## BottomCTA

primary + ghost 세로 2층 (analysis.md 패턴 6). **폼/동의 화면 전용.**

### Anatomy

- 상단: Button(primary, lg, 풀폭) — 예: "제출하기"
- 하단: Button(ghost, md, 풀폭 텍스트형) — 예: "임시저장"

### 속성

| 속성       | 값                                                |
| ---------- | ------------------------------------------------- |
| Height     | 56px(버튼 2개 + 간격) + safe-area-bottom(34px)    |
| Padding    | space-4(16px) 상/좌우                             |
| Gap        | 버튼 사이 space-2(8px)                            |
| Background | color-surface-1 + shadow-md (화면 콘텐츠 위 고정) |

disabled 시에도 자리를 유지한다 (패턴 7). 용도: 미션 상세(③) 제출하기+임시저장.

---

## TabBar

### Anatomy

- 3~5개 탭: 아이콘(24px) + 라벨(label, 13/500)

### 속성

| 속성    | 값                            |
| ------- | ----------------------------- |
| Height  | 49px + safe-area-bottom(34px) |
| 선택    | icon/text color-primary       |
| 미선택  | icon/text color-text-muted    |
| z-index | z-tab-bar (200)               |

용도: 홈/스킬 라이브러리/내 자산/허들링 픽 공통 하단 내비게이션 (①②④⑤)

---

## SpecBox

좌 라벨 / 우 값 2열, 회색 filled (analysis.md 패턴 18).

### Anatomy

- 각 행: 좌측 라벨(body, color-text-muted) / 우측 값(body, color-text, 볼드 가능)
- 여러 행을 하나의 filled 박스 안에 쌓음

### 속성

| 속성       | 값              |
| ---------- | --------------- |
| Background | color-surface-2 |
| Radius     | radius-md (8px) |
| Padding    | space-4(16px)   |
| 행 간격    | space-2(8px)    |

용도: 미션 상세(③) 요구 산출물, 허들링 픽 상세(⑤ 참고) 포함 내용

---

## PriceBlock

금액 + 부가 안내 한 줄.

### Anatomy

- 금액: h3 또는 h2 볼드, color-text
- 부가 안내(선택): caption, color-text-muted (예: "VAT 포함", 수수료 안내)

### 속성

| 속성 | 값                          |
| ---- | --------------------------- |
| Gap  | 금액-안내 사이 space-1(4px) |

용도: 허들링 픽(⑤) 카드/그리드, 픽 상세(⑤ 참고) 가격 표시

---

## BottomActionBar

찜 + 보조 outlined + 주 filled 3분할 (analysis.md 패턴 19). **마켓/상세 화면 전용.**

### Anatomy

- 좌: Button(toggle, 정사각, outlined↔filled) — 찜 아이콘만, 폭 최소(예: 52px)
- 중: Button(secondary/outlined) — 보조 액션 (예: "문의하기")
- 우: Button(primary, filled) — 주 액션 (예: "구매하기"), **가장 넓은 폭**

### 속성

| 속성       | 값                                                  |
| ---------- | --------------------------------------------------- |
| Height     | 56px + safe-area-bottom(34px)                       |
| Padding    | space-4(16px) 좌우                                  |
| Gap        | 버튼 사이 space-2(8px)                              |
| Background | color-surface-1 + shadow-md                         |
| 폭 비율    | 찜(고정 최소) : 보조(1) : 주(가장 넓게, 1.5배 이상) |

BottomCTA(세로 2층)와 절대 혼용하지 않는다. 용도: 허들링 픽 상세(⑤ 참고, 시연 범위 밖 구조 유지).

---

## ExpandButton

더보기 풀폭 outlined (analysis.md 패턴 20).

### Anatomy

- 풀폭 버튼, 텍스트 "더보기" 또는 "더보기 (N)" + 하단 화살표 아이콘

### 속성

| 속성   | 값                                                        |
| ------ | --------------------------------------------------------- |
| Height | 44px (tap-min)                                            |
| Border | 1px solid color-border (outlined, background transparent) |
| Text   | label (13/500), color-text                                |
| 위치   | 접힌 콘텐츠 바로 아래, 풀폭                               |

탭 시 콘텐츠 펼침 + motion-base 전환, 버튼 텍스트 "접기"로 전환(선택).

용도: 미션 상세(③) 이전 피드백 기록, 허들링 픽 상세(⑤ 참고) 판매자 소개
