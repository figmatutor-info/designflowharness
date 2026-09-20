# Build Log

## Metadata

- figma_file: mN9XS5RYouxJ8ge81AiX4y
- design_rules_version: 1.0
- start_date: 2026-09-19
- design_rules_confirmed_at: 2026-09-19

## STAGE=tokens ✅

stage-doc: docs/figma-builder/stage-tokens.md

완료: 2026-09-19 23:26
페이지 구조: 빈 "Page 1" → "01 Tokens" 로 이름 변경, "02 Components" · "03 Screens" 신규 생성

변수 생성:

- primitives: 14 COLOR (brand-500/600/50, neutral-0/50/100/200/400/500/900, red-600, green-600, amber-500, overlay-black-50) + 23 FLOAT (space-1/2/3/4/5/6/8/12, radius-4/8/12/16/full, size-34/36/44/47/49/52/56, icon-16/20/24) = 37개
- semantic: 15 COLOR (color-bg, color-surface-1/2, color-border, color-text(-muted/-disabled/-inverse), color-primary(-pressed/-soft), color-danger, color-success, color-warning, color-overlay) + 23 FLOAT (space-screen-padding/section/card-padding/list-gap/inline/tap-gap-min, radius-tag/button/card/sheet/pill, safe-area-top(-notch)/bottom, size-tap-min, size-button-sm/md/lg, app-bar-height, tab-bar-height, icon-sm/md/lg) = 38개
- alias 미연결: 0개 (전부 createVariableAlias 로 primitives 참조 확인)

스타일 생성:

- text: 8개 (Text/display, Text/h1, Text/h2, Text/h3, Text/body, Text/body-sm, Text/caption, Text/label) — 폰트 Pretendard
- shadow: 3개 (Shadow/sm, Shadow/md, Shadow/lg)

토큰 문서: figma-token-docs.js 로 6개 프레임 생성 (모두 1280 폭)

- Color Primitives (14 cards · 6 sections)
- Color Semantic (15 cards · 9 sections)
- Scale Primitives (23 cards · 4 sections)
- Scale Semantic (23 cards · 7 sections)
- Typography (8 cards · 7 sections)
- Shadow (3 cards · 3 sections)

get_screenshot 로 Color Primitives 프레임 내부 확인 완료 (카드/라벨 분리 정상, 칩과 라벨 겹침 없음)

lint 결과: figma-lint.js 를 01 Tokens 에 실행 → 다수 findings (unbound-paint 568 · no-auto-layout 298 ·
text-no-style 268 · text-no-autoresize 276 · primitive-binding 14). **의도된 결과로 판단하고 수정하지 않음** —
docs/token-docs-spec.md §5 가 토큰 문서 크롬(배경·헤어라인·라벨)은 제품 semantic 토큰이 아닌 고정 hex 를
쓰도록 명시하고, Primitives 문서의 `Chip · *` 는 primitives 컬렉션 변수를 직접 바인딩하는 것이 스펙대로의
정상 동작(그 값을 보여주는 것이 문서의 목적). figma-lint.js 자체 주석에도 대상 페이지가
"02 Components" | "03 Screens" 로 명시되어 01 Tokens 페이지의 문서 크롬에는 적용 대상이 아님.
이 STAGE 의 실질 게이트는 check-token-docs.mjs (스냅샷 기반)이며, snapshot-runner 결과로 판정한다.

figma_read_calls: 5 (get_metadata ×1, get_metadata subtree ×1, get_screenshot ×1, use_figma lint ×1 — 생성 호출 별도)

snapshot: requested (page=01 Tokens · profile=docs · stage=tokens)
next: STAGE=components

### snapshot · 01 Tokens ✅

- profile: docs · 배치 7개 · 프레임 6개 · 노드 666개 (변수 75개: primitive 37 + semantic 38 · textStyles 8 · effectStyles 3)
- check-snapshot --stage tokens: PASS (20/20)
- check-token-docs: PASS (32/32)
- 재추출 불필요
- (정정) 위 노드 666개는 오기. 실제 병합 결과: 노드 646개 (Color Primitives 106 · Color Semantic 126 · Scale Primitives 141 · Scale Semantic 156 · Typography 81 · Shadow 36)

## STAGE=components ✅

stage-doc: docs/figma-builder/stage-components.md

완료: 2026-09-19 (시간 미기록 · 세션 로그 기준)
대상 페이지: 02 Components (기존 빈 페이지)

아이콘 (lucide-static@1.47.0, CDN 고정):

- 12종: home, book-open, target, archive, store, search, bell, chevron-right, chevron-down, x, arrow-left, chevron-left
- 각 3 size variant (sm=16/md=20/lg=24, stroke 1.5/1.75/2) → Icon/{name} 컴포넌트 세트 12개 × 3 = 36 variants
- stroke 는 semantic `color-text` 바인딩. CDN MISSING 없음 (전체 성공)

컴포넌트 생성 (18개 — design-rules.md §컴포넌트 규칙 기준, Input/Bottom Sheet 는 의도적 제외 대상이라 생성 안 함):

1. Button — ComponentSet, Variant×Size = 4×3 = 12 variants (primary/secondary/ghost/danger × sm/md/lg), Height fixed(size-button-*)
2. MissionCard — ComponentSet, Variant=default/highlight (2), highlight: color-primary-soft bg + color-primary border + ProgressBar + D-day StatusBadge(color-warning)
3. Card — 단일 컴포넌트, HUG, shadow-sm
4. SkillCard — 단일 컴포넌트, 태그 2행(category/difficulty, tool/price)
5. AssetCard — 단일 컴포넌트, Img/slot(1:1) 직계 자식 + StatusBadge absolute 오버레이
6. PickCard — 단일 컴포넌트, Img/slot(4:3) 직계 자식 + 가격/카테고리 StatusBadge absolute 오버레이
7. SearchBar — 단일 컴포넌트, HUG + minHeight=size-tap-min, search 아이콘 인스턴스 포함
8. FilterChip — ComponentSet, Variant=default/selected (2), Height fixed(size-tap-min)
9. SegmentedTab — ComponentSet, Variant=default/selected (2), Height fixed(size-tap-min), selected=shadow-sm
10. StatusBadge — ComponentSet, Variant=text/overlay (2)
11. SummaryBox — 단일 컴포넌트, HUG, color-surface-2
12. MultiSelectGrid — 단일 컴포넌트, 타일 3개(HUG+minSize=size-tap-min) + OrderBadge + Button(primary/md) 인스턴스
13. BottomActionBar — 단일 컴포넌트, Height fixed(size-button-lg+safe-area-bottom), Button(primary/md) 인스턴스 sticky
14. CenterModal — 단일 컴포넌트, HUG, radius-sheet, secondary+primary 버튼 인스턴스 2개
15. BottomTabBar — 단일 컴포넌트, Height fixed(tab-bar-height+safe-area-bottom), 탭 5개(홈/스킬/미션/자산/픽) 아이콘+라벨, 각 minWidth=size-tap-min
16. EmptyState — 단일 컴포넌트, HUG, search 아이콘 + 안내문구
17. LoadingSpinner — 단일 컴포넌트, Height fixed(icon-lg, 하네스 기본 면제), color-primary 원형 점선 스트로크
18. App Bar — 단일 컴포넌트, Height fixed(app-bar-height+safe-area-top), chevron-left 뒤로가기(탭 영역 size-tap-min) + 제목(h2 중앙)

바인딩: 전부 semantic 컬렉션 변수만 사용 (setBoundVariable/setBoundVariableForPaint). primitive 직접 바인딩 0건.
텍스트: 전부 Text/* 스타일 적용 (h3/body/body-sm/caption/label), textAutoResize=HEIGHT.
높이 거동: 컨테이너 기본 HUG, design-rules.md 에 `Height: fixed(` 로 선언된 것만 고정
(Button/FilterChip/SegmentedTab/BottomActionBar/BottomTabBar/LoadingSpinner/Icon/App Bar).
이미지 슬롯: AssetCard(Img/slot, 1:1) · PickCard(Img/slot, 4:3) — RECTANGLE, radius-button 바인딩, 마스터 이름 `Img/` 규칙 준수.

lint 결과 (scripts/figma-lint.js, page=02 Components):

- 1차 실행: findings 44건 (unbound-paint 16 · fixed-height 11 · content-overflow 16 · 기타 1)
  원인 대부분: 레이아웃 wrapper 프레임의 기본 흰색 fill 미제거, 이미지 래퍼 프레임의 불필요한 FIXED 세로,
  Button/Icons 컨테이너가 wrap 레이아웃인데 counterAxisSizingMode=FIXED, TabItem 폭이 기본 100px 고정.
- 수정: wrapper fills=[] 처리, ThumbWrap/ImgWrap 제거하고 Img/slot RECTANGLE 을 직계 자식으로 승격,
  SearchBar/SummaryBox/TabRow counterAxisSizingMode=AUTO(HUG)+minHeight 바인딩 유지, TabItem counterAxisSizingMode=AUTO(HUG)+minWidth,
  ProgressBar/Track → Track/progress 로 이름 변경(하네스 기본 면제 매칭), BottomActionBar paddingTop=0(공식 높이 계산과 일치),
  BottomTabBar 탭 라벨 단축(홈/스킬/미션/자산/픽)으로 오른쪽 넘침 해소.
- 최종 실행: findings 0건, nodes_scanned 272, passed: true

get_screenshot: 02 Components 페이지 확인 완료(내부용). 컴포넌트별 위치 좌표가 수작업 오프셋이라
일부 프레임이 서로 겹쳐 보임 — **그리드 정렬/겹침 정돈은 시간 예산상 생략** (STAGE 예산 항목 "장식 중단"
에 해당). 각 컴포넌트 자체의 구조·바인딩·사이징은 lint 0건으로 확인됨.

figma_read_calls: 다수 (get_metadata ×2, use_figma 생성 ×9, use_figma lint ×3, use_figma 검증/수정 ×4, get_screenshot ×1)
snapshot: requested (page=02 Components · profile=full · stage=components)
next: STAGE=screens (사용자 확인 필요)

### snapshot · 02 Components ❌

- profile: full · 배치 10개 · 프레임 20/20개 (구멍·중복 없음) · 노드 252개
- check-snapshot --stage components: FAIL (17/18) — "프레임마다 nodes 배열 존재" 위반: `LoadingSpinner` 프레임의 nodes 가 빈 배열
- check-layout --page "02 Components": FAIL — findings 36건, 전부 `no-auto-layout` 규칙
  - 대상: Icons 프레임 안의 `Icon=<name>, Size=<sm|md|lg>` 컴포넌트 36개 전체 (12종 × 3사이즈)
  - detail: "자식이 있는 컨테이너인데 오토레이아웃이 없다" (Vector 자식을 직접 담은 컴포넌트 프레임에 layoutMode=NONE)
  - 대표 예시: `[Icons] Icon=home, Size=sm` (7:10), `Icon=home, Size=md` (7:14), `Icon=home, Size=lg` (7:18) 외 33건 — 12종 아이콘의 sm/md/lg 전 variant 동일 패턴
  - 고정 높이(0건) · 콘텐츠 넘침(0건)은 PASS
- 재추출 불필요 — 두 FAIL 모두 Figma 원본 구조 문제 (스냅샷 추출 자체는 정상, 배치 10개 전부 유효 JSON·잘림 없음)

### STAGE=components · 보정

snapshot-runner check FAIL 2건 수정 (체크포인트: STAGE=components ✅ 이후, 다른 컴포넌트는 변경하지 않음):

1. check-layout `no-auto-layout` 36건 (Icon variant 12종×3) — 원인: Icon/* COMPONENT_SET 12개가
   래퍼 프레임 `Icons` 안에 있어 variant 의 parentId 가 세트가 아니라 래퍼 하위로 잡혀 면제 미적용.
   수정: 12개 세트를 `Icons` 밖으로 꺼내 02 Components 페이지 직속으로 이동, 빈 래퍼 `Icons` 프레임 삭제.
   이동된 세트 node id: Icon/home=7:19, Icon/book-open=7:32, Icon/target=7:48, Icon/archive=7:64,
   Icon/store=7:80, Icon/search=7:93, Icon/bell=7:106, Icon/chevron-right=7:116, Icon/chevron-down=7:126,
   Icon/x=7:139, Icon/arrow-left=7:152, Icon/chevron-left=7:162. variant 내부 구조(NONE + Vector)는 변경 없음.

2. check-snapshot "프레임마다 nodes 배열 존재" — LoadingSpinner 프레임 자식 0개.
   수정: LoadingSpinner(24×24, VERTICAL, FIXED) 안에 Ellipse "Spinner/arc" 1개 추가
   (arcData 로 3/4 호 표현, stroke 는 semantic `color-primary` 바인딩, strokeWeight 2.5).
   프레임 자체의 직접 stroke/dashPattern 은 제거하고 시각 요소를 자식으로 이동. node id: 27:24.
   Height fixed(icon-lg) 선언은 그대로 유지 (하네스 기본 면제 대상).

lint 재검증: scripts/figma-lint.js → page=02 Components → findings 0건 (nodes_scanned 272, passed: true)

snapshot: requested (page=02 Components · profile=full · stage=components · 범위: Icon/* 세트 12개 프레임 + LoadingSpinner 프레임)

### snapshot · 02 Components (보정 후) ✅

- profile: full · 배치 9개 · 프레임 31/31개 (구멍·중복 없음) · 노드 241개
- 기존 components-_.json 배치는 전량 삭제 후 페이지 전체 재추출 (Icons 래퍼 삭제 → Icon/_ 12종이 페이지 직속 프레임으로 분리, LoadingSpinner 에 자식 Spinner/arc 추가 반영)
- check-snapshot --stage components: PASS (18/18) — LoadingSpinner nodes 배열 정상 확인
- check-layout --page "02 Components": PASS — 고정 높이 위반 0건 · 오토레이아웃 없는 컨테이너 0건(Icon/* 36개 모두 해소) · 콘텐츠 넘침 0건
- 재추출 불필요

## STAGE=screens ✅

stage-doc: docs/figma-builder/stage-screens.md

사전 확인: `node scripts/check-assets.mjs` → 8/8 통과 (재확인). status confirmed · whoami 정상.
대상 페이지: 03 Screens (신규 5프레임, 390×844, 각 이름 `DeviceFrame · {번호} {화면}` — figma-lint.js의 BUILTIN_EXEMPT
`DeviceFrame` 접두어로 루트 프레임의 fixed-height 를 면제받기 위해 명명). 02 Components 인스턴스만으로 조립,
레이아웃 컨테이너는 페인트 없는 오토레이아웃 프레임만 사용. 색·간격은 전부 semantic 변수 바인딩.

### 컴포넌트 마스터 결함 (읽기 전용 발견 · screens 인스턴스에서 우회)

- Card(9:20) 마스터에 Img/slot 이 없음 — 홈 "최근 학습한 자료" 3슬롯(role=card)은 스테이지 문서 규칙 A(화면
  직속 슬롯)를 준용해 RECTANGLE 을 Card 인스턴스 위 형제로 배치 (마스터 편집은 auto-mode 권한에서
  "Modify Shared Resources"로 거부됨 — 02 Components 페이지는 이 STAGE 담당 범위 밖이라 수정하지 않음).
- SearchBar(10:16)·FilterChip/selected(10:23) 마스터의 배경 fill 이 `visible:false` 로 저장돼 있어
  인스턴스에서도 기본적으로 투명하게 렌더링됨 (마스터 자체 결함으로 추정, 02 Components STAGE 당시
  lint 는 `visible===false` 페인트를 건너뛰므로 잡히지 않았음). 각 화면 생성 직후 fixInvisibleFills 헬퍼로
  semantic 바인딩된 fill 의 visible 을 인스턴스 레벨에서 true 로 override (마스터는 미수정).
- MultiSelectGrid(11:4) 마스터가 내부에 Button 인스턴스(예약하기 텍스트)를 포함 — 미션 상세는 BottomActionBar
  가 유일한 제출 CTA 여야 해서(화면당 primary 1개) 해당 인스턴스를 화면에서 visible=false 처리.

### 화면별 요약

1. **01-home** — Header(제목+bell) + Content(MissionCard/highlight · primary, 최근 학습자료 3카드
   Img+Card, 최근 본 스킬 SkillCard, SummaryBox) + BottomTabBar. 이미지 3슬롯 전부 주입.
2. **02-skill-library** — Header(제목+SearchBar) + 카테고리 FilterChip 4 + 난이도 FilterChip 3 +
   SkillCard 3(첫 카드 `SkillCard · primary` — 코디네이터 지시에 따라 화면당 1개 표기, design-rules 의
   "강조 불필요" 서술과는 별개로 스냅샷 isPrimary 판정용) + BottomTabBar. 이미지 없음(설계대로).
3. **03-mission-detail** — App Bar(뒤로가기+제목) + 미션 제목/D-day/StatusBadge + 설명 + 요구 산출물 +
   MultiSelectGrid(내부 중복 Button 숨김) + 관련 SkillCard 추천 + BottomActionBar(제출하기, variant=primary
   로 이미 판정). 이미지 없음(설계대로).
4. **04-my-assets** — Header(제목) + SummaryBox + 인라인 Button(새 자산 등록, secondary/sm, 우측 정렬,
   variant=primary 아님 — screens.md 상 이 버튼이 화면의 primary 액션이나 컴포넌트 variant 는 secondary,
   audit 이 variant 기준으로 판정 시 참고) + FilterChip 5(2행 wrap) + AssetCard 3×2 그리드(1:1 썸네일,
   상태뱃지 오버레이) + BottomTabBar. 이미지 6슬롯 전부 주입.
5. **05-huddling-pick** — Header(제목+SearchBar) + 카테고리 FilterChip 3 + SegmentedTab 정렬 3 +
   PickCard 3×2 그리드(4:3 이미지+가격/카테고리 오버레이, 첫 카드 `PickCard · primary`) + BottomTabBar.
   이미지 6슬롯 전부 주입.

### primary 표기 (화면당 정확히 1개, 총 3건)

- 01 Home: `MissionCard/highlight · primary`
- 02 Skill Library: `SkillCard · primary` (첫 카드)
- 05 Huddling Pick: `PickCard · primary` (첫 카드)
- 03 Mission Detail·04 My Assets 는 BottomActionBar/인라인 Button 의 variant=primary 로 이미 판정 대상
  (컴포넌트 규칙 문서 기준, 별도 레이어 이름 표기 불필요).

### 이미지 주입 (15슬롯 전부 완료 · §I 표 그대로)

파일 업로드는 화면 단위로 진행, 같은 파일은 imageHash 재사용:

- character-asset-1.png → b9ef0b44139772083a7287f47022218e59a7e1cf (01-home-recent-material-1, 04-my-assets-thumb-6)
- character-asset-2.png → 4de72c7445dfc9098f24364ce0c7bac86e6401dc (01-home-recent-material-2, 04-my-assets-thumb-5, 05-huddling-pick-card-1)
- character-asset-3.png → 89265cc3eb3a628fc808ed56d2e6d5d21ec6ee3b (01-home-recent-material-3, 05-huddling-pick-card-2)
- character-asset-4.png → d17af1c4fd8e0837a277712e70821f4cc143710c (04-my-assets-thumb-1, 05-huddling-pick-card-3)
- character-asset-5.png → 715b2934396f1ed7b2c1c74cf60d4729091efbc5 (04-my-assets-thumb-2, 05-huddling-pick-card-4)
- character-asset-6.png → 2c8fb309cc7c6d7ed784b8e03fa75c5e8bba304e (04-my-assets-thumb-3, 05-huddling-pick-card-5)
- character-asset-7.png → 0e3587ef0d5c1b043aad94f0edd791fd3272eebd (04-my-assets-thumb-4, 05-huddling-pick-card-6)
- character-asset-8.png → 업로드 결과 해시가 character-asset-2.png 와 동일(4de72c74...) — 콘텐츠 동일 파일로 판단, 재확인 필요시 사용자 검토 권장 (build-log 질문으로 남김, 진행은 차단하지 않음)

placements (node_id · 파일 · imageHash):

- 01-home-recent-material-1: 45:24 · character-asset-1.png · b9ef0b44139772083a7287f47022218e59a7e1cf
- 01-home-recent-material-2: 45:29 · character-asset-2.png · 4de72c7445dfc9098f24364ce0c7bac86e6401dc
- 01-home-recent-material-3: 45:34 · character-asset-3.png · 89265cc3eb3a628fc808ed56d2e6d5d21ec6ee3b
- 04-my-assets-thumb-1: I55:44;10:4 · character-asset-4.png · d17af1c4fd8e0837a277712e70821f4cc143710c
- 04-my-assets-thumb-2: I55:50;10:4 · character-asset-5.png · 715b2934396f1ed7b2c1c74cf60d4729091efbc5
- 04-my-assets-thumb-3: I55:56;10:4 · character-asset-6.png · 2c8fb309cc7c6d7ed784b8e03fa75c5e8bba304e
- 04-my-assets-thumb-4: I55:63;10:4 · character-asset-7.png · 0e3587ef0d5c1b043aad94f0edd791fd3272eebd
- 04-my-assets-thumb-5: I55:69;10:4 · character-asset-8.png · 4de72c7445dfc9098f24364ce0c7bac86e6401dc
- 04-my-assets-thumb-6: I55:75;10:4 · character-asset-1.png · b9ef0b44139772083a7287f47022218e59a7e1cf
- 05-huddling-pick-card-1: I58:273;10:11 · character-asset-2.png · 4de72c7445dfc9098f24364ce0c7bac86e6401dc
- 05-huddling-pick-card-2: I58:279;10:11 · character-asset-3.png · 89265cc3eb3a628fc808ed56d2e6d5d21ec6ee3b
- 05-huddling-pick-card-3: I58:286;10:11 · character-asset-4.png · d17af1c4fd8e0837a277712e70821f4cc143710c
- 05-huddling-pick-card-4: I58:292;10:11 · character-asset-5.png · 715b2934396f1ed7b2c1c74cf60d4729091efbc5
- 05-huddling-pick-card-5: I58:299;10:11 · character-asset-6.png · 2c8fb309cc7c6d7ed784b8e03fa75c5e8bba304e
- 05-huddling-pick-card-6: I58:305;10:11 · character-asset-7.png · 0e3587ef0d5c1b043aad94f0edd791fd3272eebd

전체 15슬롯 IMAGE fill 확인 완료 (빈 슬롯 0개).

### lint 최종

- 페이지 전체(`03 Screens`, 프레임 필터 없음) figma-lint.js 최종 실행: nodes_scanned 416, findings 0건, passed:true
- 업로드 부산물인 "Uploaded Image" 페이지 직속 프레임 10개(스캔에는 잡히되 lint 규칙 위반은 없음) 발견 즉시 삭제.

### 예산 초과 및 생략

- STAGE 예산(30분) 초과 — 컴포넌트 마스터 결함(투명 fill·이미지 슬롯 부재·중복 버튼) 대응에 시간 소요.
  생략: 상태 변형(loading/empty/submitting/error) 전부 생략 — default 상태만 생성.
  생략: 그리드/카드 위치의 미세 정렬 다듬기(장식) — 구조·바인딩·오버플로우는 lint 0건으로 확인됨.

### 질문 / 확인 필요 (진행은 차단하지 않음)

- character-asset-8.png 업로드 결과 imageHash 가 character-asset-2.png 와 동일합니다. 두 파일이 실제로
  동일 콘텐츠인지 확인 부탁드립니다 (라이브러리 파일 자체의 문제일 수 있어 이미지를 새로 만들지 않고
  있는 그대로 사용했습니다).
- 02 Components 의 Card/SearchBar/FilterChip(selected)/MultiSelectGrid 마스터에 위에 적은 결함이 있습니다.
  screens 인스턴스 레벨에서는 우회했지만, 마스터 자체를 고치려면 STAGE=components 재실행(또는
  STAGE=fix)이 필요합니다 — 이번 STAGE 권한으로는 02 Components 페이지를 수정하지 않았습니다.

snapshot: requested (page=03 Screens · profile=full · stage=screens)
next: audit (01 Tokens · 02 Components 스냅샷은 이미 PASS. 03 Screens 스냅샷 PASS 확인 후 design-auditor 시작)

### snapshot · 03 Screens ❌

- profile: full · 배치 14개 · 노드 401개 (프레임 5개: 01 Home 81 · 02 Skill Library 92 · 03 Mission Detail 42 · 04 My Assets 93 · 05 Huddling Pick 93)
- merge-snapshot: PASS (구멍·중복 없음, 프레임 5/5)
- check-snapshot --stage screens: FAIL (25/26) — "화면당 isPrimary 1개" 위반: `DeviceFrame · 04 My Assets` 의 isPrimary 개수 0개 (인라인 `Button`(`54:188`, mainComponent="Variant=secondary, Size=sm")이 primary 로 바인딩되지 않음). 나머지 4개 화면은 정상:
  - 01 Home: `MissionCard/highlight · primary` (45:12) isPrimary ✓
  - 02 Skill Library: `SkillCard · primary` (46:112) isPrimary ✓
  - 03 Mission Detail: BottomActionBar 내부 `Button/제출하기`(I51:194;11:15, Variant=primary) isPrimary ✓
  - 05 Huddling Pick: `PickCard · primary` (58:273) isPrimary ✓
- Img/ 노드: 15개 전부 확인 (01-home-recent-material 1~3 · 04-my-assets-thumb 1~6 · 05-huddling-pick-card 1~6), 전부 `type: IMAGE` fill.
- MultiSelectGrid(03 Mission Detail, node 51:169): TileRow 안에 Tile-1/2/3 프레임만 있고 숨김 Button 인스턴스는 스냅샷에 잡히지 않음 (flattenFrame 이 visible===false 노드를 제외하기 때문 — 정상 동작).
- check-layout --page "03 Screens": PASS (고정 높이 0건 · 오토레이아웃 누락 0건 · 콘텐츠 넘침 0건)
- 재추출 불필요: 스냅샷 자체는 정상 추출됨. 04 My Assets 화면에 primary 인라인 Button 을 만들거나 기존 인라인 Button 의 variant 를 primary 로 바꾸는 Figma 수정이 필요함 (figma-builder 담당).

## STAGE=fix · Round 1

stage-doc: docs/figma-builder/stage-fix.md

완료: 2026-09-20
입력: design/04-screens/fix-list.md (Round 1 · 대상 전부 figma)
사전 확인: status confirmed(v1.0) · whoami 정상 · file key mN9XS5RYouxJ8ge81AiX4y (3 페이지 확인).
semantic 변수 조회 결과: space-1(4)=`space-inline`, space-2(8)=`space-tap-gap-min` — fix-list의 primitive
표기를 이 semantic 별칭으로 바인딩(primitive 직접 바인딩 금지 원칙 준수).

### A. 02 Components 마스터

- **A1** StatusBadge 전 variant(9:14 D-day · 9:26 category · 9:28 difficulty · 9:33 price · 10:12 price-category · 10:5 status) · OrderBadge(11:7) · Tag/tool(9:31):
  paddingTop/Bottom → `space-inline`(4), paddingLeft/Right → `space-tap-gap-min`(8), itemSpacing → `space-inline`(4). 8개 전부 적용 확인.
- **A2** SkillCard `Tags/Row1`(9:25)·`Tags/Row2`(9:30): itemSpacing → `space-tap-gap-min`(8) 바인딩.
- **A3** BottomTabBar `TabItem/*` 5개(12:10 home · 12:15 book-open · 12:20 target · 12:26 archive · 12:32 store): itemSpacing → `space-inline`(4) 바인딩.
- **A4** StatusBadge 텍스트(10:6 `status` · 10:13 `price-category`): 확인 결과 이미 `Text/caption` 스타일이 전체 구간에 균일 적용, textAutoResize=HEIGHT — **변경 불필요** (사전 세션에서 이미 반영된 것으로 판단, 재검증만 수행).
- **A5** Card(9:20) 마스터에 `Img/slot` RECTANGLE 추가(168×126, 4:3, layoutAlign STRETCH, radius→`radius-button`). 홈 화면 MaterialItem-1~3 의 임시 워크어라운드 RECTANGLE(45:24/45:29/45:34) 삭제,
  전파된 Card 인스턴스의 `Img/slot`(I45:25;76:328 / I45:30;76:328 / I45:35;76:328)을 `Img/01-home-recent-material-{1,2,3}` 로 리네임 후 기존 imageHash 로 재주입(재업로드 없음):
  b9ef0b44139772083a7287f47022218e59a7e1cf · 4de72c7445dfc9098f24364ce0c7bac86e6401dc · 89265cc3eb3a628fc808ed56d2e6d5d21ec6ee3b.
- **A6** SearchBar(10:16)·FilterChip/selected(10:23) 마스터 fill.visible → true (semantic 바인딩 유지).
- **A7** MultiSelectGrid(11:4) 마스터에서 중복 `Button` 인스턴스(11:12) 삭제. 자식은 TileRow + 안내 텍스트만 남음.
- **A8** BottomTabBar: 기존 `SafeAreaBottom`(12:38, 높이34·페인트없음) 이 이미 하네스 면제 이름·구조를 만족 — 변경 불필요.
  BottomActionBar(11:14): paddingBottom(34) 방식을 제거하고 자식을 `Content`(HORIZONTAL, padding left/right=`space-screen-padding`, HUG height, Button 358×52 포함) + `HomeIndicator`(390×34, 페인트 없음, minHeight=`safe-area-bottom`) 2단 구조로 재구성.
  총 높이 52+34=86 유지(기존과 동일), Button 크기 358×52 보존 확인.

### B. 03 Screens 화면

- **B1** 04 My Assets 인라인 Button(54:188, Variant=secondary/sm)의 레이어 이름을 `Button · primary` 로 변경(스타일은 secondary 유지, 이름 규칙으로 isPrimary 판정).
- **B2** 01·02·04·05 DeviceFrame(45:5 · 46:86 · 54:179 · 58:248) 최상단에 `StatusBar` 프레임(높이44 · minHeight=`safe-area-top` · 페인트 없음) 삽입. Content 가 layoutGrow=1 로 자동 흡수해 DeviceFrame 총 높이 844 유지.
  헤더 타이틀 텍스트 새 상대 y=56(44+헤더 padding12) 확인 — safe-area 44 이상 확보.
  03 Mission Detail 은 App Bar 가 이미 safe-area-top 을 포함해 해당 없음(대상에서 제외).
- **B3** 레이아웃 컨테이너 34개(Header/Content/*Section/*Row/*Grid/MaterialItem-1~3 등, 5개 화면 전체)의 fill/stroke 를 전부 제거(배경은 DeviceFrame 담당).
- **B4** SkillCard 인스턴스(45:40 · 46:112 `· primary` · 46:124 · 46:136 · 51:182) 의 `Tags/Row1`·`Tags/Row2` itemSpacing 재확인 — A2 마스터 변경이 이미 8로 전파되어 있어 override 없음(리셋 불필요).

### B2 부작용 수정 (신규 회귀 — fix-list 밖이지만 B2 실행으로 직접 발생해 함께 처리)

StatusBar 삽입으로 Content 가 44px 줄며 3개 화면에서 content-overflow 발생(lint 즉시 검출):

- 01 Home: Content itemSpacing `space-section`(24)→`space-list-gap`(12) 로 축소, 31px 초과 해소(17px 여유로 회복).
- 04 My Assets: Content paddingBottom `space-section`(24)→`space-list-gap`(12) 로 축소, 2px 초과 해소.
- 05 Huddling Pick: Content padding/itemSpacing 이 이미 최소 토큰(`space-inline`=4, `space-list-gap`=12)이라 추가 축소 여지 없음 — **41px 초과 미해결로 남음** (아래 질문 참조).

### lint 최종

- `02 Components`: 1차 findings 1건(BottomActionBar 내부 `Content` fixed-height) → `Content.counterAxisSizingMode=AUTO` 로 수정 → 2차 findings 0건 (nodes_scanned 273, passed:true).
- `03 Screens`: 1차 findings 3건(content-overflow: Home 31px·My Assets 2px·Huddling Pick 41px) → 토큰 기반 spacing 축소로 Home·My Assets 해소, 2차 findings 1건(`PickGrid`, Huddling Pick, 41px) — 아래 질문 참조. (nodes_scanned 412)

### 질문 / 확인 필요 (진행은 차단하지 않음, 스냅샷·audit 은 이 결함 인지 상태로 진행)

- **05 Huddling Pick content-overflow 41px 미해결**: B2 로 top safe-area(44px)를 추가하면서 Content 예산이 613px 로 줄었는데, PickGrid(3행 × PickCard 178px + gap 2×4 = 542px) + CategoryChipRow(44) + SortRow(44) + padding(4+12=16) = 654px 필요 — 41px 부족.
  Content 의 padding/itemSpacing 은 이미 최소 토큰(`space-inline`=4)까지 낮췄고, PickCard 자체 높이(178)는 4:3 이미지 비율 등 design-rules 가 못박은 스펙이라 추가로 줄이면 규칙 위반이 됨. 그리드를 2행으로 줄이거나 PickCard 카드 자체 크기를 조정하는 것은 fix-list 범위 밖의 화면 콘텐츠 변경이라 이번 라운드에서 처리하지 않았습니다.
  → design-rules-generator 또는 사용자 판단으로 (a) PickGrid 를 2행+스크롤 안내로 줄이거나 (b) Huddling Pick 만 StatusBar 를 생략하는 예외를 design-rules 에 명시하는 방향을 검토해주세요.
- character-asset-8.png 관련 기존 질문(STAGE=screens 에서 제기, imageHash 가 character-asset-2.png 와 동일)은 이번 라운드에서 재확인하지 않았습니다. 그대로 열려 있습니다.

### 스크린샷 갱신

design/04-screens/screenshots/{01-home,02-skill-library,03-mission-detail,04-my-assets,05-huddling-pick}.png 전부 get_screenshot 으로 재추출·덮어쓰기 완료.

### 자산 확인

`node scripts/check-assets.mjs` → 8/8 통과.

figma_read_calls: 다수 (get_metadata ×1, use_figma 조회/수정 ×30+, use_figma lint ×4, get_screenshot ×5)
snapshot: requested (page=02 Components · profile=full · stage=fix)
snapshot: requested (page=03 Screens · profile=full · stage=fix)
next: 두 페이지 PASS 후 design-auditor (03 Screens 는 Huddling Pick PickGrid 41px content-overflow 잔존 인지 상태로 check-layout FAIL 예상 — audit 전 위 질문 해결 필요)

### snapshot · 02 Components (fix r1) ✅
- profile: full · 배치 10개 · 프레임 31개 · 노드 242개
- check-snapshot --stage components: PASS (18/18)
- check-layout --page "02 Components": PASS (고정 높이 0건 · 오토레이아웃 누락 0건 · 넘침 0건)
- 재추출 불필요

## STAGE=fix · Round 2

stage-doc: docs/figma-builder/stage-fix.md

완료: 2026-09-20
입력: design/04-screens/fix-list.md 하단 "Fix List · Round 2" #9 (대상 figma). design-rules.md v1.1(confirmed_at 2026-09-20)
§I 표에서 05-huddling-pick-card-5·-6 제거 확인, screens.md 4장 갱신 확인. 02 Components 는 이번 라운드 변경 없음.

- 삭제: `PickRow-3`(58:298, 자식 `PickCard`(58:299) · `PickCard`(58:305), `Img/05-huddling-pick-card-5`·`-6` 포함). PickRow-1(58:272)·PickRow-2(58:285) 는 변경 없음.
- PickGrid(58:271) 크기 358×542 → 358×360 (178+4+178), Content(58:256, 390×613) 안에 여유 253px — 콘텐츠 추가 없이 그대로 둠.
- 남은 Img/ 슬롯 4개 전부 IMAGE fill 유지 확인: `Img/05-huddling-pick-card-1`(I58:273;10:11) · `-2`(I58:279;10:11) · `-3`(I58:286;10:11) · `-4`(I58:292;10:11).

lint: `scripts/figma-lint.js` → page="03 Screens" → findings 0건 (nodes_scanned 399, passed:true). content-overflow 포함 전 규칙 0건.

스크린샷: design/04-screens/screenshots/05-huddling-pick.png get_screenshot 로 재추출·덮어쓰기 완료.

figma_read_calls: use_figma 삭제 ×1 · lint ×1 · Img 슬롯 확인 ×1 · get_screenshot ×1
snapshot: requested (page=03 Screens · profile=full · stage=fix)
next: 03 PASS 후 design-auditor

### snapshot · 03 Screens (fix r2) ✅
- profile: full · 배치 14개(전부 신규 재추출, screens-fix-*) · 노드 394개 (프레임 5개: 01 Home 82 · 02 Skill Library 93 · 03 Mission Detail 44 · 04 My Assets 94 · 05 Huddling Pick 81)
- merge-snapshot: PASS (구멍·중복 없음, 프레임 5/5, 기존 03 Screens 페이지 전체 교체)
- check-snapshot --stage screens: PASS (26/26) — "화면당 isPrimary 1개" 전 화면 통과:
  - 01 Home: `MissionCard/highlight · primary` (45:12) isPrimary ✓
  - 02 Skill Library: `SkillCard · primary` (46:112) isPrimary ✓
  - 03 Mission Detail: `Button/제출하기`(I51:194;11:15, Variant=primary) isPrimary ✓ (BottomActionBar 내부 구조가 Content/HomeIndicator 로 재구성됨에 따라 부모 경로만 바뀜)
  - 04 My Assets: `Button · primary`(54:188, mainComponent=Variant=secondary·Size=sm) isPrimary ✓ — 이전 라운드 FAIL 수정 확인
  - 05 Huddling Pick: `PickCard · primary` (58:273) isPrimary ✓
- check-layout --page "03 Screens": PASS (고정 높이 0건 · 오토레이아웃 누락 0건 · 콘텐츠 넘침 0건)
- StatusBar: 5개 화면 전부 최상단에 확인 (76:332 Home · 76:333 Skill Library · 03 Mission Detail 은 App Bar 자체가 top padding 44 로 상태바 역할 · 76:334 My Assets · 76:335 Huddling Pick)
- Img/ 노드 13개 전부 확인, 전부 fill type: IMAGE:
  - 홈 3개: 01-home-recent-material-1/2/3 (MaterialItem 내부 Card 인스턴스 안으로 이동, 구조 변경 확인)
  - 내 자산 6개: 04-my-assets-thumb-1~6
  - 픽 4개: 05-huddling-pick-card-1~4 (픽 5·6 은 PickRow-3 삭제로 함께 제거됨 — 의도된 변경)
- 컨테이너 페인트 제거 확인: Header/Content/RecentMaterialsSection 등 다수 컨테이너에서 fills 키가 사라짐 (레이아웃 컨테이너 페인트 제거 반영)
- 재추출 불필요. 03 Screens 스냅샷 최종 PASS.

## STAGE=fix · Round 3

stage-doc: docs/figma-builder/stage-fix.md

완료: 2026-09-20
입력: design/04-screens/fix-list.md 하단 "Fix List · Round 3" #10~#13 (전부 02 Components 마스터 · 대상 figma).

- **#10** `SkillCard` 마스터 루트(9:35, VERTICAL) itemSpacing 6 → `space-tap-gap-min`(=space-2, 8) 바인딩. 인스턴스 5건(45:40 · 46:112 · 46:124 · 46:136 · 51:182)에 자동 전파.
- **#11** `StatusBadge` 세트 `Variant=text`(10:31)·`Variant=overlay`(10:33): paddingTop/Bottom → `space-inline`(=space-1, 4), paddingLeft/Right → `space-tap-gap-min`(=space-2, 8) 바인딩(기존 좌우는 `space-list-gap`(12)에 잘못 바인딩돼 있었음). 결과 padding [4,8,4,8] 확인.
- **#12** 텍스트 4개(SkillCard `무료` 9:34 · OrderBadge `1` 11:8 · StatusBadge `멤버공개` 10:6 · `12,000원 · 템플릿` 10:13): `setTextStyleIdAsync(Text/caption)` 명시 재적용 + textAutoResize=HEIGHT. 적용 후 `node.textStyleId` 직접 읽어 4개 전부 `S:362b140d78dbffc30b916fe6a9e6f9bb9bc05be0,`(Text/caption, `figma.getStyleByIdAsync` 로 resolve 확인, "NOT FOUND" 아님)로 비어있지 않음 확인.
- **#13** `BottomTabBar`(12:8)·`BottomActionBar`(11:14) 마스터: 별도 "1px 경계선 자식 프레임"은 존재하지 않았고, 실제 원인은 두 마스터의 `strokesIncludedInLayout=true` — 이 설정이 상단 stroke(1px, INSIDE)를 오토레이아웃 콘텐츠 박스에 포함시켜 자식을 1px 밀어냄. `strokesIncludedInLayout=false` 로 변경해 해결.
  결과: TabRow(12:9) y 0→ 유지 안함(기존 1)→**0**, Content(76:322) y 0.5→**0**. 총 높이 83/86 유지(변경 없음), 화면 인스턴스 y 위치(844-83/844-86)도 그대로.

### lint 최종

- `02 Components`: findings 0건 (nodes_scanned 273, passed:true)
- `03 Screens`: findings 0건 (nodes_scanned 399, passed:true)

### 스크린샷

design/04-screens/screenshots/{01-home,02-skill-library,03-mission-detail,04-my-assets,05-huddling-pick}.png 전부 get_screenshot 로 재추출·덮어쓰기 완료.

figma_read_calls: use_figma 조회 ×2 · 수정 ×3(itemSpacing/padding · strokesIncludedInLayout · textStyleId) · lint ×2 · get_screenshot ×5
snapshot: requested (page=02 Components · profile=full · stage=fix)
snapshot: requested (page=03 Screens · profile=full · stage=fix)
next: 두 페이지 PASS 후 design-auditor
