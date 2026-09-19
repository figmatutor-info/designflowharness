# Design Tokens 상세

design-rules.md의 A~H 섹션 상세 정보. (§I 이미지는 design-rules.md 에만 둔다)

**상태:** design-rules.md 가 `status: confirmed` (v1.0, 2026-09-18) 로 확정됨. 이 문서는 그 상세다.
브랜드 컬러(`brand-500`)와 이미지 슬롯 배경(`sky-100`)은 확정값이다.

---

## 토큰 계층

이 프로젝트의 토큰은 2계층이다.

```
Primitive (값)              Semantic (의도)              컴포넌트·화면
brand-500 = #5B5FEF   ←──   color-primary          ←──   BottomCTA.fill, Tab.active
sky-100   = #D6ECFF   ←──   color-image-slot-bg    ←──   AssetCard/PickCard 이미지 슬롯 배경
neutral-900 = #111827 ←──   color-text             ←──   Text.fill
space-4 = 16          ←──   space-card-padding     ←──   Card.padding
```

- Primitive 이름: 색조 + 단계 (`brand-500`, `neutral-900`, `sky-100`)
- Semantic 이름: 역할 (`color-primary`, `color-image-slot-bg`, `radius-card`)
- **컴포넌트·화면은 semantic 만 바인딩한다.**

---

## 색상 팔레트

### Primitive (값을 가진 유일한 계층)

| 토큰             | 값                 | 출처                                                                            |
| ---------------- | ------------------ | ------------------------------------------------------------------------------- |
| brand-500        | #5B5FEF            | **가정** — analysis.md AI 화면 보라 강조 + PRD "신뢰감+젊음" (사용자 승인 필요) |
| brand-600        | #5054D2            | 자동 파생 (brand-500 을 12% 어둡게)                                             |
| brand-50         | rgba(91,95,239,.1) | 자동 파생 (brand-500 을 10% 불투명)                                             |
| neutral-0        | #FFFFFF            | default                                                                         |
| neutral-50       | #F5F5F7            | default                                                                         |
| neutral-100      | #E9E9EE            | default                                                                         |
| neutral-200      | #E5E7EB            | default                                                                         |
| neutral-400      | #9CA3AF            | default                                                                         |
| neutral-500      | #6B7280            | default                                                                         |
| neutral-900      | #111827            | default                                                                         |
| red-600          | #DC2626            | default                                                                         |
| green-600        | #16A34A            | default                                                                         |
| amber-500        | #F59E0B            | default                                                                         |
| overlay-black-50 | rgba(0,0,0,.5)     | default                                                                         |
| sky-100          | #D6ECFF            | **가정** — "파스텔톤 하늘색" 정성 지시의 구체 hex 제안 (사용자 승인 필요)       |

### Semantic 매핑 (전부 참조)

| Semantic              | → Primitive        | 사용 가이드                                          |
| --------------------- | ------------------ | ---------------------------------------------------- |
| color-bg              | {neutral-0}        | 기본 배경                                            |
| color-surface-1       | {neutral-50}       | 카드/시트 배경                                       |
| color-surface-2       | {neutral-100}      | 강조 카드 배경, ProgressBar 트랙                     |
| color-border          | {neutral-200}      | 구분선, 테두리, BottomCTA 상단 라인                  |
| color-text            | {neutral-900}      | 본문                                                 |
| color-text-muted      | {neutral-500}      | 보조 텍스트, 비활성 탭                               |
| color-text-disabled   | {neutral-400}      | 비활성 텍스트, EmptyState 아이콘                     |
| color-text-inverse    | {neutral-0}        | 어두운 배경 위 텍스트                                |
| color-primary         | {brand-500}        | 화면당 1곳 CTA 에만, 활성 탭, ProgressBar Fill       |
| color-primary-pressed | {brand-600}        | pressed 상태                                         |
| color-primary-soft    | {brand-50}         | CTA soft 배경, 기본 Badge 강조                       |
| color-danger          | {red-600}          | 반려/에러 상태                                       |
| color-success         | {green-600}        | 승인/판매중 상태                                     |
| color-warning         | {amber-500}        | 피드백대기/검수중 상태                               |
| color-overlay         | {overlay-black-50} | AI 검수 로딩 모달 딤 배경                            |
| color-image-slot-bg   | {sky-100}          | 이미지 슬롯 배경 (fit-contain 이미지 뒤 파스텔 배경) |

### 왜 2계층인가

- 브랜드 컬러 승인 후 `brand-500` 하나만 바꾸면 semantic 3개(`color-primary`, `-pressed`, `-soft`)가 자동으로 따라온다
- 다크모드 추가 시 primitive 컬렉션에 모드만 추가하면 된다
- semantic 이름이 의도를 말하므로 화면을 읽을 때 "왜 이 색인지"가 드러난다 (예: `color-image-slot-bg`는 슬롯 배경이라는 역할이 이름에 그대로 담긴다)

---

## 간격 스케일 상세

### Primitive

| 토큰     | 값   | 비고                                               |
| -------- | ---- | -------------------------------------------------- |
| space-1  | 4px  | 최소 단위, ProgressBar 두께                        |
| space-2  | 8px  | 인접 탭 타겟 최소 간격                             |
| space-3  | 12px | 리스트 아이템 간 gap                               |
| space-4  | 16px | 가장 많이 쓰이는 단위 (화면 padding, 카드 padding) |
| space-5  | 20px |                                                    |
| space-6  | 24px | 섹션 간 간격                                       |
| space-8  | 32px |                                                    |
| space-12 | 48px | 최대 단위                                          |

### Semantic

| 토큰                 | → Primitive | 용도                                             |
| -------------------- | ----------- | ------------------------------------------------ |
| space-screen-padding | {space-4}   | 모든 화면 좌우 padding                           |
| space-section        | {space-6}   | 홈 화면 섹션(미션 카드/최근자료/최근스킬) 간     |
| space-card-padding   | {space-4}   | Card/SkillCard/AssetCard/PickCard 내부 padding   |
| space-list-gap       | {space-3}   | ItemRow, SkillCard/AssetCard/PickCard 그리드 gap |
| space-inline         | {space-1}   | 아이콘-텍스트 간 (Badge 내부 등)                 |
| space-tap-gap-min    | {space-2}   | Tab, TabBar 인접 탭 최소 간격                    |

---

## 타이포 상세

### Pretendard 폰트

- 웹 폰트 소스: Pretendard (fallback: -apple-system, "Roboto", sans-serif)
- 제목 계열(display/h1/h2/h3): line-height 1.3
- 본문 계열(body/body-sm/caption/label): line-height 1.5

| 역할    | 크기/굵기 | line-height | 용도                                         |
| ------- | --------- | ----------- | -------------------------------------------- |
| display | 28/700    | 1.3         | 사용 안 함 (이번 5개 화면에는 히어로 없음)   |
| h1      | 24/600    | 1.3         | 사용 안 함 (5개 화면은 h2 이하로 충분)       |
| h2      | 20/600    | 1.3         | 화면/섹션 제목, AppBar 타이틀, SectionHeader |
| h3      | 17/600    | 1.3         | SkillCard/AssetCard/PickCard 제목            |
| body    | 15/400    | 1.5         | 본문 (미션 설명, 피드백 텍스트)              |
| body-sm | 14/400    | 1.5         | EmptyState 안내 문구                         |
| caption | 12/400    | 1.5         | 사용 도구, 제작자 row, 서브텍스트            |
| label   | 13/500    | 1.5         | 버튼 라벨, TabBar 라벨, 가격 텍스트          |

**최소 본문 크기 14px** 원칙 준수 — caption(12px)은 부가 정보 전용으로만 사용.

## Motion 원칙

| 토큰        | 값             | 적용 가이드                                          |
| ----------- | -------------- | ---------------------------------------------------- |
| motion-fast | 150ms ease-out | 이미지 fit 전환, Badge 상태 변경 페이드              |
| motion-base | 200ms ease-out | 탭 전환, 필터 적용, 화면 내 상태 전환(검색 오버레이) |
| motion-slow | 250ms ease-out | AI 검수 로딩 모달 열림/닫힘, BottomSheet 열림/닫힘   |
