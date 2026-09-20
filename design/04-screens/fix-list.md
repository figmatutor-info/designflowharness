# Fix List · Round 1 (재실행 · 2026-09-20)

- 작성: 코디네이터. 근거: snapshot-runner `check-snapshot --stage screens` FAIL(04 My Assets isPrimary 0개) + 코디네이터가 현재 스냅샷으로 사전 실행한 `npm run audit` (4/9 PASS · spacing 128 · safe-area 9 · 타이포 2 · 재사용률 60%) + STAGE=screens build-log 가 남긴 02 Components 마스터 결함 3건.
- `대상` 열 전부 `figma`. **마스터(02 Components)를 고치면 화면 인스턴스에 전파된다 — 화면에서 override 로 땜질하지 않는다.**
- design-rules.md 는 v1.0 confirmed 그대로 (규칙 변경 없음).

## A. 02 Components 마스터 (Critical · 전파형)

| #   | 노드                                                                                                                                                                      | 문제                                                                                                                          | 수정 방법                                                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | StatusBadge 전 variant (`D-day` 9:14 · `category` 9:26 · `difficulty` 9:28 · `price` 9:33 · `price-category` 10:12 · `status` 10:5) · `OrderBadge` 11:7 · `Tag/tool` 9:31 | padding 상하 2px · 좌우 5px · itemSpacing 6px (4배수 아님 · 화면 100건+ 전파)                                                 | design-rules Badge/Pill 규칙대로 padding 상하 `space-1`(4) · 좌우 `space-2`(8) · itemSpacing `space-1`(4) — 전부 semantic 변수 바인딩 (별칭 이름은 Figma 변수에서 조회)                                                                       |
| A2  | SkillCard 마스터 안 `Tags/Row1` 9:25 · `Tags/Row2` 9:30                                                                                                                   | itemSpacing 6px                                                                                                               | `space-2`(8) 바인딩                                                                                                                                                                                                                           |
| A3  | BottomTabBar 마스터 `TabItem/*` 5개 (12:10 · 12:15 · 12:20 · 12:26 · 12:32)                                                                                               | itemSpacing 2px (아이콘–라벨)                                                                                                 | `space-1`(4) 바인딩                                                                                                                                                                                                                           |
| A4  | StatusBadge variant 텍스트 (`status` 10:6 · `price-category` 10:13)                                                                                                       | 텍스트 스타일 미적용 (화면 2건)                                                                                               | Text/caption(또는 규칙의 뱃지 role) 스타일 적용 · textAutoResize HEIGHT                                                                                                                                                                       |
| A5  | `Card` 마스터                                                                                                                                                             | §I 표의 `01-home-recent-material-1~3`(card · 4:3) 슬롯을 담을 `Img/` 레이어가 없어 화면에서 RECTANGLE 을 옆에 따로 둠         | Card 에 이미지 슬롯 variant(또는 상단 `Img/slot` 4:3 레이어 · 폭 FILL · 비율 유지) 추가. 홈의 3개 MaterialItem 을 이 variant 인스턴스로 교체하고 슬롯 레이어 이름을 `Img/01-home-recent-material-{1..3}` 로, 기존 이미지(imageHash)를 재주입  |
| A6  | `SearchBar` · `FilterChip`(selected) 마스터                                                                                                                               | 배경 fill 이 visible:false 로 저장돼 인스턴스가 투명 렌더링 → 화면마다 override 로 땜질됨                                     | 마스터 fill 을 visible:true 로 (semantic 바인딩 유지). 화면의 override 는 마스터 수정 후 reset                                                                                                                                                |
| A7  | `MultiSelectGrid` 마스터 (내부 중복 `Button` "예약하기")                                                                                                                  | 미션 상세 primary 2개가 되어 화면에서 인스턴스를 숨김 처리                                                                    | 마스터에서 중복 Button 삭제 (선택 그리드는 타일만). 화면의 숨김 처리 해제                                                                                                                                                                     |
| A8  | `BottomTabBar` · `BottomActionBar` 마스터                                                                                                                                 | 화면에서 TabRow / Button 하단이 y+h=811 로 safe-area(810) 1px 침범 · BottomActionBar padding.bottom 34px 가 4배수 검사에 걸림 | 두 마스터의 하단 safe-area 를 padding 이 아닌 **`HomeIndicator` 이름의 자식 프레임(높이 safe-area-bottom=34 · 페인트 없음)** 으로 바꾼다 (하네스 기본 면제 이름). 총 높이 49+34=83 / 56+34=90 정확히. TabRow·Button 은 그 위에 놓여 y+h ≤ 810 |

## B. 03 Screens 화면 (Major)

| #   | 화면                           | 노드                                                                                                                   | 문제                                                                     | 수정 방법                                                                                                                                                                                                  |
| --- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | 04 My Assets                   | 인라인 `Button` 54:188 (Variant=secondary · "새 자산 등록")                                                            | isPrimary 0개 → check-snapshot FAIL                                      | 레이어 이름을 `Button · primary` 로 (스타일은 규칙대로 secondary/outline 유지 · 이름 규칙으로 primary 판정)                                                                                                |
| B2  | 01·02·04·05                    | 헤더 타이틀 텍스트 (45:7 · 50:94 · 54:181 · 58:250) y=12                                                               | 상단 safe-area 44 침범                                                   | 각 DeviceFrame 최상단에 `StatusBar` 이름의 프레임(높이 safe-area-top=44 · 페인트 없음 · 하네스 기본 면제)을 넣어 콘텐츠를 44 아래로 밀어낸다. 미션 상세는 App Bar 가 safe-area-top 을 포함하므로 해당 없음 |
| B3  | 전 화면                        | 레이아웃 컨테이너 35개 (Header · Content · *Section · *Row · *Grid · MaterialItem-1~3 등 · audit 결과의 handmade 목록) | 페인트(fill/stroke)가 있어 "손으로 만든 프레임" 으로 집계 → 재사용률 60% | 순수 레이아웃 컨테이너의 fill/stroke 를 제거한다 (배경은 DeviceFrame 이 담당). MaterialItem-1~3 은 A5 로 Card 인스턴스가 된다. 남는 컨테이너는 오토레이아웃 + 페인트 없음이어야 모수에서 빠진다            |
| B4  | 01·02 (SkillCard 인스턴스 5개) | `SkillCard` itemSpacing 6px (화면 레벨 override)                                                                       | A2 와 별개로 인스턴스에 override 가 남아 있음                            | override reset → 마스터 값(A2) 따르게                                                                                                                                                                      |

## 처리 규칙 (figma-builder에게)

1. A 를 먼저 (마스터) → B (화면). 마스터 수정이 인스턴스에 전파된 뒤 화면의 override 를 reset 한다.
2. 02 Components 편집이 도구 권한으로 차단되면 우회하지 말고 **즉시 멈추고 무엇이 차단됐는지 보고**한다 (STAGE=screens 때 "Modify Shared Resources" 차단이 있었다).
3. 수정 후 `scripts/figma-lint.js` 를 `02 Components` · `03 Screens` 에 돌려 0건 확인.
4. build-log 에 `## STAGE=fix · Round 1` 을 Bash `cat >>` 로 append: 항목별 node id · 바인딩 변수 · lint · `snapshot: requested (page=02 Components · profile=full · stage=fix)` · `snapshot: requested (page=03 Screens · profile=full · stage=fix)` · `next: 두 페이지 PASS 후 design-auditor`.
5. 스크린샷 5장 갱신.

---

# Fix List · Round 2 (2026-09-20)

- 근거: Round 1 의 B2(StatusBar 44 삽입) 부작용으로 05 Huddling Pick 의 PickGrid 가 41px 넘침 (lint content-overflow 1건). 카드 높이는 4:3 이미지 규격이라 축소 불가.
- 사용자 결정: 그리드를 2×2(4장)로 축소. design-rules.md **v1.1** (confirmed_at 2026-09-20) 에서 §I 슬롯 `05-huddling-pick-card-5` · `-6` 제거, screens.md 도 4장으로 갱신됨. `대상` figma.

## Major

| #   | 화면             | 노드                                                 | 문제                          | 수정 방법                                                                                                                                                                  |
| --- | ---------------- | ---------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9   | 05 Huddling Pick | `PickGrid` 안 `PickRow-3` (PickCard 5·6 · `Img/05-huddling-pick-card-5`, `-6`) | 그리드 3행이 뷰포트 41px 초과 | PickRow-3 삭제 (PickCard 5·6 인스턴스 포함). PickRow-1·2 는 그대로. 결과: Img/ 슬롯 4개 · 전부 IMAGE fill 유지. 삭제 후 Content 넘침 0 확인. 그리드가 짧아져 남는 공간은 그대로 둔다 (콘텐츠 추가 금지) |

## 처리 규칙

1. scripts/figma-lint.js 를 "03 Screens" 에 돌려 0건 (특히 content-overflow).
2. 05-huddling-pick.png 스크린샷 갱신.
3. build-log 에 `## STAGE=fix · Round 2` 를 Bash `cat >>` 로 append: 삭제 node id · lint · `snapshot: requested (page=03 Screens · profile=full · stage=fix)` · `next: 03 PASS 후 design-auditor`. 02 Components 는 이번 라운드 변경 없음 (fix r1 스냅샷 PASS 유지).

---

# Fix List · Round 3 (2026-09-20)

- 근거: fix r2 후 세 페이지 스냅샷 PASS · 코디네이터 사전 `npm run audit` 6/9. 남은 3항목은 전부 02 Components 마스터 잔여분 (`대상` figma).

## A. 02 Components 마스터

| #   | 노드                                                                                 | 문제                                                                                        | 수정 방법                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10  | `SkillCard` 마스터 루트 (Tags/Row 가 아닌 카드 자체의 VERTICAL itemSpacing)          | itemSpacing 6px → 화면 인스턴스 5건 (45:40 · 46:112 · 46:124 · 46:136 · 51:182)             | 루트 itemSpacing 을 `space-2`(8) semantic 별칭으로 바인딩 (Round 1 A2 는 Tags/Row 만 고쳤음)                                                                                                                    |
| 11  | `StatusBadge` 컴포넌트 세트 variant `Variant=text` 10:31 · `Variant=overlay` 10:33   | padding 상하 2px · 좌우 12px → 미션 상세 51:161 등                                          | padding 상하 `space-1`(4) · 좌우 `space-2`(8) 바인딩 (Round 1 A1 은 StatusBadge/* 개별 프레임만 고쳤고 이 세트는 빠짐)                                                                                          |
| 12  | 텍스트 4개: SkillCard 안 `무료` 9:34 · OrderBadge 숫자 `1` 11:8 · StatusBadge text 10:6 · overlay 10:13 | 텍스트 스타일 미적용 (스냅샷 textStyle 없음 — Round 1 A4 "이미 적용됨" 판단은 오판)         | 4개 텍스트에 `Text/caption`(뱃지 role) 스타일 적용 · textAutoResize HEIGHT. 적용 후 `node.textStyleId` 가 비어 있지 않은지 use_figma 로 직접 확인                                                             |
| 13  | `BottomTabBar` 12:? (390×83 · TabRow 12:9 가 y=1) · `BottomActionBar` (390×86 · Content 76:322 가 y=1) | 상단 경계선을 1px 자식으로 넣어 TabRow/Button 이 1px 아래로 밀려 화면에서 y+h=811 (safe-area 810 침범 5건) | 경계선 자식 프레임을 삭제하고 마스터 프레임 자체의 **상단 stroke 1px**(`strokeTopWeight=1` · color-border 바인딩)로 바꾼다 → TabRow y=0 · 총 높이 83 / 86 유지 · 화면에서 y+h=810. 화면 인스턴스 y 위치는 844-83 / 844-86 그대로 |

## 처리 규칙

1. 수정 후 lint `02 Components` · `03 Screens` 0건.
2. build-log `## STAGE=fix · Round 3` (Bash `cat >>`) · `snapshot: requested (page=02 Components · profile=full · stage=fix)` · `snapshot: requested (page=03 Screens · profile=full · stage=fix)` · `next: 두 페이지 PASS 후 design-auditor`.
3. 스크린샷 5장 갱신.
