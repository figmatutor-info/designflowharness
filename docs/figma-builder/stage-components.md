# figma-builder · STAGE=components 절차

> 이 문서는 `.claude/agents/figma-builder.md` 의 공통 규칙(절대 원칙 · 시간 예산 · 입력 확인 ·
> MCP 프로토콜 · ⭐ Snapshot 요청 공통 절차 · 금지 사항) 위에서 실행되는 STAGE 절차다.
> 공통 규칙을 건너뛰고 이 문서만으로 시작하지 않는다. 읽었으면 build-log 에
> `stage-doc: docs/figma-builder/stage-components.md` 를 적는다.
>
> 대상 페이지: `02 Components`

---

## STAGE=components

**대상 페이지:** `02 Components`

**핵심 원칙:**

- 모든 컴포넌트 오토레이아웃 + **세로는 HUG** (아래 "⭐ 높이 거동" 필독)
- 색·크기는 변수 바인딩만 (하드코딩 금지)
- **바인딩 대상은 `semantic` 컬렉션 변수뿐이다.**
  `primitives` 컬렉션 변수를 노드에 직접 바인딩하면 게이트 4에서 FAIL 한다.
  (`brand-500` ❌ → `color-primary` ✅ / `radius-12` ❌ → `radius-card` ✅)
- 텍스트는 텍스트 스타일 적용만

### 생성 순서 (앞이 뒤의 부품)

1. **Icon/{name}** — design-rules.md 컴포넌트 규칙 `### Icon` 의 `Icons:` 목록만
   - **손으로 그리지 않는다.** lucide SVG 를 CDN 에서 받아 `figma.createNodeFromSvg` 로 만든다
   - size variants: 16 / 20 / 24 (`Icon/{name}/Size=sm|md|lg` · 정사각 고정 — 하네스 기본 면제)
   - stroke: 1.5 / 1.75 / 2
   - 색은 stroke 를 semantic 색 변수(`color-text` 등)에 바인딩

   ```
   1) design-rules.md 에서 CDN URL 패턴과 아이콘 이름 목록을 읽는다
      (기본: https://cdn.jsdelivr.net/npm/lucide-static@1.47.0/icons/{name}.svg — 버전 고정)
   2) Bash 로 전부 한 번에 받는다 (플러그인 샌드박스는 네트워크가 안 된다)
      mkdir -p design/04-screens/.icons
      for n in home book-open target …; do
        curl -sSf -o design/04-screens/.icons/$n.svg "{CDN}/$n.svg" || echo "MISSING $n"
      done
      · MISSING 이 하나라도 있으면 → 그 이름은 만들지 않고 build-log 에 질문으로 남긴다.
        비슷한 아이콘을 그리거나 다른 이름으로 바꿔 넣지 않는다 (design-rules 가 SSOT)
   3) Read 로 SVG 문자열을 읽어 use_figma 코드에 넣는다 (아이콘 하나 300~500B · 여러 개 묶어도 된다)
      const node = figma.createNodeFromSvg(svgString);   // FRAME 이 돌아온다
      node.name = "Icon/{name}/Size=md";
      → 자식 VECTOR 들의 stroke 를 semantic 색 변수에 바인딩, strokeWeight 를 사이즈별 값으로
      → 24 기준으로 받은 SVG 를 16/20 은 resize 로 맞춘다 (아이콘은 고정 크기가 규격이다)
   4) 세트로 묶어 Icon/{name} 컴포넌트 세트 생성
   ```

2. **Button**
   - variants: primary / secondary / ghost / danger
   - sizes: sm(36) / md(44) / lg(52)
   - states: default / pressed / disabled / loading
   - 텍스트 한 줄, 아이콘 슬롯 boolean

3. **IconButton**
   - sizes: sm/md/lg
   - states: default / pressed / disabled
   - 탭 영역 44 정사각 (시각 크기와 별도)

4. **Card**
   - 제목 2줄 말줄임 (고정 높이 2줄)
   - 이미지 슬롯 (선택) — **레이어 이름을 `Img/slot` 으로 한다** (아래 규칙 참조)
   - padding: space-card-padding, radius: radius-card, shadow: shadow-sm

5. **Input, Select**
   - states: default / focus / error / disabled
   - 도움말 caption 슬롯

6. **화면 전용 컴포넌트** (screens.md 기반)
   - SearchBar, DestinationCard 등 필요한 것만

7. **레이아웃 컴포넌트**
   - AppBar (뒤로 boolean, 제목, 우측 액션 0~2)
   - TabBar (탭 3/4/5, tab-bar-height + safe-area-bottom)
   - BottomSheet (half/full, 그랩바, 헤더56, 본문 fill, 푸터 CTA + safe-area)
   - Dialog (폭 화면-48, 버튼 2개)
   - BottomCTA (app-bar-height + safe-area-bottom)

8. **상태 컴포넌트**
   - EmptyState, Skeleton, ErrorState

9. **DeviceFrame**
   - 390×844
   - 상단 상태바 44 + 홈 인디케이터 34
   - 모든 화면의 바깥 틀

### 절차

- 컴포넌트 1개당 use_figma 호출 1회 (큰 프레임 한 번에 금지)
- 레이어 이름: `Component/Variant=...` semantic 네이밍
- 색·간격·radius·텍스트: setBoundVariable / setTextStyleIdAsync로만
- setBoundVariable 에 넘기는 변수는 **반드시 `semantic` 컬렉션에서** 찾는다
  (`primitives` 에서 찾아 바인딩하면 토큰 계층 검사에서 걸린다)
- **전부 만든 뒤 `scripts/figma-lint.js` 를 돌린다** (아래 "⭐ lint 먼저, 스냅샷은 마지막에")
  위반 0건이 될 때까지 Figma 를 고친다. 이 단계에서 스냅샷을 뽑지 않는다
- lint 0건 → 한 프레임에 모아 get_screenshot 1회 (내부용)
- 그 다음에야 스냅샷 1회

### ⭐ lint 먼저, 스냅샷은 마지막에

**추출 코드를 직접 작성하지 않는다.** `scripts/figma-lint.js` 를 그대로 쓴다.

```
1) Read scripts/figma-lint.js
2) CONFIG 치환
   __PAGE_NAME__    → "02 Components"
   __FIXED_ALLOW__  → design-rules.md 컴포넌트 규칙에서 `- Height: fixed(` 로 선언된 이름들
                      (예: "Button,Input,AppBar,TabBar,BottomActionBar,DeviceFrame")
                      → Bash `grep -n "Height: fixed" design/03-design-rules/design-rules.md` 로 뽑는다
   __FRAME_NAMES__  → 비움 (페이지 전체) / 특정 것만 다시 볼 땐 프레임 이름을 쉼표로
3) use_figma 로 실행 → findings 만 돌아온다 (수 KB, 잘리지 않는다)
4) findings 의 rule 별로 Figma 를 고친다:
   primitive-binding  → semantic 컬렉션 변수로 다시 setBoundVariable
   unbound-paint      → 값 대신 semantic 변수 바인딩
   fixed-height       → layoutSizingVertical = "HUG" (resize 를 부른 곳을 찾아 지운다)
   no-auto-layout     → layoutMode 지정
   content-overflow   → 부모 HUG 확인, 텍스트 textAutoResize = "HEIGHT"
   text-no-style      → setTextStyleIdAsync(Text/*)
   text-no-autoresize → textAutoResize = "HEIGHT"
5) 다시 lint → 0건이면 다음 단계. 3회 돌려도 남으면 build-log 에 적고 넘어간다
```

lint 의 판정 기준은 `check-layout.mjs` / `figma-audit.mjs` 와 같다. 여기서 0건이면
스냅샷 검증도 통과해야 정상이다. 그래도 FAIL 이 나면 그 차이를 build-log 에 적는다
(세 스크립트의 기준이 어긋난 것 — 하네스 수정 대상).

### ⭐ 높이 거동 — 컨테이너는 내용을 감싼다

**컨테이너 높이를 숫자로 정하지 않는다.** 내용이 높이를 정한다.
실제로 이 하네스에서 카드 컨테이너가 고정 높이로 만들어져 제목 아래 텍스트가
카드 밖으로 삐져나온 사고가 있었다.

```js
// ❌ 오토레이아웃 프레임에 resize 를 부르면 sizing 이 FIXED 로 풀린다.
//    HUG 로 세팅해 뒀어도 이 한 줄에 조용히 무효가 된다. 이게 그 사고의 원인이다.
card.layoutMode = "VERTICAL";
card.resize(170, 240);

// ✅ 세로는 HUG, 가로만 정한다
card.layoutMode = "VERTICAL";
card.primaryAxisSizingMode = "AUTO"; // 세로 = 내용을 감쌈
card.counterAxisSizingMode = "FIXED"; // 가로 = 지정
card.layoutSizingHorizontal = "FIXED"; // (부모가 오토레이아웃이면 "FILL")
card.layoutSizingVertical = "HUG";
```

- 텍스트는 `textAutoResize = "HEIGHT"` (줄 수가 늘면 카드도 같이 늘어야 한다)
- 폭만 맞추고 싶으면 `resize` 대신 `layoutSizingHorizontal` 을 쓴다
- 고정 높이가 정말 필요하면 **design-rules.md 컴포넌트 항목에 `- Height: fixed(토큰)` 을 먼저 선언**한다.
  선언 없는 고정 높이는 게이트에서 전부 위반이다 (기본 면제: DeviceFrame · 상태바 · 홈 인디케이터 · `Img/` · `Icon/`)

### ⭐ 이미지 슬롯을 가진 컴포넌트의 명명 규칙

Card, DestinationCard, Avatar 처럼 이미지를 품는 컴포넌트는
**마스터 안의 이미지 레이어 이름을 `Img/` 로 시작하게 짓는다** (`Img/slot`, `Img/avatar`).

왜 중요한가:

- Figma 는 인스턴스 자식 레이어의 이름을 마스터 기본값으로 고정한다.
  화면에서 인스턴스마다 다른 이름을 붙일 수 없다
- 게이트(`check-phase.mjs` 의 "이미지 슬롯 채움")는 `Img/` 로 시작하는 노드를 찾아
  전부 IMAGE fill 인지 본다. 마스터 이름이 `Image` 나 `Thumbnail` 이면
  **빈 슬롯이 있어도 게이트가 못 잡는다**
- 주입 자체는 이름이 아니라 node_id 로 하므로, 이름이 겹치는 것은 문제되지 않는다

슬롯 노드는 RECTANGLE 로 둔다 (FRAME 은 재사용률 분모에 들어간다).

### 자리표시 원칙

"버튼"·"텍스트" 같은 더미 금지.
실제 문구 사용 (예: "예약하기", "여행지 검색").

### ⭐ 컴포넌트 문서 페이지 (lint 0건 이후 · 스냅샷 요청 전)

`02b Component Docs` 페이지에 **카테고리별 문서 카드**를 그린다. 규격은 `docs/component-docs-spec.md`,
구현은 `scripts/figma-component-docs.js` 다. **즉흥 작성 금지** — 이 스크립트만 쓴다.

원본 컴포넌트는 `02 Components` 최상위에 그대로 둔다. 문서 페이지에는 인스턴스만 놓인다
(snapshot / check-layout 이 최상위 세트를 전제로 판정하기 때문 — 세트를 옮기면 게이트 4 가 어긋난다).

```
1) Read scripts/figma-component-docs.js
2) CONFIG 치환
   __PAGE_NAME__      → "02b Component Docs"
   __SOURCE_PAGE__    → "02 Components"
   __PROJECT_LABEL__  → 01 Tokens 문서와 같은 라벨
   __DOC_DATE__       → 오늘 (SEP 20, 2026 형식)
   __ONLY__           → 치환하지 않음 (응답이 잘리면 카테고리 키 하나씩: action, input, …)
3) use_figma 로 실행 → 반환값 확인
   uncategorized 가 비어 있지 않으면 → 그 컴포넌트 이름이 spec §1 표에 없다.
     design-rules.md 의 이름과 대조해 spec 표(와 스크립트 CATEGORIES)에 추가하거나 이름을 고친다
   카드의 missing 이 있으면 → 세트에 그 variant 조합이 없다. design-rules.md variant 표와 대조한다
4) get_screenshot 1회 (내부용) — 칩 순서 = 인스턴스 순서, 카드가 내용을 감싸는지
5) build-log 에 적는다:
   ### component-docs ✅|❌
   - 문서 {N}장 (카테고리) · 카드 {M}장 · uncategorized {K} · missing {J}
```

이 페이지는 **스냅샷을 뽑지 않는다** (문서 페이지 · `01 Tokens` 와 같은 취급). check-layout 도 건너뛴다.
컴포넌트를 고친 뒤에는 다시 돌린다 (멱등 — 기존 문서 프레임을 지우고 다시 그린다).

### ⭐ Snapshot 요청 (비차단 · lint 0건 이후)

**절차는 `figma-builder.md` 의 "⭐ Snapshot 요청 (공통 절차)" 와 동일.** lint 0건 확인 후 build-log 에
`snapshot: requested (page=02 Components · profile=full · stage=components)` 를 적고
screens 시작 확인으로 넘어간다. 뽑는 도중 결함을 고치고 다시 뽑는 일은 lint 를 건너뛴 결과다.

runner 가 돌리는 검증 (둘 다 통과해야 한다):

```bash
node scripts/check-snapshot.mjs --stage components
node scripts/check-layout.mjs --page "02 Components"   # = npm run check:layout
```

`check-layout` 은 "컨테이너가 내용을 감싸는가"를 본다. 잡는 것 3가지:

| 위반                       | 뜻                                      |
| -------------------------- | --------------------------------------- |
| 고정 높이 컨테이너         | 오토레이아웃인데 세로가 FIXED           |
| 오토레이아웃 없는 컨테이너 | 자식이 있는데 레이아웃이 없음           |
| 콘텐츠 넘침                | 자식이 부모 밖으로 삐져나감 (사고 증거) |

**FAIL 통지를 받으면 screens 작업을 체크포인트에서 멈춘다.** 스냅샷을 손으로 고치지 말고
지목된 노드를 Figma 에서 HUG 로 바꾼 뒤 그 프레임만 재추출을 요청한다.
`schema_version 2` 로 FAIL 나면 검사가 아예 못 돈 것이다 (layout / parentId 필드 없음).
`profile=docs` 로 FAIL 나면 이 페이지를 docs 로 뽑은 것이다 — runner 에 `profile=full` 로 재요청한다.

### build-log 갱신

```markdown
## STAGE=components ✅

완료: {YYYY-MM-DD HH:MM}
컴포넌트 생성 (14개):

- Icon (12 variants), Button, IconButton, Card
- Input, Select, SearchBar, DestinationCard
- AppBar, TabBar, BottomSheet, Dialog
- BottomCTA, EmptyState
  figma_read_calls: 8
  component-docs: ✅ 문서 7장 · 카드 14장 · uncategorized 0 · missing 0
  snapshot: requested (snapshot-runner 위임 · 결과는 build-log 의 `### snapshot · {page}` 항목)
  next: STAGE=screens (사용자 확인 필요)
```

**⚠️ 사용자 확인:**

```
components STAGE 완료.
14개 컴포넌트 생성됨.

다음은 screens STAGE 입니다.
화면 {N}개를 만들고, design-rules.md §I 표대로 design/assets/characters/ 의 이미지를 채웁니다.
(check-assets: {PASS/FAIL} · 슬롯 {N}개 · 파일 {N}개)

→ Yes: STAGE=screens 시작
→ No: 여기서 중단
```

---

## 실패 대응 (components 전용)

### 아이콘 CDN 실패 (STAGE=components)

```
- curl 이 404 → 그 이름은 lucide 에 없다. 만들지 말고 build-log 에 질문으로 남긴다
  (design-rules.md 의 이름이 틀린 것 — design-rules-generator 가 고친다)
- 네트워크 오류 → 같은 URL 2회 재시도 후 중단·보고. 버전을 바꿔서 받지 않는다
- SVG 파싱 실패 (createNodeFromSvg 예외) → 그 아이콘만 건너뛰고 기록. 손으로 그리지 않는다
```
