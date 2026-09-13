# Design Tokens 상세

design-rules.md의 A~H 섹션 상세 정보. Figma 변수/코드 토큰 생성 시 이 파일을 근거로 한다.

---

## 색상 팔레트

### Primitives (raw, Figma 변수의 primitive 레이어에만 사용)

| primitive   | 값      |
| ----------- | ------- |
| violet-50   | #F7F5FB |
| violet-100  | #F0EDF9 |
| violet-500  | #7C3AED |
| violet-600  | #6D28D9 |
| violet-700  | #5B21B6 |
| neutral-0   | #FFFFFF |
| neutral-100 | #F5F5F7 |
| neutral-200 | #E9E9EE |
| neutral-300 | #E5E7EB |
| neutral-500 | #9CA3AF |
| neutral-600 | #6B7280 |
| neutral-900 | #111827 |
| red-600     | #DC2626 |
| green-600   | #16A34A |
| amber-500   | #F59E0B |

> primitive 이름은 raw 색상값 참조용으로만 tokens.md에 존재한다.
> design-rules.md §A, components.md, 실제 컴포넌트 스타일에는 절대 등장하지 않는다 —
> 항상 semantic 이름(color-primary 등)만 사용한다.

### Semantic 매핑

| semantic              | → primitive              | 결정 방식                      |
| --------------------- | ------------------------ | ------------------------------ |
| color-primary         | violet-500               | 사용자 결정                    |
| color-primary-pressed | violet-600               | 자동 파생 (12% 어둡게)         |
| color-primary-soft    | violet-500 @ 10% opacity | 자동 파생                      |
| color-bg              | violet-50                | override (analysis.md 패턴 10) |
| color-surface-1       | neutral-0                | override (analysis.md 패턴 10) |
| color-surface-2       | violet-100               | 자동 파생 (강조 카드/필드 2층) |
| color-border          | neutral-300              | default                        |
| color-text            | neutral-900              | default                        |
| color-text-muted      | neutral-600              | default                        |
| color-text-disabled   | neutral-500              | default                        |
| color-text-inverse    | neutral-0                | default                        |
| color-danger          | red-600                  | default                        |
| color-success         | green-600                | default                        |
| color-warning         | amber-500                | default                        |
| color-overlay         | rgba(0,0,0,.5)           | default                        |

### 사용 가이드

- color-primary는 화면당 CTA 1곳 + 상태 배지에만 쓴다 (analysis.md 패턴 9). 장식용으로 남발하지 않는다.
- color-primary-pressed는 Button pressed state 전용. 다른 곳에 쓰지 않는다.
- color-primary-soft는 D-day 여유 배지, 분류형 배지 배경 전용.
- color-bg(violet-50)는 화면 최상위 배경에만. 카드/리스트 행 내부에는 쓰지 않는다.
- color-surface-1(흰색)은 모든 카드·바텀시트·리스트 컨테이너의 기본 배경.
- color-surface-2(violet-100)는 SpecBox, filled Input, 속성형 배지 배경 등 "카드 안에서 한 단계 더 들어간 블록"에만.
- color-text-muted는 메타 정보(작성자, 날짜, 캡션)에만. 본문에 쓰지 않는다.
- color-danger는 삭제/에러/임박 배지 외 사용 금지.

---

## 간격 스케일 상세

| 토큰     | 값   | 실무 적용                                                                       |
| -------- | ---- | ------------------------------------------------------------------------------- |
| space-1  | 4px  | 아이콘-라벨 사이, 배지 내부 padding                                             |
| space-2  | 8px  | Chip 내부 padding, 아이콘 버튼 내부 여백                                        |
| space-3  | 12px | ListRow 아이템 간 간격(space-list-gap), 카드 내부 요소 간                       |
| space-4  | 16px | 화면 좌우 padding(space-screen-padding), 카드 내부 padding, Button 좌우 padding |
| space-5  | 20px | Card 내부 여유(요소 많은 카드)                                                  |
| space-6  | 24px | 섹션 간 간격(space-section)                                                     |
| space-8  | 32px | 큰 섹션 구분(예: 홈 화면 블록 간)                                               |
| space-12 | 48px | 화면 상단/하단 여백, EmptyState 상하 여백                                       |

모든 값은 4의 배수 원칙을 따른다. 새 값이 필요하면 이 스케일 안에서만 고른다 (임의 px 금지).

---

## 타이포 상세

### Pretendard 폰트

- 웹 폰트 소스: Pretendard (CDN 또는 자체 호스팅)
- fallback: `-apple-system, "Roboto", sans-serif`
- iOS: -apple-system 우선 렌더, Android: Roboto 우선 렌더 (Pretendard 미로드 시)

### Role별 상세

| role    | 크기 | 굵기 | line-height | 용도                                          |
| ------- | ---- | ---- | ----------- | --------------------------------------------- |
| display | 28px | 700  | 1.3         | 온보딩 히어로, 없음(시연 범위 내 미사용 가능) |
| h1      | 24px | 600  | 1.3         | 화면 타이틀 (앱바 없이 최상단 제목)           |
| h2      | 20px | 600  | 1.3         | 섹션 제목 (예: "최근 학습한 자료")            |
| h3      | 17px | 600  | 1.3         | 카드 제목 (미션명, 스킬명, 자산명)            |
| body    | 15px | 400  | 1.5         | 본문 기본 (설명, 리스트 메타)                 |
| body-sm | 14px | 400  | 1.5         | 본문 중 덜 중요한 것 (부가 설명)              |
| caption | 12px | 400  | 1.5         | 타임스탬프, 카운트, 각주                      |
| label   | 13px | 500  | 1.5         | Button 텍스트, Badge/Chip 텍스트              |

### 사용 규칙

- 모든 텍스트는 반드시 role 중 하나로 지정한다 (임의 px 금지).
- 본문은 body-sm(14px) 미만으로 내려가지 않는다.
- 숫자 강조(진행률, 가격, 총 건수)는 h2 또는 h3 + 굵게로, 별도 role 신설하지 않는다.

---

## Motion 원칙

- **motion-fast (150ms ease-out)**: 이미지 로드/교체, Badge 상태 전환(soft↔danger), 찜 토글(outlined↔filled)
- **motion-base (200ms ease-out)**: 화면 전환, 필터 칩 선택 반응, 탭 전환
- **motion-slow (250ms ease-out)**: BottomSheet/Bottom CTA 등장, 제출 상태(submitting) 오버레이

원칙: 상태가 "정보성"으로 바뀔 때는 fast, "레이아웃"이 바뀔 때는 base, "레이어"가 새로 뜰 때는 slow.
