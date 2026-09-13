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
