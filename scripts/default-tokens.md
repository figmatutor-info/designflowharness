# Default Tokens

모바일 앱 (iOS/Android, 390×844) 기준.
사용자가 아무것도 정하지 않아도 이 값으로 일관성이 보장된다.

design-rules-generator가 이 파일을 로드하여 초안을 생성하고,
사용자가 override한 값만 반영해 최종 design-rules.md를 만든다.

---

## ⭐ 토큰 계층 규칙 (절대 규칙)

모든 토큰은 **2계층**이다. 1계층으로 만들지 않는다.

```
Primitive (값)          Semantic (의도)          사용처
brand-500 = #2563EB ←── color-primary      ←──  Button.fill
neutral-900 = #111827 ← color-text         ←──  Text.fill
space-4 = 16          ← space-card-padding ←──  Card.padding
```

| 계층          | 이름 규약                             | 값                          | 누가 쓰나                   |
| ------------- | ------------------------------------- | --------------------------- | --------------------------- |
| **Primitive** | 색조+단계 (`brand-500`, `neutral-0`)  | 실제 값 (#2563EB, 16)       | semantic 토큰만 참조        |
| **Semantic**  | 역할 (`color-primary`, `radius-card`) | `{primitive-name}` **참조** | 컴포넌트·화면이 이것만 사용 |

**금지:**

- ❌ semantic 토큰에 값 직결 (`color-primary = #2563EB`)
- ❌ primitive 없이 semantic만 생성
- ❌ 컴포넌트·화면이 primitive를 직접 바인딩 (`Button.fill → brand-500`)
- ❌ semantic 이름에 색조 노출 (`color-blue-primary`)

**적용 범위:** 색상 · 간격 · Radius · Size
**제외:** 타이포그래피 (role 기반 텍스트 스타일 `Text/h1` 유지)

---

## A. 색상 (Color)

### Primitive

원본 팔레트. 이 값들은 semantic 토큰만 참조한다.

| 토큰             | 값                 | 계열     |
| ---------------- | ------------------ | -------- |
| brand-50         | rgba(37,99,235,.1) | 브랜드   |
| brand-500        | #2563EB            | 브랜드   |
| brand-600        | #1D4ED8            | 브랜드   |
| neutral-0        | #FFFFFF            | 중립     |
| neutral-50       | #F5F5F7            | 중립     |
| neutral-100      | #E9E9EE            | 중립     |
| neutral-200      | #E5E7EB            | 중립     |
| neutral-400      | #9CA3AF            | 중립     |
| neutral-500      | #6B7280            | 중립     |
| neutral-900      | #111827            | 중립     |
| red-600          | #DC2626            | 시스템   |
| green-600        | #16A34A            | 시스템   |
| amber-500        | #F59E0B            | 시스템   |
| overlay-black-50 | rgba(0,0,0,.5)     | 오버레이 |

### Semantic

**모든 값은 primitive 참조.** 컴포넌트·화면은 이 토큰만 사용한다.

| 토큰                  | 참조               | 용도                  |
| --------------------- | ------------------ | --------------------- |
| color-bg              | {neutral-0}        | 기본 배경             |
| color-surface-1       | {neutral-50}       | 카드/시트 배경 (1층)  |
| color-surface-2       | {neutral-100}      | 강조 카드 배경 (2층)  |
| color-border          | {neutral-200}      | 구분선, 테두리        |
| color-text            | {neutral-900}      | 본문                  |
| color-text-muted      | {neutral-500}      | 보조 텍스트           |
| color-text-disabled   | {neutral-400}      | 비활성 텍스트         |
| color-text-inverse    | {neutral-0}        | 어두운 배경 위 텍스트 |
| color-primary         | {brand-500}        | 주요 CTA, 강조        |
| color-primary-pressed | {brand-600}        | CTA pressed 상태      |
| color-primary-soft    | {brand-50}         | CTA soft 배경         |
| color-danger          | {red-600}          | 위험, 에러, 삭제      |
| color-success         | {green-600}        | 성공, 완료            |
| color-warning         | {amber-500}        | 경고, 주의            |
| color-overlay         | {overlay-black-50} | 모달, 시트, 로딩      |

**브랜드 컬러 override 시:** `brand-500` 하나만 바꾸면
`brand-600`(12% 어둡게) / `brand-50`(10% 불투명)이 자동 파생되고,
semantic 3개는 참조라서 자동으로 따라온다.

---

## B. 간격 (Spacing)

**원칙: 모든 primitive 값은 4의 배수**

### Primitive

| 토큰     | 값   | 비고                  |
| -------- | ---- | --------------------- |
| space-1  | 4px  | 최소 단위             |
| space-2  | 8px  |                       |
| space-3  | 12px |                       |
| space-4  | 16px | 가장 많이 쓰이는 단위 |
| space-5  | 20px |                       |
| space-6  | 24px |                       |
| space-8  | 32px |                       |
| space-12 | 48px | 최대 단위             |

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

## C. 타이포 (Typography)

**⚠️ 타이포는 2계층 대상이 아니다.** role 기반 텍스트 스타일로 관리한다.

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

### Primitive

| 토큰        | 값     |
| ----------- | ------ |
| radius-4    | 4px    |
| radius-8    | 8px    |
| radius-12   | 12px   |
| radius-16   | 16px   |
| radius-full | 9999px |

### Semantic

| 토큰          | 참조          | 용도               |
| ------------- | ------------- | ------------------ |
| radius-tag    | {radius-4}    | 태그, 뱃지         |
| radius-button | {radius-8}    | 버튼, 인풋         |
| radius-card   | {radius-12}   | 카드               |
| radius-sheet  | {radius-16}   | 시트, 다이얼로그   |
| radius-pill   | {radius-full} | 원형 (아바타, FAB) |

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

치수(size) 토큰도 2계층이다.

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

| 토큰                | 참조      | 용도                         |
| ------------------- | --------- | ---------------------------- |
| device-frame        | 390×844   | 기본 화면 크기 (iPhone 기준) |
| safe-area-top       | {size-44} | 상태바 영역                  |
| safe-area-top-notch | {size-47} | 노치 기기 상태바             |
| safe-area-bottom    | {size-34} | 홈 인디케이터 영역           |
| size-tap-min        | {size-44} | 최소 터치 타겟 크기 (44×44)  |
| size-button-sm      | {size-36} | 버튼 sm 높이                 |
| size-button-md      | {size-44} | 버튼 md 높이                 |
| size-button-lg      | {size-52} | 버튼 lg 높이                 |
| app-bar-height      | {size-56} | 상단 앱바 높이               |
| tab-bar-height      | {size-49} | 하단 탭바 높이               |
| icon-sm             | {icon-16} | 작은 아이콘                  |
| icon-md             | {icon-20} | 기본 아이콘                  |
| icon-lg             | {icon-24} | 큰 아이콘                    |

**tap-gap-min:** `space-tap-gap-min` ({space-2} = 8px) — 인접 터치 타겟 최소 간격

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

## I. 이미지 (default)

화면의 이미지 슬롯을 실제 이미지로 채우기 위한 기본값.
**이미지는 생성하지 않는다.** 미리 준비된 라이브러리 폴더에서 고르고,
figma-builder 의 STAGE=screens 가 design-rules.md §I 표의 `파일` 열을 그대로 슬롯에 넣는다.

**토큰이 아니다.** 색·간격처럼 2계층으로 나누지 않는다.
이미지는 "무엇을 어떤 톤으로 그릴지"에 대한 **규칙**이며,
슬롯을 감싸는 프레임의 radius·padding 만 semantic 토큰(`radius-card` 등)을 쓴다.

### 사용 여부

design-rules.md §I 첫 줄에 `image-slots: used` 또는 `image-slots: none` 을 적는다.
**기본값은 `used`** 다. 이미지를 쓰지 않는 앱(가계부·설정·계산기 등)이면 `none`
으로 선언한다. `none` 이면 화면에 `Img/` 슬롯을 만들지 않고, 게이트 4의 이미지
검사도 "해당 없음"으로 통과한다.

### 이미지 라이브러리

design-rules.md §I 둘째 줄에 `image-library: {폴더}` 를 적는다. 생략하면 기본값.

| 항목          | 기본값                     | 비고                                                      |
| ------------- | -------------------------- | --------------------------------------------------------- |
| image-library | `design/assets/characters` | 슬롯에 쓸 수 있는 유일한 폴더. `check-assets.mjs` 가 검사 |
| 허용 확장자   | png · jpg · jpeg · webp    | `upload_assets` 가 받는 형식                              |
| 파일 크기     | 1KB 이상 · 10MB 이하       | 미만은 깨진 파일, 초과는 upload_assets 거부               |

- 라이브러리에 없는 파일은 §I 표에 적을 수 없다 (적으면 check-assets FAIL)
- 필요한 이미지가 없으면 **생성하지 말고** 사용자에게 폴더에 넣어 달라고 요청한다
- 같은 파일을 여러 슬롯·여러 화면에 재사용해도 된다 (재사용이 기본이다)

### 슬롯 역할별 비율

| role       | aspect_ratio | 쓰이는 곳                        |
| ---------- | ------------ | -------------------------------- |
| hero       | `16:9`       | 홈 상단 배너, 상세 최상단        |
| card       | `4:3`        | 리스트/그리드 카드 썸네일        |
| thumb      | `1:1`        | 작은 정사각 썸네일, 카테고리     |
| avatar     | `1:1`        | 프로필 이미지                    |
| full-bleed | `3:4`        | 전체 폭 세로 이미지, 상세 갤러리 |

허용 비율은 이 5개뿐이다. 그 외 값은 `check-assets.mjs` 가 막는다.

### 슬롯 수 상한

| 범위   | 상한 | 이유                                          |
| ------ | ---- | --------------------------------------------- |
| 화면당 | 4개  | 한 화면에 이미지가 5개 넘으면 구조를 의심한다 |

프로젝트 전체 상한은 없다 — 생성 비용이 없으므로. 대신 라이브러리에 있는 파일만 쓴다.

### 슬롯 네이밍 (절대 규칙)

```
Figma 레이어 이름 = Img/{key}
슬롯 key          = {화면번호}-{화면이름}-{슬롯이름}

예) Img/01-home-hero
    Img/02-search-results-card-1
    Img/05-mypage-avatar
```

이 이름이 곧 주입 대상 주소다. 어긋나면 이미지가 들어갈 노드를 찾지 못한다.

### 파일 선택 기준 (기본)

사용자가 기준을 정하지 않으면 아래로 고르고 가정 로그에 남긴다.

- 한 화면 안에서는 같은 캐릭터·같은 시리즈 파일을 쓴다 (톤이 섞이지 않게)
- hero 에는 정면·전신(`*-front`, `*-face`), thumb/avatar 에는 얼굴(`*-face`), card 에는 시리즈 번호 순서대로
- 텍스트가 올라가는 슬롯에는 배경이 단순한 파일을 고른다
- 이미지 안에 글자·로고·워터마크가 있는 파일은 쓰지 않는다 (Figma 쪽 텍스트와 충돌)

---

## 컴포넌트 기본값

**모든 값은 semantic 토큰으로 지정한다.** primitive 직접 참조 금지.

### Button

| 속성     | 값                                               |
| -------- | ------------------------------------------------ |
| Variants | primary / secondary / ghost / danger             |
| Sizes    | size-button-sm / size-button-md / size-button-lg |
| States   | default / pressed / disabled / loading           |
| Radius   | radius-button                                    |
| Padding  | 좌우 space-screen-padding, 상하 자동             |

### Card

| 속성       | 값                              |
| ---------- | ------------------------------- |
| Padding    | space-card-padding              |
| Radius     | radius-card                     |
| Shadow     | shadow-sm                       |
| Background | color-bg (또는 color-surface-1) |

### Input

| 속성    | 값                                 |
| ------- | ---------------------------------- |
| Height  | size-tap-min                       |
| Padding | 좌우 space-card-padding            |
| Radius  | radius-button                      |
| Border  | 1px solid color-border             |
| States  | default / focus / error / disabled |

### Icon

| 속성    | 값                                                                   |
| ------- | -------------------------------------------------------------------- |
| Sizes   | icon-sm / icon-md / icon-lg                                          |
| Stroke  | 1.5 / 1.75 / 2                                                       |
| Library | lucide                                                               |
| CDN     | `https://cdn.jsdelivr.net/npm/lucide-static@1.47.0/icons/{name}.svg` |

**아이콘은 손으로 그리지 않는다.** design-rules.md 컴포넌트 규칙에 `Icon: lucide/{name}` 으로
이름만 적고, figma-builder 가 위 CDN 에서 그 SVG 를 받아(`curl`) `figma.createNodeFromSvg` 로
만든다. 버전은 고정한다 — 버전이 바뀌면 같은 이름의 모양이 달라질 수 있다.
CDN 에 없는 이름이면 비슷한 걸 그리지 말고 build-log 에 질문으로 남기고 멈춘다.
이름은 lucide 공식 이름(kebab-case: `book-open`, `circle-check`)을 그대로 쓴다.

### Tab Bar

| 속성      | 값                                |
| --------- | --------------------------------- |
| Height    | tab-bar-height + safe-area-bottom |
| Tabs      | 3~5개                             |
| Icon size | icon-lg                           |
| Label     | label (13/500)                    |

### App Bar

| 속성    | 값                             |
| ------- | ------------------------------ |
| Height  | app-bar-height + safe-area-top |
| Title   | h2 (20/600) 중앙 정렬          |
| Actions | 좌 뒤로 / 우 액션 0-2개        |

### Bottom Sheet

| 속성           | 값                  |
| -------------- | ------------------- |
| Sizes          | half / full         |
| Radius         | radius-sheet 상단만 |
| Grab bar       | 있음                |
| Header         | app-bar-height      |
| Footer padding | + safe-area-bottom  |

---

## 규칙

### 절대 금지

- **semantic 토큰에 값 직결** (반드시 `{primitive}` 참조)
- **컴포넌트·화면이 primitive 직접 바인딩**
- 4의 배수 아닌 spacing primitive 값
- 이 파일에 없는 색상 직접 하드코딩
- size-tap-min 미만의 탭 타겟
- safe-area 침범 (콘텐츠/고정 바)
- 화면당 primary 버튼 2개 이상

### 반드시 지킴

- 본문 텍스트 최소 14px
- semantic 이름은 역할로 (color-blue-500 X, color-primary O)
- primitive 이름은 색조+단계로 (brand-500, neutral-900)
- 모든 spacing은 semantic space-* 토큰 사용
- 모든 텍스트는 role 지정 (h1/body/caption 등)

---

## 사용 예시

design-rules-generator가 이 파일을 로드하면:

1. primitive / semantic 2계층이 전부 default로 세팅됨
2. 사용자가 브랜드 컬러를 주면 **primitive `brand-500` 하나만** override
3. `brand-600` / `brand-50` 자동 파생
4. semantic 3개(`color-primary`, `-pressed`, `-soft`)는 참조라서 자동 반영
5. 최종 design-rules.md에 2계층 그대로 기록
