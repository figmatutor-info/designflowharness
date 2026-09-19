# Design Tokens 상세

**상태:** design-rules.md 가 status: confirmed (v1.0, 2026-09-19) 로 확정됨. 이 문서는 그 상세다.
브랜드 컬러는 사용자가 default(#2563EB) 유지를 확정했다 (2026-09-19).

design-rules.md의 A~H 섹션 상세 정보. (§I 이미지는 design-rules.md 에만 둔다)

## 토큰 계층

이 프로젝트의 토큰은 2계층이다.

```
Primitive (값)          Semantic (의도)          컴포넌트·화면
brand-500 = #2563EB ←── color-primary       ←──  MissionCard(highlight).border
neutral-900 = #111827 ← color-text          ←──  Text.fill
space-4 = 16          ← space-card-padding  ←──  Card.padding
```

- Primitive 이름: 색조 + 단계 (`brand-500`, `neutral-900`)
- Semantic 이름: 역할 (`color-primary`, `radius-card`)
- **컴포넌트·화면은 semantic 만 바인딩한다.**

## 색상 팔레트

### Primitive (값을 가진 유일한 계층)

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

### Semantic 매핑 (전부 참조)

| Semantic              | → Primitive        | 사용 가이드                                |
| --------------------- | ------------------ | ------------------------------------------ |
| color-bg              | {neutral-0}        | 기본 배경                                  |
| color-surface-1       | {neutral-50}       | 카드/시트 배경                             |
| color-surface-2       | {neutral-100}      | 강조 카드 배경, SummaryBox                 |
| color-border          | {neutral-200}      | 구분선, BottomActionBar 상단 경계          |
| color-text            | {neutral-900}      | 본문                                       |
| color-text-muted      | {neutral-500}      | 부가 정보에만                              |
| color-text-disabled   | {neutral-400}      | 비활성 텍스트, EmptyState 아이콘           |
| color-text-inverse    | {neutral-0}        | 어두운 배경 위 텍스트                      |
| color-primary         | {brand-500}        | 화면당 1곳 CTA 에만, MissionCard highlight |
| color-primary-pressed | {brand-600}        | pressed 상태                               |
| color-primary-soft    | {brand-50}         | soft 배경                                  |
| color-danger          | {red-600}          | 위험, 에러, submit error 상태              |
| color-success         | {green-600}        | 승인 상태 뱃지                             |
| color-warning         | {amber-500}        | D-day 뱃지                                 |
| color-overlay         | {overlay-black-50} | CenterModal 딤                             |

### 왜 2계층인가

- 리브랜딩 시 `brand-500` 하나만 바꾸면 semantic 3개가 자동으로 따라온다
- 다크모드 추가 시 primitive 컬렉션에 모드만 추가하면 된다
- semantic 이름이 의도를 말하므로 화면을 읽을 때 "왜 이 색인지"가 드러난다

## 간격 스케일 상세

| Primitive | 값   | Semantic                                 | 참조      | 용도                          |
| --------- | ---- | ---------------------------------------- | --------- | ----------------------------- |
| space-1   | 4px  | space-inline                             | {space-1} | 아이콘-텍스트 간              |
| space-2   | 8px  | space-tap-gap-min                        | {space-2} | 인접 탭 타겟 최소             |
| space-3   | 12px | space-list-gap                           | {space-3} | 리스트 아이템 간              |
| space-4   | 16px | space-screen-padding, space-card-padding | {space-4} | 화면 좌우 padding / 카드 내부 |
| space-6   | 24px | space-section                            | {space-6} | 섹션 간 간격                  |
| space-8   | 32px | —                                        | —         | 예비 (큰 여백)                |
| space-12  | 48px | —                                        | —         | 예비 (최대 단위)              |

## 타이포 상세

### Pretendard 폰트

- 웹 폰트 소스: Pretendard (CDN 또는 self-host)
- fallback: -apple-system, "Roboto", sans-serif
- line-height: 제목(display~h3) 1.3, 본문(body~label) 1.5

| role    | 크기/굵기 | line-height | 용도                     |
| ------- | --------- | ----------- | ------------------------ |
| display | 28/700    | 1.3         | 없음 (본 5화면엔 미사용) |
| h1      | 24/600    | 1.3         | 화면 제목                |
| h2      | 20/600    | 1.3         | 섹션 제목                |
| h3      | 17/600    | 1.3         | 카드 제목                |
| body    | 15/400    | 1.5         | 본문 (기본)              |
| body-sm | 14/400    | 1.5         | 본문 작은 것             |
| caption | 12/400    | 1.5         | 설명, 부가 정보          |
| label   | 13/500    | 1.5         | 버튼, 태그, 라벨         |

## Motion 원칙

- `motion-fast` (150ms): 이미지 교체, 뱃지 페이드
- `motion-base` (200ms): 카드 탭 피드백, 필터 칩 전환
- `motion-slow` (250ms): CenterModal 열림/닫힘, BottomActionBar 등장
- easing: 전부 ease-out (진입은 빠르게, 종료는 부드럽게)
