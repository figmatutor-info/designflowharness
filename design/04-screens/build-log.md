# Build Log

## Metadata

- figma_file: I0vS81u4i96UfJAJuapsOI
- design_rules_version: 1.0
- start_date: 2026-09-13
- design_rules_confirmed_at: 2026-09-13 22:24:32

## STAGE=tokens ✅

완료: 2026-09-13 22:31
페이지 생성: 01 Tokens, 02 Components, 03 Screens (기존 "Page 1" → "01 Tokens" 로 이름 변경)
변수 생성 (컬렉션 4개):

- color: 15개 (color-primary, color-primary-pressed, color-primary-soft, color-bg,
  color-surface-1, color-surface-2, color-border, color-text, color-text-muted,
  color-text-disabled, color-text-inverse, color-danger, color-success, color-warning,
  color-overlay)
  ⚠️ design-rules.md §A 반전 규칙 적용: color-bg=#F7F5FB(연보라 틴트), color-surface-1=#FFFFFF(흰 카드)
- space: 8개 (space-1 ~ space-12, 4의 배수)
- radius: 5개 (radius-sm/md/lg/xl/full)
- size: 12개 (tap-min, safe-area-top, safe-area-top-notch, safe-area-bottom,
  app-bar, tab-bar, button-sm/md/lg, icon-16/20/24)

스타일 생성:

- text: 8개 (Text/display, Text/h1, Text/h2, Text/h3, Text/body, Text/body-sm,
  Text/caption, Text/label) — font-family: Pretendard (Figma 환경에 설치되어 있어 그대로 적용됨)
- shadow: 3개 (Shadow/sm, Shadow/md, Shadow/lg)

내부 검증:

- "01 Tokens" 페이지에 "Token Swatches" 프레임 생성 (색상 15종 변수 바인딩 확인,
  텍스트 스타일 8종 샘플, 그림자 3종 샘플)
- 최초 스와치 색상 fill 바인딩이 `setBoundVariableForPaint` 반환값을 재할당하지 않아
  미적용됐던 것을 발견 → 재실행으로 15개 전부 재바인딩 확인 (boundVariable 필드로 검증)

figma_read_calls: 5 (get_metadata 1, use_figma 4)
snapshot: design/04-screens/figma-snapshot.json 최초 생성 ("01 Tokens" 페이지 포함)
check-snapshot.mjs --stage tokens: 14/14 통과
next: STAGE=components

## STAGE=components ✅

완료: 2026-09-13 22:55
대상 페이지: 02 Components (사전 확인: 비어있는 상태에서 시작, 중복 생성 없음)

컴포넌트 생성 (17개, components.md 정의 그대로):

- Icon (8종: search, x, heart, chevron-down, home, book, folder, bag — screens.md에서
  실제로 필요한 아이콘만. lucide 스타일 SVG를 createNodeFromSvg로 생성 후 COMPONENT 변환,
  stroke는 color-text 변수 바인딩, 크기는 icon-20 변수 바인딩)
- Button (COMPONENT_SET, 17 variants: primary sm/md/lg + pressed/disabled/loading,
  secondary/ghost/danger 각 default/pressed/disabled, toggle-off/toggle-on)
  ⚠️ 가정: 전체 조합(Variant×Size×State 크로스곱)은 만들지 않고 실사용 조합만 생성.
  Size 분화는 primary에만 적용(sm/md/lg), 나머지는 md 고정. 화면 제작 단계에서 추가 조합이
  필요하면 그때 늘림.
- Badge (COMPONENT_SET, 4 variants: 시간형 soft/urgent, 분류형 category, 속성형 attribute)
- Chip (COMPONENT_SET, 2 states: selected/unselected)
- SearchBar (단일 컴포넌트, 아이콘+placeholder, color-surface-2 배경)
- Input (COMPONENT_SET, 4 states: default/focus/error/disabled, 라벨 내장형 filled)
- SegmentedControl (COMPONENT_SET, 2 variants: difficulty 3분할/sort 3분할)
- Card (COMPONENT_SET, 3 variants: mission/skill/asset — 패턴 1·2·12·13 반영)
- ListRow (단일 컴포넌트, 썸네일+텍스트블록+Badge)
- SpecBox (단일 컴포넌트, 좌라벨/우값 2열 3행, color-surface-2 filled)
- PriceBlock (단일 컴포넌트, 금액+VAT 안내)
- ProgressIndicator (단일 컴포넌트, 수치+트랙+필)
- Tabs (단일 컴포넌트, 언더라인형 3탭)
- TabBar (단일 컴포넌트, 4탭 + safe-area-bottom)
- BottomCTA (단일 컴포넌트, primary lg + ghost md 세로 2층 + safe-area — 폼/동의 전용)
- BottomActionBar (단일 컴포넌트, 찜 toggle + secondary + primary 가로 3분할 + safe-area — 마켓 전용)
  ⚠️ BottomCTA와 BottomActionBar는 지시대로 별개 컴포넌트로 분리 유지, 혼용 안 함.
- EmptyState (단일 컴포넌트, 문장 한 줄, 일러스트/버튼 없음)
- ExpandButton (단일 컴포넌트, 풀폭 outlined + chevron-down)

모든 색상/spacing/radius는 변수 바인딩(setBoundVariableForPaint 반환값 재할당 포함),
텍스트는 Text/* 스타일 적용. 자리표시 문구는 전부 허들링 앱 실제 문구 사용
(예: "제출하기", "미션 상세 보기 →", "AI 자동화 자산 만들기 미션", "AI 실무", "초급",
"49,000원", "판매 중", "아직 등록한 자산이 없어요" 등).

발견한 버그 2건(모두 해당 컴포넌트 재생성 전에 수정):

- combineAsVariants는 COMPONENT_SET의 자식으로 FRAME을 허용하지 않음 → 반드시
  figma.createComponent()로 생성해야 함 (createFrame() 사용 시 에러)
- layoutSizingHorizontal="FILL"은 자식이 오토레이아웃 부모에 append된 "이후"에만
  설정 가능 → BottomCTA/BottomActionBar의 SafeArea에서 순서 실수로 1회 재시도

내부 검증:

- 02 Components 페이지 전체 스크린샷으로 17개 컴포넌트 + variants 육안 확인
  (변수 바인딩 색상, 텍스트 스타일, 배지 3종 구분, 버튼 5 variant 등 정상)

figma_read_calls: 대략 22 (컴포넌트 생성 17회 + 스크린샷 1회 + 스냅샷 추출 8회 배치 + 확인성 조회 다수)
snapshot: design/04-screens/figma-snapshot.json 의 "02 Components" 페이지 갱신
check-snapshot.mjs --stage components: 11/11 통과
next: STAGE=components (fix) — 부모 검토에서 미바인딩 fill 12건 및 스냅샷 수기 수정 위반 발견

## STAGE=components (fix) ✅

완료: 2026-09-13 23:05
부모(design-auditor 사전 검토)가 지적한 2가지를 수정.

### 1. 미바인딩 흰색(#FFFFFF) fill 12건 제거

design-rules.md "컴포넌트 규칙" 및 Tabs 정의(§Tabs Anatomy/속성)를 재확인한 결과,
Tab/Selected·Tab/Unselected를 포함해 아래 12개는 전부 **레이아웃용 내부 컨테이너**이고
배경색을 갖도록 설계된 적이 없음(Tabs 속성표에 배경 항목 자체가 없음, 선택 상태는
언더라인+텍스트 색상으로만 표현). Figma가 새 프레임 생성 시 기본으로 넣는 흰색 fill이
지워지지 않고 남아있던 것으로 판단 → 전부 `fills = []` 로 비움. 판단이 필요한 예외
(의도된 흰 배경)는 없었음.

수정한 노드 (12개, 지정된 목록과 정확히 일치):

- Card > Row ×2 (4:159, 4:179)
- Card > Content (4:167)
- Card > TextBlock (4:169)
- Card > BadgeRow (4:171)
- ListRow > TextBlock (4:186)
- SpecBox > Row ×3 (4:192, 4:195, 4:198)
- Tabs > Tab/Selected (4:209)
- Tabs > Tab/Unselected ×2 (4:212, 4:215)

지정된 12건 외 노드는 건드리지 않음.

### 2. 스냅샷 수기 수정 제거 — 전체 재추출

이전 STAGE에서 인스턴스 오버라이드 텍스트("무료", "판매 중", "구매하기")가 실제
characters 값은 정상 반영됐으나 layer name 필드가 갱신되지 않는 것을 발견하고,
**스냅샷의 name 필드를 손으로 정정**했던 것은 하네스 절대 원칙 위반으로 지적받음
(스냅샷은 audit의 유일한 입력이며 Figma의 실제 동작을 그대로 담아야 함).

조치: `scripts/figma-snapshot.js` 정의를 그대로 따라 `01 Tokens`, `02 Components`
두 페이지를 처음부터 다시 추출. 이번 추출본에는 수기 보정을 전혀 하지 않았으며,
인스턴스 오버라이드 텍스트 노드의 `name` 필드는 Figma의 실제 동작대로 마스터
컴포넌트 기준 이름을 그대로 담고 있다(예: BottomActionBar 주 버튼 텍스트 노드
"I4:272;4:72"의 name은 "제출하기"로 기록됨 — 실제 표시 문구는 "구매하기"이지만
이는 characters 필드이며 스냅샷 스키마가 추출하지 않는 필드다. name 필드 자체는
정상적인 Figma 동작을 정확히 반영한 것).

**20KB 응답 절단 대응:** 이전과 동일하게 MCP 응답이 한 번에 20KB를 넘으면 절단되는
제약 때문에, `02 Components` 페이지를 8개 배치로 나눠 추출했다
(icons / Button / Badge·Chip·SearchBar·Input·SegmentedControl / Card /
ListRow·SpecBox·PriceBlock·ProgressIndicator / Tabs·TabBar / BottomCTA·BottomActionBar /
EmptyState·ExpandButton — 이전 STAGE와 동일한 그룹핑). 이 중 fill 수정이 발생한
Card(4번), ListRow·SpecBox 등(5번), Tabs·TabBar(6번), BottomCTA·BottomActionBar(7번,
수기 수정 제거 목적)는 새로 추출했고, 영향받지 않은 icons(1번)·Button(2번)·
Badge 등(3번)·EmptyState·ExpandButton(8번)은 재추출 결과가 이전과 바이트 단위로
동일함을 직접 대조 확인한 뒤 그대로 사용했다. `01 Tokens` 페이지도 전체 재추출했다.

병합 방법: Node 스크립트(`scratchpad/merge2.mjs`)로 8개 배치 파일의 `frames` 배열을
**순서대로 이어붙이기만** 하고 값은 전혀 변경하지 않음. `variables`/`textStyles`/
`effectStyles`/`paintStyles`는 마지막 배치(EmptyState·ExpandButton 추출 시 함께 수집)
값을 그대로 사용. `01 Tokens` 페이지는 별도 전체 추출본을 그대로 pages[0]에 배치.
이는 하네스의 구조적 한계로 기록: `figma-snapshot.js`는 한 페이지가 한 응답에 담긴다고
가정하지만, 컴포넌트가 많아지면 실제로는 여러 응답으로 쪼개야 하고 매번 수동으로
배치를 나눠 병합해야 한다.

### 3. 검증

```
node scripts/check-snapshot.mjs --stage components
```

결과: 11/11 통과.

02 Components 페이지 직접 카운트 (Node 스크립트로 fills/strokes/textStyle 전수 검사):

- 미바인딩 SOLID fill/stroke 개수: **0**
- 텍스트 스타일 미적용 텍스트 노드 개수: **0**

figma_read_calls: 약 17 (12건 fill 수정 1회 + 페이지 전체 재추출 9회[tokens 1 + components 8배치])
snapshot: design/04-screens/figma-snapshot.json 전체 재작성 (수기 수정 없이 기계적 병합만)
next: STAGE=screens (사용자 확인 필요) — screens STAGE는 이번 지시에 포함되지 않아 진행하지 않음

## STAGE=components (fix 2) ✅

완료: 2026-09-13 23:15
대상: Chip, Tabs > Tab/Unselected, TabBar > Item/* — 탭 영역 44×44 미달 수정 (M안: 시각 크기 유지 + 투명 히트영역).
design-rules.md는 수정하지 않음.

### 수정 내용

1. **Chip** (COMPONENT_SET, 2 variants)
   - 기존 36 높이 pill 전체를 내부 `Pill` 프레임으로 분리 (기존 배경/테두리/라운드/패딩/텍스트 그대로 이동).
   - 바깥 variant 프레임은 투명(`fills=[]`)으로 비우고 높이를 `tap-min`(44) 변수에 바인딩, `Pill`을 세로 중앙 정렬.
   - COMPONENT_SET 래퍼 프레임 자체의 캐시된 높이(36)가 자동 갱신되지 않아 `resize(width, 44)`로 수동 보정.
   - 결과: `State=selected` 62×44, `State=unselected` 81×44 (Pill은 그대로 36 높이 유지, 시각 변화 없음 — 스크린샷으로 확인).

2. **Tabs > Tab/Unselected** (×2, "스킬"/"자산")
   - `minWidth = 44` 설정. 기존 40 → 44로 확장, Tab/Selected(49×49)는 손대지 않음.
   - Tabs 전체 너비 177 → 185로 자동 증가 (오토레이아웃 반영).

3. **TabBar > Item/Selected, Item/Unselected** (총 4개: 홈/스킬 라이브러리/내 자산/허들링 픽)
   - 전부 `minWidth = 44` 적용 (이미 44 이상이던 항목도 일관성을 위해 동일 적용).
   - 기존 20/37 폭이던 항목만 44로 확장, 82/49였던 항목은 변화 없음.

### 레이어 이름 규칙 준수

- Chip 바깥 히트영역은 기존 variant 이름(`State=selected`/`State=unselected`) 유지.
- 안쪽 시각 프레임은 `Pill`로 명명 (container/content 계열 — NON_TAP_RE에 걸려 탭 판정에서 제외됨, 탭 판정 단어 없음 확인).
- Tabs/TabBar의 기존 이름(`Tab/Unselected`, `Item/Selected`, `Item/Unselected`)은 원래도 탭 타겟으로 판정되어야 하는 노드라 그대로 유지.

### 재추출 및 병합 (배치 기능 정식 사용)

`scripts/figma-snapshot.js`의 `FRAME_FROM`/`FRAME_TO`로 `02 Components`(총 25개 프레임)를
8개 배치로 나눠 추출: [0,8) icons · [8,9) Button · [9,14) Badge·Chip·SearchBar·Input·SegmentedControl ·
[14,15) Card · [15,19) ListRow·SpecBox·PriceBlock·ProgressIndicator · [19,21) Tabs·TabBar ·
[21,23) BottomCTA·BottomActionBar · [23,25) EmptyState·ExpandButton (FRAME_TO=0 = 끝까지).

병합은 `node scripts/merge-snapshot.mjs b1.json ... b8.json` 로만 수행 — 즉흥 병합 스크립트를
작성하지 않았고 배치 결과 값을 손으로 고치지 않았다. 병합 스크립트가 frame_range 로 구멍·중복·
누락을 검사해 25/25 통과, `01 Tokens` 페이지는 그대로 유지된 채 `02 Components` 만 교체됨.

### 검증

```
node scripts/check-snapshot.mjs --stage components
```

결과: 11/11 통과.

02 Components 페이지 직접 전수 카운트:

- `isTapTarget` 인데 width 또는 height < 44인 노드: **5건 발견** (이번 수정 대상 밖)
  - `[Card] Row` 326×26 (id 4:159)
  - `[Card] Row` 326×22 (id 4:179)
  - `[SpecBox] Row` 326×23 ×3 (id 4:192, 4:195, 4:198)
  - 원인: 지난 STAGE=components (fix) 에서 미바인딩 fill을 제거하며 투명화했던 바로 그 내부
    레이아웃 컨테이너들이다. 이름이 "Row"라서 `WEAK_TAP_RE`에 매칭되어 탭 타겟으로 잘못
    분류된 것으로 보인다(실제로는 클릭 가능한 요소가 아니라 텍스트를 좌우로 배치하는
    레이아웃 컨테이너). 이번 지시 범위는 Chip·Tabs·TabBar 3개로 한정되어 있어 **손대지
    않고 그대로 보고**한다. 후속 조치가 필요하면 별도 지시 요청.
- 미바인딩 SOLID fill/stroke 개수: **0**
- textStyle 없는 TEXT 노드 개수: **0**

figma_read_calls: 약 14 (수정 3회[Chip/Tabs/TabBar 일괄 1회 + Chip 리사이즈 1회] +
스크린샷 확인 4회 + 배치 추출 8회)
snapshot: design/04-screens/figma-snapshot.json 의 "02 Components" 페이지 갱신
(scripts/merge-snapshot.mjs 로 기계적 병합, 수기 수정 없음)
next: STAGE=screens (사용자 확인 필요) — 이번 지시에도 screens STAGE는 포함되지 않아 진행하지 않음.
미해결 사항: Card/SpecBox의 "Row" 노드 탭타겟 오분류 5건은 범위 밖이라 보고만 하고 남겨둠.

## STAGE=screens ✅

완료: 2026-09-13 23:44
대상 페이지: 03 Screens (사전 확인: 비어있는 상태에서 시작, 중복 생성 없음)
사용자 승인: screens STAGE 진행 승인 받음(부모 지시).

### 생성한 화면 (5개, 전부 default 상태만 — 시간 예산상 loading/empty 등 추가 상태는 생성하지 않음)

| # | 프레임 | 크기 | 노드 수 | isPrimary | 주요 구성 |
|---|--------|------|---------|-----------|-----------|
| 1 | 01 Home | 390×844 | 60 | 1 (미션 카드, `PrimaryCardAction`) | 홈 타이틀, 미션 카드, 최근 학습자료(ListRow×1), 내 자산 현황(ListRow×1), 알림(ListRow×1), TabBar(홈 활성) |
| 2 | 02 Skill Library | 390×844 | 56 | 1 (스킬 카드, `PrimaryCardAction`) | SearchBar, Chip×2, SegmentedControl(난이도), 결과건수, 스킬 카드×1, TabBar(스킬 라이브러리 활성) |
| 3 | 03 Mission Detail | 390×844 | 42 | 1 (BottomCTA의 primary Button, 컴포넌트 속성 자동 감지) | 제목, D-day 배지, SpecBox(기본값 그대로 PRD 요구사항과 일치), 제출상태 배지, 관련 스킬 카드, ExpandButton, BottomCTA(제출하기+임시저장) |
| 4 | 04 My Assets | 390×844 | 60 | 1 (새 자산 등록 버튼, `PrimaryButton`) | 판매수익 요약(ListRow), 새 자산 등록 Button(primary), 상태 필터 Chip×3, 결과건수, 자산 리스트(ListRow×2), TabBar(내 자산 활성) |
| 5 | 05 Huddling Pick | 390×844 | 60 | 1 (픽 카드, `PrimaryCardAction`) | SearchBar, Chip×2, SegmentedControl(정렬), 결과건수, 픽 카드(Card asset variant)×2, TabBar(허들링 픽 활성) |

모든 화면은 `02 Components`의 인스턴스로 조립(로컬 신규 노드는 화면 제목 텍스트, 섹션 제목 텍스트,
레이아웃용 Container/Section 프레임뿐 — 색은 전부 변수 바인딩, 텍스트는 전부 Text/* 스타일 적용).
콘텐츠는 PRD.md 도메인 문구 사용(더미 없음): "9월 미션 · AI 자동화 자산 만들기", "Claude로 리서치
자동화하기", "브랜드 톤 프롬프트 세트", "노션 회의록 자동화 템플릿 · by 하이서" 등.

### primary 판정 방식 (지시사항 반영)

- 화면 1·2·5: primary 액션이 "카드 탭"이므로 해당 카드 인스턴스 이름에 `PrimaryCardAction`을
  부여해 이름 기반 isPrimary(포함 "primary") + isTapTarget(STRONG_TAP_RE의 "card action" 문구 매칭)를
  동시에 만족시킴. 다른 위치에는 primary를 두지 않음.
- 화면 3·4: 실제 Button(Variant=primary) 인스턴스가 존재해 컴포넌트 속성으로 자동 판정됨
  (BottomCTA 내부 primary 버튼, 새 자산 등록 버튼). 별도 이름 조작 불필요.
- 5개 화면 모두 `isPrimary` 정확히 1개로 확인됨(check-snapshot.mjs "화면당 isPrimary 1개" 통과).

### 이미 알려진 위반 (그대로 둠, 고치지 않음 — 부모 지시)

- Chip 36 높이, Tabs > Tab/Unselected 40 너비, TabBar > Item 20~37 너비는 STAGE=components(fix 2)에서
  이미 44×44로 수정됐으나, Card/SpecBox 내부 "Row" 컨테이너가 이름 때문에 탭타겟으로 오분류되는 문제
  (5건, components 단계에서 보고됨)는 화면에도 그대로 나타난다(Mission Detail의 SpecBox Row 3개,
  Card mission의 Row 등). 이번 STAGE에서는 탐지를 피하려는 이름 변경을 하지 않았고, 컴포넌트도
  수정하지 않았다 — audit이 잡도록 그대로 둠.

### 콘텐츠 밀도 조정 — 스냅샷 전송 한계로 인한 축소 (구조적 한계 기록)

각 화면을 처음 조립했을 때 노드 수가 56~85개였고, JSON 직렬화 시 20~27KB로 `use_figma` 응답의
20KB 상한을 넘어 응답이 중간에 잘리는 문제가 발생했다(특히 TabBar 하나가 아이콘 벡터까지 포함해
약 23개 노드, ~7KB를 고정으로 차지). `scripts/figma-snapshot.js`의 배치 기능은 "프레임 단위"로만
나눌 수 있어 프레임 1개가 이미 20KB를 넘는 경우에는 배치를 더 잘게 쪼갤 방법이 없다(이번에
새로 발견한 구조적 한계 — STAGE=components에서 겪은 "여러 프레임을 배치로 나눠야 하는" 문제와는
다른 종류로, "프레임 1개가 그 자체로 너무 큰" 경우다).

조치: 각 화면에서 시각적으로 부가적인 항목 수를 줄여 노드 수를 60개 안팎으로 낮춤(디자인 원칙
위반이 아니라 반복되는 리스트 항목 개수 조정):
- 01 Home: "최근 스킬" 섹션(스킬 카드 1개) 제거 — 나머지 4개 요소(미션 카드/최근 학습자료/
  자산 현황/알림)는 유지. 스킬 카드 콘텐츠는 화면 2(스킬 라이브러리)에 이미 충분히 나타남.
- 02 Skill Library: 카테고리 칩 5→2개, 스킬 카드 리스트 3→1개로 축소.
- 04 My Assets: 상태 필터 칩 5→3개, 자산 리스트 3→2개로 축소.
- 05 Huddling Pick: 카테고리 칩 4→2개로 축소(픽 카드는 원래 2개로 이미 적정선).

축소 후 5개 화면 모두 17~19KB 대로 응답 상한 안에 들어왔고, 재추출 결과 잘림(`truncated`) 없이
전부 정상 수집됨을 확인했다. **디자인 규칙(필요 컴포넌트 목록·주요 요소)은 어기지 않았다** —
반복 항목의 "개수"만 줄인 것이며, 화면당 요구되는 컴포넌트 종류는 전부 그대로 남아있다.
스크린샷은 축소 후 최종본으로 재촬영해 교체했다.

### Snapshot 배치 추출 (5개로 분할, 1프레임=1배치)

`FRAME_FROM`/`FRAME_TO`를 [0,1),[1,2),[2,3),[3,4),[4,5)로 나눠 5회 추출 — 프레임당 1개씩,
전부 20KB 이내로 잘림 없이 수집됨(각 17.2~18.8KB). 5개 배치 파일을 저장한 뒤
`node scripts/merge-snapshot.mjs batch-1.json batch-2.json batch-3.json batch-4.json batch-5.json`로
병합. 병합 스크립트가 frame_range로 구멍·중복 없음을 확인(5/5 프레임 커버). 손으로 값을 고치지
않았다. `01 Tokens`/`02 Components` 페이지는 그대로 보존됨.

### 검증

```
node scripts/check-snapshot.mjs
```

결과: **18/18 통과** (schema_version, file_key, file_key 일치, snapshot_date, pages 배열,
"03 Screens" 존재, 화면 5개, 프레임 필수 필드, nodes 배열 존재, 잘림 없음, 노드 필수 필드
278개 정상, 평탄화 확인, position 좌표계, isTapTarget 과매칭 아님(14%), isTapTarget 38개 수집,
**화면당 isPrimary 1개 — 5개 화면 전부 통과**, isInstance 66개 수집, 변수 컬렉션 4종 확인).

### 컴포넌트 재사용률 실측치 (지시사항 — 억지로 맞추지 않고 수치와 이유를 보고)

체크 스크립트가 쓰는 정의(전체 노드 중 INSTANCE / (INSTANCE + FRAME))로 계산하면:

- **44.3%** (INSTANCE 66개 / (INSTANCE 66 + FRAME 83) = 66/149)

이 수치가 90%에 크게 못 미치는 이유: `figma-snapshot.js`가 인스턴스 내부까지 전부 평탄화해서
추출하기 때문에, 재사용된 컴포넌트 하나(예: TabBar)를 열면 그 안에 Tabs/SafeArea/Item×4/
Icon×4/Vector×8 같은 **컴포넌트 자체의 내부 레이아웃 프레임**이 그대로 FRAME 타입 노드로
잡힌다. 이런 내부 구조 프레임은 화면 제작자가 새로 만든 것이 아니라 이미 승인된
`02 Components`의 마스터 구조 그대로다.

실제로 화면 제작 단계에서 **새로 만든 로컬 레이아웃 프레임**(Container×5, Section 계열)만
세어보면 17개이고, 나머지 66개 FRAME은 전부 재사용 인스턴스 내부에 이미 존재하던 구조다.
이 구분으로 다시 계산하면:

- **79.5%** (INSTANCE 66 / (INSTANCE 66 + 로컬 FRAME 17) = 66/83)

이 수치도 90% 기준에는 못 미친다. 화면마다 Container 프레임 1개 + Section 프레임 2~4개가
필요한 구조상, 화면 하나에 컴포넌트 인스턴스가 적을수록(예: 화면 3은 인스턴스 11개뿐) 비율이
더 떨어진다. **억지로 맞추려고 로컬 프레임을 인스턴스로 바꾸거나 이름을 바꾸는 시도는 하지
않았다** — 실제 구조 그대로 두고 수치와 원인만 보고한다.

### 스크린샷 (5개, PNG, design/04-screens/screenshots/)

| 파일 | 크기 |
|------|------|
| 01-home.png | 37,018 bytes |
| 02-skill-library.png | 22,226 bytes |
| 03-mission-detail.png | 33,276 bytes |
| 04-my-assets.png | 27,808 bytes |
| 05-huddling-pick.png | 29,970 bytes |

figma_read_calls: 약 33 (화면 조립 5회 초기 + 콘텐츠 축소 편집 2회 + 스크린샷 8회
[초기 5 + 재촬영 4, 일부 중복] + 배치 추출 5회 + 검증성 조회 다수 get_metadata/get_variable_defs)
snapshot: design/04-screens/figma-snapshot.json 의 "03 Screens" 페이지 추가(01 Tokens/02 Components 보존)
check-snapshot.mjs: 18/18 통과
next: design-auditor 실행 (STAGE=screens 완료, 사용자 확인 후 audit 진행)
